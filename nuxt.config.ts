import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string }

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2024-11-01',

  ssr: true,

  runtimeConfig: {
    public: {
      version,
    },
  },

  css: ['~/assets/css/tokens.css'],

  app: {
    head: {
      title: 'TableTopCafe',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#2563eb' },
        { name: 'description', content: 'Browse the board game library at TableTopCafe' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/icon-180.png' },
      ],
      script: [
        {
          innerHTML: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js') }`,
          tagPosition: 'bodyClose',
        },
      ],
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  nitro: {
    externals: {
      inline: ['postgres', 'drizzle-orm'],
      external: ['sharp', '@node-rs/argon2'],
    },
  },
})
