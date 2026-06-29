const express = require('express');
const Client = require('../models/Client');
const Machine = require('../models/Machine');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();


// ─── GET /api/clients ─────────────────────────────────────────────────────────
// Fetch all clients with their machines, alphabetically ordered.

router.get('/', protect, async (req, res) => {
    try {
        const clients = await Client.find().sort({ companyName: 1 }).lean();

        // Attach machines to each client
        const clientIds = clients.map(c => c._id);
        const machines = await Machine.find({ clientId: { $in: clientIds } }).lean();

        const clientsWithMachines = clients.map(client => ({
            ...client,
            machines: machines.filter(m => String(m.clientId) === String(client._id))
        }));

        res.status(200).json({ clients: clientsWithMachines });

    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/clients ────────────────────────────────────────────────────────
// Create a new client.

router.post('/', protect, async (req, res) => {
    try {
        const { companyName, address } = req.body;

        if (!companyName || !address) {
            return res.status(400).json({ message: 'Company name and address are required.' });
        }

        const existing = await Client.findOne({ companyName });
        if (existing) {
            return res.status(409).json({ message: 'A client with this company name already exists.' });
        }

        const client = await Client.create({ companyName, address });

        res.status(201).json({
            message: `Client "${client.companyName}" created successfully.`,
            client
        });

    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── GET /api/clients/:id/machines ───────────────────────────────────────────
// Get all machines for a specific client.

router.get('/:id/machines', protect, async (req, res) => {
    try {
        const client = await Client.findById(req.params.id).lean();

        if (!client) {
            return res.status(404).json({ message: 'Client not found.' });
        }

        const machines = await Machine.find({ clientId: client._id }).lean();

        res.status(200).json({ client: { ...client, machines } });

    } catch (error) {
        console.error('Get client machines error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/clients/machines ───────────────────────────────────────────────
// Register a new machine for a client.
// lastMaintenanceDate defaults to installedDate (same as original frontend logic).

router.post('/machines', protect, async (req, res) => {
    console.log(req.body);
    try {
        const {
            serialNumber,
            machine,
            lineInstalled,
            installedDate,
            maintenanceCycle,
            usageStatus,
            clientId,
            clientName
        } = req.body;

        if (!serialNumber || !machine || !lineInstalled || !installedDate ||
            !maintenanceCycle || !usageStatus || !clientId) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ message: 'Client not found.' });
        }

        const existing = await Machine.findOne({ serialNumber });
        if (existing) {
            return res.status(409).json({ message: 'A machine with this serial number already exists.' });
        }

        const newMachine = await Machine.create({
            serialNumber,
            machine,
            lineInstalled,
            installedDate,
            maintenanceCycle,
            lastMaintenanceDate: installedDate,  // same as original frontend logic
            usageStatus,
            clientId,
            clientName
        });

        res.status(201).json({
            message: 'Machine registered successfully.',
            machine: newMachine
        });

    } catch (error) {
        console.error('Create machine error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── PATCH /api/clients/machines/:id ─────────────────────────────────────────
// Update a machine's last maintenance date and/or usage status.

router.patch('/machines/:id', protect, async (req, res) => {
    try {
        const { lastMaintenanceDate, usageStatus } = req.body;

        const machine = await Machine.findById(req.params.id);
        if (!machine) {
            return res.status(404).json({ message: 'Machine not found.' });
        }

        if (lastMaintenanceDate) machine.lastMaintenanceDate = lastMaintenanceDate;
        if (usageStatus) machine.usageStatus = usageStatus;

        await machine.save();

        res.status(200).json({
            message: 'Machine updated successfully.',
            machine
        });

    } catch (error) {
        console.error('Update machine error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── DELETE /api/clients/machines/:id ────────────────────────────────────────
// Delete a machine by its id.

router.delete('/machines/:id', protect, async (req, res) => {
    console.log('Delete client id:', req.params.id);
    try {
        const machine = await Machine.findByIdAndDelete(req.params.id);
        if (!machine) {
            return res.status(404).json({ message: 'Machine not found.' });
        }

        res.status(200).json({ message: 'Machine deleted successfully.' });

    } catch (error) {
        console.error('Delete machine error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── DELETE /api/clients/:id ──────────────────────────────────────────────────
// Delete a client and all their machines (CASCADE equivalent).

router.delete('/:id', protect, async (req, res) => {
    console.log('Delete client id:', req.params.id);
    try {
        const client = await Client.findById(req.params.id);

        if (!client) {
            return res.status(404).json({ message: 'Client not found.' });
        }

        // Delete all machines belonging to this client first (CASCADE equivalent)
        await Machine.deleteMany({ clientId: client._id });

        await Client.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: `Client "${client.companyName}" deleted successfully.`
        });

    } catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


module.exports = router;
