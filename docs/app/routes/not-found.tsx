import { baseOptions } from '@/lib/layout.shared'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { Link } from 'react-router'
import type { Route } from './+types/not-found'

export function meta(_args: Route.MetaArgs) {
  return [{ title: 'Not Found · MockMatch Docs' }]
}

export default function NotFound() {
  return (
    <HomeLayout {...baseOptions()}>
      <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
        <h1 className="mb-2 text-xl font-bold">Not found</h1>
        <p className="mb-4 text-fd-muted-foreground">
          This page could not be found.
        </p>
        <Link
          className="rounded-lg bg-fd-primary px-4 py-2.5 text-sm font-medium text-fd-primary-foreground"
          to="/docs"
        >
          Back to docs
        </Link>
      </div>
    </HomeLayout>
  )
}
