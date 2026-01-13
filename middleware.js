import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname, origin } = req.nextUrl;
  
  if (!token && pathname.startsWith("/dashboard")) {
    new URL("/error/401", req.nextUrl.origin)
  }

  if (pathname.startsWith("/dashboard/admin") && token?.role !== "admin") {
    return NextResponse.redirect(new URL("/error/403/admin", origin));
  }

  if (
    pathname.startsWith("/dashboard/user") &&
    token?.role !== "user"
  ) {
     return NextResponse.redirect(new URL("/error/401", origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};