import { getServerSession } from "next-auth/next";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { authOptions } from "../api/auth/[...nextauth]";

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

export default function AdminDashboard({ products: initialProducts = [] }) {
    const { data: session } = useSession();
    const [products, setProducts] = useState(initialProducts);

    const handleLogout = async () => {
        await signOut({
            redirect: true,
            callbackUrl: "/login",
        });
    };

    //hapus product
    async function handleDelete(id) {
        if (!confirm("Yakin ingin menghapus produk ini?")) return;

        try {
            const res = await fetch(`/api/products/${id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) throw new Error("Gagal menghapus product");

            //update state tanpa reload
            setProducts((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            console.error(err);
            alert("Gagal menghapus product");
        }
    }

    return (
        <div style={styles.container}>
            {/* Header/Topbar */}
            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}> Welcome Admin {session?.user?.name?.trim() ? session.user.name : session?.user?.email || ""} </h1>
                    <p style={styles.subtitle}>Manage your system</p>
                </div>
                <div style={styles.headerActions}>
                    <button onClick={handleLogout} style={styles.logoutBtn}>
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div style={styles.content}>

                <div style={styles.section}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={styles.sectionTitle}>Daftar Products</h3>
                        <button
                            onClick={() => window.location.href = '/dashboard/products/create'}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#0070f3',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '14px',
                                transition: 'all 0.2s'
                            }}
                        >
                            + Tambah Data
                        </button>
                    </div>

                    {products.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>Data Tidak Ditemukan</p>
                    ) : (
                        <table
                            style={{
                                width: "100%",
                                background: "#fff",
                                borderCollapse: "collapse",
                                marginTop: "20px",
                            }}
                            border="1"
                            cellPadding="8"
                        >
                            <thead>
                                <tr style={{ background: "#e5e7eb" }}>
                                    <th>No</th>
                                    <th>Nama</th>
                                    <th>Harga</th>
                                    <th>Deskripsi</th>
                                    <th>Stok</th>
                                    <th>Dibuat</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>

                            <tbody>
                                {products.map((p, index) => (
                                    <tr key={p.id}>
                                        <td style={{ textAlign: "center" }}>{index + 1}</td>

                                        <td>{p.name}</td>

                                        <td style={{ textAlign: "center" }}>
                                            {rupiah.format(p.price)}
                                        </td>


                                        <td style={{ textAlign: "center" }}>
                                            {p.description}
                                        </td>

                                        <td style={{ textAlign: "center" }}>
                                            {p.stock}
                                        </td>

                                        <td style={{ textAlign: "center" }}>
                                            {new Date(p.createdAt).toLocaleDateString("id-ID")}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            <button
                                                style={{
                                                    marginRight: "5px",
                                                    padding: "4px 8px",
                                                    background: "#3b82f6",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                (window.location.href =
                                                    `/dashboard/products/edit?id=${p.id}`)
                                                }
                                            >
                                                Edit
                                            </button>

                                            <button
                                                style={{
                                                    padding: "4px 8px",
                                                    background: "#ef4444",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() => handleDelete(p.id)}
                                            >
                                                Hapus
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer style={styles.footer}>
                <p>&copy; 2025 Admin Dashboard. All rights reserved.</p>
            </footer>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        padding: '0',
        display: 'flex',
        flexDirection: 'column'
    },
    loading: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa'
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid #e5e5e5',
        borderTopColor: '#0070f3',
        borderRadius: '50%',
        marginBottom: '16px',
        animation: 'spin 1s linear infinite'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #eaeaea',
        padding: '20px',
        backgroundColor: '#fff'
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        margin: '0',
        color: '#333'
    },
    subtitle: {
        color: '#666',
        margin: '5px 0 0 0'
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
    },
    userBadge: {
        backgroundColor: '#0070f3',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600'
    },
    logoutBtn: {
        padding: '10px 20px',
        backgroundColor: 'transparent',
        color: '#ff4444',
        border: '1px solid #ff4444',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    content: {
        flex: 1,
        padding: '20px'
    },
    section: {
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '600',
        margin: '0 0 20px 0',
        color: '#333'
    },
    footer: {
        backgroundColor: '#fff',
        borderTop: '1px solid #eaeaea',
        padding: '20px',
        textAlign: 'center',
        color: '#666',
        fontSize: '14px'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
    },
    statBox: {
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        transition: 'all 0.3s'
    },
    statIcon: {
        fontSize: '32px'
    },
    statContent: {
        flex: 1
    },
    statLabel: {
        fontSize: '14px',
        color: '#666',
        margin: '0 0 5px 0'
    },
    statValue: {
        fontSize: '28px',
        fontWeight: '700',
        margin: '0',
        color: '#333'
    },
    content: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '30px'
    },
    section: {
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '600',
        margin: '0 0 20px 0',
        color: '#333'
    },
    activityList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    activityItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        paddingBottom: '15px',
        borderBottom: '1px solid #f5f5f5'
    },
    activityAvatar: {
        width: '36px',
        height: '36px',
        backgroundColor: '#0070f3',
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '600',
        fontSize: '14px'
    },
    activityDetails: {
        flex: 1
    },
    activityText: {
        margin: '0 0 4px 0',
        color: '#333',
        fontSize: '14px'
    },
    activityTime: {
        fontSize: '12px',
        color: '#888'
    },
    addUserBtn: {
        padding: '8px 16px',
        backgroundColor: '#0070f3',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse'
    },
    tableHeader: {
        textAlign: 'left',
        padding: '12px 16px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #eaeaea',
        fontSize: '14px',
        fontWeight: '600',
        color: '#333'
    },
    tableRow: {
        borderBottom: '1px solid #f5f5f5'
    },
    tableCell: {
        padding: '12px 16px',
        fontSize: '14px',
        color: '#333'
    },
    btnSmall: {
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: '500',
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    btnEdit: {
        backgroundColor: '#f0f9ff',
        color: '#0070f3'
    },
    btnDelete: {
        backgroundColor: '#fef2f2',
        color: '#dc2626'
    },
    actionsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '15px'
    },
    actionBtn: {
        padding: '20px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #eaeaea',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#333',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        transition: 'all 0.2s'
    },
    actionIcon: {
        fontSize: '24px'
    }
};

// Tambahkan CSS untuk animasi
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .spinner {
            animation: spin 1s linear infinite;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .auth-button:hover {
            background-color: #0058cc;
        }
        
        .logout-btn:hover {
            background-color: #ff4444;
            color: white;
        }
        
        .action-btn:hover {
            background-color: #0070f3;
            color: white;
            border-color: #0070f3;
        }
        a
        .stat-box:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }
    `;
    document.head.appendChild(style);
}