import { getServerSession } from "next-auth/next";
import { prisma } from "../../../../lib/prisma.js";
import { authOptions } from "../../auth/[...nextauth].js";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || session.user.role !== "admin") {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method !== "PUT") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { orderIds, status } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: "Order IDs array is required" });
    }

    if (!status) {
        return res.status(400).json({ error: "Status is required" });
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }

    try {
        const result = await prisma.order.updateMany({
            where: {
                id: {
                    in: orderIds
                }
            },
            data: {
                status,
                updatedAt: new Date()
            }
        });

        return res.status(200).json({
            message: `Successfully updated ${result.count} orders`,
            count: result.count
        });
    } catch (error) {
        console.error('Error bulk updating orders:', error);
        return res.status(500).json({ error: "Gagal melakukan bulk update" });
    }
}