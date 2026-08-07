"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Faqat mahalliy 9 ta raqamni oladi — "+998" doim ko'rinib turadi va o'chirilmaydi.
export function PhoneInput({
  value,
  onChange,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: string
  onChange: (value: string) => void
}) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let digits = e.target.value.replace(/\D/g, "")
    // Foydalanuvchi to'liq raqamni ("998901234567" yoki "+998...") joylashtirsa,
    // kod qismini avtomatik olib tashlaymiz.
    if (digits.startsWith("998") && digits.length > 9) {
      digits = digits.slice(3)
    }
    onChange(digits.slice(0, 9))
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        +998
      </span>
      <Input
        {...props}
        type="tel"
        inputMode="numeric"
        maxLength={9}
        placeholder="90 123 45 67"
        value={value}
        onChange={handleChange}
        className={cn("pl-14", className)}
      />
    </div>
  )
}
