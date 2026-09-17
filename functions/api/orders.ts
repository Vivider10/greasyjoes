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
  status: 'pending' | 'preparing' | 'ready' | 'completed'
  createdAt: string
}

// Temporary storage for the Cloudflare deployment.
// This intentionally uses memory only — no database or external service.
const orders: StoredOrder[] = []

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

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

function monthStart() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).getTime()
}

function monthToDate() {
  const start = monthStart()
  return orders
    .filter((order) => new Date(order.createdAt).getTime() >= start)
    .reduce((sum, order) => sum + order.total, 0)
}

export const onRequestGet: PagesFunction = async () => {
  const activeOrders = orders
    .filter((order) => order.status === 'pending' || order.status === 'preparing')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return json({
    orders: activeOrders,
    monthToDate: monthToDate(),
  })
}

export const onRequestPost: PagesFunction = async ({ request }) => {
  try {
    const body = await request.json() as {
      items?: IncomingItem[]
      firstResponder?: boolean
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return json({ error: 'An order must contain at least one item.' }, 400)
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

    const order: StoredOrder = {
      id: crypto.randomUUID(),
      orderNumber,
      items,
      subtotal,
      discount,
      total,
      firstResponder,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    orders.unshift(order)

    return json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        createdAt: order.createdAt,
      },
      monthToDate: monthToDate(),
    }, 201)
  } catch (error) {
    console.error('Greasy POS order error:', error)
    return json({ error: 'The order service could not complete that request.' }, 500)
  }
}

export const onRequestPatch: PagesFunction = async ({ request }) => {
  try {
    const body = await request.json() as { id?: string; status?: StoredOrder['status'] }
    const allowedStatuses: StoredOrder['status'][] = ['pending', 'preparing', 'ready', 'completed']

    if (!body.id || !body.status || !allowedStatuses.includes(body.status)) {
      return json({ error: 'Invalid order status update.' }, 400)
    }

    const order = orders.find((item) => item.id === body.id)
    if (!order) {
      return json({ error: 'Order not found.' }, 404)
    }

    order.status = body.status

    return json({
      order: {
        id: order.id,
        status: order.status,
      },
    })
  } catch (error) {
    console.error('Greasy POS status error:', error)
    return json({ error: 'The order service could not complete that request.' }, 500)
  }
}
