export default defineNuxtRouteMiddleware(async () => {
  try {
    const me = await $fetch('/api/auth/me')
    if ((me as { role: string }).role !== 'admin') {
      return navigateTo('/staff')
    }
  } catch {
    return navigateTo('/staff/login')
  }
})
