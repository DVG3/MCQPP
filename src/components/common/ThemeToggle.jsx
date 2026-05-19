import { useApp } from '../../contexts/AppContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useApp()
  return (
    <button className="icon-btn" onClick={toggleTheme} title={theme === 'light' ? 'Chuyển sang tối' : 'Chuyển sang sáng'}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
