import { getServerSession } from "next-auth/next";
import { useEffect, useState } from "react";
import { authOptions } from "../api/auth/[...nextauth].js";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

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

export default function OrdersPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedOrder, setExpandedOrder] = useState(null);

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/orders');
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: '#f59e0b', bg: '#fffbeb', text: '⏳ Pending' },
            processing: { color: '#3b82f6', bg: '#eff6ff', text: '🔄 Processing' },
            shipped: { color: '#8b5cf6', bg: '#f5f3ff', text: '📦 Shipped' },
            delivered: { color: '#10b981', bg: '#f0fdf4', text: '✅ Delivered' },
            cancelled: { color: '#ef4444', bg: '#fef2f2', text: '❌ Cancelled' }
        };
        return statusConfig[status] || { color: '#6b7280', bg: '#f3f4f6', text: '📋 Unknown' };
    };

    const filteredOrders = orders
        .filter(order => filterStatus === "all" || order.status === filterStatus)
        .filter(order => 
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rupiah.format(order.total).includes(searchTerm) ||
            order.items?.some(item => 
                item.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    const completedOrders = orders.filter(o => o.status === 'delivered').length;

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.userInfo}>
                    <div style={styles.avatar}>
                        {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
                    </div>
                    <div>
                        <h1 style={styles.title}>📜 Order History</h1>
                        <p style={styles.subtitle}>Track and manage your orders</p>
                    </div>
                </div>
                <div style={styles.headerActions}>
                    <div style={styles.userRole}>
                        <span style={styles.roleBadge}>User Account</span>
                    </div>
                    <a href="/dashboard/user" style={styles.navLink}>📦 Products</a>
                    <a href="/dashboard/cart" style={styles.navLink}>🛒 Cart</a>
                </div>
            </header>

            {/* Stats Cards */}
            <div style={styles.statsContainer}>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: '#e0f2fe' }}>📦</div>
                    <div>
                        <h3 style={styles.statNumber}>{orders.length}</h3>
                        <p style={styles.statLabel}>Total Orders</p>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: '#dcfce7' }}>✅</div>
                    <div>
                        <h3 style={styles.statNumber}>{completedOrders}</h3>
                        <p style={styles.statLabel}>Completed</p>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: '#fef9c3' }}>💰</div>
                    <div>
                        <h3 style={styles.statNumber}>{rupiah.format(totalSpent)}</h3>
                        <p style={styles.statLabel}>Total Spent</p>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: '#f3e8ff' }}>🎯</div>
                    <div>
                        <h3 style={styles.statNumber}>
                            {orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.items?.length || 0, 0)}
                        </h3>
                        <p style={styles.statLabel}>Items Purchased</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main style={styles.mainContent}>
                {/* Filters */}
                <div style={styles.filtersContainer}>
                    <div style={styles.searchContainer}>
                        <span style={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search orders by ID, product name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>
                    
                    <div style={styles.filterTabs}>
                        <button
                            onClick={() => setFilterStatus("all")}
                            style={{
                                ...styles.filterTab,
                                ...(filterStatus === "all" ? styles.filterTabActive : {})
                            }}
                        >
                            All Orders
                        </button>
                        <button
                            onClick={() => setFilterStatus("pending")}
                            style={{
                                ...styles.filterTab,
                                ...(filterStatus === "pending" ? styles.filterTabActive : {})
                            }}
                        >
                            ⏳ Pending
                        </button>
                        <button
                            onClick={() => setFilterStatus("processing")}
                            style={{
                                ...styles.filterTab,
                                ...(filterStatus === "processing" ? styles.filterTabActive : {})
                            }}
                        >
                            🔄 Processing
                        </button>
                        <button
                            onClick={() => setFilterStatus("shipped")}
                            style={{
                                ...styles.filterTab,
                                ...(filterStatus === "shipped" ? styles.filterTabActive : {})
                            }}
                        >
                            📦 Shipped
                        </button>
                        <button
                            onClick={() => setFilterStatus("delivered")}
                            style={{
                                ...styles.filterTab,
                                ...(filterStatus === "delivered" ? styles.filterTabActive : {})
                            }}
                        >
                            ✅ Delivered
                        </button>
                    </div>
                </div>

                {/* Orders List */}
                {loading ? (
                    <div style={styles.loadingState}>
                        <div style={styles.loadingSpinner}>⏳</div>
                        <p style={styles.loadingText}>Loading your orders...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>📭</div>
                        <h3 style={styles.emptyTitle}>No Orders Found</h3>
                        <p style={styles.emptyText}>
                            {searchTerm || filterStatus !== "all" 
                                ? "No orders match your filters" 
                                : "You haven't placed any orders yet"}
                        </p>
                        {!searchTerm && filterStatus === "all" && (
                            <a href="/dashboard/user" style={styles.shopNowBtn}>
                                Start Shopping →
                            </a>
                        )}
                    </div>
                ) : (
                    <div style={styles.ordersList}>
                        {filteredOrders.map((order) => {
                            const status = getStatusBadge(order.status);
                            const isExpanded = expandedOrder === order.id;
                            
                            return (
                                <div key={order.id} style={styles.orderCard}>
                                    {/* Order Header */}
                                    <div 
                                        style={styles.orderHeader}
                                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                                    >
                                        <div style={styles.orderHeaderLeft}>
                                            <div style={styles.orderIcon}>📋</div>
                                            <div style={styles.orderInfo}>
                                                <div style={styles.orderId}>
                                                    Order #{order.id.slice(-8).toUpperCase()}
                                                </div>
                                                <div style={styles.orderMeta}>
                                                    <span style={styles.orderDate}>
                                                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                    <span style={styles.orderTime}>
                                                        {new Date(order.createdAt).toLocaleTimeString('id-ID', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div style={styles.orderHeaderRight}>
                                            <span style={{
                                                ...styles.statusBadge,
                                                backgroundColor: status.bg,
                                                color: status.color
                                            }}>
                                                {status.text}
                                            </span>
                                            <span style={styles.orderTotal}>
                                                {rupiah.format(order.total)}
                                            </span>
                                            <span style={styles.expandIcon}>
                                                {isExpanded ? '▼' : '▶'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order Items (Expandable) */}
                                    {isExpanded && (
                                        <div style={styles.orderDetails}>
                                            <div style={styles.itemsList}>
                                                <h4 style={styles.itemsTitle}>Items</h4>
                                                {order.items?.map((item) => (
                                                    <div key={item.id} style={styles.orderItem}>
                                                        <div style={styles.itemInfo}>
                                                            {item.product?.imageUrl ? (
                                                                <img 
                                                                    src={item.product.imageUrl} 
                                                                    alt={item.product.name}
                                                                    style={styles.itemThumb}
                                                                />
                                                            ) : (
                                                                <div style={styles.itemThumbPlaceholder}>
                                                                    {item.product?.name?.charAt(0) || 'P'}
                                                                </div>
                                                            )}
                                                            <div style={styles.itemDetails}>
                                                                <span style={styles.itemName}>
                                                                    {item.product?.name}
                                                                </span>
                                                                <span style={styles.itemQuantity}>
                                                                    Qty: {item.quantity}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span style={styles.itemPrice}>
                                                            {rupiah.format(item.price * item.quantity)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div style={styles.orderSummary}>
                                                <div style={styles.summaryRow}>
                                                    <span>Subtotal</span>
                                                    <span>{rupiah.format(order.subtotal || order.total)}</span>
                                                </div>
                                                <div style={styles.summaryRow}>
                                                    <span>Shipping</span>
                                                    <span>{order.shippingCost ? rupiah.format(order.shippingCost) : 'FREE'}</span>
                                                </div>
                                                <div style={{ ...styles.summaryRow, ...styles.totalRow }}>
                                                    <span>Total</span>
                                                    <span style={styles.totalAmount}>{rupiah.format(order.total)}</span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div style={styles.orderActions}>
                                                {order.status === 'delivered' && (
                                                    <button style={styles.reviewBtn}>
                                                        ⭐ Write Review
                                                    </button>
                                                )}
                                                {order.status === 'shipped' && (
                                                    <button style={styles.trackBtn}>
                                                        📍 Track Package
                                                    </button>
                                                )}
                                                {order.status === 'pending' && (
                                                    <button style={styles.cancelBtn}>
                                                        Cancel Order
                                                    </button>
                                                )}
                                                <button style={styles.reorderBtn}>
                                                    ↩️ Reorder
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
                        Showing {filteredOrders.length} of {orders.length} orders
                    </p>
                </div>
            </footer>

            {/* CSS Hover Effects */}
            <style jsx>{`
                .order-card:hover {
                    border-color: #d1d5db !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .filter-tab:hover {
                    background-color: #f3f4f6 !important;
                }
                .shop-now-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
                }
                .review-btn:hover, .track-btn:hover, .reorder-btn:hover {
                    transform: translateY(-2px);
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
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
    filtersContainer: {
        marginBottom: '30px'
    },
    searchContainer: {
        position: 'relative',
        marginBottom: '20px'
    },
    searchIcon: {
        position: 'absolute',
        left: '15px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#9ca3af'
    },
    searchInput: {
        width: '100%',
        padding: '14px 20px 14px 45px',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        fontSize: '15px',
        transition: 'border-color 0.3s ease'
    },
    filterTabs: {
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap'
    },
    filterTab: {
        padding: '10px 20px',
        border: '1px solid #e5e7eb',
        backgroundColor: 'white',
        borderRadius: '30px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        color: '#6b7280'
    },
    filterTabActive: {
        backgroundColor: '#4f46e5',
        color: 'white',
        borderColor: '#4f46e5'
    },
    loadingState: {
        textAlign: 'center',
        padding: '60px 20px'
    },
    loadingSpinner: {
        fontSize: '40px',
        marginBottom: '20px',
        animation: 'spin 1s linear infinite',
        display: 'inline-block'
    },
    loadingText: {
        color: '#6b7280',
        fontSize: '16px',
        margin: 0
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
    ordersList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    orderCard: {
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        backgroundColor: 'white',
        transition: 'all 0.3s ease'
    },
    orderHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease'
    },
    orderHeaderLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
    },
    orderIcon: {
        width: '40px',
        height: '40px',
        backgroundColor: '#f3f4f6',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px'
    },
    orderInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    orderId: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#1f2937'
    },
    orderMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    orderDate: {
        fontSize: '13px',
        color: '#4b5563'
    },
    orderTime: {
        fontSize: '12px',
        color: '#9ca3af'
    },
    orderHeaderRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
    },
    statusBadge: {
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '500'
    },
    orderTotal: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1f2937'
    },
    expandIcon: {
        color: '#9ca3af',
        fontSize: '14px',
        marginLeft: '10px'
    },
    orderDetails: {
        padding: '20px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
    },
    itemsList: {
        marginBottom: '20px'
    },
    itemsTitle: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#374151',
        margin: '0 0 15px 0'
    },
    orderItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px',
        backgroundColor: 'white',
        borderRadius: '8px',
        marginBottom: '8px'
    },
    itemInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    itemThumb: {
        width: '48px',
        height: '48px',
        objectFit: 'cover',
        borderRadius: '6px'
    },
    itemThumbPlaceholder: {
        width: '48px',
        height: '48px',
        backgroundColor: '#4f46e5',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: '600',
        borderRadius: '6px'
    },
    itemDetails: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    itemName: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#1f2937'
    },
    itemQuantity: {
        fontSize: '12px',
        color: '#6b7280'
    },
    itemPrice: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#059669'
    },
    orderSummary: {
        marginTop: '16px',
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '8px'
    },
    summaryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '14px',
        color: '#6b7280',
        marginBottom: '8px'
    },
    totalRow: {
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid #e5e7eb',
        fontSize: '15px'
    },
    totalAmount: {
        fontWeight: '700',
        color: '#1f2937',
        fontSize: '18px'
    },
    orderActions: {
        display: 'flex',
        gap: '12px',
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid #e5e7eb'
    },
    reviewBtn: {
        padding: '10px 20px',
        backgroundColor: '#f59e0b',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    trackBtn: {
        padding: '10px 20px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    cancelBtn: {
        padding: '10px 20px',
        backgroundColor: 'white',
        color: '#ef4444',
        border: '1px solid #fecaca',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    reorderBtn: {
        padding: '10px 20px',
        backgroundColor: 'white',
        color: '#4f46e5',
        border: '1px solid #c7d2fe',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
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