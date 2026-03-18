import { useEffect } from 'react'

export function useTheme(theme) {
  useEffect(() => {
    const root = document.documentElement
    let resolved = theme
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    root.setAttribute('data-theme', resolved)
    resolved === 'dark' ? root.classList.add('dark') : root.classList.remove('dark')
  }, [theme])
}
