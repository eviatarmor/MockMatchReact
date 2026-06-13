interface GoogleIconProps {
  readonly className?: string
}

export function GoogleIcon({ className }: GoogleIconProps) {
  return (
    <img
      src="/icons/google.svg"
      alt=""
      width={16}
      height={16}
      className={className}
    />
  )
}
