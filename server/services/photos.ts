import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

export const PHOTOS_DIR = process.env.PHOTOS_DIR ?? './photos'

const SIZES = {
  thumb: 200,
  card: 600,
  detail: 1200,
} as const

export type PhotoSize = keyof typeof SIZES

function hashBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex').slice(0, 32)
}

export async function processPhoto(sourceBuffer: Buffer): Promise<string> {
  const hash = hashBuffer(sourceBuffer)
  const dir = join(PHOTOS_DIR, hash)
  await mkdir(dir, { recursive: true })

  await Promise.all(
    (Object.entries(SIZES) as [PhotoSize, number][]).flatMap(([size, width]) => [
      // .rotate() with no angle auto-orients from EXIF (and strips the flag), so
      // phone-camera photos come out upright instead of sideways.
      sharp(sourceBuffer)
        .rotate()
        .resize(width, null, { withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(join(dir, `${size}.webp`)),
      sharp(sourceBuffer)
        .rotate()
        .resize(width, null, { withoutEnlargement: true })
        .jpeg({ quality: 85, progressive: true })
        .toFile(join(dir, `${size}.jpg`)),
    ]),
  )

  return hash
}

// Rotate a stored photo 90° and re-process it into a fresh set of derivatives
// under a new content hash. The largest derivative (detail) is the source —
// the original upload isn't kept — which is plenty for orientation fixes.
export async function rotatePhoto(hash: string, direction: 'cw' | 'ccw'): Promise<string> {
  const source = await readFile(photoPath(hash, 'detail', 'jpg'))
  const rotated = await sharp(source)
    .rotate(direction === 'cw' ? 90 : -90)
    .jpeg({ quality: 90 })
    .toBuffer()
  return processPhoto(rotated)
}

// Remove every derivative file for a hash. Only call when no DB row references
// it any more (placeholder images are shared across games by hash).
export async function deletePhotoFiles(hash: string): Promise<void> {
  await rm(join(PHOTOS_DIR, hash), { recursive: true, force: true })
}

// Solid-colour palette used for seeded placeholder photos. Shared with the seed
// script so the upload route can recognise (and clear) placeholders by hash.
export const PLACEHOLDER_PALETTE: [number, number, number][] = [
  [99, 140, 185], // slate blue
  [180, 120, 75], // warm amber
  [90, 160, 120], // sage green
  [200, 90, 85], // terracotta
  [130, 100, 180], // dusty purple
  [70, 150, 160], // teal
  [210, 160, 60], // golden yellow
]

async function renderPlaceholderBuffer(r: number, g: number, b: number): Promise<Buffer> {
  return sharp({
    create: { width: 1200, height: 800, channels: 3, background: { r, g, b } },
  })
    .jpeg({ quality: 80 })
    .toBuffer()
}

export async function writePlaceholderPhoto(
  r: number,
  g: number,
  b: number,
): Promise<string> {
  return processPhoto(await renderPlaceholderBuffer(r, g, b))
}

// The content hashes of every palette placeholder. Deterministic (same sharp
// output → same hash), computed once and cached. sharp runs on the same Linux
// image at seed time and upload time, so the hashes line up at runtime.
let cachedPlaceholderHashes: Set<string> | null = null
export async function getPlaceholderHashes(): Promise<Set<string>> {
  if (!cachedPlaceholderHashes) {
    const hashes = await Promise.all(
      PLACEHOLDER_PALETTE.map(async ([r, g, b]) => hashBuffer(await renderPlaceholderBuffer(r, g, b))),
    )
    cachedPlaceholderHashes = new Set(hashes)
  }
  return cachedPlaceholderHashes
}

export function photoPath(hash: string, size: PhotoSize, ext: 'webp' | 'jpg'): string {
  return join(PHOTOS_DIR, hash, `${size}.${ext}`)
}

export async function savePhotoBuffer(hash: string, filename: string, data: Buffer): Promise<void> {
  const dir = join(PHOTOS_DIR, hash)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, filename), data)
}
