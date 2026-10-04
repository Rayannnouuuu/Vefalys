import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { api, apiErrorMessage } from '../lib/api'
import { Button, Input, Label } from '../components/ui'
import { useAuthStore } from '../store/auth'
import { Logo } from '../components/Logo'

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState<{ email: string } | null>(null)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!acceptTerms) {
      setError("Vous devez accepter les CGU et la politique de confidentialite pour creer un compte.")
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      if (data.pendingVerification) {
        setPending({ email: data.email })
      } else {
        // Premier compte de l'instance : devient admin et est connecte immediatement.
        setAuth(data.token, data.user)
        navigate('/')
      }
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (pending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4 dark:bg-brand-950">
        <div className="w-full max-w-sm rounded-xl border border-brand-100 bg-white p-8 text-center shadow-card dark:border-brand-800 dark:bg-brand-900">
          <MailCheck size={36} className="mx-auto mb-4 text-brand-600 dark:text-brand-400" />
          <h1 className="mb-2 font-serif text-xl font-semibold text-brand-900 dark:text-white">Confirmez votre email</h1>
          <p className="text-sm text-brand-500">
            Un email de confirmation a ete envoye a <span className="font-medium">{pending.email}</span>. Cliquez sur le lien qu'il contient, puis
            attendez la validation de votre compte par un administrateur.
          </p>
          <p className="mt-4 text-sm text-brand-400">
            <Link to="/connexion" className="font-medium text-accent-600 hover:underline">Retour a la connexion</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4 dark:bg-brand-950">
      <div className="w-full max-w-sm rounded-xl border border-brand-100 bg-white p-8 shadow-card dark:border-brand-800 dark:bg-brand-900">
        <Logo className="mb-6" />
        <h1 className="mb-1 font-serif text-2xl font-semibold text-brand-900 dark:text-white">Creer un compte</h1>
        <p className="mb-6 text-sm text-brand-400">
          Acces prive : votre email devra etre confirme, puis votre compte valide par un administrateur avant de pouvoir vous connecter.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prenom</Label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div>
              <Label>Nom</Label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <Label>Mot de passe (8 caracteres min.)</Label>
            <Input type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <label className="flex items-start gap-2 text-sm text-brand-500">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-brand-300 text-brand-700 focus:ring-brand-400"
            />
            <span>
              J'accepte les <Link to="/cgu" target="_blank" className="text-accent-600 hover:underline">CGU</Link> et la{' '}
              <Link to="/confidentialite" target="_blank" className="text-accent-600 hover:underline">politique de confidentialite</Link>.
            </span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creation...' : 'Creer mon compte'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-brand-400">
          Deja un compte ? <Link to="/connexion" className="font-medium text-accent-600 hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
