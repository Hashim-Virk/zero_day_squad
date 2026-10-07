import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { getTasks, getAllMyTasks, getProjectById } from "@/lib/access";

// GET /api/tasks              -> all tasks this user may see (agent: "My Tasks")
// GET /api/tasks?projectId=ID -> tasks of one project, filtered by role
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const projectId = new URL(req.url).searchParams.get("projectId");

  if (projectId) {
    const allowed = await getProjectById(user, projectId);
    if (!allowed) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const tasks = await getTasks(user, projectId);
    return NextResponse.json({ tasks });
  }

  const tasks = await getAllMyTasks(user);
  return NextResponse.json({ tasks });
}
