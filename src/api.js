const DEFAULT_API_BASE_URL = 'https://zohodatathon-60074947232.development.catalystserverless.in/server/zohodatathon_function'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '')

export function buildApiUrl(path = '') {
  if (!path) {
    return API_BASE_URL
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

export function resolveApiUrl(input) {
  if (typeof input !== 'string') {
    return input
  }

  if (input.startsWith('/server/zohodatathon_function')) {
    return buildApiUrl(input.replace('/server/zohodatathon_function', ''))
  }

  return input
}
