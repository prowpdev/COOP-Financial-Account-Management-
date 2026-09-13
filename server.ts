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
} else {
  // Synchronize chart_of_accounts with SQL baseline schema definitions
  const seedCoaMap = new Map(initialSeedData.chart_of_accounts.map(a => [a.id, a]));
  let coaUpdated = false;
  currentData.chart_of_accounts = (currentData.chart_of_accounts || []).map(a => {
    const seed = seedCoaMap.get(a.id);
    if (seed) {
      coaUpdated = true;
      return {
        ...seed,
        ...a,
        account_code: a.account_code || seed.account_code || a.code,
        category: seed.category || a.category,
        report_group: a.report_group || seed.report_group,
        description: a.description || seed.description,
        parent_account_id: a.parent_account_id !== undefined ? a.parent_account_id : seed.parent_account_id,
        is_active: a.is_active !== undefined ? a.is_active : (a.active !== undefined ? a.active : seed.is_active)
      };
    }
    return {
      ...a,
      account_code: a.account_code || a.code,
      report_group: a.report_group || (a.category === 'Asset' ? 'Current Assets' : a.category === 'Liability' ? 'Current Liabilities' : a.category),
      category: a.category || a.type || 'Asset',
      description: a.description || '',
      is_active: a.is_active !== undefined ? a.is_active : (a.active !== undefined ? a.active : true)
    };
  });
  if (coaUpdated) {
    db.save();
  }
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
