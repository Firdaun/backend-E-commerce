import { prismaClient } from "../../src/application/database.js";

async function cleanUpTestOrders() {
    try {
        console.log("Memulai penghapusan data hasil test k6...");

        const deletedItems = await prismaClient.orderItem.deleteMany({
            where: {
                order: {
                    username: 'Tester Load'
                }
            }
        });
        console.log(`✅ Berhasil menghapus ${deletedItems.count} Order Item dari keranjang test.`);

        const deletedOrders = await prismaClient.order.deleteMany({
            where: {
                username: 'Tester Load'
            }
        });
        console.log(`✅ Berhasil menghapus ${deletedOrders.count} Riwayat Order.`);

    } catch (error) {
        console.error("❌ Gagal melakukan cleanup:", error);
    } finally {
        // Putuskan koneksi agar script selesai dengan rapi
        await prismaClient.$disconnect();
    }
}

cleanUpTestOrders();