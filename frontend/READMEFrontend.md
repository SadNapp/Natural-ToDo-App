# Frontend: особистий фінансовий записник

Цей документ описує frontend та майбутній контракт Finance API. API контракт нижче є специфікацією для майбутнього backend, а не твердженням, що ці маршрути вже реалізовані.

## Запуск і режими даних

```bash
npm install
npm run dev
npm run build
```

Фінансові дані працюють у mock режимі за замовчуванням і зберігаються у `localStorage` під ключем `finance-notebook.v1`. Жодні демонстраційні операції, доходи або цілі не додаються автоматично.

Для майбутнього backend створіть `frontend/.env.local`:

```env
VITE_FINANCE_DATA_MODE=api
VITE_FINANCE_API_URL=https://localhost:7080/api/finance
```

Значення `VITE_FINANCE_DATA_MODE` приймає `mock` або `api`. `VITE_FINANCE_API_URL` — базова адреса Finance API. Не зберігайте секрети чи паролі у змінних `VITE_*`: вони потрапляють у клієнтську збірку.

Наявні нотатки та справи й далі використовують окремий `todoService` та його чинний .NET Todo API (`VITE_API_URL`, за замовчуванням `http://localhost:5186/api/todo`). Фінансовий сервіс `src/services/financeService.js` ізольований від UI та перемикається через `VITE_FINANCE_DATA_MODE`.

## Структура frontend

- `src/TodoApp.jsx` — навігація, загальний стан, зв’язування сервісів і розділів.
- `src/components/finance/` — огляд, операції, бюджет, цілі, нотатки та архів.
- `src/services/financeService.js` — mock localStorage і майбутній HTTP адаптер Finance API.
- `src/services/api.js` — чинний адаптер Todo API з локальним offline fallback.
- `src/utils/finance.js` — форматування сум і допоміжні функції дат.
- `src/styles/` — темна лісова скляна тема та адаптивні стилі.

## Домовленості даних і підрахунків

- Грошові значення передаються десятковими числами в гривнях; backend має зберігати їх як decimal/fixed precision, не як float.
- Дати операцій — календарні дати `YYYY-MM-DD` у часовому поясі користувача. Часовий пояс не повинен непомітно зсувати день.
- `income` — дохід; `expense` — витрата. Переказів між власними рахунками немає. Якщо backend їх додасть, `transfer` не включати до доходу чи витрат.
- `status=completed` бере участь у фактичному огляді, бюджетному факті й звітах. `status=planned` показується окремо та не змінює фактичний залишок.
- Фактичний залишок за період: виконані доходи мінус виконані витрати. Внески до цілей показуються окремою сумою і не додаються до доходу.
- Витрати за категоріями/тижнями рахуються тільки з виконаних витрат.
- Шаблон бюджету застосовує відсотки до заданого чистого доходу. Якщо він не заданий, frontend використовує суму виконаних доходів за обраний місяць. Відсотки має бути рівно 100%; frontend нічого не нормалізує автоматично.
- Нульовий бюджет розподіляє заданий дохід за категоріями. Нерозподілений залишок дорівнює доходу мінус призначені суми; його мета — розподілити гривню, а не витратити її.
- Рекомендація цілі: залишок цілі, поділений на кількість календарних місяців або тижнів до бажаної дати (округлення вгору). Минулу дату та досягнуту ціль показувати як окремий стан.
- Сценарій можливої економії є лише розрахунком за введеними користувачем припущеннями. Він не змінює бюджет та не обіцяє скорочення витрат.
- Шаблони бюджету є інструментом планування, не фінансовою порадою.

## API

База маршрутів: `{VITE_FINANCE_API_URL}`. JSON поля — `camelCase`. Усі запити, крім читання, потребують `Content-Type: application/json`. Авторизацію слід додати через узгоджений механізм backend, не через секрет у frontend.

Типові помилки: `400` — невалідні поля/відсотки; `401`/`403` — потрібен вхід/немає доступу; `404` — запис або бюджет не знайдено; `409` — конфлікт версії чи дубль; `5xx`/мережева помилка — тимчасова помилка сервера. UI має залишити введені значення, показати зрозуміле повідомлення, не рахувати невдале збереження як факт і дозволити повторити запит. Не слід мовчки замінювати API помилки новими пустими даними.

### Огляд за період

`GET /overview?from=YYYY-MM-DD&to=YYYY-MM-DD`

Відповідь: `{ "currency": "UAH", "actualIncome": 0, "actualExpenses": 0, "balance": 0, "plannedIncome": 0, "plannedExpenses": 0, "goalContributions": 0, "expensesByDay": [{ "date": "YYYY-MM-DD", "amount": 0 }], "expensesByCategory": [{ "categoryId": "uuid", "name": "Продукти", "amount": 0 }], "upcomingPayments": [{ "operationId": "uuid", "title": "Оренда", "date": "YYYY-MM-DD", "amount": 0 }] }`.

Тільки `completed` операції формують фактичні суми/графіки; заплановані надходження та платежі повертаються окремо. `balance = actualIncome - actualExpenses`.

### Операції

- `GET /operations?from=YYYY-MM-DD&to=YYYY-MM-DD&type=income|expense&categoryId={uuid}&status=planned|completed&search={text}&includeDeleted=false` — список і фільтри.
- `POST /operations` — створення; body — `OperationWrite`; відповідь `201 Operation`.
- `GET /operations/{id}` — отримати одну операцію; відповідь `200 Operation`.
- `PUT /operations/{id}` — повне редагування; body — `OperationWrite`; відповідь `200 Operation` або `204`.
- `DELETE /operations/{id}` — soft delete до кошика; відповідь `204`.
- `PUT /operations/{id}/restore` — відновлення з архіву; відповідь `204`.
- `DELETE /operations/{id}/hard` — незворотне видалення з кошика; відповідь `204`.

`OperationWrite`: `{ "title": "Продукти", "amount": 1250.50, "type": "expense", "categoryId": "uuid", "date": "YYYY-MM-DD", "status": "completed", "account": "Картка", "note": "Покупки на тиждень", "recurring": false, "frequency": null }`. `Operation` додає `id`, `isDeleted`, `createdAt`, `updatedAt`. `amount` мусить бути додатним; назва, дата, тип, статус і активна категорія обов’язкові; `frequency` має бути дозволеним значенням, якщо `recurring=true`.

### Категорії

- `GET /categories` — `{ "items": [Category] }`.
- `POST /categories` — body `{ "name": "Продукти", "group": "needs", "color": null }`; відповідь `201 Category`.
- `PUT /categories/{id}` — редагування назви/групи; відповідь `200 Category`.
- `DELETE /categories/{id}` — видалити невикористану категорію; `409`, якщо на неї посилаються операції, або backend може вимагати переназначення.

`Category`: `{ "id": "uuid", "name": "Продукти", "group": "needs|wants|savings", "color": null, "isArchived": false }`. Назва обов’язкова і унікальна для користувача. Окрім CRUD маршрутів, поточний frontend використовує `PUT /categories` з повним масивом категорій і очікує масив або `{ "items": [...] }` у відповіді, щоб зберігати групи разом із назвами.

### Бюджет і шаблони

- `GET /budgets` — `{ "items": [Budget] }` для наявних місяців. Frontend завантажує список, щоб можна було перемикатися між місячними планами.
- `GET /budgets?month=YYYY-MM` — бюджет одного місяця або `404`, якщо він ще не створений (зручний варіант для прямого запиту).
- `PUT /budgets/{month}` — створити або замінити план місяця; відповідь `200 Budget`.
- `GET /budgets/templates` — вбудовані шаблони: `50-30-20`, `60-30-10`, `70-20-10`, `80-20`, `zero-based`.

`Budget`: `{ "month": "YYYY-MM", "template": "50-30-20", "netIncome": 50000, "allocations": { "needs": 50, "wants": 30, "savings": 20 }, "categoryGroups": { "category-uuid": "needs" }, "categoryAmounts": {} }`. Відсоткові шаблони вимагають невід’ємних відсотків із сумою рівно `100`. Для `zero-based` `allocations` може бути порожнім, а `categoryAmounts` містить суми за категоріями; сума призначень не може перевищувати чистий дохід. Помилка не повинна автоматично переписувати user input.

Для звіту бюджетна відповідь може містити `lines: [{ "key": "needs", "planned": 25000, "actual": 12000, "remaining": 13000, "overLimit": false }]`. `actual` рахується з виконаних витрат місяця; залишок `planned - actual` може бути від’ємним і тоді `overLimit=true`.

### Цілі заощадження

- `GET /goals?includeArchived=false` — `{ "items": [Goal] }`.
- `POST /goals` — створити; body `GoalWrite`; відповідь `201 Goal`.
- `GET /goals/{id}` — деталі цілі та внески.
- `PUT /goals/{id}` — змінити мету/дату/пріоритет/нотатки; відповідь `200 Goal`.
- `DELETE /goals/{id}` — архівувати ціль; відповідь `204`.

`GoalWrite`: `{ "name": "Новий телефон", "targetAmount": 30000, "savedAmount": 2500, "targetDate": "YYYY-MM-DD", "priority": "normal", "note": "" }`. `Goal` додає `id`, `createdAt`, `contributedAmount`, `remainingAmount`, `progressPercent`, `recommendedMonthly`, `recommendedWeekly`, `status`. Цільова сума має бути більшою за нуль; заощаджена сума — невід’ємною. Минулу дату повернути зі станом `pastDue`, досягнуту ціль — `achieved`, без від’ємної чи нескінченної рекомендації.

### Внески до цілей

- `GET /goal-contributions` — `{ "items": [Contribution] }` для відображення історій внесків.
- `POST /goal-contributions` — `{ "goalId": "uuid", "amount": 500, "date": "YYYY-MM-DD", "note": "" }`; відповідь `201 Contribution`.
- `GET /goals/{goalId}/contributions` — історія `{ "items": [Contribution] }`.
- `POST /goals/{goalId}/contributions` — альтернативний ресурсно-вкладений маршрут з таким самим body без `goalId`; відповідь `201 Contribution`.
- `DELETE /goals/{goalId}/contributions/{id}` — видалити помилковий внесок і перерахувати залишок; відповідь `204`.

`Contribution`: `{ "id": "uuid", "goalId": "uuid", "amount": 500, "date": "YYYY-MM-DD", "note": "", "createdAt": "ISO-8601" }`. Сума має бути більшою за нуль, ціль повинна існувати й належати поточному користувачу. Backend зберігає історію окремо; `savedAmount` має бути узгоджений із початково внесеною сумою та сумою внесків. Наявний адаптер викликає глобальний `/goal-contributions` маршрут.

### Повне редагування категорій

Для простого редагування списку з екрана бюджету frontend використовує `PUT /categories` з масивом `Category` як body і очікує масив або `{ "items": [...] }` у відповіді. Backend може натомість підтримати окремі `POST`/`PUT /categories/{id}` маршрути; у такому разі достатньо замінити лише `saveCategories` в сервісному адаптері.

## Нотатки, справи й приватність

Звичайні справи/нотатки залишаються окремими від фінансових операцій і використовують чинний Todo API. Нотатка може мати категорію та нагадування, а також локальний зв’язок з операцією, категорією чи ціллю. Поточний .NET Todo DTO не має цих link полів, тому самі зв’язки зберігаються у локальному кеші браузера до розширення backend. Їх можна синхронізувати через `linkedType` і `linkedId` у майбутньому `Note/Task DTO` або окремий Notes API.

## Збереження і приватність

Mock режим — локальний до браузера; очищення даних браузера їх видалить. Для production даних потрібні автентифікація, авторизація на рівні власника даних і TLS на backend. Фінансові суми не передаються третім сторонам; картка з фактом природи використовує наявне зовнішнє джерело з локальним fallback.
