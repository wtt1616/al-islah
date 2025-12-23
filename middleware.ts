export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/schedules/:path*',
    '/availability/:path*',
    '/users/:path*',
    '/api/users/:path*',
    // Removed /api/schedules/:path* and /api/availability/:path* to allow public viewing
    // Authentication for POST/PUT/DELETE is still enforced in the API route handlers
  ],
};
