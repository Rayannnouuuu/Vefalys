import { create } from 'zustand'

interface ThemeState {
  dark: boolean
  toggle: () => void
}

// Clair par defaut (identite visuelle pensee pour le mode clair) - le mode sombre reste
// disponible via le bouton bascule et le choix de l'utilisateur est memorise.
const stored = localStorage.getItem('theme')
const initialDark = stored === 'dark'

function applyClass(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
}
applyClass(initialDark)

export const useThemeStore = create<ThemeState>((set, get) => ({
  dark: initialDark,
  toggle: () => {
    const next = !get().dark
    localStorage.setItem('theme', next ? 'dark' : 'light')
    applyClass(next)
    set({ dark: next })
  },
}))
