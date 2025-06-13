# HabibiStay

This repository contains the HabibiStay Next.js project.

## Setup

1. **Install Node.js** (version 18 or newer).
2. **Create environment variables** by copying `habibistay/.env.example` to `habibistay/.env` and filling in the values.
3. **Install dependencies**:

```bash
cd habibistay
npm install
```

4. **Run database migrations** (requires PostgreSQL and the `DATABASE_URL` variable):

```bash
npx prisma migrate deploy
```

5. **Start the development server**:

```bash
npm run dev
```

## Testing

Jest is used for unit and integration tests. After installing dependencies you can run:

```bash
npm test
```

If `npm install` reports that `package.json` is missing, use the minimal example below and place it inside the `habibistay` directory.

```json
{
  "name": "habibistay",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest"
  },
  "dependencies": {
    "next": "14.0.4",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "@prisma/client": "5.13.0"
  },
  "devDependencies": {
    "typescript": "5.4.0",
    "jest": "29.7.0",
    "@types/jest": "29.5.11",
    "ts-jest": "29.1.2",
    "prisma": "5.13.0"
  }
}
```

> **Note**: Installing packages may fail in environments that restrict access to `registry.npmjs.org`. Ensure your network settings allow access to install dependencies.
