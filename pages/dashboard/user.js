import { getServerSession } from "next-auth/next";
import { signOut, useSession } from "next-auth/react";
import { authOptions } from "../api/auth/[...nextauth]";
import { useState } from "react";

const rupiah = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
});

export async function getServerSideProps(context) {
    const session = await getServerSession(context.req, context.res, authOptions);

    if (!session || session.user.role !== "user") {
        return {
            redirect: {
                destination: "/login",
                permanent: false,
            },
        };
    }

    // Fetch products server-side
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

export default function UserPage({ products = [] }) {
    const { data: session } = useSession();
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("newest");

    const handleLogout = async () => {
        await signOut({
            redirect: true,
            callbackUrl: "/login",
        });
    };

    // Filter dan sort produk
    const filteredProducts = products
        .filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rupiah.format(product.price).includes(searchTerm)
        )
        .sort((a, b) => {
            switch (sortBy) {
                case "price-low":
                    return a.price - b.price;
                case "price-high":
                    return b.price - a.price;
                case "name":
                    return a.name.localeCompare(b.name);
                case "newest":
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

    const handleAddToCart = (product) => {
        // Implementasi cart functionality
        alert(`Added ${product.name} to cart!`);
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div>
                    <div style={styles.userInfo}>
                        <div style={styles.avatar}>
                            {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
                        </div>
                        <div>
                            <h1 style={styles.title}>
                                Hello, {session?.user?.name?.trim() ? session.user.name : session?.user?.email?.split('@')[0] || "User"} 👋
                            </h1>
                            <p style={styles.subtitle}>Welcome to your dashboard</p>
                        </div>
                    </div>
                </div>
                <div style={styles.headerActions}>
                    <div style={styles.userRole}>
                        <span style={styles.roleBadge}>User Account</span>
                    </div>
                    <button onClick={handleLogout} style={styles.logoutBtn}>
                        <span style={styles.logoutIcon}>↩</span> Logout
                    </button>
                </div>
            </header>

            {/* Stats Cards */}
            <div style={styles.statsContainer}>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>📦</div>
                    <div>
                        <h3 style={styles.statNumber}>{products.length}</h3>
                        <p style={styles.statLabel}>Total Products</p>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>💰</div>
                    <div>
                        <h3 style={styles.statNumber}>
                            {rupiah.format(products.reduce((sum, p) => sum + p.price, 0))}
                        </h3>
                        <p style={styles.statLabel}>Total Value</p>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>🆕</div>
                    <div>
                        <h3 style={styles.statNumber}>
                            {new Date(Math.max(...products.map(p => new Date(p.createdAt)))).toLocaleDateString('id-ID')}
                        </h3>
                        <p style={styles.statLabel}>Last Added</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main style={styles.mainContent}>
                <div style={styles.contentHeader}>
                    <h2 style={styles.contentTitle}>Product Catalog</h2>
                    <div style={styles.controls}>
                        <div style={styles.searchContainer}>
                            <span style={styles.searchIcon}>🔍</span>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={styles.searchInput}
                            />
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={styles.sortSelect}
                        >
                            <option value="newest">Newest First</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="name">Name A-Z</option>
                        </select>
                    </div>
                </div>

                <div style={styles.tableContainer}>
                    {filteredProducts.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}>📭</div>
                            <h3 style={styles.emptyTitle}>No Products Found</h3>
                            <p style={styles.emptyText}>
                                {searchTerm ? `No results for "${searchTerm}"` : "No products available"}
                            </p>
                        </div>
                    ) : (
                        <table style={styles.table}>
                            <thead style={styles.tableHead}>
                                <tr>
                                    <th style={styles.tableHeader}>No</th>
                                    <th style={styles.tableHeader}>Product Name</th>
                                    <th style={styles.tableHeader}>Price</th>
                                    <th style={styles.tableHeader}>Created Date</th>
                                    <th style={styles.tableHeader}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product, index) => (
                                    <tr key={product.id} style={index % 2 === 0 ? styles.tableRow : { ...styles.tableRow, backgroundColor: '#f9fafb' }}>
                                        <td style={styles.tableCell}>{index + 1}</td>
                                        <td style={styles.tableCell}>
                                            <div style={styles.productInfoRow}>
                                                {product.imageUrl ? (
                                                    <img src={product.imageUrl} alt={product.name} style={styles.thumb} />
                                                ) : (
                                                    <div style={styles.productAvatarSmall}>{product.name.charAt(0)}</div>
                                                )}
                                                <div style={styles.productInfo}>
                                                    <span style={styles.productName}>{product.name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={styles.tableCell}>
                                            <span style={styles.priceTag}>
                                                {rupiah.format(product.price)}
                                            </span>
                                        </td>
                                        <td style={styles.tableCell}>
                                            <div style={styles.dateCell}>
                                                <span style={styles.date}>
                                                    {new Date(product.createdAt).toLocaleDateString("id-ID")}
                                                </span>
                                                <span style={styles.time}>
                                                    {new Date(product.createdAt).toLocaleTimeString("id-ID", {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={styles.tableCell}>
                                            <button
                                                onClick={() => handleAddToCart(product)}
                                                style={styles.cartBtn}
                                            >
                                                <span style={styles.cartIcon}>🛒</span> Add to Cart
                                            </button>
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
                        &copy; {new Date().getFullYear()} User Dashboard. All rights reserved.
                    </p>
                    <p style={styles.footerInfo}>
                        Showing {filteredProducts.length} of {products.length} products
                    </p>
                </div>
            </footer>
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
    logoutBtn: {
        padding: '10px 20px',
        backgroundColor: 'white',
        color: '#ef4444',
        border: '1px solid #fca5a5',
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
    statsContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
    },
    statCard: {
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        transition: 'transform 0.3s ease'
    },
    statIcon: {
        fontSize: '32px',
        width: '60px',
        height: '60px',
        borderRadius: '12px',
        backgroundColor: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
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
        fontSize: '14px'
    },
    mainContent: {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
    },
    contentHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
    },
    contentTitle: {
        fontSize: '22px',
        fontWeight: '600',
        color: '#1f2937',
        margin: '0'
    },
    controls: {
        display: 'flex',
        gap: '15px',
        alignItems: 'center'
    },
    searchContainer: {
        position: 'relative',
        width: '300px'
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
        transition: 'border-color 0.3s ease'
    },
    sortSelect: {
        padding: '12px 20px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '14px',
        backgroundColor: 'white',
        cursor: 'pointer',
        minWidth: '160px'
    },
    tableContainer: {
        overflowX: 'auto',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: '800px'
    },
    tableHead: {
        backgroundColor: '#f9fafb'
    },
    tableHeader: {
        padding: '16px 20px',
        textAlign: 'left',
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        borderBottom: '2px solid #e5e7eb'
    },
    tableRow: {
        backgroundColor: 'white',
        borderBottom: '1px solid #f3f4f6',
        transition: 'background-color 0.2s ease'
    },
    tableCell: {
        padding: '20px',
        fontSize: '14px',
        color: '#4b5563'
    },
    productInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    productInfoRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    productAvatarSmall: {
        width: '44px',
        height: '44px',
        borderRadius: '8px',
        backgroundColor: '#4f46e5',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: '600'
    },
    thumb: {
        width: '56px',
        height: '44px',
        objectFit: 'cover',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
    },
    productName: {
        fontWeight: '500',
        color: '#1f2937'
    },
    priceTag: {
        backgroundColor: '#f0f9ff',
        color: '#0369a1',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '600'
    },
    dateCell: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
    },
    date: {
        color: '#1f2937',
        fontWeight: '500'
    },
    time: {
        fontSize: '12px',
        color: '#6b7280'
    },
    cartBtn: {
        padding: '8px 16px',
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.3s ease'
    },
    cartIcon: {
        fontSize: '14px'
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
        margin: '0'
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

// Tambahkan hover effects
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .logout-btn:hover {
            background-color: #fee2e2 !important;
            border-color: #fca5a5 !important;
        }
        
        .cart-btn:hover {
            background-color: #059669 !important;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2) !important;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        
        .search-input:focus {
            outline: none;
            border-color: #4f46e5 !important;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        
        .table-row:hover {
            background-color: #f8fafc !important;
        }
        
        .sort-select:focus {
            outline: none;
            border-color: #4f46e5;
        }
    `;
    document.head.appendChild(style);
}