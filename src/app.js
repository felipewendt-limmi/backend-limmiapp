const express = require('express');
const http = require('http');
const bcrypt = require('bcryptjs');
const { Server } = require('socket.io');
const cors = require('./config/cors');
const db = require('./models');
const routes = require('./routes');
require('dotenv').config();

const path = require('path');

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(cors);
app.use((req, res, next) => {
    console.log(`[GLOBAL REQUEST] ${req.method} ${req.url}`);
    console.log('[GLOBAL BODY]', JSON.stringify(req.body));
    next();
});

// Serve Static Files (Uploads)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Inject Socket.io into request
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
const uploadRoutes = require('./routes/upload.routes');
app.use('/api', routes);
app.use('/api/upload', uploadRoutes);

// Database Sync & Start Server
const PORT = process.env.PORT || 3000;

// Start Server IMMEDIATELY to ensure logging works and port is bound
server.listen(PORT, '0.0.0.0', () => {
    console.log(`[SYSTEM] Server running on port ${PORT}`);
    console.log(`[SYSTEM] Environment: ${process.env.NODE_ENV}`);
});

// Attempt Database Connection
db.sequelize.sync({ alter: true }).then(async () => {
    console.log('[DB] Database connected and synced');

    // Seed Admin User
    try {
        const adminEmail = 'admin@admin.com';
        const adminUser = await db.User.findOne({ where: { email: adminEmail } });

        if (!adminUser) {
            await db.User.create({
                email: adminEmail,
                password: 'admin',
                role: 'superadmin'
            });
            console.log('[DB] Default Admin User Created: admin@admin.com / admin');
        } else {
            // Force update password MANUALLY
            const hashedPassword = await bcrypt.hash('admin', 10);
            await db.User.update(
                { password: hashedPassword },
                { where: { email: adminEmail } }
            );
            console.log('[DB] Admin user password MANUALLY reset to defaults: admin');
        }
    } catch (error) {
        console.error('[DB] Error seeding admin user:', error);
    }
}).catch(err => {
    console.error('[DB] CRITICAL DATABASE CONNECTION ERROR:', err);
    console.error('[DB] Verify your DB_HOST, DB_USER, DB_PASS environment variables.');
});

// Socket Events
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

module.exports = app;
