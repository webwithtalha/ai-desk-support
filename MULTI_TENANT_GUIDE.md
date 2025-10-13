# Multi-Tenant SaaS Architecture Guide

This application is built as a **true multi-tenant SaaS** where each organization gets its own subdomain and complete data isolation.

## 🏗️ Architecture Overview

### Subdomain-Based Routing
- Each organization has a unique subdomain: `acme.yourapp.com`, `techcorp.yourapp.com`
- In development: Use `orgslug.localhost:3000`
- In production: Use `orgslug.yourdomain.com`

### Data Isolation
- All database queries are **automatically scoped** to the organization
- Users can only access data from their own organization
- Cross-company data leaks are prevented at the middleware level

### Role-Based Access Control (RBAC)
Three roles with hierarchical permissions:

1. **OWNER** (Highest)
   - Full control over the organization
   - Can manage users (invite, remove, change roles)
   - Can access all features

2. **ADMIN** (Middle)
   - Can manage tickets and resources
   - Can view all organization data
   - Cannot manage users

3. **AGENT** (Lowest)
   - Can view and respond to assigned tickets
   - Limited access to organization resources

## 🔒 How Multi-Tenancy Works

### 1. Middleware Layer (`src/middleware.ts`)

The middleware extracts the subdomain from every request and validates:

```typescript
// Extracts subdomain from request
acme.yourapp.com → subdomain: "acme"

// Adds headers for API routes
x-org-subdomain: acme
x-user-orgid: 507f1f77bcf86cd799439011
x-user-role: ADMIN
```

**Key features:**
- Extracts subdomain from hostname
- Decodes JWT to get user's org and role
- Passes org context via headers
- Blocks unauthorized cross-org access

### 2. Org Validation (`src/lib/multi-tenant.ts`)

Utility functions for API routes:

```typescript
// Validate org exists and user belongs to it
const orgValidation = await validateOrgContext(request);
if ('error' in orgValidation) {
  return orgValidation.error;
}
const { org } = orgValidation;

// Check user has required role
const { userRole } = getUserFromRequest(request);
const roleCheck = validateMinimumRole(userRole, 'ADMIN');
if (!roleCheck.authorized) {
  return roleCheck.error;
}

// Now safely query data scoped to org
const tickets = await Ticket.find({ orgId: org.orgId });
```

### 3. Database Scoping

**CRITICAL:** All database queries must be scoped to orgId:

```typescript
// ✅ CORRECT - Scoped to organization
const users = await User.find({ orgId: org.orgId });

// ❌ WRONG - Can leak cross-org data
const users = await User.find({});
```

## 📁 File Structure

```
src/
├── middleware.ts                 # Subdomain extraction & org validation
├── lib/
│   ├── multi-tenant.ts          # Org validation utilities
│   └── auth.ts                  # JWT verification
├── models/
│   ├── User.ts                  # orgId reference
│   └── Org.ts                   # Organization model
├── app/
│   ├── api/
│   │   ├── auth/                # Authentication routes
│   │   ├── tickets/             # Example: AGENT+ access
│   │   └── users/               # Example: ADMIN/OWNER access
│   └── contexts/
│       └── AuthContext.tsx      # Subdomain redirect logic
```

## 🚀 Implementation Guide

### Creating a New Protected API Route

1. **Import utilities:**
```typescript
import { validateOrgContext, validateMinimumRole, getUserFromRequest } from '@/lib/multi-tenant';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
```

2. **Verify authentication:**
```typescript
const token = getTokenFromRequest(request);
if (!token) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const payload = verifyToken(token);
if (!payload) {
  return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
}
```

3. **Validate organization:**
```typescript
const orgValidation = await validateOrgContext(request);
if ('error' in orgValidation) {
  return orgValidation.error;
}
const { org } = orgValidation;
```

4. **Check role permissions:**
```typescript
const { userRole } = getUserFromRequest(request);
const roleCheck = validateMinimumRole(userRole, 'ADMIN');
if (!roleCheck.authorized) {
  return roleCheck.error;
}
```

5. **Query data (scoped):**
```typescript
const data = await Model.find({ orgId: org.orgId });
```

### Example: Protected Route with Role Check

See `/src/app/api/tickets/route.ts` and `/src/app/api/users/route.ts` for complete examples.

## 🔐 Security Checklist

- ✅ Every API route validates org context
- ✅ Every database query includes `orgId` filter
- ✅ User's orgId matches subdomain's orgId
- ✅ Role-based permissions enforced
- ✅ JWT tokens include orgId claim
- ✅ Middleware blocks unauthorized access

## 🧪 Testing Multi-Tenancy

### Development Testing (localhost)

1. **Register Organization:**
   ```
   POST http://localhost:3000/api/auth/register
   {
     "name": "John Doe",
     "orgName": "Acme Corp",
     "email": "john@acme.com",
     "password": "password123"
   }
   ```
   Response includes: `redirectTo: "acme-corp"`

2. **Access via Subdomain:**
   ```
   http://acme-corp.localhost:3000/
   ```

3. **Test Cross-Org Access:**
   - Register another org: "TechCorp" → `techcorp.localhost:3000`
   - Login to Acme
   - Try to access TechCorp subdomain → Should be blocked

### Production Setup

1. **DNS Configuration:**
   - Add wildcard DNS: `*.yourdomain.com` → Your server IP
   
2. **Next.js Configuration:**
   - Update `next.config.ts` if needed for subdomain handling
   
3. **Environment Variables:**
   ```env
   JWT_SECRET=your-secret-key
   MONGODB_URI=your-mongodb-connection
   NODE_ENV=production
   ```

## 📊 Role Permission Matrix

| Feature | AGENT | ADMIN | OWNER |
|---------|-------|-------|-------|
| View Tickets | ✅ | ✅ | ✅ |
| Create Tickets | ❌ | ✅ | ✅ |
| Manage Tickets | ❌ | ✅ | ✅ |
| View Users | ❌ | ✅ | ✅ |
| Invite Users | ❌ | ❌ | ✅ |
| Change Roles | ❌ | ❌ | ✅ |
| Delete Org | ❌ | ❌ | ✅ |

## 🛠️ Utility Functions Reference

### `validateOrgContext(request)`
Validates subdomain exists and user belongs to that org.

**Returns:**
- `{ org: OrgContext }` - Success
- `{ error: NextResponse }` - Failure (404/403)

### `validateMinimumRole(userRole, minimumRole)`
Checks if user has minimum required role level.

**Returns:**
- `{ authorized: true }` - Success
- `{ authorized: false, error: NextResponse }` - Failure (403)

### `hasRole(userRole, requiredRoles[])`
Checks if user has one of the specific roles.

**Example:**
```typescript
if (hasRole(userRole, ['OWNER', 'ADMIN'])) {
  // Allow action
}
```

## 🐛 Common Issues

### "Organization subdomain required"
- Make sure you're accessing via subdomain in production
- In development, use `orgslug.localhost:3000`

### "Access denied: You do not belong to this organization"
- User's JWT orgId doesn't match the subdomain's org
- Logout and login again to refresh token

### "MissingSchemaError: Schema hasn't been registered"
- Import the model at the top of your route file
- Even if not directly used, Mongoose needs it for `.populate()`

## 📝 Best Practices

1. **Always scope queries by orgId**
2. **Validate org context in every API route**
3. **Use role helpers for permission checks**
4. **Return appropriate HTTP status codes**
5. **Log security events for audit trail**
6. **Test with multiple orgs to verify isolation**

## 🎯 Next Steps

1. Add organization settings page (OWNER only)
2. Implement user invitation system
3. Add audit logs for security events
4. Create organization-specific customizations
5. Add usage tracking per organization
6. Implement organization billing (if applicable)

---

**Need help?** Check the example routes in `/src/app/api/tickets/` and `/src/app/api/users/`

