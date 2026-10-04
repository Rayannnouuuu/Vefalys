import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, apiErrorMessage } from '../lib/api'
import { useAuthStore } from '../store/auth'
import { Button, Input, Label } from '../components/ui'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@vefalys.fr')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setAuth(data.token, data.user)
      navigate('/')
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7faf8] px-4">
      <div className="w-full max-w-sm rounded-xl border border-brand-100 bg-white p-8 shadow-card">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-accent-400 to-accent-600 font-serif text-sm font-semibold text-white">V</div>
          <span className="font-serif text-lg font-medium tracking-wide text-brand-900">Vefalys</span>
        </div>
        <h1 className="mb-1 font-serif text-2xl font-medium text-brand-900">Connexion</h1>
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-brand-400">
          Pas encore de compte ? <Link to="/inscription" className="font-medium text-accent-600 hover:underline">Creer un compte</Link>
        </p>
        <div className="mt-6 rounded-lg bg-brand-50 p-3 text-xs text-brand-500">
          <p className="font-medium text-brand-700">Comptes de demonstration :</p>
          <p>admin@vefalys.fr / manager@vefalys.fr / collab@vefalys.fr</p>
          <p>Mot de passe : password123</p>
        </div>
      </div>
    </div>
  )
}
