const express = require('express');
const http = require('http');
const bcrypt = require('bcryptjs');
const { Server } = require('socket.io');
const cors = require('cors'); // Use direct cors package
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

// HARDCODED CORS FOR DEBUGGING
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true // Note: credentials true usually conflicts with origin *, but for some setups it's ignored or needed. 
    // Actually, allowing * with credentials is spec-invalid, but let's try just * first without credentials or standard permissive.
}));
app.options(/(.*)/, cors()); // Enable pre-flight for all routes (Express 5 fix)

// Global Logger
app.use((req, res, next) => {
    console.log(`[GLOBAL REQUEST] ${req.method} ${req.url}`);
    next();
});

// HEALTH CHECK ROUTES (Critical for debugging)
app.get('/', (req, res) => res.send('API ONLINE 🚀'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

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
const PORT = process.env.PORT || 3001;

// Start Server IMMEDIATELY to ensure logging works and port is bound
server.listen(PORT, '0.0.0.0', () => {
    console.log(`[SYSTEM] Server running on port ${PORT}`);
    console.log(`[SYSTEM] Environment: ${process.env.NODE_ENV}`);
});

// Attempt Database Connection
// PRE-SYNC MIGRATION FIX: Handle column changes and additions
const runMigrations = async () => {
    const migrations = [
        // Price column type fix
        'ALTER TABLE "Products" ALTER COLUMN "price" TYPE FLOAT USING price::double precision;',
        // Analytics columns for Clients
        'ALTER TABLE "Clients" ADD COLUMN IF NOT EXISTS "views" INTEGER DEFAULT 0;',
        // Analytics columns for Products
        'ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "views" INTEGER DEFAULT 0;',
        'ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "favoritesCount" INTEGER DEFAULT 0;',
        'ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "nutritionInteractions" INTEGER DEFAULT 0;',
        'ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "parentProductId" UUID;',
    ];

    for (const sql of migrations) {
        try {
            await db.sequelize.query(sql);
            console.log(`[Migration] OK: ${sql.substring(0, 50)}...`);
        } catch (err) {
            // Ignore errors (column already exists, table doesn't exist yet, etc.)
            console.log(`[Migration] Skipped: ${sql.substring(0, 50)}...`);
        }
    }
};

runMigrations()
    .then(() => {
        // Sync Database (force: false to preserve data, alter: true to add new columns)
        return db.sequelize.sync({ force: false, alter: true });
    })
    .then(async () => {
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
