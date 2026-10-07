import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth";

// The frontend calls this to know who is logged in (name, role).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return NextResponse.json({ user });
}
