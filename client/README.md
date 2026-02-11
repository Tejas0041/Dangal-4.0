# Dangal 4.0 - Macdonald Hall

A modern, visually stunning React web app for the college fest "Dangal 4.0" organized by Macdonald Hall.

## Features

- 🎨 Modern dark theme with bold yellow accents
- ⚡ Built with React + Vite for blazing fast performance
- 🎭 Smooth animations using Framer Motion
- 📱 Fully responsive design (mobile + desktop)
- 🎯 Clean, scalable component architecture
- 🔥 Glassmorphism effects and smooth transitions

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation
- **React Hook Form** - Form handling
- **Zod** - Form validation
- **Radix UI** - Accessible components

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd dangal-4.0
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
client/
├── src/
│   ├── components/     # Reusable components
│   │   ├── ui/        # UI components (buttons, cards, etc.)
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── Countdown.tsx
│   ├── pages/         # Page components
│   │   ├── Home.tsx
│   │   ├── Register.tsx
│   │   └── not-found.tsx
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions
│   ├── assets/        # Images and static files
│   ├── App.tsx        # Main app component
│   ├── main.tsx       # Entry point
│   └── index.css      # Global styles
├── public/            # Public assets
└── index.html         # HTML template
```

## Features Overview

### Hero Section
- Split layout with dramatic typography
- Live countdown timer to event date (Feb 16, 2026)
- Animated Macdonald Hall lion logo
- Floating particles effect

### About Section
- Powerful description of the fest
- Animated statistics cards
- Glassmorphic design

### Events Section
- Grid layout of competition cards
- Kabaddi, Tug of War, Table Tennis
- Hover animations with yellow glow

### Registration
- Modern form with validation
- Stores data in localStorage
- Toast notifications
- Glassmorphic container

### Gallery
- Masonry grid layout
- Hover zoom effects
- Smooth fade animations

### Past Winners
- Trophy showcase cards
- Achievement highlights
- Hover effects

## Customization

### Colors
The primary color scheme is defined in `tailwind.config.ts`:
- Primary: Yellow (#FFD700)
- Background: Black/Dark Grey
- Accent: White

### Fonts
- Headers: Oswald (bold, sporty)
- Body: Montserrat (clean, modern)

### Event Date
Update the countdown date in `client/src/components/Countdown.tsx`

## Deployment

Build the project for production:

```bash
npm run build
```

The built files will be in the `dist` folder, ready to deploy to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

## License

MIT

## Credits

Designed and developed for Macdonald Hall's Dangal 4.0 fest.
