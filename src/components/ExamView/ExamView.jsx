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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{
            width: '8rem', height: '0.4rem', background: 'var(--border)', borderRadius: '0.2rem', overflow: 'hidden'
          }}>
            <div style={{
              width: `${(answeredCount / totalQuestions) * 100}%`, height: '100%',
              background: 'var(--success)', borderRadius: '0.2rem', transition: 'width 0.3s'
            }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{answeredCount}/{totalQuestions}</span>
        </div>
        <button className={`bookmark-star ${isBookmarked ? '' : 'inactive'}`} onClick={() => toggleBookmark(currentIndex)}
          title={isBookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu câu này'}>
          {isBookmarked ? '⭐' : '☆'}
        </button>
      </div>

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
              <span className="choice-label">{labelLetter(idx)}.</span>
              {choice.replace(/^[A-D]\.\s*/, '')}
            </button>
          )
        })}
      </div>

      {hasAnswered && q.Explanation && (
        <div className="explanation">
          <strong>Giải thích:</strong>
          <div style={{ marginTop: '0.35rem', lineHeight: 1.7 }}>{q.Explanation}</div>
        </div>
      )}

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
