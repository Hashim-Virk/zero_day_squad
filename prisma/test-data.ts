// TEST ONLY: inserts the 3 projects and 12 tasks from the answer key by hand,
// so you can test access rules before the AI part exists.
// Run: npx tsx prisma/test-data.ts   (run the normal seed first)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const data = [
  {
    name: "UrbanCart Website", clientName: "UrbanCart Clothing", managerId: "PM01", deadline: "2026-10-20",
    description: "Responsive demo website: product browsing, product details, demo cart. No payments or inventory.",
    tasks: [
      ["Product catalog UI", "DEV01", "2026-10-12", 12],
      ["Demo cart UI", "DEV01", "2026-10-15", 8],
      ["Product and cart APIs", "DEV02", "2026-10-14", 14],
      ["Website integration and testing", "DEV01", "2026-10-19", 6],
    ],
  },
  {
    name: "QuickServe Mobile App", clientName: "QuickServe Services", managerId: "PM02", deadline: "2026-10-24",
    description: "Flutter customer app: login, service booking, booking status.",
    tasks: [
      ["Login and profile screens", "DEV03", "2026-10-12", 8],
      ["Service booking screens", "DEV03", "2026-10-17", 12],
      ["Booking and account APIs", "DEV02", "2026-10-16", 16],
      ["Mobile integration and testing", "DEV04", "2026-10-22", 10],
    ],
  },
  {
    name: "HelpDeskPro AI Assistant", clientName: "HelpDeskPro Solutions", managerId: "PM03", deadline: "2026-10-22",
    description: "FAQ-based support assistant with saved human escalation records.",
    tasks: [
      ["FAQ document processing", "DEV06", "2026-10-13", 10],
      ["Assistant answer generation", "DEV05", "2026-10-17", 14],
      ["Human escalation flow", "DEV05", "2026-10-18", 6],
      ["Assistant evaluation and testing", "DEV06", "2026-10-21", 8],
    ],
  },
] as const;

async function main() {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  for (const p of data) {
    await prisma.project.create({
      data: {
        name: p.name, clientName: p.clientName, description: p.description,
        managerId: p.managerId, deadline: p.deadline,
        tasks: {
          create: p.tasks.map(([title, assigneeId, deadline, estimatedHours]) => ({
            title, description: title, assigneeId, deadline, estimatedHours,
          })),
        },
      },
    });
  }
  console.log("Test data inserted:", await prisma.project.count(), "projects,", await prisma.task.count(), "tasks");
}

main().finally(() => prisma.$disconnect());
