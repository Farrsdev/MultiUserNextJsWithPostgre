import { getServerSession } from "next-auth/next";
import { prisma } from "../../lib/prisma.js"
import { authOptions } from "../api/auth/[...nextauth].js";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    const userId = session.user.id;

    // POST - Initiate checkout & create pending payment
    if (req.method === "POST") {
        try {
            const cartItems = await prisma.cartItem.findMany({ 
                where: { userId }, 
                include: { product: true } 
            });
            
            if (!cartItems || cartItems.length === 0) {
                return res.status(400).json({ error: "Cart kosong" });
            }

            // Check stock
            for (const ci of cartItems) {
                if (ci.quantity > ci.product.stock) {
                    return res.status(400).json({ 
                        error: `Stok tidak cukup untuk ${ci.product.name}. Tersedia: ${ci.product.stock}` 
                    });
                }
            }

            // Calculate total
            const subtotal = cartItems.reduce((sum, ci) => sum + (ci.quantity * ci.product.price), 0);
            const tax = Math.round(subtotal * 0.1);
            const shipping = subtotal > 500000 ? 0 : 15000;
            const total = subtotal + tax + shipping;

            // Generate unique order ID
            const orderId = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

            // Create pending payment record
            const payment = await prisma.payment.create({
                data: {
                    userId,
                    amount: total,
                    status: 'pending',
                    method: 'bank_transfer', // default
                    orderId,
                    expiresAt: new Date(Date.now() + 30 * 60000), // 30 minutes
                    items: {
                        create: cartItems.map(ci => ({
                            productId: ci.productId,
                            quantity: ci.quantity,
                            price: ci.product.price,
                            productName: ci.product.name
                        }))
                    }
                },
                include: {
                    items: true
                }
            });

            return res.status(201).json({ 
                paymentId: payment.id,
                orderId: payment.orderId,
                amount: payment.amount,
                expiresAt: payment.expiresAt,
                message: "Payment pending, silakan selesaikan pembayaran"
            });

        } catch (err) {
            console.error('Checkout error:', err);
            return res.status(500).json({ error: "Gagal memproses checkout" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}