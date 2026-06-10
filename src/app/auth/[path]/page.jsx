import { AuthView } from '@neondatabase/auth-ui'
import { authViewPaths } from '@neondatabase/auth-ui/server'

export const dynamicParams = false

export function generateStaticParams() {
  return Object.values(authViewPaths).map(path => ({ path }))
}

export default async function AuthPage({ params }) {
  const { path } = await params
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-slate-900 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">✅</div>
        <h1 className="text-white text-3xl font-bold tracking-tight">Taskify</h1>
        <p className="text-white/40 text-sm mt-1">Your daily momentum tracker</p>
      </div>
      <div className="w-full max-w-sm">
        <AuthView path={path} />
      </div>
    </div>
  )
}
