export default defineNuxtRouteMiddleware(async () => {
  // See app/middleware/auth.ts — useRequestFetch() forwards the session cookie
  // during SSR so a hard refresh doesn't bounce the user to login.
  const requestFetch = useRequestFetch()
  try {
    const me = await requestFetch<{ role: string }>('/api/auth/me')
    if (me.role !== 'admin') {
      return navigateTo('/staff')
    }
  } catch {
    return navigateTo('/staff/login')
  }
})
