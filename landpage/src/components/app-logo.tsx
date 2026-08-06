interface AppLogoProps {
  readonly className?: string
}

export function AppLogo({ className }: AppLogoProps) {
  return (
    <img
      src="/icons/app-logo.svg"
      alt=""
      width={32}
      height={32}
      className={className}
    />
  )
}
