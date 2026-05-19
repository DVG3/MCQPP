# AGENTS.md — MCQ Y Khoa

## Stack
- **React 18 + Vite 6** — build to static `dist/`, deployable to GitHub Pages
- **react-router-dom v7** — SPA routing (`/`, `/exam`, `/results`)
- **react-markdown + remark-gfm** — render markdown questions (tables, formatting)
- **TailwindCSS v4** (`@tailwindcss/vite` plugin) — utility classes, no config file

## Commands
- `npm run dev` — dev server
- `npm run build` — build to `dist/`
- `npm run preview` — preview production build locally

## Routing
| Route | Component | Purpose |
|---|---|---|
| `/` | `QuestionSelector` | 4 tabs (Google Drive / Local / Paste / Saved) + AI Prompt section |
| `/exam` | `ExamView` | Take exam, answer questions, bookmark |
| `/results` | `ResultsView` | Score summary, review, export wrong/bookmarked |

## Data Flow
1. User selects source → questions loaded into **AppContext** (`setQuestions`)
2. Navigate to `/exam` → **ExamView** `useEffect` reads AppContext → calls `startExam()` on **ExamProvider**, then clears AppContext
3. **ExamProvider** wraps all routes (persists across `/exam` ↔ `/results`)
4. Results page reads from ExamContext; navigating home calls `resetExam()`

## Contexts
- **AppContext** (`src/contexts/AppContext.jsx`): `questions`, `theme` (localStorage), `shuffleEnabled` (localStorage)
- **ExamContext** (`src/contexts/ExamContext.jsx`): `questions[]`, `currentIndex`, `answers{}`, `bookmarks{}`, `startExam()`, `resetExam()`

## Key Details
- Theme: `data-theme="light|dark"` on `<html>`, persisted in localStorage
- Shuffle: Fisher-Yates via `src/utils/shuffle.js`, only question order (not choices)
- Google Drive API: `mode=list` to get file index, `mode=get&id=<id>` to fetch JSON
- Bookmark export saved to localStorage key `mcq-bookmarks-export` for Tab 4 merge
- "Dán vào Paste JSON" uses `window` custom event `mcq-fill-paste`
- Custom CSS in `src/index.css` — CSS variables + TailwindCSS v4 `@theme` for colors
- TailwindCSS v4: no `tailwind.config.js`, configure via `@theme` in CSS; `@import "tailwindcss"` at top of `index.css`
- Plugin in `vite.config.js`: `tailwindcss()` before `react()`
