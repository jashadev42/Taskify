import { redirect } from 'next/navigation'

// Root → send to today. Middleware handles unauthenticated redirect to /auth/sign-in.
export default function RootPage() {
  redirect('/today')
}
