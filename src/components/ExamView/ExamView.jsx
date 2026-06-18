import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { useExam } from '../../contexts/ExamContext'
import MarkdownRenderer from '../common/MarkdownRenderer'
import { generateAiBatchStream } from '../../services/gemini'

export default function ExamView() {
  const { questions: appQuestions, shuffleEnabled, clearQuestions, streamingConfig, clearStreamingConfig, setLatestAiExam } = useApp()
  const { questions, currentIndex, answers, bookmarks,
    totalQuestions, answeredCount,
    startExam, setAnswer, toggleBookmark, goNext, goPrev, updateQuestions, startNextBatchTransition } = useExam()
  const navigate = useNavigate()

  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false)
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0)
  const [rawAiResponse, setRawAiResponse] = useState('')
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    if (appQuestions) {
      startExam(appQuestions, shuffleEnabled)
      clearQuestions()
    }
  }, [appQuestions])

  useEffect(() => {
    if (streamingConfig && currentBatchIndex === 0 && !questions) {
      setLatestAiExam([])
      fetchNextBatch(0)
    }
  }, [streamingConfig])

  const fetchNextBatch = async (batchIndex) => {
    if (!streamingConfig) return
    const batch = streamingConfig.batches[batchIndex]
    if (!batch) return

    setIsGeneratingBatch(true)
    setRawAiResponse('')

    // 1. Tạo các placeholder cho batch hiện tại
    const placeholders = Array(batch.count).fill(null).map(() => ({ isPlaceholder: true }))

    // Lưu độ dài hiện tại làm mốc
    const baseLength = questions ? questions.length : 0

    // 2. Chuyển tiếp ngay lập tức sang trạng thái mới
    if (batchIndex === 0) {
      startExam(placeholders, false)
    } else {
      startNextBatchTransition(placeholders)
    }

    try {
      await generateAiBatchStream(
        streamingConfig,
        batch,
        // onQuestionsUpdated: cập nhật câu hỏi khi stream về
        (streamedQs, rawText) => {
          setRawAiResponse(rawText)
          updateQuestions(prev => {
            if (!prev) return prev
            const next = [...prev]
            const startIndex = batchIndex === 0 ? 0 : baseLength
            for (let i = 0; i < batch.count; i++) {
              if (streamedQs[i]) {
                next[startIndex + i] = streamedQs[i]
              }
            }
            return next
          })
        },
        // onDone: khi hoàn thành sinh toàn bộ batch
        (finalQs, rawText) => {
          setRawAiResponse(rawText)
          updateQuestions(prev => {
            if (!prev) return prev
            const next = [...prev]
            const startIndex = batchIndex === 0 ? 0 : baseLength
            for (let i = 0; i < batch.count; i++) {
              if (finalQs[i]) {
                next[startIndex + i] = finalQs[i]
              }
            }
            
            // Lưu đề thi thực tế đã có đầy đủ câu hỏi
            const cleanExam = next.filter(q => !q.isPlaceholder)
            setLatestAiExam(cleanExam)

            return next
          })
          setIsGeneratingBatch(false)
          setCurrentBatchIndex(batchIndex + 1)
        },
        // onError: xử lý lỗi khi gọi API
        (err) => {
          let friendlyMessage = err.message
          if (
            err.message.toLowerCase().includes("high demand") || 
            err.message.toLowerCase().includes("exhausted") || 
            err.message.toLowerCase().includes("limit") || 
            err.message.includes("429") || 
            err.message.includes("503")
          ) {
            friendlyMessage = `Model này hiện đang bị quá tải hoặc đạt giới hạn số lần gọi từ Google (Rate Limit / High Demand).\n\n💡 Cách khắc phục: Bạn hãy quay lại chọn Model khác (ví dụ: gemini-2.0-flash, gemini-1.5-pro,...) rồi thử lại.\n\nChi tiết lỗi: ${err.message}`
          }
          alert("Lỗi khi sinh câu hỏi:\n\n" + friendlyMessage)
          
          if (batchIndex === 0) {
            clearStreamingConfig()
            navigate('/')
          } else {
            // Xóa bỏ các placeholder của batch lỗi để người dùng có thể kết thúc hoặc làm tiếp
            updateQuestions(prev => {
              if (!prev) return prev
              return prev.slice(0, baseLength)
            })
          }
          setIsGeneratingBatch(false)
        }
      )
    } catch (err) {
      console.error("Lỗi stream batch:", err)
      setIsGeneratingBatch(false)
    }
  }

  const renderDebugPanel = () => {
    if (!streamingConfig) return null
    return (
      <div className="mt-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-left">
        <button 
          type="button"
          onClick={() => setShowDebug(!showDebug)}
          className="flex items-center justify-between w-full font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none"
        >
          <span>🛠️ Bảng Debug AI (Xem raw JSON stream)</span>
          <span>{showDebug ? '▼ Thu gọn' : '▶ Mở rộng'}</span>
        </button>
        
        {showDebug && (
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex gap-4 text-[10px] text-slate-400">
              <span><strong>Model:</strong> {streamingConfig.model}</span>
              <span><strong>Trạng thái:</strong> {isGeneratingBatch ? '⚡ Đang stream...' : '✅ Hoàn thành'}</span>
              <span><strong>Kích thước:</strong> {rawAiResponse.length} ký tự</span>
            </div>
            <pre className="p-2 bg-slate-950 text-emerald-400 font-mono rounded border border-slate-800 max-h-60 overflow-y-auto whitespace-pre-wrap break-all text-[11px] select-all">
              {rawAiResponse || "(Chưa có dữ liệu phản hồi...)"}
            </pre>
          </div>
        )}
      </div>
    )
  }

  if (!questions || questions.length === 0) {
    if (isGeneratingBatch) {
      return (
        <>
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
              Đang tạo câu hỏi bằng AI...
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Đang xử lý Batch {currentBatchIndex + 1} / {streamingConfig?.batches?.length}.<br/>
              Quá trình này có thể mất 10-20 giây. Vui lòng đợi...
            </p>
          </div>
          {renderDebugPanel()}
        </>
      )
    }
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

  if (q && q.isPlaceholder) {
    return (
      <>
        <div className="card relative flex flex-col items-center justify-center min-h-[350px] text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(59,130,246,0.3)]"></div>
          <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse">
            AI đang soạn câu hỏi này...
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-[280px] mx-auto">
            Vui lòng đợi giây lát. Câu hỏi sẽ tự động hiển thị ngay khi được stream từ máy chủ Google.
          </p>

          <div className="exam-nav mt-8 w-full border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between">
            <button className="btn btn-outline btn-sm" onClick={goPrev} disabled={currentIndex === 0}>
              ← Trước
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/')}>
              🏠 Chọn đề
            </button>
          </div>
        </div>
        {renderDebugPanel()}
      </>
    )
  }

  const selected = answers[currentIndex]
  const isBookmarked = !!bookmarks[currentIndex]
  const hasAnswered = selected !== undefined
  const isLast = currentIndex === totalQuestions - 1
  const allDone = answeredCount === totalQuestions
  const hasMoreBatches = streamingConfig && currentBatchIndex < streamingConfig.batches.length

  const handleChoice = (idx) => {
    if (hasAnswered) return
    setAnswer(currentIndex, idx)
  }

  const handleFinish = () => {
    if (allDone || confirm('Bạn chưa trả lời hết câu. Kết thúc?')) {
      if (streamingConfig) clearStreamingConfig()
      navigate('/results')
    }
  }

  const labelLetter = (i) => String.fromCharCode(65 + i)

  return (
    <>
      <div className="card relative">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span className="question-number flex items-center gap-2">
          Câu {currentIndex + 1} / {totalQuestions}
          {isGeneratingBatch && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" title="AI đang soạn tiếp ở nền..."></span>
            </span>
          )}
        </span>
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
            hasMoreBatches ? (
              <button className="btn btn-primary btn-sm" onClick={() => fetchNextBatch(currentBatchIndex)} disabled={!hasAnswered || isGeneratingBatch}>
                {isGeneratingBatch ? '⏳ Đang tạo...' : 'Tiếp (Sinh câu mới) →'}
              </button>
            ) : (
              <button className="btn btn-success btn-sm" onClick={handleFinish} disabled={isGeneratingBatch}>
                🏁 Kết thúc
              </button>
            )
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

    {renderDebugPanel()}
  </>
)
}
