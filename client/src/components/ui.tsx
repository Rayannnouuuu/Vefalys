import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'

export function Badge({ label, color }: { label: string; color?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide"
      style={{ backgroundColor: `${color || '#397a52'}14`, color: color || '#2e6243' }}
    >
      {label}
    </span>
  )
}

export function Button({
  variant = 'primary',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent' }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.button
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.12 }}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
        variant === 'primary' && 'bg-brand-800 text-white hover:bg-brand-900',
        variant === 'accent' && 'bg-accent-500 text-white hover:bg-accent-600',
        variant === 'secondary' && 'bg-brand-50 text-brand-800 hover:bg-brand-100 dark:bg-brand-800 dark:text-brand-100 dark:hover:bg-brand-700',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        variant === 'ghost' && 'text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-800',
        className,
      )}
      {...(props as any)}
    >
      {children}
    </motion.button>
  )
}

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('rounded-xl border border-brand-100 bg-white p-5 shadow-subtle dark:border-brand-800 dark:bg-brand-900', className)} {...props}>
      {children}
    </div>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        'w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-950 outline-none transition-shadow focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-brand-700 dark:bg-brand-800 dark:text-brand-50',
        props.className,
      )}
    />
  )
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        'w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-950 outline-none transition-shadow focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-brand-700 dark:bg-brand-800 dark:text-brand-50',
        props.className,
      )}
    >
      {children}
    </select>
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        'w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-950 outline-none transition-shadow focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-brand-700 dark:bg-brand-800 dark:text-brand-50',
        props.className,
      )}
    />
  )
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-brand-400 dark:text-brand-400">{children}</label>
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const reduceMotion = useReducedMotion()
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/50 p-4 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className={clsx('max-h-[90vh] w-full overflow-y-auto rounded-xl border border-brand-100 bg-white p-6 shadow-xl dark:border-brand-800 dark:bg-brand-900', wide ? 'max-w-3xl' : 'max-w-lg')}
            onClick={(e) => e.stopPropagation()}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-medium text-brand-900 dark:text-brand-50">{title}</h2>
              <button onClick={onClose} className="rounded p-1 text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-800">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-brand-200 p-10 text-center text-brand-300 dark:border-brand-700">
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 text-sm">{description}</p>}
    </div>
  )
}

export function Spinner() {
  return <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
}
