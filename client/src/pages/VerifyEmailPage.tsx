import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { api, apiErrorMessage } from '../lib/api'
import { Button } from '../components/ui'
import { Logo } from '../components/Logo'

type Status = 'loading' | 'verified' | 'error'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')
  const [pendingApproval, setPendingApproval] = useState(true)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Lien de confirmation invalide.')
      return
    }
    api
      .post('/auth/verify-email', { token })
      .then(({ data }) => {
        setStatus('verified')
        setPendingApproval(data.pendingApproval)
      })
      .catch((err) => {
        setStatus('error')
        setError(apiErrorMessage(err))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4 dark:bg-brand-950">
      <div className="w-full max-w-sm rounded-xl border border-brand-100 bg-white p-8 text-center shadow-card dark:border-brand-800 dark:bg-brand-900">
        <Logo className="mb-6 justify-center" />

        {status === 'loading' && <p className="text-sm text-brand-400">Verification en cours...</p>}

        {status === 'verified' && (
          <>
            <CheckCircle2 size={36} className="mx-auto mb-4 text-brand-600 dark:text-brand-400" />
            <h1 className="mb-2 font-serif text-xl font-semibold text-brand-900 dark:text-white">Email confirme</h1>
            {pendingApproval ? (
              <p className="flex items-center justify-center gap-1.5 text-sm text-brand-500">
                <Clock size={14} /> Votre compte attend maintenant la validation d'un administrateur. Vous recevrez un email des que c'est fait.
              </p>
            ) : (
              <p className="text-sm text-brand-500">Vous pouvez desormais vous connecter.</p>
            )}
            <Link to="/connexion" className="mt-4 inline-block">
              <Button>Aller a la connexion</Button>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={36} className="mx-auto mb-4 text-red-500" />
            <h1 className="mb-2 font-serif text-xl font-semibold text-brand-900 dark:text-white">Lien invalide</h1>
            <p className="text-sm text-red-600">{error}</p>
            <p className="mt-4 text-sm text-brand-400">
              <Link to="/connexion" className="font-medium text-accent-600 hover:underline">Retour a la connexion</Link>, vous pourrez demander un
              nouveau lien.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
