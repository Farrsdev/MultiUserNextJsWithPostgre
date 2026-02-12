import { getServerSession } from "next-auth/next";
import { prisma } from "../../../lib/prisma.js";
import { authOptions } from "../auth/[...nextauth].js";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || session.user.role !== "admin") {
        return res.status(401).json({ error: "Unauthorized" });
    }

    // GET - Fetch all orders with details
    if (req.method === "GET") {
        try {
            const orders = await prisma.order.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    price: true,
                                    image: true
                                }
                            }
                        }
                    },
                    payment: {
                        select: {
                            id: true,
                            method: true,
                            status: true,
                            paidAt: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return res.status(200).json(orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            return res.status(500).json({ error: "Gagal mengambil data orders" });
        }
    }

    // PUT - Update order status
    if (req.method === "PUT") {
        const { orderId, status } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({ error: "Order ID and status are required" });
        }

        // Valid status values
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status value" });
        }

        try {
            // Check if order exists
            const existingOrder = await prisma.order.findUnique({
                where: { id: orderId }
            });

            if (!existingOrder) {
                return res.status(404).json({ error: "Order not found" });
            }

            // Update order status
            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: { 
                    status,
                    updatedAt: new Date()
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    price: true,
                                    image: true
                                }
                            }
                        }
                    },
                    payment: {
                        select: {
                            id: true,
                            method: true,
                            status: true,
                            paidAt: true
                        }
                    }
                }
            });

            return res.status(200).json(updatedOrder);
        } catch (error) {
            console.error('Error updating order:', error);
            return res.status(500).json({ error: "Gagal mengupdate status order" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}