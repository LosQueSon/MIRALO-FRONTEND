interface FeaturePageShellProps {
  title: string
  description: string
  children?: React.ReactNode
}

export default function FeaturePageShell({
  title,
  description,
  children,
}: FeaturePageShellProps) {
  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="ui-header-shell flex min-h-[220px] flex-col justify-center p-6 sm:min-h-[240px] sm:p-8 lg:min-h-[260px]">
          <div className="ui-dot-grid absolute inset-0 opacity-80" />
          <div className="relative z-10 flex flex-col gap-5">
            <div className="max-w-3xl space-y-3">
              <h1 className="ui-title text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                {title}
              </h1>
              <p className="ui-description max-w-2xl text-sm leading-6 sm:text-base">
                {description}
              </p>
            </div>
          </div>
        </header>

        {children ? (
          <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">{children}</div>
        ) : null}
      </div>
    </div>
  )
}
