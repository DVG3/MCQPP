import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { getSavedSets, deleteSet, downloadJson, readFileAsText, validateQuestionJson } from '../../utils/jsonUtils'

const EXPORT_KEY = 'mcq-bookmarks-export'

export default function BookmarkManager() {
  const { setQuestions } = useApp()
  const navigate = useNavigate()
  const [sets, setSets] = useState(() => getSavedSets())
  const [bookmarks, setBookmarks] = useState([])
  const [expandedIds, setExpandedIds] = useState({})

  const refreshSets = () => setSets(getSavedSets())

  const loadBookmarks = () => {
    try {
      const raw = localStorage.getItem(EXPORT_KEY)
      if (raw) {
        const arr = JSON.parse(raw)
        setBookmarks(Array.isArray(arr) ? arr : [])
      } else {
        setBookmarks([])
      }
    } catch {
      setBookmarks([])
    }
  }

  useEffect(() => { loadBookmarks() }, [])

  const loadSet = (data) => {
    setQuestions(data.AllQuestions)
    navigate('/exam')
  }

  const handleDeleteSet = (i) => {
    if (confirm('Xóa bộ đề này?')) {
      deleteSet(i)
      refreshSets()
    }
  }

  const handleExport = (data, name) => {
    downloadJson(data, name)
  }

  const handleMerge = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const content = await readFileAsText(file)
      const result = validateQuestionJson(content)
      if (!result.valid) {
        alert('File không hợp lệ: ' + result.error)
        return
      }
      let bm = []
      try {
        const raw = localStorage.getItem(EXPORT_KEY)
        if (raw) bm = JSON.parse(raw)
      } catch {}
      if (bm.length === 0) {
        alert('Không có câu đã đánh dấu nào để thêm')
        return
      }
      const existing = result.data.AllQuestions
      const merged = [...existing]
      const existingQuestions = new Set(existing.map(q => q.Question))
      let added = 0
      for (const b of bm) {
        if (!existingQuestions.has(b.Question)) {
          merged.push(b)
          existingQuestions.add(b.Question)
          added++
        }
      }
      const out = { AllQuestions: merged }
      downloadJson(out, file.name.replace('.json', '') + '_merged')
      alert(`Đã thêm ${added} câu mới và tải về file đã gộp`)
    } catch (err) {
      alert('Lỗi: ' + err.message)
    }
  }

  const exportBookmarks = () => {
    if (bookmarks.length === 0) {
      alert('Không có câu đã đánh dấu nào')
      return
    }
    downloadJson({ AllQuestions: bookmarks }, 'cau_da_danh_dau')
  }

  const deleteBookmark = (idx) => {
    const next = bookmarks.filter((_, i) => i !== idx)
    setBookmarks(next)
    localStorage.setItem(EXPORT_KEY, JSON.stringify(next))
    const newExpanded = { ...expandedIds }
    delete newExpanded[idx]
    setExpandedIds(newExpanded)
  }

  const deleteAllBookmarks = () => {
    if (bookmarks.length === 0) return
    if (confirm(`Xóa tất cả ${bookmarks.length} câu đã đánh dấu?`)) {
      setBookmarks([])
      localStorage.removeItem(EXPORT_KEY)
      setExpandedIds({})
    }
  }

  const toggleExpand = (idx) => {
    setExpandedIds(e => ({ ...e, [idx]: !e[idx] }))
  }

  const labelLetter = (i) => String.fromCharCode(65 + i)

  return (
    <div>
      {/* Bookmarked questions */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: bookmarks.length > 0 ? '0.75rem' : 0 }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>⭐ Câu đã đánh dấu</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
              {bookmarks.length > 0 ? `${bookmarks.length} câu` : 'không có'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button className="btn btn-outline btn-sm" onClick={exportBookmarks} disabled={bookmarks.length === 0}>
              📥 Xuất file
            </button>
            <button className="btn btn-danger btn-sm" onClick={deleteAllBookmarks} disabled={bookmarks.length === 0}>
              🗑️ Xóa tất cả
            </button>
          </div>
        </div>

        {bookmarks.length > 0 && (
          <div style={{ marginTop: '0.25rem' }}>
            {bookmarks.map((bm, idx) => {
              const isOpen = expandedIds[idx]
              const preview = bm.Question?.replace(/<[^>]*>/g, '').replace(/[*#_`\[\]]/g, '').trim() || ''
              return (
                <div key={idx} className="bookmark-item">
                  <div className="bookmark-item-header" onClick={() => toggleExpand(idx)}>
                    <span className={`expand-icon ${isOpen ? 'open' : ''}`}>▶</span>
                    <span className="q-preview">{preview.length > 80 ? preview.slice(0, 80) + '…' : preview}</span>
                    <button className="del-btn" onClick={(e) => { e.stopPropagation(); deleteBookmark(idx) }} title="Xóa câu này">
                      ✕
                    </button>
                  </div>
                  {isOpen && (
                    <div className="bookmark-item-body">
                      <div style={{ fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '0.5rem' }}>{bm.Question}</div>
                      <div className="bm-choices">
                        {bm.Choices?.map((c, ci) => (
                          <div key={ci} className={`bm-choice ${ci === bm.Ans ? 'correct-ans' : ''}`}>
                            {labelLetter(ci)}. {c.replace(/^[A-D]\.\s*/, '')}
                          </div>
                        ))}
                      </div>
                      {bm.Explanation && (
                        <div className="bm-explain"><strong>Giải thích:</strong> {bm.Explanation}</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Saved sets */}
      <div className="section-title">Bộ đề đã lưu ({sets.length})</div>
      {sets.length === 0 ? (
        <div className="empty-state" style={{ padding: '1rem' }}>
          <div className="icon">⭐</div>
          Chưa có bộ đề nào được lưu. Dùng tab "Paste JSON" để lưu đề.
        </div>
      ) : (
        sets.map((s, i) => (
          <div key={i} className="saved-set-item">
            <div>
              <div className="saved-set-name">{s.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {s.data.AllQuestions?.length || 0} câu
              </div>
            </div>
            <div className="saved-set-actions">
              <button className="btn btn-primary btn-sm" onClick={() => loadSet(s.data)}>Làm</button>
              <button className="btn btn-outline btn-sm" onClick={() => handleExport(s.data, s.name)}>Xuất</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSet(i)}>Xóa</button>
            </div>
          </div>
        ))
      )}

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.25rem 0' }} />
      <div className="section-title">Thêm câu đã đánh dấu vào file có sẵn</div>
      <input type="file" accept=".json" onChange={handleMerge} />
    </div>
  )
}
