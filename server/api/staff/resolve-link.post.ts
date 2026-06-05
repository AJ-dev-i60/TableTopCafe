import { z } from 'zod'
import { requireAuth } from '../../services/auth'

const bodySchema = z.object({
  url: z.string().url(),
})

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid URL' })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)

  try {
    const res = await fetch(parsed.data.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TableTopCafe/1.0 (link-preview)',
        Accept: 'text/html',
      },
      redirect: 'follow',
    })
    clearTimeout(timeout)

    if (!res.ok) return { title: null }

    // Read only the first 32 KB — enough to find the <title> without streaming
    // the full page (some sites serve multi-MB HTML).
    const reader = res.body?.getReader()
    if (!reader) return { title: null }

    let html = ''
    let bytesRead = 0
    const decoder = new TextDecoder()
    while (bytesRead < 32768) {
      const { done, value } = await reader.read()
      if (done) break
      html += decoder.decode(value, { stream: !done })
      bytesRead += value?.length ?? 0
      // Stop as soon as we've found </title> — no need to read further.
      if (/<\/title>/i.test(html)) break
    }
    reader.cancel().catch(() => {})

    const match = html.match(/<title[^>]*>([^<]{1,300})<\/title>/i)
    const raw = match?.[1]?.trim() ?? null
    const title = raw ? raw.replace(/\s+/g, ' ') : null

    return { title }
  } catch {
    clearTimeout(timeout)
    return { title: null }
  }
})
