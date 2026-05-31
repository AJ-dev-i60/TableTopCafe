export default defineNuxtRouteMiddleware(async () => {
  // useRequestFetch() forwards the incoming request's cookies during SSR, so a
  // hard refresh of a /staff page sends the session cookie to /api/auth/me.
  // Raw $fetch does not forward cookies on the server, which caused a redirect
  // to login on every refresh.
  const requestFetch = useRequestFetch()
  try {
    await requestFetch('/api/auth/me')
  } catch {
    return navigateTo('/staff/login')
  }
})
