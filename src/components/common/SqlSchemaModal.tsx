import React, { useState } from 'react';
import {
  Database,
  Download,
  Copy,
  Check,
  X,
  Code,
  FileText,
  Layers,
  Server,
  Terminal,
  FolderArchive,
  ChevronRight
} from 'lucide-react';

interface SqlSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlSchemaModal: React.FC<SqlSchemaModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'controllers' | 'models' | 'sql' | 'run' | 'endpoints'>('controllers');
  const [selectedFile, setSelectedFile] = useState<string>('MemberController.php');
  const [selectedModel, setSelectedModel] = useState<string>('MemberRepository.php');
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownloadZip = () => {
    const link = document.createElement('a');
    link.href = '/backend-php.zip';
    link.download = 'backend-php.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSql = () => {
    const link = document.createElement('a');
    link.href = '/cooperative_db.sql';
    link.download = 'cooperative_db.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const controllerSnippets: Record<string, string> = {
    'HomeController.php': `<?php

declare(strict_types=1);

namespace App\Controllers;

use PDO;

class HomeController extends BaseController
{
    public function __construct(
        PDO $db
    ) {
        parent::__construct($db);
    }

    public function test(): never
    {
        $this->json(['success']);
    }

    public function index(): never
    {
        $this->json([
            'status'     => 'online',
            'system'     => 'Mayap Care Agriculture Cooperative API',
            'version'    => '1.0.0',
            'database'   => 'connected',
            'timestamp'  => date('c')
        ]);
    }
}`,
    'BaseController.php': `<?php

declare(strict_types=1);

namespace App\Controllers;

use PDO;

abstract class BaseController
{
    public function __construct(
        protected PDO $db
    ) {
    }

    public function json(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit;
    }

    protected function success(mixed $data = null, string $message = 'Success', int $status = 200): never
    {
        $this->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $status);
    }

    protected function error(string $message = 'Error', int $status = 400, mixed $details = null): never
    {
        $this->json([
            'success' => false,
            'error'   => $message,
            'details' => $details,
        ], $status);
    }

    protected function getRequestBody(): array
    {
        $raw = file_get_contents('php://input');
        return !empty($raw) && is_array($decoded = json_decode($raw, true)) ? $decoded : [];
    }

    protected function getQuery(string $key, mixed $default = null): mixed
    {
        return $_GET[$key] ?? $default;
    }
}`,
    'MemberController.php': `<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\MemberRepository;
use PDO;

class MemberController extends BaseController
{
    private MemberRepository $members;

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->members = new MemberRepository($db);
    }

    public function index(): never
    {
        $branchId = $this->getQuery('branchId');
        $status   = $this->getQuery('status');
        $search   = $this->getQuery('search');

        $result = $this->members->all($branchId, $status, $search);
        $this->json([
            'success' => true,
            'data'    => $result,
            'total'   => count($result)
        ]);
    }

    public function show(string $id): never
    {
        $member = $this->members->find($id);
        if (!$member) {
            $this->error('Member not found', 404);
        }
        $this->success($member);
    }

    public function store(): never
    {
        $input = $this->getRequestBody();
        if (empty($input['first_name']) || empty($input['last_name'])) {
            $this->error('First name and last name are required.', 422);
        }
        $created = $this->members->create($input);
        $this->success($created, 'Member registered successfully.', 201);
    }

    public function update(string $id): never
    {
        $input = $this->getRequestBody();
        $updated = $this->members->update($id, $input);
        $this->success($updated, 'Member updated successfully.');
    }

    public function destroy(string $id): never
    {
        $this->members->delete($id);
        $this->success(['id' => $id], 'Member deleted successfully.');
    }
}`,
    'LoanController.php': `<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\LoanRepository;
use PDO;

class LoanController extends BaseController
{
    private LoanRepository $loans;

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->loans = new LoanRepository($db);
    }

    public function index(): never
    {
        $branchId = $this->getQuery('branchId');
        $status   = $this->getQuery('status');
        $memberId = $this->getQuery('memberId');

        $result = $this->loans->all($branchId, $status, $memberId);
        $this->json(['success' => true, 'data' => $result]);
    }

    public function schedule(string $id): never
    {
        $schedule = $this->loans->getSchedule($id);
        $this->success($schedule);
    }

    public function store(): never
    {
        $input = $this->getRequestBody();
        $loan = $this->loans->createLoan($input);
        $this->success($loan, 'Loan disbursed successfully.', 201);
    }

    public function payment(): never
    {
        $input = $this->getRequestBody();
        $receipt = $this->loans->recordPayment($input);
        $this->success($receipt, 'Loan payment recorded and allocated.');
    }
}`,
    'AccountingController.php': `<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\AccountingRepository;
use PDO;

class AccountingController extends BaseController
{
    private AccountingRepository $accounting;

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->accounting = new AccountingRepository($db);
    }

    public function chart(): never
    {
        $this->success($this->accounting->getChartOfAccounts());
    }

    public function journals(): never
    {
        $entries = $this->accounting->getJournalEntries(
            $this->getQuery('branchId'),
            $this->getQuery('startDate'),
            $this->getQuery('endDate')
        );
        $this->json(['success' => true, 'data' => $entries]);
    }

    public function storeJournal(): never
    {
        $input = $this->getRequestBody();
        $entry = $this->accounting->createJournalEntry($input);
        $this->success($entry, 'Journal entry posted successfully.', 201);
    }

    public function reverseJournal(string $id): never
    {
        $reversal = $this->accounting->reverseJournalEntry($id);
        $this->success($reversal, 'Journal entry reversed.');
    }
}`
  };

  const modelSnippets: Record<string, string> = {
    'MemberRepository.php': `<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class MemberRepository
{
    public function __construct(private PDO $db)
    {
    }

    public function all(?string $branchId = null, ?string $status = null, ?string $search = null): array
    {
        $sql = "SELECT m.*, b.name AS branch_name, mt.name AS member_type_name
                FROM members m
                LEFT JOIN branches b ON m.branch_id = b.id
                LEFT JOIN member_types mt ON m.member_type_id = mt.id
                WHERE 1=1";
        $params = [];

        if ($branchId && $branchId !== 'all') {
            $sql .= " AND m.branch_id = :branch_id";
            $params['branch_id'] = $branchId;
        }
        if ($status && $status !== 'all') {
            $sql .= " AND m.status = :status";
            $params['status'] = $status;
        }
        if ($search) {
            $sql .= " AND (m.first_name LIKE :s OR m.last_name LIKE :s OR m.member_no LIKE :s)";
            $params['s'] = "%$search%";
        }

        $sql .= " ORDER BY m.created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function find(string $id): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM members WHERE id = ? OR member_no = ? LIMIT 1");
        $stmt->execute([$id, $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function delete(string $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM members WHERE id = ?');
        return $stmt->execute([$id]);
    }
}`,
    'LoanRepository.php': `<?php

declare(strict_types=1);

namespace App\Models;

use App\Services\AmortizationService;
use PDO;

class LoanRepository
{
    public function __construct(private PDO $db)
    {
    }

    public function all(?string $branchId = null, ?string $status = null, ?string $memberId = null): array
    {
        $sql = "SELECT l.*, CONCAT(m.first_name, ' ', m.last_name) AS member_name, lp.name AS product_name
                FROM loans l
                JOIN members m ON l.member_id = m.id
                JOIN loan_products lp ON l.loan_product_id = lp.id
                WHERE 1=1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getSchedule(string $loanId): array
    {
        $stmt = $this->db->prepare("SELECT * FROM loan_amortization_schedules WHERE loan_id = ? ORDER BY installment_no ASC");
        $stmt->execute([$loanId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function delete(string $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM loans WHERE id = ?');
        return $stmt->execute([$id]);
    }
}`,
    'SavingsRepository.php': `<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class SavingsRepository
{
    public function __construct(private PDO $db)
    {
    }

    public function all(?string $branchId = null, ?string $memberId = null): array
    {
        $sql = "SELECT sa.*, CONCAT(m.first_name, ' ', m.last_name) AS member_name, sp.name AS product_name
                FROM savings_accounts sa
                JOIN members m ON sa.member_id = m.id
                JOIN savings_products sp ON sa.savings_product_id = sp.id
                WHERE 1=1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function delete(string $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM savings_accounts WHERE id = ?');
        return $stmt->execute([$id]);
    }
}`,
    'AccountingRepository.php': `<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class AccountingRepository
{
    public function __construct(private PDO $db)
    {
    }

    public function getChartOfAccounts(): array
    {
        $stmt = $this->db->query("SELECT * FROM chart_of_accounts ORDER BY account_code ASC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getJournalEntries(?string $branchId = null, ?string $startDate = null, ?string $endDate = null): array
    {
        $stmt = $this->db->query("SELECT * FROM journal_entries ORDER BY posting_date DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function delete(string $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM journal_entries WHERE id = ?');
        return $stmt->execute([$id]);
    }
}`
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  PHP MVC Backend Codebase &amp; SQL Database
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  PHP 8.1+ &bull; Clean Baseline
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Full-featured MVC Controllers, Models/Repositories, Routing, and MySQL Database
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadZip}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition cursor-pointer"
              title="Download entire PHP MVC project as ZIP (Controllers, Models, Routes, SQL)"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Download PHP MVC (ZIP)</span>
            </button>
            <button
              onClick={handleDownloadSql}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
              title="Download cooperative_db.sql"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .SQL</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('controllers')}
            className={`flex items-center space-x-2 py-3 px-3 text-xs font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'controllers'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Controllers (BaseController, Home, etc.)</span>
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`flex items-center space-x-2 py-3 px-3 text-xs font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'models'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Models &amp; Repositories</span>
          </button>
          <button
            onClick={() => setActiveTab('run')}
            className={`flex items-center space-x-2 py-3 px-3 text-xs font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'run'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>How to Run (Laragon / PHP CLI)</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center space-x-2 py-3 px-3 text-xs font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'sql'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Database SQL Schema</span>
          </button>
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`flex items-center space-x-2 py-3 px-3 text-xs font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'endpoints'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>API Route Mapping</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'controllers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2 overflow-x-auto pb-1">
                  {Object.keys(controllerSnippets).map(name => (
                    <button
                      key={name}
                      onClick={() => setSelectedFile(name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                        selectedFile === name
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleCopyCode(controllerSnippets[selectedFile])}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 cursor-pointer shrink-0 ml-2"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[480px]">
                <pre className="whitespace-pre leading-relaxed">{controllerSnippets[selectedFile]}</pre>
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2 overflow-x-auto pb-1">
                  {Object.keys(modelSnippets).map(name => (
                    <button
                      key={name}
                      onClick={() => setSelectedModel(name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                        selectedModel === name
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleCopyCode(modelSnippets[selectedModel])}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 cursor-pointer shrink-0 ml-2"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[480px]">
                <pre className="whitespace-pre leading-relaxed">{modelSnippets[selectedModel]}</pre>
              </div>
            </div>
          )}

          {activeTab === 'run' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-emerald-300 text-sm">Download Ready Package</h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Includes all 9 Controllers, 9 Models/Repositories, Amortization engine, router, SQL dump, and autoloader.
                  </p>
                </div>
                <button
                  onClick={handleDownloadZip}
                  className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer shadow"
                >
                  <FolderArchive className="w-4 h-4" />
                  <span>Download backend-php.zip</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Option 1: PHP Built-in Server</span>
                  </span>
                  <p className="text-slate-400 text-[11px]">
                    Zero setup required. Run directly from the extracted project root:
                  </p>
                  <pre className="bg-slate-900 p-3 rounded-lg text-[11px] font-mono text-emerald-300">
{`cd backend-php
php -S localhost:8000 -t public`}
                  </pre>
                  <p className="text-slate-400 text-[11px]">
                    Then set the endpoint in this app's header to: <code className="text-white">http://localhost:8000/api</code>
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Server className="w-4 h-4 text-blue-400" />
                    <span>Option 2: Laragon / Apache VirtualHost</span>
                  </span>
                  <p className="text-slate-400 text-[11px]">
                    Map domain <code className="text-white">cooperative-api.test</code>:
                  </p>
                  <pre className="bg-slate-900 p-3 rounded-lg text-[11px] font-mono text-blue-300">
{`# VirtualHost DocumentRoot
DocumentRoot "C:/laragon/www/backend-php/public"
ServerName cooperative-api.test`}
                  </pre>
                  <p className="text-slate-400 text-[11px]">
                    URL Rewriting is already configured in <code className="text-white">public/.htaccess</code>.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
                  <Database className="w-4 h-4" />
                  <span>Step 3: Database Import</span>
                </span>
                <pre className="bg-slate-900 p-3 rounded-lg text-[11px] font-mono text-slate-300">
{`mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cooperative_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p cooperative_db < database/cooperative_db.sql`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 text-xs">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-mono text-slate-300">
                    mysql -u root -p cooperative_db &lt; cooperative_db.sql
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  Database: <strong className="text-white">cooperative_db</strong> (utf8mb4)
                </span>
              </div>

              <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px]">
                <pre className="text-slate-300 leading-relaxed whitespace-pre font-mono text-[11px]">
{`-- =====================================================================
-- MAYAP CARE AGRICULTURE COOPERATIVE
-- PRODUCTION-READY SQL SCHEMA FOR PHP MVC BACKEND ARCHITECTURE
-- Database: cooperative_db | Encoding: utf8mb4_unicode_ci
-- Status: CLEAN BASELINE (0 sample members, 0 loans, 0 vouchers)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS cooperative_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cooperative_db;

-- 1. COOPERATIVES & BRANCHES
CREATE TABLE cooperatives (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cda_registration_no VARCHAR(100) NOT NULL,
    tax_identification_no VARCHAR(100) NOT NULL,
    coop_type VARCHAR(100) DEFAULT 'Agricultural',
    address TEXT,
    contact_phone VARCHAR(50),
    contact_email VARCHAR(100),
    fiscal_year_start VARCHAR(10) DEFAULT '01-01',
    base_currency VARCHAR(10) DEFAULT 'PHP'
) ENGINE=InnoDB;

CREATE TABLE branches (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    contact_number VARCHAR(50),
    manager_name VARCHAR(100),
    is_main_branch BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- 2. CDA STANDARD CHART OF ACCOUNTS (All 29 accounts pre-seeded)
CREATE TABLE chart_of_accounts (
    id VARCHAR(50) PRIMARY KEY,
    account_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    category ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense') NOT NULL,
    normal_balance ENUM('Debit', 'Credit') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    report_group VARCHAR(100) NOT NULL,
    description TEXT
) ENGINE=InnoDB;

-- 3. MEMBERS (Clean baseline, custom_field_values in JSON)
CREATE TABLE members (
    id VARCHAR(50) PRIMARY KEY,
    member_no VARCHAR(50) NOT NULL UNIQUE,
    branch_id VARCHAR(50) NOT NULL,
    member_type_id VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    birthdate DATE NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    status ENUM('Active', 'Pending Approval', 'Inactive', 'Terminated', 'Deceased') DEFAULT 'Pending Approval',
    joined_date DATE NOT NULL,
    custom_field_values JSON NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

-- (Full schema contains 40+ relational tables with foreign keys and master seeds)`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'endpoints' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Frontend API calls map to the following PHP MVC controllers and routes:
              </p>
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Endpoint Route</th>
                      <th className="py-2.5 px-3">PHP MVC Action</th>
                      <th className="py-2.5 px-3">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300 font-mono text-[11px]">
                    <tr>
                      <td className="py-2 px-3 text-emerald-400 font-bold">GET</td>
                      <td className="py-2 px-3">/test</td>
                      <td className="py-2 px-3 text-blue-300">HomeController@test</td>
                      <td className="py-2 px-3 font-sans text-slate-400">User's test action (['success'])</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-emerald-400 font-bold">GET</td>
                      <td className="py-2 px-3">/api/members</td>
                      <td className="py-2 px-3 text-blue-300">MemberController@index</td>
                      <td className="py-2 px-3 font-sans text-slate-400">List members with search/filter</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-blue-400 font-bold">POST</td>
                      <td className="py-2 px-3">/api/members</td>
                      <td className="py-2 px-3 text-blue-300">MemberController@store</td>
                      <td className="py-2 px-3 font-sans text-slate-400">Register new member</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-emerald-400 font-bold">GET</td>
                      <td className="py-2 px-3">/api/loans</td>
                      <td className="py-2 px-3 text-blue-300">LoanController@index</td>
                      <td className="py-2 px-3 font-sans text-slate-400">List active loans</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-blue-400 font-bold">POST</td>
                      <td className="py-2 px-3">/api/loans/payments</td>
                      <td className="py-2 px-3 text-blue-300">LoanController@payment</td>
                      <td className="py-2 px-3 font-sans text-slate-400">Loan installment collection</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-emerald-400 font-bold">GET</td>
                      <td className="py-2 px-3">/api/savings/accounts</td>
                      <td className="py-2 px-3 text-blue-300">SavingsController@index</td>
                      <td className="py-2 px-3 font-sans text-slate-400">Savings accounts list</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-emerald-400 font-bold">GET</td>
                      <td className="py-2 px-3">/api/accounting/journals</td>
                      <td className="py-2 px-3 text-blue-300">AccountingController@journals</td>
                      <td className="py-2 px-3 font-sans text-slate-400">Journal vouchers &amp; lines</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-emerald-400 font-bold">GET</td>
                      <td className="py-2 px-3">/api/reports/trial-balance</td>
                      <td className="py-2 px-3 text-blue-300">ReportController@trialBalance</td>
                      <td className="py-2 px-3 font-sans text-slate-400">Trial Balance report</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="flex items-center space-x-2">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Complete project in <code>/backend-php</code> and downloadable as <code>backend-php.zip</code></span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
