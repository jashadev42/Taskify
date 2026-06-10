'use client'

import { NeonAuthUIProvider } from '@neondatabase/auth-ui'
import { authClient } from '@/lib/auth.client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Providers({ children }) {
  const router = useRouter()

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => router.refresh()}
      Link={Link}
      redirectTo="/today"
    >
      {children}
    </NeonAuthUIProvider>
  )
}
