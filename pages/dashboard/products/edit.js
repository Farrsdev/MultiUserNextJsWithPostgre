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

  const { id } = context.query;
  let product = null;

  try {
    const protocol = context.req.headers['x-forwarded-proto'] || 'http';
    const host = context.req.headers.host;
    const res = await fetch(`${protocol}://${host}/api/products/${id}`, {
      headers: { cookie: context.req.headers.cookie || '' },
    });
    
    if (res.ok) {
      product = await res.json();
    }
  } catch (err) {
    console.error("Gagal ambil produk:", err);
  }

  if (!product) {
    return { notFound: true };
  }

  return { props: { product } };
}

export default function EditProduct({ product }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: product.name || "",
    price: product.price || "",
    description: product.description || "",
    stock: product.stock || "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.price || parseFloat(form.price) <= 0) {
      setError(!form.name.trim() ? "Nama wajib diisi" : "Harga harus > 0");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          price: parseFloat(form.price),
          description: form.description.trim(),
          stock: parseInt(form.stock) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal update produk");
      
      setSuccess("Produk berhasil diupdate! Mengalihkan...");
      setTimeout(() => router.push("/dashboard/admin"), 1500);
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
        <div style={styles.preview}>
          <h3>Pratinjau Produk</h3>
          <div style={styles.previewInfo}>
            <div><strong>Nama:</strong> {form.name || product.name}</div>
            <div><strong>Harga:</strong> Rp {parseInt(form.price || product.price).toLocaleString()}</div>
            <div><strong>Stok:</strong> {form.stock || product.stock} unit</div>
          </div>
        </div>

        <div style={styles.card}>
          <h2>Edit Informasi Produk</h2>
          
          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
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
  preview: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  previewInfo: {
    marginTop: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
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
};