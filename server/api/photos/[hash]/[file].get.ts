import { createReadStream, existsSync } from 'node:fs'
import { extname, join } from 'node:path'
import { PHOTOS_DIR } from '../../../services/photos'

const ALLOWED_EXTS = new Set(['.webp', '.jpg'])
const MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
}

export default defineEventHandler((event) => {
  const hash = getRouterParam(event, 'hash') ?? ''
  const file = getRouterParam(event, 'file') ?? ''

  if (!/^[0-9a-f]{32}$/.test(hash)) {
    throw createError({ statusCode: 400, message: 'Invalid hash' })
  }

  const ext = extname(file)
  if (!ALLOWED_EXTS.has(ext)) {
    throw createError({ statusCode: 400, message: 'Invalid file type' })
  }

  const filePath = join(PHOTOS_DIR, hash, file)

  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, message: 'Photo not found' })
  }

  setResponseHeader(event, 'Content-Type', MIME[ext] ?? 'application/octet-stream')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

  return sendStream(event, createReadStream(filePath))
})
