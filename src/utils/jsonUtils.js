export function validateQuestionJson(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return { valid: false, error: 'JSON không hợp lệ' }
  }
  if (!data.AllQuestions || !Array.isArray(data.AllQuestions)) {
    return { valid: false, error: 'Thiếu trường "AllQuestions" (phải là mảng)' }
  }
  for (let i = 0; i < data.AllQuestions.length; i++) {
    const q = data.AllQuestions[i]
    if (!q.Question) return { valid: false, error: `Câu ${i + 1}: thiếu "Question"` }
    if (!Array.isArray(q.Choices) || q.Choices.length < 2) {
      return { valid: false, error: `Câu ${i + 1}: "Choices" phải là mảng có ít nhất 2 phần tử` }
    }
    if (typeof q.Ans !== 'number' || q.Ans < 0 || q.Ans >= q.Choices.length) {
      return { valid: false, error: `Câu ${i + 1}: "Ans" không hợp lệ` }
    }
  }
  return { valid: true, data }
}

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.json') ? filename : filename + '.json'
  a.click()
  URL.revokeObjectURL(url)
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(r.error)
    r.readAsText(file)
  })
}

export function buildTree(files) {
  const root = {}
  for (const f of files) {
    const parts = (f.path || '').split('/').filter(Boolean)
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

export function flattenTreeForDropdown(tree, prefix = '') {
  const items = []
  for (const [key, val] of Object.entries(tree)) {
    if (key === '_files') continue
    const label = prefix ? `${prefix} / ${key}` : key
    items.push({ type: 'folder', label, key, data: val })
    items.push(...flattenTreeForDropdown(val, label))
  }
  if (tree._files) {
    for (const f of tree._files) {
      items.push({ type: 'file', label: prefix ? `${prefix} / ${f.name}` : f.name, data: f, isFile: true })
    }
  }
  return items
}

export function getFilesFromTree(tree) {
  const files = []
  if (tree._files) files.push(...tree._files)
  for (const [key, val] of Object.entries(tree)) {
    if (key !== '_files') files.push(...getFilesFromTree(val))
  }
  return files
}

const STORAGE_KEY = 'mcq-saved-sets'

export function getSavedSets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

export function saveSet(name, data) {
  const sets = getSavedSets()
  sets.push({ name, data, savedAt: Date.now() })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets))
}

export function deleteSet(index) {
  const sets = getSavedSets()
  sets.splice(index, 1)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets))
}
