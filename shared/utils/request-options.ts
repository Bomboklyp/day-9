import type { RequestPriority, RequestStatus } from "../types/request";
export const statuses: {
  value: RequestStatus;
  label: string;
  color: string;
}[] = [
  { value: "new", label: "Новая", color: "new" },
  { value: "assigned", label: "Назначена", color: "assigned" },
  { value: "in_progress", label: "В работе", color: "progress" },
  { value: "waiting", label: "Ожидание", color: "waiting" },
  { value: "resolved", label: "Решена", color: "resolved" },
  { value: "escalated", label: "Эскалирована", color: "escalated" },
  { value: "closed", label: "Закрыта", color: "closed" },
];
export const priorities: {
  value: RequestPriority;
  label: string;
  weight: number;
}[] = [
  { value: "low", label: "Низкий", weight: 1 },
  { value: "medium", label: "Обычный", weight: 2 },
  { value: "high", label: "Высокий", weight: 3 },
  { value: "urgent", label: "Критический", weight: 4 },
];
export const categories = [
  "Доступ и учётные записи",
  "Оборудование",
  "Программное обеспечение",
  "Интеграции",
];
