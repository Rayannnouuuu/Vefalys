import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark' | 'black' | 'system'

interface ThemeState {
  mode: ThemeMode
  dark: boolean // etat visuel resolu (true si sombre ou noir, ou systeme resolu en sombre)
  setMode: (mode: ThemeMode) => void
  toggle: () => void // bascule rapide clair/sombre depuis l'icone du header
}

// Migration depuis l'ancien stockage booleen clair/sombre (avant l'ajout du theme noir et du
// mode systeme).
const legacy = localStorage.getItem('theme')
const stored = (localStorage.getItem('themeMode') as ThemeMode | null) || (legacy === 'dark' ? 'dark' : 'light')
const media = window.matchMedia('(prefers-color-scheme: dark)')

function resolveDark(mode: ThemeMode) {
  if (mode === 'system') return media.matches
  return mode === 'dark' || mode === 'black'
}

function applyClasses(mode: ThemeMode) {
  const dark = resolveDark(mode)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.classList.toggle('theme-black', mode === 'black')
}
applyClasses(stored)

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: stored,
  dark: resolveDark(stored),
  setMode: (mode) => {
    localStorage.setItem('themeMode', mode)
    applyClasses(mode)
    set({ mode, dark: resolveDark(mode) })
  },
  toggle: () => {
    const next: ThemeMode = get().dark ? 'light' : 'dark'
    localStorage.setItem('themeMode', next)
    applyClasses(next)
    set({ mode: next, dark: resolveDark(next) })
  },
}))

media.addEventListener('change', () => {
  if (useThemeStore.getState().mode === 'system') {
    applyClasses('system')
    useThemeStore.setState({ dark: resolveDark('system') })
  }
})
