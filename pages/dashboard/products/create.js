import { getServerSession } from "next-auth/next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { authOptions } from "../../api/auth/[...nextauth]";

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

    return { props: {} };
}

export default function CreateProduct() {
    const router = useRouter();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        description: "",
        stock: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Validasi
            if (!formData.name.trim()) {
                setError("Nama produk tidak boleh kosong");
                setLoading(false);
                return;
            }

            if (!formData.price || parseFloat(formData.price) <= 0) {
                setError("Harga harus lebih dari 0");
                setLoading(false);
                return;
            }

            const res = await fetch("/api/products/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    name: formData.name.trim(),
                    price: parseFloat(formData.price),
                    description: formData.description.trim(),
                    stock: parseInt(formData.stock) || 0,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Gagal membuat produk");
                setLoading(false);
                return;
            }

            // Redirect ke admin dashboard
            router.push("/dashboard/admin");
        } catch (err) {
            console.error(err);
            setError("Terjadi kesalahan saat membuat produk");
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <h1 style={styles.title}>Tambah Produk Baru</h1>
                <p style={styles.subtitle}>Isi form di bawah untuk menambah produk</p>
            </header>

            {/* Main Content */}
            <div style={styles.content}>
                <div style={styles.formContainer}>
                    {error && (
                        <div style={styles.alertError}>
                            <span style={{ marginRight: "10px" }}>⚠️</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={styles.form}>
                        {/* Nama Produk */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Nama Produk *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Masukkan nama produk"
                                style={styles.input}
                            />
                        </div>

                        {/* Harga */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Harga (Rp) *</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="Masukkan harga produk"
                                min="1"
                                step="1"
                                style={styles.input}
                            />
                        </div>

                        {/* Stock */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Stock</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                placeholder="Masukkan jumlah stock"
                                min="0"
                                style={styles.input}
                            />
                        </div>

                        {/* Deskripsi */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Deskripsi</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Masukkan deskripsi produk"
                                rows="5"
                                style={styles.textarea}
                            />
                        </div>

                        {/* Buttons */}
                        <div style={styles.formActions}>
                            <button
                                type="button"
                                onClick={() => router.push("/dashboard/admin")}
                                style={styles.btnCancel}
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    ...styles.btnSubmit,
                                    opacity: loading ? 0.6 : 1,
                                    cursor: loading ? "not-allowed" : "pointer",
                                }}
                            >
                                {loading ? "Menyimpan..." : "Simpan Produk"}
                            </button>
                        </div>
                    </form>
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
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        display: "flex",
        flexDirection: "column",
    },
    header: {
        backgroundColor: "#fff",
        padding: "20px",
        borderBottom: "1px solid #eaeaea",
    },
    title: {
        fontSize: "28px",
        fontWeight: "700",
        margin: "0",
        color: "#333",
    },
    subtitle: {
        color: "#666",
        margin: "5px 0 0 0",
        fontSize: "14px",
    },
    content: {
        flex: 1,
        padding: "20px",
    },
    formContainer: {
        backgroundColor: "#fff",
        padding: "30px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        maxWidth: "600px",
        margin: "0 auto",
    },
    alertError: {
        backgroundColor: "#fee2e2",
        color: "#dc2626",
        padding: "12px 16px",
        borderRadius: "8px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        fontSize: "14px",
        border: "1px solid #fecaca",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    label: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#333",
    },
    input: {
        padding: "10px 12px",
        border: "1px solid #ddd",
        borderRadius: "6px",
        fontSize: "14px",
        fontFamily: "inherit",
        boxSizing: "border-box",
    },
    textarea: {
        padding: "10px 12px",
        border: "1px solid #ddd",
        borderRadius: "6px",
        fontSize: "14px",
        fontFamily: "inherit",
        boxSizing: "border-box",
        resize: "vertical",
    },
    formActions: {
        display: "flex",
        gap: "12px",
        justifyContent: "flex-end",
        marginTop: "20px",
        paddingTop: "20px",
        borderTop: "1px solid #eaeaea",
    },
    btnCancel: {
        padding: "10px 24px",
        backgroundColor: "#f3f4f6",
        color: "#333",
        border: "1px solid #ddd",
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s",
    },
    btnSubmit: {
        padding: "10px 24px",
        backgroundColor: "#0070f3",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s",
    },
    footer: {
        backgroundColor: "#fff",
        borderTop: "1px solid #eaeaea",
        padding: "20px",
        textAlign: "center",
        color: "#666",
        fontSize: "14px",
    },
};

if (typeof document !== "undefined") {
    const style = document.createElement("style");
    style.innerHTML = `
        input:focus,
        textarea:focus {
            outline: none;
            border-color: #0070f3;
            box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.1);
        }

        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }

        input[type="number"] {
            -moz-appearance: textfield;
        }

        button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        button[type="button"]:hover {
            background-color: #e5e7eb;
        }

        button[type="submit"]:hover:not(:disabled) {
            background-color: #0058cc;
        }
    `;
    document.head.appendChild(style);
}
