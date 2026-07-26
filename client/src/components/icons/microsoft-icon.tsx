interface MicrosoftIconProps {
  readonly className?: string
}

export function MicrosoftIcon({ className }: MicrosoftIconProps) {
  return (
    <img
      src="/icons/microsoft.svg"
      alt=""
      width={16}
      height={16}
      className={className}
    />
  )
}
