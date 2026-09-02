import { createFileRoute } from '@tanstack/react-router'
import GreasyPOS from '../components/GreasyPOS'
import '../kitchen.css'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return <GreasyPOS />
}
