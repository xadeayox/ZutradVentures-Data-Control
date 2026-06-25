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
// Multer is a middleware that handles file uploads.
// It reads the image from the request, saves it to the /uploads folder,
// and gives us the file path to store in the database.

const uploadDir = path.join(__dirname, '../uploads');

// Create the uploads folder if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);    // save files to backend/uploads/
    },
    filename: (req, file, cb) => {
        // Give each file a unique name using the current timestamp
        // e.g. "1719654321000-report.jpg"
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

// Only accept image files
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed.'), false);
    }
};

const upload = multer({ storage, fileFilter });


// ─── GET /api/reports ─────────────────────────────────────────────────────────
// Fetch all reports with the client name and user who submitted it.
// Used by the ReportsPage and the admin preview section.

router.get('/', protect, async (req, res) => {
    try {
        const reports = await Report.findAll({
            include: [
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'companyName']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'surname']   // never include password
                }
            ],
            order: [['created_at', 'DESC']]     // newest first
        });

        res.status(200).json({ reports });

    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── GET /api/reports/latest ──────────────────────────────────────────────────
// Fetch the 5 most recent reports — used by the admin page preview section.

router.get('/latest', protect, async (req, res) => {
    try {
        const reports = await Report.findAll({
            include: [
                { model: Client, as: 'client', attributes: ['companyName'] },
                { model: User, as: 'user', attributes: ['firstName', 'surname'] }
            ],
            order: [['created_at', 'DESC']],
            limit: 5
        });

        res.status(200).json({ reports });

    } catch (error) {
        console.error('Get latest reports error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/reports ────────────────────────────────────────────────────────
// Submit a new report with optional image uploads.
// Frontend sends: form-data with reportDetails, clientId, lineNumber, and image files.
// We use upload.array('images', 10) to accept up to 10 images at once.

router.post('/', protect, upload.array('images', 10), async (req, res) => {
    try {
        const { reportDetails, clientId, lineNumber } = req.body;

        if (!reportDetails || !clientId || !lineNumber) {
            return res.status(400).json({ message: 'Report details, client and line number are required.' });
        }

        // Make sure the client exists
        const client = await Client.findByPk(clientId);
        if (!client) {
            return res.status(404).json({ message: 'Client not found.' });
        }

        // Build the array of image paths to store in the database
        // req.files contains the uploaded files from multer
        const imagePaths = req.files
            ? req.files.map(file => `uploads/${file.filename}`)
            : [];

        const report = await Report.create({
            reportDetails,
            clientId,
            lineNumber: Number(lineNumber),
            imagePaths,
            userId: req.user.id,    // from the JWT token — who is logged in
            status: 'pending'
        });

        // Fetch the created report with relations for the response
        const fullReport = await Report.findByPk(report.id, {
            include: [
                { model: Client, as: 'client', attributes: ['companyName'] },
                { model: User, as: 'user', attributes: ['firstName', 'surname'] }
            ]
        });

        res.status(201).json({
            message: 'Report submitted successfully.',
            report: fullReport
        });

    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── PATCH /api/reports/:id/status ───────────────────────────────────────────
// Update a report's status to 'approved' or 'rejected'.
// Only administrators can do this.

router.patch('/:id/status', protect, restrictTo('administrator'), async (req, res) => {
    try {
        const { status } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be approved or rejected.' });
        }

        const report = await Report.findByPk(req.params.id);
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


// ─── Static file serving ──────────────────────────────────────────────────────
// This makes uploaded images accessible via a URL.
// e.g. http://localhost:5000/uploads/1719654321000-report.jpg
// The frontend uses this URL to display the images in the report cards.
router.use('/uploads', express.static(uploadDir));

module.exports = router;
