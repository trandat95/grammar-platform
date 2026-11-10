# English Grammar Learning Platform

A comprehensive English grammar learning platform built with **Next.js 14**, **Prisma ORM**, and **Supabase (PostgreSQL)**.

## Overview

This platform provides a structured, bilingual (English/Vietnamese) grammar learning experience based on the textbook *Ngữ pháp tiếng Anh* by Mai Lan Hương & Hà Thanh Uyên.

### Key Features

- 📚 **12 Chapters** covering tenses, clauses, parts of speech, and more
- 📝 **53 Lessons** with structured theory sections
- 🔬 **982 Grammar Rules** with formulas and usage patterns
- 💡 **1,026 Bilingual Examples** (EN/VI)
- ✅ **2,939 Questions** across 134 exercises
- 📊 **2,956 Verified Answers** with explanations
- 🔄 Spaced repetition review scheduling
- 📖 User progress tracking and bookmarks

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **ORM**: Prisma 5
- **Database**: PostgreSQL (Supabase)
- **Deployment**: Vercel

## Project Structure

```
grammar-platform/
├── prisma/              # Prisma schema
├── database/            # SQL migrations and seeds
│   ├── migrations/      # Versioned SQL migrations
│   ├── prisma/          # Prisma schema (mirror)
│   └── seed/            # Seed data scripts
├── importer/            # Python markdown-to-DB importer
├── data/                # Import reports
│   └── reports/         # Migration audit reports
├── docs/                # Documentation
├── tests/               # Python test suite
├── package.json
├── vercel.json
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or Supabase account)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/doanphuongtanthoihiep-crypto/grammar-platform.git
   cd grammar-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

5. Run database migrations:
   ```bash
   npx prisma db push
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

## Database Schema

The platform uses a comprehensive relational schema with 20+ tables. See [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) and [docs/ERD.md](docs/ERD.md) for full documentation.

## Data Import

The `importer/` directory contains Python scripts for extracting structured data from the source Markdown textbook. See [data/reports/IMPORT_REPORT.md](data/reports/IMPORT_REPORT.md) for migration details.

## License

Private project.
