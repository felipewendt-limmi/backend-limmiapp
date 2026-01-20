const express = require('express');
const http = require('http');
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
const PORT = process.env.PORT || 4000;

db.sequelize.sync({ alter: true }).then(async () => {
    console.log('Database connected and synced');

    // Seed Admin User
    try {
        const adminEmail = 'admin@admin.com';
        const adminUser = await db.User.findOne({ where: { email: adminEmail } });

        if (!adminUser) {
            await db.User.create({
                email: adminEmail,
                password: 'admin', // Will be hashed by hook
                role: 'superadmin'
            });
            console.log('Default Admin User Created: admin@admin.com / admin');
        } else {
            console.log('Admin user already exists');
        }
    } catch (error) {
        console.error('Error seeding admin user:', error);
    }

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Database connection failed:', err);
});

// Socket Events
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

module.exports = app;
