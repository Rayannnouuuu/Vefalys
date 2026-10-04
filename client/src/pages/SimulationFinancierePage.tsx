import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { Calculator, ArrowLeft, ArrowRight, RotateCcw, Save, CheckCircle2, AlertTriangle, Link2, Trash2 } from 'lucide-react'
import { api, apiErrorMessage } from '../lib/api'
import { Button, Card, Select, Label, Input } from '../components/ui'
import { SIMULATION_OBJECTIFS, SIMULATION_TYPES_BIEN, SIMULATION_ZONES, labelFor } from '../lib/enums'
import type { Contact, FinancialSimulation } from '../types'

const STEPS = ['Objectif', 'Profil', 'Revenus', 'Apport & durÃ©e', 'RÃ©sultats']

interface SimForm {
  objectif: string
  typeBien: string
  primoAccedant: boolean
  personnesFoyer: number
  zone: string
  revenuFiscalReference: string
  revenusMensuels: string
  chargesMensuelles: string
  apport: string
  dureeAnnees: number
  tauxPersonnalise: string
  prixBienVise: string
}

const DEFAULT_FORM: SimForm = {
  objectif: 'PRINCIPALE',
  typeBien: 'APPARTEMENT_NEUF',
  primoAccedant: true,
  personnesFoyer: 1,
  zone: 'A',
  revenuFiscalReference: '',
  revenusMensuels: '',
  chargesMensuelles: '',
  apport: '',
  dureeAnnees: 20,
  tauxPersonnalise: '',
  prixBienVise: '',
}

function isNeuf(typeBien: string) {
  return typeBien === 'APPARTEMENT_NEUF' || typeBien === 'MAISON_NEUVE'
}
function ptzPossible(form: SimForm) {
  return form.objectif === 'PRINCIPALE' && form.primoAccedant && isNeuf(form.typeBien)
}

function euros(n: number | null | undefined) {
  if (n == null) return '-'
  return Math.round(n).toLocaleString('fr-FR') + ' â‚¬'
}
function pct(n: number) {
  return n.toFixed(2).replace('.', ',').replace(/,00$/, '') + ' %'
}

export default function SimulationFinancierePage() {
  const [params] = useSearchParams()
  const queryClient = useQueryClient()
  const prefilledContactId = params.get('contactId') || ''

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<SimForm>(DEFAULT_FORM)
  const [contactId, setContactId] = useState(prefilledContactId)
  const [result, setResult] = useState<any | null>(null)
  const [computing, setComputing] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<FinancialSimulation | null>(null)
  const [saving, setSaving] = useState(false)

  const { data: contacts } = useQuery<Contact[]>({ queryKey: ['contacts'], queryFn: () => api.get('/contacts').then((r) => r.data) })
  const { data: contact } = useQuery<Contact>({
    queryKey: ['contact', prefilledContactId],
    queryFn: () => api.get(`/contacts/${prefilledContactId}`).then((r) => r.data),
    enabled: !!prefilledContactId,
  })
  const { data: history } = useQuery<FinancialSimulation[]>({
    queryKey: ['financial-simulations', contactId],
    queryFn: () => api.get('/financial-simulations', { params: { contactId } }).then((r) => r.data),
    enabled: !!contactId,
  })

  function set<K extends keyof SimForm>(key: K, value: SimForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function payload() {
    return {
      contactId: contactId || null,
      objectif: form.objectif,
      typeBien: form.typeBien,
      primoAccedant: form.primoAccedant,
      personnesFoyer: form.personnesFoyer,
      zone: form.zone,
      revenuFiscalReference: form.revenuFiscalReference ? Number(form.revenuFiscalReference) : null,
      revenusMensuels: Number(form.revenusMensuels) || 0,
      chargesMensuelles: Number(form.chargesMensuelles) || 0,
      apport: Number(form.apport) || 0,
      dureeAnnees: form.dureeAnnees,
      tauxPersonnalise: form.tauxPersonnalise ? Number(form.tauxPersonnalise) : null,
      prixBienVise: form.prixBienVise ? Number(form.prixBienVise) : null,
    }
  }

  async function goToResults() {
    setError('')
    setComputing(true)
    try {
      const { data } = await api.post('/financial-simulations/compute', payload())
      setResult(data)
      setStep(4)
      setSaved(null)
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setComputing(false)
    }
  }

  async function recompute() {
    setComputing(true)
    setError('')
    try {
      const { data } = await api.post('/financial-simulations/compute', payload())
      setResult(data)
      setSaved(null)
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setComputing(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const { data } = await api.post('/financial-simulations', payload())
      setSaved(data)
      queryClient.invalidateQueries({ queryKey: ['financial-simulations', contactId] })
      if (contactId) queryClient.invalidateQueries({ queryKey: ['contact', contactId] })
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  function restart() {
    setForm(DEFAULT_FORM)
    setResult(null)
    setSaved(null)
    setStep(0)
  }

  async function removeSimulation(id: string) {
    if (!window.confirm('Supprimer cette simulation ?')) return
    await api.delete(`/financial-simulations/${id}`)
    queryClient.invalidateQueries({ queryKey: ['financial-simulations', contactId] })
  }

  const ptzApplicable = ptzPossible(form)
  const canGoNext = useMemo(() => {
    if (step === 2) return Number(form.revenusMensuels) > 0
    return true
  }, [step, form.revenusMensuels])

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold text-brand-900"><Calculator size={22} className="text-accent-500" /> Simulation financiÃ¨re</h1>
        <p className="mt-1 text-sm text-brand-400">
          CapacitÃ© d'emprunt, prÃªt Ã  taux zÃ©ro et frais de notaire - calculÃ©s comme sur le simulateur vefalys.fr, Ã  lier au dossier d'un prospect.
        </p>
      </div>

      <Card>
        <Label>Lier Ã  un contact (optionnel)</Label>
        <Select value={contactId} onChange={(e) => setContactId(e.target.value)}>
          <option value="">Simulation libre, sans contact</option>
          {contacts?.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}{c.company ? ` - ${c.company}` : ''}</option>)}
        </Select>
        {contact && contactId === prefilledContactId && (
          <p className="mt-2 text-xs text-brand-400">PrÃ©-rempli depuis la fiche de {contact.firstName} {contact.lastName}.</p>
        )}
      </Card>

      {step < 4 && (
        <Card>
          <div className="mb-5 flex gap-1.5">
            {STEPS.map((label, i) => (
              <div key={label} className="flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-brand-100 dark:bg-brand-800">
                  <motion.div className="h-full bg-brand-600" initial={false} animate={{ width: i <= step ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
                </div>
                <p className={`mt-1 text-[11px] ${i === step ? 'font-medium text-brand-700' : 'text-brand-300'}`}>{label}</p>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
              {step === 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-brand-700">Quel est le projet ?</p>
                  <TileGroup name="objectif" value={form.objectif} onChange={(v) => set('objectif', v)} options={SIMULATION_OBJECTIFS} />
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-sm font-medium text-brand-700">Type de bien</p>
                    <TileGroup name="typeBien" value={form.typeBien} onChange={(v) => set('typeBien', v)} options={SIMULATION_TYPES_BIEN} columns={2} />
                  </div>
                  {form.objectif === 'PRINCIPALE' && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-brand-700">Primo-accÃ©dant (pas propriÃ©taire de sa rÃ©sidence principale depuis 2 ans) ?</p>
                      <TileGroup
                        name="primoAccedant"
                        value={form.primoAccedant ? 'oui' : 'non'}
                        onChange={(v) => set('primoAccedant', v === 'oui')}
                        options={[{ value: 'oui', label: 'Oui' }, { value: 'non', label: 'Non' }]}
                        columns={2}
                      />
                    </div>
                  )}
                  {ptzApplicable && (
                    <div className="space-y-3 rounded-lg border border-accent-200 bg-accent-50 p-3">
                      <p className="text-xs text-accent-700">Ces informations permettent d'estimer un Ã©ventuel prÃªt Ã  taux zÃ©ro (PTZ).</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Personnes dans le foyer</Label>
                          <Select value={form.personnesFoyer} onChange={(e) => set('personnesFoyer', Number(e.target.value))}>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
                          </Select>
                        </div>
                        <div>
                          <Label>Zone du bien</Label>
                          <Select value={form.zone} onChange={(e) => set('zone', e.target.value)}>
                            {SIMULATION_ZONES.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Revenu fiscal de rÃ©fÃ©rence {new Date().getFullYear() - 2} (optionnel)</Label>
                        <Input type="number" value={form.revenuFiscalReference} onChange={(e) => set('revenuFiscalReference', e.target.value)} placeholder="Figure sur l'avis d'imposition - sinon estimÃ© depuis les revenus" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <div>
                    <Label>Revenus mensuels nets du foyer (EUR)</Label>
                    <Input type="number" min={0} value={form.revenusMensuels} onChange={(e) => set('revenusMensuels', e.target.value)} placeholder="Ex: 3200" required />
                  </div>
                  <div>
                    <Label>Charges de crÃ©dit mensuelles dÃ©jÃ  en cours (EUR)</Label>
                    <Input type="number" min={0} value={form.chargesMensuelles} onChange={(e) => set('chargesMensuelles', e.target.value)} placeholder="Ex: 0" />
                  </div>
                  <p className="text-xs text-brand-400">La mensualitÃ© maximale est calculÃ©e pour rester sous 35% des revenus, charges existantes incluses (rÃ¨gle HCSF).</p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Apport personnel (EUR)</Label>
                      <Input type="number" min={0} value={form.apport} onChange={(e) => set('apport', e.target.value)} placeholder="Ex: 20000" />
                    </div>
                    <div>
                      <Label>DurÃ©e du prÃªt</Label>
                      <Select value={form.dureeAnnees} onChange={(e) => set('dureeAnnees', Number(e.target.value))}>
                        <option value={15}>15 ans</option>
                        <option value={20}>20 ans</option>
                        <option value={25}>25 ans</option>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Taux d'intÃ©rÃªt (optionnel - sinon taux de marchÃ© indicatif retenu)</Label>
                    <Input type="number" step="0.01" min={0.1} max={10} value={form.tauxPersonnalise} onChange={(e) => set('tauxPersonnalise', e.target.value)} placeholder="Ex: 3,47" />
                  </div>
                  <div>
                    <Label>Bien dÃ©jÃ  repÃ©rÃ© - prix affichÃ© (optionnel)</Label>
                    <Input type="number" min={0} value={form.prixBienVise} onChange={(e) => set('prixBienVise', e.target.value)} placeholder="Pour vÃ©rifier s'il tient dans le budget" />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-5 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft size={14} /> PrÃ©cÃ©dent
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canGoNext}>Suivant <ArrowRight size={14} /></Button>
            ) : (
              <Button onClick={goToResults} disabled={!canGoNext || computing}>{computing ? 'Calcul...' : 'Voir les rÃ©sultats'} <ArrowRight size={14} /></Button>
            )}
          </div>
        </Card>
      )}

      {step === 4 && result && (
        <ResultsPanel
          result={result}
          form={form}
          ptzApplicable={ptzApplicable}
          computing={computing}
          onRecompute={recompute}
          onRestart={restart}
          onEdit={() => setStep(3)}
          onSave={handleSave}
          saving={saving}
          saved={saved}
          error={error}
        />
      )}

      {!!contactId && !!history?.length && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-brand-500">
            Simulations prÃ©cÃ©dentes {contact ? `de ${contact.firstName} ${contact.lastName}` : ''}
          </h2>
          <div className="space-y-2">
            {history.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-brand-100 p-3 text-sm">
                <div>
                  <p className="font-medium text-brand-800">{euros(s.budgetTotalAvecPtz ?? s.budgetFinancable)} finanÃ§ables</p>
                  <p className="text-xs text-brand-400">
                    {labelFor(SIMULATION_TYPES_BIEN, s.typeBien)} - {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                    {s.ptzEligible && ' - PTZ Ã©ligible'}
                  </p>
                </div>
                <button onClick={() => removeSimulation(s.id)} className="text-brand-300 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {contactId && (
        <Link to={`/contacts/${contactId}`} className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-700">
          <ArrowLeft size={14} /> Retour Ã  la fiche contact
        </Link>
      )}
    </div>
  )
}

function TileGroup({
  name,
  value,
  onChange,
  options,
  columns = 3,
}: {
  name: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  columns?: number
}) {
  return (
    <div className={`grid gap-2 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
              selected
                ? 'border-brand-600 bg-brand-600 text-white shadow-subtle'
                : 'border-brand-200 text-brand-700 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-200 dark:hover:bg-brand-800'
            }`}
            aria-pressed={selected}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function AnimatedEuro({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let frame: number
    const start = performance.now()
    const duration = 700
    const from = display
    function step(ts: number) {
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (value - from) * eased)
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return <>{euros(display)}</>
}

function ResultsPanel({
  result,
  form,
  ptzApplicable,
  computing,
  onRecompute,
  onRestart,
  onEdit,
  onSave,
  saving,
  saved,
  error,
}: {
  result: any
  form: SimForm
  ptzApplicable: boolean
  computing: boolean
  onRecompute: () => void
  onRestart: () => void
  onEdit: () => void
  onSave: () => void
  saving: boolean
  saved: FinancialSimulation | null
  error: string
}) {
  const motifLabel: Record<string, string> = {
    ressources: 'Les revenus dÃ©clarÃ©s dÃ©passent le plafond de ressources du PTZ pour cette situation.',
    situation: "Le prÃªt Ã  taux zÃ©ro est rÃ©servÃ© aux primo-accÃ©dants qui achÃ¨tent un logement neuf en rÃ©sidence principale.",
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      <Card className="bg-gradient-to-br from-brand-800 to-brand-900 text-white">
        <p className="text-xs uppercase tracking-wide text-brand-200">Budget total finanÃ§able</p>
        <p className="mt-1 font-serif text-4xl font-semibold">
          <AnimatedEuro value={result.budgetTotalAvecPtz ?? result.budgetFinancable} />
        </p>
        <p className="mt-2 text-sm text-brand-200">
          Dont prÃªt bancaire {euros(result.budgetFinancable)} {result.ptzEligible ? `+ PTZ ${euros(result.ptzMontant)}` : ''}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="CapacitÃ© d'emprunt" value={euros(result.capaciteEmprunt)} />
        <Metric label="MensualitÃ© maximale" value={euros(result.mensualiteMax)} />
        <Metric label="Apport" value={euros(Number(form.apport) || 0)} />
        <Metric label="Frais de notaire" value={euros(result.fraisNotaire)} />
        <Metric label="CoÃ»t total des intÃ©rÃªts" value={euros(result.coutInterets)} />
        <Metric label="Taux appliquÃ©" value={pct(result.tauxApplique)} />
        <Metric label="DurÃ©e" value={`${form.dureeAnnees} ans`} />
        <Metric label="Taux d'endettement" value={pct(result.tauxEndettement)} />
      </div>

      {ptzApplicable && (
        <Card className={result.ptzEligible ? 'border-brand-200 bg-brand-50' : 'border-amber-200 bg-amber-50'}>
          <div className="flex items-start gap-2">
            {result.ptzEligible ? <CheckCircle2 size={18} className="mt-0.5 text-brand-600" /> : <AlertTriangle size={18} className="mt-0.5 text-amber-600" />}
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand-800">
                {result.ptzEligible ? `PrÃªt Ã  taux zÃ©ro estimÃ© : ${euros(result.ptzMontant)}` : 'PrÃªt Ã  taux zÃ©ro non applicable'}
              </p>
              {result.ptzEligible ? (
                <p className="mt-1 text-xs text-brand-500">
                  Tranche {result.ptzTranche} - quotitÃ© {Math.round((result.ptzQuotite || 0) * 100)}% - plafond d'opÃ©ration {euros(result.ptzPlafondOperation)}.
                  Calcul fondÃ© sur le barÃ¨me en vigueur, sous rÃ©serve de l'Ã©tude dÃ©finitive de la banque.
                </p>
              ) : (
                <p className="mt-1 text-xs text-amber-700">{motifLabel[result.ptzMotifInegibilite || 'situation']}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {!!form.prixBienVise && Number(form.prixBienVise) > 0 && result.cibleMensualite != null && (
        <Card className={result.cibleMargeMensuelle >= 0 ? 'border-brand-200 bg-brand-50' : 'border-red-200 bg-red-50'}>
          <p className="text-sm font-semibold text-brand-800">Bien repÃ©rÃ© Ã  {euros(Number(form.prixBienVise))}</p>
          <p className="mt-1 text-sm text-brand-600">MensualitÃ© correspondante : {euros(result.cibleMensualite)} (plafond {euros(result.mensualiteMax)})</p>
          {result.cibleMargeMensuelle >= 0 ? (
            <p className="mt-1 text-sm text-brand-700">Ce bien tient dans le budget : il resterait {euros(result.cibleMargeMensuelle)} de marge par mois.</p>
          ) : (
            <p className="mt-1 text-sm text-red-700">
              DÃ©passe la mensualitÃ© maximale de {euros(-result.cibleMargeMensuelle)}/mois. Un apport supplÃ©mentaire d'environ {euros(result.cibleApportSupplementaire)} (ou une nÃ©gociation du prix) ramÃ¨nerait ce bien dans le budget.
            </p>
          )}
        </Card>
      )}

      <p className="text-xs text-brand-400">
        Simulation indicative calculÃ©e avec un taux d'endettement de 35% et un taux de marchÃ© estimÃ©. Le prÃªt Ã  taux zÃ©ro applique le barÃ¨me en vigueur sous rÃ©serve de l'Ã©tude dÃ©finitive de l'organisme prÃªteur. Ces chiffres ne constituent pas une offre de prÃªt.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onEdit}><ArrowLeft size={14} /> Modifier</Button>
          <Button variant="ghost" onClick={onRecompute} disabled={computing}>{computing ? 'Calcul...' : 'Recalculer'}</Button>
          <Button variant="ghost" onClick={onRestart}><RotateCcw size={14} /> Nouvelle simulation</Button>
        </div>
        {saved ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-brand-600"><CheckCircle2 size={16} /> Simulation enregistrÃ©e{saved.contactId ? ' et liÃ©e au contact' : ''}</span>
        ) : (
          <Button onClick={onSave} disabled={saving}>
            {saving ? 'Enregistrement...' : <><Save size={14} /> Enregistrer la simulation</>}
          </Button>
        )}
      </div>
      {!saved && (
        <p className="flex items-center gap-1.5 text-xs text-brand-400">
          <Link2 size={12} /> Choisissez un contact en haut de page pour rattacher cette simulation Ã  son dossier.
        </p>
      )}
    </motion.div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <p className="text-[11px] uppercase tracking-wide text-brand-400">{label}</p>
      <p className="mt-1 font-serif text-lg font-semibold text-brand-900">{value}</p>
    </Card>
  )
}
