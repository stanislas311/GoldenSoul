export function formaterDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formaterHeure(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
