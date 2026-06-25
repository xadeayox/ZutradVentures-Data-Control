const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const reportRoutes = require('./routes/reports');
const maintenanceRoutes = require('./routes/maintenance');
const supplyRoutes = require('./routes/supply');
const storeRoutes = require('./routes/store');

// Import all models so Sequelize syncs all tables on startup
require('./models/User');
require('./models/Permission');
require('./models/Client');
require('./models/Machine');
require('./models/Report');
require('./models/Maintenance');
require('./models/Supply');
require('./models/StoreItem');

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

    // ─── Catch-all for React Router ───────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ─── Database Sync + Server Start ────────────────────────────────────────────
sequelize.sync({ alter: true })
    .then(() => {
        console.log('✅ SQLite connected and tables synced');
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    });


