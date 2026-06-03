# AIR — Aplikacja do Scenariuszy Filmowych

Aplikacja webowa do pisania dialogów filmowych i scenariuszy. Wybierasz postać z
panelu bocznego, wpisujesz kwestię w polu na dole ekranu — aplikacja sama dba
o atrybucję (imię nad kwestią) i układ w stylu profesjonalnego scenariusza.
Projekty zapisują się automatycznie w bazie danych i można je wyeksportować do
PDF-a z pełnym formatowaniem.

---

## Spis treści

1. [Wymagania systemowe](#wymagania-systemowe)
2. [Instalacja od zera (krok po kroku)](#instalacja-od-zera)
3. [Uruchomienie](#uruchomienie)
4. [Jak korzystać z aplikacji](#jak-korzystać-z-aplikacji)
5. [Funkcje](#funkcje)
6. [Skróty klawiszowe](#skróty-klawiszowe)
7. [Testy](#testy)
8. [Stos technologiczny](#stos-technologiczny)
9. [Struktura projektu](#struktura-projektu)
10. [API — lista endpointów](#api--lista-endpointów)
11. [Rozwiązywanie problemów](#rozwiązywanie-problemów)

---

## Wymagania systemowe

| Narzędzie | Minimalna wersja | Jak sprawdzić |
|-----------|-----------------|---------------|
| **Node.js** | 18.x (zalecane 20+) | `node --version` |
| **npm** | 9.x | `npm --version` |
| **Docker** | 20.x | `docker --version` |
| **Docker Compose** | 2.x (plugin `compose`) | `docker compose version` |

> **Windows:** zalecane użycie WSL2 (Ubuntu). Docker Desktop na Windows z
> domyślnymi ustawieniami działa poprawnie.
>
> **macOS:** Docker Desktop lub OrbStack. Node.js najłatwiej zainstalować
> przez [nvm](https://github.com/nvm-sh/nvm) lub
> [Homebrew](https://brew.sh): `brew install node`.

---

## Instalacja od zera

### 1. Zainstaluj Node.js

**Linux / macOS — przez nvm (zalecane):**
```bash
# Zainstaluj nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Otwórz nowy terminal, następnie:
nvm install 20
nvm use 20
node --version   # powinno wypisać v20.x.x
```

**Windows — instalator:**
Pobierz i uruchom instalator ze strony https://nodejs.org (wersja LTS).

---

### 2. Zainstaluj Docker

**Linux (Ubuntu/Debian):**
```bash
# Dodaj oficjalne repozytorium Docker
curl -fsSL https://get.docker.com | sh

# Dodaj siebie do grupy docker (żeby nie pisać sudo)
sudo usermod -aG docker $USER
newgrp docker

# Sprawdź
docker --version
docker compose version
```

**macOS / Windows:** Pobierz
[Docker Desktop](https://www.docker.com/products/docker-desktop/) i zainstaluj.

---

### 3. Sklonuj repozytorium

```bash
git clone https://github.com/ziomson-pl/-air-aplikacja-do-scenariuszy.git
cd -air-aplikacja-do-scenariuszy
```

---

### 4. Uruchom bazę danych

```bash
docker compose up -d
```

To polecenie pobiera obraz PostgreSQL 15 i uruchamia go w tle na porcie `5432`.
Dane są trwałe — przechowywane w wolumenie Dockera.

```bash
docker compose ps   # powinien pokazać status "running"
```

---

### 5. Skonfiguruj i uruchom backend

```bash
cd backend

# Skopiuj przykładowy plik konfiguracyjny
cp .env.example .env

# Zainstaluj zależności Node.js
# UWAGA: Puppeteer pobiera przy tym Chromium (~170 MB) — może chwilę potrwać
npm install

# Utwórz tabele w bazie danych
npx prisma db push

# Uruchom serwer deweloperski
npm run start:dev
```

Serwer powinien wypisać:
```
Backend running on http://localhost:3000
```

> **Chromium / PDF:** Puppeteer automatycznie pobiera przeglądarkę Chromium
> używaną do renderowania PDF-ów. Jeśli chcesz pominąć pobieranie
> (np. środowisko CI bez dostępu do sieci), ustaw zmienną środowiskową
> `PUPPETEER_SKIP_DOWNLOAD=true` przed `npm install`, a następnie wskaż
> systemowy Chrome przez `PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome`.

---

### 6. Uruchom frontend

Otwórz **nowy terminal** (backend musi działać w poprzednim).

```bash
cd frontend

# Zainstaluj zależności
npm install

# Uruchom serwer deweloperski
npm run dev
```

Frontend powinien być dostępny pod adresem:
```
http://localhost:5173
```

---

## Uruchomienie

Po pierwszej instalacji kolejne uruchomienie aplikacji sprowadza się do:

```bash
# Terminal 1 — baza danych (jeśli nie działa)
docker compose up -d

# Terminal 2 — backend
cd backend && npm run start:dev

# Terminal 3 — frontend
cd frontend && npm run dev
```

Otwórz przeglądarkę i wejdź na `http://localhost:5173`.

---

## Jak korzystać z aplikacji

### Tworzenie pierwszego scenariusza

1. Na ekranie startowym wpisz tytuł scenariusza i kliknij **+ Nowy scenariusz**.
2. W edytorze kliknij pole **„Nowa postać…"** w lewym panelu, wpisz imię i naciśnij `+`.
3. Kliknij imię postaci na liście — zostanie podświetlona jako aktywna.
4. Wpisz kwestię w polu na dole ekranu i naciśnij `Enter`.
5. Kwestia pojawi się w scenariuszu z imieniem postaci nad nią.

### Zmiana mówcy

Kliknij dowolną postać w lewym panelu — następna wpisana kwestia będzie jej.
Aktywny mówca jest podświetlony kolorem.

### Didaskalia (Narrator)

Kliknij przycisk **✎ Narrator** lub naciśnij `Alt+0`. Wpisana kwestia pojawi
się jako tekst kursywą wyśrodkowany na stronie, w nawiasach.

### Nagłówki scen

Kliknij przycisk **⌖ Scena** lub naciśnij `Alt+S`. Wpisany tekst (np.
`WNĘTRZE — KUCHNIA — DZIEŃ`) pojawi się jako pogrubiony nagłówek.

### Edycja kwestii

Kliknij dwukrotnie dowolną kwestię w scenariuszu — pole zamieni się w edytor.
Zatwierdź przez `Enter`, anuluj przez `Esc`.

### Zmiana kolejności

Najedź myszą na kwestię — pojawią się strzałki ↑ ↓ z lewej strony.

### Zmiana nazwy i koloru postaci

- **Zmień kolor:** kliknij kolorową kropkę przy imieniu postaci.
- **Zmień nazwę:** kliknij dwukrotnie imię postaci.

### Eksport do PDF

Kliknij **⬇ Eksportuj PDF** w lewym panelu. Plik pobierze się automatycznie
z pełnym formatowaniem scenariuszowym (strona tytułowa, numeracja stron,
poprawne polskie znaki diakrytyczne).

---

## Funkcje

| Funkcja | Opis |
|---------|------|
| Zarządzanie projektami | Tworzenie, zmiana tytułu, usuwanie |
| Postacie | Dowolna liczba, własny kolor (z 10-kolorowej palety), edycja nazwy i koloru |
| Trzy typy kwestii | Dialog (z atrybutowanym imieniem), Narrator (kursywa), Scena (nagłówek) |
| Edycja inline | Podwójne kliknięcie otwiera edycję w miejscu |
| Zmiana kolejności | Przyciski ↑ ↓ przy każdej kwestii, persystowane w bazie |
| Autozapis | Każda zmiana zapisywana automatycznie ze wskaźnikiem stanu |
| Statystyki | Liczba wierszy, słów, scen, udział każdej postaci (pasek) |
| Eksport PDF | Server-side przez Puppeteer; polskie znaki, strona tytułowa, numeracja |
| Powiadomienia | System toastów zamiast blokujących alertów |
| Skróty klawiszowe | Szybki dostęp do postaci i trybów pisania |

---

## Skróty klawiszowe

| Skrót | Działanie |
|-------|-----------|
| `Alt` + `1` … `9` | Wybierz 1.–9. postać z listy |
| `Alt` + `0` | Tryb Narratora |
| `Alt` + `S` | Tryb Sceny |
| `Enter` | Dodaj kwestię (w polu kompozytora) |
| `Shift` + `Enter` | Nowa linia w kwestii (bez wysyłania) |
| `Enter` | Zatwierdź edycję inline |
| `Esc` | Anuluj edycję inline |

---

## Testy

### Backend

```bash
cd backend
npm test              # uruchom wszystkie testy
npm run test:cov      # testy + raport pokrycia kodu
```

Testy obejmują:
- logikę `ProjectsService` (mockowany PrismaClient — nie wymaga bazy)
- generator HTML do PDF (`buildScreenplayHtml`) — escaping, typy kwestii,
  obsługę pustego scenariusza

```
Test Suites: 2 passed
Tests:       23 passed
```

### Frontend

```bash
cd frontend
npm test              # uruchom wszystkie testy (tryb CI, bez watch)
npm run test:watch    # tryb interaktywny (watch)
```

Testy obejmują:
- `editorReducer` — wszystkie akcje, przypadki graniczne
- `Composer` — tryby, warunki blokady, obsługa klawiatury
- `Script` — renderowanie, edycja inline, usuwanie, zmiana kolejności
- `formatRelative`, `pluralPl`, `wordCount` — funkcje formatujące

```
Test Files: 4 passed
Tests:      35 passed
```

---

## Stos technologiczny

| Warstwa | Technologia | Wersja |
|---------|-------------|--------|
| Frontend | React | 18.x |
| Frontend | TypeScript | 5.x |
| Frontend | Vite (bundler) | 5.x |
| Frontend | Vitest + Testing Library | 1.x |
| Backend | NestJS | 10.x |
| Backend | TypeScript | 5.x |
| Backend | Prisma ORM | 5.x |
| Backend | Jest | 29.x |
| Baza danych | PostgreSQL | 15 |
| PDF | Puppeteer | 21.x |
| Konteneryzacja | Docker Compose | 2.x |

---

## Struktura projektu

```
.
├── docker-compose.yml          # PostgreSQL 15
│
├── backend/
│   ├── .env.example            # szablon konfiguracji
│   ├── .env                    # konfiguracja lokalna (nie w git)
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma       # modele: Project, Character, DialogueLine
│   └── src/
│       ├── main.ts             # bootstrap NestJS, CORS, ValidationPipe
│       ├── app.module.ts
│       ├── prisma/             # PrismaService
│       └── projects/
│           ├── projects.controller.ts   # wszystkie endpointy REST
│           ├── projects.service.ts      # logika biznesowa
│           ├── projects.service.spec.ts # testy jednostkowe serwisu
│           ├── pdf.service.ts           # generowanie PDF (Puppeteer)
│           ├── pdf-template.ts          # builder HTML (testowalny)
│           ├── pdf-template.spec.ts     # testy HTML
│           ├── screenplay.constants.ts  # paleta kolorów, typy linii
│           └── dto/                     # walidacja wejścia (class-validator)
│
└── frontend/
    ├── package.json
    ├── vite.config.ts          # Vite + konfiguracja Vitest
    └── src/
        ├── main.tsx
        ├── App.tsx             # ekran startowy, lista projektów
        ├── types.ts            # wszystkie interfejsy TypeScript
        ├── api.ts              # klient axios
        ├── reducer.ts          # editorReducer (useReducer)
        ├── reducer.test.ts     # testy reducera
        ├── styles.css          # system designu (CSS variables)
        ├── hooks/
        │   └── useToasts.ts    # hook dla powiadomień
        ├── utils/
        │   ├── format.ts       # formatRelative, pluralPl, wordCount
        │   └── format.test.ts
        ├── test/
        │   └── setup.ts        # konfiguracja Testing Library
        └── components/
            ├── Editor.tsx      # główny edytor (useReducer + API)
            ├── Sidebar.tsx     # lista postaci, tryby pisania
            ├── Script.tsx      # widok scenariusza (edycja, kolejność)
            ├── Composer.tsx    # pole wprowadzania kwestii
            ├── StatsPanel.tsx  # panel statystyk
            ├── Toasts.tsx      # powiadomienia
            ├── Composer.test.tsx
            └── Script.test.tsx
```

---

## API — lista endpointów

Wszystkie endpointy zwracają i przyjmują JSON. Serwer działa domyślnie
na `http://localhost:3000`.

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| `GET` | `/projects` | Lista projektów (z liczbą kwestii) |
| `POST` | `/projects` | Nowy projekt `{ "title": "..." }` |
| `GET` | `/projects/:id` | Projekt z postaciami i kwestiami |
| `PUT` | `/projects/:id` | Zmiana tytułu `{ "title": "..." }` |
| `DELETE` | `/projects/:id` | Usuń projekt (kaskadowo usuwa postaci i kwestie) |
| `POST` | `/projects/:id/characters` | Nowa postać `{ "name": "...", "color": "#..." }` |
| `PATCH` | `/projects/:id/characters/:charId` | Zmień nazwę/kolor `{ "name"?, "color"? }` |
| `DELETE` | `/projects/:id/characters/:charId` | Usuń postać |
| `POST` | `/projects/:id/lines` | Nowa kwestia `{ "text", "type", "characterId"? }` |
| `PATCH` | `/projects/:id/lines/:lineId` | Edytuj treść `{ "text": "..." }` |
| `PATCH` | `/projects/:id/lines/reorder` | Zmień kolejność `{ "orderedIds": [...] }` |
| `DELETE` | `/projects/:id/lines/:lineId` | Usuń kwestię |
| `GET` | `/projects/:id/export/pdf` | Pobierz scenariusz jako PDF |

**Typy kwestii** (`type`): `"dialogue"` · `"narrator"` · `"scene"`

---

## Rozwiązywanie problemów

### „Cannot connect to Docker daemon"
Upewnij się, że Docker Desktop jest uruchomiony, lub uruchom usługę:
```bash
sudo systemctl start docker   # Linux
```

### Backend nie startuje — błąd połączenia z bazą
1. Sprawdź czy kontener bazy działa: `docker compose ps`
2. Jeśli nie — uruchom: `docker compose up -d`
3. Sprawdź czy port 5432 nie jest zajęty: `lsof -i :5432`

### „P1001: Can't reach database server"
Najprawdopodobniej baza nie zdążyła jeszcze wystartować. Zaczekaj kilka sekund
i spróbuj ponownie. Ewentualnie sprawdź logi:
```bash
docker compose logs postgres
```

### PDF się nie generuje / błąd Puppeteer
Chromium może wymagać dodatkowych bibliotek systemowych na Linuksie:
```bash
# Ubuntu / Debian
sudo apt-get install -y \
  libgbm-dev libnss3 libatk-bridge2.0-0 libdrm2 \
  libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
  libxrandr2 libglib2.0-0 libpango-1.0-0 libcairo2

# Następnie przeinstaluj puppeteer
cd backend && npm install
```

### Port 5173 lub 3000 jest zajęty
Zmień port w `.env` (backend):
```
PORT=3001
```
lub zatrzymaj inny proces: `kill $(lsof -ti :3000)`

### Powolne pierwsze uruchomienie
Puppeteer podczas `npm install` pobiera Chromium (~170 MB). Jest to jednorazowe.
Kolejne instalacje korzystają z cache.

### Jak całkowicie zresetować bazę danych
```bash
docker compose down -v    # -v usuwa też wolumeny (dane!)
docker compose up -d
cd backend && npx prisma db push
```
