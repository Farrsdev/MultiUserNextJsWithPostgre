import { getServerSession } from "next-auth/next";
import { prisma } from "../../lib/prisma.js"
import { authOptions } from "../api/auth/[...nextauth].js";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    const userId = session.user.id;

    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        const cartItems = await prisma.cartItem.findMany({ where: { userId }, include: { product: true } });
        if (!cartItems || cartItems.length === 0) return res.status(400).json({ error: "Cart kosong" });

        // calculate total and check stock
        let total = 0;
        for (const ci of cartItems) {
            if (ci.quantity > ci.product.stock) {
                return res.status(400).json({ error: `Stok tidak cukup untuk ${ci.product.name}` });
            }
            total += ci.quantity * ci.product.price;
        }

        // Transaction: create order, order items, decrement stock, clear cart
        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({ data: { userId, total } });

            const orderItemsData = cartItems.map((ci) => ({
                orderId: order.id,
                productId: ci.productId,
                price: ci.product.price,
                quantity: ci.quantity,
            }));

            await tx.orderItem.createMany({ data: orderItemsData });

            // decrement stock
            for (const ci of cartItems) {
                await tx.product.update({ where: { id: ci.productId }, data: { stock: ci.product.stock - ci.quantity } });
            }

            // clear cart
            await tx.cartItem.deleteMany({ where: { userId } });

            return order;
        });

        return res.status(201).json({ orderId: result.id });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Gagal melakukan checkout" });
    }
}
