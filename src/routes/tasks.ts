import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

// Inizializza il router di Express per gestire le rotte relative ai task
const router = Router();

// Inizializza il client di Prisma per interagire con il database
const prisma = new PrismaClient();

// --- Endpoint: Crea un nuovo Task ---
// Metodo: POST | Percorso: /api/tasks/
router.post('/', async (req, res) => {
  try {
    // Estrae i dati dal corpo della richiesta
    const { title, description, tags, projectIds } = req.body;

    // Crea il task nel database
    const task = await prisma.task.create({
      data: {
        title,
        description,
        // Gestione dei Tag (Relazione Molti-a-Molti)
        tags: {
          // connectOrCreate: Se il tag esiste già lo collega, altrimenti lo crea nuovo
          connectOrCreate: tags?.map((tag: string) => ({
            where: { name: tag },
            create: { name: tag }
          })) || []
        },
        // Gestione dei Progetti (Relazione Molti-a-Molti)
        projects: {
          // connect: Collega il task agli ID dei progetti passati
          connect: projectIds?.map((id: string) => ({ id })) || []
        }
      },
      // Include tag e progetti nella risposta JSON
      include: { tags: true, projects: true }
    });

    // Restituisce il task appena creato con status 201 (Created)
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: 'Dati non validi' });
  }
});

// --- Endpoint: Ottieni tutti i Task (con filtro opzionale per tag) ---
// Metodo: GET | Percorso: /api/tasks/ (oppure /api/tasks?tag=nome_tag)
router.get('/', async (req, res) => {
  // Estrae il parametro 'tag' dalla query string (es. ?tag=frontend)
  const { tag } = req.query;
  try {
    let tasks;
    if (tag) {
      // Se è presente il filtro tag, cerca solo i task che contengono quel tag
      tasks = await prisma.task.findMany({
        where: {
          tags: {
            some: { name: String(tag) }
          }
        },
        include: { tags: true, projects: true }
      });
    } else {
      // Altrimenti, restituisce tutti i task
      tasks = await prisma.task.findMany({
        include: { tags: true, projects: true }
      });
    }
    res.json(tasks);
  } catch (error) {
    res.status(400).json({ error: 'Recupero dei task fallito' });
  }
});

// --- Endpoint: Ottieni un Task specifico per ID ---
// Metodo: GET | Percorso: /api/tasks/:id
router.get('/:id', async (req, res) => {
  // Cerca un task il cui ID corrisponda a quello passato nell'URL
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: { tags: true, projects: true }
  });

  if (task) res.json(task);
  else res.status(404).json({ error: 'Task non trovato' });
});

// --- Endpoint: Aggiorna un Task ---
// Metodo: PUT | Percorso: /api/tasks/:id
router.put('/:id', async (req, res) => {
  try {
    const { title, description, tags, projectIds } = req.body;

    // Prepara l'oggetto con i dati base da aggiornare
    const data: any = { title, description };

    // Se vengono passati nuovi tag, aggiorna la relazione
    if (tags) {
      data.tags = {
        set: [], // Rimuove tutti i collegamenti ai tag precedenti
        connectOrCreate: tags.map((tag: string) => ({
          where: { name: tag },
          create: { name: tag }
        }))
      };
    }

    // Se vengono passati nuovi ID progetto, aggiorna la relazione
    if (projectIds) {
      data.projects = {
        set: projectIds.map((id: string) => ({ id })) // Sostituisce i vecchi collegamenti con i nuovi
      };
    }

    // Esegue l'aggiornamento nel database
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data,
      include: { tags: true, projects: true }
    });
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: 'Aggiornamento fallito' });
  }
});

// --- Endpoint: Elimina un Task ---
// Metodo: DELETE | Percorso: /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    // Elimina il task dal database
    await prisma.task.delete({
      where: { id: req.params.id },
    });
    // Restituisce status 204 (No Content)
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Eliminazione fallita' });
  }
});

export default router;
