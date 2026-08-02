import { loader } from 'fumadocs-core/source'
import { defineDocs } from 'fumadocs-mdx/macro'
import { icons } from 'lucide-react'
import { createElement } from 'react'
import { docsContentRoute, docsRoute } from './shared'

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    async: true,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
})

export const source = loader({
  source: docs.toFumadocsSource(),
  baseUrl: docsRoute,
  // Resolve frontmatter `icon: House` etc. to Lucide nodes (else SPA shows raw names)
  icon(icon) {
    if (!icon) return
    if (icon in icons) {
      return createElement(icons[icon as keyof typeof icons], {
        className: 'size-4 shrink-0',
        'aria-hidden': true,
      })
    }
  },
})

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'content.md']

  return {
    segments,
    url:
      '/' +
      [page.locale, ...docsContentRoute.split('/'), ...segments]
        .filter(Boolean)
        .join('/'),
  }
}

export async function getLLMText(page: (typeof source)['$inferPage']) {
  const processed = await page.data.getText('processed')

  return `# ${page.data.title} (${page.url})

${processed}`
}
