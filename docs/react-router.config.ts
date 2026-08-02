import type { Config } from '@react-router/dev/config'
import { createGetUrl, getSlugs } from 'fumadocs-core/source'
import { glob } from 'node:fs/promises'

const getUrl = createGetUrl('/docs')

export default {
  ssr: false,
  async prerender({ getStaticPaths }) {
    const paths: string[] = []
    const excluded: string[] = []

    for (const path of getStaticPaths()) {
      if (!excluded.includes(path)) paths.push(path)
    }

    for await (const entry of glob('**/*.mdx', { cwd: 'content/docs' })) {
      // Windows glob may return backslashes; Fumadocs slug paths are always `/`
      const normalized = String(entry).replaceAll('\\', '/')
      const slugs = getSlugs(normalized)
      paths.push(
        getUrl(slugs),
        `/llms.mdx/docs/${[...slugs, 'content.md'].join('/')}`,
      )
    }

    return paths
  },
} satisfies Config
