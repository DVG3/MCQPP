import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { validateQuestionJson, readFileAsText, saveSet } from '../../utils/jsonUtils'

export default function PasteJsonSource() {
  const { setQuestions } = useApp()
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [error, setError] = useState(null)
  const [valid, setValid] = useState(false)
  const fileRef = useRef(null)

  const handleTextChange = (val) => {
    setText(val)
    if (!val.trim()) {
      setError(null)
      setValid(false)
      return
    }
    const result = validateQuestionJson(val)
    if (result.valid) {
      setError(null)
      setValid(true)
    } else {
      setError(result.error)
      setValid(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const content = await readFileAsText(file)
      setText(content)
      handleTextChange(content)
    } catch (err) {
      setError('Không thể đọc file: ' + err.message)
    }
  }

  const startExam = () => {
    const result = validateQuestionJson(text)
    if (result.valid) {
      setQuestions(result.data.AllQuestions)
      navigate('/exam')
    }
  }

  const saveExam = () => {
    const result = validateQuestionJson(text)
    if (result.valid) {
      const name = prompt('Nhập tên cho bộ đề này:')
      if (name) {
        saveSet(name, result.data)
        alert('Đã lưu bộ đề "' + name + '"')
      }
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '0.75rem' }}>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          style={{ display: 'block', marginBottom: '0.5rem' }}
        />
      </div>
      <textarea
        placeholder='{"AllQuestions": [{"Question": "...", "Choices": ["A", "B", "C", "D"], "Ans": 0, "Explanation": "..."}]}'
        value={text}
        onChange={e => handleTextChange(e.target.value)}
        style={{ minHeight: '10rem' }}
      />
      {error && <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '0.5rem' }}>⚠️ {error}</div>}
      {valid && <div style={{ color: 'var(--success)', fontSize: '0.85rem', marginTop: '0.5rem' }}>✓ JSON hợp lệ</div>}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        <button className="btn btn-primary" disabled={!valid} onClick={startExam}>
          Làm ngay
        </button>
        <button className="btn btn-outline" disabled={!valid} onClick={saveExam}>
          Lưu lại
        </button>
      </div>
    </div>
  )
}
