# 🌐 Subdomain Routing Guide

This guide explains how subdomain routing works in development and production.

---

## 🔧 How It Works Now (Fixed!)

### The Problem (Before)
When you logged in from `millions-fix.localhost:3000`, it would try to redirect to `millions-fix.millions-fix.localhost` (duplicated subdomain).

### The Solution (After)
The system now checks if you're already on the correct subdomain before redirecting:

```typescript
// Smart subdomain detection
const currentSubdomain = hostname.split('.')[0];
if (currentSubdomain === orgSlug) {
  // Already on correct subdomain, just go to home
  return '/';
}
```

---

## 📋 Different Scenarios

### **Scenario 1: Register from Base Domain**
```
You're at: http://localhost:3000/register
You create org: "Acme Corp" (slug: acme-corp)
What happens: Redirects to http://acme-corp.localhost:3000/ ✅
```

### **Scenario 2: Register from Subdomain**
```
You're at: http://acme-corp.localhost:3000/register
You create org: "Acme Corp" (slug: acme-corp)
What happens: Stays at http://acme-corp.localhost:3000/ (just goes to /) ✅
```

### **Scenario 3: Login from Base Domain**
```
You're at: http://localhost:3000/login
You login as: user@acme.com (org slug: acme-corp)
What happens: Redirects to http://acme-corp.localhost:3000/ ✅
```

### **Scenario 4: Login from Correct Subdomain**
```
You're at: http://acme-corp.localhost:3000/login
You login as: user@acme.com (org slug: acme-corp)
What happens: Stays at http://acme-corp.localhost:3000/ (just goes to /) ✅
```

### **Scenario 5: Login from Wrong Subdomain**
```
You're at: http://techcorp.localhost:3000/login
You login as: user@acme.com (org slug: acme-corp)
What happens: Redirects to http://acme-corp.localhost:3000/ ✅
```

---

## 🚀 Testing Instructions

### **Step 1: Test Registration (Base Domain)**

1. **Go to:** `http://localhost:3000/register`

2. **Create organization:**
   - Name: `Test User`
   - Organization: `Millions Fix`
   - Email: `test@millions.com`
   - Password: `Password123!`

3. **Expected Result:**
   ```
   Redirects to: http://millions-fix.localhost:3000/
   URL should be correct (no duplication) ✅
   ```

---

### **Step 2: Test Login (Base Domain)**

1. **Logout first** (open DevTools console):
   ```javascript
   fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
     .then(() => window.location.href = 'http://localhost:3000/login')
   ```

2. **Go to:** `http://localhost:3000/login`

3. **Login with:**
   - Email: `test@millions.com`
   - Password: `Password123!`

4. **Expected Result:**
   ```
   Redirects to: http://millions-fix.localhost:3000/
   URL should be correct ✅
   ```

---

### **Step 3: Test Login (Already on Subdomain)**

1. **You should already be on:** `http://millions-fix.localhost:3000/`

2. **Logout:**
   ```javascript
   fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
     .then(() => window.location.reload())
   ```

3. **Should redirect to:** `http://millions-fix.localhost:3000/login`

4. **Login again:**
   - Email: `test@millions.com`
   - Password: `Password123!`

5. **Expected Result:**
   ```
   Stays at: http://millions-fix.localhost:3000/
   NO redirect (already on correct subdomain) ✅
   URL remains clean ✅
   ```

---

### **Step 4: Test Cross-Org Login**

1. **Create another org** (in incognito window):
   - Go to: `http://localhost:3000/register`
   - Create org: `TechCorp`
   - Redirects to: `http://techcorp.localhost:3000/` ✅

2. **In main browser (logged out), go to:**
   ```
   http://techcorp.localhost:3000/login
   ```

3. **Login with Millions Fix credentials:**
   - Email: `test@millions.com`
   - Password: `Password123!`

4. **Expected Result:**
   ```
   Redirects from: http://techcorp.localhost:3000/login
   Redirects to: http://millions-fix.localhost:3000/
   (Changes to correct org subdomain) ✅
   ```

---

## 🌍 Development vs Production

### **Development (localhost)**

**Supported URLs:**
- `http://localhost:3000` (base domain, no org context)
- `http://orgslug.localhost:3000` (org-specific subdomain)

**Behavior:**
- Base domain allows login/register
- Redirects to org subdomain after auth
- If already on correct subdomain, stays there

---

### **Production (your-domain.com)**

**Supported URLs:**
- `https://orgslug.yourdomain.com` (org-specific subdomain only)

**Behavior:**
- Requires subdomain (no base domain access)
- Validates subdomain exists in database
- Enforces org-specific access

**Setup Required:**
1. Wildcard DNS: `*.yourdomain.com` → Your server
2. Wildcard SSL certificate
3. Set `NODE_ENV=production`

---

## 🔍 URL Detection Logic

### Development Detection
```typescript
// Checks for localhost or 127.0.0.1
if (hostname === 'localhost' || 
    hostname.startsWith('127.0.0.1') || 
    hostname.endsWith('.localhost')) {
  // Development mode
}
```

### Subdomain Extraction
```typescript
// For: millions-fix.localhost
hostname.split('.')[0] // Returns: "millions-fix"

// For: millions-fix.yourdomain.com
hostname.split('.')[0] // Returns: "millions-fix"
```

### Smart Redirect
```typescript
// Check if already on correct subdomain
if (currentSubdomain === orgSlug) {
  return '/'; // Just go home, don't redirect
}

// Need to change subdomain
return `${protocol}//${orgSlug}.${baseDomain}/`;
```

---

## ✅ Quick Test Checklist

- [ ] Register from base domain → Redirects to subdomain
- [ ] Register from subdomain → Stays on subdomain
- [ ] Login from base domain → Redirects to user's org subdomain
- [ ] Login from correct subdomain → Stays on subdomain
- [ ] Login from wrong subdomain → Redirects to user's org subdomain
- [ ] URL never duplicates subdomain
- [ ] Cross-org access is blocked

---

## 🐛 Common Issues & Solutions

### Issue: "Site can't be reached"
**Cause:** Browser doesn't support `.localhost` subdomains  
**Solution:** Use Chrome or Firefox (Safari may not work)

### Issue: URL shows duplicate subdomain
**Cause:** Old code (before fix)  
**Solution:** Refresh browser, clear cache, or restart dev server

### Issue: Stuck on login page after auth
**Cause:** Redirect not working  
**Solution:** Check browser console for errors, verify orgSlug in response

### Issue: Wrong subdomain after login
**Cause:** User belongs to different org  
**Solution:** This is correct! User is redirected to their org

---

## 🎯 Expected Behavior Summary

| Starting URL | User Org | Result URL |
|--------------|----------|------------|
| `localhost:3000/login` | `acme-corp` | `acme-corp.localhost:3000/` ✅ |
| `acme-corp.localhost:3000/login` | `acme-corp` | `acme-corp.localhost:3000/` ✅ |
| `techcorp.localhost:3000/login` | `acme-corp` | `acme-corp.localhost:3000/` ✅ |

**Rule:** Always end up on your organization's subdomain, regardless of where you start.

---

## 📝 Notes for Production

1. **DNS Setup:**
   ```
   Type: A Record
   Name: *
   Value: Your Server IP
   ```

2. **SSL Certificate:**
   - Get wildcard cert: `*.yourdomain.com`
   - Include both `*.yourdomain.com` and `yourdomain.com`

3. **Environment Variables:**
   ```env
   NODE_ENV=production
   JWT_SECRET=your-production-secret
   MONGODB_URI=your-production-db
   ```

4. **Middleware Behavior:**
   - In production: Requires subdomain
   - Returns 400 if no subdomain
   - Validates subdomain exists in database

---

**The fix is complete!** Your subdomain routing now works correctly in all scenarios. 🎉

