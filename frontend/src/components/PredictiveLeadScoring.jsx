import React, { useState } from 'react'
import { api } from '../services/api.js'

export function PredictiveLeadScoring ({ deals = [], onSelectDeal, onAdvanceStage = () => {} }) {
  const [filterClass, setFilterClass] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [advancingDealId, setAdvancingDealId] = useState(null)
  const [statusMessage, setStatusMessage] = useState(null)

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val || 0)
  }

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

  const handleAdvanceStage = async (deal) => {
    const nextStage = getNextStage(deal.stage)
    if (!nextStage) return

    setAdvancingDealId(deal.id)
    setStatusMessage(null)
    try {
      await api.updateDealStage(deal.id, {
        stage: nextStage,
        daysInStage: 0,
        status: nextStage === 'CLOSED_WON' ? 'WON' : 'OPEN'
      })
      setStatusMessage(`Successfully moved "${deal.title}" to ${nextStage.replace(/_/g, ' ')}!`)
      onAdvanceStage()
    } catch (err) {
      setStatusMessage(`Error advancing stage: ${err.message}`)
    } finally {
      setAdvancingDealId(null)
    }
  }

  const filtered = deals.filter(d => {
    if (d.status !== 'OPEN') return false
    if (filterClass !== 'ALL' && d.prediction?.classification !== filterClass) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchTitle = d.title.toLowerCase().includes(q)
      const matchAccount = d.account_name.toLowerCase().includes(q)
      if (!matchTitle && !matchAccount) return false
    }
    return true
  })

  return (
    <div className='data-table-container'>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px'
      }}
      >
        <div>
          <h2 className='section-title'>AI Predictive Lead & Opportunity Scoring</h2>
          <p className='section-desc'>
            Supervised machine learning probabilities with local feature attribution and prescriptive next actions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <input
            type='text'
            className='filter-input'
            placeholder='Search deals or accounts...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '220px' }}
          />

          {/* Probability Filter Pill Dropdown */}
          <select
            className='filter-select'
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            aria-label='Filter by Conversion Probability'
          >
            <option value='ALL'>All Opportunities ({deals.filter(d => d.status === 'OPEN').length})</option>
            <option value='HIGH_CONVERSION'>High Conversion (≥70%)</option>
            <option value='MEDIUM_RISK'>Medium Risk (40% - 69%)</option>
            <option value='LOW_CONVERSION'>Low Conversion (&lt;40%)</option>
          </select>
        </div>
      </div>

      {statusMessage && (
        <div className='glass-alert glass-alert-info' style={{ padding: '10px 16px', marginBottom: '16px', fontSize: '12.5px' }}>
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <table className='data-table'>
        <thead>
          <tr>
            <th>Opportunity & Account</th>
            <th>Stage & Duration</th>
            <th>Value (ACV)</th>
            <th>AI Win Probability</th>
            <th>Key Drivers & Risk Factors</th>
            <th>Prescriptive Next Action</th>
            <th>Tactical Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(d => {
            const prob = d.prediction?.probability || 0.5
            const classification = d.prediction?.classification || 'MEDIUM_RISK'
            const badgeType = classification === 'HIGH_CONVERSION' ? 'high' : classification === 'MEDIUM_RISK' ? 'medium' : 'low'
            const positiveDriver = d.prediction?.positiveDrivers?.[0]?.description || 'Normal velocity'
            const negativeRisk = d.prediction?.negativeRisks?.[0]?.description || 'None detected'
            const isStalled = d.days_in_stage > 15
            const nextStage = getNextStage(d.stage)

            return (
              <tr key={d.id}>
                <td>
                  <div style={{ fontWeight: '700', color: '#fff', fontSize: '13.5px' }}>{d.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {d.account_name} &bull; <span style={{ color: 'var(--accent-cyan)' }}>{d.account_industry}</span>
                  </div>
                </td>

                <td>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{d.stage.replace(/_/g, ' ')}</div>
                  <div
                    className='tabular-nums'
                    style={{
                      fontSize: '11px',
                      color: isStalled ? 'var(--accent-rose)' : 'var(--text-dim)',
                      fontWeight: isStalled ? '700' : 'normal',
                      marginTop: '2px'
                    }}
                  >
                    {d.days_in_stage}d in stage {isStalled && '⚠️ Stalled'}
                  </div>
                </td>

                <td style={{ fontWeight: '700', color: 'var(--accent-emerald)', fontSize: '14px' }} className='tabular-nums'>
                  {formatCurrency(d.acv)}
                </td>

                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge badge-${badgeType} tabular-nums`}>
                      {(prob * 100).toFixed(0)}%
                    </span>
                    <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', width: '54px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${prob * 100}%`,
                          backgroundColor: prob >= 0.7 ? 'var(--accent-emerald)' : prob >= 0.4 ? 'var(--accent-amber)' : 'var(--accent-rose)',
                          borderRadius: '3px'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '3px' }}>
                    {classification.replace(/_/g, ' ')}
                  </div>
                </td>

                <td style={{ maxWidth: '240px' }}>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--accent-emerald)',
                    marginBottom: '4px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}
                  >
                    ▲ {positiveDriver}
                  </div>
                  <br />
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--accent-rose)',
                    background: 'rgba(244, 63, 94, 0.08)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}
                  >
                    ▼ {negativeRisk}
                  </div>
                </td>

                <td style={{ maxWidth: '250px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {d.prediction?.nextBestAction || 'Maintain regular stakeholder contact.'}
                  </div>
                </td>

                <td>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      className='btn-primary'
                      onClick={() => onSelectDeal(d)}
                      style={{ fontSize: '11px', padding: '6px 10px' }}
                      title='Launch tactical What-If scenario simulation'
                    >
                      ⚡ What-If
                    </button>
                    {nextStage && (
                      <button
                        className='advance-btn'
                        disabled={advancingDealId === d.id}
                        onClick={() => handleAdvanceStage(d)}
                        title={`Advance deal to ${nextStage.replace(/_/g, ' ')}`}
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
  )
}
