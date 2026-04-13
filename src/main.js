import { web } from './application/web.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 8000;

web.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});