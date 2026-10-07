import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { getTeam } from "@/lib/access";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const team = await getTeam();
  return NextResponse.json({ team });
}
