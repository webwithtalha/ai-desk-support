# 🧪 Multi-Tenant SaaS Testing Guide

Complete step-by-step guide to test your multi-tenant SaaS features.

---

## 🚀 Step 1: Start the Server

### 1.1 Make sure MongoDB is running
```bash
# Check if MongoDB is running
mongosh --eval "db.version()"

# If not running, start it:
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
# Windows: net start MongoDB
```

### 1.2 Start the development server
```bash
cd ai-support-desk
pnpm dev
```

You should see:
```
✓ Ready in 2s
○ Local: http://localhost:3000
```

---

## 🏢 Step 2: Create Your First Organization (Acme Corp)

### 2.1 Open your browser
```
http://localhost:3000/register
```

### 2.2 Fill in the registration form
```
Name: John Doe
Organization Name: Acme Corp
Email: john@acme.com
Password: Password123!
```

### 2.3 Click "Sign up"

### 2.4 What should happen:
✅ You'll be automatically redirected to: `http://acme-corp.localhost:3000/`

**Important:** Notice the URL changed! You're now on Acme Corp's subdomain.

### 2.5 Check your browser console (F12)
You should see the redirect happening.

---

## 🔍 Step 3: Verify Organization Isolation

### 3.1 Check your current user
Open browser DevTools (F12) → Console → Type:
```javascript
fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
{
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@acme.com",
    "role": "OWNER",
    "orgId": "...",
    "orgName": "Acme Corp",
    "orgSlug": "acme-corp"
  }
}
```

✅ You're logged in as OWNER of Acme Corp!

---

## 🏭 Step 4: Create a Second Organization (TechCorp)

### 4.1 Open a new INCOGNITO/PRIVATE window
This simulates a different user.

### 4.2 Go to registration
```
http://localhost:3000/register
```

### 4.3 Create TechCorp
```
Name: Jane Smith
Organization Name: TechCorp
Email: jane@techcorp.com
Password: Password123!
```

### 4.4 Click "Sign up"

### 4.5 What should happen:
✅ You'll be redirected to: `http://techcorp.localhost:3000/`

**Notice:** Different subdomain = Different organization!

---

## 🔒 Step 5: Test Data Isolation (Multi-Tenancy)

### 5.1 Test API with Acme Corp user
In your **first browser** (logged in as john@acme.com):

```javascript
// Check organization users
fetch('/api/users', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
{
  "message": "Users retrieved successfully",
  "org": "Acme Corp",
  "users": [
    {
      "id": "...",
      "name": "John Doe",
      "email": "john@acme.com",
      "role": "OWNER"
    }
  ]
}
```

### 5.2 Test API with TechCorp user
In your **incognito browser** (logged in as jane@techcorp.com):

```javascript
fetch('/api/users', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
{
  "message": "Users retrieved successfully",
  "org": "TechCorp",
  "users": [
    {
      "id": "...",
      "name": "Jane Smith",
      "email": "jane@techcorp.com",
      "role": "OWNER"
    }
  ]
}
```

✅ **Data Isolation Working!** Each org only sees their own users.

---

## 🚫 Step 6: Test Cross-Organization Access (Should Fail)

### 6.1 Try to access TechCorp from Acme account
In your **first browser** (john@acme.com), manually change URL to:
```
http://techcorp.localhost:3000/
```

### 6.2 Try to call API
```javascript
fetch('/api/users', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
{
  "error": "Access denied: You do not belong to this organization"
}
```

✅ **Security Working!** Users can't access other organizations' data.

---

## 👥 Step 7: Test Role-Based Access Control (RBAC)

### 7.1 Test OWNER permissions
In browser (as john@acme.com at acme-corp.localhost:3000):

```javascript
// OWNER can view users (requires ADMIN+)
fetch('/api/users', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

**Expected:** ✅ Success (OWNER has all permissions)

### 7.2 Test ticket viewing (requires AGENT+)
```javascript
fetch('/api/tickets', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
{
  "message": "Tickets retrieved successfully",
  "org": "Acme Corp",
  "tickets": []
}
```

✅ Success! OWNER can view tickets.

### 7.3 Test creating tickets (requires ADMIN+)
```javascript
fetch('/api/tickets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    title: 'Test Ticket',
    description: 'Testing multi-tenant'
  })
})
.then(r => r.json())
.then(console.log)
```

**Expected:** ✅ Success (OWNER has ADMIN permissions)

---

## 🔐 Step 8: Test Without Subdomain (Development Mode)

### 8.1 Access without subdomain
Go to:
```
http://localhost:3000/
```

### 8.2 Login as john@acme.com

### 8.3 Try to access API
```javascript
fetch('/api/users', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

**In Development:** ✅ Should work (falls back to user's org)
**In Production:** ❌ Would require subdomain

---

## 🧪 Step 9: Test with cURL (Advanced)

### 9.1 Login and get cookie
```bash
curl -v -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@acme.com",
    "password": "Password123!"
  }' \
  -c cookies.txt
```

### 9.2 Use cookie to access API
```bash
curl -X GET http://acme-corp.localhost:3000/api/users \
  -H "Host: acme-corp.localhost:3000" \
  -b cookies.txt
```

**Expected:** Returns Acme Corp users only

### 9.3 Try cross-org access
```bash
curl -X GET http://techcorp.localhost:3000/api/users \
  -H "Host: techcorp.localhost:3000" \
  -b cookies.txt
```

**Expected:** 403 Forbidden (different org)

---

## 📊 Step 10: Test Role Hierarchy

### Role Levels:
- **OWNER** (Level 3) - All permissions
- **ADMIN** (Level 2) - Manage resources, no user management
- **AGENT** (Level 1) - View only

### 10.1 View Permission Matrix

| Endpoint | Method | AGENT | ADMIN | OWNER |
|----------|--------|-------|-------|-------|
| `/api/tickets` | GET | ✅ | ✅ | ✅ |
| `/api/tickets` | POST | ❌ | ✅ | ✅ |
| `/api/users` | GET | ❌ | ✅ | ✅ |
| `/api/users` | POST | ❌ | ❌ | ✅ |

---

## 🎯 Step 11: Verify Middleware Headers

### 11.1 Check what headers middleware adds
Create a test API route to see headers:

```typescript
// src/app/api/debug/route.ts
export async function GET(request: NextRequest) {
  return NextResponse.json({
    subdomain: request.headers.get('x-org-subdomain'),
    userOrgId: request.headers.get('x-user-orgid'),
    userRole: request.headers.get('x-user-role'),
    host: request.headers.get('host')
  });
}
```

### 11.2 Call it from browser
```javascript
fetch('/api/debug', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
{
  "subdomain": "acme-corp",
  "userOrgId": "507f1f77bcf86cd799439011",
  "userRole": "OWNER",
  "host": "acme-corp.localhost:3000"
}
```

---

## ✅ Testing Checklist

Mark these as you test:

### Basic Functionality
- [ ] Server starts without errors
- [ ] Can register new organization
- [ ] Redirects to subdomain after registration
- [ ] Can login to existing organization
- [ ] Redirects to subdomain after login
- [ ] Can logout successfully

### Multi-Tenancy
- [ ] Each org has unique subdomain
- [ ] Users can only see their org's data
- [ ] Cross-org access is blocked (403)
- [ ] Subdomain validation works
- [ ] Org context is passed via headers

### Role-Based Access
- [ ] OWNER can access all endpoints
- [ ] ADMIN can access resource endpoints
- [ ] ADMIN cannot manage users
- [ ] AGENT can only view
- [ ] Role hierarchy is enforced

### Security
- [ ] JWT tokens include orgId
- [ ] Middleware validates tokens
- [ ] API routes validate org context
- [ ] Database queries are scoped to orgId
- [ ] Invalid tokens are rejected

---

## 🐛 Common Issues & Solutions

### Issue 1: "Organization subdomain required"
**Cause:** In production mode without subdomain
**Solution:** Use `orgslug.localhost:3000` format

### Issue 2: Subdomain doesn't work
**Cause:** Browser doesn't support .localhost subdomains
**Solution:** Use Chrome or Firefox (Safari may have issues)

### Issue 3: "Access denied: You do not belong to this organization"
**Cause:** Logged into wrong org's subdomain
**Solution:** Logout and login via correct subdomain

### Issue 4: Cookie not setting
**Cause:** SameSite cookie policy
**Solution:** Cookies are set for `.localhost` domain

---

## 📸 Expected Results Screenshots

### Registration Success
```
URL: http://acme-corp.localhost:3000/
User: John Doe
Org: Acme Corp
Role: OWNER
```

### API Success (Same Org)
```json
{
  "message": "Users retrieved successfully",
  "org": "Acme Corp",
  "users": [...]
}
```

### API Failure (Cross-Org)
```json
{
  "error": "Access denied: You do not belong to this organization"
}
```

---

## 🚀 Production Testing (Optional)

### Deploy to production with:
1. Wildcard DNS: `*.yourdomain.com`
2. Wildcard SSL certificate
3. Set `NODE_ENV=production`

### Then test:
```
https://acme.yourdomain.com
https://techcorp.yourdomain.com
```

---

## 🎉 Success Criteria

Your multi-tenant SaaS is working correctly when:

✅ Each organization has its own subdomain  
✅ Users are automatically redirected to their org's subdomain  
✅ Data is completely isolated between organizations  
✅ Cross-org access attempts are blocked  
✅ Role-based permissions are enforced  
✅ Middleware correctly extracts and validates org context  
✅ All database queries are scoped to orgId  

---

**Congratulations!** You now have a fully functional multi-tenant SaaS application! 🎊

