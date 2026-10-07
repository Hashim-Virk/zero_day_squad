import { prisma } from "./prisma";
import type { CurrentUser } from "./auth";

// ---------- PROJECTS ----------
// ADMIN   -> all projects
// MANAGER -> only projects they manage
// AGENT   -> only projects that contain a task assigned to them
export async function getProjects(user: CurrentUser) {
  let where = {};
  if (user.role === "MANAGER") where = { managerId: user.id };
  else if (user.role === "AGENT") where = { tasks: { some: { assigneeId: user.id } } };
  else if (user.role !== "ADMIN") return [];

  const projects = await prisma.project.findMany({
    where,
    orderBy: { deadline: "asc" },
    include: {
      manager: { select: { id: true, name: true } },
      tasks: { select: { assigneeId: true } },
    },
  });

  // taskCount = what THIS user is allowed to see (agents only count their own tasks)
  return projects.map(({ tasks, ...p }) => ({
    ...p,
    taskCount:
      user.role === "AGENT"
        ? tasks.filter((t) => t.assigneeId === user.id).length
        : tasks.length,
  }));
}

// ---------- TASKS ----------
// ADMIN   -> all tasks of the project
// MANAGER -> all tasks, but only if they manage the project
// AGENT   -> only tasks assigned to them
export async function getTasks(user: CurrentUser, projectId: string) {
  const include = {
    assignee: { select: { id: true, name: true } },
  };
  if (user.role === "ADMIN") {
    return prisma.task.findMany({ where: { projectId }, include, orderBy: { deadline: "asc" } });
  }
  if (user.role === "MANAGER") {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.managerId !== user.id) return [];
    return prisma.task.findMany({ where: { projectId }, include, orderBy: { deadline: "asc" } });
  }
  if (user.role === "AGENT") {
    return prisma.task.findMany({
      where: { projectId, assigneeId: user.id },
      include,
      orderBy: { deadline: "asc" },
    });
  }
  return [];
}

// All tasks a user may see across projects (used by "My Tasks")
export async function getAllMyTasks(user: CurrentUser) {
  let where = {};
  if (user.role === "AGENT") where = { assigneeId: user.id };
  else if (user.role === "MANAGER") where = { project: { managerId: user.id } };
  else if (user.role !== "ADMIN") return [];

  return prisma.task.findMany({
    where,
    orderBy: { deadline: "asc" },
    include: {
      assignee: { select: { id: true, name: true } },
      project: {
        select: { id: true, name: true, clientName: true, manager: { select: { name: true } } },
      },
    },
  });
}

// ---------- ONE PROJECT ----------
// Returns null if the user is not allowed to see it (route answers 404).
export async function getProjectById(user: CurrentUser, projectId: string) {
  const allowed = await getProjects(user);
  const project = allowed.find((p) => p.id === projectId);
  if (!project) return null;
  const tasks = await getTasks(user, projectId);
  return { project, tasks };
}

// ---------- TEAM ----------
// Read-only team directory for the Team page (no emails, no passwords).
export async function getTeam() {
  return prisma.user.findMany({
    select: { id: true, name: true, role: true, specialization: true, skills: true },
    orderBy: { id: "asc" },
  });
}

// For the AI teammate: this is the directory sent to the AI. NEVER includes passwordHash.
export async function getDirectory() {
  return prisma.user.findMany({
    select: { id: true, name: true, role: true, skills: true },
    orderBy: { id: "asc" },
  });
}
