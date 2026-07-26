interface TelegramIconProps {
  readonly className?: string
}

export function TelegramIcon({ className }: TelegramIconProps) {
  return (
    <img
      src="/icons/telegram.svg"
      alt=""
      width={16}
      height={16}
      className={className}
    />
  )
}
