import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Konfigurasi dotenv agar bisa membaca file .env
dotenv.config();

const app = express();
const PORT = process.env.PORT

// Middleware
app.use(cors()); // Mengizinkan request dari frontend
app.use(express.json()); // Agar bisa membaca format JSON dari request body

// Route dasar untuk testing
app.get('/', (req, res) => {
    res.json({ message: "Server Seblak Hot Jeletot berjalan dengan lancar! 🌶️🔥" });
});

// Route untuk data produk (sementara hardcode sebelum pakai database)
app.get('/api/products', (req, res) => {
    // Nanti datanya bisa diambil dari database
    const products = [
        { id: 1, name: "Seblak Original", price: 15000 },
        { id: 2, name: "Seblak Hot Jeletot", price: 18000 }
    ];
    res.json(products);
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});