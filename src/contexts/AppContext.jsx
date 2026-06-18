import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [questions, setQuestions] = useState(null)
  const [streamingConfig, setStreamingConfig] = useState(null)
  const [latestAiExam, setLatestAiExam] = useState(null)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mcq-theme') || 'light'
  })
  const [shuffleEnabled, setShuffleEnabled] = useState(() => {
    return localStorage.getItem('mcq-shuffle') === 'true'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('mcq-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'light' ? 'dark' : 'light'))
  }, [])

  const toggleShuffle = useCallback(() => {
    setShuffleEnabled(p => {
      const next = !p
      localStorage.setItem('mcq-shuffle', next)
      return next
    })
  }, [])

  const clearQuestions = useCallback(() => setQuestions(null), [])
  const clearStreamingConfig = useCallback(() => setStreamingConfig(null), [])

  return (
    <AppContext.Provider value={{
      questions, setQuestions, clearQuestions,
      streamingConfig, setStreamingConfig, clearStreamingConfig,
      latestAiExam, setLatestAiExam,
      theme, toggleTheme,
      shuffleEnabled, toggleShuffle,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
