const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// ─── Uploads directory ────────────────────────────────────────────────────────
// Files land in /uploads at the root of the backend folder.
// This path resolves to: <project-root>/uploads/
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Create the uploads folder if it doesn't already exist
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ─── Multer storage config ────────────────────────────────────────────────────
// Multer handles multipart/form-data file uploads.
// We use diskStorage so files are saved directly to the uploads folder.

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (_req, file, cb) => {
        // Prefix with timestamp to prevent filename collisions
        // e.g. "1718200000000-invoice_march.pdf"
        const unique = `${Date.now()}-${file.originalname}`;
        cb(null, unique);
    }
});

// ─── File type whitelist ──────────────────────────────────────────────────────
// Only allow document types that make sense for invoices.
// Reject anything else before it touches the disk.

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',                                                        // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // .docx
    'application/vnd.ms-excel',                                                  // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',        // .xlsx
    'image/jpeg',
    'image/png'
];

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`));
        }
    }
});


// ─── GET /api/invoices/clients ────────────────────────────────────────────────
// Returns the list of registered clients for the factory select dropdown.
// Keeps the frontend decoupled — it doesn't need to hit /api/clients directly.

router.get('/clients', protect, async (req, res) => {
    try {
        const clients = await Client.findAll({
            attributes: ['id', 'companyName'],
            order: [['company_name', 'ASC']]
        });
        res.status(200).json({ clients });
    } catch (error) {
        console.error('Get invoice clients error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── GET /api/invoices ────────────────────────────────────────────────────────
// Returns all invoices, newest first.
// Supports optional ?search= query param to filter by factory name or file name.
// All logged-in users can view invoices.

router.get('/', protect, async (req, res) => {
    try {
        const { search } = req.query;

        const where = search
            ? {
                [Op.or]: [
                    { clientName: { [Op.like]: `%${search}%` } },
                    { fileName: { [Op.like]: `%${search}%` } }
                ]
              }
            : {};

        const invoices = await Invoice.findAll({
            where,
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({ invoices });

    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/invoices ───────────────────────────────────────────────────────
// Uploads one or more invoice files for a given client factory.
// Frontend sends multipart/form-data with:
//   - clientFactory (string)
//   - invoice       (one or more files, field name must match the input name)
//
// Each file gets its own database row so we can track and serve them individually.
// Accessible by administrators and receptionists.

router.post(
    '/',
    protect,
    restrictTo('administrator', 'receptionist'),
    upload.array('invoice', 10), // accept up to 10 files per request, field name: "invoice"
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

            // Look up the client to snapshot their name at upload time.
            // If someone deletes the client later the invoice still shows the name.
            const client = await Client.findByPk(clientId);
            if (!client) {
                (req.files || []).forEach(f => fs.unlinkSync(f.path));
                return res.status(404).json({ message: 'Selected client not found.' });
            }

            // The JWT decoded by authMiddleware gives us firstName + surname
            const uploaderName = `${req.user.firstName} ${req.user.surname}`;

            const records = await Promise.all(
                req.files.map(file =>
                    Invoice.create({
                        clientId: client.id,
                        clientName: client.companyName,   // snapshot — survives client deletion
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
            // If DB insert fails, clean up orphaned files
            (req.files || []).forEach(f => {
                if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
            });
            console.error('Upload invoice error:', error);
            res.status(500).json({ message: 'Server error. Please try again.' });
        }
    }
);


// ─── GET /api/invoices/:id/download ──────────────────────────────────────────
// Streams the file back to the browser as a download.
// The Content-Disposition header tells the browser to save it with the
// original file name rather than displaying it inline.
// All logged-in users can download.

router.get('/:id/download', protect, async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found.' });
        }

        const filePath = path.join(UPLOADS_DIR, invoice.storedFileName);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found on server.' });
        }

        // Set the download filename to the original name the user uploaded
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${invoice.fileName}"`
        );

        // Let the browser know the file type for correct handling
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
// Deletes an invoice record AND its file from disk.
// Administrators can delete any invoice.
// Receptionists can only delete invoices they uploaded themselves.

router.delete('/:id', protect, restrictTo('administrator', 'receptionist'), async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found.' });
        }

        // Receptionists may only delete their own uploads
        if (
            req.user.role === 'receptionist' &&
            invoice.uploadedByUserId !== req.user.id
        ) {
            return res.status(403).json({
                message: 'You can only delete invoices you uploaded.'
            });
        }

        // Remove the physical file first
        const filePath = path.join(UPLOADS_DIR, invoice.storedFileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await invoice.destroy();

        res.status(200).json({ message: 'Invoice deleted successfully.' });

    } catch (error) {
        console.error('Delete invoice error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── Multer error handler ─────────────────────────────────────────────────────
// Multer throws its own error objects — we catch them here so the client
// gets a clean JSON message instead of an HTML crash page.

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
