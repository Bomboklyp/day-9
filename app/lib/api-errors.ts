export function apiErrorStatus(error: unknown): number {
  if (!error || typeof error !== "object") return 0;
  if ("statusCode" in error && typeof error.statusCode === "number")
    return error.statusCode;
  if ("status" in error && typeof error.status === "number")
    return error.status;
  return 0;
}
export function apiErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    error.data &&
    typeof error.data === "object" &&
    "data" in error.data &&
    error.data.data &&
    typeof error.data.data === "object" &&
    "message" in error.data.data &&
    typeof error.data.data.message === "string"
  )
    return error.data.data.message;
  const status = apiErrorStatus(error);
  if (status === 401) return "Сессия истекла. Войдите снова.";
  if (status === 403) return "Недостаточно прав для этого действия.";
  if (status === 413)
    return "Файл превышает 10 МБ. Выберите файл меньшего размера.";
  if (status === 415)
    return "Этот формат не поддерживается. Допустимы PNG, JPG и PDF.";
  if (status === 422) return "Проверьте условия выполнения действия.";
  if (status === 429)
    return "Слишком много запросов. Подождите немного и повторите загрузку.";
  if (status === 409)
    return "Данные заявки уже изменились. Обновите заявку и повторите действие.";
  if (status === 500 || status === 503)
    return "Сервис временно недоступен. Попробуйте ещё раз.";
  if (status === 404) return "Заявка не найдена. Возможно, она была удалена.";
  if (status === 400) return "Проверьте введённые данные и попробуйте ещё раз.";
  return "Не удалось связаться с сервером. Проверьте соединение и повторите запрос.";
}
