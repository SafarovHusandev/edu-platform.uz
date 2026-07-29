// Backend barcha pul summalarini tiyinda saqlaydi/qaytaradi (1 so'm = 100 tiyin,
// Multicard bilan bir xil birlik). formatPrice shu qiymatlarni to'g'ridan-to'g'ri
// qabul qiladi va so'mga o'girib ko'rsatadi.
export function toTiyin(som: number) {
  return Math.round(som * 100)
}

export function fromTiyin(tiyin: number) {
  return tiyin / 100
}

export function formatPrice(tiyinValue: number) {
  if (!tiyinValue) return "Bepul"
  return `${new Intl.NumberFormat("uz-UZ").format(fromTiyin(tiyinValue))} so'm`
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("uz-UZ").format(value)
}

export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function initials(name: string | null | undefined) {
  if (!name) return "?"
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}
