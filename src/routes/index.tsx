import { createFileRoute } from '@tanstack/react-router'
import GreasyPOS from '../components/GreasyPOS'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return <GreasyPOS />
}
