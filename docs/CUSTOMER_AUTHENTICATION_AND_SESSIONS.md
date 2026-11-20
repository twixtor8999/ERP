# Customer Authentication and Sessions — AI Smart Bazar ERP

**Client:** Siddeshwar Enterprises  
**Module:** Customer Authentication, Sessions & Security  
**Status:** Production Ready  

---

## 1. Authentication Philosophy

Customer authentication in AI Smart Bazar is designed for maximum retail ease-of-use without sacrificing enterprise security.
- **Mobile First:** Customers identify with a 10-digit Indian phone number (`98XXXXXXXX`).
- **Zero Friction:** Avoids complex email verification loops for retail shoppers; email is optional.
- **Persistent Sessions:** 30-day session lifetime to keep regular supermarket shoppers logged in without entering passwords every visit.

---

## 2. API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/store/auth/register` | Customer signup with phone, full name, password | No |
| `POST` | `/api/v1/store/auth/login` | Mobile number & password login | No |
| `GET`  | `/api/v1/store/auth/me` | Fetch active customer profile & user context | Yes (Customer) |
| `POST` | `/api/v1/store/auth/logout` | Invalidate JWT and clear session cookie | Yes (Customer) |

---

## 3. Persistent Cookie & JWT Token Mechanism

When a customer logs in via `/api/v1/store/auth/login`:
1. The backend verifies credentials using `bcrypt` (via `pwd_context.verify(password, user.password_hash)`).
2. It validates that the user is not deactivated and has an approved customer role.
3. It generates an access token with a 30-day expiry (`CUSTOMER_SESSION_EXPIRE_DAYS = 30`).
4. The response sets an `HttpOnly` cookie:
   ```http
   Set-Cookie: customer_session_token=<JWT>; Max-Age=2592000; Path=/; HttpOnly; SameSite=Lax; Secure
   ```
5. The response body also includes `{ access_token, token_type: "bearer", customer, user }`.

### Dual Header / Cookie Resolution:
In `backend/app/modules/customers/dependencies.py`:
```python
token = None
if authorization and authorization.startswith("Bearer "):
    token = authorization.split(" ")[1]
elif customer_session_token:
    token = customer_session_token
```
This guarantees smooth functioning in browser clients (cookies sent automatically) as well as headless / mobile web clients (Bearer token).

---

## 4. RBAC Isolation & Security Guarantees

1. **Role Scope Separation:**
   - Registration assigns the user to the `customer` role template with branch and organization context.
   - Any attempt to pass employee roles (`SUPER_ADMIN`, `STORE_MANAGER`, `CASHIER`) during signup is stripped or rejected.
2. **Access Control Boundary:**
   - Employee endpoints (`/api/v1/users`, `/api/v1/roles`, `/api/v1/billing`, etc.) check for administrative permissions (e.g. `users.manage`, `pos.create_bill`).
   - Customer tokens lack these permissions and are rejected with `HTTP 403 Forbidden`.
3. **Session Revocation:**
   - On logout, the token JTI or timestamp is invalidated, and the cookie is cleared with `Max-Age=0`.

