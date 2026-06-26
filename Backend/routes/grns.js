const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Grn = require('../models/Grn');
const Client = require('../models/Client');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// ─── Multer Configuration ─────────────────────────────────────────────────────
// Files are saved to the /uploads folder at the project root.
// Each file is renamed to a timestamp + original name to prevent collisions.
// Accepted types: PDF, Word (.doc/.docx), Excel (.xls/.xlsx)
// Max file size: 10 MB per file. Max 10 files per request.

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure the uploads directory exists on startup
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (_req, file, cb) => {
        // Prefix with timestamp to guarantee uniqueness
        const unique = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        cb(null, unique);
    }
});

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

function fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, Word, and Excel files are allowed.'), false);
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});


// ─── All GRN routes are protected ────────────────────────────────────────────
// Only receptionists and administrators can access GRNs.
// Engineers cannot see the invoice/GRN section (enforced on frontend via
// usePermissions and on backend via restrictTo).

const grnAccess = restrictTo('administrator', 'receptionist');


// ─── GET /api/grns ────────────────────────────────────────────────────────────
// Returns all GRNs, newest first.
// Each record includes the client name (or null) and the uploader's name.

router.get('/', protect, grnAccess, async (req, res) => {
    try {
        const grns = await Grn.findAll({
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'companyName'],
                    // required: false keeps GRNs whose client was deleted
                    required: false
                },
                {
                    model: User,
                    as: 'uploadedBy',
                    attributes: ['id', 'firstName', 'surname'],
                    required: false
                }
            ]
        });

        // Shape the response so the frontend gets a clean, flat structure
        const shaped = grns.map(grn => ({
            id: grn.id,
            fileName: grn.fileName,
            storedName: grn.storedName,
            mimeType: grn.mimeType,
            clientFactory: grn.client ? grn.client.companyName : 'Unknown Client',
            uploadedBy: grn.uploadedBy
                ? `${grn.uploadedBy.firstName} ${grn.uploadedBy.surname}`
                : 'Unknown User',
            createdAt: grn.createdAt
        }));

        res.status(200).json({ grns: shaped });

    } catch (error) {
        console.error('Get GRNs error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/grns ───────────────────────────────────────────────────────────
// Uploads one or more GRN files linked to a client.
// Body (multipart/form-data): clientId, files[] (1–10 files)
// The logged-in user is automatically recorded as the uploader.

router.post('/', protect, grnAccess, upload.array('files', 10), async (req, res) => {
    try {
        const { clientId } = req.body;

        if (!clientId) {
            // Clean up any files already written to disk before rejecting
            if (req.files?.length) {
                req.files.forEach(f => fs.unlink(f.path, () => {}));
            }
            return res.status(400).json({ message: 'Client is required.' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'At least one file is required.' });
        }

        // Verify the client exists
        const client = await Client.findByPk(clientId);
        if (!client) {
            req.files.forEach(f => fs.unlink(f.path, () => {}));
            return res.status(404).json({ message: 'Client not found.' });
        }

        // Create one GRN record per file
        const created = await Promise.all(
            req.files.map(file =>
                Grn.create({
                    clientId: Number(clientId),
                    uploadedById: req.user.id,
                    fileName: file.originalname,
                    storedName: file.filename,
                    mimeType: file.mimetype
                })
            )
        );

        res.status(201).json({
            message: `${created.length} GRN file(s) uploaded successfully.`,
            grns: created.map(g => ({
                id: g.id,
                fileName: g.fileName,
                storedName: g.storedName,
                clientFactory: client.companyName,
                uploadedBy: `${req.user.firstName} ${req.user.surname}`
            }))
        });

    } catch (error) {
        // If DB insert fails, remove any files already saved to disk
        if (req.files?.length) {
            req.files.forEach(f => fs.unlink(f.path, () => {}));
        }
        console.error('Upload GRN error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── GET /api/grns/download/:storedName ───────────────────────────────────────
// Streams the file back to the browser as a download.
// Uses the original file name as the Content-Disposition filename so the user
// sees the friendly name, not the timestamp-prefixed stored name.

router.get('/download/:storedName', protect, grnAccess, async (req, res) => {
    try {
        const { storedName } = req.params;

        // Look up the GRN so we can get the original filename and verify it exists
        const grn = await Grn.findOne({ where: { storedName } });

        if (!grn) {
            return res.status(404).json({ message: 'File not found.' });
        }

        const filePath = path.join(UPLOADS_DIR, storedName);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File missing from server.' });
        }

        // Force a download dialog in the browser using the original file name
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${encodeURIComponent(grn.fileName)}"`
        );
        res.setHeader('Content-Type', grn.mimeType);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Download GRN error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── DELETE /api/grns/:id ─────────────────────────────────────────────────────
// Deletes a GRN record and removes the file from disk.
// Administrators only — receptionists cannot delete GRNs.

router.delete('/:id', protect, restrictTo('administrator'), async (req, res) => {
    try {
        const grn = await Grn.findByPk(req.params.id);

        if (!grn) {
            return res.status(404).json({ message: 'GRN not found.' });
        }

        // Remove the physical file first
        const filePath = path.join(UPLOADS_DIR, grn.storedName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await grn.destroy();

        res.status(200).json({ message: 'GRN deleted successfully.' });

    } catch (error) {
        console.error('Delete GRN error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


module.exports = router;
