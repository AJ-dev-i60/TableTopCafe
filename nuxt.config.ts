import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'node:child_process'

// Version is the timestamp of the latest commit in Africa/Johannesburg time,
// formatted as v{YY}.{MM}.{DD}.{HHMM} (e.g. v26.05.30.1632). Stable per commit
// — a Coolify rebuild of the same commit produces the same version.
function computeBuildNumber(): string {
  let iso: string
  try {
    iso = execSync('git log -1 --format=%cI HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    console.warn('[nuxt.config] git not available — falling back to build-time timestamp')
    iso = new Date().toISOString()
  }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Johannesburg',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(iso))
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value]),
  )
  return `v${parts.year}.${parts.month}.${parts.day}.${parts.hour}${parts.minute}`
}

const buildNumber = computeBuildNumber()

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2024-11-01',

  ssr: true,

  runtimeConfig: {
    public: {
      buildNumber,
    },
  },

  css: ['~/assets/css/tokens.css'],

  app: {
    head: {
      title: 'TableTopCafe',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'theme-color', content: '#15803d' },
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
