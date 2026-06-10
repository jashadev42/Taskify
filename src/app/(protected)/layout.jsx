import Nav from '@/components/Nav'
import SignOutButton from '@/components/SignOutButton'

// Middleware already handles unauthenticated redirects for these routes.
// This layout adds the shared chrome: bottom nav + sign-out.
export default function ProtectedLayout({ children }) {
  return (
    <div className="min-h-screen">
      {children}
      <Nav />
      <SignOutButton />
    </div>
  )
}
