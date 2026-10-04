import clsx from 'clsx'

export function Logo({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dims = { sm: 26, md: 32, lg: 36 }[size]
  const textSize = { sm: 'text-base', md: 'text-[20px]', lg: 'text-2xl' }[size]
  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      <img src="/brand/favicon.svg" alt="" width={dims} height={dims} className="rounded-md shadow-subtle" />
      <span className={clsx('font-serif font-semibold uppercase tracking-wide text-brand-900 dark:text-white', textSize)}>Vefalys</span>
    </div>
  )
}
