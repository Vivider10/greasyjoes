import { desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../../db'
import { orders } from '../../db/schema'

const menuPrices: Record<string, number> = {
  'lumberjack-melt': 30,
  'classic-burger': 30,
  'ocean-griller': 30,
  'chicken-waffles': 30,
  'route-1-dog': 30,
  'paleto-pierogies': 30,
  'paleto-punch': 15,
  'ocean-breeze': 15,
  'coastal-float': 15,
  'northern-brew': 15,
  'dirty-lemonade': 15,
  cheesecake: 20,
  'apple-pie': 20,
}

type IncomingItem = {
  id: string
  name: string
  price: number
  quantity: number
}

type StoredOrder = {
  id: string
  orderNumber: string
  items: IncomingItem[]
  subtotal: number
  discount: number
  total: number
  firstResponder: boolean
  status: string
  createdAt: string
}

function monthStart() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

async function getMonthToDate() {
  const [result] = await db
    .select({ total: sql<string>`COALESCE(SUM(${orders.total}), 0)` })
    .from(orders)
    .where(sql`${orders.createdAt} >= ${monthStart()}`)

  return Number(result?.total ?? 0)
}

async function getActiveOrders(): Promise<StoredOrder[]> {
  const rows = await db
    .select()
    .from(orders)
    .where(inArray(orders.status, ['pending', 'preparing']))
    .orderBy(desc(orders.createdAt))

  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.orderNumber,
    items: row.items as IncomingItem[],
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    total: Number(row.total),
    firstResponder: row.firstResponder,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }))
}

function jsonResponse(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export default async function handler(request: Request) {
  try {
    if (request.method === 'GET') {
      return jsonResponse({
        orders: await getActiveOrders(),
        monthToDate: await getMonthToDate(),
      })
    }

    if (request.method === 'POST') {
      const body = (await request.json()) as {
        items?: IncomingItem[]
        firstResponder?: boolean
      }

      if (!Array.isArray(body.items) || body.items.length === 0) {
        return jsonResponse({ error: 'An order must contain at least one item.' }, 400)
      }

      const items = body.items.map((item) => {
        const quantity = Math.max(1, Math.floor(Number(item.quantity)))
        const price = menuPrices[item.id] ?? Number(item.price)

        if (!item.id || !item.name || !Number.isFinite(price) || price <= 0) {
          throw new Error('Invalid order item.')
        }

        return {
          id: item.id,
          name: String(item.name).slice(0, 80),
          price,
          quantity,
        }
      })

      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const firstResponder = body.firstResponder === true
      const total = firstResponder ? Math.round(subtotal * 0.9) : subtotal
      const discount = subtotal - total
      const orderNumber = String(Math.floor(100000 + Math.random() * 900000))

      const [created] = await db
        .insert(orders)
        .values({
          orderNumber,
          items,
          subtotal: subtotal.toFixed(2),
          discount: discount.toFixed(2),
          total: total.toFixed(2),
          firstResponder,
          status: 'pending',
        })
        .returning()

      const monthToDate = await getMonthToDate()
      const webhook = process.env.DISCORD_WEBHOOK_URL

      if (webhook) {
        const lines = items
          .map((item) => `${item.quantity}x ${item.name} — $${(item.price * item.quantity).toFixed(2)}`)
          .join('\n')

        const receipt = [
          `🍔 **GREASY JOE'S — ORDER #${orderNumber}**`,
          `Time: ${new Date().toLocaleString('en-US')}`,
          '',
          lines,
          '',
          `Subtotal: $${subtotal.toFixed(2)}`,
          firstResponder ? `First Responder: -$${discount.toFixed(2)}` : '',
          `**TOTAL: $${total.toFixed(2)}**`,
          `Month-to-date: $${monthToDate.toFixed(2)}`,
        ]
          .filter(Boolean)
          .join('\n')

        try {
          await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: "Greasy Joe's POS",
              content: receipt,
            }),
          })
        } catch (error) {
          console.error('Discord webhook failed:', error)
        }
      } else {
        console.warn('DISCORD_WEBHOOK_URL is not configured.')
      }

      return jsonResponse({
        order: {
          id: created.id,
          orderNumber: created.orderNumber,
          total,
          createdAt: created.createdAt.toISOString(),
        },
        monthToDate,
      }, 201)
    }

    if (request.method === 'PATCH') {
      const body = (await request.json()) as { id?: string; status?: string }
      const allowedStatuses = ['pending', 'preparing', 'ready', 'completed']

      if (!body.id || !body.status || !allowedStatuses.includes(body.status)) {
        return jsonResponse({ error: 'Invalid order status update.' }, 400)
      }

      const [updated] = await db
        .update(orders)
        .set({ status: body.status })
        .where(eq(orders.id, body.id))
        .returning()

      if (!updated) {
        return jsonResponse({ error: 'Order not found.' }, 404)
      }

      return jsonResponse({
        order: {
          id: updated.id,
          status: updated.status,
        },
      })
    }

    return new Response('Method not allowed', { status: 405 })
  } catch (error) {
    console.error('Greasy POS orders function error:', error)
    return jsonResponse({ error: 'The order service could not complete that request.' }, 500)
  }
}

export const config = {
  path: '/api/orders',
}
