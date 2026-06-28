const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Grn = require('../models/Grn');
const Client = require('../models/Client');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// ─── Multer Configuration ─────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (_req, file, cb) => {
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
    limits: { fileSize: 10 * 1024 * 1024 }
});

const grnAccess = restrictTo('administrator', 'receptionist');


// ─── GET /api/grns ────────────────────────────────────────────────────────────
router.get('/', protect, grnAccess, async (req, res) => {
    try {
        const grns = await Grn.find()
            .sort({ createdAt: -1 })
            .populate({ path: 'clientId', select: '_id companyName' })
            .populate({ path: 'uploadedById', select: '_id firstName surname' })
            .lean();

        const shaped = grns.map(grn => ({
            id: grn._id,
            fileName: grn.fileName,
            storedName: grn.storedName,
            mimeType: grn.mimeType,
            clientFactory: grn.clientId ? grn.clientId.companyName : 'Unknown Client',
            uploadedBy: grn.uploadedById
                ? `${grn.uploadedById.firstName} ${grn.uploadedById.surname}`
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
router.post('/', protect, grnAccess, upload.array('files', 10), async (req, res) => {
    try {
        const { clientId } = req.body;

        if (!clientId) {
            if (req.files?.length) {
                req.files.forEach(f => fs.unlink(f.path, () => {}));
            }
            return res.status(400).json({ message: 'Client is required.' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'At least one file is required.' });
        }

        const client = await Client.findById(clientId);
        if (!client) {
            req.files.forEach(f => fs.unlink(f.path, () => {}));
            return res.status(404).json({ message: 'Client not found.' });
        }

        const created = await Promise.all(
            req.files.map(file =>
                Grn.create({
                    clientId: client._id,
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
                id: g._id,
                fileName: g.fileName,
                storedName: g.storedName,
                clientFactory: client.companyName,
                uploadedBy: `${req.user.firstName} ${req.user.surname}`
            }))
        });

    } catch (error) {
        if (req.files?.length) {
            req.files.forEach(f => fs.unlink(f.path, () => {}));
        }
        console.error('Upload GRN error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── GET /api/grns/download/:storedName ───────────────────────────────────────
router.get('/download/:storedName', protect, grnAccess, async (req, res) => {
    try {
        const { storedName } = req.params;

        const grn = await Grn.findOne({ storedName });

        if (!grn) {
            return res.status(404).json({ message: 'File not found.' });
        }

        const filePath = path.join(UPLOADS_DIR, storedName);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File missing from server.' });
        }

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
router.delete('/:id', protect, restrictTo('administrator'), async (req, res) => {
    try {
        const grn = await Grn.findById(req.params.id);

        if (!grn) {
            return res.status(404).json({ message: 'GRN not found.' });
        }

        const filePath = path.join(UPLOADS_DIR, grn.storedName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await Grn.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'GRN deleted successfully.' });

    } catch (error) {
        console.error('Delete GRN error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


module.exports = router;
