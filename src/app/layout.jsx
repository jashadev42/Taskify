import './globals.css'
import Providers from '@/components/Providers'

export const metadata = {
  title: 'Taskify',
  description: 'Your daily momentum tracker',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
