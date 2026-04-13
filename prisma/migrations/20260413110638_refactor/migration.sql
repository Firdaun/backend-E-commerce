/*
  Warnings:

  - You are about to drop the column `flames` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Product` table. All the data in the column will be lost.
  - Added the required column `image_url` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variant` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "flames",
DROP COLUMN "image",
DROP COLUMN "level",
DROP COLUMN "name",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "image_url" TEXT NOT NULL,
ADD COLUMN     "is_available" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "spice_level" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "variant" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "no_wa" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "total_price" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Menunggu',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "spice_level" INTEGER NOT NULL,
    "price_at_purchase" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
