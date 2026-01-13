import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname, origin } = req.nextUrl;

  // 🚨 1. BELUM LOGIN → STOP TOTAL
  if (!token && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(
      new URL("/error/401", origin)
    );
  }

  // 🛑 2. SUDAH LOGIN, TAPI ROLE SALAH
  if (
    token &&
    pathname.startsWith("/dashboard/admin") &&
    token.role !== "admin"
  ) {
    return NextResponse.redirect(
      new URL("/error/403/admin", origin)
    );
  }

  if (
    token &&
    pathname.startsWith("/dashboard/user") &&
    token.role !== "user"
  ) {
    return NextResponse.redirect(
      new URL("/error/403/user", origin)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
