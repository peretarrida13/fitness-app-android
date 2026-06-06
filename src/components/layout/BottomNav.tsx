import { NavLink } from 'react-router-dom'
import { Home, Utensils, Dumbbell, TrendingUp, CalendarDays, ListTodo } from 'lucide-react'

const tabs = [
  { to: '/home',     icon: Home,         label: 'Home'     },
  { to: '/meals',    icon: Utensils,     label: 'Meals'    },
  { to: '/gym',      icon: Dumbbell,     label: 'Gym'      },
  { to: '/progress', icon: TrendingUp,   label: 'Progress' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/habits',   icon: ListTodo,     label: 'Habits'   },
]

export function BottomNav() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(17,17,24,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 100,
    }}>
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: '10px 0',
            textDecoration: 'none',
            color: isActive ? 'var(--accent)' : 'var(--text3)',
            fontSize: 10,
            fontWeight: 500,
            transition: 'color 0.15s',
          })}
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
