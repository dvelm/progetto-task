import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';

async function startServer() {
  // Inizializza l'applicazione Express (il nostro server web)
  const app = express();
  
  // Imposta la porta su cui il server ascolterà le richieste
  const PORT = 3000;

  // Abilita CORS per permettere richieste da domini diversi (utile in sviluppo)
  app.use(cors());
  
  // Middleware per fare il parsing automatico del body delle richieste in formato JSON
  app.use(express.json());

  // --- Definizione delle API Routes ---
  // Collega i router specifici per gestire i progetti e i task
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);

  // --- Configurazione Frontend (React + Vite) ---
  // Se siamo in ambiente di sviluppo, usiamo Vite come middleware
  // Questo permette di avere l'Hot Module Replacement (HMR) senza avviare due server separati
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa', // Single Page Application
    });
    app.use(vite.middlewares);
  } else {
    // In produzione, serviamo i file statici generati dalla build di React (cartella 'dist')
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Per qualsiasi altra rotta non API, restituiamo l'index.html di React
    // Questo permette a React Router di gestire la navigazione lato client
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Avvia il server in ascolto sulla porta specificata
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Esegue la funzione di avvio
startServer();
