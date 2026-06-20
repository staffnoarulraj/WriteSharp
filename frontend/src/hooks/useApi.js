import { useState, useCallback } from 'react'

const BASE_URL = '/api'

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const call = useCallback(async (endpoint, body) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      return await res.json()
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { call, loading, error }
}
