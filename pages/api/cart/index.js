import { getServerSession } from "next-auth/next";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    const userId = session.user.id;

    if (req.method === "GET") {
        try {
            const items = await prisma.cartItem.findMany({
                where: { userId },
                include: { product: true },
            });
            return res.status(200).json(items);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Gagal ambil cart" });
        }
    }

    if (req.method === "POST") {
        try {
            const { productId, quantity = 1 } = req.body;
            if (!productId) return res.status(400).json({ error: "productId required" });

            // Upsert cart item
            const existing = await prisma.cartItem.findFirst({ where: { userId, productId } });

            let item;
            if (existing) {
                item = await prisma.cartItem.update({
                    where: { id: existing.id },
                    data: { quantity: existing.quantity + Number(quantity) },
                });
            } else {
                item = await prisma.cartItem.create({
                    data: { userId, productId, quantity: Number(quantity) },
                });
            }

            const payload = await prisma.cartItem.findUnique({ where: { id: item.id }, include: { product: true } });
            return res.status(200).json(payload);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Gagal tambah cart" });
        }
    }

    if (req.method === "PUT") {
        try {
            const { productId, quantity } = req.body;
            if (!productId || quantity === undefined) {
                return res.status(400).json({ error: "productId and quantity required" });
            }

            const existing = await prisma.cartItem.findFirst({ where: { userId, productId } });
            if (!existing) return res.status(404).json({ error: "Item not found" });

            if (quantity <= 0) {
                // If quantity is 0 or less, remove the item
                await prisma.cartItem.delete({ where: { id: existing.id } });
                return res.status(200).json({ ok: true, removed: true });
            }

            const item = await prisma.cartItem.update({
                where: { id: existing.id },
                data: { quantity: Number(quantity) },
            });

            const payload = await prisma.cartItem.findUnique({ where: { id: item.id }, include: { product: true } });
            return res.status(200).json(payload);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Gagal update cart" });
        }
    }

    if (req.method === "DELETE") {
        try {
            const { productId } = req.body;
            if (!productId) return res.status(400).json({ error: "productId required" });

            const existing = await prisma.cartItem.findFirst({ where: { userId, productId } });
            if (!existing) return res.status(404).json({ error: "Item not found" });

            await prisma.cartItem.delete({ where: { id: existing.id } });
            return res.status(200).json({ ok: true });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Gagal hapus cart item" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
