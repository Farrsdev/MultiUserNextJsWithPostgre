import { getServerSession } from "next-auth/next";
import { signOut, useSession } from "next-auth/react";
import { authOptions } from "../api/auth/[...nextauth]";

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

    const handleLogout = async () => {
        await signOut({
            redirect: true,
            callbackUrl: "/login",
        });
    };


    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}>Welcome {session?.user?.name?.trim() ? session.user.name : session?.user?.email || "User"}</h1>
                    <p style={styles.subtitle}>User Dashboard</p>
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
                    <h3 style={styles.sectionTitle}>Daftar Products</h3>

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
                                            {new Date(p.createdAt).toLocaleDateString("id-ID")}
                                        </td>

                                        <td style={{ textAlign: "center" }}>
                                            <button style={styles.cartBtn}>
                                                Keranjang
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
                <p>&copy; 2025 User Dashboard. All rights reserved.</p>
            </footer>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        padding: '20px'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #eaeaea'
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        margin: '0',
        color: '#333'
    },
    subtitle: {
        color: '#000',
        margin: '5px 0 0 0',
        fontWeight: '500',
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
    },
    userBadge: {
        backgroundColor: '#7c3aed',
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
        cursor: 'pointer'
    },
    cartBtn: {
    padding: '10px 20px',
        backgroundColor: 'transparent',
        color: '#1338cf',
        border: '1px solid #1338cf',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer'
    },
    content: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '30px',
        marginBottom: '30px'
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
        textAlign: 'center',
        paddingTop: '20px',
        borderTop: '1px solid #eaeaea',
        color: '#999',
        fontSize: '14px'
    }
};

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .logout-btn:hover {
            background-color: #ff4444;
            color: white;
        }
    `;
    document.head.appendChild(style);
}