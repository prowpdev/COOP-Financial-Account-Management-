import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db/database';
import { initialSeedData } from './server/db/seed';
import apiRouter from './server/routes/api';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize seed database if empty
const currentData = db.load();
if (!currentData.cooperatives || currentData.cooperatives.length === 0) {
  console.log('Bootstrapping initial cooperative seed database...');
  db.resetToSeed(initialSeedData);
}

// Mount API routes
app.use('/api', apiRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    cooperative: 'Mayap Care Agriculture Cooperative',
    architecture: 'Configuration-Driven Full-Stack Engine',
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CoopFlex Core Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
