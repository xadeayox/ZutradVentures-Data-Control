const express = require('express');
const Client = require('../models/Client');
const Machine = require('../models/Machine');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes here require the user to be logged in (protect middleware).
// Engineers, receptionists and admins can all access client data.


// ─── GET /api/clients ─────────────────────────────────────────────────────────
// Fetch all clients with their machines.
// Used by the ClientMachinesPage to display all clients and their machines.

router.get('/', protect, async (req, res) => {
    try {
        const clients = await Client.findAll({
            include: [
                {
                    model: Machine,
                    as: 'machines'      // brings in all machines for each client
                }
            ],
            order: [['company_name', 'ASC']]    // alphabetical order
        });

        res.status(200).json({ clients });

    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/clients ────────────────────────────────────────────────────────
// Create a new client.
// Frontend sends: { companyName, address }

router.post('/', protect, async (req, res) => {
    try {
        const { companyName, address } = req.body;

        if (!companyName || !address) {
            return res.status(400).json({ message: 'Company name and address are required.' });
        }

        // Check if client already exists
        const existing = await Client.findOne({ where: { companyName } });
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
// :id is the client's database id — it's part of the URL e.g. /api/clients/3/machines

router.get('/:id/machines', protect, async (req, res) => {
    try {
        const client = await Client.findByPk(req.params.id, {
            include: [{ model: Machine, as: 'machines' }]
        });

        if (!client) {
            return res.status(404).json({ message: 'Client not found.' });
        }

        res.status(200).json({ client });

    } catch (error) {
        console.error('Get client machines error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/machines ───────────────────────────────────────────────────────
// Register a new machine for a client.
// Frontend sends: { serialNumber, machine, lineInstalled, installedDate,
//                   maintenanceCycle, usageStatus, clientId }
// lastMaintenanceDate defaults to installedDate (same as original frontend logic)

router.post('/machines', protect, async (req, res) => {
    try {
        const {
            serialNumber,
            machine,
            lineInstalled,
            installedDate,
            maintenanceCycle,
            usageStatus,
            clientId
        } = req.body;

        // Validate all required fields
        if (!serialNumber || !machine || !lineInstalled || !installedDate ||
            !maintenanceCycle || !usageStatus || !clientId) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Make sure the client exists
        const client = await Client.findByPk(clientId);
        if (!client) {
            return res.status(404).json({ message: 'Client not found.' });
        }

        // Check for duplicate serial number
        const existing = await Machine.findOne({ where: { serialNumber } });
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
            clientId
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
// :id is the machine's database id.
// Frontend sends: { lastMaintenanceDate, usageStatus }

router.patch('/machines/:id', protect, async (req, res) => {
    try {
        const { lastMaintenanceDate, usageStatus } = req.body;

        const machine = await Machine.findByPk(req.params.id);
        if (!machine) {
            return res.status(404).json({ message: 'Machine not found.' });
        }

        // Only update the fields that were actually sent
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
// Delete a machine by its database id.

router.delete('/machines/:id', protect, async (req, res) => {
    try {
        const machine = await Machine.findByPk(req.params.id);
        if (!machine) {
            return res.status(404).json({ message: 'Machine not found.' });
        }

        await machine.destroy();

        res.status(200).json({ message: 'Machine deleted successfully.' });

    } catch (error) {
        console.error('Delete machine error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// ─── DELETE /api/clients/:id ────────────────────────────────────────
// Delete a client by its database id.

router.delete('/:id', protect, async (req, res) => {
    try {
        const client = await Client.findByPk(req.params.id);

        if (!client) {
            return res.status(404).json({ message: 'Client not found.' });
        }

        // This automatically deletes machines because of CASCADE
        await client.destroy();

        res.status(200).json({
            message: `Client "${client.companyName}" deleted successfully.`
        });

    } catch (error) {
        console.error('Delete client error:', error);
        console.error(error.parent);
        console.error(error.original);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


module.exports = router;
