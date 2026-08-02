import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { ExternalLink } from 'lucide-react'
import { appName, appUrl } from './shared'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <img
            src="/icons/app-logo.svg"
            alt=""
            width={24}
            height={24}
            className="size-6 shrink-0"
          />
          <span className="font-semibold tracking-tight">{appName}</span>
        </>
      ),
      url: '/',
    },
    // Icon link stays in the header chrome — `type: 'main'` becomes a full-width
    // mobile strip that collides with the content column.
    links: [
      {
        type: 'icon',
        label: 'Open MockMatch app',
        text: 'Open app',
        url: appUrl,
        external: true,
        icon: <ExternalLink className="size-4" aria-hidden />,
      },
    ],
  }
}
