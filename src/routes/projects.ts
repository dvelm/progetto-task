import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

// Inizializza il router di Express per gestire le rotte relative ai progetti
const router = Router();

// Inizializza il client di Prisma per interagire con il database
const prisma = new PrismaClient();

// --- Endpoint: Crea un nuovo Progetto ---
// Metodo: POST | Percorso: /api/projects/
router.post('/', async (req, res) => {
  try {
    // Usa Prisma per creare un nuovo record nella tabella Project
    // I dati (name, description, budget, ecc.) vengono presi dal corpo della richiesta (req.body)
    const project = await prisma.project.create({
      data: req.body,
    });
    // Restituisce il progetto appena creato con status 201 (Created)
    res.status(201).json(project);
  } catch (error) {
    // Se c'è un errore (es. dati mancanti o tipo errato), restituisce 400 (Bad Request)
    res.status(400).json({ error: 'Dati non validi' });
  }
});

// --- Endpoint: Ottieni tutti i Progetti ---
// Metodo: GET | Percorso: /api/projects/
router.get('/', async (req, res) => {
  // Recupera tutti i progetti dal database
  const projects = await prisma.project.findMany();
  res.json(projects);
});

// --- Endpoint: Ottieni un Progetto specifico per ID ---
// Metodo: GET | Percorso: /api/projects/:id
router.get('/:id', async (req, res) => {
  // Cerca un progetto il cui ID corrisponda a quello passato nell'URL
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    // Include anche i task associati a questo progetto grazie alla relazione
    include: { tasks: true }
  });

  // Se il progetto esiste lo restituisce, altrimenti errore 404 (Not Found)
  if (project) res.json(project);
  else res.status(404).json({ error: 'Progetto non trovato' });
});

// --- Endpoint: Aggiorna un Progetto ---
// Metodo: PUT | Percorso: /api/projects/:id
router.put('/:id', async (req, res) => {
  try {
    // Aggiorna il progetto con l'ID specificato usando i nuovi dati dal body
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: 'Aggiornamento fallito' });
  }
});

// --- Endpoint: Elimina un Progetto ---
// Metodo: DELETE | Percorso: /api/projects/:id
router.delete('/:id', async (req, res) => {
  try {
    // Elimina il progetto dal database
    await prisma.project.delete({
      where: { id: req.params.id },
    });
    // Restituisce status 204 (No Content) per indicare che l'eliminazione ha avuto successo
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Eliminazione fallita' });
  }
});

// --- Endpoint: Ottieni tutti i task di uno specifico progetto ---
// Metodo: GET | Percorso: /api/projects/:id/tasks
router.get('/:id/tasks', async (req, res) => {
  try {
    // Trova il progetto e include i suoi task (e i tag associati a ciascun task)
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { tasks: { include: { tags: true } } }
    });

    // Se il progetto esiste, restituisce solo l'array dei suoi task
    if (project) res.json(project.tasks);
    else res.status(404).json({ error: 'Progetto non trovato' });
  } catch (error) {
    res.status(400).json({ error: 'Recupero dei task fallito' });
  }
});

export default router;
