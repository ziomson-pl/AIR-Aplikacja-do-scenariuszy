# AIR — Aplikacja do Scenariuszy

Aplikacja webowa do pisania dialogów filmowych. Wybierasz postać, wpisujesz kwestię,
a aplikacja sama dba o atrybucję i układ scenariusza. Projekty zapisują się
automatycznie i można je wyeksportować do profesjonalnie sformatowanego PDF-a.

## Wymagania

- Node.js 18+
- Docker & Docker Compose

## Uruchomienie

### 1. Baza danych

```bash
docker compose up -d
```

### 2. Backend (NestJS + Prisma)

```bash
cd backend
cp .env.example .env        # konfiguracja połączenia z bazą
npm install
npx prisma db push          # utworzenie schematu w bazie
npm run start:dev
```

Backend dostępny pod `http://localhost:3000`.

> **PDF:** eksport korzysta z Puppeteera, który pobiera Chromium podczas `npm install`.
> Jeśli instalujesz w środowisku bez pobierania (`PUPPETEER_SKIP_DOWNLOAD=true`),
> wskaż systemową przeglądarkę zmienną `PUPPETEER_EXECUTABLE_PATH`.

### 3. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Frontend dostępny pod `http://localhost:5173`.

## Funkcje

**Pisanie**
- Dowolna liczba postaci, każda z własnym kolorem (auto-przydzielanym z palety)
- Trzy tryby kwestii: **dialog**, **narrator** (didaskalia kursywą), **scena** (nagłówki `WNĘTRZE — …`)
- Automatyczna atrybucja — imię aktywnej postaci dodaje się samo
- Edycja kwestii w miejscu (podwójne kliknięcie) i zmiana kolejności (strzałki ↑ ↓)
- Zmiana nazwy projektu i postaci, zmiana koloru postaci

**Wygoda**
- Autozapis każdej zmiany ze wskaźnikiem stanu
- Powiadomienia (toasty) zamiast surowych komunikatów
- Panel statystyk: liczba wierszy/słów/scen oraz udział poszczególnych postaci
- Skróty klawiszowe:

  | Skrót | Działanie |
  |-------|-----------|
  | `Alt`+`1…9` | wybór postaci (mówcy) |
  | `Alt`+`0` | tryb narratora |
  | `Alt`+`S` | tryb sceny |
  | `Enter` | dodaj / zapisz kwestię |
  | `Shift`+`Enter` | nowa linia w kwestii |
  | `Esc` | anuluj edycję |

**Eksport**
- PDF renderowany po stronie serwera (Puppeteer) z poprawną obsługą polskich znaków:
  imię wyśrodkowane wersalikami, kwestia z wcięciem, didaskalia kursywą, nagłówki scen,
  strona tytułowa i numeracja stron.

## Testy

```bash
cd backend  && npm test     # Jest — logika serwisu + generowanie HTML do PDF
cd frontend && npm test     # Vitest — reducer, util-e, komponenty (Testing Library)
```

## API (REST)

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| `POST` | `/projects` | nowy projekt |
| `GET` | `/projects` | lista projektów |
| `GET` | `/projects/:id` | projekt z postaciami i kwestiami |
| `PUT` | `/projects/:id` | zmiana tytułu |
| `DELETE` | `/projects/:id` | usunięcie projektu |
| `POST` | `/projects/:id/characters` | dodanie postaci |
| `PATCH` | `/projects/:id/characters/:charId` | zmiana nazwy / koloru |
| `DELETE` | `/projects/:id/characters/:charId` | usunięcie postaci |
| `POST` | `/projects/:id/lines` | dodanie kwestii |
| `PATCH` | `/projects/:id/lines/:lineId` | edycja treści kwestii |
| `PATCH` | `/projects/:id/lines/reorder` | zmiana kolejności kwestii |
| `DELETE` | `/projects/:id/lines/:lineId` | usunięcie kwestii |
| `GET` | `/projects/:id/export/pdf` | eksport scenariusza do PDF |

## Stos technologiczny

| Warstwa | Technologia |
|---------|-------------|
| Frontend | React 18, TypeScript, Vite, Vitest |
| Backend | NestJS, TypeScript, Prisma ORM, Jest |
| Baza danych | PostgreSQL 15 |
| PDF | Puppeteer (server-side rendering) |
| Konteneryzacja | Docker Compose |
