import Image from "next/image"

import { cn } from "@/lib/utils"

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
      // object-contain: o'lcham nisbati buzilsa ham olmos cho'zilmaydi
      className={cn("object-contain", className)}
    />
  )
}

export { DiamondIcon }
