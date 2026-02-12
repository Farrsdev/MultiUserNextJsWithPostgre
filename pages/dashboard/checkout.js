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

export default function CheckoutPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const { paymentId } = router.query;
    
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState('bank_transfer');
    const [countdown, setCountdown] = useState(null);
    const [showVirtualAccount, setShowVirtualAccount] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, processing, success, expired

    useEffect(() => {
        if (paymentId) {
            fetchPaymentDetails();
        }
    }, [paymentId]);

    useEffect(() => {
        if (payment?.expiresAt) {
            const interval = setInterval(() => {
                const now = new Date().getTime();
                const expiry = new Date(payment.expiresAt).getTime();
                const distance = expiry - now;

                if (distance < 0) {
                    setCountdown("EXPIRED");
                    setPaymentStatus('expired');
                    clearInterval(interval);
                } else {
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [payment]);

    const fetchPaymentDetails = async () => {
        try {
            const res = await fetch(`/api/payment/confirm?paymentId=${paymentId}`);
            if (res.ok) {
                const data = await res.json();
                setPayment(data);
                if (data.status === 'expired') setPaymentStatus('expired');
                if (data.status === 'completed') setPaymentStatus('success');
            }
        } catch (error) {
            console.error('Failed to fetch payment:', error);
        }
    };

    const initiateCheckout = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/checkout', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                router.push(`/dashboard/checkout?paymentId=${data.paymentId}`);
            } else {
                const error = await res.json();
                alert(error.error || 'Checkout gagal');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const simulatePayment = async () => {
        setPaymentStatus('processing');
        setLoading(true);
        
        try {
            // Show virtual account details
            setShowVirtualAccount(true);
            
            // Simulate user clicking "Pay Now" after seeing VA
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const res = await fetch('/api/payment/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    paymentId: payment.id, 
                    method: selectedMethod 
                })
            });

            if (res.ok) {
                setPaymentStatus('success');
                setTimeout(() => {
                    router.push('/dashboard/orders');
                }, 2000);
            } else {
                const error = await res.json();
                alert(error.error || 'Pembayaran gagal');
                setPaymentStatus('pending');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Terjadi kesalahan saat pembayaran');
            setPaymentStatus('pending');
        } finally {
            setLoading(false);
        }
    };

    // If no payment initiated, show cart summary to start checkout
    if (!paymentId) {
        return <CheckoutSummary onCheckout={initiateCheckout} loading={loading} />;
    }

    // Payment expired
    if (paymentStatus === 'expired') {
        return (
            <div style={styles.container}>
                <div style={styles.paymentCard}>
                    <div style={{ ...styles.iconCircle, backgroundColor: '#fee2e2' }}>
                        <span style={{ fontSize: '48px' }}>⏰</span>
                    </div>
                    <h2 style={{ ...styles.title, color: '#dc2626' }}>Pembayaran Kadaluarsa</h2>
                    <p style={styles.subtitle}>Waktu pembayaran telah habis</p>
                    <button 
                        onClick={() => router.push('/dashboard/cart')}
                        style={styles.primaryButton}
                    >
                        Kembali ke Cart
                    </button>
                </div>
            </div>
        );
    }

    // Payment success
    if (paymentStatus === 'success') {
        return (
            <div style={styles.container}>
                <div style={styles.paymentCard}>
                    <div style={{ ...styles.iconCircle, backgroundColor: '#dcfce7' }}>
                        <span style={{ fontSize: '48px' }}>✅</span>
                    </div>
                    <h2 style={{ ...styles.title, color: '#059669' }}>Pembayaran Berhasil!</h2>
                    <p style={styles.subtitle}>Pesanan Anda sedang diproses</p>
                    <p style={styles.orderId}>Order ID: {payment?.orderId}</p>
                    <div style={styles.buttonGroup}>
                        <button 
                            onClick={() => router.push('/dashboard/orders')}
                            style={styles.primaryButton}
                        >
                            Lihat Pesanan
                        </button>
                        <button 
                            onClick={() => router.push('/dashboard/user')}
                            style={styles.secondaryButton}
                        >
                            Belanja Lagi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Payment pending - show payment instructions
    return (
        <div style={styles.container}>
            <div style={styles.checkoutLayout}>
                {/* Left Column - Payment Instructions */}
                <div style={styles.paymentSection}>
                    <div style={styles.paymentHeader}>
                        <h1 style={styles.title}>💳 Selesaikan Pembayaran</h1>
                        <div style={styles.timerContainer}>
                            <span style={styles.timerLabel}>Sisa Waktu:</span>
                            <span style={styles.timer}>{countdown || '30:00'}</span>
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div style={styles.methodSection}>
                        <h3 style={styles.sectionTitle}>Metode Pembayaran</h3>
                        <div style={styles.methodGrid}>
                            {[
                                { id: 'bank_transfer', name: 'Bank Transfer', icon: '🏦', desc: 'BCA, Mandiri, BNI, BRI' },
                                { id: 'virtual_account', name: 'Virtual Account', icon: '🏧', desc: 'BCA VA, Mandiri VA' },
                                { id: 'ewallet', name: 'E-Wallet', icon: '📱', desc: 'GoPay, OVO, Dana' },
                                { id: 'credit_card', name: 'Kartu Kredit', icon: '💳', desc: 'Visa, Mastercard' }
                            ].map(method => (
                                <label 
                                    key={method.id}
                                    style={{
                                        ...styles.methodCard,
                                        ...(selectedMethod === method.id ? styles.methodCardActive : {})
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value={method.id}
                                        checked={selectedMethod === method.id}
                                        onChange={(e) => setSelectedMethod(e.target.value)}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={styles.methodIcon}>{method.icon}</div>
                                    <div style={styles.methodInfo}>
                                        <span style={styles.methodName}>{method.name}</span>
                                        <span style={styles.methodDesc}>{method.desc}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Virtual Account Details (shown when simulating) */}
                    {showVirtualAccount && selectedMethod.includes('bank') && (
                        <div style={styles.vaSection}>
                            <h3 style={styles.sectionTitle}>🏧 Detail Virtual Account</h3>
                            <div style={styles.vaCard}>
                                <div style={styles.vaRow}>
                                    <span style={styles.vaLabel}>Bank</span>
                                    <span style={styles.vaValue}>Bank Central Asia (BCA)</span>
                                </div>
                                <div style={styles.vaRow}>
                                    <span style={styles.vaLabel}>Virtual Account</span>
                                    <span style={styles.vaNumber}>88012 1234567890</span>
                                </div>
                                <div style={styles.vaRow}>
                                    <span style={styles.vaLabel}>Total Pembayaran</span>
                                    <span style={styles.vaAmount}>{rupiah.format(payment?.amount || 0)}</span>
                                </div>
                                <div style={styles.vaDivider} />
                                <p style={styles.vaInstruction}>
                                    1. Buka aplikasi BCA mobile atau internet banking<br/>
                                    2. Pilih menu Transfer ke Virtual Account<br/>
                                    3. Masukkan nomor VA di atas<br/>
                                    4. Konfirmasi pembayaran
                                </p>
                            </div>
                        </div>
                    )}

                    {/* E-Wallet QR (shown when simulating) */}
                    {showVirtualAccount && selectedMethod === 'ewallet' && (
                        <div style={styles.vaSection}>
                            <h3 style={styles.sectionTitle}>📱 Scan QR Code</h3>
                            <div style={styles.qrCard}>
                                <div style={styles.qrPlaceholder}>
                                    <span style={{ fontSize: '64px' }}>📱</span>
                                    <div style={styles.qrCode}>[QR CODE SIMULASI]</div>
                                </div>
                                <p style={styles.qrAmount}>Total: {rupiah.format(payment?.amount || 0)}</p>
                                <p style={styles.qrInstruction}>
                                    Scan QR code dengan aplikasi GoPay/OVO/Dana
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Payment Button */}
                    <div style={styles.paymentAction}>
                        {!showVirtualAccount ? (
                            <button
                                onClick={simulatePayment}
                                disabled={loading}
                                style={styles.payButton}
                            >
                                {loading ? 'Memproses...' : 'Bayar Sekarang'}
                            </button>
                        ) : (
                            <button
                                onClick={simulatePayment}
                                disabled={loading || paymentStatus === 'processing'}
                                style={{
                                    ...styles.payButton,
                                    backgroundColor: '#059669'
                                }}
                            >
                                {loading ? 'Memverifikasi Pembayaran...' : 'Konfirmasi Pembayaran'}
                            </button>
                        )}
                        
                        <p style={styles.paymentNote}>
                            ⏰ Selesaikan pembayaran dalam {countdown || '30:00'} menit
                        </p>
                    </div>
                </div>

                {/* Right Column - Order Summary */}
                <div style={styles.summarySection}>
                    <div style={styles.summaryCard}>
                        <h3 style={styles.summaryTitle}>Ringkasan Pesanan</h3>
                        
                        <div style={styles.summaryContent}>
                            {payment?.items?.map((item, idx) => (
                                <div key={idx} style={styles.summaryItem}>
                                    <div style={styles.itemInfo}>
                                        <span style={styles.itemName}>{item.productName}</span>
                                        <span style={styles.itemQty}>x{item.quantity}</span>
                                    </div>
                                    <span style={styles.itemPrice}>
                                        {rupiah.format(item.price * item.quantity)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div style={styles.divider} />

                        <div style={styles.totalSection}>
                            <div style={styles.totalRow}>
                                <span>Subtotal</span>
                                <span>{rupiah.format(payment?.amount ? payment.amount - (payment.amount * 0.1) - (payment.amount > 500000 ? 0 : 15000) : 0)}</span>
                            </div>
                            <div style={styles.totalRow}>
                                <span>PPN (10%)</span>
                                <span>{rupiah.format(Math.round((payment?.amount || 0) * 0.1))}</span>
                            </div>
                            <div style={styles.totalRow}>
                                <span>Ongkir</span>
                                <span style={{ color: (payment?.amount || 0) > 500000 ? '#10b981' : '#1f2937' }}>
                                    {(payment?.amount || 0) > 500000 ? 'FREE' : rupiah.format(15000)}
                                </span>
                            </div>
                            <div style={{ ...styles.totalRow, ...styles.grandTotal }}>
                                <span>Total</span>
                                <span style={styles.totalAmount}>
                                    {rupiah.format(payment?.amount || 0)}
                                </span>
                            </div>
                        </div>

                        <div style={styles.orderInfo}>
                            <p style={styles.orderId}>
                                Order ID: {payment?.orderId}
                            </p>
                            <p style={styles.orderDate}>
                                {new Date(payment?.createdAt).toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Cart Summary Component (when no payment initiated)
function CheckoutSummary({ onCheckout, loading }) {
    const router = useRouter();
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        const res = await fetch('/api/cart');
        if (res.ok) setCartItems(await res.json());
    };

    const subtotal = cartItems.reduce((sum, it) => sum + (it.quantity * (it.product?.price || 0)), 0);
    const tax = subtotal * 0.1;
    const shipping = subtotal > 500000 ? 0 : 15000;
    const total = subtotal + tax + shipping;

    return (
        <div style={styles.container}>
            <div style={styles.checkoutLayout}>
                <div style={styles.paymentSection}>
                    <div style={styles.paymentHeader}>
                        <h1 style={styles.title}>🛍️ Checkout</h1>
                        <p style={styles.subtitle}>Review pesanan Anda sebelum checkout</p>
                    </div>

                    <div style={styles.cartItems}>
                        {cartItems.map(item => (
                            <div key={item.id} style={styles.checkoutItem}>
                                <div style={styles.itemImagePlaceholder}>
                                    {item.product?.name?.charAt(0)}
                                </div>
                                <div style={styles.itemDetails}>
                                    <h4 style={styles.itemName}>{item.product?.name}</h4>
                                    <p style={styles.itemPrice}>{rupiah.format(item.product?.price || 0)}</p>
                                </div>
                                <div style={styles.itemQuantity}>
                                    <span>{item.quantity}x</span>
                                    <span style={styles.itemSubtotal}>
                                        {rupiah.format(item.quantity * (item.product?.price || 0))}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={styles.summarySection}>
                    <div style={styles.summaryCard}>
                        <h3 style={styles.summaryTitle}>Ringkasan Belanja</h3>
                        
                        <div style={styles.totalSection}>
                            <div style={styles.totalRow}>
                                <span>Subtotal</span>
                                <span>{rupiah.format(subtotal)}</span>
                            </div>
                            <div style={styles.totalRow}>
                                <span>PPN (10%)</span>
                                <span>{rupiah.format(tax)}</span>
                            </div>
                            <div style={styles.totalRow}>
                                <span>Ongkir</span>
                                <span style={{ color: shipping === 0 ? '#10b981' : '#1f2937' }}>
                                    {shipping === 0 ? 'FREE' : rupiah.format(shipping)}
                                </span>
                            </div>
                            <div style={{ ...styles.totalRow, ...styles.grandTotal }}>
                                <span>Total</span>
                                <span style={styles.totalAmount}>
                                    {rupiah.format(total)}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={onCheckout}
                            disabled={loading || cartItems.length === 0}
                            style={styles.checkoutButton}
                        >
                            {loading ? (
                                <span style={styles.loadingSpinner}>⏳ Memproses...</span>
                            ) : (
                                'Lanjut ke Pembayaran'
                            )}
                        </button>

                        <button
                            onClick={() => router.push('/dashboard/cart')}
                            style={styles.backButton}
                        >
                            Kembali ke Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        padding: '30px',
        fontFamily: "'Inter', sans-serif"
    },
    checkoutLayout: {
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '30px',
        maxWidth: '1400px',
        margin: '0 auto'
    },
    paymentSection: {
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
    },
    paymentHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #e5e7eb'
    },
    title: {
        fontSize: '24px',
        fontWeight: '700',
        margin: 0,
        color: '#1f2937'
    },
    subtitle: {
        color: '#6b7280',
        margin: '5px 0 0 0',
        fontSize: '14px'
    },
    timerContainer: {
        backgroundColor: '#fef3c7',
        padding: '10px 20px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    timerLabel: {
        color: '#92400e',
        fontSize: '14px',
        fontWeight: '500'
    },
    timer: {
        color: '#dc2626',
        fontSize: '20px',
        fontWeight: '700',
        fontFamily: 'monospace'
    },
    methodSection: {
        marginBottom: '30px'
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1f2937',
        margin: '0 0 20px 0'
    },
    methodGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '15px'
    },
    methodCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        padding: '20px',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backgroundColor: 'white'
    },
    methodCardActive: {
        borderColor: '#4f46e5',
        backgroundColor: '#eef2ff'
    },
    methodIcon: {
        fontSize: '28px'
    },
    methodInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    methodName: {
        fontWeight: '600',
        color: '#1f2937',
        fontSize: '14px'
    },
    methodDesc: {
        fontSize: '12px',
        color: '#6b7280'
    },
    vaSection: {
        marginTop: '20px'
    },
    vaCard: {
        backgroundColor: '#f9fafb',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid #e5e7eb'
    },
    vaRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
    },
    vaLabel: {
        color: '#6b7280',
        fontSize: '14px'
    },
    vaValue: {
        color: '#1f2937',
        fontSize: '14px',
        fontWeight: '500'
    },
    vaNumber: {
        fontFamily: 'monospace',
        fontSize: '20px',
        fontWeight: '700',
        color: '#4f46e5',
        letterSpacing: '2px'
    },
    vaAmount: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#059669'
    },
    vaDivider: {
        height: '1px',
        backgroundColor: '#e5e7eb',
        margin: '20px 0'
    },
    vaInstruction: {
        color: '#4b5563',
        fontSize: '14px',
        lineHeight: '1.8',
        margin: 0
    },
    qrCard: {
        backgroundColor: '#f9fafb',
        padding: '30px',
        borderRadius: '16px',
        textAlign: 'center'
    },
    qrPlaceholder: {
        width: '200px',
        height: '200px',
        backgroundColor: 'white',
        margin: '0 auto 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        border: '2px dashed #e5e7eb'
    },
    qrCode: {
        marginTop: '10px',
        color: '#9ca3af',
        fontSize: '12px'
    },
    qrAmount: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#1f2937',
        margin: '0 0 10px 0'
    },
    qrInstruction: {
        color: '#6b7280',
        fontSize: '14px',
        margin: 0
    },
    paymentAction: {
        marginTop: '30px'
    },
    payButton: {
        width: '100%',
        padding: '16px',
        backgroundColor: '#4f46e5',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        marginBottom: '12px'
    },
    paymentNote: {
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '13px',
        margin: 0
    },
    summarySection: {
        position: 'sticky',
        top: '30px',
        alignSelf: 'start'
    },
    summaryCard: {
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
    },
    summaryTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1f2937',
        margin: '0 0 20px 0',
        paddingBottom: '15px',
        borderBottom: '1px solid #e5e7eb'
    },
    summaryContent: {
        marginBottom: '20px'
    },
    summaryItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
    },
    itemInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    itemQty: {
        fontSize: '12px',
        color: '#6b7280'
    },
    divider: {
        height: '1px',
        backgroundColor: '#e5e7eb',
        margin: '20px 0'
    },
    totalSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    totalRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '14px',
        color: '#6b7280'
    },
    grandTotal: {
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '2px solid #e5e7eb',
        fontSize: '16px'
    },
    totalAmount: {
        fontWeight: '700',
        color: '#1f2937',
        fontSize: '20px'
    },
    orderInfo: {
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '12px'
    },
    orderId: {
        fontSize: '13px',
        color: '#4b5563',
        margin: '0 0 4px 0',
        wordBreak: 'break-all'
    },
    orderDate: {
        fontSize: '12px',
        color: '#9ca3af',
        margin: 0
    },
    checkoutItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        marginBottom: '12px'
    },
    itemImagePlaceholder: {
        width: '50px',
        height: '50px',
        backgroundColor: '#4f46e5',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        fontWeight: '600',
        borderRadius: '10px'
    },
    itemDetails: {
        flex: 1
    },
    itemQuantity: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '4px'
    },
    itemSubtotal: {
        fontWeight: '600',
        color: '#059669',
        fontSize: '14px'
    },
    checkoutButton: {
        width: '100%',
        padding: '16px',
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        marginTop: '20px'
    },
    backButton: {
        width: '100%',
        padding: '12px',
        backgroundColor: 'white',
        color: '#6b7280',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        marginTop: '12px'
    },
    paymentCard: {
        maxWidth: '500px',
        margin: '50px auto',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '24px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        textAlign: 'center'
    },
    iconCircle: {
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px'
    },
    buttonGroup: {
        display: 'flex',
        gap: '12px',
        marginTop: '24px'
    },
    primaryButton: {
        flex: 1,
        padding: '14px',
        backgroundColor: '#4f46e5',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    },
    secondaryButton: {
        flex: 1,
        padding: '14px',
        backgroundColor: 'white',
        color: '#4f46e5',
        border: '2px solid #4f46e5',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    }
};