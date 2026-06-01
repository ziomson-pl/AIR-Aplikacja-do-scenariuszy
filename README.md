# AIR — Aplikacja do Scenariuszy

Aplikacja webowa do pisania dialogów filmowych. Umożliwia tworzenie projektów z listą postaci, wpisywanie kwestii z automatycznym przypisaniem imienia oraz eksport scenariusza do PDF w formacie profesjonalnym.

## Wymagania

- Node.js 18+
- Docker & Docker Compose

## Uruchomienie

### 1. Baza danych

```bash
docker-compose up -d
```

### 2. Backend (NestJS + Prisma)

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run start:dev
```

Backend dostępny pod: `http://localhost:3000`

### 3. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Frontend dostępny pod: `http://localhost:5173`

## Funkcje

- Tworzenie projektów z tytułem
- Dodawanie dowolnej liczby postaci z imionami
- Edytor dialogów — kliknięcie postaci na liście ustawia aktywnego mówcę
- Automatyczne dodawanie imienia postaci do kwestii
- Tryb Narratora — didaskalia wyświetlane kursywą
- Zapis projektu w bazie PostgreSQL
- Eksport do PDF (server-side przez Puppeteer) z formatowaniem scenariuszowym:
  - imię postaci wyśrodkowane, wszystkie litery wielkie
  - kwestia z wcięciem
  - didaskalia kursywą, wyśrodkowane

## Stos technologiczny

| Warstwa | Technologia |
|---------|-------------|
| Frontend | React 18, TypeScript, Vite |
| Backend | NestJS, TypeScript, Prisma ORM |
| Baza danych | PostgreSQL 15 |
| PDF | Puppeteer (server-side rendering) |
| Konteneryzacja | Docker Compose |
