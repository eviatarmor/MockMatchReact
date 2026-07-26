interface YahooIconProps {
  readonly className?: string
}

export function YahooIcon({ className }: YahooIconProps) {
  return (
    <img
      src="/icons/yahoo.svg"
      alt=""
      width={16}
      height={16}
      className={className}
    />
  )
}
