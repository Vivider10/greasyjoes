import { useEffect, useMemo, useState } from 'react'
import {
  BadgeDollarSign,
  Check,
  ChevronDown,
  Coffee,
  Download,
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
import { createReceiptPng } from './createReceiptPng'

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

const menuItems: MenuItem[] = [
  {
    id: 'lumberjack-melt',
    name: 'The Lumberjack Melt',
    price: 30,
    category: 'Food',
    description: 'A towering griddled diner melt',
  },
  {
    id: 'classic-burger',
    name: "Joe's Classic Burger",
    price: 30,
    category: 'Food',
    description: 'The drive-in original',
  },
  {
    id: 'ocean-griller',
    name: 'Great Ocean Griller',
    price: 30,
    category: 'Food',
    description: 'Hot off the chrome-top grill',
  },
  {
    id: 'chicken-waffles',
    name: 'Chicken & Waffles',
    price: 30,
    category: 'Food',
    description: 'Crispy, golden and stacked',
  },
  {
    id: 'route-1-dog',
    name: 'Route 1 Dog',
    price: 30,
    category: 'Food',
    description: 'A roadside counter classic',
  },
  {
    id: 'paleto-pierogies',
    name: 'Paleto Fried Pierogies',
    price: 30,
    category: 'Food',
    description: 'Crisp pockets from the fryer',
  },
  {
    id: 'paleto-punch',
    name: 'Paleto Punch',
    price: 15,
    category: 'Drinks',
    description: 'Fruity house punch over ice',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze Slushie',
    price: 15,
    category: 'Drinks',
    description: 'An icy boardwalk refresher',
  },
  {
    id: 'coastal-float',
    name: 'Coastal Cream Float',
    price: 15,
    category: 'Drinks',
    description: 'Creamy, fizzy and cold',
  },
  {
    id: 'northern-brew',
    name: 'Northern Brew Coffee',
    price: 15,
    category: 'Drinks',
    description: 'Fresh diner coffee, all day',
  },
  {
    id: 'dirty-lemonade',
    name: 'Dirty Lemonade',
    price: 15,
    category: 'Drinks',
    description: 'Tart lemonade with a twist',
  },
  {
    id: 'cheesecake',
    name: 'Signature Cheesecake',
    price: 20,
    category: 'Dessert',
    description: 'A thick slice of house favorite',
  },
  {
    id: 'apple-pie',
    name: 'Country Apple Pie',
    price: 20,
    category: 'Dessert',
    description: 'Classic apple pie by the slice',
  },
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
  const [darkMode, setDarkMode] = useState(false)
  const [receiptPng, setReceiptPng] = useState('')
  const [orderComplete, setOrderComplete] = useState(false)

  const catalog = useMemo(() => [...menuItems, ...customItems], [customItems])

  const cartItems = useMemo(
    () =>
      catalog
        .filter((item) => cart[item.id])
        .map((item) => ({ ...item, quantity: cart[item.id] })),
    [cart, catalog],
  )
  const visibleItems = useMemo(
    () =>
      activeCategory === 'All'
        ? catalog
        : catalog.filter((item) => item.category === activeCategory),
    [activeCategory, catalog],
  )
  const categoryCounts = useMemo(
    () => ({
      All: catalog.length,
      Food: catalog.filter((item) => item.category === 'Food').length,
      Drinks: catalog.filter((item) => item.category === 'Drinks').length,
      Dessert: catalog.filter((item) => item.category === 'Dessert').length,
    }),
    [catalog],
  )

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )
  const total = firstResponderDiscount ? Math.round(subtotal * 0.9) : subtotal
  const discountAmount = subtotal - total

  const resetCompletedOrder = () => {
    setOrderComplete(false)
    setReceiptPng('')
  }

  const closeCustomItem = () => {
    setCustomItemOpen(false)
    setCustomError('')
  }

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        setCustomItemOpen(false)
        setCustomError('')
        setReceiptPng('')
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

  const completeOrder = () => {
    if (!itemCount) return
    const png = createReceiptPng({
      items: cartItems,
      subtotal,
      total,
      discountAmount,
      hasDiscount: firstResponderDiscount,
      chargedAt: new Date(),
    })
    setOrderComplete(true)
    setReceiptPng(png)
  }

  const addCustomItem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = customName.trim()
    const price = Number(customPrice)

    if (!name) {
      setCustomError('Enter an item name.')
      return
    }

    if (!Number.isFinite(price) || price <= 0 || price > 9999.99) {
      setCustomError('Enter a price between $0.01 and $9,999.99.')
      return
    }

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
          <div className="shift-status">
            <span className="status-light" />
            Register open
          </div>
          <button
            className="theme-button"
            onClick={() => setDarkMode((current) => !current)}
            aria-pressed={darkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span>{darkMode ? 'Day shift' : 'Night shift'}</span>
          </button>
          <button className="menu-board-button" onClick={() => setMenuOpen(true)}>
            <Eye size={18} />
            Original menu
          </button>
        </div>
      </header>

      <div className="pos-layout">
        <section className="menu-panel" aria-labelledby="menu-heading">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Tap to add</p>
              <h1 id="menu-heading">What can we get started?</h1>
            </div>
            <div className="menu-tools">
              <button
                className="custom-item-button"
                onClick={() => setCustomItemOpen(true)}
              >
                <PlusCircle size={18} />
                Custom item
              </button>
              <span className="item-count-badge">{catalog.length} menu items</span>
            </div>
          </div>

          <div className="category-tabs" role="tablist" aria-label="Menu categories">
            {categories.map(({ name, icon: Icon }) => (
              <button
                className={activeCategory === name ? 'category-tab active' : 'category-tab'}
                key={name}
                onClick={() => setActiveCategory(name)}
                role="tab"
                aria-selected={activeCategory === name}
              >
                <Icon size={19} />
                {name}
                <span>{categoryCounts[name]}</span>
              </button>
            ))}
          </div>

          <div className="menu-grid">
            {visibleItems.map((item, index) => {
              const quantity = cart[item.id] ?? 0
              return (
                <article
                  className={quantity ? 'menu-card selected' : 'menu-card'}
                  key={item.id}
                  style={{ '--delay': `${index * 45}ms` } as React.CSSProperties}
                >
                  <button
                    className="menu-card-add"
                    onClick={() => updateQuantity(item.id, 1)}
                    aria-label={`Add one ${item.name}`}
                  >
                    <span className="card-topline">
                      <span className="menu-number">
                        {String(catalog.indexOf(item) + 1).padStart(2, '0')}
                      </span>
                      {quantity > 0 && (
                        <span className="quantity-pin">×{quantity}</span>
                      )}
                    </span>
                    <strong>{item.name}</strong>
                    <small>{item.description}</small>
                    <span className="menu-price">{currency.format(item.price)}</span>
                    <span className="add-cue">
                      <Plus size={15} /> Add
                    </span>
                  </button>
                  {quantity > 0 && (
                    <button
                      className="quick-remove-button"
                      onClick={() => updateQuantity(item.id, -1)}
                      aria-label={`Remove one ${item.name}`}
                    >
                      <Minus size={14} /> Remove
                    </button>
                  )}
                </article>
              )
            })}
          </div>
        </section>

        <aside className="order-panel" aria-labelledby="order-heading">
          <div className="receipt-paper">
            <div className="receipt-header">
              <div>
                <p className="eyebrow">Order #001</p>
                <h2 id="order-heading">Current order</h2>
              </div>
              {itemCount > 0 && (
                <button className="clear-button" onClick={clearOrder} aria-label="Clear order">
                  <Trash2 size={17} />
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="empty-order">
                <div className="empty-icon"><ReceiptText size={35} /></div>
                <strong>Your counter is clear</strong>
                <p>Tap a menu item to start the order.</p>
                <ChevronDown size={20} className="mobile-only" />
              </div>
            ) : (
              <div className="receipt-items">
                {cartItems.map((item) => (
                  <div className="receipt-line" key={item.id}>
                    <div className="receipt-item-copy">
                      <strong>{item.name}</strong>
                      <span>{currency.format(item.price)} each</span>
                    </div>
                    <div className="quantity-controls" aria-label={`${item.name} quantity`}>
                      <button onClick={() => updateQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}>
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="line-total">{currency.format(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="receipt-summary">
              <div>
                <span>Subtotal</span>
                <strong>{currency.format(subtotal)}</strong>
              </div>
              {firstResponderDiscount && subtotal > 0 && (
                <div className="discount-line">
                  <span>First Responder (10%)</span>
                  <strong>−{currency.format(discountAmount)}</strong>
                </div>
              )}
              <div className="total-line">
                <span>Total</span>
                <strong>{currency.format(total)}</strong>
              </div>
              {firstResponderDiscount && subtotal > 0 && (
                <p className="rounding-note">Discounted total rounded to the nearest whole dollar.</p>
              )}
            </div>
          </div>

          <button
            className={firstResponderDiscount ? 'discount-button active' : 'discount-button'}
            onClick={() => {
              setFirstResponderDiscount((current) => !current)
              resetCompletedOrder()
            }}
            disabled={!itemCount}
            aria-pressed={firstResponderDiscount}
          >
            <span className="discount-icon"><ShieldCheck size={24} /></span>
            <span>
              <strong>First Responder</strong>
              <small>10% off · rounded total</small>
            </span>
            <span className="toggle-track"><span /></span>
          </button>

          {orderComplete ? (
            <div className="order-complete" role="status">
              <span><Check size={25} /></span>
              <div>
                <strong>Order complete!</strong>
                <small>{currency.format(total)} charged successfully</small>
              </div>
              <button onClick={clearOrder}><RotateCcw size={16} /> New</button>
            </div>
          ) : (
            <button className="charge-button" onClick={completeOrder} disabled={!itemCount}>
              <ShoppingBag size={21} />
              Charge {currency.format(total)}
            </button>
          )}
        </aside>
      </div>

      <footer className="pos-footer">
        <span>Greasy POS</span>
        <span>Fast hands. Hot plates. Happy customers.</span>
      </footer>

      {menuOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setMenuOpen(false)}>
          <div className="menu-modal" role="dialog" aria-modal="true" aria-label="Original Greasy Joe's menu" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setMenuOpen(false)} aria-label="Close original menu">
              <X size={20} />
            </button>
            <img src="/greasy-joes-menu.png" alt="Original Greasy Joe's menu board" />
          </div>
        </div>
      )}

      {customItemOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeCustomItem}>
          <div className="custom-item-modal" role="dialog" aria-modal="true" aria-labelledby="custom-item-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={closeCustomItem} aria-label="Close custom item form">
              <X size={20} />
            </button>
            <p className="eyebrow">Open price</p>
            <h2 id="custom-item-title">Add a custom item</h2>
            <p className="modal-intro">Add a one-off item directly to this order.</p>
            <form className="custom-item-form" onSubmit={addCustomItem}>
              <label>
                Item name
                <input
                  autoFocus
                  type="text"
                  value={customName}
                  onChange={(event) => {
                    setCustomName(event.target.value)
                    setCustomError('')
                  }}
                  maxLength={44}
                  placeholder="Side of house sauce"
                />
              </label>
              <label>
                Price
                <span className="price-input-wrap">
                  <span>$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    max="9999.99"
                    step="0.01"
                    value={customPrice}
                    onChange={(event) => {
                      setCustomPrice(event.target.value)
                      setCustomError('')
                    }}
                    placeholder="0.00"
                  />
                </span>
              </label>
              {customError && <p className="form-error" role="alert">{customError}</p>}
              <button className="custom-submit" type="submit">
                <Plus size={19} /> Add to order
              </button>
            </form>
          </div>
        </div>
      )}

      {receiptPng && (
        <div className="modal-backdrop receipt-backdrop" role="presentation" onMouseDown={() => setReceiptPng('')}>
          <div className="receipt-modal" role="dialog" aria-modal="true" aria-labelledby="receipt-preview-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setReceiptPng('')} aria-label="Close receipt preview">
              <X size={20} />
            </button>
            <div className="receipt-modal-heading">
              <div>
                <p className="eyebrow">Payment complete</p>
                <h2 id="receipt-preview-title">Receipt ready</h2>
              </div>
              <span><Check size={18} /> Charged</span>
            </div>
            <div className="receipt-preview-frame">
              <img src={receiptPng} alt={`Receipt for ${currency.format(total)}`} />
            </div>
            <a className="save-receipt-button" href={receiptPng} download={`greasy-joes-receipt-${Date.now()}.png`}>
              <Download size={20} /> Save receipt PNG
            </a>
          </div>
        </div>
      )}
    </main>
  )
}
