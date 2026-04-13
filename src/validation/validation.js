import { ResponseError } from "../error/response.error.js";

const validate = (schema, request) => {
    const result = schema.validate(request, {
        abortEarly: false, // Jangan berhenti di error pertama, tampilkan semua error
        allowUnknown: false // Tolak data/kolom tambahan yang tidak ada di skema
    });

    if (result.error) {
        // Lempar error 400 (Bad Request) beserta pesan detail dari Joi
        throw new ResponseError(400, result.error.message);
    } else {
        return result.value; // Kembalikan data yang sudah bersih
    }
};

export { validate };