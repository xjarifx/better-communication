import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_ROUTES = ["/login", "/register", "/api/auth/login", "/api/auth/register", "/api/auth/logout"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("accessToken")?.value

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Protect API routes
  if (pathname.startsWith("/api/") && !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Protect app routes - redirect to login
  if (!token && !pathname.startsWith("/api/") && !pathname.startsWith("/_next")) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated and going to auth pages, redirect to messages
  if (token && (pathname === "/login" || pathname === "/register")) {
    const messagesUrl = new URL("/messages", request.url)
    return NextResponse.redirect(messagesUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
