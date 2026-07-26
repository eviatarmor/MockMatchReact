interface WhatsappIconProps {
  readonly className?: string
}

export function WhatsappIcon({ className }: WhatsappIconProps) {
  return (
    <img
      src="/icons/whatsapp.svg"
      alt=""
      width={16}
      height={16}
      className={className}
    />
  )
}
