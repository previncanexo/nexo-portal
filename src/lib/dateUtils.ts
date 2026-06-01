export function addOneMonth(dateStr: string | null): string {
  const base = dateStr ? new Date(dateStr + 'T12:00:00') : new Date()
  const year = base.getFullYear()
  const month = base.getMonth() + 1
  const day = base.getDate()
  const lastDay = new Date(year, month + 1, 0).getDate()
  const clampedDay = Math.min(day, lastDay)
  return `${year}-${String(month).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`
}
