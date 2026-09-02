# Greasy POS

Greasy POS is a touchscreen-friendly point-of-sale interface for Greasy Joe's Drive-In. It includes the complete menu, live receipts, First Responder pricing, a persistent kitchen queue, automatic ingredient totals, and lightweight staff activity reporting through Discord.

The visual direction draws from the supplied menu board: black-and-white checker trim, warm paper tones, red branding, aqua accents, mustard highlights, and tactile diner-counter controls. Night Shift is the default display mode for darker environments.

## Key Features

- Complete 13-item menu organized by Food, Drinks, and Dessert
- One-tap item entry with visible quantities
- Receipt controls for adding, subtracting, and clearing items
- Automatically calculated subtotal and total
- Toggleable 10% First Responder discount with whole-dollar rounding
- Orders are persisted server-side and sent to the live Kitchen board
- Kitchen board refreshes every 3 seconds and plays a quiet two-tone notification for new orders
- Kitchen automatically totals recipe ingredients needed for active orders
- Orders can be started and marked Ready without deleting their sales record
- Discord receives a short 1995-style staff activity receipt with items, prices, total, and month-to-date sales
- Month-to-date sales are calculated from the current calendar month and therefore reset automatically on the first day of each month
- No receipt image download or browser sales storage
- Modal view of the original supplied menu board
- Responsive layout for register screens, tablets, and phones

## Server-side storage

Orders are stored in Netlify Database using Drizzle ORM. Netlify applies migrations from `netlify/database/migrations/` during deployment, and the app accesses the database through the server-side `/api/orders` function.

The Discord webhook is never placed in client code. Configure it as a Netlify environment variable named `DISCORD_WEBHOOK_URL` with Functions/runtime access. Netlify environment variables are available to Functions at runtime and are the appropriate place for sensitive webhook credentials.

## Netlify setup

This project now requires Netlify Database. Netlify Database is a managed Postgres service and is available on credit-based Netlify plans.

1. In the Netlify project, create/enable a Database for the site.
2. Add `DISCORD_WEBHOOK_URL` in Project configuration → Environment variables. Mark it as a secret if that option is available.
3. Trigger a new deploy after changing the environment variable.
4. The `0001_create_orders` migration will be applied automatically on deployment.

If the project is already connected to GitHub, pushing to `main` will trigger the normal Netlify build/deploy flow.

## Run Locally

Install dependencies and start the development server:

```bash
pnpm install
pnpm dev
```

For the full Netlify environment, including the local database and Functions:

```bash
netlify dev --port 8889
```

## Project Structure

- `src/components/GreasyPOS.tsx` contains register UI, order submission, kitchen polling, and interactions.
- `src/lib/recipes.ts` contains the recipe definitions and ingredient aggregation logic.
- `src/kitchen.css` contains the live kitchen board styling.
- `db/schema.ts` defines the Drizzle order schema.
- `db/index.ts` creates the Netlify Database Drizzle client.
- `netlify/functions/orders.mts` handles order creation, kitchen reads/status changes, monthly totals, and Discord activity posts.
- `netlify/database/migrations/0001_create_orders.sql` creates the persistent orders table and indexes.
- `src/styles.css` contains the main retro visual system.
- `src/routes/index.tsx` renders the POS on the home route.
- `public/greasy-joes-menu.png` stores the supplied menu image shown in the reference modal.
