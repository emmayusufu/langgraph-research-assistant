import withAuth from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/((?!api/auth|api/org|api/zitadel-session|_next/static|_next/image|favicon.ico|login|signup|auth).*)",
  ],
};
