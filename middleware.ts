export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/',
    '/sectors/:path*',
    '/analytics',
    '/accountability',
  ],
};
