import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  await prisma.todo.deleteMany();
  await prisma.todo.createMany({
    data: [
      { id: randomUUID(), title: "Welcome! Drag me to reorder", priority: "medium", order: 0 },
      { id: randomUUID(), title: "Set a priority on a todo", priority: "high", order: 1 },
      { id: randomUUID(), title: "Check off a completed todo", priority: "low", order: 2 },
    ],
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
