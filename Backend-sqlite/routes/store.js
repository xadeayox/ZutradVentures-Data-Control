const express = require('express');
const StoreItem = require('../models/StoreItem');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();


// ─── GET /api/store ───────────────────────────────────────────────────────────
// Fetch all store items grouped by machine.
// Used by StorePage and StoreContent to display the 3 preview items per machine.

router.get('/', protect, async (req, res) => {
    try {
        const items = await StoreItem.findAll({
            order: [['updated_at', 'DESC']]
        });

        // Group items by machine so the frontend can easily separate them
        // Result: { 'Macsa ID': [...], 'Savema': [...], 'Sojet': [...], 'BestCode': [...] }
        const grouped = {
            'Macsa ID': items.filter(i => i.machine === 'Macsa ID'),
            'Savema': items.filter(i => i.machine === 'Savema'),
            'Sojet': items.filter(i => i.machine === 'Sojet'),
            'BestCode': items.filter(i => i.machine === 'BestCode')
        };

        res.status(200).json({ items, grouped });

    } catch (error) {
        console.error('Get store error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── GET /api/store/:machine ──────────────────────────────────────────────────
// Fetch all store items for a specific machine.
// Used by MacsaStorePage, SavemaStorePage, SojetStorePage, BestCodeStorePage.
// :machine in the URL e.g. /api/store/Macsa ID

router.get('/:machine', protect, async (req, res) => {
    try {
        const machine = decodeURIComponent(req.params.machine);

        const items = await StoreItem.findAll({
            where: { machine },
            order: [['updated_at', 'DESC']]
        });

        res.status(200).json({ items });

    } catch (error) {
        console.error('Get store by machine error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/store ──────────────────────────────────────────────────────────
// Add a new store item OR increase quantity if the part number already exists.
// Frontend sends: { serialNumber, partNumber, machinePart, machine, quantity }
// This preserves the original duplicate-checking logic from StoreInput.tsx.

router.post('/', protect, async (req, res) => {
    try {
        const { serialNumber, partNumber, machinePart, machine, quantity } = req.body;

        if (!serialNumber || !partNumber || !machinePart || !machine || !quantity) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Check if a part with the same part number already exists for this machine
        const existing = await StoreItem.findOne({
            where: { partNumber, machine }
        });

        if (existing) {
            // ── Duplicate found — increase quantity instead of creating a new entry ──
            existing.quantity += Number(quantity);
            await existing.save();

            return res.status(200).json({
                message: `Quantity updated for ${existing.machinePart}.`,
                item: existing
            });
        }

        // ── No duplicate — create a new store item ────────────────────────────
        const newItem = await StoreItem.create({
            serialNumber,
            partNumber,
            machinePart,
            machine,
            quantity: Number(quantity)
        });

        res.status(201).json({
            message: 'Item added to store successfully.',
            item: newItem
        });

    } catch (error) {
        console.error('Create store item error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── PATCH /api/store/:id ─────────────────────────────────────────────────────
// Update the quantity of a store item.
// Frontend sends: { quantity }

router.patch('/:id', protect, async (req, res) => {
    try {
        const { quantity } = req.body;

        if (!quantity || quantity <= 0) {
            return res.status(400).json({ message: 'Quantity must be greater than 0.' });
        }

        const item = await StoreItem.findByPk(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Store item not found.' });
        }

        item.quantity = Number(quantity);
        await item.save();

        res.status(200).json({ message: 'Store item updated.', item });

    } catch (error) {
        console.error('Update store item error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── DELETE /api/store/:id ────────────────────────────────────────────────────
// Delete a store item by its database id.

router.delete('/:id', protect, async (req, res) => {
    try {
        const item = await StoreItem.findByPk(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Store item not found.' });
        }

        await item.destroy();

        res.status(200).json({ message: 'Store item deleted.' });

    } catch (error) {
        console.error('Delete store item error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


module.exports = router;
