export const attachmentLimits = {
  count: 5,
  bytes: 10 * 1024 * 1024,
  accept: ".png,.jpg,.jpeg,.pdf",
} as const;
export const attachmentHint =
  "PNG, JPG или PDF · до 10 МБ каждый · до 5 файлов";
export function attachmentProblem(
  files: { name: string; size: number }[],
  existing = 0,
): string | null {
  if (existing + files.length > attachmentLimits.count)
    return "Можно прикрепить до 5 файлов. Уберите лишний файл.";
  for (const file of files) {
    if (!/\.(png|jpe?g|pdf)$/i.test(file.name))
      return "Этот формат не поддерживается. Допустимы PNG, JPG и PDF.";
    if (file.size > attachmentLimits.bytes)
      return "Файл превышает 10 МБ. Выберите файл меньшего размера.";
    if (!file.size) return "Пустой файл нельзя прикрепить.";
    if (
      file.name.length > 200 ||
      Array.from(file.name).some(
        (char) =>
          char === "/" || char.charCodeAt(0) === 92 || char.charCodeAt(0) < 32,
      )
    )
      return "Недопустимое имя файла.";
  }
  return null;
}
export function attachmentMime(name: string, bytes: Uint8Array): string | null {
  if (
    /\.png$/i.test(name) &&
    [137, 80, 78, 71, 13, 10, 26, 10].every(
      (value, index) => bytes[index] === value,
    )
  )
    return "image/png";
  if (
    /\.jpe?g$/i.test(name) &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  )
    return "image/jpeg";
  if (
    /\.pdf$/i.test(name) &&
    [37, 80, 68, 70, 45].every((value, index) => bytes[index] === value)
  )
    return "application/pdf";
  return null;
}
