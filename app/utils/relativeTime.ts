// Compact relative time for staff UI ("just now", "5m ago", "3 days ago", or a
// date past ~a week). Accepts a Date or an ISO string (the API serializes
// timestamps to strings over the wire).
export function relativeTime(value: Date | string | null | undefined): string {
  if (!value) return ''
  const then = typeof value === 'string' ? new Date(value) : value
  const ms = Date.now() - then.getTime()
  if (Number.isNaN(ms)) return ''

  const sec = Math.round(ms / 1000)
  if (sec < 60) return 'just now'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.round(hr / 24)
  if (days <= 7) return `${days} day${days === 1 ? '' : 's'} ago`

  return then.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

// True if the timestamp is within the last `withinHours` (default 24h) — used to
// flag a freshly-featured pick before it gets accidentally bumped.
export function isRecent(value: Date | string | null | undefined, withinHours = 24): boolean {
  if (!value) return false
  const then = typeof value === 'string' ? new Date(value) : value
  const ms = Date.now() - then.getTime()
  if (Number.isNaN(ms)) return false
  return ms >= 0 && ms < withinHours * 60 * 60 * 1000
}
