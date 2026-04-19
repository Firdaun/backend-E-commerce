import bcrypt from 'bcrypt'
import { prismaClient } from '../../src/application/database.js'

export const removeTestUser = async () => {
    await prismaClient.user.deleteMany({
        where: {
            email: 'test@example.com',
        }
    })
}
export const removeHackerUser = async () => {
    await prismaClient.user.deleteMany({
        where: {
            email: 'hacker@example.com'
        }
    })
}

export const createTestUser = async () => {
    await prismaClient.user.create({
        data: {
            email: 'test@example.com',
            name: 'Fahrul Tester',
            password: await bcrypt.hash('rahasia123', 10),
            is_verified: true
        }
    })
}

export const createTestAdmin = async () => {
    await prismaClient.user.create({
        data: {
            email: 'admin@example.com',
            name: 'Super Admin',
            password: await bcrypt.hash('rahasia123', 10),
            role: 'ADMIN',
            is_verified: true
        }
    })
}

export const removeTestAdmin = async () => {
    await prismaClient.user.deleteMany({
        where: {
            email: 'admin@example.com'
        }
    })
}