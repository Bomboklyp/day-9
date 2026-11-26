# Release audit — WorkFlow 1.0.1

Дата: 24 ноября 2026, Europe/Moscow. Аудит относится к девятому этапу. Проверки запускаются на production-сборке Nuxt; рабочие данные отделены от временных тестовых схем.

| Область | Проверка и результат | Доказательство |
| --- | --- | --- |
| Функциональность | 37 unit/integration и 26 E2E пройдены; сохранены критические сценарии предыдущих этапов | `tests`, `verification-result.json` |
| API и БД | Чистая схема, upgrade, повтор миграций, сохранение данных после перезапуска | `tests/integration/http.ts`, `product-http.ts` |
| Роли | Гость 401; чужая заявка Client 404; административные операции Agent 403; неактивный исполнитель 422 | HTTP-сценарии |
| Сессии | HttpOnly/SameSite cookie, хеш токена в БД, logout и защита от позднего ответа | `release-http.ts`, `regressions.spec.ts` |
| Вход и HTTP | Лимит попыток 429 + Retry-After; после истечения окна запрос снова выполняется; чужой Origin 403 | `release-http.ts` |
| Вложения | Размер, сигнатура, тип, число, конкурентный upload, авторизация скачивания | `product-http.ts`, `product.spec.ts` |
| XSS и заголовки | Комментарий с HTML выводится текстом; nosniff, frame denial, базовая CSP | `release.spec.ts`, `release-http.ts` |
| UX | Loading/empty/error, retry, disabled, rollback/Undo; четыре dashboard по роли; admin-навигация на мобильном | E2E и `docs/screenshots` |
| Accessibility | Axe: ноль нарушений выбранных WCAG A/AA-правил на целевых страницах/формах; Tab, Shift+Tab, стрелки, Escape и возврат focus проверены | `tests/e2e/release.spec.ts` |
| Responsive | Публичные страницы, SLA, аналитика, уведомления на 360/768/1280 px; без горизонтального переполнения | E2E screenshots |
| SEO / hydration | Первый HTML, уникальные metadata, sitemap, 404; нет mismatch в LA/Tokyo при сохранённых настройках | `public.spec.ts` |
| Зависимости | После точечных overrides npm audit: 0 уязвимостей; до исправления было 12 moderate, 0 high/critical | `package-lock.json`, локальный audit JSON |
| Архитектура | Границы слоёв и отсутствие циклов проверены | `npm run arch:check`, `docs/architecture/after.json` |
| Код | Typecheck включает тесты, ESLint без предупреждений, production build пройден | npm scripts |
| Воспроизводимость | В отдельной чистой папке пройдены npm ci, prepare, build и полный HTTP-прогон; рабочая .env не копировалась | Временная копия в `.verification/day9/fresh-source` |
| Docker | Compose config проходит; pinned images, healthcheck, миграции до app, non-root/read-only app, закрытый DB port | `Dockerfile`, `compose.yaml` |
| CI | Workflow проверен actionlint; реальные jobs подготовлены, удалённого прогона ещё нет | `.github/workflows/release.yml` |
| Performance | 12 холодных запусков; медианы 98/100/100/99, все четыре страницы в бюджете | [PERFORMANCE.md](PERFORMANCE.md) |

## Исправления аудита

1. В окружении компьютера был задан DEBUG: он явно отключён в конфигурации и production-процессах проверок.
2. Обновлены уязвимые транзитивные minimatch/glob с сохранением Nuxt 4.6.4; сборка и существующие тесты повторно пройдены. Источники: [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249), [glob advisory](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4).
3. В мобильном меню отсутствовали административные разделы; добавлены существующие ссылки без новой функциональности.
4. Закрытие route-модального окна теряло focus и фильтры: теперь query сохраняется, focus возвращается к созданию заявки. Добавлен E2E.
5. Добавлены ограничение входа, безопасные заголовки, проверка конфигурации БД и минимальный health endpoint.
6. В публичной версии seed обезличено описание отличительной заявки; старые архивы исходников и ненужные экспорты макета не включены в релиз.

## Что ещё требует внешней среды

На этом компьютере нет Docker Engine/WSL. Проверка `compose config` выполнена настоящим Compose CLI, но Linux-образы здесь не собирались и контейнеры не запускались. Это делает отдельный CI job после публикации; до его успешного выполнения Docker runtime нельзя считать проверенным.

У пользователя пока нет репозитория и хостинга. Поэтому публичный repository URL, постоянный demo URL и ссылка на успешный CI ещё отсутствуют. Локальные Git main/tag и архив исходников не заменяют эти три пункта сдачи.

Автоматическая accessibility-проверка не заменяет ручную работу со screen reader. Lighthouse измеряет локальный лабораторный запуск, а не полевые метрики удалённого стенда. Подробные ограничения — в TRADEOFFS.md и PERFORMANCE.md.

## Повторная проверка 26 ноября 2026

Проверены все девять рабочих версий: 200 unit/integration-тестов суммарно, все typecheck, доступные lint и проверки архитектуры прошли. В финальной версии повторно пройдены 26 E2E и реальные HTTP-сценарии с PostgreSQL. В первых двух днях убраны восемь избыточных комментариев без изменения логики, сборки этих версий повторены.

Исправлена выгрузка скрытых отчётов CI: include-hidden-files включён только для перечисленных путей .verification/day9. Изменение CI выпускается тегом v1.0.1; код приложения и измеренный performance sourceHash сохранены. Публичные ссылки и фактический запуск контейнеров по-прежнему требуют внешнего CI/хостинга.
