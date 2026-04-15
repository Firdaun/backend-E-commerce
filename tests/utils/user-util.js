import bcrypt from 'bcrypt'
import { prismaClient } from '../../src/application/database.js'

// Fungsi untuk menghapus user percobaan (berserta semua session-nya berkat onDelete: Cascade)
export const removeTestUser = async () => {
    await prismaClient.user.deleteMany({
        where: {
            email: 'test@example.com'
        }
    })
}

// Fungsi untuk membuat user percobaan (nanti berguna banget buat ngetes Login & Order)
export const createTestUser = async () => {
    await prismaClient.user.create({
        data: {
            email: 'test@example.com',
            name: 'Fahrul Tester',
            password: await bcrypt.hash('rahasia123', 10)
        }
    })
}

export const createTestAdmin = async () => {
    await prismaClient.user.create({
        data: {
            email: "admin@example.com",
            name: "Super Admin",
            password: await bcrypt.hash("rahasia123", 10),
            role: "ADMIN"
        }
    })
}

export const removeTestAdmin = async () => {
    await prismaClient.user.deleteMany({
        where: { email: "admin@example.com" }
    })
}