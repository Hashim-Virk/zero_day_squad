import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { getProjects } from "@/lib/access";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const projects = await getProjects(user);
  return NextResponse.json({ projects });
}
