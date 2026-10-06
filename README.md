# Credit Management SaaS

A multi-tenant SaaS application for managing lending operations, customers and recurring loan cycles.

## Overview

The application is designed around tenant isolation, authenticated access and financial-domain rules. It demonstrates a production-oriented full-stack architecture using Next.js, Supabase and PostgreSQL.

## Engineering Highlights

- Multi-tenant architecture with database-level isolation
- PostgreSQL Row Level Security (RLS)
- Authenticated tenant onboarding
- Customer and loan management
- Monthly recurring loan cycles
- Dashboard KPIs
- Soft-delete patterns
- Financial calculations designed to avoid JavaScript floating-point money errors
- Zod validation
- Automated tests with Vitest

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase
- PostgreSQL
- Tailwind CSS
- shadcn/ui / Base UI
- Zod
- Vitest

## Architecture

~~~text
Next.js App Router
        │
        ├── Authentication
        ├── Application UI
        ├── Domain / financial logic
        └── Supabase
              ├── PostgreSQL
              ├── Auth
              └── Row Level Security
~~~

## Data Isolation

Every tenant is isolated at the database layer using PostgreSQL RLS. Application queries operate through the authenticated user session rather than relying only on frontend filtering.

## Money Handling

Financial values are represented using database numeric values and dedicated helpers rather than JavaScript floating-point arithmetic.

## Development

Create a local environment file from the required variables and never commit real credentials.

~~~bash
npm install
npm run dev
~~~

Run tests:

~~~bash
npm test
~~~

## Project Status

Active development. The architecture and implementation continue to evolve as additional loan-cycle and financial-domain features are added.

## Security Notes

This public repository intentionally keeps credentials and environment-specific secrets outside source control.

Before deploying, verify that:

- no real customer or financial data is present;
- database migrations contain no production secrets;
- service-role credentials are never exposed client-side;
- third-party assets and dependencies are appropriately licensed.
