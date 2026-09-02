type ReceiptItem = {
  name: string
  price: number
  quantity: number
}

type ReceiptDetails = {
  items: ReceiptItem[]
  subtotal: number
  total: number
  discountAmount: number
  hasDiscount: boolean
  chargedAt: Date
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function createReceiptPng({
  items,
  subtotal,
  total,
  discountAmount,
  hasDiscount,
  chargedAt,
}: ReceiptDetails) {
  const canvas = document.createElement('canvas')
  const width = 720
  const height = 560 + items.length * 82 + (hasDiscount ? 72 : 0)
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) return ''

  context.fillStyle = '#fffdf5'
  context.fillRect(0, 0, width, height)

  for (let x = 0; x < width; x += 36) {
    context.fillStyle = x % 72 === 0 ? '#20201f' : '#fffdf5'
    context.fillRect(x, 0, 36, 36)
  }

  context.textAlign = 'center'
  context.fillStyle = '#e12f1d'
  context.font = '700 42px sans-serif'
  context.fillText("GREASY JOE'S", width / 2, 104)
  context.fillStyle = '#20201f'
  context.font = '700 23px monospace'
  context.fillText('DRIVE-IN RECEIPT', width / 2, 140)
  context.font = '18px monospace'
  context.fillStyle = '#706a5f'
  context.fillText(chargedAt.toLocaleString('en-US'), width / 2, 178)

  context.strokeStyle = '#20201f'
  context.lineWidth = 3
  context.setLineDash([10, 8])
  context.beginPath()
  context.moveTo(54, 211)
  context.lineTo(width - 54, 211)
  context.stroke()
  context.setLineDash([])

  let y = 267
  context.textAlign = 'left'
  items.forEach((item) => {
    const label = `${item.quantity}× ${item.name}`
    context.fillStyle = '#20201f'
    context.font = '700 21px monospace'
    context.fillText(
      label.length > 34 ? `${label.slice(0, 31)}...` : label,
      58,
      y,
    )
    context.textAlign = 'right'
    context.fillText(currency.format(item.price * item.quantity), width - 58, y)
    context.textAlign = 'left'
    context.fillStyle = '#706a5f'
    context.font = '16px monospace'
    context.fillText(`${currency.format(item.price)} each`, 58, y + 27)
    y += 82
  })

  context.strokeStyle = '#d9ceb8'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(54, y - 22)
  context.lineTo(width - 54, y - 22)
  context.stroke()

  context.font = '20px monospace'
  context.fillStyle = '#706a5f'
  context.fillText('Subtotal', 58, y + 24)
  context.textAlign = 'right'
  context.fillStyle = '#20201f'
  context.fillText(currency.format(subtotal), width - 58, y + 24)

  if (hasDiscount) {
    y += 44
    context.textAlign = 'left'
    context.fillStyle = '#197552'
    context.fillText('First Responder', 58, y + 24)
    context.textAlign = 'right'
    context.fillText(`-${currency.format(discountAmount)}`, width - 58, y + 24)
  }

  y += 88
  context.fillStyle = '#20201f'
  context.fillRect(54, y - 32, width - 108, 4)
  context.textAlign = 'left'
  context.font = '700 27px sans-serif'
  context.fillText('TOTAL', 58, y + 20)
  context.textAlign = 'right'
  context.fillStyle = '#e12f1d'
  context.font = '700 42px sans-serif'
  context.fillText(currency.format(total), width - 58, y + 22)

  context.textAlign = 'center'
  context.fillStyle = '#16a7b1'
  context.font = '700 20px monospace'
  context.fillText(
    'FAST HANDS · HOT PLATES · HAPPY CUSTOMERS',
    width / 2,
    height - 82,
  )
  context.fillStyle = '#706a5f'
  context.font = '16px monospace'
  context.fillText('Thanks for stopping by!', width / 2, height - 48)

  return canvas.toDataURL('image/png')
}
