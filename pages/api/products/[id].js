import { getServerSession } from "next-auth/next";
import { prisma } from "../../../lib/prisma.js";
import { authOptions } from "../auth/[...nextauth].js";
import { uploadMiddleware, deleteFile } from "../../../middleware/upload.js";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  // Proteksi: hanya admin yang boleh akses
  if (!session || session.user?.role !== "admin") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;

  // GET single product
  if (req.method === "GET") {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        return res.status(404).json({ error: "Produk tidak ditemukan" });
      }

      // Tambahkan full URL untuk gambar
      const productWithImageUrl = {
        ...product,
        imageUrl: product.image ?
          `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${product.image}` : null
      };

      return res.status(200).json(productWithImageUrl);
    } catch (err) {
      console.error("Error fetching product:", err);
      return res.status(500).json({ error: "Gagal ambil data produk" });
    }
  }

  // UPDATE product dengan upload gambar
  if (req.method === "PUT") {
    let oldImage = null;

    try {
      // Dapatkan data produk lama untuk hapus gambar lama nanti
      const existingProduct = await prisma.product.findUnique({
        where: { id },
        select: { image: true }
      });
      oldImage = existingProduct?.image;

      // Handle upload
      await new Promise((resolve, reject) => {
        uploadMiddleware(req, res, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      const { name, price, description, stock } = req.body;

      if (!name || price == null) {
        // Hapus file baru jika validasi gagal
        if (req.file) {
          deleteFile(req.file.filename);
        }
        return res.status(400).json({ message: "Invalid data" });
      }

      // Path gambar baru
      const newImagePath = req.file ? `/uploads/${req.file.filename}` : oldImage;

      // Prepare update data and include image when applicable
      const updateData = {
        name,
        price: parseInt(price),
        description: description || "",
        stock: parseInt(stock) || 0,
      };

      if (newImagePath) updateData.image = newImagePath;

      let product;
      try {
        product = await prisma.product.update({ where: { id }, data: updateData });
      } catch (err) {
        // If Prisma schema doesn't include `image`, retry without it
        if (err && /Unknown argument `image`/.test(err.message)) {
          delete updateData.image;
          product = await prisma.product.update({ where: { id }, data: updateData });
        } else {
          throw err;
        }
      }

      // Hapus gambar lama jika ada gambar baru (only when DB update succeeded)
      if (req.file && oldImage) {
        const oldFilename = path.basename(oldImage);
        deleteFile(oldFilename);
      }

      return res.status(200).json({
        ...product,
        imageUrl: product.image ? `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${product.image}` : null,
      });
    } catch (err) {
      console.error("Error updating product:", err);

      // Hapus file baru jika ada error
      if (req.file) {
        deleteFile(req.file.filename);
      }

      return res.status(500).json({ error: "Gagal update produk" });
    }
  }

  // DELETE product dengan hapus gambar
  if (req.method === "DELETE") {
    try {
      // Dapatkan data produk untuk hapus gambar
      const product = await prisma.product.findUnique({
        where: { id },
        select: { image: true }
      });

      // Hapus dari database
      const deletedProduct = await prisma.product.delete({
        where: { id },
      });

      // Hapus file gambar jika ada
      if (product?.image) {
        const filename = path.basename(product.image);
        deleteFile(filename);
      }

      return res.status(200).json(deletedProduct);
    } catch (err) {
      console.error("Error deleting product:", err);
      return res.status(500).json({ error: "Gagal menghapus product" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}