import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, apiErrorMessage } from '../lib/api'
import { useAuthStore } from '../store/auth'
import { Button, Input, Label } from '../components/ui'
import { Logo } from '../components/Logo'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@vefalys.fr')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setErrorCode('')
    setResent(false)
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setAuth(data.token, data.user)
      navigate('/')
    } catch (err: any) {
      setError(apiErrorMessage(err))
      setErrorCode(err?.response?.data?.code || '')
    } finally {
      setLoading(false)
    }
  }

  async function resendVerification() {
    await api.post('/auth/resend-verification', { email })
    setResent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4 dark:bg-brand-950">
      <div className="w-full max-w-sm rounded-xl border border-brand-100 bg-white p-8 shadow-card dark:border-brand-800 dark:bg-brand-900">
        <Logo className="mb-8" />
        <h1 className="mb-1 font-serif text-2xl font-semibold text-brand-900 dark:text-white">Connexion</h1>
        <p className="mb-6 text-sm text-brand-400">Accedez a votre espace de gestion</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label>Mot de passe</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <p>{error}</p>
              {errorCode === 'EMAIL_NOT_VERIFIED' && !resent && (
                <button type="button" onClick={resendVerification} className="mt-1 font-medium underline">
                  Renvoyer l'email de confirmation
                </button>
              )}
              {resent && <p className="mt-1 text-green-700 dark:text-green-400">Email de confirmation renvoye.</p>}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-brand-400">
          Pas encore de compte ? <Link to="/inscription" className="font-medium text-accent-600 hover:underline">Creer un compte</Link>
        </p>
        <div className="mt-6 rounded-lg bg-brand-50 p-3 text-xs text-brand-500 dark:bg-brand-800 dark:text-brand-300">
          <p className="font-medium text-brand-700 dark:text-brand-100">Comptes de demonstration :</p>
          <p>admin@vefalys.fr / manager@vefalys.fr / collab@vefalys.fr</p>
          <p>Mot de passe : password123</p>
        </div>
      </div>
    </div>
  )
}
