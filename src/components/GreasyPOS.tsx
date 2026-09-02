import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BadgeDollarSign,
  Bell,
  Check,
  ChefHat,
  ChevronDown,
  Coffee,
  Eye,
  Grid2X2,
  Minus,
  Moon,
  PackageCheck,
  Plus,
  PlusCircle,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sun,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { calculateIngredients } from '../lib/recipes'

type Category = 'Food' | 'Drinks' | 'Dessert'
type MenuFilter = 'All' | Category

type MenuItem = {
  id: string
  name: string
  price: number
  category: Category
  description: string
}

type Cart = Record<string, number>

type KitchenOrder = {
  id: string
  orderNumber: string
  items: Array<{ id: string; name: string; price: number; quantity: number }>
  subtotal: number
  discount: number
  total: number
  firstResponder: boolean
  status: 'pending' | 'preparing'
  createdAt: string
}

const menuItems: MenuItem[] = [
  { id: 'lumberjack-melt', name: 'The Lumberjack Melt', price: 30, category: 'Food', description: 'A towering griddled diner melt' },
  { id: 'classic-burger', name: "Joe's Classic Burger", price: 30, category: 'Food', description: 'The drive-in original' },
  { id: 'ocean-griller', name: 'Great Ocean Griller', price: 30, category: 'Food', description: 'Hot off the chrome-top grill' },
  { id: 'chicken-waffles', name: 'Chicken & Waffles', price: 30, category: 'Food', description: 'Crispy, golden and stacked' },
  { id: 'route-1-dog', name: 'Route 1 Dog', price: 30, category: 'Food', description: 'A roadside counter classic' },
  { id: 'paleto-pierogies', name: 'Paleto Fried Pierogies', price: 30, category: 'Food', description: 'Crisp pockets from the fryer' },
  { id: 'paleto-punch', name: 'Paleto Punch', price: 15, category: 'Drinks', description: 'Fruity house punch over ice' },
  { id: 'ocean-breeze', name: 'Ocean Breeze Slushie', price: 15, category: 'Drinks', description: 'An icy boardwalk refresher' },
  { id: 'coastal-float', name: 'Coastal Cream Float', price: 15, category: 'Drinks', description: 'Creamy, fizzy and cold' },
  { id: 'northern-brew', name: 'Northern Brew Coffee', price: 15, category: 'Drinks', description: 'Fresh diner coffee, all day' },
  { id: 'dirty-lemonade', name: 'Dirty Lemonade', price: 15, category: 'Drinks', description: 'Tart lemonade with a twist' },
  { id: 'cheesecake', name: 'Signature Cheesecake', price: 20, category: 'Dessert', description: 'A thick slice of house favorite' },
  { id: 'apple-pie', name: 'Country Apple Pie', price: 20, category: 'Dessert', description: 'Classic apple pie by the slice' },
]

const categories: Array<{ name: MenuFilter; icon: typeof UtensilsCrossed }> = [
  { name: 'All', icon: Grid2X2 },
  { name: 'Food', icon: UtensilsCrossed },
  { name: 'Drinks', icon: Coffee },
  { name: 'Dessert', icon: BadgeDollarSign },
]

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function playKitchenChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const context = new AudioContextClass()
    const now = context.currentTime
    const first = context.createOscillator()
    const second = context.createOscillator()
    const gain = context.createGain()
    first.type = 'sine'
    second.type = 'sine'
    first.frequency.setValueAtTime(660, now)
    second.frequency.setValueAtTime(880, now + 0.12)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42)
    first.connect(gain)
    second.connect(gain)
    gain.connect(context.destination)
    first.start(now)
    second.start(now + 0.12)
    first.stop(now + 0.43)
    second.stop(now + 0.43)
    window.setTimeout(() => void context.close(), 700)
  } catch {
    // Browsers can block audio until the user interacts with the page.
  }
}

export default function GreasyPOS() {
  const [cart, setCart] = useState<Cart>({})
  const [customItems, setCustomItems] = useState<MenuItem[]>([])
  const [activeCategory, setActiveCategory] = useState<MenuFilter>('All')
  const [firstResponderDiscount, setFirstResponderDiscount] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [customItemOpen, setCustomItemOpen] = useState(false)
  const [kitchenOpen, setKitchenOpen] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customPrice, setCustomPrice] = useState('')
  const [customError, setCustomError] = useState('')
  const [darkMode, setDarkMode] = useState(true)
  const [orderComplete, setOrderComplete] = useState(false)
  const [currentOrderNumber, setCurrentOrderNumber] = useState('')
  const [orderError, setOrderError] = useState('')
  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>([])
  const [monthToDate, setMonthToDate] = useState(0)
  const [kitchenLoading, setKitchenLoading] = useState(false)
  const [kitchenToast, setKitchenToast] = useState('')
  const knownOrderIds = useRef(new Set<string>())
  const firstKitchenLoad = useRef(true)

  const catalog = useMemo(() => [...menuItems, ...customItems], [customItems])
  const cartItems = useMemo(
    () => catalog.filter((item) => cart[item.id]).map((item) => ({ ...item, quantity: cart[item.id] })),
    [cart, catalog],
  )
  const visibleItems = useMemo(
    () => activeCategory === 'All' ? catalog : catalog.filter((item) => item.category === activeCategory),
    [activeCategory, catalog],
  )
  const categoryCounts = useMemo(() => ({
    All: catalog.length,
    Food: catalog.filter((item) => item.category === 'Food').length,
    Drinks: catalog.filter((item) => item.category === 'Drinks').length,
    Dessert: catalog.filter((item) => item.category === 'Dessert').length,
  }), [catalog])

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = firstResponderDiscount ? Math.round(subtotal * 0.9) : subtotal
  const discountAmount = subtotal - total
  const ingredients = useMemo(() => calculateIngredients(kitchenOrders), [kitchenOrders])

  const resetCompletedOrder = () => {
    setOrderComplete(false)
    setCurrentOrderNumber('')
    setOrderError('')
  }

  const closeCustomItem = () => {
    setCustomItemOpen(false)
    setCustomError('')
  }

  const fetchKitchen = async () => {
    try {
      const response = await fetch('/api/orders', { cache: 'no-store' })
      if (!response.ok) throw new Error('Kitchen service unavailable')
      const data = await response.json() as { orders: KitchenOrder[]; monthToDate: number }
      const newOrders = data.orders.filter((order) => !knownOrderIds.current.has(order.id))

      if (!firstKitchenLoad.current && newOrders.length > 0) {
        playKitchenChime()
        setKitchenToast(newOrders.length === 1 ? `NEW ORDER IN KITCHEN — #${newOrders[0].orderNumber}` : `${newOrders.length} NEW ORDERS IN KITCHEN`)
        window.setTimeout(() => setKitchenToast(''), 4500)
      }

      for (const order of data.orders) knownOrderIds.current.add(order.id)
      firstKitchenLoad.current = false
      setKitchenOrders(data.orders)
      setMonthToDate(Number(data.monthToDate ?? 0))
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    void fetchKitchen()
    const interval = window.setInterval(() => void fetchKitchen(), 3000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        setCustomItemOpen(false)
        setKitchenOpen(false)
        setCustomError('')
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  const updateQuantity = (itemId: string, change: number) => {
    resetCompletedOrder()
    setCart((current) => {
      const nextQuantity = (current[itemId] ?? 0) + change
      if (nextQuantity <= 0) {
        const { [itemId]: removed, ...rest } = current
        void removed
        return rest
      }
      return { ...current, [itemId]: nextQuantity }
    })
  }

  const clearOrder = () => {
    setCart({})
    setCustomItems([])
    setFirstResponderDiscount(false)
    resetCompletedOrder()
  }

  const completeOrder = async () => {
    if (!itemCount || orderComplete) return
    setOrderError('')
    setKitchenLoading(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstResponder: firstResponderDiscount,
          items: cartItems.map(({ id, name, price, quantity }) => ({ id, name, price, quantity })),
        }),
      })
      const data = await response.json() as { error?: string; order?: { orderNumber: string }; monthToDate?: number }
      if (!response.ok || !data.order) throw new Error(data.error ?? 'Unable to send order to the kitchen.')
      setOrderComplete(true)
      setCurrentOrderNumber(data.order.orderNumber)
      setMonthToDate(Number(data.monthToDate ?? monthToDate))
      void fetchKitchen()
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'Unable to send order to the kitchen.')
    } finally {
      setKitchenLoading(false)
    }
  }

  const updateKitchenStatus = async (id: string, status: 'preparing' | 'ready') => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!response.ok) throw new Error('Could not update kitchen order')
      void fetchKitchen()
    } catch (error) {
      console.error(error)
    }
  }

  const addCustomItem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = customName.trim()
    const price = Number(customPrice)
    if (!name) return setCustomError('Enter an item name.')
    if (!Number.isFinite(price) || price <= 0 || price > 9999.99) return setCustomError('Enter a price between $0.01 and $9,999.99.')

    const item: MenuItem = {
      id: `custom-${Date.now()}`,
      name,
      price: Math.round(price * 100) / 100,
      category: 'Food',
      description: 'Custom counter item',
    }
    setCustomItems((current) => [...current, item])
    setCart((current) => ({ ...current, [item.id]: 1 }))
    setCustomName('')
    setCustomPrice('')
    setCustomError('')
    resetCompletedOrder()
    setCustomItemOpen(false)
  }

  return (
    <main className={darkMode ? 'pos-shell dark' : 'pos-shell'}>
      <div className="checker-strip" aria-hidden="true" />

      <header className="pos-header">
        <div className="brand-lockup" aria-label="Greasy POS">
          <span className="brand-kicker">Greasy</span>
          <span className="brand-main">POS</span>
          <span className="brand-arrow">Drive-In Register</span>
        </div>

        <div className="header-actions">
          <div className="shift-status"><span className="status-light" />Register open</div>
          <button className="kitchen-button" onClick={() => setKitchenOpen(true)} aria-label="Open kitchen">
            <ChefHat size={18} /> KITCHEN
            {kitchenOrders.length > 0 && <span className="kitchen-count">{kitchenOrders.length}</span>}
          </button>
          <button className="theme-button" onClick={() => setDarkMode((current) => !current)} aria-pressed={darkMode}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span>{darkMode ? 'Day shift' : 'Night shift'}</span>
          </button>
          <button className="menu-board-button" onClick={() => setMenuOpen(true)}><Eye size={18} />Original menu</button>
        </div>
      </header>

      <div className="pos-layout">
        <section className="menu-panel" aria-labelledby="menu-heading">
          <div className="section-heading-row">
            <div><p className="eyebrow">Tap to add</p><h1 id="menu-heading">What can we get started?</h1></div>
            <div className="menu-tools">
              <button className="custom-item-button" onClick={() => setCustomItemOpen(true)}><PlusCircle size={18} />Custom item</button>
              <span className="item-count-badge">{catalog.length} menu items</span>
            </div>
          </div>

          <div className="category-tabs" role="tablist" aria-label="Menu categories">
            {categories.map(({ name, icon: Icon }) => (
              <button className={activeCategory === name ? 'category-tab active' : 'category-tab'} key={name} onClick={() => setActiveCategory(name)} role="tab" aria-selected={activeCategory === name}>
                <Icon size={19} />{name}<span>{categoryCounts[name]}</span>
              </button>
            ))}
          </div>

          <div className="menu-grid">
            {visibleItems.map((item, index) => {
              const quantity = cart[item.id] ?? 0
              return (
                <article className={quantity ? 'menu-card selected' : 'menu-card'} key={item.id} style={{ '--delay': `${index * 45}ms` } as React.CSSProperties}>
                  <button className="menu-card-add" onClick={() => updateQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}>
                    <span className="card-topline"><span className="menu-number">{String(catalog.indexOf(item) + 1).padStart(2, '0')}</span>{quantity > 0 && <span className="quantity-pin">×{quantity}</span>}</span>
                    <strong>{item.name}</strong><small>{item.description}</small><span className="menu-price">{currency.format(item.price)}</span>
                    <span className="add-cue"><Plus size={15} /> Add</span>
                  </button>
                  {quantity > 0 && <button className="quick-remove-button" onClick={() => updateQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}><Minus size={14} /> Remove</button>}
                </article>
              )
            })}
          </div>
        </section>

        <aside className="order-panel" aria-labelledby="order-heading">
          <div className="receipt-paper">
            <div className="receipt-header">
              <div><p className="eyebrow">{currentOrderNumber ? `Order #${currentOrderNumber}` : 'New order'}</p><h2 id="order-heading">Current order</h2></div>
              {itemCount > 0 && <button className="clear-button" onClick={clearOrder} aria-label="Clear order"><Trash2 size={17} /></button>}
            </div>

            {cartItems.length === 0 ? (
              <div className="empty-order"><div className="empty-icon"><ReceiptText size={35} /></div><strong>Your counter is clear</strong><p>Tap a menu item to start the order.</p><ChevronDown size={20} className="mobile-only" /></div>
            ) : (
              <div className="receipt-items">
                {cartItems.map((item) => (
                  <div className="receipt-line" key={item.id}>
                    <div className="receipt-item-copy"><strong>{item.name}</strong><span>{currency.format(item.price)} each</span></div>
                    <div className="quantity-controls" aria-label={`${item.name} quantity`}><button onClick={() => updateQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}><Minus size={14} /></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}><Plus size={14} /></button></div>
                    <span className="line-total">{currency.format(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="receipt-summary">
              <div><span>Subtotal</span><strong>{currency.format(subtotal)}</strong></div>
              {firstResponderDiscount && subtotal > 0 && <div className="discount-line"><span>First Responder (10%)</span><strong>−{currency.format(discountAmount)}</strong></div>}
              <div className="total-line"><span>Total</span><strong>{currency.format(total)}</strong></div>
              {firstResponderDiscount && subtotal > 0 && <p className="rounding-note">Discounted total rounded to the nearest whole dollar.</p>}
            </div>
          </div>

          <button className={firstResponderDiscount ? 'discount-button active' : 'discount-button'} onClick={() => { setFirstResponderDiscount((current) => !current); resetCompletedOrder() }} disabled={!itemCount} aria-pressed={firstResponderDiscount}>
            <span className="discount-icon"><ShieldCheck size={24} /></span><span><strong>First Responder</strong><small>10% off · rounded total</small></span><span className="toggle-track"><span /></span>
          </button>

          {orderError && <p className="form-error order-error" role="alert">{orderError}</p>}

          {orderComplete ? (
            <div className="order-complete" role="status">
              <span><Check size={25} /></span><div><strong>Sent to kitchen!</strong><small>Order #{currentOrderNumber} · {currency.format(total)} charged</small></div>
              <button onClick={clearOrder}><RotateCcw size={16} /> New</button>
            </div>
          ) : (
            <button className="charge-button" onClick={() => void completeOrder()} disabled={!itemCount || kitchenLoading}>
              <ShoppingBag size={21} />{kitchenLoading ? 'Sending…' : `Charge ${currency.format(total)}`}
            </button>
          )}
        </aside>
      </div>

      <footer className="pos-footer"><span>Greasy POS</span><span>Fast hands. Hot plates. Happy customers.</span></footer>

      {kitchenToast && <div className="kitchen-toast" role="status"><Bell size={20} /><strong>{kitchenToast}</strong></div>}

      {menuOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setMenuOpen(false)}>
          <div className="menu-modal" role="dialog" aria-modal="true" aria-label="Original Greasy Joe's menu" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setMenuOpen(false)} aria-label="Close original menu"><X size={20} /></button>
            <img src="/greasy-joes-menu.png" alt="Original Greasy Joe's menu board" />
          </div>
        </div>
      )}

      {customItemOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeCustomItem}>
          <div className="custom-item-modal" role="dialog" aria-modal="true" aria-labelledby="custom-item-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={closeCustomItem} aria-label="Close custom item form"><X size={20} /></button>
            <p className="eyebrow">Open price</p><h2 id="custom-item-title">Add a custom item</h2><p className="modal-intro">Add a one-off item directly to this order.</p>
            <form className="custom-item-form" onSubmit={addCustomItem}>
              <label>Item name<input autoFocus type="text" value={customName} onChange={(event) => { setCustomName(event.target.value); setCustomError('') }} maxLength={44} placeholder="Side of house sauce" /></label>
              <label>Price<span className="price-input-wrap"><span>$</span><input type="number" inputMode="decimal" min="0.01" max="9999.99" step="0.01" value={customPrice} onChange={(event) => { setCustomPrice(event.target.value); setCustomError('') }} placeholder="0.00" /></span></label>
              {customError && <p className="form-error" role="alert">{customError}</p>}
              <button className="custom-submit" type="submit"><Plus size={19} /> Add to order</button>
            </form>
          </div>
        </div>
      )}

      {kitchenOpen && (
        <div className="modal-backdrop kitchen-backdrop" role="presentation" onMouseDown={() => setKitchenOpen(false)}>
          <section className="kitchen-modal" role="dialog" aria-modal="true" aria-labelledby="kitchen-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="kitchen-heading">
              <div><p className="eyebrow">Live production board</p><h2 id="kitchen-title"><ChefHat size={28} /> KITCHEN</h2></div>
              <div className="kitchen-heading-stats"><span>{kitchenOrders.length} active</span><strong>{currency.format(monthToDate)} month-to-date</strong><button className="modal-close" onClick={() => setKitchenOpen(false)} aria-label="Close kitchen"><X size={20} /></button></div>
            </div>

            <div className="kitchen-grid">
              <div className="kitchen-orders">
                <div className="kitchen-subheading"><span>Orders</span><small>Updates every 3 seconds</small></div>
                {kitchenOrders.length === 0 ? (
                  <div className="kitchen-empty"><PackageCheck size={38} /><strong>Kitchen is clear</strong><p>New charged orders will appear here automatically.</p></div>
                ) : kitchenOrders.map((order) => (
                  <article className="kitchen-ticket" key={order.id}>
                    <div className="kitchen-ticket-head"><strong>#{order.orderNumber}</strong><span>{new Date(order.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></div>
                    <div className="kitchen-ticket-items">{order.items.map((item) => <div key={`${order.id}-${item.id}`}><span>{item.quantity}× {item.name}</span><strong>{currency.format(item.price * item.quantity)}</strong></div>)}</div>
                    <div className="kitchen-ticket-foot"><strong>{currency.format(order.total)}</strong><div><button onClick={() => void updateKitchenStatus(order.id, 'preparing')} disabled={order.status === 'preparing'}>{order.status === 'preparing' ? 'Preparing' : 'Start'}</button><button className="ready-button" onClick={() => void updateKitchenStatus(order.id, 'ready')}><Check size={15} /> Ready</button></div></div>
                  </article>
                ))}
              </div>

              <aside className="ingredient-board">
                <div className="kitchen-subheading"><span>Ingredients needed</span><small>Active orders only</small></div>
                {ingredients.length === 0 ? <div className="ingredient-empty">No ingredients needed yet.</div> : <div className="ingredient-list">{ingredients.map(([ingredient, quantity]) => <div key={ingredient}><span>{ingredient}</span><strong>{quantity}</strong></div>)}</div>}
              </aside>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
