import express from 'express';
import cors from 'cors';
import { router } from '../routes/api.route.js';
import { errorMiddleware } from '../middleware/error.middleware.js';

export const web = express();

// Middleware dasar
web.use(cors());
web.use(express.json());

// Rute sementara untuk memastikan web-nya jalan
web.get('/', (req, res) => {
    res.json({ message: "API Seblak Hot Jeletot Terkoneksi! 🌶️🔥" });
});

web.use('/api', router)

web.use(errorMiddleware)