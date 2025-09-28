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

# Build all packages
pnpm build

# Build specific package
pnpm build:widget
pnpm build:admin

# Code formatting
pnpm format         # Format all files
pnpm format:check   # Check formatting
```

## Widget Usage

The widget is built as an embeddable script that can be integrated into any website:

```html
<link rel="stylesheet" href="https://your-cdn.com/video-widget.css" />
<script src="https://your-cdn.com/video-widget.iife.js"></script>
```

The widget will automatically appear in the bottom-right corner of the page.

## Widget Features

- Fixed bottom-right positioning
- Auto-initialization on page load
- Self-contained with no external dependencies
- Responsive design
- Ready for video player integration
