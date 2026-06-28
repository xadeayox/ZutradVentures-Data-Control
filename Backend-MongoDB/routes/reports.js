const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const Client = require('../models/Client');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// ─── Multer Setup (Image Uploads) ─────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed.'), false);
    }
};

const upload = multer({ storage, fileFilter });


// ─── GET /api/reports ─────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
    try {
        const reports = await Report.find()
            .sort({ createdAt: -1 })
            .populate({ path: 'clientId', select: '_id companyName' })
            .populate({ path: 'userId', select: '_id firstName surname' })
            .lean();

        // Rename populated fields to match original response shape (client, user)
        const shaped = reports.map(r => ({
            ...r,
            client: r.clientId,
            user: r.userId
        }));

        res.status(200).json({ reports: shaped });

    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── GET /api/reports/latest ──────────────────────────────────────────────────
// Fetch the 5 most recent reports.

router.get('/latest', protect, async (req, res) => {
    try {
        const reports = await Report.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate({ path: 'clientId', select: 'companyName' })
            .populate({ path: 'userId', select: 'firstName surname' })
            .lean();

        const shaped = reports.map(r => ({
            ...r,
            client: r.clientId,
            user: r.userId
        }));

        res.status(200).json({ reports: shaped });

    } catch (error) {
        console.error('Get latest reports error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/reports ────────────────────────────────────────────────────────
// Submit a new report with optional image uploads.

router.post('/', protect, upload.array('images', 10), async (req, res) => {
    try {
        const { reportDetails, clientId, lineNumber } = req.body;

        if (!reportDetails || !clientId || !lineNumber) {
            return res.status(400).json({ message: 'Report details, client and line number are required.' });
        }

        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ message: 'Client not found.' });
        }

        const imagePaths = req.files
            ? req.files.map(file => `uploads/${file.filename}`)
            : [];

        const report = await Report.create({
            reportDetails,
            clientId,
            lineNumber: Number(lineNumber),
            imagePaths,
            userId: req.user.id,
            status: 'pending'
        });

        const fullReport = await Report.findById(report._id)
            .populate({ path: 'clientId', select: 'companyName' })
            .populate({ path: 'userId', select: 'firstName surname' })
            .lean();

        res.status(201).json({
            message: 'Report submitted successfully.',
            report: { ...fullReport, client: fullReport.clientId, user: fullReport.userId }
        });

    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── PATCH /api/reports/:id/status ───────────────────────────────────────────
// Update a report's status to 'approved' or 'rejected'. Admins only.

router.patch('/:id/status', protect, restrictTo('administrator'), async (req, res) => {
    try {
        const { status } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be approved or rejected.' });
        }

        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found.' });
        }

        report.status = status;
        await report.save();

        res.status(200).json({ message: `Report ${status} successfully.`, report });

    } catch (error) {
        console.error('Update report status error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── DELETE /api/reports/:id ──────────────────────────────────────────────────
router.delete('/:id', protect, restrictTo('administrator'), async (req, res) => {
    try {
        const item = await Report.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Report not found.' });
        }

        res.status(200).json({ message: 'Report deleted.' });

    } catch (error) {
        console.error('Delete report error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


router.use('/uploads', express.static(uploadDir));

module.exports = router;
