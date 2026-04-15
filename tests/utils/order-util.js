import { prismaClient } from "../../src/application/database.js";

export const removeAllTestOrders = async () => {
    await prismaClient.orderItem.deleteMany({
        where: {
            order: {
                username: "Tester Order"
            }
        }
    });

    await prismaClient.order.deleteMany({
        where: {
            username: "Tester Order"
        }
    });
}