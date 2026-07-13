/**
 * Asia/Karachi timezone utilities.
 * All "today" computations, date formatting, and day-of-week detection
 * must go through these functions to ensure consistency.
 */

const PKT = 'Asia/Karachi' as const
const EN_CA = 'en-CA' as const // produces YYYY-MM-DD
const EN_US = 'en-US' as const // for weekday names

/** Today's date in Asia/Karachi as YYYY-MM-DD */
export function todayPKT(): string {
  return new Intl.DateTimeFormat(EN_CA, { timeZone: PKT }).format(new Date())
}

/** Parse a YYYY-MM-DD date string into a Date interpreted in PKT at noon */
function pktDate(dateStr: string): Date {
  // noon UTC to avoid any date boundary ambiguity
  return new Date(dateStr + 'T12:00:00Z')
}

/** Day of week in Asia/Karachi (0=Sun, 1=Mon, …, 6=Sat) */
export function pktDayOfWeek(dateStr: string): number {
  const names = new Intl.DateTimeFormat(EN_US, {
    timeZone: PKT,
    weekday: 'short',
  }).format(pktDate(dateStr))
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(names)
}

/** Returns the Sunday of the week containing dateStr, in PKT, as YYYY-MM-DD */
export function weekStartPKT(dateStr: string): string {
  const dow = pktDayOfWeek(dateStr)
  const d = new Date(dateStr + 'T00:00:00Z')
  const sunday = new Date(d.getTime() - dow * 86_400_000)
  return new Intl.DateTimeFormat(EN_CA, { timeZone: PKT }).format(sunday)
}

/** Returns true if dateStr refers to a Sunday in PKT */
export function isSundayPKT(dateStr: string): boolean {
  return pktDayOfWeek(dateStr) === 0
}

/** Returns true if dateStr is today in PKT */
export function isTodayPKT(dateStr: string): boolean {
  return dateStr === todayPKT()
}