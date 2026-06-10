import { auth } from '@/lib/auth.server'
import { NextResponse } from 'next/server'

const neonAuthMiddleware = auth.middleware({ loginUrl: '/auth/sign-in' })

export default function proxy(request) {
  // Server actions POST to page URLs and carry a 'next-action' header.
  // They verify the session themselves via getVerifiedUserId(), so skip
  // the proxy here — otherwise the proxy can redirect the POST before
  // the action runs, causing "unexpected response" on the client.
  if (request.headers.get('next-action')) {
    return NextResponse.next()
  }
  return neonAuthMiddleware(request)
}

export const config = {
  matcher: ['/today', '/history', '/plan'],
}
