const express = require('express');
const Supply = require('../models/Supply');
const Client = require('../models/Client');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();


// ─── GET /api/supply ──────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
    try {
        const supplies = await Supply.find()
            .sort({ createdAt: -1 })
            .populate({ path: 'clientId', select: '_id companyName' })
            .populate({ path: 'userId', select: '_id firstName surname' })
            .lean();

        const shaped = supplies.map(s => ({ ...s, client: s.clientId, user: s.userId }));

        res.status(200).json({ supplies: shaped });

    } catch (error) {
        console.error('Get supply error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── GET /api/supply/latest ───────────────────────────────────────────────────
router.get('/latest', protect, async (req, res) => {
    try {
        const supplies = await Supply.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate({ path: 'clientId', select: 'companyName' })
            .populate({ path: 'userId', select: 'firstName surname' })
            .lean();

        const shaped = supplies.map(s => ({ ...s, client: s.clientId, user: s.userId }));

        res.status(200).json({ supplies: shaped });

    } catch (error) {
        console.error('Get latest supply error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/supply ─────────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
    try {
        const { goodsSupplied, partNumber, clientId, quantity, supplyDate } = req.body;

        if (!goodsSupplied || !partNumber || !clientId || !quantity || !supplyDate) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ message: 'Client not found.' });
        }

        const supply = await Supply.create({
            goodsSupplied,
            partNumber,
            clientId,
            quantity: Number(quantity),
            supplyDate,
            userId: req.user.id
        });

        const fullSupply = await Supply.findById(supply._id)
            .populate({ path: 'clientId', select: '_id companyName' })
            .populate({ path: 'userId', select: '_id firstName surname' })
            .lean();

        res.status(201).json({
            message: 'Supply logged successfully.',
            supply: { ...fullSupply, client: fullSupply.clientId, user: fullSupply.userId }
        });

    } catch (error) {
        console.error('Create supply error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── DELETE /api/supply/:id ───────────────────────────────────────────────────
router.delete('/:id', protect, restrictTo('administrator'), async (req, res) => {
    try {
        const item = await Supply.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Supply not found.' });
        }

        res.status(200).json({ message: 'Supply deleted.' });

    } catch (error) {
        console.error('Delete supply error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


module.exports = router;
