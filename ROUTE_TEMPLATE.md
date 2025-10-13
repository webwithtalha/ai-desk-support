# Protected API Route Template

Use this template when creating new protected API routes in your multi-tenant SaaS.

## Basic Template

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/app/lib/db';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { validateOrgContext, validateMinimumRole, getUserFromRequest } from '@/lib/multi-tenant';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    
    // 1. Verify Authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // 2. Validate Organization Context (Multi-Tenant)
    const orgValidation = await validateOrgContext(request);
    if ('error' in orgValidation) {
      return orgValidation.error;
    }
    const { org } = orgValidation;
    
    // 3. Check User Role (Optional - only if route needs specific role)
    const { userRole } = getUserFromRequest(request);
    const roleCheck = validateMinimumRole(userRole, 'AGENT'); // Change role as needed
    if (!roleCheck.authorized) {
      return roleCheck.error;
    }
    
    // 4. Query Data (ALWAYS scoped to orgId)
    // const data = await YourModel.find({ orgId: org.orgId });
    
    // 5. Return Response
    return NextResponse.json({
      message: 'Success',
      org: org.orgName,
      data: [] // Your data here
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Role-Based Variations

### AGENT+ (Any authenticated user in org)
```typescript
const roleCheck = validateMinimumRole(userRole, 'AGENT');
```

### ADMIN+ (Admin and Owner only)
```typescript
const roleCheck = validateMinimumRole(userRole, 'ADMIN');
```

### OWNER Only
```typescript
const roleCheck = validateMinimumRole(userRole, 'OWNER');
```

### Specific Roles (Multiple options)
```typescript
import { hasRole } from '@/lib/multi-tenant';

if (!hasRole(userRole, ['OWNER', 'ADMIN'])) {
  return NextResponse.json(
    { error: 'Insufficient permissions' },
    { status: 403 }
  );
}
```

## POST/PUT/DELETE Template

```typescript
export async function POST(request: NextRequest) {
  try {
    await connectToDB();
    
    // Auth & Org validation (same as GET)
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const orgValidation = await validateOrgContext(request);
    if ('error' in orgValidation) {
      return orgValidation.error;
    }
    const { org } = orgValidation;
    
    // Role check (usually stricter for mutations)
    const { userRole } = getUserFromRequest(request);
    const roleCheck = validateMinimumRole(userRole, 'ADMIN');
    if (!roleCheck.authorized) {
      return roleCheck.error;
    }
    
    // Parse request body
    const body = await request.json();
    
    // Create/Update with orgId
    // const newItem = await YourModel.create({
    //   ...body,
    //   orgId: org.orgId
    // });
    
    return NextResponse.json({
      message: 'Created successfully',
      data: {} // Your created data
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Dynamic Routes

For routes like `/api/tickets/[id]/route.ts`:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDB();
    
    // ... standard auth & org validation ...
    
    const orgValidation = await validateOrgContext(request);
    if ('error' in orgValidation) {
      return orgValidation.error;
    }
    const { org } = orgValidation;
    
    // Query with BOTH id AND orgId for security
    const item = await YourModel.findOne({
      _id: params.id,
      orgId: org.orgId  // ⚠️ CRITICAL: Prevent cross-org access
    });
    
    if (!item) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data: item });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## ⚠️ Critical Security Rules

1. **ALWAYS include `orgId` in queries:**
   ```typescript
   // ✅ CORRECT
   await Model.find({ orgId: org.orgId });
   await Model.findOne({ _id: id, orgId: org.orgId });
   
   // ❌ WRONG - Security vulnerability!
   await Model.find({});
   await Model.findById(id);
   ```

2. **ALWAYS validate org context:**
   ```typescript
   // ✅ CORRECT
   const orgValidation = await validateOrgContext(request);
   if ('error' in orgValidation) return orgValidation.error;
   
   // ❌ WRONG - Bypasses multi-tenant security!
   // Directly querying without validation
   ```

3. **ALWAYS check permissions before mutations:**
   ```typescript
   // ✅ CORRECT - Check role before delete
   const roleCheck = validateMinimumRole(userRole, 'OWNER');
   if (!roleCheck.authorized) return roleCheck.error;
   
   // ❌ WRONG - Anyone can delete!
   await Model.deleteOne({ _id: id });
   ```

## Quick Checklist

- [ ] Import all required utilities
- [ ] Force Node.js runtime (`export const runtime = 'nodejs'`)
- [ ] Connect to database
- [ ] Verify JWT token
- [ ] Validate organization context
- [ ] Check user role (if needed)
- [ ] Scope all queries to `orgId`
- [ ] Return appropriate status codes
- [ ] Handle errors gracefully

## Examples in Codebase

- **Basic GET with role check:** `/src/app/api/tickets/route.ts`
- **POST with OWNER role:** `/src/app/api/users/route.ts`
- **Auth check only:** `/src/app/api/auth/me/route.ts`

---

Copy this template and modify for your specific route needs!

