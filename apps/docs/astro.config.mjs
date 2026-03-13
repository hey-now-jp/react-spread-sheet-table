import react from '@astrojs/react'
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://heynow-dev.github.io',
  base: '/react-spread-sheet-table',
  integrations: [
    starlight({
      title: 'React SpreadSheet Table',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/heynow-dev/react-spread-sheet-table',
        },
      ],
      sidebar: [
        {
          label: 'Guide',
          autogenerate: { directory: 'guides' },
        },
        {
          label: 'API Reference',
          autogenerate: { directory: 'api' },
        },
        {
          label: 'Playground',
          autogenerate: { directory: 'playground' },
        },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
    react(),
  ],
  vite: {
    ssr: {
      noExternal: ['@hey-now-jp/react-spread-sheet-table'],
    },
  },
})
