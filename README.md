# AI Desk Support - Multi-Tenant SaaS

A **true multi-tenant SaaS application** built with Next.js, featuring subdomain-based organization isolation and role-based access control.

## 🌟 Key Features

- **🏢 Multi-Tenant Architecture**: Each organization gets its own subdomain (e.g., `acme.yourapp.com`)
- **🔒 Complete Data Isolation**: Organizations can only access their own data
- **👥 Role-Based Access Control**: OWNER, ADMIN, and AGENT roles with hierarchical permissions
- **🔐 Secure Authentication**: JWT-based auth with HTTP-only cookies
- **🎯 Subdomain Routing**: Automatic org detection from subdomain
- **⚡ Modern Stack**: Next.js 15, TypeScript, MongoDB, Tailwind CSS

## 📚 Multi-Tenant Documentation

**👉 See [MULTI_TENANT_GUIDE.md](./MULTI_TENANT_GUIDE.md) for complete architecture and implementation details.**

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance
- pnpm (recommended) or npm

### Installation

1. **Clone and install dependencies:**
```bash
pnpm install
```

2. **Set up environment variables:**
```bash
# Create .env.local file
JWT_SECRET=your-secret-key-here
MONGODB_URI=mongodb://localhost:27017/ai-desk-support
```

3. **Run the development server:**
```bash
pnpm dev
```

### Testing Multi-Tenant Features

1. **Register an organization:**
   - Go to `http://localhost:3000/register`
   - Create an organization (e.g., "Acme Corp")
   - You'll be redirected to `http://acme-corp.localhost:3000`

2. **Access via subdomain:**
   - Use `orgslug.localhost:3000` format
   - Each organization has isolated data
   - Users can only access their org's subdomain

3. **Test different roles:**
   - OWNER: Full access (created during registration)
   - ADMIN: Can manage resources (use `/api/users` to invite)
   - AGENT: Limited access

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
