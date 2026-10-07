import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { getProjectById } from "@/lib/access";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const result = await getProjectById(user, id);
  // 404 (not 403) so we don't even reveal that the project exists
  if (!result) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  return NextResponse.json(result); // { project, tasks }
}
