import { getServerSession } from "next-auth/next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { authOptions } from "../../api/auth/[...nextauth]";


/* ============================= */
/* SERVER SIDE PROPS */
/* ============================= */
export async function getServerSideProps(context) {
  const session = await getServerSession(
    context.req,
    context.res,
    authOptions
  );

  if (!session || session.user.role !== "admin") {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  /* 🔧 FIX SERIALIZATION */
  const safeSession = {
    ...session,
    user: {
      ...session.user,
      image: session.user.image || null,
    },
  };

  const { id } = context.query;
  const baseUrl =
    process.env.NEXTAUTH_URL || "http://localhost:3000";

  const res = await fetch(
    `${baseUrl}/api/products/${id}`,
    {
      headers: {
        cookie: context.req.headers.cookie || "",
      },
    }
  );

  if (!res.ok) return { notFound: true };

  const product = await res.json();

  return {
    props: {
      product,
      session: safeSession, // ← pake ini
    },
  };
}

export default function EditProduct({ product, session }) {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const baseUrl =
        typeof window !== "undefined"
            ? window.location.origin
            : "";

    const [preview, setPreview] = useState(
        product.image ? `${baseUrl}${product.image}` : null
    );

    const [form, setForm] = useState({
        name: product.name || "",
        price: product.price || "",
        description: product.description || "",
        stock: product.stock || "",
        image: null,
        existingImage: product.image,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    /* ============================= */
    /* IMAGE CHANGE */
    /* ============================= */
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError("Ukuran file maksimal 5MB");
            return;
        }

        const allowed = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
        ];

        if (!allowed.includes(file.type)) {
            setError("Format gambar tidak valid");
            return;
        }

        setForm((prev) => ({
            ...prev,
            image: file,
        }));

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setForm((prev) => ({
            ...prev,
            image: null,
            existingImage: null,
        }));
        setPreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError("");
        setSuccess("");

        if (!form.name.trim()) {
            setError("Nama wajib diisi");
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();

            formData.append("name", form.name);
            formData.append("price", form.price);
            formData.append("description", form.description);
            formData.append("stock", form.stock);

            if (form.image) {
                formData.append("image", form.image);
            }

            if (!form.existingImage) {
                formData.append("removeImage", "true");
            }

            const res = await fetch(
                `/api/products/${product.id}`,
                {
                    method: "PUT",
                    body: formData,
                }
            );

            const data = await res.json();

            if (!res.ok) throw new Error(data.message);

            setSuccess("Produk berhasil diupdate");

            setTimeout(() => {
                router.push("/dashboard/admin");
            }, 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>

            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}>Edit Produk</h1>
                    <div style={styles.breadcrumb}>
                        <span onClick={() => router.push("/dashboard/admin")} style={styles.link}>
                            Dashboard
                        </span> /
                        <span style={styles.breadcrumbActive}> Edit Produk</span>
                    </div>
                </div>
                <div style={styles.avatar}>
                    {session?.user?.name?.charAt(0) || "A"}
                </div>
            </header>

            <main style={styles.main}>
                {/* HAPUS SECTION PRATINJAU DI SINI */}
                
                <div style={styles.card}>
                    <h2>Edit Informasi Produk</h2>

                    {error && <div style={styles.error}>{error}</div>}
                    {success && <div style={styles.success}>{success}</div>}

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
                                            Hapus Gambar
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
                                                <span style={styles.uploadLink}>Pilih gambar baru</span>
                                                <span style={styles.uploadHint}>atau drag & drop</span>
                                                <span style={styles.uploadInfo}>PNG, JPG, GIF hingga 5MB</span>
                                            </div>
                                        </div>
                                    </label>
                                )}
                                {form.existingImage && !form.image && (
                                    <div style={styles.currentImageNote}>
                                        Gambar saat ini akan dipertahankan
                                    </div>
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

                        <div style={styles.metadata}>
                            <div><strong>ID:</strong> {product.id}</div>
                            <div><strong>Dibuat:</strong> {new Date(product.createdAt).toLocaleDateString('id-ID')}</div>
                            <div><strong>Diupdate:</strong> {new Date(product.updatedAt || product.createdAt).toLocaleDateString('id-ID')}</div>
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
                                    onClick={() => setForm({
                                        name: product.name || "",
                                        price: product.price || "",
                                        description: product.description || "",
                                        stock: product.stock || "",
                                    })}
                                    style={styles.btnReset}
                                >
                                    Reset
                                </button>
                                <button type="submit" disabled={loading} style={styles.btnPrimary}>
                                    {loading ? "Menyimpan..." : "Simpan Perubahan"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>

            <footer style={styles.footer}>
                <p>&copy; {new Date().getFullYear()} Admin Dashboard • ID Produk: {product.id}</p>
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
        color: "#333",
    },
    breadcrumb: {
        fontSize: "14px",
        color: "#666",
    },
    link: {
        cursor: "pointer",
        color: "#0066cc",
    },
    breadcrumbActive: {
        color: "#f59e0b",
        fontWeight: "bold",
    },
    avatar: {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        backgroundColor: "#4f46e5",
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
    error: {
        backgroundColor: "#ffe6e6",
        color: "#cc0000",
        padding: "10px",
        borderRadius: "5px",
        marginBottom: "20px",
    },
    success: {
        backgroundColor: "#e6ffe6",
        color: "#009900",
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
    currentImageNote: {
        fontSize: '12px',
        color: '#666',
        marginTop: '5px',
        fontStyle: 'italic',
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
    metadata: {
        display: "flex",
        gap: "20px",
        padding: "15px",
        backgroundColor: "#f9f9f9",
        borderRadius: "5px",
        fontSize: "14px",
        color: "#666",
    },
    actions: {
        display: "flex",
        justifyContent: "space-between",
        paddingTop: "20px",
        borderTop: "1px solid #eee",
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
        backgroundColor: "#f59e0b",
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
    /* ============================= */
    /* STYLES UNTUK GAMBAR DI FORM EDIT */
    /* ============================= */
    imageUploadContainer: {
        marginBottom: '15px',
    },
    imagePreviewWrapper: {
        position: 'relative',
        width: '100%',
        maxWidth: '300px', /* Batasi lebar maksimal */
        margin: '0 auto',
        padding: '15px',
        border: '2px dashed #ddd',
        borderRadius: '8px',
        backgroundColor: '#fafafa',
        textAlign: 'center',
    },
    imagePreview: {
        width: '100%',
        maxWidth: '250px', /* Lebih kecil dari wrapper */
        height: '200px', /* Tinggi tetap */
        objectFit: 'contain', /* Jaga proporsi gambar */
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
        backgroundColor: '#f8fafc',
        marginBottom: '10px',
    },
    removeImageBtn: {
        padding: '8px 16px',
        backgroundColor: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'inline-block',
        transition: 'all 0.3s ease',
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
        minHeight: '150px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
    },
    uploadIcon: {
        fontSize: '32px',
        color: '#9ca3af',
    },
    uploadText: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    uploadLink: {
        color: '#4f46e5',
        fontWeight: '600',
        fontSize: '14px',
    },
    uploadHint: {
        color: '#6b7280',
        fontSize: '12px',
    },
    uploadInfo: {
        color: '#9ca3af',
        fontSize: '11px',
    },
};

/* ============================= */
/* TAMBAH HOVER EFFECTS */
/* ============================= */
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        .image-preview-wrapper:hover {
            border-color: #4f46e5;
        }
        
        .upload-area:hover {
            border-color: #4f46e5;
            background-color: #f5f5f5;
        }
        
        .remove-image-btn:hover {
            background-color: #dc2626 !important;
            transform: translateY(-2px);
            box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);
        }
        
        button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .btn-secondary:hover {
            background-color: #e5e7eb !important;
        }
        
        .btn-reset:hover {
            background-color: #f9fafb !important;
            border-color: #d1d5db !important;
        }
        
        .btn-primary:hover:not(:disabled) {
            background-color: #d97706 !important;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }
        
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
            box-shadow: none !important;
        }
    `;
    document.head.appendChild(style);
}