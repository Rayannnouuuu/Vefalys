import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

const LEGAL_NAV = [
  { to: '/mentions-legales', label: 'Mentions legales' },
  { to: '/cgu', label: "Conditions generales d'utilisation" },
  { to: '/confidentialite', label: 'Politique de confidentialite' },
]

export default function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <header className="border-b border-brand-100 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-accent-400 to-accent-600 font-serif text-sm font-semibold text-white">V</div>
          <Link to="/" className="font-serif text-lg font-medium text-brand-900">Vefalys</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <nav className="mb-8 flex flex-wrap gap-4 text-sm">
          {LEGAL_NAV.map((item) => (
            <Link key={item.to} to={item.to} className="text-brand-500 hover:text-brand-700 hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mb-6 flex items-start gap-2 rounded-lg border border-accent-200 bg-accent-50 p-4 text-sm text-accent-700">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>
            Ce document est un modele generique fourni a titre de point de depart. Il doit imperativement etre relu,
            complete (informations manquantes signalees par <strong>[A COMPLETER]</strong>) et valide par un professionnel
            du droit avant toute publication ou mise en production. Il ne constitue pas un conseil juridique.
          </p>
        </div>

        <h1 className="mb-6 font-serif text-2xl font-medium text-brand-900">{title}</h1>
        <div className="prose-legal space-y-4 text-sm leading-relaxed text-brand-700">{children}</div>
      </main>
    </div>
  )
}
