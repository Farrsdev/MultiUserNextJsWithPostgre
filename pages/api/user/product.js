import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  //belum login
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  //bukan USER
  if (session.user.role !== "user") {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (req.method === "GET") {
    try {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json(products);
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  }

  res.status(405).json({ message: "Method Not Allowed" });
}