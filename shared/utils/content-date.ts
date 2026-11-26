const months = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];
export function formatContentDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match || !months[Number(match[2]) - 1]) return "Дата не указана";
  return `${Number(match[3])} ${months[Number(match[2]) - 1]} ${match[1]}`;
}
