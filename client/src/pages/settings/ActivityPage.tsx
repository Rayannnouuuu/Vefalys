import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { api } from '../../lib/api'
import { Card, EmptyState } from '../../components/ui'
import { SettingsSection } from './SettingsLayout'

const AUDIT_LABELS: Record<string, string> = {
  CREATE: 'Creation', UPDATE: 'Modification', DELETE: 'Suppression', LOGIN: 'Connexion',
  STAGE_CHANGE: "Changement d'etape", ARCHIVE: 'Archivage', DUPLICATE: 'Duplication',
  ANONYMIZE: 'Anonymisation', IMPORT: 'Import', CONNECT: 'Connexion integration',
  DISCONNECT: 'Deconnexion integration', CHANGE_PASSWORD: 'Changement de mot de passe',
  RESET_PASSWORD: 'Reinitialisation de mot de passe', APPROVE: 'Validation de compte',
  REJECT: 'Refus de compte', VERIFY_EMAIL: 'Confirmation email', PAYMENT: 'Paiement enregistre',
  CREATE_AVOIR: 'Avoir cree',
}

export default function ActivityPage() {
  const { data: logs } = useQuery<any[]>({ queryKey: ['audit'], queryFn: () => api.get('/audit', { params: { limit: 100 } }).then((r) => r.data) })

  return (
    <SettingsSection title="Journal d'activite" description="Les 100 dernieres actions enregistrees sur l'instance.">
      <Card className="p-0">
        {!logs?.length && (
          <div className="p-6">
            <EmptyState title="Aucune activite enregistree" />
          </div>
        )}
        <div className="max-h-[70vh] divide-y divide-brand-50 overflow-y-auto dark:divide-brand-800">
          {logs?.map((l) => (
            <div key={l.id} className="flex items-center justify-between px-4 py-2 text-xs">
              <span className="text-brand-600 dark:text-brand-300">
                <span className="font-medium text-brand-800 dark:text-brand-100">{l.user ? `${l.user.firstName} ${l.user.lastName}` : 'Systeme'}</span>
                {' '}{AUDIT_LABELS[l.action] || l.action.toLowerCase()} - {l.entityType}
              </span>
              <span className="shrink-0 text-brand-300">{format(new Date(l.createdAt), 'dd/MM HH:mm')}</span>
            </div>
          ))}
        </div>
      </Card>
    </SettingsSection>
  )
}
