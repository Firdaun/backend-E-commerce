import { productService } from '../src/services/product.service.js'
import { prismaClient } from '../src/application/database.js'

// Mocking prismaClient to avoid database connection
prismaClient.product.create = async ({ data }) => {
    console.log('Called prisma.product.create with:', data);
    return { id: 1, ...data };
};

prismaClient.product.createMany = async ({ data }) => {
    console.log('Called prisma.product.createMany with:', data);
    return { count: data.length };
};

async function test() {
    console.log('--- Testing Single Product ---');
    try {
        const single = await productService.createProduct({
            variant: 'Seblak Original',
            price: 15000,
            spice_level: 3,
            description: 'Mantap',
            image_url: 'https://example.com/image.jpg'
        });
        console.log('Result:', single);
    } catch (e) {
        console.error('Single failed:', e.message);
    }

    console.log('\n--- Testing Multiple Products ---');
    try {
        const multiple = await productService.createProduct([
            {
                variant: 'Seblak Pedas',
                price: 16000,
                spice_level: 5,
                description: 'Pedas gila',
                image_url: 'https://example.com/image2.jpg'
            },
            {
                variant: 'Seblak Keju',
                price: 18000,
                spice_level: 1,
                description: 'Gurih',
                image_url: 'https://example.com/image3.jpg'
            }
        ]);
        console.log('Result:', multiple);
    } catch (e) {
        console.error('Multiple failed:', e.message);
    }
}

test();
