# AIR — Aplikacja do Scenariuszy Filmowych

Aplikacja webowa do pisania dialogów filmowych i scenariuszy. Wybierasz postać z
panelu bocznego, wpisujesz kwestię w polu na dole ekranu — aplikacja sama dba
o atrybuację (imię nad kwestią) i układ w stylu profesjonalnego scenariusza.
Projekty zapisują się automatycznie w bazie danych i można je eksportować do
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
> **macOS:** Docker Desktop lub OrbStack. Node.js najlatwiej zainstalować
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
2. Kliknij **+ Dodaj scenę** w lewym panelu i wpisz nagłówek (np. `INT. KUCHNIA — DZIEŃ`).
3. Dodaj pierwszą postać w polu **„Nowa postać…"**.
4. Kliknij imię postaci — zostanie podkreślona jako aktywna.
5. Wpisz kwestię w polu na dole i naciśnij `Enter`.

### Sceny

- Kliknij nagłówek sceny, aby ustawić ją jako aktywną (kwestie są dodawane do aktywnej sceny).
- Podwójne kliknięcie nagłówka otwiera edycję.
- Przycisk **▼/▶** zwija/rozwija scenę.
- Chwyć ikonę **⢿** i przeciągnij, aby zmienić kolejność scen.

### Didaskalia (parenthetical)

W trybie dialogu kliknij przycisk **( )** obok pola kompozytora, aby dodać
didaskalia do kwestii (np. *ironicznie*, *szeptem*).

### Historia zmian

Kliknij ikonę **🕐** przy kwestii, aby zobaczyć poprzednie wersje i przywrócić wybraną.

### Komentarze

Kliknij ikonę **💬** przy kwestii, aby otworzyć panel komentarzy. Można dodawać
komentarze, oznaczać jako rozwiązane i usuwać.

### Import tekstu

Kliknij **↑ Importuj tekst** w panelu bocznym. Wklej scenariusz w formacie:
```
INT. KUCHNIA — DZIEŃ

ANNA: Czy chcesz herbaty?
KAROL: Chętnie, dziękuję.

NARRATOR: Karol siada przy stole.
```

### Eksport

W lewym panelu kliknij:
- **PDF** — pełne formatowanie scenariuszowe z polskimi znakami
- **Fountain** — format `.fountain` kompatybilny z Final Draft / Highland
- **DOCX** — edytowalny dokument Word

---

## Funkcje

| Funkcja | Opis |
|---------|------|
| Sceny jako kontenery | Dialogów są grupowane w scenach (INT./EXT.) |
| Zarządzanie projektami | Tworzenie, zmiana tytułu, usuwanie |
| Postacie | Dowolna liczba, własny kolor, edycja nazwy |
| Didaskalia | Parenthetical przy każdej kwestii dialogowej |
| Historia zmian | Każda edycja kwestii zapisuje poprzednią wersję |
| Komentarze | Panel komentarzy przy każdej kwestii |
| Drag & drop | Zmiana kolejności scen i kwestii przez przeciąganie |
| Edycja inline | Podwójne kliknięcie otwiera edycję w miejscu |
| Autozapis | Każda zmiana zapisywana automatycznie |
| Statystyki | Liczba wierszy, słów, scen, udział każdej postaci |
| Eksport PDF | Server-side przez Puppeteer; polskie znaki, strona tytułowa |
| Eksport Fountain | Format `.fountain` (Final Draft, Highland) |
| Eksport DOCX | Edytowalny dokument Word |
| Import tekstu | Parsowanie formatu IMIĘ: kwestia / INT. nagłówek |
| Skróty klawiszowe | Szybki dostęp do postaci i trybów pisania |

---

## Skróty klawiszowe

| Skrót | Działanie |
|-------|----------|
| `Alt` + `1` … `9` | Wybierz 1.–9. postać z listy |
| `Alt` + `0` | Tryb Narratora |
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

### Frontend

```bash
cd frontend
npm test              # uruchom wszystkie testy (tryb CI, bez watch)
npm run test:watch    # tryb interaktywny (watch)
```

Testy obejmują:
- `editorReducer` — wszystkie akcje, przypadki graniczne
- `Composer` — tryby, warunki blokady, obsługa klawiatury
- `Script` — renderowanie, edycja inline, usuwanie

---

## Stos technologiczny

| Warstwa | Technologia | Wersja |
|---------|-------------|--------|
| Frontend | React | 18.x |
| Frontend | TypeScript | 5.x |
| Frontend | Vite (bundler) | 5.x |
| Frontend | Vitest + Testing Library | 1.x |
| Frontend | @dnd-kit | 6/8.x |
| Backend | NestJS | 10.x |
| Backend | TypeScript | 5.x |
| Backend | Prisma ORM | 5.x |
| Backend | Jest | 29.x |
| Baza danych | PostgreSQL | 15 |
| PDF | Puppeteer | 21.x |
| DOCX | docx | 8.x |
| Konteneryzacja | Docker Compose | 2.x |

---

## Struktura projektu

```
.
├── docker-compose.yml          # PostgreSQL 15
│
├── backend/
│   ├── .env.example            # szablon konfiguracji
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma       # modele: Project, Scene, DialogueLine, Comment, LineVersion
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── prisma/
│       └── projects/
│           ├── projects.controller.ts
│           ├── projects.service.ts
│           ├── projects.service.spec.ts
│           ├── pdf.service.ts
│           ├── pdf-template.ts
│           ├── pdf-template.spec.ts
│           ├── fountain-export.ts
│           ├── docx-export.ts
│           ├── text-import.ts
│           ├── screenplay.constants.ts
│           └── dto/
│
└── frontend/
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── types.ts
        ├── api.ts
        ├── reducer.ts
        ├── reducer.test.ts
        ├── styles.css
        ├── hooks/
        ├── utils/
        └── components/
            ├── Editor.tsx
            ├── Sidebar.tsx
            ├── Script.tsx
            ├── Composer.tsx
            ├── CommentPanel.tsx
            ├── HistoryModal.tsx
            ├── ImportModal.tsx
            ├── StatsPanel.tsx
            ├── Toasts.tsx
            ├── Composer.test.tsx
            └── Script.test.tsx
```

---

## API — lista endpointów

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| `GET` | `/projects` | Lista projektów |
| `POST` | `/projects` | Nowy projekt |
| `GET` | `/projects/:id` | Projekt z scenami i kwestiami |
| `PUT` | `/projects/:id` | Zmiana tytułu |
| `DELETE` | `/projects/:id` | Usuń projekt |
| `POST` | `/projects/:id/characters` | Nowa postać |
| `PATCH` | `/projects/:id/characters/:charId` | Zmień nazwę/kolor |
| `DELETE` | `/projects/:id/characters/:charId` | Usuń postać |
| `POST` | `/projects/:id/scenes` | Nowa scena |
| `PUT` | `/projects/:id/scenes/:sceneId` | Edytuj nagłówek |
| `DELETE` | `/projects/:id/scenes/:sceneId` | Usuń scenę |
| `PATCH` | `/projects/:id/scenes/reorder` | Zmień kolejność scen |
| `POST` | `/projects/:id/scenes/:sceneId/lines` | Nowa kwestia |
| `PATCH` | `/projects/:id/scenes/:sceneId/lines/:lineId` | Edytuj kwestię |
| `DELETE` | `/projects/:id/scenes/:sceneId/lines/:lineId` | Usuń kwestię |
| `PATCH` | `/projects/:id/scenes/:sceneId/lines/reorder` | Zmień kolejność kwestii |
| `GET` | `/projects/:id/lines/:lineId/history` | Historia zmian kwestii |
| `POST` | `/projects/:id/lines/:lineId/comments` | Dodaj komentarz |
| `PATCH` | `/projects/:id/comments/:commentId/resolve` | Oznacz komentarz |
| `DELETE` | `/projects/:id/comments/:commentId` | Usuń komentarz |
| `POST` | `/projects/:id/import` | Importuj tekst |
| `GET` | `/projects/:id/export/pdf` | Eksport PDF |
| `GET` | `/projects/:id/export/fountain` | Eksport Fountain |
| `GET` | `/projects/:id/export/docx` | Eksport DOCX |

---

## Rozwiązywanie problemów

### „Cannot connect to Docker daemon”
Upewnij się, że Docker Desktop jest uruchomiony, lub uruchom usługę:
```bash
sudo systemctl start docker   # Linux
```

### Backend nie startuje — błąd połączenia z bazą
1. Sprawdź czy kontener bazy działa: `docker compose ps`
2. Jeśli nie — uruchom: `docker compose up -d`
3. Sprawdź czy port 5432 nie jest zajęty: `lsof -i :5432`

### PDF się nie generuje / błąd Puppeteer
```bash
# Ubuntu / Debian
sudo apt-get install -y \
  libgbm-dev libnss3 libatk-bridge2.0-0 libdrm2 \
  libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
  libxrandr2 libglib2.0-0 libpango-1.0-0 libcairo2

cd backend && npm install
```

### Jak całkowicie zresetować bazę danych
```bash
docker compose down -v    # -v usuwa też wolumeny (dane!)
docker compose up -d
cd backend && npx prisma db push
```
