# API Conventions & REST Design Standards — AI Smart Bazar ERP

## 1. URL Pathing & Versioning

All API endpoints reside under the `/api/v1` namespace prefix.

- Resource names are plural nouns in kebab-case:
  - `GET /api/v1/products`
  - `POST /api/v1/orders`
  - `GET /api/v1/customer-relationships`
- Sub-resources represent relationships:
  - `GET /api/v1/branches/{branch_id}/inventory`
  - `POST /api/v1/orders/{order_id}/payments`

---

## 2. Standard HTTP Methods

| Method | Idempotent | Purpose | Success Status |
| :--- | :--- | :--- | :--- |
| `GET` | Yes | Retrieve resource or list | `200 OK` |
| `POST` | No | Create resource or initiate action | `201 Created` / `200 OK` |
| `PUT` | Yes | Complete resource replacement | `200 OK` |
| `PATCH` | Yes | Partial resource update | `200 OK` |
| `DELETE` | Yes | Soft or hard deletion | `200 OK` / `204 No Content` |

---

## 3. Standard JSON Response Envelope

### Successful Responses
Single resource:
```json
{
  "success": true,
  "data": {
    "id": "ord_10293",
    "orderNumber": "ORD-2026-0012",
    "totalAmount": 4500.00
  },
  "requestId": "req_847291a0c"
}
```

Paginated collections:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 142,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  },
  "requestId": "req_847291a0c"
}
```

### Standard Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "BRANCH_ACCESS_DENIED",
    "message": "Access to branch 'br_south' is not authorized for your account",
    "details": {
      "branch_id": "br_south"
    }
  },
  "requestId": "req_847291a0c"
}
```

---

## 4. Mandatory Headers

- `Authorization`: `Bearer <jwt_access_token>`
- `X-Branch-ID`: Identifies active operational branch context for multi-branch users.
- `X-Request-ID`: Correlation identifier propagated from client to server logs.
- `X-Process-Time-Ms`: Server execution latency attached to all responses.

