import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import platformsRouter from './routes/platforms.js';
import guidesRouter from './routes/guides.js';
import newsRouter from './routes/news.js';
import topListsRouter from './routes/topLists.js';
import settingsRouter from './routes/settings.js';
import pagesRouter from './routes/pages.js';
import notificationsRouter from './routes/notifications.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust Proxy for Cloudflare
app.set('trust proxy', 1);

// Enhanced CORS Configuration - Must be BEFORE any routes
app.use((req, res, next) => {
    // Allow all origins (required for Cloudflare Tunnel's random URLs)
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});

app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/platforms', platformsRouter);
app.use('/api/guides', guidesRouter);
app.use('/api/news', newsRouter);
app.use('/api/top-lists', topListsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/pages', pagesRouter);
app.use('/api/notifications', notificationsRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        ip: req.ip
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API Server running on http://0.0.0.0:${PORT}`);
    console.log(`📡 Ready for Cloudflare Tunnel connection`);
});
