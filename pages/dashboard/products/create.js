import { getServerSession } from "next-auth/next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { authOptions } from "../../api/auth/[...nextauth]";

export async function getServerSideProps(context) {
    const session = await getServerSession(context.req, context.res, authOptions);
    if (!session || session.user.role !== "admin") {
        return { redirect: { destination: "/login", permanent: false } };
    }
    return { props: {} };
}

export default function CreateProduct() {
    const router = useRouter();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [preview, setPreview] = useState(null);
    const [form, setForm] = useState({
        name: "",
        price: "",
        description: "",
        stock: "",
        image: null,
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validasi ukuran file (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError("Ukuran file maksimal 5MB");
                return;
            }

            // Validasi tipe file
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setError("Hanya file gambar (JPEG, PNG, GIF, WebP) yang diperbolehkan");
                return;
            }

            setForm({ ...form, image: file });

            // Buat preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!form.name.trim() || !form.price || parseFloat(form.price) <= 0) {
            setError(!form.name.trim() ? "Nama wajib diisi" : "Harga harus > 0");
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('name', form.name.trim());
            formData.append('price', parseFloat(form.price));
            formData.append('description', form.description.trim());
            formData.append('stock', parseInt(form.stock) || 0);
            if (form.image) {
                formData.append('image', form.image);
            }

            const res = await fetch("/api/products/create", {
                method: "POST",
                body: formData,
                // Jangan set Content-Type header, biarkan browser yang atur
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal membuat produk");

            router.push("/dashboard/admin");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const removeImage = () => {
        setForm({ ...form, image: null });
        setPreview(null);
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Tambah Produk</h1>
                <div style={styles.breadcrumb}>
                    <span onClick={() => router.push("/dashboard/admin")} style={styles.link}>
                        Dashboard
                    </span>
                    <span style={styles.separator}>/</span>
                    <span>Tambah Produk</span>
                </div>
                <div style={styles.avatar}>
                    {session?.user?.name?.charAt(0) || "A"}
                </div>
            </header>

            <main style={styles.main}>
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>Informasi Produk</h2>
                    {error && <div style={styles.error}>{error}</div>}
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Gambar Produk</label>
                            <div style={styles.imageUploadContainer}>
                                {preview ? (
                                    <div style={styles.imagePreviewWrapper}>
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            style={styles.imagePreview}
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            style={styles.removeImageBtn}
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                ) : (
                                    <label style={styles.fileUploadLabel}>
                                        <input
                                            type="file"
                                            name="image"
                                            onChange={handleImageChange}
                                            accept="image/*"
                                            style={styles.fileInput}
                                        />
                                        <div style={styles.uploadArea}>
                                            <div style={styles.uploadIcon}>📷</div>
                                            <div style={styles.uploadText}>
                                                <span style={styles.uploadLink}>Pilih gambar</span>
                                                <span style={styles.uploadHint}>atau drag & drop</span>
                                                <span style={styles.uploadInfo}>PNG, JPG, GIF hingga 5MB</span>
                                            </div>
                                        </div>
                                    </label>
                                )}
                            </div>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Nama Produk *</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Nama produk"
                                style={styles.input}
                                required
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Harga *</label>
                            <input
                                type="number"
                                name="price"
                                value={form.price}
                                onChange={handleChange}
                                placeholder="Harga"
                                min="1"
                                style={styles.input}
                                required
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Stok</label>
                            <input
                                type="number"
                                name="stock"
                                value={form.stock}
                                onChange={handleChange}
                                placeholder="Stok"
                                min="0"
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Deskripsi</label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Deskripsi produk"
                                rows="4"
                                style={styles.textarea}
                            />
                            <div style={styles.charCount}>{form.description.length}/500</div>
                        </div>

                        <div style={styles.actions}>
                            <button
                                type="button"
                                onClick={() => router.push("/dashboard/admin")}
                                style={styles.btnSecondary}
                            >
                                Kembali
                            </button>
                            <div style={styles.rightActions}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setForm({ name: "", price: "", description: "", stock: "", image: null });
                                        setPreview(null);
                                    }}
                                    style={styles.btnReset}
                                >
                                    Reset
                                </button>
                                <button type="submit" disabled={loading} style={styles.btnPrimary}>
                                    {loading ? "Menyimpan..." : "Simpan Produk"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>

            <footer style={styles.footer}>
                <p>&copy; {new Date().getFullYear()} Admin Dashboard</p>
            </footer>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        fontFamily: "sans-serif",
    },
    header: {
        backgroundColor: "white",
        padding: "20px 30px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        margin: "0 0 5px 0",
        fontSize: "24px",
    },
    breadcrumb: {
        fontSize: "14px",
        color: "#666",
    },
    link: {
        cursor: "pointer",
        color: "#0066cc",
    },
    separator: {
        margin: "0 5px",
    },
    avatar: {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        backgroundColor: "#0066cc",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
    },
    main: {
        padding: "30px",
        maxWidth: "800px",
        margin: "0 auto",
    },
    card: {
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "25px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    cardTitle: {
        marginTop: "0",
        marginBottom: "20px",
    },
    error: {
        backgroundColor: "#ffe6e6",
        color: "#cc0000",
        padding: "10px",
        borderRadius: "5px",
        marginBottom: "20px",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "5px",
    },
    label: {
        fontWeight: "bold",
        fontSize: "14px",
    },
    input: {
        padding: "10px",
        border: "1px solid #ddd",
        borderRadius: "5px",
        fontSize: "16px",
    },
    textarea: {
        padding: "10px",
        border: "1px solid #ddd",
        borderRadius: "5px",
        fontSize: "16px",
        resize: "vertical",
    },
    charCount: {
        fontSize: "12px",
        color: "#999",
        textAlign: "right",
    },
    actions: {
        display: "flex",
        justifyContent: "space-between",
        paddingTop: "20px",
        borderTop: "1px solid #eee",
    },
    imageUploadContainer: {
        marginBottom: '20px',
    },
    fileUploadLabel: {
        cursor: 'pointer',
        display: 'block',
    },
    fileInput: {
        display: 'none',
    },
    uploadArea: {
        border: '2px dashed #ddd',
        borderRadius: '8px',
        padding: '30px',
        textAlign: 'center',
        transition: 'border-color 0.3s',
        backgroundColor: '#fafafa',
        '&:hover': {
            borderColor: '#0066cc',
            backgroundColor: '#f5f5f5',
        },
    },
    uploadIcon: {
        fontSize: '40px',
        marginBottom: '10px',
        color: '#999',
    },
    uploadText: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    },
    uploadLink: {
        color: '#0066cc',
        fontWeight: 'bold',
    },
    uploadHint: {
        color: '#666',
        fontSize: '14px',
    },
    uploadInfo: {
        color: '#999',
        fontSize: '12px',
    },
    imagePreviewWrapper: {
        position: 'relative',
        maxWidth: '300px',
    },
    imagePreview: {
        width: '100%',
        height: '200px',
        objectFit: 'contain',
        borderRadius: '8px',
        border: '1px solid #ddd',
        backgroundColor: '#f5f5f5',
    },
    removeImageBtn: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: 'rgba(255, 0, 0, 0.7)',
        color: 'white',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
    },
    rightActions: {
        display: "flex",
        gap: "10px",
    },
    btnSecondary: {
        padding: "10px 20px",
        backgroundColor: "#f0f0f0",
        border: "1px solid #ddd",
        borderRadius: "5px",
        cursor: "pointer",
    },
    btnReset: {
        padding: "10px 20px",
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        borderRadius: "5px",
        cursor: "pointer",
    },
    btnPrimary: {
        padding: "10px 20px",
        backgroundColor: "#0066cc",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
    },
    footer: {
        textAlign: "center",
        padding: "20px",
        color: "#666",
        fontSize: "14px",
        borderTop: "1px solid #ddd",
        backgroundColor: "white",
    },
};