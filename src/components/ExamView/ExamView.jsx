import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { useExam } from '../../contexts/ExamContext'
import MarkdownRenderer from '../common/MarkdownRenderer'

export default function ExamView() {
  const { questions: appQuestions, shuffleEnabled, clearQuestions } = useApp()
  const { questions, currentIndex, answers, bookmarks,
    totalQuestions, answeredCount,
    startExam, setAnswer, toggleBookmark, goNext, goPrev } = useExam()
  const navigate = useNavigate()

  useEffect(() => {
    if (appQuestions) {
      startExam(appQuestions, shuffleEnabled)
      clearQuestions()
    }
  }, [appQuestions])

  if (!questions || questions.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">📝</div>
        <p>Chưa có đề thi nào được chọn.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
          Quay về chọn đề
        </button>
      </div>
    )
  }

  const q = questions[currentIndex]
  const selected = answers[currentIndex]
  const isBookmarked = !!bookmarks[currentIndex]
  const hasAnswered = selected !== undefined
  const isLast = currentIndex === totalQuestions - 1
  const allDone = answeredCount === totalQuestions

  const handleChoice = (idx) => {
    if (hasAnswered) return
    setAnswer(currentIndex, idx)
  }

  const handleFinish = () => {
    if (allDone || confirm('Bạn chưa trả lời hết câu. Kết thúc?')) {
      navigate('/results')
    }
  }

  const labelLetter = (i) => String.fromCharCode(65 + i)

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span className="question-number">Câu {currentIndex + 1} / {totalQuestions}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '150px' }}>
          <div style={{
            flex: 1, height: '0.5rem', background: 'var(--border)', borderRadius: '1rem', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              width: `${(answeredCount / totalQuestions) * 100}%`, height: '100%',
              background: 'linear-gradient(90deg, var(--success), #6ee7b7)', borderRadius: '1rem', transition: 'width 0.4s ease',
              boxShadow: '0 0 10px var(--success)'
            }} />
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '700' }}>{answeredCount}/{totalQuestions}</span>
        </div>
        <button className={`bookmark-star ${isBookmarked ? '' : 'inactive'}`} onClick={() => toggleBookmark(currentIndex)}
          title={isBookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu câu này'}>
          {isBookmarked ? '⭐' : '☆'}
        </button>
      </div>

      <div key={currentIndex} style={{ animation: 'fadeIn 0.5s ease-out' }}>
        <MarkdownRenderer content={q.Question} />

        <div className="choices">
          {q.Choices.map((choice, idx) => {
            let cls = 'choice-btn'
            if (hasAnswered) {
              cls += ' disabled'
              if (idx === q.Ans) cls += ' correct'
              else if (idx === selected && idx !== q.Ans) cls += ' wrong'
              if (idx === selected) cls += ' selected'
            }
            return (
              <button key={idx} className={cls} onClick={() => handleChoice(idx)}>
                <span className="choice-label">{labelLetter(idx)}</span>
                <span className="ml-2">{choice.replace(/^[A-D]\.\s*/, '')}</span>
              </button>
            )
          })}
        </div>

        {hasAnswered && q.Explanation && (
          <div className="explanation relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-purple-500"></div>
            <strong className="text-primary block mb-2">💡 Giải thích:</strong>
            <div style={{ lineHeight: 1.7 }} className="text-slate-700 dark:text-slate-300">
              {q.Explanation}
            </div>
          </div>
        )}
      </div>

      <div className="exam-nav">
        <button className="btn btn-outline btn-sm" onClick={goPrev} disabled={currentIndex === 0}>
          ← Trước
        </button>
        <div className="exam-nav-center">
          {isLast ? (
            <button className="btn btn-success btn-sm" onClick={handleFinish}>
              🏁 Kết thúc
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={goNext} disabled={!hasAnswered}>
              Tiếp →
            </button>
          )}
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/')}>
          🏠 Chọn đề
        </button>
      </div>
    </div>
  )
}
