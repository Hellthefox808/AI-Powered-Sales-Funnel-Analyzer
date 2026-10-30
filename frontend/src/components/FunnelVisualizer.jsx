import React, { useState } from 'react'
import { api } from '../services/api.js'

export function FunnelVisualizer ({ stages = [], deals = [], onSelectDeal, onAdvanceStage = () => {} }) {
  const [selectedStage, setSelectedStage] = useState(null)
  const [advancingDealId, setAdvancingDealId] = useState(null)
  const [actionMsg, setActionMsg] = useState(null)

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val || 0)
  }

  const formatPct = (val) => `${((val || 0) * 100).toFixed(0)}%`

  const maxCount = Math.max(...stages.map(s => s.count), 1)

  // Support both OPEN deals for active pipeline stages and WON deals for CLOSED_WON
  const filteredDeals = selectedStage
    ? deals.filter(d => d.stage === selectedStage && (selectedStage === 'CLOSED_WON' ? d.status === 'WON' : d.status === 'OPEN'))
    : []

  const colors = [
    { start: '#0284c7', end: '#38bdf8' }, // Cyan (Lead Captured)
    { start: '#2563eb', end: '#60a5fa' }, // Blue (Qualified)
    { start: '#4f46e5', end: '#818cf8' }, // Indigo (Discovery & Scoping)
    { start: '#7c3aed', end: '#a78bfa' }, // Purple (Proposal Sent)
    { start: '#d97706', end: '#f59e0b' }, // Amber (Procurement & Negotiation)
    { start: '#059669', end: '#10b981' } // Emerald (Closed Won)
  ]

  const stageSequence = [
    'LEAD_CAPTURED',
    'QUALIFIED',
    'DISCOVERY_CALL',
    'PROPOSAL_SENT',
    'NEGOTIATION',
    'CLOSED_WON'
  ]

  const getNextStage = (currentStage) => {
    const idx = stageSequence.indexOf(currentStage)
    if (idx >= 0 && idx < stageSequence.length - 1) {
      return stageSequence[idx + 1]
    }
    return null
  }

  const handleAdvanceDeal = async (deal) => {
    const nextStage = getNextStage(deal.stage)
    if (!nextStage) return

    setAdvancingDealId(deal.id)
    setActionMsg(null)
    try {
      await api.updateDealStage(deal.id, {
        stage: nextStage,
        daysInStage: 0,
        status: nextStage === 'CLOSED_WON' ? 'WON' : 'OPEN'
      })
      setActionMsg(`Advanced "${deal.title}" to ${nextStage.replace(/_/g, ' ')}!`)
      onAdvanceStage()
    } catch (err) {
      setActionMsg(`Failed to advance deal: ${err.message}`)
    } finally {
      setAdvancingDealId(null)
    }
  }

  return (
    <div className='funnel-container'>
      <div className='funnel-header'>
        <div>
          <h2 className='section-title'>Interactive Sales Funnel Pipeline</h2>
          <p className='section-desc'>
            Stage-by-stage opportunity volume, conversion drop-offs, and empirical cycle duration vs benchmarks.
          </p>
        </div>
        {selectedStage && (
          <button
            className='btn-secondary'
            onClick={() => setSelectedStage(null)}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            Clear Stage Filter ({stages.find(s => s.stage === selectedStage)?.label}) ✕
          </button>
        )}
      </div>

      {actionMsg && (
        <div className='glass-alert glass-alert-info' style={{ padding: '10px 16px', marginBottom: '16px', fontSize: '12.5px' }}>
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Connected Tapered Geometry Sales Funnel SVG */}
      <div className='funnel-svg-shell'>
        <svg
          viewBox='0 0 860 110'
          style={{ width: '100%', maxWidth: '840px', height: 'auto', overflow: 'visible' }}
          role='img'
          aria-label='Sales Funnel Stage Flow Diagram'
        >
          <defs>
            {stages.map((st, idx) => (
              <linearGradient
                key={st.stage}
                id={`funnel-grad-${st.stage}`}
                x1='0%'
                y1='0%'
                x2='100%'
                y2='100%'
              >
                <stop offset='0%' stopColor={colors[idx % colors.length].start} stopOpacity='0.85' />
                <stop offset='100%' stopColor={colors[idx % colors.length].end} stopOpacity='0.95' />
              </linearGradient>
            ))}
            <filter id='funnel-glow' x='-20%' y='-20%' width='140%' height='140%'>
              <feGaussianBlur stdDeviation='3' result='blur' />
              <feComposite in='SourceGraphic' in2='blur' operator='over' />
            </filter>
          </defs>

          {stages.map((stage, idx) => {
            const count = stages.length
            const segmentW = 820 / count
            const xLeft = 20 + idx * segmentW
            const isSelected = selectedStage === stage.stage

            // Tapered heights from wide mouth (entry) to narrow neck (won)
            const leftH = Math.max(40, 92 - idx * 8)
            const rightH = Math.max(34, 92 - (idx + 1) * 8)

            const yTopLeft = (110 - leftH) / 2
            const yBottomLeft = yTopLeft + leftH
            const yTopRight = (110 - rightH) / 2
            const yBottomRight = yTopRight + rightH

            const arrowOverlap = idx < count - 1 ? 12 : 0
            const xRight = xLeft + segmentW - 4 + arrowOverlap

            // Chevron tapered polygon path connecting seamlessly to adjacent stages
            const pathData = idx === count - 1
              ? `M ${xLeft} ${yTopLeft} L ${xRight - 4} ${yTopRight} Q ${xRight} ${yTopRight + rightH / 2} ${xRight - 4} ${yBottomRight} L ${xLeft} ${yBottomLeft} Z`
              : `M ${xLeft} ${yTopLeft} L ${xRight - 10} ${yTopRight} L ${xRight} ${yTopRight + rightH / 2} L ${xRight - 10} ${yBottomRight} L ${xLeft} ${yBottomLeft} Z`

            return (
              <g
                key={stage.stage}
                style={{ cursor: 'pointer', transition: 'all 0.25s ease' }}
                onClick={() => setSelectedStage(isSelected ? null : stage.stage)}
              >
                <path
                  d={pathData}
                  fill={`url(#funnel-grad-${stage.stage})`}
                  opacity={isSelected ? 1.0 : selectedStage ? 0.38 : 0.82}
                  stroke={isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.18)'}
                  strokeWidth={isSelected ? 2.5 : 1}
                  filter={isSelected ? 'url(#funnel-glow)' : 'none'}
                />

                <text
                  x={xLeft + segmentW / 2 - 2}
                  y={55 - 6}
                  textAnchor='middle'
                  fill='#ffffff'
                  fontSize='11.5'
                  fontWeight='700'
                  style={{ pointerEvents: 'none', userSelect: 'none', letterSpacing: '-0.01em' }}
                >
                  {stage.label.split(' ')[0]}
                </text>

                <text
                  x={xLeft + segmentW / 2 - 2}
                  y={55 + 11}
                  textAnchor='middle'
                  fill='rgba(255, 255, 255, 0.88)'
                  fontSize='10.5'
                  fontWeight='600'
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {stage.count} {stage.count === 1 ? 'deal' : 'deals'}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Funnel Stage Rows with Detailed Progression */}
      <div className='funnel-stages-list'>
        {stages.map((stage, idx) => {
          const widthPct = Math.max(18, (stage.count / maxCount) * 100)
          const isSelected = selectedStage === stage.stage
          const colorPair = colors[idx % colors.length]
          const isBottleneck = stage.healthStatus === 'BOTTLENECK'

          // Use real empirical drop-off rate from backend
          const dropOffPct = Math.round((stage.dropOffRate || (1.0 - (stage.conversionRate || 0))) * 100)

          return (
            <div key={stage.stage}>
              <div
                className={`funnel-stage-row ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedStage(isSelected ? null : stage.stage)}
                style={{
                  borderLeft: isBottleneck ? '4px solid var(--accent-rose)' : undefined
                }}
              >
                <div>
                  <div className='stage-info-title'>{stage.label}</div>
                  <div className='stage-info-meta tabular-nums'>
                    {stage.count} {stage.count === 1 ? 'deal' : 'deals'} &bull; {formatCurrency(stage.totalValue)}
                  </div>
                </div>

                <div className='stage-bar-wrapper'>
                  <div
                    className='stage-bar-fill'
                    style={{
                      width: `${widthPct}%`,
                      background: `linear-gradient(90deg, ${colorPair.start}, ${colorPair.end})`
                    }}
                  >
                    <span className='tabular-nums'>{formatCurrency(stage.totalValue)}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Conv. Rate</div>
                  <div
                    className='tabular-nums'
                    style={{
                      fontWeight: '800',
                      fontSize: '14.5px',
                      color: isBottleneck ? 'var(--accent-rose)' : 'var(--text-primary)'
                    }}
                  >
                    {formatPct(stage.conversionRate)}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                    Target: {formatPct(stage.benchmarkConversion)}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Cycle</div>
                  <div className='tabular-nums' style={{ fontWeight: '800', fontSize: '14.5px', color: '#fff' }}>
                    {stage.avgDays}d
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                    Bench: {stage.benchmarkDays}d (max {stage.maxHealthyDays}d)
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`badge badge-${stage.healthStatus.toLowerCase()}`}>
                    {stage.healthStatus}
                  </span>
                </div>
              </div>

              {/* Conversion leakage between stages using true empirical drop-off */}
              {idx < stages.length - 1 && (
                <div className='stage-dropoff-connector'>
                  <span>&darr;</span>
                  <span className='stage-dropoff-pill'>
                    Leakage: -{dropOffPct}% Drop-off
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected Stage Deals Drill-Down Table */}
      {selectedStage && (
        <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-glass)', paddingTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Deals in Stage: <span style={{ color: 'var(--accent-cyan)' }}>{stages.find(s => s.stage === selectedStage)?.label}</span> ({filteredDeals.length})
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Click Simulate for What-If scenario or Advance to move stage forward
            </span>
          </div>

          {filteredDeals.length === 0
            ? (
              <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-glass-card)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No deals currently in this stage.
              </div>
              )
            : (
              <div className='data-table-container' style={{ padding: '0', background: 'transparent', boxShadow: 'none' }}>
                <table className='data-table'>
                  <thead>
                    <tr>
                      <th>Deal Title</th>
                      <th>Account & Industry</th>
                      <th>ACV</th>
                      <th>Days in Stage</th>
                      <th>AI Win Prob</th>
                      <th>Account Owner</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeals.map(d => {
                      const prob = d.prediction?.probability || 0.5
                      const classification = d.prediction?.classification || 'MEDIUM_RISK'
                      const isStalled = d.days_in_stage > 15
                      const nextStage = getNextStage(d.stage)

                      return (
                        <tr key={d.id}>
                          <td>
                            <div style={{ fontWeight: '700', color: '#fff' }}>{d.title}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>ID: {d.id.slice(0, 8)}...</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: '600' }}>{d.account_name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>{d.account_industry}</div>
                          </td>
                          <td style={{ color: 'var(--accent-emerald)', fontWeight: '700' }} className='tabular-nums'>
                            {formatCurrency(d.acv)}
                          </td>
                          <td>
                            <span
                              className='tabular-nums'
                              style={{
                                color: isStalled ? 'var(--accent-rose)' : 'inherit',
                                fontWeight: isStalled ? '700' : 'normal'
                              }}
                            >
                              {d.days_in_stage} days {isStalled && '⚠️ Stalled'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${classification === 'HIGH_CONVERSION' ? 'high' : classification === 'MEDIUM_RISK' ? 'medium' : 'low'}`}>
                              {(prob * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td>{d.owner_name}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <button
                                className='btn-primary'
                                onClick={() => onSelectDeal(d)}
                                style={{ fontSize: '11px', padding: '5px 10px' }}
                                title='Launch What-If conversion simulation'
                              >
                                ⚡ What-If
                              </button>
                              {nextStage && (
                                <button
                                  className='advance-btn'
                                  disabled={advancingDealId === d.id}
                                  onClick={() => handleAdvanceDeal(d)}
                                  title={`Advance to ${nextStage.replace(/_/g, ' ')}`}
                                >
                                  {advancingDealId === d.id ? '...' : 'Advance ➔'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              )}
        </div>
      )}
    </div>
  )
}
