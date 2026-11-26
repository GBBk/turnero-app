import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash("admin1234", 10);
  const clientHash = await bcrypt.hash("cliente1234", 10);

  await prisma.user.upsert({
    where: { email: "admin@turnos.dev" },
    update: {},
    create: { name: "Admin", email: "admin@turnos.dev", passwordHash: adminHash, role: "ADMIN" },
  });
  await prisma.user.upsert({
    where: { email: "cliente@turnos.dev" },
    update: {},
    create: { name: "Cliente Demo", email: "cliente@turnos.dev", passwordHash: clientHash },
  });

  if ((await prisma.service.count()) === 0) {
    await prisma.service.createMany({
      data: [
        { name: "Corte de pelo", durationMin: 30, priceCents: 800000 },
        { name: "Corte y barba", durationMin: 45, priceCents: 1200000 },
        { name: "Coloración", durationMin: 90, priceCents: 2500000 },
      ],
    });
  }

  // Lunes a viernes 9 a 18, sábado 9 a 13.
  const hours = [1, 2, 3, 4, 5].map((weekday) => ({ weekday, openMin: 9 * 60, closeMin: 18 * 60 }));
  hours.push({ weekday: 6, openMin: 9 * 60, closeMin: 13 * 60 });
  for (const h of hours) {
    await prisma.businessHours.upsert({ where: { weekday: h.weekday }, update: h, create: h });
  }

  console.log("Seed listo: admin@turnos.dev / admin1234 y cliente@turnos.dev / cliente1234");
}

main().finally(() => prisma.$disconnect());
