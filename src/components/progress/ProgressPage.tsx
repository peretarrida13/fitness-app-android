import { useState } from 'react'
import { WeightTab } from './tabs/WeightTab'
import { WorkoutsTab } from './tabs/WorkoutsTab'
import { PRsTab } from './tabs/PRsTab'
import { BodyTab } from './tabs/BodyTab'
import { HealthTab } from './tabs/HealthTab'
import { RunningTab } from './tabs/RunningTab'
import { useAuthStore } from '@/store/useAuthStore'

const TABS = [
  { id: 'weight',   label: 'Weight' },
  { id: 'workouts', label: 'Workouts' },
  { id: 'prs',      label: 'PRs' },
  { id: 'body',     label: 'Body' },
  { id: 'health',   label: 'Health' },
  { id: 'running',  label: 'Running' },
] as const

type TabId = typeof TABS[number]['id']

export function ProgressPage() {
  const [activeTab, setActiveTab] = useState<TabId>('weight')
  const { user } = useAuthStore()

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 16px 0',
      }}>
        <h1 style={{
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 14,
        }}>
          Progress
        </h1>

        {/* Tab strip */}
        <div style={{
          display: 'flex', gap: 0,
          overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--text3)',
                borderBottom: activeTab === tab.id
                  ? '2px solid var(--accent)'
                  : '2px solid transparent',
                transition: 'color 0.15s, border-color 0.15s',
                marginBottom: 0,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px' }}>
        {!user ? (
          <div style={{
            background: 'var(--card)', border: '1px solid var(--edge)',
            borderRadius: 'var(--radius)', padding: '32px 20px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.7 }}>
              Sign in to track your progress, log workouts, and view your Garmin health data.
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'weight'   && <WeightTab />}
            {activeTab === 'workouts' && <WorkoutsTab />}
            {activeTab === 'prs'      && <PRsTab />}
            {activeTab === 'body'     && <BodyTab />}
            {activeTab === 'health'   && <HealthTab />}
            {activeTab === 'running'  && <RunningTab />}
          </>
        )}
      </div>
    </div>
  )
}
