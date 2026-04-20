import { prismaClient } from '../../src/application/database.js';

export const removeAllTestOrders = async () => {
    // 1. Cari ID dari user testing kita
    const users = await prismaClient.user.findMany({
        where: {
            email: {
                in: ['test@example.com', 'admin@example.com']
            }
        }
    })

    const userIds = users.map(user => user.id)

    // 2. Jika user ditemukan, sapu bersih semua pesanannya
    if (userIds.length > 0) {
        // Hapus detail itemnya dulu (karena berelasi ke pesanan)
        await prismaClient.orderItem.deleteMany({
            where: {
                order: {
                    userId: {
                        in: userIds
                    }
                }
            }
        })

        // Baru hapus induk pesanannya
        await prismaClient.order.deleteMany({
            where: {
                userId: {
                    in: userIds
                }
            }
        })
    }
}