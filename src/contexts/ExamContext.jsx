import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { shuffle } from '../utils/shuffle'

const BOOKMARK_KEY = 'mcq-current-bookmarks'
const EXPORT_KEY = 'mcq-bookmarks-export'

const ExamContext = createContext(null)

export function ExamProvider({ children }) {
  const [questions, setQuestionsState] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [bookmarks, setBookmarks] = useState({})
  const questionsRef = useRef(questions)
  questionsRef.current = questions

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BOOKMARK_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          setBookmarks(parsed)
        }
      }
    } catch {}
  }, [])



  const startExam = useCallback((rawQuestions, doShuffle) => {
    const qs = doShuffle ? shuffle(rawQuestions) : [...rawQuestions]
    setQuestionsState(qs)
    setCurrentIndex(0)
    setAnswers({})
    const restored = {}
    try {
      const raw = localStorage.getItem(BOOKMARK_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          Object.assign(restored, parsed)
        }
      }
    } catch {}
    setBookmarks(restored)
  }, [])

  const setAnswer = useCallback((index, choiceIdx) => {
    setAnswers(a => ({ ...a, [index]: choiceIdx }))
  }, [])

  const toggleBookmark = useCallback((index) => {
    setBookmarks(prev => {
      const next = { ...prev }
      const isNowBookmarked = !next[index]
      if (isNowBookmarked) {
        next[index] = true
      } else {
        delete next[index]
      }
      
      const qs = questionsRef.current
      if (qs && qs[index]) {
        const q = qs[index]
        try {
          const raw = localStorage.getItem(EXPORT_KEY)
          let exportData = raw ? JSON.parse(raw) : []
          if (!Array.isArray(exportData)) exportData = []
          
          if (isNowBookmarked) {
            if (!exportData.find(ex => ex.Question === q.Question)) {
              exportData.push({
                Question: q.Question,
                Choices: q.Choices,
                Ans: q.Ans,
                Explanation: q.Explanation,
              })
            }
          } else {
            exportData = exportData.filter(ex => ex.Question !== q.Question)
          }
          
          if (exportData.length > 0) {
            localStorage.setItem(EXPORT_KEY, JSON.stringify(exportData))
          } else {
            localStorage.removeItem(EXPORT_KEY)
          }
        } catch {}
      }
      
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const goNext = useCallback(() => {
    if (questions && currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1)
    }
  }, [questions, currentIndex])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1)
  }, [currentIndex])

  const goTo = useCallback((i) => {
    if (questions && i >= 0 && i < questions.length) setCurrentIndex(i)
  }, [questions])

  const totalQuestions = questions ? questions.length : 0
  const answeredCount = Object.keys(answers).length
  const isFinished = questions && answeredCount === totalQuestions

  const resetExam = useCallback(() => {
    setQuestionsState(null)
    setCurrentIndex(0)
    setAnswers({})
    setBookmarks({})
    localStorage.removeItem(BOOKMARK_KEY)
  }, [])

  return (
    <ExamContext.Provider value={{
      questions, currentIndex, answers, bookmarks,
      totalQuestions, answeredCount, isFinished,
      startExam, setAnswer, toggleBookmark,
      goNext, goPrev, goTo, resetExam,
    }}>
      {children}
    </ExamContext.Provider>
  )
}

export function useExam() {
  const ctx = useContext(ExamContext)
  if (!ctx) throw new Error('useExam must be inside ExamProvider')
  return ctx
}
