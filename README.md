# Project & Task Management API

Una REST API per la gestione di Progetti e Task, sviluppata come coding task per la posizione di Junior Founding Software Engineer.

## 🎯 A cosa serve e Casi d'Uso

Questa applicazione è uno strumento full-stack progettato per organizzare il lavoro, monitorare i progressi e gestire le risorse in modo efficiente. Serve come hub centrale per tenere traccia di progetti complessi e delle singole attività (task) che li compongono.

**Casi d'uso principali:**
- **Gestione del Lavoro Personale o di Team**: Creare liste di attività strutturate, assegnando i task a progetti specifici per mantenere l'ordine operativo.
- **Monitoraggio del Budget e delle Ore**: Tenere traccia del budget allocato per un progetto e delle ore di lavoro effettivamente consumate (`hours_used`), utile per freelance o agenzie.
- **Organizzazione tramite Tag**: Categorizzare i task trasversalmente ai progetti utilizzando i tag (es. "frontend", "bug", "urgente"). Questo permette di filtrare rapidamente tutte le attività relative a un contesto specifico.
- **Pianificazione Flessibile**: Grazie alla relazione molti-a-molti, un singolo task può essere associato a più progetti contemporaneamente, evitando duplicazioni e mantenendo la coerenza dei dati.

## 🚀 Tech Stack
- **Backend**: Node.js con TypeScript ed Express
- **Frontend**: React con Vite e Tailwind CSS (Bonus)
- **ORM**: Prisma
- **Database**: **PostgreSQL** (Neon serverless) - Migrato da SQLite per deployment serverless
- **Containerizzazione**: Docker & Docker Compose

## 🛠️ Setup e Avvio (Locale)

### Opzione 1: Con PostgreSQL (Consigliato)

1. **Installa i dipendenze:**
   ```bash
   npm install
   ```

2. **Configura il database:**
   - Crea un file `.env` nella root del progetto
   - Aggiungi il connection string di Neon PostgreSQL:
     ```env
     DATABASE_URL="postgresql://user:password@host.neon.tech/neondb?sslmode=require"
     ```

3. **Genera Prisma Client:**
   ```bash
   npx prisma generate
   ```

4. **Esegui le migration:**
   ```bash
   npx prisma migrate deploy
   ```

5. **Avvia il server:**
   ```bash
   npm run dev
   ```

6. **L'API sarà disponibile su:** `http://localhost:3000`

### Opzione 2: Con Docker

1. Clona il repository.
2. Esegui il seguente comando nella root del progetto:
   ```bash
   docker-compose up --build
   ```
3. L'API (e la Dashboard UI) sarà disponibile all'indirizzo `http://localhost:3000`.

## 🌍 Deploy

### Vercel + Neon (Consigliato)

Il progetto è ora compatibile con Vercel grazie alla migrazione a PostgreSQL!

1. **Crea database su Neon:**
   - Vai su https://neon.tech
   - Signup con GitHub
   - Crea nuovo progetto e copia il connection string

2. **Deploy su Vercel:**
   - Vai su https://vercel.com
   - Importa il repository da GitHub
   - Aggiungi environment variable `DATABASE_URL` con il connection string di Neon
   - Clicca "Deploy"

3. **Il tuo API sarà live su:** `https://your-app.vercel.app`

**Vantaggi:**
- ✅ Deploy automatico ad ogni push
- ✅ HTTPS automatico
- ✅ Zero configurazione server

### Render.com (Alternativa con Docker)

1. Collega il tuo repository GitHub a Render.com creando un nuovo "Web Service".
2. Scegli l'ambiente "Docker".
3. **Importante:** Usa PostgreSQL invece di SQLite per evitare di configurare dischi persistenti.

## 📖 Documentazione del Codice

Tutto il codice sorgente (Backend, Frontend, Prisma, Docker) è stato **ampiamente commentato in italiano** riga per riga per spiegare chiaramente la logica, le scelte implementative e il funzionamento delle relazioni nel database.

## 📚 Endpoint API

### Progetti (Projects)
- `GET /api/projects` - Ottieni tutti i progetti
- `GET /api/projects/:id` - Ottieni un progetto specifico
- `POST /api/projects` - Crea un nuovo progetto
  - Body: `{ "name": "Progetto A", "budget": 1000, "description": "Descrizione", "hours_used": 10 }`
- `PUT /api/projects/:id` - Aggiorna un progetto
- `DELETE /api/projects/:id` - Elimina un progetto
- `GET /api/projects/:id/tasks` - **Ottieni tutti i task di uno specifico progetto**

### Task
- `GET /api/tasks` - Ottieni tutti i task
- `GET /api/tasks?tag=nome_tag` - **Ottieni tutti i task che contengono uno specifico tag**
- `GET /api/tasks/:id` - Ottieni un task specifico
- `POST /api/tasks` - Crea un nuovo task
  - Body: `{ "title": "Task 1", "description": "Descrizione", "tags": ["frontend", "react"], "projectIds": ["project_id_1", "project_id_2"] }`
  - **Nota:** `projectIds` ora usa String ID (cuid) invece di numeri
- `PUT /api/tasks/:id` - Aggiorna un task
- `DELETE /api/tasks/:id` - Elimina un task

## 🧠 Decisioni Architetturali e Assunzioni

1. **TypeScript + Express**: Scelto per garantire type-safety e robustezza. TypeScript era esplicitamente suggerito nella traccia ed è lo standard de-facto per applicazioni Node.js moderne.

2. **PostgreSQL (Neon)**: Migrato da SQLite a PostgreSQL per:
   - ✅ Deployment serverless su Vercel
   - ✅ Maggiore scalabilità e performance
   - ✅ Tier disponibile senza configurazione iniziale
   - ✅ Nessuna configurazione di dischi persistenti necessaria
   - ✅ Migrazione semplice con Prisma ORM

3. **ID String (cuid)**: Usiamo `cuid()` invece di autoincrement per:
   - ✅ Compatibilità con database distribuiti
   - ✅ ID univoci globali
   - ✅ Migliore sicurezza (non sequenziali)

4. **Gestione dei Tag (Normalizzazione)**: La traccia richiedeva che i tag fossero una "lista di stringhe". Lavorando con un database SQL, salvare un array nativo non è supportato e rende inefficiente la ricerca (es. "trova tutti i task con il tag X"). Ho quindi deciso di **normalizzare** il database creando un'entità `Tag` separata con una relazione molti-a-molti con i `Task`. Questa è la soluzione relazionale ottimale.

   *Esempio di cosa NON fare (Lista in singola cella, lento da filtrare):*
   | Task ID | Titolo | Tag (Testo) |
   |---|---|---|
   | 1 | Fix login | "bug, frontend" |

   *La mia soluzione (Tabelle normalizzate collegate tramite ID):*
   **Tabella Task**
   | ID | Titolo |
   |---|---|
   | 1 | Fix login |

   **Tabella Tag**
   | ID | Nome |
   |---|---|
   | 1 | bug |
   | 2 | frontend |

   **Tabella di Join (Task_Tag)**
   | Task_ID | Tag_ID |
   |---|---|
   | 1 | 1 |
   | 1 | 2 |
   *(Questa struttura rende la ricerca per tag istantanea e scalabile).*

5. **Relazione Many-to-Many**: Un task può appartenere a più progetti e viceversa. Prisma gestisce automaticamente le tabelle di join (sia per Progetti-Task che per Task-Tag) sotto il cofano, mantenendo il codice pulito.

6. **Full-Stack Approach (Bonus)**: Oltre all'API, è stata inclusa una semplice dashboard in React per testare visivamente le funzionalità.

## 🤖 Uso dell'LLM (Coding Agent)

Come menzionato nei requisiti, ho utilizzato un LLM come assistente (pair-programmer) durante lo sviluppo. L'LLM è stato fondamentale per velocizzare la scrittura del boilerplate (es. configurazione di Express, Dockerfile, setup di React). Tuttavia, le decisioni architetturali chiave sono state prese in modo consapevole:

- **Migrazione a PostgreSQL**: Ho migrato da SQLite a PostgreSQL per abilitare il deployment gratuito su Vercel senza bisogno di dischi persistenti.
- **Normalizzazione dei Tag**: Ho evitato di usare un semplice campo JSON/String per i tag, imponendo un vero modello relazionale per rispettare le best practice SQL e rendere l'endpoint di filtraggio per tag altamente efficiente.
- **ID String (cuid)**: Scelta architetturale per compatibilità con database distribuiti e serverless.

## 📝 Note sulla Migrazione (2026-03-25)

Il progetto è stato migrato con successo da SQLite a PostgreSQL (Neon) il 25 Marzo 2026.

**Cosa è cambiato:**
- Database: SQLite → PostgreSQL (Neon serverless)
- ID: `Int autoincrement` → `String cuid()`
- Deployment: Render.com (disco persistente) → Vercel (serverless)
- Performance: Migliorate le query con indici e connessioni multiple

**Per migrare il tuo database locale:**
```bash
# 1. Crea .env con DATABASE_URL di Neon
# 2. Aggiorna prisma/schema.prisma (provider: postgresql)
# 3. Genera migration
npx prisma migrate dev --name init_postgres

# 4. Applica a Neon
npx prisma migrate deploy
```

Per una guida completa, vedi `explanation.txt` nella root del progetto.
