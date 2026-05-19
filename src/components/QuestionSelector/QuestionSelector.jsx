import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import GoogleDriveSource from './GoogleDriveSource'
import LocalFolderSource from './LocalFolderSource'
import PasteJsonSource from './PasteJsonSource'
import BookmarkManager from './BookmarkManager'
import AiPromptSection from './AiPromptSection'

const TABS = [
  { key: 'google', label: 'Google Drive' },
  { key: 'local', label: 'Từ máy tính' },
  { key: 'paste', label: 'Paste JSON' },
  { key: 'saved', label: 'Đã lưu' },
]

export default function QuestionSelector() {
  const { shuffleEnabled, toggleShuffle } = useApp()
  const [activeTab, setActiveTab] = useState('google')

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
        </div>
      </div>

      <AiPromptSection />
    </div>
  )
}
