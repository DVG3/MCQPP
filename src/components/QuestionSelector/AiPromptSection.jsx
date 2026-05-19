import { useState } from 'react'

const DEFAULT_PROMPT = `Bạn là một chuyên gia khảo thí và kiểm tra đánh giá Y khoa, có kinh nghiệm soạn đề thi MCQ theo chuẩn Thang đo Bloom (Bloom's Taxonomy) cho sinh viên Y khoa.

Nhiệm vụ của bạn là dựa vào tài liệu được cung cấp (file/văn bản đính kèm) để biên soạn [SỐ LƯỢNG] câu hỏi trắc nghiệm (MCQ) Y khoa bằng TIẾNG VIỆT về chủ đề [TÊN CHỦ ĐỀ].

### 1. TIÊU CHUẨN NỘI DUNG THEO THANG BLOOM
Hãy phân bổ [SỐ LƯỢNG] câu hỏi theo các cấp độ sau để đảm bảo tính phân hóa:

- Cấp độ 1 & 2 (Nhớ & Hiểu - Khoảng 30%): Tập trung vào cơ chế bệnh sinh, sinh lý bệnh lý, tiêu chuẩn chẩn đoán cốt lõi, hoặc cơ chế tác dụng của thuốc. Tránh hỏi vặt vẹo các con số thống kê không ý nghĩa lâm sàng.
- Cấp độ 3 (Áp dụng - Khoảng 50%): Viết dưới dạng "TÌNH HUỐNG LÂM SÀNG NGẮN". Đưa ra thông tin về một bệnh nhân cụ thể (tuổi, giới, lý do vào viện, triệu chứng cơ năng/thực thể, kết quả cận lâm sàng cơ bản). Yêu cầu người học phải: Đưa ra chẩn đoán sơ bộ phù hợp nhất, chỉ định cận lâm sàng tiếp theo cần làm, hoặc lựa chọn thuốc/phác đồ điều trị bước đầu.
- Cấp độ 4 (Phân tích & Biện luận - Khoảng 20%): Tình huống lâm sàng phức tạp hơn hoặc có các yếu tố gây nhiễu (ví dụ: bệnh nền kèm theo, tác dụng phụ của thuốc, kết quả cận lâm sàng mâu thuẫn). Yêu cầu người học phải phân tích cơ chế gây ra triệu chứng, giải thích kết quả xét nghiệm, hoặc lựa chọn giải pháp tối ưu nhất khi có chống chỉ định.

### 2. NGUYÊN TẮC BIÊN SOẠN MCQ Y KHOA CHUẨN
- Thân câu hỏi (Stem): Phải rõ ràng, cung cấp đủ dữ kiện để người học có thể đưa ra câu trả lời ĐÚNG DUY NHẤT mà không cần nhìn vào các lựa chọn. Nếu là case lâm sàng, hãy sắp xếp thông tin theo thứ tự logic (Hành chính -> Bệnh sử -> Tiền sử -> Khám thực thể -> Cận lâm sàng).
- Các phương án nhiễu (Distractors): Phải có tính "hợp lý lâm sàng" (plausible). Đó phải là những sai lầm sinh viên thường mắc phải, các chẩn đoán phân biệt hay gặp, hoặc phác đồ điều trị lỗi thời nhưng dễ nhầm lẫn. TUYỆT ĐỐI KHÔNG dùng các lựa chọn vô lý hoặc quá dễ bị loại trừ.
- Không sử dụng các cụm từ: "Tất cả các đáp án trên đều đúng/sai", "A và B đúng", loại trừ kép (ví dụ: "Không có câu nào sau đây không đúng").

### 3. ĐỊNH DẠNG CẤU TRÚC ĐẦU RA (JSON)
Kết quả trả về PHẢI là một cấu trúc JSON hợp lệ (valid JSON), không chứa bất kỳ lời thoại nào khác ngoài block JSON. Cấu trúc cụ thể như sau:

{
  "AllQuestions": [
    {
      "Question": "Nội dung câu hỏi ở đây. Đối với các tình huống lâm sàng, bạn CÓ THỂ sử dụng markdown (như **in đậm** các chỉ số cận lâm sàng bất thường, dùng dấu gạch đầu dòng cho danh sách triệu chứng, hoặc bảng biểu nếu cần tóm tắt xét nghiệm) để tăng tính trực quan.",
      "Choices": [
        "A. Nội dung lựa chọn A",
        "B. Nội dung lựa chọn B",
        "C. Nội dung lựa chọn C",
        "D. Nội dung lựa chọn D"
      ],
      "Ans": 0,
      "Explanation": "[Cấp độ Bloom: ...]. Giải thích chi tiết và khoa học dựa trên tài liệu. Tại sao đáp án được chọn lại là tối ưu nhất? Tại sao các phương án nhiễu khác lại sai hoặc chưa phù hợp trong ngữ cảnh này? Dẫn chứng cơ chế sinh lý bệnh hoặc hướng dẫn điều trị (guideline) nếu có."
    }
  ]
}

*Lưu ý kỹ thuật JSON:*
- "Ans" bắt buộc là chỉ số kiểu số (integer) dựa trên 0-based index (0 = A, 1 = B, 2 = C, 3 = D).
- Đảm bảo các dấu ngoặc kép bên trong chuỗi text phải được escape đúng cách (\`"\`) nếu có, hoặc sử dụng dấu ngoặc đơn để không làm gãy cấu trúc JSON.
- Không để lại dấu phẩy dư thừa ở phần tử cuối cùng của mảng.

Tiến hành đọc file và tạo bộ đề ngay bây giờ.`

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
            style={{ minHeight: '16rem', fontSize: '0.85rem' }}
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
