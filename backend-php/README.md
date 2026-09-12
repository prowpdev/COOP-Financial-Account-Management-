# Mayap Care Agriculture Cooperative — PHP MVC Backend API

Production-ready PHP MVC REST API backend conforming to the requested pattern:
- Controllers extend `BaseController`, inject `PDO $db`, and respond with `$this->json(...) : never`.
- Models/Repositories use PHP 8 constructor property promotion `public function __construct(private PDO $db)` with parameterized PDO prepared statements.

---

## 🚀 Quick Start (Zero Dependencies Required)

### 1. Initialize MySQL Database
```bash
# Create database and import schema
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cooperative_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p cooperative_db < database/cooperative_db.sql
```

### 2. Configure Database Credentials (Optional)
Edit `config/database.php` or set environment variables:
```php
'host'     => '127.0.0.1',
'port'     => 3306,
'database' => 'cooperative_db',
'username' => 'root',
'password' => '',
```

### 3. Start the Server

#### Option A: PHP Built-in Server (Fastest, no setup needed)
```bash
cd backend-php
php -S localhost:8000 -t public
```
Your API will immediately run at: `http://localhost:8000/api`

#### Option B: Laragon / Apache VirtualHost
Point the Document Root to the `public/` directory:
- Domain: `http://cooperative-api.test`
- Root: `C:/laragon/www/backend-php/public`

#### Option C: Composer (Optional)
```bash
composer dump-autoload
```
*(Note: A built-in autoloader in `app/Core/Autoloader.php` is provided, so Composer is not strictly required).*

---

## 📁 Architecture & Pattern Overview

```
backend-php/
├── app/
│   ├── Controllers/
│   │   ├── BaseController.php       # JSON output, request parsing, error & status helpers
│   │   ├── HomeController.php       # Healthcheck & user's test() method
│   │   ├── MemberController.php     # Member registration, updates, reports
│   │   ├── LoanController.php       # Loan disbursements, repayment allocations, schedules
│   │   ├── SavingsController.php    # Savings accounts, deposits, withdrawals
│   │   ├── ShareCapitalController.php # CBU subscriptions, payments, transactions
│   │   ├── AccountingController.php # Chart of accounts, journal vouchers, reversals
│   │   ├── CashController.php       # Vault drawers, transfers, clearing accounts
│   │   ├── ConfigController.php     # Products, branches, settings, toggles
│   │   └── ReportController.php     # Real-time Trial Balance, Financial Statements, Stats
│   ├── Models/
│   │   ├── MemberRepository.php     # Member database queries & reports
│   │   ├── LoanRepository.php       # Loans, schedules, allocations
│   │   ├── SavingsRepository.php    # Savings accounts & passbook ledger
│   │   ├── ShareCapitalRepository.php # CBU ledger & transactions
│   │   ├── AccountingRepository.php # COA, journal entries & lines
│   │   ├── CashRepository.php       # Cash drawers & transfers
│   │   ├── ConfigRepository.php     # System config & products
│   │   └── ReportRepository.php     # Trial balance calculation & statements
│   ├── Services/
│   │   └── AmortizationService.php  # Diminishing balance, flat rate, equal PMT
│   └── Core/
│       ├── Database.php             # Singleton PDO connection
│       ├── Router.php               # Route matcher & parameter binder
│       └── Autoloader.php           # Zero-config PSR-4 autoloader
├── config/
│   └── database.php                 # MySQL connection configuration
├── database/
│   └── cooperative_db.sql           # Complete schema + CDA master seeds
├── public/
│   ├── index.php                    # Front controller & CORS pre-flight
│   └── .htaccess                    # URL rewriting for Apache / Laragon
├── routes/
│   └── api.php                      # Endpoint definitions
└── composer.json
```

---

## 🧩 User Pattern Compliance

### Controller Example:
```php
<?php
declare(strict_types=1);

namespace App\Controllers;

use PDO;

class HomeController extends BaseController
{
    public function __construct(PDO $db) {
        parent::__construct($db);
    }

    public function test(): never
    {
        $this->json(['success']);
    }
}
```

### Model/Repository Example:
```php
<?php
declare(strict_types=1);

namespace App\Models;

use PDO;

class MemberRepository
{
    public function __construct(private PDO $db)
    {
    }

    public function delete(string $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM members WHERE id = ?');
        return $stmt->execute([$id]);
    }
}
```
