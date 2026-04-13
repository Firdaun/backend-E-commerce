import { ResponseError } from "../error/response.error.js";

const errorMiddleware = async (err, _, res, next) => {
    if (!err) {
        next();
        return;
    }

    // Jika error-nya berasal dari ResponseError (Validasi / Logika Bisnis)
    if (err instanceof ResponseError) {
        res.status(err.status).json({
            errors: `${err.message}, nu baleg bos`
        }).end();
    } else {
        // Jika error-nya dari sistem (misal Prisma error atau server crash)
        res.status(500).json({
            errors: err.message // Saat production, lebih baik disembunyikan jadi "Internal Server Error"
        }).end();
    }
};

export { errorMiddleware };