import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "session";

function secret() {
  return new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret-change-me");
}

// Creates a signed token that contains ONLY the user id.
// The role is never stored in the cookie; it is looked up in the database each time.
export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1d")
    .sign(secret());
}

// Returns the userId if the token is valid and not tampered with, otherwise null.
export async function readSessionToken(token?: string): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
}
