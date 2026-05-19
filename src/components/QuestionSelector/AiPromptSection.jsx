import { useState } from 'react'

const DEFAULT_PROMPT = `Bạn hãy tạo một đề trắc nghiệm Y khoa với chủ đề: [NHẬP CHỦ ĐỀ]

Yêu cầu output là JSON có cấu trúc:
{
  "AllQuestions": [
    {
      "Question": "Câu hỏi...\n(Có thể dùng markdown: **bold**, *italic*, bảng biểu, v.v.)",
      "Choices": ["A. Nội dung A", "B. Nội dung B", "C. Nội dung C", "D. Nội dung D"],
      "Ans": 0,
      "Explanation": "Giải thích tại sao đáp án đó đúng"
    }
  ]
}

Trong đó:
- Ans là index 0-based của đáp án đúng (0=A, 1=B, 2=C, 3=D)
- Question có thể chứa markdown (bảng, bullet, code, **in đậm**)
- Choices phải có đúng 4 lựa chọn A, B, C, D
- Mỗi câu đều phải có Explanation
- Tất cả nội dung đều bằng tiếng Việt

Hãy tạo [SỐ LƯỢNG] câu trắc nghiệm Y khoa về chủ đề trên.`

export default function AiPromptSection() {
  const [open, setOpen] = useState(true)
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = prompt
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePasteToTab = () => {
    // Dispatch custom event to switch to paste tab and fill text
    window.dispatchEvent(new CustomEvent('mcq-fill-paste', { detail: prompt }))
    setCopied(false)
  }

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <div className="collapsible-header" onClick={() => setOpen(o => !o)}>
        <span className={`arrow ${open ? 'open' : ''}`}>▶</span>
        <span>🧑‍⚕️ Tạo đề bằng AI</span>
      </div>
      {open && (
        <div className="collapsible-content">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Chỉnh sửa prompt bên dưới, sau đó copy và gửi cho AI (ChatGPT, Claude, Gemini...) để tạo đề thi.
          </p>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            style={{ minHeight: '10rem', fontSize: '0.85rem' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={handleCopy}>
              {copied ? '✅ Đã copy!' : '📋 Copy Prompt'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={handlePasteToTab}>
              📥 Dán vào Paste JSON
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
