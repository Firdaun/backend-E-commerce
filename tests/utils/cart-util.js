import { prismaClient } from '../../src/application/database.js'

export const removeAllTestCarts = async () => {
    // Karena kita pakai onDelete: Cascade di schema, 
    // cukup hapus keranjangnya, maka isinya (cartItem) otomatis hilang.
    const users = await prismaClient.user.findMany({
        where: { email: { contains: '@example.com' } }
    })
    
    for (const user of users) {
        await prismaClient.cart.deleteMany({
            where: { userId: user.id }
        })
    }
}