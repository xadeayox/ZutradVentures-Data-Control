const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// ─── Uploads directory ────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ─── Multer storage config ────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${file.originalname}`;
        cb(null, unique);
    }
});

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
];

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`));
        }
    }
});


// ─── GET /api/invoices/clients ────────────────────────────────────────────────
router.get('/clients', protect, async (req, res) => {
    try {
        const clients = await Client.find({}, { companyName: 1 }).sort({ companyName: 1 }).lean();
        res.status(200).json({ clients });
    } catch (error) {
        console.error('Get invoice clients error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── GET /api/invoices ────────────────────────────────────────────────────────
// Supports optional ?search= query param to filter by client name or file name.

router.get('/', protect, async (req, res) => {
    try {
        const { search } = req.query;

        const query = search
            ? {
                $or: [
                    { clientName: { $regex: search, $options: 'i' } },
                    { fileName: { $regex: search, $options: 'i' } }
                ]
              }
            : {};

        const invoices = await Invoice.find(query).sort({ createdAt: -1 }).lean();

        res.status(200).json({ invoices });

    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/invoices ───────────────────────────────────────────────────────
// Uploads one or more invoice files for a given client.

router.post(
    '/',
    protect,
    restrictTo('administrator', 'receptionist'),
    upload.array('invoice', 10),
    async (req, res) => {
        try {
            const { clientId } = req.body;

            if (!clientId) {
                (req.files || []).forEach(f => fs.unlinkSync(f.path));
                return res.status(400).json({ message: 'Client is required.' });
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ message: 'At least one file is required.' });
            }

            const client = await Client.findById(clientId);
            if (!client) {
                (req.files || []).forEach(f => fs.unlinkSync(f.path));
                return res.status(404).json({ message: 'Selected client not found.' });
            }

            const uploaderName = `${req.user.firstName} ${req.user.surname}`;

            const records = await Promise.all(
                req.files.map(file =>
                    Invoice.create({
                        clientId: client._id,
                        clientName: client.companyName,   // snapshot
                        uploadedBy: uploaderName,
                        uploadedByUserId: req.user.id,
                        fileName: file.originalname,
                        storedFileName: file.filename,
                        mimeType: file.mimetype,
                        fileSize: file.size
                    })
                )
            );

            res.status(201).json({
                message: `${records.length} invoice(s) uploaded successfully.`,
                invoices: records
            });

        } catch (error) {
            (req.files || []).forEach(f => {
                if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
            });
            console.error('Upload invoice error:', error);
            res.status(500).json({ message: 'Server error. Please try again.' });
        }
    }
);


// ─── GET /api/invoices/:id/download ──────────────────────────────────────────
router.get('/:id/download', protect, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found.' });
        }

        const filePath = path.join(UPLOADS_DIR, invoice.storedFileName);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found on server.' });
        }

        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${invoice.fileName}"`
        );

        if (invoice.mimeType) {
            res.setHeader('Content-Type', invoice.mimeType);
        }

        res.sendFile(filePath);

    } catch (error) {
        console.error('Download invoice error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── DELETE /api/invoices/:id ─────────────────────────────────────────────────
// Admins can delete any invoice. Receptionists can only delete their own.

router.delete('/:id', protect, restrictTo('administrator'), async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found.' });
        }

        if (
            req.user.role === 'receptionist' &&
            String(invoice.uploadedByUserId) !== String(req.user.id)
        ) {
            return res.status(403).json({
                message: 'You can only delete invoices you uploaded.'
            });
        }

        const filePath = path.join(UPLOADS_DIR, invoice.storedFileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await Invoice.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Invoice deleted successfully.' });

    } catch (error) {
        console.error('Delete invoice error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── Multer error handler ─────────────────────────────────────────────────────
router.use((err, _req, res, _next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'File too large. Maximum size is 10 MB.' });
    }
    if (err.message?.startsWith('Unsupported file type')) {
        return res.status(415).json({ message: err.message });
    }
    console.error('Invoice route error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
});


module.exports = router;
