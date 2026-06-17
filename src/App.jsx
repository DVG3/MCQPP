import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import { ExamProvider } from './contexts/ExamContext'
import ThemeToggle from './components/common/ThemeToggle'
import QuestionSelector from './components/QuestionSelector/QuestionSelector'
import ExamView from './components/ExamView/ExamView'
import ResultsView from './components/ResultsView/ResultsView'
import { useEffect } from 'react'

function HomeRedirect() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/') }, [])
  return null
}

export default function App() {
  useEffect(() => {
    const handler = (e) => {
      const tabs = document.querySelectorAll('.tab')
      if (tabs.length >= 3) tabs[2].click()
      setTimeout(() => {
        const textareas = document.querySelectorAll('.tab-content textarea')
        if (textareas.length > 0) {
          textareas[0].value = e.detail
          textareas[0].dispatchEvent(new Event('input', { bubbles: true }))
        }
      }, 50)
    }
    window.addEventListener('mcq-fill-paste', handler)
    return () => window.removeEventListener('mcq-fill-paste', handler)
  }, [])

  return (
    <AppProvider>
      <HashRouter>
        <ExamProvider>
          {/* Background elements */}
          <div className="animated-bg"></div>
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>

          <div className="flex flex-col min-h-screen">
            <header className="flex items-center justify-between py-4 mb-6 relative z-10">
              <h1 className="text-2xl font-bold tracking-tight">
                🏥 MCQPP
              </h1>
              <div className="flex items-center gap-2">
                <ThemeToggle />
              </div>
            </header>
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<QuestionSelector />} />
                <Route path="/exam" element={<ExamView />} />
                <Route path="/results" element={<ResultsView />} />
                <Route path="*" element={<HomeRedirect />} />
              </Routes>
            </div>
            <footer className="text-center py-6 text-xs" style={{ color: 'var(--text-secondary)' }}>
              MCQPP — Trắc nghiệm Y Khoa
            </footer>
          </div>
        </ExamProvider>
      </HashRouter>
    </AppProvider>
  )
}
