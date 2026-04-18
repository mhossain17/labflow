import { useCallback, useRef } from 'react'

export function useAutoSave<T>(
  saveFn: (data: T) => Promise<void>,
  delayMs = 1500
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback((data: T) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      saveFn(data).catch(console.error)
    }, delayMs)
  }, [saveFn, delayMs])

  const saveNow = useCallback((data: T) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    return saveFn(data)
  }, [saveFn])

  return { save, saveNow }
}
