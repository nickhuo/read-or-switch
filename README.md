This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

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

## Database Setup

This project uses MySQL. Ensure you have a MySQL server running and a `.env.local` file configured with the following variables:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=read-or-switch
```

### 1. Initialize Schema

Run the migration script to create tables:

```bash
npx tsx src/db/migrate.ts
```

### 2. Seed Data

Start the development server:

```bash
npm run dev
```

Then visit the following API endpoints in your browser or use `curl` to seed the database:

- **Part A:** [http://localhost:3000/api/seed-part-a](http://localhost:3000/api/seed-part-a)
- **Part B:** [http://localhost:3000/api/seed-part-b-new](http://localhost:3000/api/seed-part-b-new)
- **Part C:** [http://localhost:3000/api/seed-part-c-new](http://localhost:3000/api/seed-part-c-new)

These endpoints will reset the respective tables and populate them with initial study data.
