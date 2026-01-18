# Agents Guide

IMPORTANT: Do NOT use npm! This project uses Bun! After code changes then always make sure the project lints and builds!

## Build/Lint/Test Commands

- Dev server: `bun run dev`
- Build: `bun run build`
- Lint: `bun run lint`
- Run all tests: `bun test`
- Run single test: `bun test app/test/[filename].test.ts`
- Prisma: `prisma:generate`, `prisma:migrate`, `prisma:studio`
- DB commands: `db:init`, `db:reset`

## Architecture

- Next.js 14 App Router
- API routes in `app/api/` (tasks, lists, labels, attachments, reminders, search)
- Prisma ORM with SQLite database
- Components: custom + ShadCN UI (`components/ui/`)
- Lib files: `db-utils.ts`, `recurring-utils.ts`, `utils.ts`
- Tests in `app/test/` directory

## Code Style

- ESLint: next/core-web-vitals
- TypeScript: strict mode
- Tailwind CSS: dark mode, CSS variables
- ShadCN UI: New York style, Lucide React icons
- Imports: use `@/` alias for root
- Naming: camelCase (vars/funcs), PascalCase (components)
- Error handling: Zod validation for API routes
- File structure: Next.js app directory

## Tools

- Use context7 MAP for looking up documentation.
- Use chrome-devtools for screenshots, debugging in browser, etc.
