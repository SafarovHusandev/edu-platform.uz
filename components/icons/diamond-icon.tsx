import Image from "next/image"

interface DiamondIconProps {
  className?: string
}

function DiamondIcon({ className }: DiamondIconProps) {
  return (
    <Image
      src="/diamond.png"
      alt=""
      width={32}
      height={32}
      className={className}
    />
  )
}

export { DiamondIcon }
