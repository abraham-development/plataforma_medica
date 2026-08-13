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
    <section className="container-page py-10">
      <div className={hasNavigation ? 'grid gap-7 lg:grid-cols-[240px_1fr]' : ''}>
        {hasNavigation && (
          <aside className="card h-fit p-4">
            <nav aria-label="Panel" className="grid gap-1">
              {links.map((link) => (
                <Link
                  className="rounded-xl px-4 py-3 font-bold hover:bg-cloud"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </aside>
        )}
        <div>
          <h1 className="text-3xl font-black">{title}</h1>
          <p className="mt-2 text-slate-600">{description}</p>
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </section>
  )
}
