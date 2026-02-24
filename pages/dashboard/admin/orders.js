import { getServerSession } from "next-auth/next";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { authOptions } from "../../api/auth/[...nextauth]";
import { useRouter } from "next/router";

const rupiah = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
});

export async function getServerSideProps(context) {
    const session = await getServerSession(context.req, context.res, authOptions);

    if (!session || session.user.role !== "admin") {
        return {
            redirect: {
                destination: "/login",
                permanent: false,
            },
        };
    }

    let orders = [];
    try {
        const protocol = context.req.headers['x-forwarded-proto'] || 'http';
        const host = context.req.headers['x-forwarded-host'] || context.req.headers.host;
        const baseUrl = `${protocol}://${host}`;

        const res = await fetch(`${baseUrl}/api/admin/orders`, {
            headers: {
                cookie: context.req.headers.cookie || '',
            },
        });

        if (res.ok) {
            orders = await res.json();
        }
    } catch (err) {
        console.error("Gagal ambil orders di server:", err);
    }

    return { props: { orders } };
}

export default function AdminOrders({ orders: initialOrders = [] }) {
    const { data: session } = useSession();
    const router = useRouter();
    const [orders, setOrders] = useState(initialOrders);
    const [loading, setLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    const statusConfig = {
        pending: {
            label: '⏳ Pending',
            color: '#f59e0b',
            bg: '#fffbeb',
            border: '#fcd34d',
            next: ['processing', 'cancelled']
        },
        processing: {
            label: '🔄 Processing',
            color: '#3b82f6',
            bg: '#eff6ff',
            border: '#93c5fd',
            next: ['shipped', 'cancelled']
        },
        shipped: {
            label: '📦 Shipped',
            color: '#8b5cf6',
            bg: '#f5f3ff',
            border: '#c4b5fd',
            next: ['delivered', 'cancelled']
        },
        delivered: {
            label: '✅ Delivered',
            color: '#10b981',
            bg: '#f0fdf4',
            border: '#a7f3d0',
            next: []
        },
        cancelled: {
            label: '❌ Cancelled',
            color: '#ef4444',
            bg: '#fef2f2',
            border: '#fecaca',
            next: []
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/orders');
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

    const handleUpdateStatus = async (orderId, newStatus) => {
        if (!confirm(`Yakin ingin mengubah status order ke ${statusConfig[newStatus]?.label}?`)) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/admin/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status: newStatus })
            });

            if (res.ok) {
                const updatedOrder = await res.json();
                setOrders(orders.map(order =>
                    order.id === orderId ? updatedOrder : order
                ));

                if (selectedOrder?.id === orderId) {
                    setSelectedOrder(updatedOrder);
                }

                alert(`✅ Status berhasil diubah ke ${statusConfig[newStatus]?.label}`);
            } else {
                const error = await res.json();
                alert(error.error || 'Gagal mengupdate status');
            }
        } catch (error) {
            console.error('Update status error:', error);
            alert('Terjadi kesalahan saat mengupdate status');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkStatusUpdate = async (orderIds, newStatus) => {
        if (!confirm(`Yakin ingin mengubah ${orderIds.length} order ke ${statusConfig[newStatus]?.label}?`)) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/admin/orders/bulk', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderIds, status: newStatus })
            });

            if (res.ok) {
                await fetchOrders();
                alert(`✅ ${orderIds.length} order berhasil diupdate`);
            }
        } catch (error) {
            console.error('Bulk update error:', error);
            alert('Gagal melakukan bulk update');
        } finally {
            setLoading(false);
        }
    };

    const getOrderStats = () => {
        return {
            total: orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            processing: orders.filter(o => o.status === 'processing').length,
            shipped: orders.filter(o => o.status === 'shipped').length,
            delivered: orders.filter(o => o.status === 'delivered').length,
            cancelled: orders.filter(o => o.status === 'cancelled').length,
            revenue: orders
                .filter(o => o.status === 'delivered')
                .reduce((sum, o) => sum + o.total, 0)
        };
    };

    const stats = getOrderStats();

    // Filter orders
    const filteredOrders = orders
        .filter(order => filterStatus === "all" || order.status === filterStatus)
        .filter(order => {
            if (!searchTerm) return true;
            const searchLower = searchTerm.toLowerCase();
            return (
                order.id.toLowerCase().includes(searchLower) ||
                order.user?.name?.toLowerCase().includes(searchLower) ||
                order.user?.email?.toLowerCase().includes(searchLower) ||
                order.items?.some(item =>
                    item.product?.name?.toLowerCase().includes(searchLower)
                )
            );
        })
        .filter(order => {
            if (!dateRange.start && !dateRange.end) return true;
            const orderDate = new Date(order.createdAt);
            const start = dateRange.start ? new Date(dateRange.start) : null;
            const end = dateRange.end ? new Date(dateRange.end) : null;

            if (start && end) {
                return orderDate >= start && orderDate <= end;
            } else if (start) {
                return orderDate >= start;
            } else if (end) {
                return orderDate <= end;
            }
            return true;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const handleLogout = async () => {
        await signOut({ redirect: true, callbackUrl: "/login" });
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.userProfile}>
                        <div style={styles.avatar}>
                            {session?.user?.name?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                        <div>
                            <h1 style={styles.title}>
                                📋 Order Management
                            </h1>
                            <div style={styles.userInfo}>
                                <span style={styles.roleBadge}>👑 Administrator</span>
                                <span style={styles.lastLogin}>Manage customer orders</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={styles.headerActions}>
                    <button
                        onClick={() => router.push('/dashboard/admin')}
                        style={{
                            ...styles.navButton,
                            ...(router.pathname === '/dashboard/admin' ? styles.navButtonActive : {})
                        }}
                    >
                        <span>📊</span>
                        Dashboard
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/products')}
                        style={{
                            ...styles.navButton,
                            ...(router.pathname.includes('/products') ? styles.navButtonActive : {})
                        }}
                    >
                        <span>📦</span>
                        Products
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/admin/orders')}
                        style={{
                            ...styles.navButton,
                            ...(router.pathname.includes('/admin/orders') ? styles.navButtonActive : {})
                        }}
                    >
                        <span>📋</span>
                        Orders
                    </button>
                    <button onClick={handleLogout} style={styles.logoutBtn}>
                        <span>🚪</span>
                        Logout
                    </button>
                </div>
            </header>

            {/* Stats Overview */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: '#e0f2fe' }}>
                        📦
                    </div>
                    <div>
                        <h3 style={styles.statNumber}>{stats.total}</h3>
                        <p style={styles.statLabel}>Total Orders</p>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: '#fffbeb' }}>
                        ⏳
                    </div>
                    <div>
                        <h3 style={styles.statNumber}>{stats.pending}</h3>
                        <p style={styles.statLabel}>Pending</p>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: '#eff6ff' }}>
                        🔄
                    </div>
                    <div>
                        <h3 style={styles.statNumber}>{stats.processing}</h3>
                        <p style={styles.statLabel}>Processing</p>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: '#f5f3ff' }}>
                        📦
                    </div>
                    <div>
                        <h3 style={styles.statNumber}>{stats.shipped}</h3>
                        <p style={styles.statLabel}>Shipped</p>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: '#f0fdf4' }}>
                        ✅
                    </div>
                    <div>
                        <h3 style={styles.statNumber}>{stats.delivered}</h3>
                        <p style={styles.statLabel}>Delivered</p>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: '#fef2f2' }}>
                        💰
                    </div>
                    <div>
                        <h3 style={styles.statNumber}>{rupiah.format(stats.revenue)}</h3>
                        <p style={styles.statLabel}>Revenue</p>
                    </div>
                </div>
            </div>

            {/* Quick Status Filters */}
            <div style={styles.quickFilters}>
                <button
                    onClick={() => setFilterStatus("all")}
                    style={{
                        ...styles.filterChip,
                        ...(filterStatus === "all" ? styles.filterChipActive : {})
                    }}
                >
                    All Orders ({stats.total})
                </button>
                {Object.entries(statusConfig).map(([key, config]) => (
                    <button
                        key={key}
                        onClick={() => setFilterStatus(key)}
                        style={{
                            ...styles.filterChip,
                            ...(filterStatus === key ? {
                                backgroundColor: config.bg,
                                borderColor: config.color,
                                color: config.color
                            } : {})
                        }}
                    >
                        {config.label} ({stats[key]})
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <main style={styles.mainContent}>
                {/* Search & Filter Bar */}
                <div style={styles.searchBar}>
                    <div style={styles.searchBox}>
                        <span style={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search by order ID, customer name, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>

                    <div style={styles.dateFilter}>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            style={styles.dateInput}
                        />
                        <span style={styles.dateSeparator}>-</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            style={styles.dateInput}
                        />
                        {(dateRange.start || dateRange.end) && (
                            <button
                                onClick={() => setDateRange({ start: "", end: "" })}
                                style={styles.clearDateBtn}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <button
                        onClick={fetchOrders}
                        style={styles.refreshBtn}
                        disabled={loading}
                    >
                        🔄 Refresh
                    </button>
                </div>

                {/* Orders Table */}
                <div style={styles.tableWrapper}>
                    {loading && filteredOrders.length === 0 ? (
                        <div style={styles.loadingState}>
                            <div style={styles.loadingSpinner}>⏳</div>
                            <p>Loading orders...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}>📭</div>
                            <h3 style={styles.emptyTitle}>No Orders Found</h3>
                            <p style={styles.emptyText}>
                                {searchTerm || filterStatus !== "all" || dateRange.start || dateRange.end
                                    ? "No orders match your filters"
                                    : "There are no orders yet"}
                            </p>
                        </div>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.tableHeaderRow}>
                                    <th style={styles.tableHeader}>Order ID</th>
                                    <th style={styles.tableHeader}>Customer</th>
                                    <th style={styles.tableHeader}>Date & Time</th>
                                    <th style={styles.tableHeader}>Items</th>
                                    <th style={styles.tableHeader}>Total</th>
                                    <th style={styles.tableHeader}>Status</th>
                                    <th style={styles.tableHeader}>Payment</th>
                                    <th style={styles.tableHeader}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => {
                                    const status = statusConfig[order.status] || statusConfig.pending;
                                    const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

                                    return (
                                        <tr key={order.id} style={styles.tableRow}>
                                            <td style={styles.tableCell}>
                                                <div style={styles.orderIdCell}>
                                                    <span style={styles.orderId}>
                                                        #{order.id.slice(-8).toUpperCase()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={styles.tableCell}>
                                                <div style={styles.customerCell}>
                                                    <div style={styles.customerAvatar}>
                                                        {order.user?.name?.charAt(0) || order.user?.email?.charAt(0) || 'U'}
                                                    </div>
                                                    <div style={styles.customerInfo}>
                                                        <span style={styles.customerName}>
                                                            {order.user?.name || 'No name'}
                                                        </span>
                                                        <span style={styles.customerEmail}>
                                                            {order.user?.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={styles.tableCell}>
                                                <div style={styles.dateCell}>
                                                    <div style={styles.date}>
                                                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </div>
                                                    <div style={styles.time}>
                                                        {new Date(order.createdAt).toLocaleTimeString('id-ID', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={styles.tableCell}>
                                                <div style={styles.itemsCell}>
                                                    <span style={styles.itemCount}>
                                                        {itemCount} {itemCount > 1 ? 'items' : 'item'}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setShowDetailModal(true);
                                                        }}
                                                        style={styles.viewDetailsBtn}
                                                    >
                                                        View Details
                                                    </button>
                                                </div>
                                            </td>
                                            <td style={styles.tableCell}>
                                                <span style={styles.totalPrice}>
                                                    {rupiah.format(order.total)}
                                                </span>
                                            </td>
                                            <td style={styles.tableCell}>
                                                <div style={styles.statusCell}>
                                                    <span style={{
                                                        ...styles.statusBadge,
                                                        backgroundColor: status.bg,
                                                        color: status.color,
                                                        borderColor: status.border
                                                    }}>
                                                        {status.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={styles.tableCell}>
                                                <div style={styles.paymentCell}>
                                                    {order.payment ? (
                                                        <>
                                                            <span style={styles.paymentMethod}>
                                                                {order.payment.method === 'bank_transfer' ? '🏦 Bank Transfer' :
                                                                    order.payment.method === 'virtual_account' ? '🏧 VA' :
                                                                        order.payment.method === 'ewallet' ? '📱 E-Wallet' :
                                                                            order.payment.method === 'credit_card' ? '💳 Credit Card' : '💵 Cash'}
                                                            </span>
                                                            <span style={styles.paymentStatus}>
                                                                {order.payment.status === 'completed' ? '✅ Paid' : '⏳ Pending'}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span style={styles.noPayment}>No payment</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={styles.tableCell}>
                                                <div style={styles.actionButtons}>
                                                    <select
                                                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                                        value=""
                                                        disabled={loading}
                                                        style={styles.statusSelect}
                                                    >
                                                        <option value="" disabled>Change Status</option>
                                                        {Object.entries(statusConfig).map(([key, config]) => (
                                                            <option key={key} value={key}>
                                                                {config.label}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <button
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setShowDetailModal(true);
                                                        }}
                                                        style={styles.detailBtn}
                                                        title="View Details"
                                                    >
                                                        👁️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Info */}
                <div style={styles.tableFooter}>
                    <span style={styles.showingInfo}>
                        Showing {filteredOrders.length} of {orders.length} orders
                    </span>
                    <div style={styles.bulkActions}>
                        <select
                            onChange={(e) => {
                                if (e.target.value) {
                                    handleBulkStatusUpdate(
                                        filteredOrders.map(o => o.id),
                                        e.target.value
                                    );
                                }
                                e.target.value = '';
                            }}
                            disabled={loading || filteredOrders.length === 0}
                            style={styles.bulkSelect}
                        >
                            <option value="">Bulk Update Status</option>
                            <option value="processing">🔄 Set to Processing</option>
                            <option value="shipped">📦 Set to Shipped</option>
                            <option value="delivered">✅ Set to Delivered</option>
                            <option value="cancelled">❌ Set to Cancelled</option>
                        </select>
                    </div>
                </div>
            </main>

            {/* Order Detail Modal */}
            {showDetailModal && selectedOrder && (
                <div style={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>
                                Order Details #{selectedOrder.id.slice(-8).toUpperCase()}
                            </h2>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                style={styles.modalCloseBtn}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={styles.modalContent}>
                            {/* Customer Info */}
                            <div style={styles.modalSection}>
                                <h3 style={styles.sectionTitle}>👤 Customer Information</h3>
                                <div style={styles.infoGrid}>
                                    <div style={styles.infoRow}>
                                        <span style={styles.infoLabel}>Name:</span>
                                        <span style={styles.infoValue}>{selectedOrder.user?.name || '-'}</span>
                                    </div>
                                    <div style={styles.infoRow}>
                                        <span style={styles.infoLabel}>Email:</span>
                                        <span style={styles.infoValue}>{selectedOrder.user?.email || '-'}</span>
                                    </div>
                                    <div style={styles.infoRow}>
                                        <span style={styles.infoLabel}>Order Date:</span>
                                        <span style={styles.infoValue}>
                                            {new Date(selectedOrder.createdAt).toLocaleString('id-ID', {
                                                dateStyle: 'full',
                                                timeStyle: 'medium'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div style={styles.modalSection}>
                                <h3 style={styles.sectionTitle}>🛒 Order Items</h3>
                                <div style={styles.itemsList}>
                                    {selectedOrder.items?.map((item, idx) => (
                                        <div key={idx} style={styles.modalOrderItem}>
                                            <div style={styles.modalItemInfo}>
                                                <span style={styles.modalItemName}>
                                                    {item.product?.name || 'Unknown Product'}
                                                </span>
                                                <span style={styles.modalItemQty}>x{item.quantity}</span>
                                            </div>
                                            <span style={styles.modalItemPrice}>
                                                {rupiah.format(item.price * item.quantity)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div style={styles.totalSummary}>
                                    <div style={styles.summaryRow}>
                                        <span>Subtotal</span>
                                        <span>{rupiah.format(selectedOrder.total * 0.89)}</span>
                                    </div>
                                    <div style={styles.summaryRow}>
                                        <span>Tax (10%)</span>
                                        <span>{rupiah.format(selectedOrder.total * 0.1)}</span>
                                    </div>
                                    <div style={styles.summaryRow}>
                                        <span>Shipping</span>
                                        <span>{selectedOrder.total > 500000 ? 'FREE' : rupiah.format(15000)}</span>
                                    </div>
                                    <div style={{ ...styles.summaryRow, ...styles.totalRow }}>
                                        <span>Total</span>
                                        <span style={styles.totalAmount}>{rupiah.format(selectedOrder.total)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div style={styles.modalSection}>
                                <h3 style={styles.sectionTitle}>💳 Payment Information</h3>
                                <div style={styles.infoGrid}>
                                    <div style={styles.infoRow}>
                                        <span style={styles.infoLabel}>Payment Method:</span>
                                        <span style={styles.infoValue}>
                                            {selectedOrder.payment?.method === 'bank_transfer' ? 'Bank Transfer' :
                                                selectedOrder.payment?.method === 'virtual_account' ? 'Virtual Account' :
                                                    selectedOrder.payment?.method === 'ewallet' ? 'E-Wallet' :
                                                        selectedOrder.payment?.method === 'credit_card' ? 'Credit Card' : '-'}
                                        </span>
                                    </div>
                                    <div style={styles.infoRow}>
                                        <span style={styles.infoLabel}>Payment Status:</span>
                                        <span style={{
                                            ...styles.paymentStatusBadge,
                                            backgroundColor: selectedOrder.payment?.status === 'completed' ? '#f0fdf4' : '#fffbeb',
                                            color: selectedOrder.payment?.status === 'completed' ? '#059669' : '#b45309'
                                        }}>
                                            {selectedOrder.payment?.status === 'completed' ? '✅ Paid' : '⏳ Pending'}
                                        </span>
                                    </div>
                                    {selectedOrder.payment?.paidAt && (
                                        <div style={styles.infoRow}>
                                            <span style={styles.infoLabel}>Paid At:</span>
                                            <span style={styles.infoValue}>
                                                {new Date(selectedOrder.payment.paidAt).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status Update */}
                            <div style={styles.modalSection}>
                                <h3 style={styles.sectionTitle}>📊 Update Order Status</h3>
                                <div style={styles.statusUpdateGrid}>
                                    {Object.entries(statusConfig).map(([key, config]) => {
                                        const isCurrent = selectedOrder.status === key;
                                        const isDisabled = !statusConfig[selectedOrder.status]?.next.includes(key) &&
                                            selectedOrder.status !== key &&
                                            key !== 'cancelled';

                                        return (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    handleUpdateStatus(selectedOrder.id, key);
                                                    setShowDetailModal(false);
                                                }}
                                                disabled={isDisabled || isCurrent || loading}
                                                style={{
                                                    ...styles.statusOption,
                                                    backgroundColor: isCurrent ? config.color : config.bg,
                                                    color: isCurrent ? 'white' : config.color,
                                                    borderColor: config.color,
                                                    opacity: isDisabled ? 0.5 : 1,
                                                    cursor: isDisabled ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {config.label}
                                                {isCurrent && ' (Current)'}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p style={styles.statusHint}>
                                    💡 Status can only be changed sequentially: Pending → Processing → Shipped → Delivered
                                </p>
                            </div>
                        </div>

                        <div style={styles.modalFooter}>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                style={styles.modalCloseBtnSecondary}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: "'Inter', sans-serif",
        paddingBottom: '30px'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 30px',
        backgroundColor: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        borderBottom: '1px solid #e5e7eb'
    },
    headerLeft: {
        flex: 1
    },
    userProfile: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
    },
    avatar: {
        width: '50px',
        height: '50px',
        borderRadius: '12px',
        backgroundColor: '#4f46e5',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '22px',
        fontWeight: '600'
    },
    title: {
        fontSize: '24px',
        fontWeight: '700',
        margin: '0',
        color: '#1f2937'
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginTop: '5px'
    },
    roleBadge: {
        backgroundColor: '#f3e8ff',
        color: '#7c3aed',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '500'
    },
    lastLogin: {
        fontSize: '13px',
        color: '#6b7280'
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
    },
    secondaryBtn: {
        padding: '10px 20px',
        backgroundColor: 'white',
        color: '#4b5563',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.3s ease'
    },
    navButton: {
        padding: '10px 20px',
        backgroundColor: 'white',
        color: '#4b5563',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease'
    },
    navButtonActive: {
        backgroundColor: '#4f46e5',
        color: 'white',
        borderColor: '#4f46e5'
    },
    logoutBtn: {
        padding: '10px 20px',
        backgroundColor: '#fee2e2',
        color: '#dc2626',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.3s ease'
    },
    logoutIcon: {
        fontSize: '16px'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '20px',
        padding: '30px 30px 20px'
    },
    statCard: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        transition: 'all 0.3s ease'
    },
    statIcon: {
        width: '50px',
        height: '50px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px'
    },
    statNumber: {
        fontSize: '24px',
        fontWeight: '700',
        margin: '0 0 5px 0',
        color: '#1f2937'
    },
    statLabel: {
        color: '#6b7280',
        margin: '0',
        fontSize: '13px'
    },
    quickFilters: {
        display: 'flex',
        gap: '10px',
        padding: '0 30px 20px',
        flexWrap: 'wrap'
    },
    filterChip: {
        padding: '8px 20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '30px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        color: '#6b7280'
    },
    filterChipActive: {
        backgroundColor: '#4f46e5',
        color: 'white',
        borderColor: '#4f46e5'
    },
    mainContent: {
        backgroundColor: 'white',
        margin: '0 30px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        overflow: 'hidden'
    },
    searchBar: {
        display: 'flex',
        gap: '15px',
        padding: '20px',
        borderBottom: '1px solid #e5e7eb',
        flexWrap: 'wrap'
    },
    searchBox: {
        flex: 1,
        minWidth: '250px',
        position: 'relative'
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
        padding: '12px 20px 12px 45px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '14px',
        transition: 'all 0.3s ease'
    },
    dateFilter: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        position: 'relative'
    },
    dateInput: {
        padding: '12px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '13px',
        width: '140px'
    },
    dateSeparator: {
        color: '#9ca3af'
    },
    clearDateBtn: {
        padding: '6px 10px',
        backgroundColor: '#f3f4f6',
        border: 'none',
        borderRadius: '6px',
        color: '#6b7280',
        fontSize: '12px',
        cursor: 'pointer'
    },
    refreshBtn: {
        padding: '12px 24px',
        backgroundColor: 'white',
        color: '#4b5563',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.3s ease'
    },
    tableWrapper: {
        overflowX: 'auto',
        minHeight: '400px'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: '1200px'
    },
    tableHeaderRow: {
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb'
    },
    tableHeader: {
        padding: '16px 20px',
        textAlign: 'left',
        fontSize: '13px',
        fontWeight: '600',
        color: '#374151'
    },
    tableRow: {
        borderBottom: '1px solid #f3f4f6',
        transition: 'background-color 0.2s ease'
    },
    tableCell: {
        padding: '16px 20px',
        fontSize: '14px',
        color: '#4b5563'
    },
    orderIdCell: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    orderId: {
        fontWeight: '600',
        color: '#4f46e5',
        fontSize: '13px'
    },
    customerCell: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    customerAvatar: {
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        backgroundColor: '#4f46e5',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: '600'
    },
    customerInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
    },
    customerName: {
        fontWeight: '500',
        color: '#1f2937'
    },
    customerEmail: {
        fontSize: '12px',
        color: '#6b7280'
    },
    dateCell: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    date: {
        color: '#1f2937',
        fontSize: '13px'
    },
    time: {
        fontSize: '12px',
        color: '#9ca3af'
    },
    itemsCell: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    itemCount: {
        fontWeight: '500',
        color: '#1f2937'
    },
    viewDetailsBtn: {
        padding: '4px 12px',
        backgroundColor: '#f3f4f6',
        color: '#4b5563',
        border: 'none',
        borderRadius: '4px',
        fontSize: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    totalPrice: {
        fontWeight: '600',
        color: '#059669',
        fontSize: '15px'
    },
    statusCell: {
        display: 'flex',
        alignItems: 'center'
    },
    statusBadge: {
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        border: '1px solid'
    },
    paymentCell: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    paymentMethod: {
        fontSize: '13px',
        color: '#1f2937'
    },
    paymentStatus: {
        fontSize: '12px',
        color: '#059669'
    },
    noPayment: {
        fontSize: '12px',
        color: '#9ca3af',
        fontStyle: 'italic'
    },
    actionButtons: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    statusSelect: {
        padding: '8px 12px',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        fontSize: '12px',
        backgroundColor: 'white',
        cursor: 'pointer',
        minWidth: '130px'
    },
    detailBtn: {
        padding: '8px 12px',
        backgroundColor: '#eff6ff',
        color: '#1d4ed8',
        border: '1px solid #bfdbfe',
        borderRadius: '6px',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    tableFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderTop: '1px solid #e5e7eb'
    },
    showingInfo: {
        fontSize: '13px',
        color: '#6b7280'
    },
    bulkActions: {
        display: 'flex',
        gap: '10px'
    },
    bulkSelect: {
        padding: '10px 16px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '13px',
        backgroundColor: 'white',
        cursor: 'pointer',
        minWidth: '180px'
    },
    loadingState: {
        textAlign: 'center',
        padding: '80px 20px',
        color: '#6b7280'
    },
    loadingSpinner: {
        fontSize: '40px',
        marginBottom: '20px',
        animation: 'spin 1s linear infinite'
    },
    emptyState: {
        textAlign: 'center',
        padding: '80px 20px'
    },
    emptyIcon: {
        fontSize: '48px',
        marginBottom: '20px',
        opacity: '0.5'
    },
    emptyTitle: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#6b7280',
        margin: '0 0 10px 0'
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: '14px',
        margin: '0'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        borderBottom: '1px solid #e5e7eb'
    },
    modalTitle: {
        fontSize: '20px',
        fontWeight: '600',
        margin: 0,
        color: '#1f2937'
    },
    modalCloseBtn: {
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: '#f3f4f6',
        color: '#6b7280',
        fontSize: '16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease'
    },
    modalContent: {
        padding: '24px'
    },
    modalSection: {
        marginBottom: '24px'
    },
    sectionTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#1f2937',
        margin: '0 0 16px 0'
    },
    infoGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: '#f9fafb',
        padding: '16px',
        borderRadius: '12px'
    },
    infoRow: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '12px'
    },
    infoLabel: {
        minWidth: '120px',
        fontSize: '13px',
        color: '#6b7280'
    },
    infoValue: {
        fontSize: '14px',
        color: '#1f2937',
        fontWeight: '500'
    },
    itemsList: {
        backgroundColor: '#f9fafb',
        padding: '16px',
        borderRadius: '12px',
        marginBottom: '16px'
    },
    modalOrderItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px solid #e5e7eb'
    },
    modalItemInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
    },
    modalItemName: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#1f2937'
    },
    modalItemQty: {
        fontSize: '12px',
        color: '#6b7280'
    },
    modalItemPrice: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#059669'
    },
    totalSummary: {
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
    },
    summaryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
        fontSize: '13px',
        color: '#6b7280'
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
    paymentStatusBadge: {
        padding: '4px 12px',
        borderRadius: '16px',
        fontSize: '12px',
        fontWeight: '500'
    },
    statusUpdateGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '12px'
    },
    statusOption: {
        padding: '12px',
        border: '2px solid',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backgroundColor: 'white'
    },
    statusHint: {
        fontSize: '12px',
        color: '#6b7280',
        margin: '12px 0 0 0',
        fontStyle: 'italic'
    },
    modalFooter: {
        padding: '20px 24px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'flex-end'
    },
    modalCloseBtnSecondary: {
        padding: '10px 24px',
        backgroundColor: '#f3f4f6',
        color: '#4b5563',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    }
};

// Add CSS animations
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
        }
        
        .table-row:hover {
            background-color: #f8fafc !important;
        }
        
        .status-option:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .search-input:focus {
            outline: none;
            border-color: #4f46e5 !important;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        
        .view-details-btn:hover {
            background-color: #e5e7eb !important;
        }
        
        .filter-chip:hover {
            background-color: #f3f4f6;
            border-color: #9ca3af;
        }
        
        .filter-chip-active:hover {
            background-color: #4338ca !important;
        }
    `;
    document.head.appendChild(style);
}