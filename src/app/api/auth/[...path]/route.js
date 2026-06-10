import { auth } from '@/lib/auth.server'

// Neon Auth handles all auth endpoints (sign-in, sign-up, callback, session, etc.)
export const { GET, POST } = auth.handler()
