# Pricing Calculator 2.0

A Next.js-based pricing calculator web application for Samsara Sales reps, replacing the existing Google Sheets template.

## Features

- **Quote Management**: Create, edit, duplicate, and delete quotes
- **Product Selection**: Search products by name or SKU from pricebook (FY26, FY25, Legacy)
- **Pricing Options**: Support for Upfront, Annual, Quarterly, Financed Monthly, Direct Monthly
- **Discount Management**: Enter discounts directly or use target pricing (auto-calculates discount)
- **Pricing Breakdown**: Calculate Blended Discount, Discount Value, ACV, and License TCV for each payment option
- **Formatted Quotes**: Generate professional quote documents with copy/paste functionality
- **Account Integration**: Auto-populate account data when selecting account name

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript**
- **Tailwind CSS** with Samsara brand colors
- **In-memory data store** (will be replaced with database)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
pricing-calculator-2.0/
├── app/
│   ├── api/              # API routes
│   ├── quotes/           # Quote pages
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main dashboard
├── components/           # React components
├── lib/
│   ├── data/            # Data stores and mock data
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions
└── public/              # Static assets
```

## Mock Data

The application includes mock data for testing:

- **Products**: 15+ products across FY26, FY25, and Legacy pricebooks
- **Accounts**: 8 sample accounts for testing account lookup
- **Quotes**: Start with an empty quote list

## API Endpoints

- `GET /api/user` - Get current user
- `GET /api/quotes` - List all quotes
- `POST /api/quotes` - Create new quote
- `GET /api/quotes/[id]` - Get quote by ID
- `PUT /api/quotes/[id]` - Update quote
- `DELETE /api/quotes/[id]` - Delete quote
- `POST /api/quotes/[id]/duplicate` - Duplicate quote
- `GET /api/products` - Search products (query: `?q=search&pricebook=FY26`)
- `GET /api/accounts` - Search accounts (query: `?q=search`)

## Development Notes

- Currently uses in-memory data store (quotes reset on server restart)
- Authentication uses gap-auth header pattern (falls back to test user in development)
- All quotes are sorted by most recently edited (descending)

## Next Steps

- [ ] Replace in-memory store with database (PostgreSQL)
- [ ] Implement Okta/Google OAuth authentication
- [ ] Add quote sharing functionality
- [ ] Implement SFDC integration
- [ ] Add PDF export functionality
