import bcrypt from 'bcrypt';
import { prismaClient } from '../../src/application/database.js';

async function createTesters() {
    try {
        console.log("Memulai pembuatan akun tester massal...");

        const passwordHashed = await bcrypt.hash('password123', 10);

        let usersToCreate = [];
        const BATCH_SIZE = 5000;
        let totalInserted = 0;

        for (let i = 5104; i <= 150000; i++) {
            usersToCreate.push({
                email: `tester${i}@mail.com`,
                password: passwordHashed,
                name: `Tester ${i}`,
                is_verified: true
            });

            if (usersToCreate.length === BATCH_SIZE || i === 150000) {
                await prismaClient.user.createMany({
                    data: usersToCreate,
                    skipDuplicates: true
                });

                totalInserted += usersToCreate.length;
                console.log(`⏳ Sedang memproses... (${totalInserted} / 150000 akun berhasil dibuat)`);

                // Kosongkan array untuk batch selanjutnya
                usersToCreate = [];
            }
        }

        console.log(`✅ SELESAI! Berhasil membuat total ${totalInserted} akun tester baru!`);
    } catch (error) {
        console.error("❌ Gagal membuat akun:", error);
    } finally {
        await prismaClient.$disconnect();
    }
}

createTesters();