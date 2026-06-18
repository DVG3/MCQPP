import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'

const DEFAULT_PROMPT = `Bạn là một chuyên gia khảo thí và kiểm tra đánh giá Y khoa, có kinh nghiệm soạn đề thi MCQ theo chuẩn Thang đo Bloom (Bloom's Taxonomy) cho sinh viên Y khoa.
Nhiệm vụ của bạn là dựa vào tài liệu được cung cấp (file/văn bản đính kèm) để biên soạn các câu hỏi trắc nghiệm (MCQ) Y khoa bằng TIẾNG VIỆT.`

const DEFAULT_HIDDEN_PROMPT = `ĐỊNH DẠNG CẤU TRÚC ĐẦU RA (JSON)
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

Tiến hành đọc file và tạo bộ đề theo số câu và dạng câu mà tôi yêu cầu ngay bây giờ.`

export default function StreamingSource() {
  const { setStreamingConfig } = useApp()
  const navigate = useNavigate()

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('mcq-gemini-key') || '')
  const [model, setModel] = useState('models/gemini-1.5-flash')
  const [modelsList, setModelsList] = useState([
    { name: 'models/gemini-1.5-flash', displayName: 'Gemini 1.5 Flash' },
    { name: 'models/gemini-1.5-pro', displayName: 'Gemini 1.5 Pro' },
    { name: 'models/gemini-2.0-flash', displayName: 'Gemini 2.0 Flash' },
    { name: 'models/gemini-2.0-flash-lite', displayName: 'Gemini 2.0 Flash Lite' },
    { name: 'models/gemini-2.0-pro-exp-02-05', displayName: 'Gemini 2.0 Pro Experimental' },
    { name: 'models/gemini-2.5-flash', displayName: 'Gemini 2.5 Flash' },
    { name: 'models/gemini-2.5-pro', displayName: 'Gemini 2.5 Pro' }
  ])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelsError, setModelsError] = useState('')

  const [basePrompt, setBasePrompt] = useState(DEFAULT_PROMPT)
  const [fileBase64, setFileBase64] = useState('')
  const [mimeType, setMimeType] = useState('')
  const [fileName, setFileName] = useState('')
  const [batches, setBatches] = useState([
    { id: 1, count: 20, description: "Cấp độ 1 & 2 (Nhớ & Hiểu): Tập trung vào cơ chế bệnh sinh, sinh lý bệnh lý, tiêu chuẩn chẩn đoán cốt lõi, hoặc cơ chế tác dụng của thuốc. Tránh hỏi vặt vẹo các con số thống kê không ý nghĩa lâm sàng." },
    { id: 2, count: 10, description: "Cấp độ 3 (Áp dụng): Viết dưới dạng 'TÌNH HUỐNG LÂM SÀNG NGẮN'. Đưa ra thông tin về bệnh nhân, yêu cầu chẩn đoán sơ bộ, cận lâm sàng tiếp theo, hoặc phác đồ điều trị." },
    { id: 3, count: 5, description: "Cấp độ 4 (Phân tích & Biện luận): Tình huống lâm sàng phức tạp, có yếu tố gây nhiễu, bệnh nền. Phân tích cơ chế, giải thích kết quả hoặc chọn giải pháp tối ưu." }
  ])

  useEffect(() => {
    localStorage.setItem('mcq-gemini-key', apiKey)
  }, [apiKey])

  const fetchModels = async (key) => {
    const trimmedKey = key?.trim()
    if (!trimmedKey) return
    setLoadingModels(true)
    setModelsError('')
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedKey}`)
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      if (data.models && Array.isArray(data.models)) {
        const filtered = data.models
          .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
          .map(m => ({
            name: m.name,
            displayName: m.displayName || m.name.replace('models/', '')
          }))
        
        if (filtered.length > 0) {
          setModelsList(filtered)
          // If current model does not exist in new list, pick the first one or gemini-1.5-flash
          const currentExist = filtered.some(m => m.name === model)
          if (!currentExist) {
            const hasFlash = filtered.some(m => m.name === 'models/gemini-1.5-flash')
            setModel(hasFlash ? 'models/gemini-1.5-flash' : filtered[0].name)
          }
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách model:", err)
      setModelsError("Không thể tải danh sách model từ API. Sử dụng danh sách mặc định.")
    } finally {
      setLoadingModels(false)
    }
  }

  useEffect(() => {
    if (apiKey) {
      fetchModels(apiKey)
    }
  }, [])

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFileName(file.name)
    setMimeType(file.type || (file.name.endsWith('.txt') ? 'text/plain' : 'application/pdf'))

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target.result
      const base64 = result.split(',')[1]
      setFileBase64(base64)
    }
    reader.readAsDataURL(file)
  }

  const updateBatch = (id, field, value) => {
    setBatches(batches.map(b => b.id === id ? { ...b, [field]: value } : b))
  }

  const removeBatch = (id) => {
    setBatches(batches.filter(b => b.id !== id))
  }

  const addBatch = () => {
    const newId = batches.length > 0 ? Math.max(...batches.map(b => b.id)) + 1 : 1
    setBatches([...batches, { id: newId, count: 5, description: "Dạng câu hỏi mới" }])
  }

  const handleStart = () => {
    if (!apiKey) {
      alert("Vui lòng nhập API Key!")
      return
    }
    if (batches.length === 0) {
      alert("Vui lòng thêm ít nhất 1 batch!")
      return
    }
    if (!fileBase64) {
      const confirmNoFile = confirm("Bạn chưa chọn file tài liệu nào. Vẫn tiếp tục sinh câu hỏi?")
      if (!confirmNoFile) return
    }

    setStreamingConfig({
      apiKey,
      model,
      fileBase64,
      mimeType,
      basePrompt,
      hiddenPrompt: DEFAULT_HIDDEN_PROMPT,
      batches
    })
    
    navigate('/exam')
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
        <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">Cấu hình API Gemini</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">API Key</label>
            <div className="flex gap-2 mt-1">
              <input 
                type="password" 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)}
                onBlur={() => fetchModels(apiKey)}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                placeholder="Nhập Google Gemini API Key"
              />
              <button 
                type="button"
                onClick={() => fetchModels(apiKey)}
                disabled={loadingModels || !apiKey}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs font-semibold whitespace-nowrap transition-colors"
              >
                {loadingModels ? "Đang tải..." : "Tải model"}
              </button>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Model</label>
              {loadingModels && <span className="text-[10px] text-blue-500">Đang cập nhật...</span>}
              {modelsError && <span className="text-[10px] text-amber-500" title={modelsError}>⚠️ Lỗi tải model</span>}
            </div>
            <select 
              value={model} 
              onChange={e => setModel(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
            >
              {modelsList.map(m => (
                <option key={m.name} value={m.name}>{m.displayName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Tài liệu tham khảo (PDF, TXT)</label>
        <div className="flex items-center gap-3">
          <label className="btn btn-outline cursor-pointer whitespace-nowrap">
            📂 Chọn File
            <input type="file" accept=".pdf,.txt" className="hidden" onChange={handleFileUpload} />
          </label>
          <span className="text-sm text-slate-500 truncate max-w-[200px]" title={fileName}>
            {fileName || "Chưa chọn file"}
          </span>
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Prompt đề mẫu</label>
        <textarea 
          value={basePrompt} 
          onChange={e => setBasePrompt(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200"
          style={{ minHeight: '100px' }}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cấu hình chia đợt (Batches)</label>
          <button className="text-xs btn btn-outline py-1 px-2" onClick={addBatch}>+ Thêm Batch</button>
        </div>
        
        <div className="flex flex-col gap-3">
          {batches.map((batch, idx) => (
            <div key={batch.id} className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl relative">
              <div className="absolute top-2 right-2 flex gap-2">
                <span className="text-xs font-bold text-slate-400">Batch {idx + 1}</span>
                <button className="text-xs text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded px-1" onClick={() => removeBatch(batch.id)}>✕</button>
              </div>
              <div className="mt-2 flex items-center gap-2 mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Số câu:</span>
                <input 
                  type="number" 
                  min="1" max="100" 
                  value={batch.count}
                  onChange={e => updateBatch(batch.id, 'count', parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-sm text-center text-slate-800 dark:text-slate-200"
                />
              </div>
              <textarea 
                value={batch.description}
                onChange={e => updateBatch(batch.id, 'description', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200"
                placeholder="Mô tả dạng câu hỏi (Cấp độ Bloom, độ khó...)"
                style={{ minHeight: '60px' }}
              />
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-primary w-full py-3 mt-2 text-base shadow-lg shadow-blue-500/30" onClick={handleStart}>
        ✨ Bắt đầu làm bài (AI Streaming)
      </button>
    </div>
  )
}
