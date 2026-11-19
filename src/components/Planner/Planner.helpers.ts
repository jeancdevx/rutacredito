export function nextPeriod(period: string) {
  const year = Number(period.slice(0, 4)),
    term = period.slice(4)

  return term === '10' ? `${year}20` : `${year + 1}10`
}
