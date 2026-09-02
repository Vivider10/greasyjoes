# Greasy POS Agent Guide

## Project Overview

Greasy POS is a single-page point-of-sale register for Greasy Joe's Drive-In. It prioritizes fast counter service, large touch targets, clear running totals, and a distinctive 1950s diner presentation based on the supplied menu board.

## Architecture

The app uses TanStack Start with file-based routing and deploys through Netlify's TanStack Start Vite plugin. All current POS behavior is client-side because the requested scope covers one active order and does not require sales persistence, authentication, or a back-office system.

## Key Directories

- `src/components/` contains feature components. `GreasyPOS.tsx` owns the menu catalog, cart state, discount calculation, and interactive register UI.
- `src/routes/` contains TanStack Router routes. The index route renders the register and the root route owns metadata and the HTML shell.
- `src/styles.css` contains global tokens, component styling, responsive breakpoints, motion, and accessibility states.
- `public/` contains static assets, including the original menu image used by the menu-board modal.
- `.netlify/` contains platform-generated context and task output. Do not treat it as application source.

## Coding Conventions

- Use TypeScript and functional React components.
- Keep domain types and static menu data explicit and close to the POS feature unless reuse justifies extraction.
- Use descriptive camelCase names for functions and state; use PascalCase for components and types.
- Keep calculations derived from cart state rather than storing duplicate totals.
- Preserve accessible labels, visible focus states, reduced-motion behavior, and minimum touch-friendly controls.
- Add visual styles through the existing CSS variables and class naming conventions in `src/styles.css`.
- Maintain the deliberate diner palette: cream paper, warm off-black, tomato red, aqua, and mustard.

## Discount Rule

The First Responder button applies a 10% reduction to the subtotal, then rounds the resulting discounted total with `Math.round` to the nearest whole dollar. The receipt displays the difference between the subtotal and that rounded total as the discount amount.

## Menu Data

The menu catalog in `src/components/GreasyPOS.tsx` mirrors the supplied menu image. When changing an item, update its name, category, and price carefully and confirm that the category count and receipt behavior remain correct.

## Commands

- `pnpm dev` starts the local Vite development server.
- `pnpm build` creates the production build.
- `netlify dev --port 8889` runs the app with Netlify's local environment.

Do not add persistent browser storage for sales records. If future requirements introduce order history, reporting, menu administration, or customer records, use Netlify Database with Drizzle rather than local JSON, localStorage, or an external database.
