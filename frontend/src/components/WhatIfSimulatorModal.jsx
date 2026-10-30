import React, { useState, useEffect, useRef } from 'react'
import { api } from '../services/api.js'

export function WhatIfSimulatorModal ({ deal, onClose, onRefresh }) {
  const [touches, setTouches] = useState(0)
  const [hasEconBuyer, setHasEconBuyer] = useState(true)
  const [demoDone, setDemoDone] = useState(true)
  const [decisionMakers, setDecisionMakers] = useState(2)
  const [daysSinceTouch, setDaysSinceTouch] = useState(5)
  const [discount, setDiscount] = useState(deal?.discount_pct || 0)

  const [simResult, setSimResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const debounceTimerRef = useRef(null)
  const requestSeqRef = useRef(0)

  // Initialize parameters when deal changes
  useEffect(() => {
    if (deal) {
      setTouches(0)
      setDiscount(deal.discount_pct || 0)
    }
  }, [deal])

  // Debounced simulation runner to prevent network flooding and race conditions
  useEffect(() => {
    if (!deal) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    setLoading(true)
    const currentSeq = ++requestSeqRef.current

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.simulateWhatIf({
          dealId: deal.id,
          additionalTouches: touches,
          hasEconomicBuyer: hasEconBuyer,
          demoCompleted: demoDone,
          decisionMakersEngaged: decisionMakers,
          daysSinceLastTouch: daysSinceTouch,
          discountPct: discount
        })

        // Guard against out-of-order race conditions
        if (currentSeq === requestSeqRef.current) {
          setSimResult(res)
          setError(null)
          setLoading(false)
        }
      } catch (err) {
        if (currentSeq === requestSeqRef.current) {
          setError(err.message)
          setLoading(false)
        }
      }
    }, 160)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [deal, touches, hasEconBuyer, demoDone, decisionMakers, daysSinceTouch, discount])

  // Keyboard accessibility: Escape closes modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!deal) return null

  const baseProb = simResult?.original?.probability ?? deal.prediction?.probability ?? 0.5
  const simProb = simResult?.simulated?.probability ?? baseProb
  const delta = Number((simProb - baseProb).toFixed(3))

  return (
    <div className='modal-overlay' onClick={onClose} role='dialog' aria-modal='true'>
      <div className='modal-content' onClick={(e) => e.stopPropagation()}>
        <div className='modal-header'>
          <div>
            <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em' }}>
              What-If Conversion Simulator
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Simulate tactical sales interventions and observe real-time ML probability shifts.
            </p>
          </div>
          <button className='close-btn' onClick={onClose} title='Close Simulator (Esc)'>✕</button>
        </div>

        {/* Opportunity Card Summary */}
        <div style={{
          marginBottom: '22px',
          padding: '16px 20px',
          backgroundColor: 'var(--bg-surface-elevated)',
          borderRadius: '14px',
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--glass-specular)'
        }}
        >
          <div style={{ fontWeight: '800', color: '#fff', fontSize: '16px' }}>{deal.title}</div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span>Account: <strong style={{ color: 'var(--text-primary)' }}>{deal.account_name}</strong></span>
            <span>&bull;</span>
            <span>Value: <strong style={{ color: 'var(--accent-emerald)' }}>${Number(deal.acv).toLocaleString()}</strong></span>
            <span>&bull;</span>
            <span>Stage: <strong style={{ color: 'var(--accent-cyan)' }}>{deal.stage.replace(/_/g, ' ')}</strong></span>
          </div>
        </div>

        {/* Real-Time Probability Shift Banner */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px',
          textAlign: 'center',
          backgroundColor: 'rgba(5, 8, 15, 0.7)',
          padding: '18px',
          borderRadius: '14px',
          marginBottom: '24px',
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--glass-specular)',
          position: 'relative'
        }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Baseline Win Rate
            </div>
            <div className='tabular-nums' style={{ fontSize: '26px', fontWeight: '800', color: '#94a3b8', marginTop: '2px' }}>
              {(baseProb * 100).toFixed(1)}%
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Simulated Win Rate {loading && <span style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>●</span>}
            </div>
            <div
              className='tabular-nums'
              style={{
                fontSize: '26px',
                fontWeight: '800',
                color: simProb >= 0.7 ? 'var(--accent-emerald)' : simProb >= 0.4 ? 'var(--accent-amber)' : 'var(--accent-rose)',
                marginTop: '2px'
              }}
            >
              {(simProb * 100).toFixed(1)}%
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Projected Shift (&Delta;P)
            </div>
            <div
              className='tabular-nums'
              style={{
                fontSize: '26px',
                fontWeight: '800',
                color: delta > 0 ? 'var(--accent-emerald)' : delta < 0 ? 'var(--accent-rose)' : '#fff',
                marginTop: '2px'
              }}
            >
              {delta > 0 ? `+${(delta * 100).toFixed(1)}%` : `${(delta * 100).toFixed(1)}%`}
            </div>
          </div>
        </div>

        {error && (
          <div className='glass-alert' style={{ padding: '12px 16px', marginBottom: '18px', fontSize: '12.5px' }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* Interactive Parameter Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          <div>
            <div className='slider-group'>
              <label>
                <span>Additional Touchpoints</span>
                <span className='tabular-nums' style={{ color: 'var(--accent-cyan)' }}>+{touches} touches</span>
              </label>
              <input
                type='range'
                min='0'
                max='10'
                value={touches}
                onChange={(e) => setTouches(Number(e.target.value))}
              />
            </div>

            <div className='slider-group'>
              <label>
                <span>Decision Makers Engaged</span>
                <span className='tabular-nums' style={{ color: 'var(--accent-cyan)' }}>{decisionMakers} stakeholders</span>
              </label>
              <input
                type='range'
                min='1'
                max='5'
                value={decisionMakers}
                onChange={(e) => setDecisionMakers(Number(e.target.value))}
              />
            </div>

            <div className='slider-group'>
              <label>
                <span>Days Since Last Touchpoint</span>
                <span className='tabular-nums' style={{ color: daysSinceTouch > 14 ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
                  {daysSinceTouch} days
                </span>
              </label>
              <input
                type='range'
                min='1'
                max='30'
                value={daysSinceTouch}
                onChange={(e) => setDaysSinceTouch(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <div className='slider-group'>
              <label>
                <span>Commercial Discount %</span>
                <span className='tabular-nums' style={{ color: discount > 15 ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
                  {discount}%
                </span>
              </label>
              <input
                type='range'
                min='0'
                max='30'
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
              />
            </div>

            <label className='checkbox-group' style={{ marginTop: '16px' }}>
              <input
                type='checkbox'
                checked={hasEconBuyer}
                onChange={(e) => setHasEconBuyer(e.target.checked)}
              />
              <span>Involve Budget Owner / Economic Buyer (CFO / VP)</span>
            </label>

            <label className='checkbox-group'>
              <input
                type='checkbox'
                checked={demoDone}
                onChange={(e) => setDemoDone(e.target.checked)}
              />
              <span>Complete Architecture / Technical Demo</span>
            </label>
          </div>
        </div>

        {/* Action recommendation */}
        <div style={{
          marginTop: '22px',
          padding: '16px',
          backgroundColor: 'var(--bg-surface-elevated)',
          borderRadius: '12px',
          borderLeft: '4px solid var(--accent-cyan)',
          border: '1px solid var(--border-glass)'
        }}
        >
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: '700', letterSpacing: '0.04em', marginBottom: '4px' }}>
            Simulated Prescriptive Next Action
          </div>
          <div style={{ fontSize: '13px', color: '#fff', lineHeight: '1.45' }}>
            {simResult?.simulated?.nextBestAction || 'Maintain regular stakeholder contact and advance mutual evaluation plan.'}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', gap: '12px' }}>
          <button className='btn-secondary' onClick={onClose}>
            Close Simulation
          </button>
        </div>
      </div>
    </div>
  )
}
