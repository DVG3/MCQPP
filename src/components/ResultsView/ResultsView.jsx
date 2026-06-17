import { useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { useExam } from '../../contexts/ExamContext'
import { downloadJson } from '../../utils/jsonUtils'
import MarkdownRenderer from '../common/MarkdownRenderer'

export default function ResultsView() {
  const { questions, answers, bookmarks, totalQuestions, resetExam, toggleBookmark } = useExam()
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
    // localStorage is already managed real-time by ExamContext toggleBookmark
    downloadJson({ AllQuestions: marked }, 'cau_da_danh_dau')
  }

  const handleBack = () => {
    resetExam()
    navigate('/')
  }

  return (
    <div>
      <div className="card score-summary overflow-hidden">
        <div className="relative z-10" style={{ animation: 'fadeIn 0.6s ease-out' }}>
          <div className="score text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-purple-600 drop-shadow-md">
            {score}%
          </div>
          <div className="score-detail font-medium">
            Đúng <strong className="text-success text-xl">{correctCount}</strong> / {totalQuestions} câu
          </div>
          {totalQuestions > 0 && (
            <div className="score-label mt-4 inline-block px-4 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {score >= 80 ? '🎉 Xuất sắc!' : score >= 60 ? '👍 Khá tốt!' : score >= 40 ? '📚 Cần ôn thêm!' : '💪 Cố gắng hơn!'}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6" style={{ animation: 'fadeIn 0.8s ease-out' }}>
        {results.filter(r => !r.isCorrect).length > 0 && (
          <div className="card p-0 overflow-hidden">
            <div className="collapsible-header bg-red-500/5 border-b border-red-500/10 text-red-600 dark:text-red-400 font-bold px-6 py-4">
              <span>❌ Câu trả lời sai ({totalQuestions - correctCount})</span>
            </div>
            <div className="p-4 sm:p-6 flex flex-col gap-4 bg-white/30 dark:bg-slate-900/30">
              {results.filter(r => !r.isCorrect).map(r => (
                <div key={r.index} className="result-item is-wrong">
                  <div className="result-item-header">
                    <span className="result-q-number text-red-500">Câu {r.index + 1}</span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleBookmark(r.index); }}
                        title={r.isBookmarked ? "Bỏ đánh dấu" : "Đánh dấu câu này"}
                        className={`text-lg transition-all hover:scale-110 ${r.isBookmarked ? 'text-yellow-500 drop-shadow-sm' : 'text-slate-400 dark:text-slate-400 hover:text-yellow-400 opacity-60 hover:opacity-100'}`}
                      >
                        {r.isBookmarked ? '⭐' : '☆'}
                      </button>
                      <span className="result-badge wrong">✗ Sai</span>
                    </div>
                  </div>
                  <MarkdownRenderer content={r.q.Question} />
                  <div className="result-answers mt-4">
                    {r.userAns !== undefined && (
                      <span className="block mb-1">
                        Bạn chọn: <span className="user-ans">{labelLetter(r.userAns)}</span>
                      </span>
                    )}
                    <span className="block">
                      Đáp án đúng: <span className="correct-ans">{labelLetter(r.q.Ans)}</span>
                    </span>
                  </div>
                  {r.q.Explanation && (
                    <div className="result-explain relative overflow-hidden mt-4">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-purple-500"></div>
                      <strong className="text-primary block mb-1">💡 Giải thích:</strong> {r.q.Explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {results.filter(r => r.isCorrect).length > 0 && (
          <details className="card p-0 overflow-hidden group">
            <summary className="collapsible-header bg-green-500/5 border-b border-green-500/10 text-green-600 dark:text-green-400 font-bold px-6 py-4 cursor-pointer list-none flex justify-between items-center">
              <span>✅ Câu trả lời đúng ({correctCount})</span>
              <span className="transition-transform group-open:rotate-180">▼</span>
            </summary>
            <div className="p-4 sm:p-6 flex flex-col gap-4 bg-white/30 dark:bg-slate-900/30">
              {results.filter(r => r.isCorrect).map(r => (
                <div key={r.index} className="result-item is-correct opacity-80 hover:opacity-100 transition-opacity">
                  <div className="result-item-header">
                    <span className="result-q-number text-green-500">Câu {r.index + 1}</span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleBookmark(r.index); }}
                        title={r.isBookmarked ? "Bỏ đánh dấu" : "Đánh dấu câu này"}
                        className={`text-lg transition-all hover:scale-110 ${r.isBookmarked ? 'text-yellow-500 drop-shadow-sm' : 'text-slate-400 dark:text-slate-400 hover:text-yellow-400 opacity-60 hover:opacity-100'}`}
                      >
                        {r.isBookmarked ? '⭐' : '☆'}
                      </button>
                      <span className="result-badge correct">✓ Đúng</span>
                    </div>
                  </div>
                  <MarkdownRenderer content={r.q.Question} />
                  <div className="result-answers mt-4">
                    <span className="block">
                      Bạn chọn: <span className="same-ans">{labelLetter(r.userAns)}</span>
                    </span>
                  </div>
                  {r.q.Explanation && (
                    <div className="result-explain relative overflow-hidden mt-4">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-400 to-emerald-500"></div>
                      <strong className="text-success block mb-1">💡 Giải thích:</strong> {r.q.Explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}
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
