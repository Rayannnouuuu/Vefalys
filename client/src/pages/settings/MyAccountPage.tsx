import { useState } from 'react'
import { Sun, Moon, MoonStar, Monitor } from 'lucide-react'
import { api, apiErrorMessage } from '../../lib/api'
import { Card, Button, Input, Label } from '../../components/ui'
import { useAuthStore } from '../../store/auth'
import { useThemeStore, type ThemeMode } from '../../store/theme'
import { SettingsSection } from './SettingsLayout'

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: any; swatch: string }[] = [
  { mode: 'light', label: 'Clair', icon: Sun, swatch: 'linear-gradient(135deg, #ffffff, #faf8f2)' },
  { mode: 'dark', label: 'Sombre', icon: Moon, swatch: 'linear-gradient(135deg, #1a3a2a, #0c1a12)' },
  { mode: 'black', label: 'Noir', icon: MoonStar, swatch: 'linear-gradient(135deg, #0e0e0e, #000000)' },
  { mode: 'system', label: 'Systeme', icon: Monitor, swatch: 'linear-gradient(135deg, #ffffff 50%, #0c1a12 50%)' },
]

export default function MyAccountPage() {
  return (
    <>
      <ProfileSection />
      <AppearanceSection />
    </>
  )
}

function ProfileSection() {
  const currentUser = useAuthStore((s) => s.user)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await api.post('/users/me/change-password', { currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setSuccess('Mot de passe mis a jour.')
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <SettingsSection title="Mon compte" description="Vos informations de connexion.">
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full text-base font-semibold text-white"
            style={{ backgroundColor: currentUser?.avatarColor }}
          >
            {currentUser?.firstName[0]}{currentUser?.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-brand-900 dark:text-white">{currentUser?.firstName} {currentUser?.lastName}</p>
            <p className="text-sm text-brand-400">{currentUser?.email} - {currentUser?.role}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-3 items-end gap-3">
          <div><Label>Mot de passe actuel</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></div>
          <div><Label>Nouveau mot de passe</Label><Input type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div>
          <Button type="submit">Changer le mot de passe</Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-2 text-sm text-green-600">{success}</p>}
      </Card>
    </SettingsSection>
  )
}

function AppearanceSection() {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)

  return (
    <SettingsSection title="Apparence" description="Choisissez le theme de l'interface.">
      <Card>
        <div className="grid grid-cols-4 gap-3">
          {THEME_OPTIONS.map((opt) => {
            const selected = mode === opt.mode
            const Icon = opt.icon
            return (
              <button
                key={opt.mode}
                onClick={() => setMode(opt.mode)}
                className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors ${
                  selected ? 'border-brand-600 ring-2 ring-brand-200 dark:ring-brand-700' : 'border-brand-200 hover:bg-brand-50 dark:border-brand-700 dark:hover:bg-brand-800'
                }`}
              >
                <div className="h-10 w-full rounded-md border border-brand-200 dark:border-brand-700" style={{ background: opt.swatch }} />
                <span className="flex items-center gap-1 text-xs font-medium text-brand-700 dark:text-brand-200"><Icon size={12} /> {opt.label}</span>
              </button>
            )
          })}
        </div>
      </Card>
    </SettingsSection>
  )
}
