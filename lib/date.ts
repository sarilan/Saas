const formateurRelatif = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

export function formaterDateRelative(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);

  if (Math.abs(diffMinutes) < 60) {
    return formateurRelatif.format(diffMinutes, 'minute');
  }

  const diffHeures = Math.round(diffMinutes / 60);
  if (Math.abs(diffHeures) < 24) {
    return formateurRelatif.format(diffHeures, 'hour');
  }

  const diffJours = Math.round(diffHeures / 24);
  return formateurRelatif.format(diffJours, 'day');
}
