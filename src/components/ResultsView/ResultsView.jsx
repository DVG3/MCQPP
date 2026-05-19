import { useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { useExam } from '../../contexts/ExamContext'
import { downloadJson } from '../../utils/jsonUtils'
import MarkdownRenderer from '../common/MarkdownRenderer'

export default function ResultsView() {
  const { questions, answers, bookmarks, totalQuestions, resetExam } = useExam()
  const navigate = useNavigate()
  const { shuffleEnabled } = useApp()

  if (!questions || questions.length === 0) {
    return (
      <div className="empty-state">
        <p>Không có dữ liệu kết quả.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Về chọn đề</button>
      </div>
    )
  }

  let correctCount = 0
  const results = questions.map((q, i) => {
    const userAns = answers[i]
    const isCorrect = userAns === q.Ans
    if (isCorrect) correctCount++
    return { index: i, q, userAns, isCorrect, isBookmarked: !!bookmarks[i] }
  })

  const score = Math.round((correctCount / totalQuestions) * 100)
  const labelLetter = (i) => String.fromCharCode(65 + i)

  const saveWrong = () => {
    const wrong = results.filter(r => !r.isCorrect).map(r => ({
      Question: r.q.Question,
      Choices: r.q.Choices,
      Ans: r.q.Ans,
      Explanation: r.q.Explanation,
    }))
    downloadJson({ AllQuestions: wrong }, 'cau_sai')
  }

  const saveAll = () => {
    const all = questions.map(q => ({
      Question: q.Question,
      Choices: q.Choices,
      Ans: q.Ans,
      Explanation: q.Explanation,
    }))
    downloadJson({ AllQuestions: all }, 'tat_ca_cau')
  }

  const saveBookmarked = () => {
    const marked = results.filter(r => r.isBookmarked).map(r => ({
      Question: r.q.Question,
      Choices: r.q.Choices,
      Ans: r.q.Ans,
      Explanation: r.q.Explanation,
    }))
    // Also save to localStorage for BookmarkManager tab
    localStorage.setItem('mcq-bookmarks-export', JSON.stringify(marked))
    downloadJson({ AllQuestions: marked }, 'cau_da_danh_dau')
  }

  const handleBack = () => {
    resetExam()
    navigate('/')
  }

  return (
    <div>
      <div className="card score-summary">
        <div className="score">{score}%</div>
        <div className="score-detail">
          Đúng <strong>{correctCount}</strong> / {totalQuestions} câu
        </div>
        {totalQuestions > 0 && (
          <div className="score-label">
            {score >= 80 ? '🎉 Xuất sắc!' : score >= 60 ? '👍 Khá tốt!' : score >= 40 ? '📚 Cần ôn thêm!' : '💪 Cố gắng hơn!'}
          </div>
        )}
      </div>

      <div className="result-list">
        {results.map(r => (
          <div key={r.index} className={`result-item ${r.isCorrect ? 'is-correct' : 'is-wrong'}`}>
            <div className="result-item-header">
              <span className="result-q-number">Câu {r.index + 1}</span>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                {r.isBookmarked && <span style={{ fontSize: '0.85rem' }}>⭐</span>}
                <span className={`result-badge ${r.isCorrect ? 'correct' : 'wrong'}`}>
                  {r.isCorrect ? '✓ Đúng' : '✗ Sai'}
                </span>
              </div>
            </div>
            <MarkdownRenderer content={r.q.Question} />
            <div className="result-answers">
              {r.userAns !== undefined && (
                <span>
                  Bạn chọn: <span className={r.isCorrect ? 'same-ans' : 'user-ans'}>{labelLetter(r.userAns)}</span>
                </span>
              )}
              {!r.isCorrect && (
                <span>
                  {' | '}Đáp án đúng: <span className="correct-ans">{labelLetter(r.q.Ans)}</span>
                </span>
              )}
            </div>
            {r.q.Explanation && (
              <div className="result-explain">
                <strong>Giải thích:</strong> {r.q.Explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="result-actions">
        <button className="btn btn-outline" onClick={handleBack}>🏠 Về chọn đề</button>
        <button className="btn btn-primary" onClick={saveAll}>📥 Lưu tất cả câu</button>
        <button className="btn btn-danger" onClick={saveWrong}>💾 Lưu câu sai</button>
        <button className="btn btn-accent" onClick={saveBookmarked}>⭐ Lưu đã đánh dấu</button>
      </div>
    </div>
  )
}
