import { getServerSession } from "next-auth/next";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    if (!session || session.user.role !== "admin") {
        return res.status(401).json({ message: "Unauthorized" });
    }

    // GET list product
    if (req.method === "GET") {
        const products = await prisma.product.findMany({
            orderBy: { id: "desc" },
        });
        return res.json(products);
    }

    // CREATE product
    if (req.method === "POST") {
        const { name, price, description, stock } = req.body;

        if (!name || price == null) {
            return res.status(400).json({ message: "Invalid data" });
        }

        const product = await prisma.product.create({
            data: {
                name,
                description: description || "",
                price,
                stock: stock || 0
            },
        });

        return res.status(201).json(product);
    }

    res.status(405).end();
}