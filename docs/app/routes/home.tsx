import { baseOptions } from '@/lib/layout.shared'
import { appUrl } from '@/lib/shared'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { Link } from 'react-router'
import type { Route } from './+types/home'

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'MockMatch Docs' },
    {
      name: 'description',
      content:
        'Product help for MockMatch — documents, jobs, practice, and readiness.',
    },
  ]
}

const areas = [
  {
    title: 'Documents',
    description: 'Resume Lab, cover letters, templates, import, export, collab.',
    href: '/docs/documents',
    appPath: '/dashboard/resumes',
  },
  {
    title: 'Jobs',
    description: 'Discover roles and track applications through stages.',
    href: '/docs/jobs',
    appPath: '/dashboard/discover',
  },
  {
    title: 'Practice',
    description: 'Simulations and question bank for interview-like prep.',
    href: '/docs/practice',
    appPath: '/dashboard/simulations',
  },
  {
    title: 'Insights',
    description: 'Readiness and performance signals for the next step.',
    href: '/docs/insights',
    appPath: '/dashboard/readiness',
  },
] as const

export default function Home() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-medium text-fd-primary">MockMatch Docs</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Prep loop, mapped
          </h1>
          <p className="max-w-2xl text-fd-muted-foreground">
            Product help for the MockMatch workspace: documents → jobs →
            practice → readiness. Pages are stubs for now; full guides land
            later.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/docs"
              className="inline-flex h-9 items-center rounded-lg bg-fd-primary px-3 text-sm font-medium text-fd-primary-foreground"
            >
              Browse docs
            </Link>
            <a
              href={appUrl}
              className="inline-flex h-9 items-center rounded-lg border border-fd-border bg-fd-card px-3 text-sm font-medium text-fd-foreground"
            >
              Open MockMatch
            </a>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {areas.map((area) => (
            <article
              key={area.href}
              className="flex flex-col gap-3 rounded-xl border border-fd-border bg-fd-card p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold tracking-tight">
                {area.title}
              </h2>
              <p className="flex-1 text-sm text-fd-muted-foreground">
                {area.description}
              </p>
              <div className="flex flex-wrap gap-3 text-sm font-medium">
                <Link
                  to={area.href}
                  className="text-fd-primary hover:underline"
                >
                  Read docs
                </Link>
                <a
                  href={`${appUrl}${area.appPath}`}
                  className="text-fd-muted-foreground hover:text-fd-foreground hover:underline"
                >
                  Open in app
                </a>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-xl border border-dashed border-fd-border bg-fd-muted/40 p-5">
          <h2 className="text-base font-semibold">Coming later</h2>
          <p className="mt-1 text-sm text-fd-muted-foreground">
            Career guides (perfect resume, cover letter, and more) will live
            under{' '}
            <Link to="/docs/guides" className="text-fd-primary hover:underline">
              Guides
            </Link>
            . Until then, start with{' '}
            <Link
              to="/docs/getting-started"
              className="text-fd-primary hover:underline"
            >
              Getting started
            </Link>
            .
          </p>
        </section>
      </main>
    </HomeLayout>
  )
}
