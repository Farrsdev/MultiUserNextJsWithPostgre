import { getServerSession } from "next-auth/next";
import { useEffect, useState } from "react";
import { authOptions } from "../api/auth/[...nextauth]";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

export async function getServerSideProps(context) {
    const session = await getServerSession(context.req, context.res, authOptions);
    if (!session || session.user.role !== "user") {
        return { redirect: { destination: "/login", permanent: false } };
    }
    return { props: {} };
}

const rupiah = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
});

export default function CartPage() {
    const { data: session } = useSession();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [removingId, setRemovingId] = useState(null);
    const router = useRouter();

    const fetchCart = async () => {
        const res = await fetch('/api/cart');
        if (res.ok) setItems(await res.json());
    };

    useEffect(() => { fetchCart(); }, []);

    const handleRemove = async (productId) => {
        setRemovingId(productId);
        setLoading(true);
        try {
            await fetch('/api/cart', { 
                method: 'DELETE', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ productId }) 
            });
            await fetchCart();
        } catch (error) {
            console.error('Failed to remove item:', error);
            alert('Gagal menghapus item dari cart');
        } finally {
            setRemovingId(null);
            setLoading(false);
        }
    };

    const handleUpdateQuantity = async (productId, newQuantity) => {
        if (newQuantity < 1) return handleRemove(productId);
        
        setLoading(true);
        try {
            await fetch('/api/cart', { 
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ productId, quantity: newQuantity }) 
            });
            await fetchCart();
        } catch (error) {
            console.error('Failed to update quantity:', error);
            alert('Gagal mengupdate quantity');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/checkout', { method: 'POST' });
            if (res.ok) {
                alert('✅ Checkout berhasil! Pesanan Anda sedang diproses.');
                router.push('/dashboard/orders');
            } else {
                const data = await res.json();
                alert(data?.error || 'Checkout gagal, silakan coba lagi');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Terjadi kesalahan saat checkout');
        } finally {
            setLoading(false);
        }
    };

    const subtotal = items.reduce((sum, it) => sum + (it.quantity * (it.product?.price || 0)), 0);
    const tax = subtotal * 0.1; // 10% tax
    const shipping = subtotal > 500000 ? 0 : 15000; // Free shipping for orders > 500k
    const total = subtotal + tax + shipping;
    const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.userInfo}>
                    <div style={styles.avatar}>
                        {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
                    </div>
                    <div>
                        <h1 style={styles.title}>🛒 Shopping Cart</h1>
                        <p style={styles.subtitle}>Review and manage your items</p>
                    </div>
                </div>
                <div style={styles.headerActions}>
                    <div style={styles.userRole}>
                        <span style={styles.roleBadge}>User Account</span>
                    </div>
                    <a href="/dashboard/user" style={styles.navLink}>📦 Products</a>
                    <a href="/dashboard/orders" style={styles.navLink}>📜 Orders</a>
                </div>
            </header>

            {/* Cart Stats */}
            <div style={styles.statsContainer}>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: '#e0f2fe' }}>🛒</div>
                    <div>
                        <h3 style={styles.statNumber}>{itemCount}</h3>
                        <p style={styles.statLabel}>Total Items</p>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: '#dbeafe' }}>📦</div>
                    <div>
                        <h3 style={styles.statNumber}>{items.length}</h3>
                        <p style={styles.statLabel}>Unique Products</p>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: '#dcfce7' }}>💰</div>
                    <div>
                        <h3 style={styles.statNumber}>{rupiah.format(subtotal)}</h3>
                        <p style={styles.statLabel}>Subtotal</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main style={styles.mainContent}>
                {items.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>🛒</div>
                        <h3 style={styles.emptyTitle}>Your cart is empty</h3>
                        <p style={styles.emptyText}>
                            Looks like you haven't added any items to your cart yet
                        </p>
                        <a href="/dashboard/user" style={styles.shopNowBtn}>
                            Shop Now →
                        </a>
                    </div>
                ) : (
                    <div style={styles.cartLayout}>
                        {/* Cart Items */}
                        <div style={styles.cartItems}>
                            <div style={styles.cartHeader}>
                                <h2 style={styles.cartTitle}>Cart Items ({itemCount})</h2>
                                <span style={styles.clearHint}>Swipe to remove</span>
                            </div>
                            
                            {items.map((item) => (
                                <div key={item.id} style={styles.cartItem}>
                                    {/* Product Image */}
                                    <div style={styles.itemImageContainer}>
                                        {item.product?.imageUrl ? (
                                            <img 
                                                src={item.product.imageUrl} 
                                                alt={item.product.name} 
                                                style={styles.itemImage} 
                                            />
                                        ) : (
                                            <div style={styles.itemImagePlaceholder}>
                                                {item.product?.name?.charAt(0) || 'P'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Details */}
                                    <div style={styles.itemDetails}>
                                        <div style={styles.itemInfo}>
                                            <h3 style={styles.itemName}>{item.product?.name}</h3>
                                            <p style={styles.itemPrice}>{rupiah.format(item.product?.price || 0)}</p>
                                            {item.product?.stock < 5 && (
                                                <span style={styles.lowStock}>
                                                    ⚠️ Only {item.product.stock} left
                                                </span>
                                            )}
                                        </div>

                                        {/* Quantity Controls */}
                                        <div style={styles.quantityControls}>
                                            <button
                                                onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                                                disabled={loading}
                                                style={styles.qtyBtn}
                                            >
                                                −
                                            </button>
                                            <span style={styles.qtyValue}>{item.quantity}</span>
                                            <button
                                                onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                                                disabled={loading || item.quantity >= (item.product?.stock || 99)}
                                                style={styles.qtyBtn}
                                            >
                                                +
                                            </button>
                                            <span style={styles.itemSubtotal}>
                                                = {rupiah.format(item.quantity * (item.product?.price || 0))}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => handleRemove(item.productId)}
                                        disabled={loading && removingId === item.productId}
                                        style={styles.removeBtn}
                                    >
                                        {removingId === item.productId ? '...' : '🗑️'}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div style={styles.orderSummary}>
                            <h2 style={styles.summaryTitle}>Order Summary</h2>
                            
                            <div style={styles.summaryContent}>
                                <div style={styles.summaryRow}>
                                    <span>Subtotal</span>
                                    <span>{rupiah.format(subtotal)}</span>
                                </div>
                                <div style={styles.summaryRow}>
                                    <span>Tax (10%)</span>
                                    <span>{rupiah.format(tax)}</span>
                                </div>
                                <div style={styles.summaryRow}>
                                    <span>Shipping</span>
                                    <span style={{ color: shipping === 0 ? '#10b981' : '#1f2937' }}>
                                        {shipping === 0 ? 'FREE' : rupiah.format(shipping)}
                                    </span>
                                </div>
                                {shipping > 0 && (
                                    <div style={styles.shippingHint}>
                                        ✨ Add {rupiah.format(500000 - subtotal)} more for free shipping
                                    </div>
                                )}
                                
                                <div style={styles.divider} />
                                
                                <div style={{ ...styles.summaryRow, ...styles.totalRow }}>
                                    <span>Total</span>
                                    <span style={styles.totalAmount}>{rupiah.format(total)}</span>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={loading || items.length === 0}
                                    style={styles.checkoutBtn}
                                >
                                    {loading ? (
                                        <span style={styles.loadingSpinner}>⏳</span>
                                    ) : (
                                        'Proceed to Checkout'
                                    )}
                                </button>

                                <div style={styles.paymentMethods}>
                                    <p>We accept:</p>
                                    <div style={styles.paymentIcons}>
                                        <span>💳 Visa</span>
                                        <span>💳 Mastercard</span>
                                        <span>🏦 Bank Transfer</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer style={styles.footer}>
                <div style={styles.footerContent}>
                    <p style={styles.footerText}>
                        &copy; {new Date().getFullYear()} User Dashboard. All rights reserved.
                    </p>
                    <p style={styles.footerInfo}>
                        Secure checkout powered by SSL encryption 🔒
                    </p>
                </div>
            </footer>

            {/* CSS Hover Effects */}
            <style jsx>{`
                button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .remove-btn:hover {
                    background-color: #fee2e2 !important;
                    border-color: #fecaca !important;
                }
                .checkout-btn:hover {
                    background-color: #059669 !important;
                    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3) !important;
                }
                .cart-item:hover {
                    transform: translateX(5px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .qty-btn:hover {
                    background-color: #f3f4f6 !important;
                }
            `}</style>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f5f7fa',
        padding: '20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '25px',
        borderBottom: '1px solid #e5e7eb'
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
    },
    avatar: {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#4f46e5',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: '600'
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        margin: '0',
        color: '#1f2937',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
    },
    subtitle: {
        color: '#6b7280',
        margin: '5px 0 0 0',
        fontSize: '14px'
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
    },
    userRole: {
        display: 'flex',
        alignItems: 'center'
    },
    roleBadge: {
        backgroundColor: '#dbeafe',
        color: '#1e40af',
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '500',
        border: '1px solid #bfdbfe'
    },
    navLink: {
        color: '#4f46e5',
        textDecoration: 'none',
        fontWeight: '500',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    },
    statsContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
    },
    statCard: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        transition: 'transform 0.3s ease'
    },
    statIcon: {
        fontSize: '28px',
        width: '50px',
        height: '50px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    statNumber: {
        fontSize: '22px',
        fontWeight: '700',
        margin: '0 0 5px 0',
        color: '#1f2937'
    },
    statLabel: {
        color: '#6b7280',
        margin: '0',
        fontSize: '13px'
    },
    mainContent: {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px 20px'
    },
    emptyIcon: {
        fontSize: '64px',
        marginBottom: '20px',
        opacity: '0.6'
    },
    emptyTitle: {
        fontSize: '24px',
        fontWeight: '600',
        color: '#374151',
        margin: '0 0 10px 0'
    },
    emptyText: {
        color: '#6b7280',
        fontSize: '16px',
        margin: '0 0 24px 0'
    },
    shopNowBtn: {
        display: 'inline-block',
        padding: '12px 32px',
        backgroundColor: '#4f46e5',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '8px',
        fontWeight: '500',
        fontSize: '16px',
        transition: 'all 0.3s ease'
    },
    cartLayout: {
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '30px'
    },
    cartItems: {
        flex: 1
    },
    cartHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    cartTitle: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#1f2937',
        margin: 0
    },
    clearHint: {
        fontSize: '13px',
        color: '#9ca3af'
    },
    cartItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        marginBottom: '12px',
        transition: 'all 0.3s ease',
        border: '1px solid transparent'
    },
    itemImageContainer: {
        width: '80px',
        height: '80px',
        flexShrink: 0
    },
    itemImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '8px'
    },
    itemImagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#4f46e5',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: '600',
        borderRadius: '8px'
    },
    itemDetails: {
        flex: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    itemInfo: {
        flex: 1
    },
    itemName: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#1f2937',
        margin: '0 0 6px 0'
    },
    itemPrice: {
        fontSize: '15px',
        fontWeight: '500',
        color: '#4f46e5',
        margin: '0 0 4px 0'
    },
    lowStock: {
        fontSize: '12px',
        color: '#dc2626',
        backgroundColor: '#fee2e2',
        padding: '2px 8px',
        borderRadius: '12px',
        display: 'inline-block'
    },
    quantityControls: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginLeft: '20px'
    },
    qtyBtn: {
        width: '32px',
        height: '32px',
        border: '1px solid #e5e7eb',
        backgroundColor: 'white',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease'
    },
    qtyValue: {
        minWidth: '30px',
        textAlign: 'center',
        fontWeight: '500',
        color: '#1f2937'
    },
    itemSubtotal: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#059669',
        marginLeft: '12px'
    },
    removeBtn: {
        width: '36px',
        height: '36px',
        border: '1px solid #e5e7eb',
        backgroundColor: 'white',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        flexShrink: 0
    },
    orderSummary: {
        backgroundColor: '#f9fafb',
        borderRadius: '16px',
        padding: '24px',
        height: 'fit-content',
        position: 'sticky',
        top: '20px'
    },
    summaryTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1f2937',
        margin: '0 0 20px 0',
        paddingBottom: '12px',
        borderBottom: '1px solid #e5e7eb'
    },
    summaryContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    summaryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '14px',
        color: '#6b7280'
    },
    totalRow: {
        marginTop: '8px',
        paddingTop: '16px',
        borderTop: '2px solid #e5e7eb',
        fontSize: '16px'
    },
    totalAmount: {
        fontWeight: '700',
        color: '#1f2937',
        fontSize: '20px'
    },
    divider: {
        height: '1px',
        backgroundColor: '#e5e7eb',
        margin: '16px 0 8px 0'
    },
    shippingHint: {
        fontSize: '12px',
        color: '#4f46e5',
        backgroundColor: '#eef2ff',
        padding: '8px 12px',
        borderRadius: '6px',
        marginTop: '4px'
    },
    checkoutBtn: {
        width: '100%',
        padding: '14px',
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        marginTop: '8px'
    },
    loadingSpinner: {
        display: 'inline-block',
        animation: 'spin 1s linear infinite'
    },
    paymentMethods: {
        marginTop: '20px',
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '8px'
    },
    paymentIcons: {
        display: 'flex',
        gap: '12px',
        marginTop: '8px',
        fontSize: '13px',
        color: '#4b5563'
    },
    footer: {
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid #e5e7eb'
    },
    footerContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    footerText: {
        color: '#6b7280',
        fontSize: '14px',
        margin: '0'
    },
    footerInfo: {
        color: '#9ca3af',
        fontSize: '13px',
        margin: '0'
    }
};