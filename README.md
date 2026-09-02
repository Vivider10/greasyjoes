# Greasy POS

Greasy POS is a simple, touchscreen-friendly point-of-sale interface for Greasy Joe's Drive-In. It includes the complete supplied food, drink, and dessert menu, a live receipt with quantity controls, and a First Responder discount that applies 10% off and rounds the discounted total to the nearest whole dollar.

The visual direction draws directly from the supplied menu board: black-and-white checkerboard trim, warm paper tones, red script-inspired branding, aqua accents, mustard prices, and tactile diner-counter controls.

## Key Features

- Complete 13-item menu organized by Food, Drinks, and Dessert
- One-tap item entry with visible quantities
- Receipt controls for adding, subtracting, and clearing items
- Automatically calculated subtotal and total
- Toggleable 10% First Responder discount with whole-dollar rounding
- Charge confirmation and quick new-order reset
- Modal view of the original supplied menu board
- Responsive layout for register screens, tablets, and phones
- Keyboard-visible focus states and reduced-motion support

## Technology

- TanStack Start and TanStack Router
- React 19 and TypeScript
- Tailwind CSS 4 with a custom global design system
- Lucide React icons
- Netlify deployment through the TanStack Start adapter

## Run Locally

Install dependencies and start the development server:

```bash
pnpm install
pnpm dev
```

The app is available at `http://localhost:3000` by default.

To run with Netlify's local environment, use:

```bash
netlify dev --port 8889
```

## Project Structure

- `src/components/GreasyPOS.tsx` contains menu data, order state, calculations, and all register interactions.
- `src/styles.css` contains the full retro visual system and responsive behavior.
- `src/routes/index.tsx` renders the POS on the home route.
- `src/routes/__root.tsx` defines the document shell and page metadata.
- `public/greasy-joes-menu.png` stores the supplied menu image shown in the reference modal.

No database is required because the current version intentionally manages a single active order in the browser and does not preserve sales or customer records.
