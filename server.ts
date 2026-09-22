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

    // Deduplicate and backfill branch_id in share_capital_accounts
    if (currentData.share_capital_accounts && currentData.share_capital_accounts.length > 0) {
      const memberMap = new Map((currentData.members || []).map(m => [m.id, m]));
      let scaUpdated = false;
      const seenMembers = new Map<string, any>();
      const deduped: any[] = [];

      for (const sca of currentData.share_capital_accounts) {
        const mem = memberMap.get(sca.member_id);
        if (!sca.branch_id && mem?.branch_id) {
          sca.branch_id = mem.branch_id;
          scaUpdated = true;
        }
        if (!sca.member_name && mem) {
          sca.member_name = `${mem.first_name} ${mem.last_name}`;
          scaUpdated = true;
        }
        if (!sca.par_value) {
          sca.par_value = 100;
          scaUpdated = true;
        }

        if (seenMembers.has(sca.member_id)) {
          // Merge duplicate account into canonical one
          const existing = seenMembers.get(sca.member_id);
          existing.paid_up_shares = (existing.paid_up_shares || 0) + (sca.paid_up_shares || 0);
          existing.paid_up_amount = (existing.paid_up_amount || 0) + (sca.paid_up_amount || 0);
          existing.subscribed_shares = Math.max(existing.subscribed_shares || 0, sca.subscribed_shares || 0);
          existing.subscribed_amount = Math.max(existing.subscribed_amount || 0, sca.subscribed_amount || 0);
          scaUpdated = true;
        } else {
          seenMembers.set(sca.member_id, sca);
          deduped.push(sca);
        }
      }

      if (scaUpdated || deduped.length !== currentData.share_capital_accounts.length) {
        currentData.share_capital_accounts = deduped;
        db.save();
      }
    }

    // Initialize share_capital_settings if missing
    if (!currentData.share_capital_settings || currentData.share_capital_settings.length === 0) {
      currentData.share_capital_settings = [
        {
          id: 'sc_setting_01',
          cooperative_id: 'coop_01',
          par_value_per_share: 100.0,
          min_subscription_shares: 100,
          min_paid_up_shares: 25,
          max_share_holding_percentage: 10.0,
          transfer_fee: 100.0,
          withdrawal_rule: 'Subject to Board approval and 30-day prior written notice',
          accounting_account_id: 'acc_3110'
        }
      ];
      db.save();
    }

    // Initialize sample loan_applications if empty
    if (!currentData.loan_applications || currentData.loan_applications.length === 0) {
      currentData.loan_applications = [
        {
          id: 'app_seed_01',
          application_no: 'APP-2026-0001',
          member_id: 'mem_02',
          loan_product_id: 'lp_regular',
          branch_id: 'branch_tar',
          applied_amount: 25000,
          term_months: 12,
          purpose: 'Working capital and seasonal corn fertilizer procurement',
          status: 'Pending',
          submitted_date: '2026-02-18',
          reviewed_by: null,
          reviewed_date: null,
          approved_amount: null,
          remarks: null,
          created_at: '2026-02-18T08:30:00.000Z'
        },
        {
          id: 'app_seed_02',
          application_no: 'APP-2026-0002',
          member_id: 'mem_03',
          loan_product_id: 'lp_agri',
          branch_id: 'branch_tar',
          applied_amount: 50000,
          term_months: 12,
          purpose: 'Solar drip irrigation system expansion',
          status: 'Approved',
          submitted_date: '2026-02-15',
          reviewed_by: 'Credit Committee (Maria Ramos)',
          reviewed_date: '2026-02-17',
          approved_amount: 50000,
          remarks: 'Approved by Credit Committee subject to standard CBU pledge verification',
          created_at: '2026-02-15T10:15:00.000Z'
        },
        {
          id: 'app_seed_03',
          application_no: 'APP-2026-0003',
          member_id: 'mem_04',
          loan_product_id: 'lp_emergency',
          branch_id: 'branch_vic',
          applied_amount: 15000,
          term_months: 6,
          purpose: 'Emergency medical assistance and hospital medication',
          status: 'Pending',
          submitted_date: '2026-02-19',
          reviewed_by: null,
          reviewed_date: null,
          approved_amount: null,
          remarks: null,
          created_at: '2026-02-19T09:00:00.000Z'
        },
        {
          id: 'app_seed_04',
          application_no: 'APP-2026-0004',
          member_id: 'mem_01',
          loan_product_id: 'lp_regular',
          branch_id: 'branch_tar',
          applied_amount: 30000,
          term_months: 12,
          purpose: 'Cooperative store merchandise restocking',
          status: 'Released',
          submitted_date: '2026-01-10',
          reviewed_by: 'Administrator',
          reviewed_date: '2026-01-12',
          approved_amount: 30000,
          remarks: 'Disbursed into active loan LN-2026-0001',
          created_at: '2026-01-10T14:20:00.000Z'
        }
      ];
      db.save();
    }

    // Seed baseline compliance audit trails if empty
    if (!currentData.configuration_audit_trails || currentData.configuration_audit_trails.length === 0) {
      currentData.configuration_audit_trails = [
        {
          id: 'audit_01',
          setting: 'System Setup & Multi-Branch Topology',
          old_value: 'Unconfigured',
          new_value: 'Multi-Branch Active (Tarlac Main & Victoria Branch)',
          changed_by: 'System Administrator',
          created_at: '2026-01-01T08:00:00.000Z',
          reason: 'Initial setup of cooperative organizational hierarchy per CDA Charter'
        },
        {
          id: 'audit_02',
          setting: 'Chart of Accounts (CDA Standard)',
          old_value: 'Empty GL',
          new_value: 'Standard CDA Chart of Accounts (Assets, Liabilities, Equity, Revenue, Expenses)',
          changed_by: 'Chief Accountant',
          created_at: '2026-01-01T08:30:00.000Z',
          reason: 'Loaded standard CDA compliant account codes and statutory reserve ledgers'
        },
        {
          id: 'audit_03',
          setting: 'Share Capital Policy (CBU)',
          old_value: 'None',
          new_value: 'Par Value: ₱100.00/share, Min Subscription: 100 shares, Min Paid-Up: 25 shares',
          changed_by: 'Board of Directors',
          created_at: '2026-01-02T10:00:00.000Z',
          reason: 'Ratified Share Capital rules under RA 9520 regulations'
        },
        {
          id: 'audit_04',
          setting: 'Loan Product: Regular Multi-Purpose',
          old_value: 'Draft',
          new_value: '12.0% APR Diminishing Balance, 2.0% Processing Fee',
          changed_by: 'Credit Committee',
          created_at: '2026-01-03T11:00:00.000Z',
          reason: 'Established lending parameters and automatic amortization schedules'
        },
        {
          id: 'audit_05',
          setting: 'Cash Vault Float Allocation',
          old_value: '₱0.00',
          new_value: '₱500,000.00 Main Vault Float',
          changed_by: 'Treasurer',
          created_at: '2026-01-03T14:00:00.000Z',
          reason: 'Approved initial cash drawer reserve for disbursements and branch teller operations'
        },
        {
          id: 'audit_06',
          setting: 'Loan Application Approved: APP-2026-0002',
          old_value: 'Pending (₱50,000)',
          new_value: 'Approved (₱50,000)',
          changed_by: 'Credit Committee (Maria Ramos)',
          created_at: '2026-02-17T11:20:00.000Z',
          reason: 'Approved for Pedro Reyes for solar drip irrigation pump installation'
        }
      ];
      db.save();
    }
  }
} catch (dbErr) {
  console.error('[server] Error during database initialization:', dbErr);
}

// Mount API routes
app.use('/api', apiRouter);

// Support direct seeder paths when called without /api prefix
app.use('/database', (req, res, next) => {
  req.url = '/database' + req.url;
  apiRouter(req, res, next);
});

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
