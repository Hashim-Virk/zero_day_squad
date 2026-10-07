import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { COOKIE_NAME, readSessionToken } from "./session";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string; // "ADMIN" | "MANAGER" | "AGENT"
  specialization: string | null;
};

// Who is logged in? Read from the signed cookie, then load from the database.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const userId = await readSessionToken(store.get(COOKIE_NAME)?.value);
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, specialization: true },
  });
}

export function unauthorized() {
  return NextResponse.json({ error: "Not logged in" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// For the AI teammate: use this at the top of the transcript route.
// const { user, error } = await requireAdmin(); if (error) return error;
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: unauthorized() };
  if (user.role !== "ADMIN") return { user: null, error: forbidden() };
  return { user, error: null };
}
