const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const reportRoutes = require('./routes/reports');
const maintenanceRoutes = require('./routes/maintenance');
const supplyRoutes = require('./routes/supply');
const storeRoutes = require('./routes/store');
const invoiceRoutes = require('./routes/invoices');
const grnRoutes = require('./routes/grns');
const quotationRoutes = require('./routes/quotations');
const purchaseOrderRoutes = require('./routes/purchaseOrder');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Serve Frontend Build ─────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'dist')));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.send('Backend is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/supply', supplyRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/grns', grnRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/purchaseorders', purchaseOrderRoutes);

// ─── Catch-all for React Router ───────────────────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ─── Connect to MongoDB + Start Server ───────────────────────────────────────
connectDB().then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
});
