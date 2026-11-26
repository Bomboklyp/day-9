import type { Person, WorkflowRequest } from "../../shared/types/workflow";
import { ensureProjectRequest } from "./project-request";
export const team: Person[] = [
  { name: "Анна Кузнецова", initials: "АК", color: "purple" },
  { name: "Мария Смирнова", initials: "МС", color: "purple" },
  { name: "Брунгильда Брунгильдовна", initials: "ББ", color: "purple" },
  { name: "Олег С.", initials: "ОС", color: "purple" },
];
const designRows = [
  {
    id: 1042,
    title: "Не работает доступ к CRM",
    client: "АО «Вектор»",
    assignee: "Не назначен",
    status: "new",
    priority: "high",
  },
  {
    id: 1041,
    title: "Ошибка выгрузки отчёта",
    client: "ООО «Сфера»",
    assignee: "Не назначен",
    status: "new",
    priority: "urgent",
  },
  {
    id: 1040,
    title: "Подключить нового сотрудника",
    client: "АО «Вектор»",
    assignee: "Брунгильда Б.",
    status: "assigned",
    priority: "medium",
  },
  {
    id: 1039,
    title: "Обновить сертификат",
    client: "ООО «Пульс»",
    assignee: "Брунгильда Б.",
    status: "waiting",
    priority: "high",
  },
  {
    id: 1038,
    title: "Настроить резервное копирование",
    client: "ООО «Сфера»",
    assignee: "Олег С.",
    status: "in_progress",
    priority: "medium",
  },
  {
    id: 1037,
    title: "Сбой печати документов",
    client: "ООО «Пульс»",
    assignee: "Брунгильда Б.",
    status: "resolved",
    priority: "low",
  },
  {
    id: 1036,
    title: "Изменить права доступа",
    client: "АО «Вектор»",
    assignee: "Не назначен",
    status: "new",
    priority: "medium",
  },
  {
    id: 1035,
    title: "Ошибка авторизации в кабинете",
    client: "ООО «Пульс»",
    assignee: "Олег С.",
    status: "assigned",
    priority: "high",
  },
  {
    id: 1034,
    title: "Подключить почтовый ящик",
    client: "ООО «Сфера»",
    assignee: "Брунгильда Б.",
    status: "closed",
    priority: "low",
  },
  {
    id: 1033,
    title: "Недоступен файловый сервер",
    client: "АО «Вектор»",
    assignee: "Брунгильда Б.",
    status: "in_progress",
    priority: "urgent",
  },
  {
    id: 1032,
    title: "Изменить контакты компании",
    client: "ООО «Пульс»",
    assignee: "Олег С.",
    status: "closed",
    priority: "low",
  },
  {
    id: 1031,
    title: "Проверить интеграцию",
    client: "ООО «Сфера»",
    assignee: "Брунгильда Б.",
    status: "waiting",
    priority: "medium",
  },
] as const;
const secondPageTitles = [
  "Настроить VPN",
  "Заменить картридж принтера",
  "Восстановить доступ к почте",
  "Обновить антивирус",
  "Подключить второй монитор",
  "Проверить резервную копию",
  "Настроить общую папку",
  "Продлить сертификат",
  "Подключить IP-телефон",
  "Исправить печать счетов",
  "Настроить права в CRM",
  "Проверить синхронизацию",
];
export function createMockRequests(): WorkflowRequest[] {
  const requests = Array.from({ length: 24 }, (_, index): WorkflowRequest => {
    const row = designRows[index % 12]!;
    const id = row.id - Math.floor(index / 12) * 12;
    const createdAt = new Date(
      Date.UTC(2026, 9, 5, 6, 14) - index * 3600000,
    ).toISOString();
    const author = { ...team[1]! };
    const assignee =
      row.assignee === "Не назначен"
        ? { name: "Не назначен", initials: "", color: "purple" }
        : row.assignee === "Олег С."
          ? { ...team[3]! }
          : { ...team[2]! };
    return {
      id,
      title: index < 12 ? row.title : secondPageTitles[index - 12]!,
      client: row.client,
      status: row.status,
      priority: row.priority,
      category: "Доступ и учётные записи",
      author,
      assignee,
      createdAt,
      dueAt: "2026-10-05T10:14:00.000Z",
      description:
        id === 1042
          ? "После обновления не удаётся войти в CRM. При попытке входа появляется сообщение «Доступ запрещён». Проблема затрагивает отдел продаж."
          : index < 12
            ? row.title
            : secondPageTitles[index - 12]!,
      comments:
        id === 1042
          ? [
              {
                id: "1042-comment-1",
                author: { ...author },
                text: "Не можем войти с рабочих компьютеров. Нужна помощь.",
                createdAt,
              },
            ]
          : [],
      timeline: [
        {
          id: id + "-created",
          title: "Мария создала заявку",
          description: "",
          createdAt,
          kind: "created",
        },
      ],
    };
  });
  return ensureProjectRequest(requests);
}
