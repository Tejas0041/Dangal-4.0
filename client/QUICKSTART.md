# Quick Start Guide

## Installation

```bash
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

## Preview Production Build

```bash
npm run preview
```

## Project Features

### Pages
- **Home** (`/`) - Hero section, about, events, gallery, winners
- **Register** (`/register`) - Registration form with validation
- **404** - Custom not found page

### Key Components
- `Navbar` - Responsive navigation with mobile menu
- `Footer` - Site footer with links
- `Countdown` - Live countdown to event date (Feb 16, 2026)

### Styling
- Dark theme with yellow (#FFD700) accents
- Tailwind CSS for utility-first styling
- Framer Motion for smooth animations
- Glassmorphism effects

### Form Handling
- React Hook Form for form state
- Zod for validation
- Data stored in localStorage (frontend only)

## Customization

### Change Event Date
Edit `src/components/Countdown.tsx` and update the target date.

### Change Events
Edit the events array in `src/pages/Home.tsx`.

### Change Colors
Edit `src/index.css` for CSS variables or `tailwind.config.ts` for Tailwind theme.

## Tech Stack
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- React Hook Form + Zod
