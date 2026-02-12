import { getServerSession } from "next-auth/next";
import { prisma } from "../../../lib/prisma.js"
import { authOptions } from "../auth/[...nextauth].js";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    const userId = session.user.id;

    // POST - Confirm payment (simulate payment success)
    if (req.method === "POST") {
        const { paymentId, method } = req.body;

        try {
            // Get payment record
            const payment = await prisma.payment.findFirst({
                where: { 
                    id: paymentId, 
                    userId,
                    status: 'pending'
                },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });

            if (!payment) {
                return res.status(404).json({ error: "Payment tidak ditemukan atau sudah diproses" });
            }

            // Check if payment expired
            if (new Date() > payment.expiresAt) {
                await prisma.payment.update({
                    where: { id: paymentId },
                    data: { status: 'expired' }
                });
                return res.status(400).json({ error: "Pembayaran telah kadaluarsa" });
            }

            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds delay

            // Start transaction
            const result = await prisma.$transaction(async (tx) => {
                // Update payment status
                const updatedPayment = await tx.payment.update({
                    where: { id: paymentId },
                    data: { 
                        status: 'completed',
                        method: method || 'bank_transfer',
                        paidAt: new Date()
                    }
                });

                // Create order
                const order = await tx.order.create({
                    data: {
                        userId,
                        total: payment.amount,
                        paymentId: payment.id,
                        status: 'processing'
                    }
                });

                // Create order items
                for (const item of payment.items) {
                    await tx.orderItem.create({
                        data: {
                            orderId: order.id,
                            productId: item.productId,
                            price: item.price,
                            quantity: item.quantity
                        }
                    });

                    // Decrement stock
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } }
                    });
                }

                // Clear cart
                await tx.cartItem.deleteMany({
                    where: { userId }
                });

                return { order, payment: updatedPayment };
            });

            return res.status(200).json({ 
                success: true,
                orderId: result.order.id,
                message: "Pembayaran berhasil! Pesanan sedang diproses."
            });

        } catch (err) {
            console.error('Payment confirmation error:', err);
            return res.status(500).json({ error: "Gagal memproses pembayaran" });
        }
    }

    // GET - Get payment details
    if (req.method === "GET") {
        const { paymentId } = req.query;

        try {
            const payment = await prisma.payment.findFirst({
                where: { 
                    id: paymentId,
                    userId
                },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });

            if (!payment) {
                return res.status(404).json({ error: "Payment not found" });
            }

            return res.status(200).json(payment);
        } catch (err) {
            console.error('Get payment error:', err);
            return res.status(500).json({ error: "Gagal mengambil data payment" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}