import { prismaClient } from '../../src/application/database.js'

export const removeAllTestProducts = async () => {
    await prismaClient.product.deleteMany({
        where: {
            variant: {
                contains: 'Test'
            }
        }
    })
}

export const createTestProduct = async () => {
    await prismaClient.product.createMany({
        data: [
            {
                variant: 'Seblak Test Ori',
                price: 15000,
                spice_level: 2,
                description: 'Seblak original mantap',
                image_url: "https://example.com/ori.jpg",
                is_available: true
            },
            {
                variant: "Seblak Test Spesial (Habis)",
                price: 25000,
                spice_level: 5,
                description: "Seblak spesial komplit",
                image_url: "https://example.com/spesial.jpg",
                is_available: false
            }
        ]
    })
}