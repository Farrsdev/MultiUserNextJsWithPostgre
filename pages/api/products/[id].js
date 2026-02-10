import { getServerSession } from "next-auth/next";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    // Proteksi: hanya admin yang boleh akses
    if (!session || session.user?.role !== "admin") {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.query;

    // GET single product
    if (req.method === "GET") {
        try {
            const product = await prisma.product.findUnique({
                where: { id },
            });

            if (!product) {
                return res.status(404).json({ error: "Produk tidak ditemukan" });
            }

            return res.status(200).json(product);
        } catch (err) {
            console.error("Error fetching product:", err);
            return res.status(500).json({ error: "Gagal ambil data produk" });
        }
    }

    // UPDATE product
    if (req.method === "PUT") {
        try {
            const { name, price, description, stock } = req.body;

            if (!name || price == null) {
                return res.status(400).json({ message: "Invalid data" });
            }

            const product = await prisma.product.update({
                where: { id },
                data: {
                    name,
                    price,
                    description: description || "",
                    stock: stock || 0,
                },
            });

            return res.status(200).json(product);
        } catch (err) {
            console.error("Error updating product:", err);
            return res.status(500).json({ error: "Gagal update produk" });
        }
    }

    // DELETE product
    if (req.method === "DELETE") {
        try {
            const product = await prisma.product.delete({
                where: { id },
            });
            return res.status(200).json(product);
        } catch (err) {
            console.error("Error deleting product:", err);
            return res.status(500).json({ error: "Gagal menghapus product" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
