import Link from 'next/link'
export function DashboardShell({
  title,
  description,
  links,
  children,
}: {
  title: string
  description: string
  links: { href: string; label: string }[]
  children: React.ReactNode
}) {
  const hasNavigation = links.length > 0
  return (
    <section className="container-page py-6 sm:py-10">
      <div className={hasNavigation ? 'grid gap-7 lg:grid-cols-[240px_1fr]' : ''}>
        {hasNavigation && (
          <aside className="card h-fit overflow-x-auto p-2 lg:p-4">
            <nav aria-label="Panel" className="flex min-w-max gap-1 lg:grid lg:min-w-0">
              {links.map((link) => (
                <Link
                  className="whitespace-nowrap rounded-xl px-4 py-3 font-bold hover:bg-cloud"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </aside>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-black sm:text-3xl">{title}</h1>
          <p className="mt-2 text-slate-600">{description}</p>
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </section>
  )
}
