# Fullstack ToDo Project 🌿

*(Scroll down for Ukrainian / Українська версія нижче)*

A modern, full-stack Task Management application built with a focus on cutting-edge UI/UX (Glassmorphism), resilience (Fallback mechanisms), and deep analytical insights.

## 🚀 Tech Stack
- **Backend**: C# .NET API (EF Core, Serilog)
- **Frontend**: React.js (Vite) + Lucide / Native Emojis
- **Database**: PostgreSQL
- **DevOps**: Docker & Docker Compose, GitHub Actions (CI)

## ✨ Features
1. **Glassmorphism Design**: High-end stunning visual effects, blur filters, scaled animations on hover, and custom smooth scrolling.
2. **Soft-Delete System**: Items are never permanently erased immediately. They go to a beautiful floating "Trash" (Кошик) UI from which they can be reliably restored or hard-deleted.
3. **Optimistic UI Updates**: Interactions with toggling, adding, or deleting happen instantly on the UI without waiting for network. Failing API calls cleanly roll back to previous state natively.
4. **Resilient Circuit Breaker (Storage Mode)**: If PostgreSQL fails or shuts off, the `.NET WebR` automatically switches all logic to local `App_Data/Saves/` JSON files! Your frontend dynamically receives the "Storage Mode" indicator without missing a single beat.
5. **Bulk Operations & Analytics**: A floating widget allows users to multi-select and delete objects at once. A beautifully integrated **Analytics Dashboard** dynamically renders tasks completed per week and distributions per category.
6. **Nature Facts API Integration**: Implemented an automated background API fetching ecosystem facts with fallback Ukrainian translations. 

---

## 🏗️ How to Run Locally

With Docker, getting this project up and running takes one command.

1. Rename `.env.example` to `.env` and fill in custom DB credentials if required (Defaults are included).
2. Open terminal in the root directory.
3. Run:
```bash
docker-compose up -d --build
```
- Open `http://localhost:5173` for the interactive UI.
- API operates securely on `http://localhost:5186/api/todo`.

All database changes and local fallback saves (`App_Data`) are securely mounted via Docker **Volumes** to guarantee no data loss between restarts. Wait for the `webr-db` container to be fully initialized on the very first run.

---
---

# Українська Версія 🌿

Сучасний full-stack додаток для управління завданнями, створений з акцентом на передовий UI/UX (стиль Glassmorphism), стабільність (Fallback Storage) та аналітику.

## 🚀 Технології
- **Бекенд**: C# .NET API (EF Core, Serilog)
- **Фронтенд**: React.js (Vite)
- **База Даних**: PostgreSQL
- **Інфраструктура**: Docker, Docker Compose, GitHub Actions для CI/CD

## ✨ Ключові фічі
1. **Дизайн Glassmorphism**: Напівпрозорі матові інтерфейси, розмиття, "скляні" ефекти та мікро-анімації.
2. **Soft Delete (Кошик)**: Надійне м'яке видалення. Завдання потрапляють у кошик, звідки їх легко можна "Відновити" (Restore) або "Видалити назавжди" (Hard Delete). Вся БД працює через прапорець `IsDeleted`.
3. **Оптимістичний UI (Optimistic Updates)**: Дії у списку (відмітки, додавання, видалення) відображаються миттєво до відповіді сервера, забезпечуючи високу швидкість взаємодії. При мережевій помилці стан безшовно "відкочується" (rollback).
4. **Fallback Storage Mode (Circuit Breaker)**: Якщо зв'язок із PostgreSQL втрачено, бекенд автоматично перемикається на локальний сервіс та починає зберігати JSON в `App_Data/Saves`. Інтерфейс плавно позначає це хмаркою ☁️.
5. **Аналітичний дашборд та Масові дії**: Можливість генерувати графіки (Bar Chart & Pie Chart), а також виділяти одразу кілька завдань чекбоксами для комфортного масового видалення.
6. **Віджет "Nature Facts"**: Автоматичний fetching компонент, що показує випадковий факт про природу для користувача!

## 🏗️ Інструкція із Запуску (Docker)

Найпростіший спосіб розгорнути проект — використати Docker Compose:

1. За потреби, перейменуйте `.env.example` на `.env`.
2. Відкрийте термінал у корені проекту та виконайте:
```bash
docker-compose up -d --build
```
- Аплікація (Frontend) буде доступна за адресою: `http://localhost:5173`
- Backend API слухатиме: `http://localhost:5186`

Завдяки налаштованим Docker-Voluems, усі завантажені нотатки та лог-файли зберігаються між перезапусками контейнерів!
