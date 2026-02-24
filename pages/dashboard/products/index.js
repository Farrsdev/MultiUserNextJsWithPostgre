import { getServerSession } from "next-auth/next";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
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

export default function ProductsPage({ products: initialProducts = [] }) {
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
                                <span style={styles.userName}>Products Management</span>
                            </h1>
                            <div style={styles.userInfo}>
                                <span style={styles.roleBadge}>👑 Administrator</span>
                                <span style={styles.lastLogin}>{stats.totalProducts} products</span>
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

            {/* Quick Actions */}
            <div style={styles.quickActions}>
                <button
                    onClick={() => router.push('/dashboard/products/create')}
                    style={styles.primaryAction}
                >
                    <span style={styles.actionIcon}>➕</span>
                    Tambah Produk Baru
                </button>
            </div>

            {/* Main Content */}
            <main style={styles.mainContent}>
                <div style={styles.contentHeader}>
                    <h2 style={styles.contentTitle}>Manajemen Produk</h2>
                    <div style={styles.controls}>
                        <div style={styles.searchBox}>
                            <span style={styles.searchIcon}>🔍</span>
                            <input
                                type="text"
                                placeholder="Cari produk..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={styles.searchInput}
                            />
                        </div>
                        <div style={styles.filterBadge}>
                            Menampilkan {filteredProducts.length} dari {products.length} produk
                        </div>
                    </div>
                </div>

                <div style={styles.tableWrapper}>
                    {filteredProducts.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}>📦</div>
                            <h3 style={styles.emptyTitle}>
                                {searchTerm ? "Produk tidak ditemukan" : "Belum ada produk"}
                            </h3>
                            <p style={styles.emptyText}>
                                {searchTerm
                                    ? `Tidak ada hasil untuk "${searchTerm}"`
                                    : "Mulai dengan menambahkan produk pertama Anda"}
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={() => router.push('/dashboard/products/create')}
                                    style={styles.emptyAction}
                                >
                                    + Tambah Produk Pertama
                                </button>
                            )}
                        </div>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.tableHeaderRow}>
                                    <th style={styles.tableHeader}>
                                        No
                                    </th>
                                    <th style={styles.tableHeader} onClick={() => handleSort('name')}>
                                        Nama Produk {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th style={styles.tableHeader} onClick={() => handleSort('price')}>
                                        Harga {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th style={styles.tableHeader} onClick={() => handleSort('stock')}>
                                        Stok {sortConfig.key === 'stock' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th style={styles.tableHeader} onClick={() => handleSort('createdAt')}>
                                        Dibuat {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th style={styles.tableHeader}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product, index) => (
                                    <tr key={product.id} style={styles.tableRow}>
                                        <td style={styles.tableCell}>
                                            <div style={styles.productCell}>
                                                <div style={styles.productName}>
                                                    {index + 1}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={styles.tableCell}>
                                            <div style={styles.productCell}>
                                                {product.image ? (
                                                    <img
                                                        src={`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${product.image}`}
                                                        alt={product.name}
                                                        style={styles.productImage}
                                                    />
                                                ) : (
                                                    <div style={styles.productAvatar}>
                                                        {product.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={styles.productName}>{product.name}</div>
                                                    <div style={styles.productDescription}>
                                                        {product.description?.substring(0, 50)}
                                                        {product.description?.length > 50 && '...'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={styles.tableCell}>
                                            <div style={styles.priceCell}>
                                                <span style={styles.price}>{rupiah.format(product.price)}</span>
                                            </div>
                                        </td>
                                        <td style={styles.tableCell}>
                                            <div style={styles.stockCell}>
                                                <span style={{
                                                    ...styles.stockBadge,
                                                    backgroundColor: product.stock > 10 ? '#d1fae5' :
                                                        product.stock > 0 ? '#fef3c7' : '#fee2e2',
                                                    color: product.stock > 10 ? '#065f46' :
                                                        product.stock > 0 ? '#92400e' : '#991b1b'
                                                }}>
                                                    {product.stock > 0 ? `${product.stock} unit` : 'Habis'}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={styles.tableCell}>
                                            <div style={styles.dateCell}>
                                                <div>{new Date(product.createdAt).toLocaleDateString('id-ID')}</div>
                                                <div style={styles.timeText}>
                                                    {new Date(product.createdAt).toLocaleTimeString('id-ID', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={styles.tableCell}>
                                            <div style={styles.actionButtons}>
                                                <button
                                                    onClick={() => handleEdit(product.id)}
                                                    style={styles.editBtn}
                                                    title="Edit produk"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    style={styles.deleteBtn}
                                                    disabled={loading}
                                                    title="Hapus produk"
                                                >
                                                    🗑️ Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>

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
        transition: 'all 0.2s ease'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        padding: '30px 30px 0'
    },
    statCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },
    statIcon: {
        width: '56px',
        height: '56px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px'
    },
    statNumber: {
        fontSize: '28px',
        fontWeight: '700',
        margin: '0 0 4px',
        color: '#1f2937'
    },
    statLabel: {
        margin: 0,
        fontSize: '14px',
        color: '#6b7280'
    },
    quickActions: {
        display: 'flex',
        gap: '15px',
        padding: '20px 30px',
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
    actionIcon: {
        fontSize: '16px'
    },
    mainContent: {
        backgroundColor: 'white',
        margin: '0 30px 30px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        overflow: 'hidden'
    },
    contentHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 30px',
        borderBottom: '1px solid #e5e7eb'
    },
    contentTitle: {
        fontSize: '20px',
        fontWeight: '600',
        margin: 0,
        color: '#1f2937'
    },
    controls: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
    },
    searchBox: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    },
    searchIcon: {
        position: 'absolute',
        left: '12px',
        fontSize: '16px'
    },
    searchInput: {
        padding: '10px 16px 10px 40px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '14px',
        width: '280px',
        outline: 'none',
        transition: 'border-color 0.2s ease'
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
    productImage: {
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        objectFit: 'cover'
    },
    productName: {
        fontWeight: '500',
        color: '#1f2937',
        marginBottom: '4px'
    },
    productDescription: {
        fontSize: '13px',
        color: '#6b7280'
    },
    priceCell: {
        display: 'flex',
        alignItems: 'center'
    },
    price: {
        fontWeight: '600',
        color: '#1f2937'
    },
    stockCell: {
        display: 'flex',
        alignItems: 'center'
    },
    stockBadge: {
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '500'
    },
    dateCell: {
        display: 'flex',
        flexDirection: 'column'
    },
    timeText: {
        fontSize: '12px',
        color: '#9ca3af',
        marginTop: '2px'
    },
    actionButtons: {
        display: 'flex',
        gap: '8px'
    },
    editBtn: {
        padding: '6px 12px',
        backgroundColor: '#eff6ff',
        color: '#2563eb',
        border: 'none',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    deleteBtn: {
        padding: '6px 12px',
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        border: 'none',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    emptyState: {
        padding: '60px 20px',
        textAlign: 'center'
    },
    emptyIcon: {
        fontSize: '48px',
        marginBottom: '16px'
    },
    emptyTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1f2937',
        margin: '0 0 8px'
    },
    emptyText: {
        fontSize: '14px',
        color: '#6b7280',
        margin: '0 0 24px'
    },
    emptyAction: {
        padding: '12px 24px',
        backgroundColor: '#4f46e5',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer'
    },
    footer: {
        padding: '20px 30px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: 'white'
    },
    footerContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    footerText: {
        margin: 0,
        fontSize: '13px',
        color: '#6b7280'
    },
    footerInfo: {
        display: 'flex',
        gap: '20px'
    },
    footerStat: {
        fontSize: '13px',
        color: '#6b7280'
    }
};
