import { getServerSession } from "next-auth/next";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    // Proteksi: hanya authenticated users yang boleh akses
    if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
        // Semua user (admin & regular) boleh baca products
        try {
            const products = await prisma.product.findMany({
                orderBy: { createdAt: "desc" },
            });
            return res.status(200).json(products);
        } catch (err) {
            console.error("Error fetching products:", err);
            return res.status(500).json({ error: "Gagal ambil data" });
        }
    } else {
        return res.status(405).json({ error: "Method not allowed" });
    }
}
