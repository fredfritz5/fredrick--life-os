export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|register|api/auth|api/check-user-exists|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
