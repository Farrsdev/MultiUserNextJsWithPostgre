import { getServerSession } from "next-auth/next";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../auth/[...nextauth]";
import { uploadMiddleware, deleteFile } from "../../../middleware/upload";
import path from "path";

export const config = {
  api: {
    bodyParser: false, // Nonaktifkan bodyParser default untuk handle multipart
  },
};

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== "admin") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // GET list product
  if (req.method === "GET") {
    const products = await prisma.product.findMany({
      orderBy: { id: "desc" },
    });
    return res.json(products);
  }

  // CREATE product dengan upload gambar
  if (req.method === "POST") {
    try {
      // Handle upload menggunakan middleware multer
      await new Promise((resolve, reject) => {
        uploadMiddleware(req, res, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Ambil data dari form
      const { name, price, description, stock } = req.body;

      if (!name || price == null) {
        // Jika ada file yang sudah diupload tapi validasi gagal, hapus file
        if (req.file) {
          deleteFile(req.file.filename);
        }
        return res.status(400).json({ message: "Nama dan harga wajib diisi" });
      }

      // Path gambar relatif untuk disimpan di database
      const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

      // Prepare data object and include `image` only when present
      const data = {
        name,
        description: description || "",
        price: parseInt(price),
        stock: parseInt(stock) || 0,
      };

      if (imagePath) data.image = imagePath;

      let product;
      try {
        product = await prisma.product.create({ data });
      } catch (err) {
        // If Prisma schema doesn't have `image` field yet, retry without it
        if (err && /Unknown argument `image`/.test(err.message)) {
          delete data.image;
          product = await prisma.product.create({ data });
        } else {
          throw err;
        }
      }

      return res.status(201).json({
        ...product,
        imageUrl: imagePath ? `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${imagePath}` : null,
      });
    } catch (error) {
      console.error("Error creating product:", error);

      // Hapus file jika ada error
      if (req.file) {
        deleteFile(req.file.filename);
      }

      return res.status(500).json({
        message: error.message || "Gagal membuat produk"
      });
    }
  }

  res.status(405).end();
}   