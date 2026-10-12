# Split Config Controllers

Copy these PHP files into `app/Controllers/` and update `routes/api.php` to point each resource endpoint to its new controller.

Included resources:
- branches
- loan products
- savings products
- fees
- feature toggles
- system settings
- approval workflows
- approval rules
- custom fields
- numbering formats
- payment allocation rules
- configuration audit trails
- general config endpoints

Important:
1. These controllers preserve calls to your existing `ConfigService`; no database/service implementation is included.
2. Keep your existing authentication and authorization middleware on the new routes.
3. Before removing old ConfigController methods, update every route that references them.
4. The provided source did not include `routes/api.php`, so route registration must be merged with your current router syntax.
5. `getLoanProduct()` direct SQL helper from the original controller is not included because `loanProduct()` already delegates to `ConfigService::getLoanProduct()`.
