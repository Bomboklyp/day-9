import type { Role } from "../types/auth";
export const roleLabels: Record<Role, string> = {
  Client: "Клиент",
  Operator: "Оператор",
  Agent: "Исполнитель",
  Admin: "Администратор",
};
