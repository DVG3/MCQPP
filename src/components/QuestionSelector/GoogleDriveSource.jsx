import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'

const LIST_URL = 'https://script.google.com/macros/s/AKfycbxqQQIrN_v8GhiQ2pMxBVX-S2wWXdSXEo6G4_ohChBhVOfOZoyDEv3Q3FhH3jJf-7pQ/exec?mode=list'
const GET_URL = 'https://script.google.com/macros/s/AKfycbxqQQIrN_v8GhiQ2pMxBVX-S2wWXdSXEo6G4_ohChBhVOfOZoyDEv3Q3FhH3jJf-7pQ/exec'

let cachedList = null

export default function GoogleDriveSource() {
  const { setQuestions } = useApp()
  const navigate = useNavigate()
  const [files, setFiles] = useState(cachedList || [])
  const [loading, setLoading] = useState(!cachedList)
  const [loadingFile, setLoadingFile] = useState(false)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    if (cachedList) return
    setLoading(true)
    setError(null)
    fetch(LIST_URL)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Dữ liệu không hợp lệ')
        cachedList = data
        setFiles(data)
        const first = {}
        for (const f of data) {
          const folder = (f.path || 'Khác').split('/').filter(Boolean)[0] || 'Khác'
          first[folder] = true
        }
        setExpanded(first)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const loadFile = async (file) => {
    setLoadingFile(true)
    try {
      const res = await fetch(`${GET_URL}?mode=get&id=${file.id}`)
      const data = await res.json()
      if (data.AllQuestions && Array.isArray(data.AllQuestions)) {
        setQuestions(data.AllQuestions)
        navigate('/exam')
      } else {
        setError('File không đúng định dạng MCQ')
      }
    } catch (err) {
      setError('Không thể tải file: ' + err.message)
    } finally {
      setLoadingFile(false)
    }
  }

  const toggleExpand = (folder) => {
    setExpanded(e => ({ ...e, [folder]: !e[folder] }))
  }

  const folders = {}
  for (const f of files) {
    const folder = (f.path || 'Khác').split('/').filter(Boolean)[0] || 'Khác'
    if (!folders[folder]) folders[folder] = []
    folders[folder].push(f)
  }

  if (loading) return <div className="empty-state"><div className="spinner" /></div>
  if (error) return <div className="empty-state" style={{ color: 'var(--error)' }}>⚠️ {error}</div>
  if (files.length === 0) return <div className="empty-state">Không có đề nào</div>

  return (
    <div>
      {loadingFile && <div className="empty-state"><div className="spinner" /> Đang tải đề...</div>}
      <ul className="tree-list">
        {Object.entries(folders).map(([folder, fs]) => (
          <li key={folder} className="tree-folder">
            <div className="tree-folder-header" onClick={() => toggleExpand(folder)}>
              <span>{expanded[folder] ? '📂' : '📁'}</span>
              <span>{folder}</span>
            </div>
            {expanded[folder] && (
              <div className="tree-children">
                {fs.map(f => (
                  <div key={f.id} className="tree-leaf" onClick={() => loadFile(f)}>
                    <span className="file-icon">📄</span>
                    <span>{f.name}</span>
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
