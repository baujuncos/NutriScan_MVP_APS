const TZ = 'America/Argentina/Buenos_Aires';

export function todayAR(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}
