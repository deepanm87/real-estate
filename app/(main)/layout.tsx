export default function MainLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <main id="main" className="flex-1">
        {children}
      </main>
    </div>
  )
}