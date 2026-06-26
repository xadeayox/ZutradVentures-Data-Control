const express = require('express');
const Supply = require('../models/Supply');
const Client = require('../models/Client');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();


// ─── GET /api/supply ──────────────────────────────────────────────────────────
// Fetch all supply entries, newest first.
// Used by the SupplyPage to display all entries.

router.get('/', protect, async (req, res) => {
    try {
        const supplies = await Supply.findAll({
            include: [
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'companyName']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'surname']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({ supplies });

    } catch (error) {
        console.error('Get supply error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── GET /api/supply/latest ───────────────────────────────────────────────────
// Fetch the 5 most recent supply entries.
// Used by the admin page preview section.

router.get('/latest', protect, async (req, res) => {
    try {
        const supplies = await Supply.findAll({
            include: [
                { model: Client, as: 'client', attributes: ['companyName'] },
                { model: User, as: 'user', attributes: ['firstName', 'surname'] }
            ],
            order: [['created_at', 'DESC']],
            limit: 5
        });

        res.status(200).json({ supplies });

    } catch (error) {
        console.error('Get latest supply error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/supply ─────────────────────────────────────────────────────────
// Log a new supply entry.
// Frontend sends: { goodsSupplied, partNumber, clientId, quantity, supplyDate }

router.post('/', protect, async (req, res) => {
    try {
        const { goodsSupplied, partNumber, clientId, quantity, supplyDate } = req.body;

        if (!goodsSupplied || !partNumber || !clientId || !quantity || !supplyDate) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Make sure the client exists
        const client = await Client.findByPk(clientId);
        if (!client) {
            return res.status(404).json({ message: 'Client not found.' });
        }

        const supply = await Supply.create({
            goodsSupplied,
            partNumber,
            clientId,
            quantity: Number(quantity),
            supplyDate,
            userId: req.user.id     // from the JWT token
        });

        // Fetch the full entry with relations for the response
        const fullSupply = await Supply.findByPk(supply.id, {
            include: [
                { model: Client, as: 'client', attributes: ['id', 'companyName'] },
                { model: User, as: 'user', attributes: ['id', 'firstName', 'surname'] }
            ]
        });

        res.status(201).json({
            message: 'Supply logged successfully.',
            supply: fullSupply
        });

    } catch (error) {
        console.error('Create supply error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// ─── DELETE /api/supply/:id ──────────────────────────────────────────
router.delete('/:id', protect, restrictTo('administrator'), async (req, res) => {
    try {
        const item = await Supply.findByPk(parseInt(req.params.id, 10));
        if (!item) {
            return res.status(404).json({ message: 'Supply not found.' });
        }

        await item.destroy();

        res.status(200).json({ message: 'Supply deleted.' });

    } catch (error) {
        console.error('Delete supply error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


module.exports = router;
