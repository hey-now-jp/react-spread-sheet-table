import { useState } from 'react'
import { BasicDemo } from './demos/BasicDemo'
import { EditingDemo } from './demos/EditingDemo'
import { VirtualScrollDemo } from './demos/VirtualScrollDemo'

type DemoPage = 'basic' | 'editing' | 'virtual-scroll'

const pages: ReadonlyArray<{ id: DemoPage; label: string }> = [
  { id: 'basic', label: 'Basic Table' },
  { id: 'editing', label: 'Editing & Validation' },
  { id: 'virtual-scroll', label: 'Virtual Scroll (10k rows)' },
]

export function App() {
  const [activePage, setActivePage] = useState<DemoPage>('basic')

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginTop: 0 }}>SpreadSheet Table Playground</h1>
      <nav style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {pages.map((page) => (
          <button
            type="button"
            key={page.id}
            onClick={() => setActivePage(page.id)}
            style={{
              padding: '8px 16px',
              border: '1px solid #ccc',
              borderRadius: 4,
              background: activePage === page.id ? '#2196f3' : '#fff',
              color: activePage === page.id ? '#fff' : '#333',
              cursor: 'pointer',
              fontWeight: activePage === page.id ? 600 : 400,
            }}
          >
            {page.label}
          </button>
        ))}
      </nav>
      <div>
        {activePage === 'basic' && <BasicDemo />}
        {activePage === 'editing' && <EditingDemo />}
        {activePage === 'virtual-scroll' && <VirtualScrollDemo />}
      </div>
    </div>
  )
}
