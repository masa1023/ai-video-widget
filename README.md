# AI Video Widget

Monorepo for embeddable video widget and admin dashboard

## Architecture

- **Widget**: Embeddable video player widget for any website
- **Admin**: Management dashboard for tags, site identifiers, and conversion tracking

## Project Structure

```
ai-video-widget/
├── packages/
│   ├── widget/          # Embeddable video widget (Preact + Vite)
│   └── admin/           # Admin dashboard (placeholder)
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.json
```

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
pnpm install
```

### Development Commands

```bash
# Start all packages in development mode
pnpm dev

# Start specific package in development mode
pnpm dev:widget
pnpm dev:admin

# Build all packages
pnpm build

# Build specific package
pnpm build:widget
pnpm build:admin
```
