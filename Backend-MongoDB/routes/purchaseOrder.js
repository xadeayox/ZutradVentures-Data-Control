const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const PurchaseOrder = require('../models/PurchaseOrder');
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

const poAccess = restrictTo('administrator', 'receptionist');


// ─── GET /api/purchaseorders ──────────────────────────────────────────────────
router.get('/', protect, poAccess, async (req, res) => {
    try {
        const purchaseOrders = await PurchaseOrder.find()
            .sort({ createdAt: -1 })
            .populate({ path: 'clientId', select: '_id companyName' })
            .populate({ path: 'uploadedById', select: '_id firstName surname' })
            .lean();

        const shaped = purchaseOrders.map(po => ({
            id: po._id,
            fileName: po.fileName,
            storedName: po.storedName,
            mimeType: po.mimeType,
            clientFactory: po.clientId ? po.clientId.companyName : 'Unknown Client',
            uploadedBy: po.uploadedById ? `${po.uploadedById.firstName} ${po.uploadedById.surname}` : 'Unknown User',
            createdAt: po.createdAt
        }));

        res.status(200).json({ purchaseOrders: shaped });
    } catch (error) {
        console.error('Get Purchase Orders error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/purchaseorders ─────────────────────────────────────────────────
router.post('/', protect, poAccess, upload.array('files', 10), async (req, res) => {
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
                PurchaseOrder.create({
                    clientId: client._id,
                    uploadedById: req.user.id,
                    fileName: file.originalname,
                    storedName: file.filename,
                    mimeType: file.mimetype
                })
            )
        );

        res.status(201).json({
            message: `${created.length} purchase order file(s) uploaded successfully.`,
            purchaseOrders: created.map(po => ({
                id: po._id,
                fileName: po.fileName,
                storedName: po.storedName,
                clientFactory: client.companyName,
                uploadedBy: `${req.user.firstName} ${req.user.surname}`
            }))
        });
    } catch (error) {
        if (req.files?.length) req.files.forEach(f => fs.unlink(f.path, () => {}));
        console.error('Upload Purchase Order error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── GET /api/purchaseorders/download/:storedName ─────────────────────────────
router.get('/download/:storedName', protect, poAccess, async (req, res) => {
    try {
        const { storedName } = req.params;
        const po = await PurchaseOrder.findOne({ storedName });

        if (!po) return res.status(404).json({ message: 'File not found.' });

        const filePath = path.join(UPLOADS_DIR, storedName);
        if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File missing from server.' });

        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(po.fileName)}"`);
        res.setHeader('Content-Type', po.mimeType);

        fs.createReadStream(filePath).pipe(res);
    } catch (error) {
        console.error('Download Purchase Order error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── DELETE /api/purchaseorders/:id ───────────────────────────────────────────
router.delete('/:id', protect, restrictTo('administrator'), async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) return res.status(404).json({ message: 'Purchase Order not found.' });

        const filePath = path.join(UPLOADS_DIR, po.storedName);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await PurchaseOrder.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Purchase Order deleted successfully.' });
    } catch (error) {
        console.error('Delete Purchase Order error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


module.exports = router;
