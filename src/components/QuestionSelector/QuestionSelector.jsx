import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import GoogleDriveSource from './GoogleDriveSource'
import LocalFolderSource from './LocalFolderSource'
import PasteJsonSource from './PasteJsonSource'
import BookmarkManager from './BookmarkManager'
import AiPromptSection from './AiPromptSection'
import StreamingSource from './StreamingSource'

const TABS = [
  { key: 'google', label: 'Google Drive' },
  { key: 'local', label: 'Từ máy tính' },
  { key: 'paste', label: 'Paste JSON' },
  { key: 'saved', label: 'Đã lưu' },
  { key: 'streaming', label: 'Streaming AI' },
]

export default function QuestionSelector() {
  const { shuffleEnabled, toggleShuffle, latestAiExam } = useApp()
  const [activeTab, setActiveTab] = useState('streaming')

  const handleDownloadAiExam = () => {
    if (!latestAiExam || latestAiExam.length === 0) return
    const blob = new Blob([JSON.stringify({ AllQuestions: latestAiExam }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `AI_Exam_${new Date().getTime()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card">
        <div className="shuffle-bar">
          <span className="text-sm font-semibold">⭐ Xáo trộn câu</span>
          <button
            className={`toggle-switch ${shuffleEnabled ? 'on' : ''}`}
            onClick={toggleShuffle}
            aria-label="Xáo trộn câu hỏi"
          />
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {shuffleEnabled ? 'Bật' : 'Tắt'}
          </span>
        </div>

        <div className="tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'google' && <GoogleDriveSource />}
          {activeTab === 'local' && <LocalFolderSource />}
          {activeTab === 'paste' && <PasteJsonSource />}
          {activeTab === 'saved' && <BookmarkManager />}
          {activeTab === 'streaming' && <StreamingSource />}
        </div>
      </div>

      {latestAiExam && latestAiExam.length > 0 && (
        <button 
          className="btn btn-success w-full py-3 shadow-lg flex items-center justify-center gap-2"
          onClick={handleDownloadAiExam}
        >
          ⬇️ Tải xuống bộ đề AI vừa tạo ({latestAiExam.length} câu)
        </button>
      )}

      <AiPromptSection />
    </div>
  )
}
