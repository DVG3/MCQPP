export async function generateAiBatch(config, batchConfig) {
  const { apiKey, model, fileBase64, mimeType, basePrompt, hiddenPrompt } = config;
  const { count, description } = batchConfig;

  // Xây dựng nội dung prompt cho batch này
  const fullPrompt = `${basePrompt}

=== YÊU CẦU CHO BATCH NÀY ===
- Số lượng câu hỏi cần tạo: ${count} câu.
- Dạng câu hỏi / Yêu cầu cụ thể: ${description}

${hiddenPrompt}`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: fullPrompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192, // Max token output (gemini 1.5 flash has high output)
    }
  };

  if (fileBase64 && mimeType) {
    requestBody.contents[0].parts.unshift({
      inlineData: {
        mimeType: mimeType,
        data: fileBase64
      }
    });
  }

  const cleanModel = model.startsWith('models/') ? model : `models/${model}`;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/${cleanModel}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("Không có phản hồi từ Gemini.");
  }

  const textContent = data.candidates[0].content.parts[0].text;
  
  // Trích xuất JSON từ chuỗi kết quả (bỏ qua Markdown format nếu có)
  let jsonString = textContent;
  
  // Xóa backticks nếu AI bọc trong ```json ... ```
  const match = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    jsonString = match[1];
  }
  
  // Xóa các ký tự không phải JSON ở đầu và cuối để an toàn (bắt đầu bằng { hoặc [)
  const firstBracket = jsonString.indexOf('{');
  const lastBracket = jsonString.lastIndexOf('}');
  if (firstBracket !== -1 && lastBracket !== -1) {
    jsonString = jsonString.substring(firstBracket, lastBracket + 1);
  }

  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.AllQuestions || !Array.isArray(parsed.AllQuestions)) {
      throw new Error("Định dạng JSON trả về không đúng yêu cầu (thiếu mảng AllQuestions).");
    }
    return parsed.AllQuestions;
  } catch (err) {
    console.error("Lỗi parse JSON:", err, "Chuỗi AI trả về:", textContent);
    throw new Error("AI trả về kết quả không phải là JSON hợp lệ. Vui lòng thử lại.");
  }
}

function extractChunks(buffer) {
  const chunks = [];
  let braceCount = 0;
  let inString = false;
  let escapeNext = false;
  let start = -1;

  for (let i = 0; i < buffer.length; i++) {
    const char = buffer[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') {
        if (braceCount === 0) {
          start = i;
        }
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0 && start !== -1) {
          const chunkStr = buffer.substring(start, i + 1);
          chunks.push({ text: chunkStr, endOffset: i + 1 });
          start = -1;
        }
      }
    }
  }
  return chunks;
}

export function parseQuestionsProgressively(text) {
  const arrayStartMatch = text.match(/"[Aa]llQuestions"\s*:\s*\[/);
  if (!arrayStartMatch) return [];

  const startIndex = arrayStartMatch.index + arrayStartMatch[0].length;
  const subStr = text.substring(startIndex);

  const questions = [];
  let braceCount = 0;
  let objectStart = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < subStr.length; i++) {
    const char = subStr[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') {
        if (braceCount === 0) {
          objectStart = i;
        }
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0 && objectStart !== -1) {
          const objText = subStr.substring(objectStart, i + 1);
          try {
            const parsed = JSON.parse(objText);
            if (parsed && typeof parsed === 'object' && parsed.Question && Array.isArray(parsed.Choices)) {
              questions.push(parsed);
            }
          } catch (e) {
            // Incomplete JSON
          }
        }
      }
    }
  }

  return questions;
}

export async function generateAiBatchStream(config, batchConfig, onQuestionsUpdated, onDone, onError) {
  const { apiKey, model, fileBase64, mimeType, basePrompt, hiddenPrompt } = config;
  const { count, description } = batchConfig;

  const fullPrompt = `${basePrompt}

=== YÊU CẦU CHO BATCH NÀY ===
- Số lượng câu hỏi cần tạo: ${count} câu.
- Dạng câu hỏi / Yêu cầu cụ thể: ${description}

${hiddenPrompt}`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: fullPrompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    }
  };

  if (fileBase64 && mimeType) {
    requestBody.contents[0].parts.unshift({
      inlineData: {
        mimeType: mimeType,
        data: fileBase64
      }
    });
  }

  const cleanModel = model.startsWith('models/') ? model : `models/${model}`;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/${cleanModel}:streamGenerateContent?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `API Error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let accumulatedText = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const extracted = extractChunks(buffer);

      if (extracted.length > 0) {
        const lastEndOffset = extracted[extracted.length - 1].endOffset;
        buffer = buffer.substring(lastEndOffset);

        for (const item of extracted) {
          try {
            const obj = JSON.parse(item.text);
            const textPart = obj.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textPart) {
              accumulatedText += textPart;
              const questions = parseQuestionsProgressively(accumulatedText);
              onQuestionsUpdated(questions, accumulatedText);
            }
          } catch (e) {
            console.warn("Lỗi parse chunk JSON:", e);
          }
        }
      }
    }

    if (buffer.trim()) {
      const extracted = extractChunks(buffer);
      for (const item of extracted) {
        try {
          const obj = JSON.parse(item.text);
          const textPart = obj.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textPart) {
            accumulatedText += textPart;
          }
        } catch {}
      }
      const questions = parseQuestionsProgressively(accumulatedText);
      onQuestionsUpdated(questions, accumulatedText);
    }

    let jsonString = accumulatedText;
    const match = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      jsonString = match[1];
    }
    const firstBracket = jsonString.indexOf('{');
    const lastBracket = jsonString.lastIndexOf('}');
    if (firstBracket !== -1 && lastBracket !== -1) {
      jsonString = jsonString.substring(firstBracket, lastBracket + 1);
    }

    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.AllQuestions || !Array.isArray(parsed.AllQuestions)) {
        throw new Error("Định dạng JSON trả về không đúng yêu cầu (thiếu mảng AllQuestions).");
      }
      onDone(parsed.AllQuestions, accumulatedText);
    } catch (err) {
      console.error("Lỗi parse JSON kết thúc:", err, "Chuỗi AI trả về:", accumulatedText);
      throw new Error("AI trả về kết quả không phải là JSON hợp lệ ở cuối luồng.");
    }
  } catch (err) {
    onError(err);
  }
}
