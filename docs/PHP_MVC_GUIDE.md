# PHP MVC Backend Architecture & SQL Integration Guide
**Mayap Care Agriculture Cooperative System**
*Endpoint: `http://cooperative-api.test/api/`*

---

## 1. Database Setup & Initialization

### Database Credentials & Schema
- **Database Name**: `cooperative_db`
- **Character Set**: `utf8mb4`
- **Collation**: `utf8mb4_unicode_ci`
- **SQL Script Location**: `/database/cooperative_db.sql` (also available via web download at `/cooperative_db.sql`)

### How to Import via CLI or phpMyAdmin

#### Using MySQL CLI:
```bash
# 1. Create database and import schema
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cooperative_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p cooperative_db < database/cooperative_db.sql
```

#### Using phpMyAdmin / Adminer / HeidiSQL / DBeaver:
1. Open phpMyAdmin (`http://localhost/phpmyadmin`).
2. Create a new database named `cooperative_db` (Collation: `utf8mb4_unicode_ci`).
3. Click the **Import** tab.
4. Select `cooperative_db.sql` and click **Go**.

> **Note on Data State**: All sample operational members, loans, savings accounts, and vouchers have been completely wiped. The database is initialized with the official CDA-compliant Chart of Accounts (29 accounts), Branches, System Settings, Feature Toggles, Numbering Formats, User Roles, and Products.

---

## 2. Recommended PHP MVC Directory Structure

```
cooperative-api/
├── app/
│   ├── Config/
│   │   └── config.php
│   ├── Core/
│   │   ├── Database.php
│   │   ├── Router.php
│   │   ├── Controller.php
│   │   └── Response.php
│   ├── Controllers/
│   │   ├── MemberController.php
│   │   ├── LoanController.php
│   │   ├── SavingsController.php
│   │   ├── ShareCapitalController.php
│   │   ├── AccountingController.php
│   │   ├── ConfigController.php
│   │   └── SystemController.php
│   └── Models/
│       ├── Member.php
│       ├── Loan.php
│       ├── SavingsAccount.php
│       ├── ShareCapitalAccount.php
│       ├── CashAccount.php
│       └── JournalEntry.php
├── public/
│   ├── .htaccess
│   └── index.php
├── routes/
│   └── api.php
└── composer.json
```

---

## 3. Core Framework Code Snippets

### A. `app/Core/Database.php` (PDO Database Connection)
```php
<?php
namespace App\Core;

use PDO;
use PDOException;

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $host = '127.0.0.1';
            $db   = 'cooperative_db';
            $user = 'root';
            $pass = '';
            $charset = 'utf8mb4';

            $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            try {
                self::$instance = new PDO($dsn, $user, $pass, $options);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
                exit;
            }
        }
        return self::$instance;
    }
}
```

### B. `app/Core/Response.php` (Standard API JSON Response)
```php
<?php
namespace App\Core;

class Response {
    public static function json($data, int $status = 200): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        
        echo json_encode($data);
        exit;
    }

    public static function success($data = null, string $message = 'Success', int $status = 200): void {
        self::json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $status);
    }

    public static function error(string $message = 'Error', int $status = 400, $errors = null): void {
        self::json([
            'success' => false,
            'error' => $message,
            'details' => $errors
        ], $status);
    }
}
```

### C. `public/.htaccess` (Clean URL Rewriting for Apache/Laragon)
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>
```

### D. `public/index.php` (Front Controller with CORS Handling)
```php
<?php
declare(strict_types=1);

// Handle pre-flight CORS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Router;

$router = new Router();
require_once __DIR__ . '/../routes/api.php';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

$router->dispatch($method, $uri);
```

### E. `app/Controllers/MemberController.php` (Sample MVC Controller)
```php
<?php
namespace App\Controllers;

use App\Core\Response;
use App\Models\Member;

class MemberController {
    public function index(): void {
        $branchId = $_GET['branch_id'] ?? null;
        $status = $_GET['status'] ?? null;
        $search = $_GET['search'] ?? null;

        $members = Member::all($branchId, $status, $search);
        Response::success($members);
    }

    public function show(string $id): void {
        $member = Member::find($id);
        if (!$member) {
            Response::error('Member not found', 404);
        }
        Response::success($member);
    }

    public function store(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            Response::error('Invalid JSON payload', 400);
        }

        // Validate required fields
        if (empty($input['first_name']) || empty($input['last_name']) || empty($input['phone'])) {
            Response::error('First name, last name, and phone are required.', 422);
        }

        $created = Member::create($input);
        Response::success($created, 'Member successfully registered.', 201);
    }

    public function update(string $id): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $updated = Member::update($id, $input);
        Response::success($updated, 'Member updated successfully.');
    }
}
```

### F. `app/Models/Member.php` (Sample Model)
```php
<?php
namespace App\Models;

use App\Core\Database;
use PDO;

class Member {
    public static function all(?string $branchId = null, ?string $status = null, ?string $search = null): array {
        $db = Database::getConnection();
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
            $sql .= " AND (m.first_name LIKE :search OR m.last_name LIKE :search OR m.member_no LIKE :search)";
            $params['search'] = "%$search%";
        }

        $sql .= " ORDER BY m.created_at DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode JSON custom fields
        foreach ($rows as &$row) {
            if (isset($row['custom_field_values'])) {
                $row['custom_field_values'] = json_decode($row['custom_field_values'], true);
            }
        }

        return $rows;
    }

    public static function find(string $id): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM members WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row && isset($row['custom_field_values'])) {
            $row['custom_field_values'] = json_decode($row['custom_field_values'], true);
        }
        return $row ?: null;
    }

    public static function create(array $data): array {
        $db = Database::getConnection();
        $id = $data['id'] ?? 'mem_' . bin2hex(random_bytes(6));
        $memberNo = $data['member_no'] ?? 'MEM-' . date('Y') . '-' . str_pad((string)mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);

        $sql = "INSERT INTO members (id, member_no, branch_id, member_type_id, first_name, last_name, middle_name,
                    gender, birthdate, email, phone, address, status, joined_date, custom_field_values)
                VALUES (:id, :member_no, :branch_id, :member_type_id, :first_name, :last_name, :middle_name,
                    :gender, :birthdate, :email, :phone, :address, :status, :joined_date, :custom_field_values)";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            'id' => $id,
            'member_no' => $memberNo,
            'branch_id' => $data['branch_id'],
            'member_type_id' => $data['member_type_id'] ?? 'mt_regular',
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'middle_name' => $data['middle_name'] ?? null,
            'gender' => $data['gender'] ?? 'Male',
            'birthdate' => $data['birthdate'] ?? date('Y-m-d', strtotime('-25 years')),
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'],
            'address' => $data['address'],
            'status' => $data['status'] ?? 'Active',
            'joined_date' => $data['joined_date'] ?? date('Y-m-d'),
            'custom_field_values' => isset($data['custom_field_values']) ? json_encode($data['custom_field_values']) : null,
        ]);

        return self::find($id);
    }
}
```

---

## 4. Key API Endpoints & Route Definitions

| Method | Endpoint | PHP Controller Action | Description |
|---|---|---|---|
| `GET` | `/api/members` | `MemberController@index` | Fetch members list with filters |
| `POST` | `/api/members` | `MemberController@store` | Register new member |
| `GET` | `/api/members/:id` | `MemberController@show` | Get single member record |
| `GET` | `/api/loans` | `LoanController@index` | Fetch active loans list |
| `POST` | `/api/loans` | `LoanController@store` | Disburse new loan |
| `GET` | `/api/loans/:id/schedule` | `LoanController@schedule` | Fetch loan amortization schedule |
| `POST` | `/api/loans/payments` | `LoanController@payment` | Collect and allocate loan repayment |
| `GET` | `/api/savings/accounts` | `SavingsController@accounts` | Member savings accounts list |
| `POST` | `/api/savings/transactions` | `SavingsController@transact` | Deposit or withdrawal transaction |
| `GET` | `/api/share-capital/accounts`| `ShareCapitalController@accounts`| Share capital / CBU accounts list |
| `POST`| `/api/share-capital/payments`| `ShareCapitalController@payment` | Share capital subscription payment |
| `GET` | `/api/accounting/chart` | `AccountingController@chart` | CDA Chart of Accounts list |
| `GET` | `/api/accounting/journals` | `AccountingController@journals` | Journal vouchers & lines |
| `POST`| `/api/accounting/journals` | `AccountingController@postJournal`| Post manual or automated JV |
| `GET` | `/api/accounting/trial-balance`| `AccountingController@trialBalance`| Real-time Trial Balance report |
| `GET` | `/api/accounting/balance-sheet`| `AccountingController@balanceSheet`| Balance Sheet report |
| `GET` | `/api/branches` | `ConfigController@branches` | Cooperative branch network |
| `GET` | `/api/loan-products` | `ConfigController@loanProducts`| Configurable loan products |
| `GET` | `/api/cash-accounts` | `ConfigController@cashAccounts`| Cash vault and bank clearing accounts|
| `GET` | `/api/feature-toggles` | `ConfigController@featureToggles`| Feature toggle flags |
| `GET` | `/api/system/settings` | `ConfigController@settings` | Cooperative system parameters |
