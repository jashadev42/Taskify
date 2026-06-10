'use client'

import { authClient } from '@/lib/auth.client'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/auth/sign-in')
  }

  return (
    <button
      onClick={handleSignOut}
      className="fixed top-4 right-4 z-50 text-white/20 hover:text-white/50 text-xs transition-colors"
    >
      sign out
    </button>
  )
}
