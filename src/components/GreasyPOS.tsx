import { useEffect, useMemo, useState } from 'react'
import {
  BadgeDollarSign,
  Check,
  Coffee,
  Eye,
  Grid2X2,
  Minus,
  Moon,
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
import { recipes } from '../lib/recipes'

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

type CompletedOrder = {
  orderNumber: string
  items: Array<{ id: string; name: string; price: number; quantity: number }>
  total: number
  firstResponder: boolean
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

function calculateOrderIngredients(items: Array<{ id: string; quantity: number }>) {
  const totals: Record<string, number> = {}

  for (const item of items) {
    for (const ingredient of recipes[item.id] ?? []) {
      totals[ingredient.ingredient] =
        (totals[ingredient.ingredient] ?? 0) + ingredient.quantity * item.quantity
    }
  }

  return Object.entries(totals).sort(([a], [b]) => a.localeCompare(b))
}

export default function GreasyPOS() {
  const [cart, setCart] = useState<Cart>({})
  const [customItems, setCustomItems] = useState<MenuItem[]>([])
  const [activeCategory, setActiveCategory] = useState<MenuFilter>('All')
  const [firstResponderDiscount, setFirstResponderDiscount] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [customItemOpen, setCustomItemOpen] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customPrice, setCustomPrice] = useState('')
  const [customError, setCustomError] = useState('')
  const [darkMode, setDarkMode] = useState(true)
  const [orderComplete, setOrderComplete] = useState(false)
  const [showIngredients, setShowIngredients] = useState(false)
  const [currentOrderNumber, setCurrentOrderNumber] = useState('')
  const [orderError, setOrderError] = useState('')
  const [ingredientList, setIngredientList] = useState<Array<[string, number]>>([])

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

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        setCustomItemOpen(false)
        setIngredientList([])
        setCustomError('')
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  const resetCompletedOrder = () => {
    setOrderComplete(false)
    setShowIngredients(false)
    setCurrentOrderNumber('')
    setOrderError('')
    setIngredientList([])
  }

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

  const completeOrder = () => {
    if (!itemCount || orderComplete) return

    try {
      const orderNumber = String(Math.floor(100000 + Math.random() * 900000))
      const orderItems = cartItems.map(({ id, name, price, quantity }) => ({ id, name, price, quantity }))
      const ingredients = calculateOrderIngredients(orderItems)
      const completedOrder: CompletedOrder = {
        orderNumber,
        items: orderItems,
        total,
        firstResponder: firstResponderDiscount,
      }

      // Temporary local storage only. No API, database, Discord, or external service is used.
      window.localStorage.setItem('greasy-joes-last-order', JSON.stringify(completedOrder))
      setCurrentOrderNumber(orderNumber)
      setIngredientList(ingredients)
      setOrderComplete(true)
      setShowIngredients(true)
      setOrderError('')
    } catch (error) {
      console.error(error)
      setOrderError('Unable to complete the order on this device.')
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
              <div className="empty-order"><div className="empty-icon"><ReceiptText size={35} /></div><strong>Your counter is clear</strong><p>Tap a menu item to start the order.</p><span className="mobile-only"><RotateCcw size={20} /></span></div>
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
              <span><Check size={25} /></span><div><strong>Order complete!</strong><small>Order #{currentOrderNumber} · {currency.format(total)}</small></div>
              <button onClick={clearOrder}><RotateCcw size={16} /> New</button>
            </div>
          ) : (
            <button className="charge-button" onClick={completeOrder} disabled={!itemCount}>
              <ShoppingBag size={21} />{`Charge ${currency.format(total)}`}
            </button>
          )}
        </aside>
      </div>

      <footer className="pos-footer"><span>Greasy POS</span><span>Fast hands. Hot plates. Happy customers.</span></footer>

      {menuOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setMenuOpen(false)}>
          <div className="menu-modal" role="dialog" aria-modal="true" aria-label="Original Greasy Joe's menu" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setMenuOpen(false)} aria-label="Close original menu"><X size={20} /></button>
            <img src="/greasy-joes-menu.png" alt="Original Greasy Joe's menu board" />
          </div>
        </div>
      )}

      {customItemOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => { setCustomItemOpen(false); setCustomError('') }}>
          <div className="custom-item-modal" role="dialog" aria-modal="true" aria-labelledby="custom-item-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => { setCustomItemOpen(false); setCustomError('') }} aria-label="Close custom item form"><X size={20} /></button>
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

      {showIngredients && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowIngredients(false)}>
          <section className="custom-item-modal ingredients-modal" role="dialog" aria-modal="true" aria-labelledby="ingredients-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowIngredients(false)} aria-label="Close ingredient list"><X size={20} /></button>
            <p className="eyebrow">Order #{currentOrderNumber}</p>
            <h2 id="ingredients-title">Ingredients needed</h2>
            <p className="modal-intro">Pull these ingredients for the order that was just charged.</p>

            {ingredientList.length > 0 ? (
              <div className="ingredient-list" style={{ marginTop: '1.25rem' }}>
                {ingredientList.map(([ingredient, quantity]) => (
                  <div key={ingredient}><span>{ingredient}</span><strong>{quantity}</strong></div>
                ))}
              </div>
            ) : (
              <div className="ingredient-empty" style={{ marginTop: '1.25rem' }}>No recipe ingredients are assigned to this custom item.</div>
            )}

            <button className="custom-submit" type="button" onClick={() => setShowIngredients(false)} style={{ marginTop: '1.25rem' }}>
              <Check size={19} /> Done
            </button>
          </section>
        </div>
      )}
    </main>
  )
}
