import React from 'react'

export function Header ({
  currentUser,
  onSwitchRole,
  isSyncing,
  onRefresh,
  particlePaused = false,
  onToggleParticle = () => {}
}) {
  const roles = [
    { label: 'Elena Rostova (RevOps Admin)', email: 'admin@funnel.ai', role: 'revops_admin' },
    { label: 'Sarah Chen (Sales Manager)', email: 'sarah.chen@funnel.ai', role: 'sales_manager' },
    { label: 'Alex Miller (Sales Rep)', email: 'alex.miller@funnel.ai', role: 'sales_rep' },
    { label: 'Jordan Taylor (Sales Rep)', email: 'jordan.taylor@funnel.ai', role: 'sales_rep' }
  ]

  return (
    <header className='navbar'>
      <div className='brand-section'>
        <div className='brand-icon' title='AI Pipeline Intelligence Vector'>⚡</div>
        <div>
          <div className='brand-title'>
            FunnelAI Intelligence
            <span className='brand-pill'>Enterprise 4D</span>
          </div>
          <div className='brand-subtitle'>
            Predictive B2B Pipeline Analytics & Conversion Diagnostics
          </div>
        </div>
      </div>

      <div className='user-nav-section'>
        {/* Live Serving Status */}
        <div className='status-indicator'>
          <span className={`status-dot ${isSyncing ? 'syncing' : 'active'}`} />
          <span>{isSyncing ? 'Model Syncing...' : 'Serving Real-Time ML'}</span>
        </div>

        {/* 4D Particle Field Toggle */}
        <button
          className='btn-secondary'
          onClick={onToggleParticle}
          title='Toggle 4D Particle Telemetry Field (Press P)'
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          {particlePaused ? '▶ Start 4D Field' : '⏸ 4D Field'}
          <span className='kbd-pill'>P</span>
        </button>

        {/* Refresh Button */}
        <button
          className='btn-secondary'
          onClick={onRefresh}
          disabled={isSyncing}
          style={{ padding: '6px 12px', fontSize: '12px' }}
          title='Fetch latest deals and recalculate funnel (Press R)'
        >
          <span style={{ display: 'inline-block', transform: isSyncing ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s ease' }}>
            ↻
          </span>
          {' '}Refresh
          <span className='kbd-pill'>R</span>
        </button>

        {/* Persona Switcher */}
        <div className='role-selector'>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Persona:</span>
          <select
            value={currentUser?.email || ''}
            onChange={(e) => {
              const selected = roles.find(r => r.email === e.target.value)
              if (selected) onSwitchRole(selected.email)
            }}
            aria-label='Select User Role Persona'
          >
            {roles.map(r => (
              <option key={r.email} value={r.email}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Role Badge */}
        <span className='role-badge' title={`Authenticated as ${currentUser?.role || 'User'}`}>
          {currentUser?.role ? currentUser.role.replace('_', ' ').toUpperCase() : 'AUTH'}
        </span>
      </div>
    </header>
  )
}
