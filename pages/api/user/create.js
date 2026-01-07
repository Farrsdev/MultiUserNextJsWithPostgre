import { prisma } from "../../../lib/prisma";
import { hash } from "bcryptjs";
export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();
    const { name, email, password, role } = req.body;
    try {
        const hashedPassword = await hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || "user", // ✅ Jika role tidak dikirim, default ke 'user'
            },
        });
        res.status(201).json(newUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong" });
    }
}