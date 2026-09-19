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
try {
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
    // Synchronize fees with defaults
    if (currentData.fees) {
      let feesUpdated = false;
      currentData.fees = currentData.fees.map(f => {
        const fixed_amount = f.fixed_amount !== undefined ? f.fixed_amount : (f.amount !== undefined ? Number(f.amount) : 0);
        const percentage = f.percentage !== undefined ? f.percentage : (f.rate !== undefined ? Number(f.rate) : 0);
        if (f.fixed_amount === undefined || f.percentage === undefined) {
          feesUpdated = true;
        }
        return {
          ...f,
          fixed_amount,
          percentage
        };
      });
      if (feesUpdated) {
        db.save();
      }
    }
    if (coaUpdated) {
      db.save();
    }
  }
} catch (dbErr) {
  console.error('[server] Error during database initialization:', dbErr);
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

  const listenWithRetry = (retries = 10, delayMs = 500) => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`CoopFlex Core Server running on http://0.0.0.0:${PORT}`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE' && retries > 0) {
        console.warn(`[server] Port ${PORT} in use, retrying in ${delayMs}ms (${retries} retries left)...`);
        setTimeout(() => {
          server.close();
          listenWithRetry(retries - 1, delayMs);
        }, delayMs);
      } else {
        console.error('[server] Fatal listen error:', err);
        process.exit(1);
      }
    });

    const handleShutdown = (signal: string) => {
      console.log(`[server] ${signal} signal received: closing HTTP server...`);
      server.close(() => {
        console.log('[server] HTTP server closed cleanly.');
        process.exit(0);
      });
      setTimeout(() => {
        console.warn('[server] Forcing shutdown after timeout.');
        process.exit(0);
      }, 3000).unref();
    };

    process.once('SIGTERM', () => handleShutdown('SIGTERM'));
    process.once('SIGINT', () => handleShutdown('SIGINT'));
  };

  listenWithRetry();
}

process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[server] Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
