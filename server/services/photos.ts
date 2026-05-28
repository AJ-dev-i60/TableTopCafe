import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

export const PHOTOS_DIR = process.env.PHOTOS_DIR ?? './photos'

const SIZES = {
  thumb: 200,
  card: 600,
  detail: 1200,
} as const

export type PhotoSize = keyof typeof SIZES

export async function processPhoto(sourceBuffer: Buffer): Promise<string> {
  const hash = createHash('sha256').update(sourceBuffer).digest('hex').slice(0, 32)
  const dir = join(PHOTOS_DIR, hash)
  await mkdir(dir, { recursive: true })

  await Promise.all(
    (Object.entries(SIZES) as [PhotoSize, number][]).flatMap(([size, width]) => [
      sharp(sourceBuffer)
        .resize(width, null, { withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(join(dir, `${size}.webp`)),
      sharp(sourceBuffer)
        .resize(width, null, { withoutEnlargement: true })
        .jpeg({ quality: 85, progressive: true })
        .toFile(join(dir, `${size}.jpg`)),
    ]),
  )

  return hash
}

export async function writePlaceholderPhoto(
  r: number,
  g: number,
  b: number,
): Promise<string> {
  const sourceBuffer = await sharp({
    create: { width: 1200, height: 800, channels: 3, background: { r, g, b } },
  })
    .jpeg({ quality: 80 })
    .toBuffer()
  return processPhoto(sourceBuffer)
}

export function photoPath(hash: string, size: PhotoSize, ext: 'webp' | 'jpg'): string {
  return join(PHOTOS_DIR, hash, `${size}.${ext}`)
}

export async function savePhotoBuffer(hash: string, filename: string, data: Buffer): Promise<void> {
  const dir = join(PHOTOS_DIR, hash)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, filename), data)
}
