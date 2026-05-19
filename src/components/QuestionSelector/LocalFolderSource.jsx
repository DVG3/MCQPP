import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { readFileAsText, validateQuestionJson } from '../../utils/jsonUtils'

export default function LocalFolderSource() {
  const { setQuestions } = useApp()
  const navigate = useNavigate()
  const folderInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const [mode, setMode] = useState('folder')
  const [items, setItems] = useState([])
  const [expanded, setExpanded] = useState({})
  const [loading, setLoading] = useState(false)

  const handleFolder = async (e) => {
    const files = Array.from(e.target.files).filter(f => f.name.endsWith('.json'))
    if (files.length === 0) {
      setItems([])
      return
    }
    setLoading(true)
    const mapped = files.map(f => {
      const relPath = f.webkitRelativePath || f.name
      const parts = relPath.replace(/\\/g, '/').split('/')
      return {
        name: f.name,
        path: parts.slice(0, -1).join('/'),
        file: f,
        id: relPath,
      }
    })
    setItems(mapped)
    setExpanded({})
    setLoading(false)
  }

  const handleSingleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const text = await readFileAsText(file)
      const result = validateQuestionJson(text)
      if (result.valid) {
        setQuestions(result.data.AllQuestions)
        navigate('/exam')
      } else {
        alert('Lỗi file: ' + result.error)
      }
    } catch (err) {
      alert('Không thể đọc file: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadFile = async (item) => {
    setLoading(true)
    try {
      const text = await readFileAsText(item.file)
      const result = validateQuestionJson(text)
      if (result.valid) {
        setQuestions(result.data.AllQuestions)
        navigate('/exam')
      } else {
        alert('Lỗi file: ' + result.error)
      }
    } catch (err) {
      alert('Không thể đọc file: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (key) => {
    setExpanded(e => ({ ...e, [key]: !e[key] }))
  }

  const buildLocalTree = (files) => {
    const root = {}
    for (const f of files) {
      const parts = f.path ? f.path.split('/') : []
      let node = root
      for (const part of parts) {
        if (!node[part]) node[part] = {}
        node = node[part]
      }
      if (!node._files) node._files = []
      node._files.push(f)
    }
    return root
  }

  const tree = items.length > 0 ? buildLocalTree(items) : {}

  const renderTree = (node) => {
    const entries = Object.entries(node).filter(([k]) => k !== '_files')
    return (
      <ul className="tree-list">
        {entries.map(([key, val]) => {
          const isExpanded = expanded[key]
          return (
            <li key={key} className="tree-folder">
              <div className="tree-folder-header" onClick={() => toggleExpand(key)}>
                <span>{isExpanded ? '📂' : '📁'}</span>
                <span>{key}</span>
              </div>
              {isExpanded && (
                <div className="tree-children">
                  {renderTree(val)}
                  {val._files && val._files.map(f => (
                    <div key={f.id} className="tree-leaf" onClick={() => loadFile(f)}>
                      <span className="file-icon">📄</span>
                      <span>{f.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
        <label style={{ cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <input type="radio" checked={mode === 'folder'} onChange={() => setMode('folder')} />
          Chọn thư mục
        </label>
        <label style={{ cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <input type="radio" checked={mode === 'file'} onChange={() => setMode('file')} />
          Chọn file .json
        </label>
      </div>

      {mode === 'folder' ? (
        <>
          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory=""
            directory=""
            onChange={handleFolder}
            style={{ marginBottom: '0.75rem', display: 'block' }}
          />
          {loading && <div className="empty-state"><div className="spinner" /> Đang xử lý...</div>}
          {!loading && items.length === 0 && (
            <div className="empty-state">
              <div className="icon">📂</div>
              Chọn một thư mục chứa file .json đề thi
            </div>
          )}
          {!loading && items.length > 0 && renderTree(tree)}
        </>
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleSingleFile}
            style={{ marginBottom: '0.75rem', display: 'block' }}
          />
          {loading && <div className="empty-state"><div className="spinner" /> Đang xử lý...</div>}
          {!loading && (
            <div className="empty-state">
              <div className="icon">📄</div>
              Chọn một file .json đề thi để làm ngay
            </div>
          )}
        </>
      )}
    </div>
  )
}
