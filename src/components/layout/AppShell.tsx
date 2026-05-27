import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 72 }}>
      <Outlet />
      <BottomNav />
    </div>
  )
}
