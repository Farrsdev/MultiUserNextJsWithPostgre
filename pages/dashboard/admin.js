import { getServerSession } from "next-auth/next";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { authOptions } from "../api/auth/[...nextauth]";
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

    let products = [];
    try {
        const protocol = context.req.headers['x-forwarded-proto'] || 'http';
        const host = context.req.headers['x-forwarded-host'] || context.req.headers.host;
        const baseUrl = `${protocol}://${host}`;

        const res = await fetch(`${baseUrl}/api/products`, {
            headers: {
                cookie: context.req.headers.cookie || '',
            },
        });

        if (res.ok) {
            products = await res.json();
        }
    } catch (err) {
        console.error("Gagal ambil products di server:", err);
    }

    return { props: { products } };
}

export default function AdminDashboard({ products: initialProducts = [] }) {
    const { data: session } = useSession();
    const router = useRouter();
    const [products, setProducts] = useState(initialProducts);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

    const handleLogout = async () => {
        await signOut({
            redirect: true,
            callbackUrl: "/login",
        });
    };

    const handleDelete = async (id) => {
        if (!confirm("Yakin ingin menghapus produk ini?")) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) throw new Error("Gagal menghapus produk");

            setProducts((prev) => prev.filter((p) => p.id !== id));

            // Show success message
            alert("Produk berhasil dihapus!");
        } catch (err) {
            console.error(err);
            alert("Gagal menghapus produk");
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleEdit = (id) => {
        router.push(`/dashboard/products/edit?id=${id}`);
    };

    const filteredProducts = products
        .filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.price.toString().includes(searchTerm)
        )
        .sort((a, b) => {
            if (sortConfig.key === 'price') {
                return sortConfig.direction === 'asc' ? a.price - b.price : b.price - a.price;
            }
            if (sortConfig.key === 'name') {
                return sortConfig.direction === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            }
            if (sortConfig.key === 'stock') {
                return sortConfig.direction === 'asc' ? a.stock - b.stock : b.stock - a.stock;
            }
            if (sortConfig.key === 'createdAt') {
                return sortConfig.direction === 'asc'
                    ? new Date(a.createdAt) - new Date(b.createdAt)
                    : new Date(b.createdAt) - new Date(a.createdAt);
            }
            return 0;
        });

    // Calculate stats
    const stats = {
        totalProducts: products.length,
        totalValue: products.reduce((sum, p) => sum + p.price, 0),
        totalStock: products.reduce((sum, p) => sum + (p.stock || 0), 0),
        outOfStock: products.filter(p => (p.stock || 0) <= 0).length
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.userProfile}>
                        <div style={styles.avatar}>
                            {session?.user?.name?.charAt(0)?.toUpperCase() ||
                                session?.user?.email?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                        <div>
                            <h1 style={styles.title}>
                                Welcome, <span style={styles.userName}>{session?.user?.name?.trim() || session?.user?.email?.split('@')[0]}</span>
                            </h1>
                            <div style={styles.userInfo}>
                                <span style={styles.roleBadge}>👑 Administrator</span>
                                <span style={styles.lastLogin}>Last login: Today</span>
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

            {/* Main Content Area */}
            <div style={styles.mainArea}>
                {/* Stats Overview */}
                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <div style={{ ...styles.statIcon, backgroundColor: '#e3f2fd' }}>
                            📦
                        </div>
                        <div>
                            <h3 style={styles.statNumber}>{stats.totalProducts}</h3>
                            <p style={styles.statLabel}>Total Produk</p>
                        </div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={{ ...styles.statIcon, backgroundColor: '#e8f5e9' }}>
                            💰
                        </div>
                        <div>
                            <h3 style={styles.statNumber}>{rupiah.format(stats.totalValue)}</h3>
                            <p style={styles.statLabel}>Total Nilai</p>
                        </div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={{ ...styles.statIcon, backgroundColor: '#fff3e0' }}>
                            📊
                        </div>
                        <div>
                            <h3 style={styles.statNumber}>{stats.totalStock}</h3>
                            <p style={styles.statLabel}>Total Stok</p>
                        </div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={{ ...styles.statIcon, backgroundColor: '#ffebee' }}>
                            ⚠️
                        </div>
                        <div>
                            <h3 style={styles.statNumber}>{stats.outOfStock}</h3>
                            <p style={styles.statLabel}>Habis Stok</p>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div style={styles.chartsSection}>
                    {/* Stock Distribution Chart */}
                    <div style={styles.chartCard}>
                        <h3 style={styles.chartTitle}>📈 Distribusi Stok Produk</h3>
                        <div style={styles.chartContainer}>
                            <div style={styles.barChart}>
                                {products.slice(0, 5).map((product, index) => {
                                    const maxStock = Math.max(...products.map(p => p.stock || 0));
                                    const barHeight = maxStock > 0 ? ((product.stock || 0) / maxStock) * 100 : 0;
                                    const colors = ['#4f46e5', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
                                    return (
                                        <div key={product.id} style={styles.barContainer}>
                                            <div style={styles.barWrapper}>
                                                <div
                                                    style={{
                                                        ...styles.bar,
                                                        height: `${barHeight}%`,
                                                        backgroundColor: colors[index % colors.length]
                                                    }}
                                                />
                                            </div>
                                            <span style={styles.barLabel}>{product.name?.substring(0, 10) || 'Product'}</span>
                                            <span style={styles.barValue}>{product.stock || 0}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Price Range Chart */}
                    <div style={styles.chartCard}>
                        <h3 style={styles.chartTitle}>💵 Kategori Harga</h3>
                        <div style={styles.pieChartContainer}>
                            {(() => {
                                const priceRanges = [
                                    { label: '< 50K', min: 0, max: 50000, color: '#4f46e5' },
                                    { label: '50K - 100K', min: 50000, max: 100000, color: '#8b5cf6' },
                                    { label: '100K - 500K', min: 100000, max: 500000, color: '#06b6d4' },
                                    { label: '> 500K', min: 500000, max: Infinity, color: '#10b981' }
                                ];
                                const rangeCounts = priceRanges.map(range =>
                                    products.filter(p => p.price >= range.min && p.price < range.max).length
                                );
                                const total = rangeCounts.reduce((a, b) => a + b, 0) || 1;

                                return (
                                    <>
                                        <div style={styles.pieChart}>
                                            {priceRanges.map((range, index) => {
                                                const percentage = (rangeCounts[index] / total) * 100;
                                                if (percentage === 0) return null;
                                                return (
                                                    <div
                                                        key={index}
                                                        style={{
                                                            ...styles.pieSlice,
                                                            backgroundColor: range.color,
                                                            width: `${percentage}%`,
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                        <div style={styles.legendContainer}>
                                            {priceRanges.map((range, index) => (
                                                <div key={index} style={styles.legendItem}>
                                                    <span style={{ ...styles.legendDot, backgroundColor: range.color }} />
                                                    <span style={styles.legendLabel}>{range.label}</span>
                                                    <span style={styles.legendValue}>{rangeCounts[index]} produk</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div style={styles.chartCard}>
                        <h3 style={styles.chartTitle}>🕐 Aktivitas Terbaru</h3>
                        <div style={styles.activityList}>
                            {products.slice(0, 5).map((product, index) => (
                                <div key={product.id} style={styles.activityItem}>
                                    <div style={styles.activityIcon}>📦</div>
                                    <div style={styles.activityContent}>
                                        <span style={styles.activityText}>Produk ditambahkan</span>
                                        <span style={styles.activityName}>{product.name}</span>
                                    </div>
                                    <span style={styles.activityTime}>
                                        {new Date(product.createdAt).toLocaleDateString('id-ID')}
                                    </span>
                                </div>
                            ))}
                            {products.length === 0 && (
                                <div style={styles.emptyActivity}>Belum ada aktivitas</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={styles.quickActions}>
                    <button
                        onClick={() => router.push('/dashboard/products/create')}
                        style={styles.primaryAction}
                    >
                        <span style={styles.actionIcon}>➕</span>
                        Tambah Produk Baru
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/admin/orders')}
                        style={styles.secondaryAction}
                    >
                        <span style={styles.actionIcon}>📋</span>
                        Lihat Semua Pesanan
                    </button>
                </div>

                {/* Spacer to push footer to bottom */}
                <div style={styles.spacer} />
            </div>

            {/* Footer */}
            <footer style={styles.footer}>
                <div style={styles.footerContent}>
                    <p style={styles.footerText}>
                        &copy; {new Date().getFullYear()} Admin Dashboard v1.0
                    </p>
                    <div style={styles.footerInfo}>
                        <span style={styles.footerStat}>
                            🔐 {session?.user?.email}
                        </span>
                        <span style={styles.footerStat}>
                            🕐 {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8fafc',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
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
        width: '60px',
        height: '60px',
        borderRadius: '12px',
        backgroundColor: '#4f46e5',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: '600',
        boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)'
    },
    title: {
        fontSize: '22px',
        fontWeight: '600',
        margin: '0',
        color: '#1f2937'
    },
    userName: {
        color: '#4f46e5',
        fontWeight: '700'
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginTop: '8px'
    },
    roleBadge: {
        backgroundColor: '#f3e8ff',
        color: '#7c3aed',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        padding: '30px',
        backgroundColor: 'transparent'
    },
    statCard: {
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        transition: 'all 0.3s ease'
    },
    statIcon: {
        width: '60px',
        height: '60px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px'
    },
    statNumber: {
        fontSize: '28px',
        fontWeight: '700',
        margin: '0 0 5px 0',
        color: '#1f2937'
    },
    statLabel: {
        color: '#6b7280',
        margin: '0',
        fontSize: '14px'
    },
    quickActions: {
        display: 'flex',
        gap: '15px',
        padding: '0 30px 30px',
        flexWrap: 'wrap'
    },
    primaryAction: {
        padding: '12px 24px',
        backgroundColor: '#4f46e5',
        color: 'white',
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
    secondaryAction: {
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
    actionIcon: {
        fontSize: '16px'
    },
    mainArea: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
    },
    spacer: {
        flex: 1
    },
    mainContent: {
        backgroundColor: 'white',
        margin: '0 30px 30px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        overflow: 'hidden'
    },
    contentHeader: {
        padding: '25px',
        borderBottom: '1px solid #e5e7eb'
    },
    contentTitle: {
        fontSize: '20px',
        fontWeight: '600',
        margin: '0 0 20px 0',
        color: '#1f2937'
    },
    controls: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
    },
    searchBox: {
        flex: 1,
        maxWidth: '400px',
        position: 'relative'
    },
    searchIcon: {
        position: 'absolute',
        left: '15px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#9ca3af',
        fontSize: '16px'
    },
    searchInput: {
        width: '100%',
        padding: '12px 20px 12px 45px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '14px',
        transition: 'all 0.3s ease'
    },
    filterBadge: {
        padding: '8px 16px',
        backgroundColor: '#f3f4f6',
        color: '#6b7280',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '500'
    },
    tableWrapper: {
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: '800px'
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
        color: '#374151',
        cursor: 'pointer',
        userSelect: 'none'
    },
    tableRow: {
        borderBottom: '1px solid #f3f4f6',
        transition: 'background-color 0.2s ease'
    },
    tableCell: {
        padding: '20px',
        fontSize: '14px',
        color: '#4b5563'
    },
    productCell: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    productAvatar: {
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        backgroundColor: '#4f46e5',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: '600',
        flexShrink: 0
    },
    productName: {
        fontWeight: '500',
        color: '#1f2937',
        marginBottom: '4px'
    },
    productDescription: {
        fontSize: '13px',
        color: '#6b7280',
        lineHeight: '1.4'
    },
    priceCell: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
    },
    price: {
        fontWeight: '600',
        color: '#1f2937',
        fontSize: '15px'
    },
    stockCell: {
        display: 'flex',
        alignItems: 'center'
    },
    stockBadge: {
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '600',
        display: 'inline-block'
    },
    dateCell: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    timeText: {
        fontSize: '12px',
        color: '#9ca3af'
    },
    actionButtons: {
        display: 'flex',
        gap: '8px'
    },
    editBtn: {
        padding: '8px 16px',
        backgroundColor: '#eff6ff',
        color: '#1d4ed8',
        border: '1px solid #bfdbfe',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 0.3s ease'
    },
    deleteBtn: {
        padding: '8px 16px',
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        border: '1px solid #fecaca',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 0.3s ease'
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px 20px'
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
        margin: '0 0 20px 0'
    },
    emptyAction: {
        padding: '12px 24px',
        backgroundColor: '#4f46e5',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    },
    chartsSection: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        padding: '0 30px 30px'
    },
    chartCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },
    chartTitle: {
        fontSize: '16px',
        fontWeight: '600',
        margin: '0 0 20px 0',
        color: '#1f2937'
    },
    chartContainer: {
        height: '200px'
    },
    barChart: {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: '100%',
        gap: '10px'
    },
    barContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        maxWidth: '60px'
    },
    barWrapper: {
        height: '140px',
        width: '100%',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
    },
    bar: {
        width: '100%',
        borderRadius: '6px 6px 0 0',
        minHeight: '4px',
        transition: 'height 0.3s ease'
    },
    barLabel: {
        fontSize: '11px',
        color: '#6b7280',
        marginTop: '8px',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%'
    },
    barValue: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#1f2937'
    },
    pieChartContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    pieChart: {
        display: 'flex',
        height: '30px',
        borderRadius: '6px',
        overflow: 'hidden',
        backgroundColor: '#f3f4f6'
    },
    pieSlice: {
        height: '100%',
        transition: 'width 0.3s ease'
    },
    legendContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    legendItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    legendDot: {
        width: '12px',
        height: '12px',
        borderRadius: '3px'
    },
    legendLabel: {
        flex: 1,
        fontSize: '13px',
        color: '#4b5563'
    },
    legendValue: {
        fontSize: '13px',
        fontWeight: '500',
        color: '#1f2937'
    },
    activityList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    activityItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px'
    },
    activityIcon: {
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        backgroundColor: '#eef2ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px'
    },
    activityContent: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
    },
    activityText: {
        fontSize: '12px',
        color: '#6b7280'
    },
    activityName: {
        fontSize: '13px',
        fontWeight: '500',
        color: '#1f2937'
    },
    activityTime: {
        fontSize: '12px',
        color: '#9ca3af'
    },
    emptyActivity: {
        textAlign: 'center',
        padding: '40px 20px',
        color: '#9ca3af',
        fontSize: '14px'
    },
    footer: {
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
        padding: '20px 30px'
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
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
    },
    footerStat: {
        fontSize: '13px',
        color: '#9ca3af',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
    },
    productImage: {
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        objectFit: 'cover',
        marginRight: '12px',
        border: '1px solid #e5e7eb',
    },
};

// Tambahkan hover effects dan animations
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .logout-btn:hover {
            background-color: #dc2626 !important;
            color: white !important;
        }
        
        .primary-action:hover {
            background-color: #4338ca !important;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3) !important;
        }
        
        .secondary-action:hover {
            border-color: #4f46e5 !important;
            color: #4f46e5 !important;
        }
        
        .edit-btn:hover {
            background-color: #dbeafe !important;
            border-color: #93c5fd !important;
        }
        
        .delete-btn:hover {
            background-color: #fecaca !important;
            border-color: #fca5a5 !important;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
        }
        
        .table-row:hover {
            background-color: #f8fafc !important;
        }
        
        .search-input:focus {
            outline: none;
            border-color: #4f46e5 !important;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
        }
        
        .table-header:hover {
            background-color: #f3f4f6;
        }
        
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .stat-card {
            animation: fadeIn 0.5s ease-out;
        }
        
        .table-row {
            animation: fadeIn 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
}