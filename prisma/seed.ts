import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});
async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
 
  await prisma.user.upsert({
    where: { email: "admin@app.com" },
    update: {},
    create: {
      name: "Shirley",
      email: "s@gmail.com",
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log("✅ Seed admin user created");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
