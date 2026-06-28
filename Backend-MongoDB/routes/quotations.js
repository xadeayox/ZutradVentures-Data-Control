const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Quotation = require('../models/Quotation');
const Client = require('../models/Client');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// ─── Multer Configuration ─────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
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
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only PDF, Word, and Excel files are allowed.'), false);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

const quotationAccess = restrictTo('administrator', 'receptionist');


// ─── GET /api/quotations ──────────────────────────────────────────────────────
router.get('/', protect, quotationAccess, async (req, res) => {
    try {
        const quotations = await Quotation.find()
            .sort({ createdAt: -1 })
            .populate({ path: 'clientId', select: '_id companyName' })
            .populate({ path: 'uploadedById', select: '_id firstName surname' })
            .lean();

        const shaped = quotations.map(q => ({
            id: q._id,
            fileName: q.fileName,
            storedName: q.storedName,
            mimeType: q.mimeType,
            clientFactory: q.clientId ? q.clientId.companyName : 'Unknown Client',
            uploadedBy: q.uploadedById ? `${q.uploadedById.firstName} ${q.uploadedById.surname}` : 'Unknown User',
            createdAt: q.createdAt
        }));

        res.status(200).json({ quotations: shaped });
    } catch (error) {
        console.error('Get Quotations error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/quotations ─────────────────────────────────────────────────────
router.post('/', protect, quotationAccess, upload.array('files', 10), async (req, res) => {
    try {
        const { clientId } = req.body;

        if (!clientId) {
            if (req.files?.length) req.files.forEach(f => fs.unlink(f.path, () => {}));
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
                Quotation.create({
                    clientId: client._id,
                    uploadedById: req.user.id,
                    fileName: file.originalname,
                    storedName: file.filename,
                    mimeType: file.mimetype
                })
            )
        );

        res.status(201).json({
            message: `${created.length} quotation file(s) uploaded successfully.`,
            quotations: created.map(q => ({
                id: q._id,
                fileName: q.fileName,
                storedName: q.storedName,
                clientFactory: client.companyName,
                uploadedBy: `${req.user.firstName} ${req.user.surname}`
            }))
        });
    } catch (error) {
        if (req.files?.length) req.files.forEach(f => fs.unlink(f.path, () => {}));
        console.error('Upload Quotation error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── GET /api/quotations/download/:storedName ─────────────────────────────────
router.get('/download/:storedName', protect, quotationAccess, async (req, res) => {
    try {
        const { storedName } = req.params;
        const quotation = await Quotation.findOne({ storedName });

        if (!quotation) return res.status(404).json({ message: 'File not found.' });

        const filePath = path.join(UPLOADS_DIR, storedName);
        if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File missing from server.' });

        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(quotation.fileName)}"`);
        res.setHeader('Content-Type', quotation.mimeType);

        fs.createReadStream(filePath).pipe(res);
    } catch (error) {
        console.error('Download Quotation error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── DELETE /api/quotations/:id ──────────────────────────────────────────────
router.delete('/:id', protect, restrictTo('administrator'), async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });

        const filePath = path.join(UPLOADS_DIR, quotation.storedName);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await Quotation.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Quotation deleted successfully.' });
    } catch (error) {
        console.error('Delete Quotation error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


module.exports = router;
