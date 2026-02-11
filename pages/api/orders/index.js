import { getServerSession } from "next-auth/next";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    const userId = session.user.id;

    if (req.method === "GET") {
        try {
            const orders = await prisma.order.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                include: { items: { include: { product: true } } },
            });
            return res.status(200).json(orders);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Gagal ambil orders" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
