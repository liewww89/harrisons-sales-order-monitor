import { useEffect, useState } from 'react'
import { getJson } from './api'

interface Snapshot<T> {
  key: string
  data: T | null
  error: string | null
  updatedAt: Date | null
}

// A response belongs to an exact path + retry generation. Previous results are
// never presented under new filters, even before the effect cleanup runs.
export function useApiResource<T>(path: string, parse: (value: unknown) => T) {
  const [generation, setGeneration] = useState(0)
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null)
  const key = `${generation}:${path}`

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    getJson(path, controller.signal).then(parse).then(
      (data) => { if (active) setSnapshot({ key, data, error: null, updatedAt: new Date() }) },
      (error: unknown) => {
        if (active) setSnapshot({ key, data: null, error: error instanceof Error ? error.message : 'An unexpected request error occurred.', updatedAt: null })
      },
    )
    return () => { active = false; controller.abort() }
  }, [path, parse, key])

  const current = snapshot?.key === key ? snapshot : null
  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    updatedAt: current?.updatedAt ?? null,
    loading: current === null,
    retry: () => setGeneration((v) => v + 1),
  }
}
