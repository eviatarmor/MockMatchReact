interface LinkedinIconProps {
  readonly className?: string
}

export function LinkedinIcon({ className }: LinkedinIconProps) {
  return (
    <img
      src="/icons/linkedin.svg"
      alt=""
      width={16}
      height={16}
      className={className}
    />
  )
}
