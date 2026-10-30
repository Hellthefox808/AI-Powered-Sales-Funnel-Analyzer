import React, { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api.js'

export function PipelineVelocityForecast ({ funnelSummary, refreshTrigger }) {
  const [forecast, setForecast] = useState(null)
  const [reps, setReps] = useState([])

  const loadAnalytics = useCallback(async () => {
    try {
      const [fRes, rRes] = await Promise.all([
        api.getRevenueForecast(),
        api.getRepLeaderboard()
      ])
      setForecast(fRes.forecast)
      setReps(rRes.reps || [])
    } catch {
      // Ignored
    }
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics, refreshTrigger])

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val || 0)
  }

  const formatPct = (val) => `${((val || 0) * 100).toFixed(0)}%`

  const maxForecast = Math.max(
    forecast?.aiPredictedRevenue || 0,
    forecast?.weightedRevenue || 0,
    forecast?.commitRevenue || 0,
    forecast?.bestCaseRevenue || 0,
    1
  )

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 className='section-title'>Pipeline Velocity & Multi-Model Revenue Forecast</h2>
        <p className='section-desc'>
          Mathematical sales throughput ($/day) and multi-model quarterly revenue trajectory comparisons.
        </p>
      </div>

      {/* Pipeline Velocity Equation Callout */}
      <div className='velocity-formula-banner'>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '18px'
        }}
        >
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: '700',
              color: 'var(--accent-cyan)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '6px'
            }}
            >
              Pipeline Velocity Mathematical Formulation
            </div>
            <div style={{
              fontSize: '17px',
              fontWeight: '700',
              color: '#fff',
              fontFamily: 'var(--font-mono)'
            }}
            >
              Velocity = (Qualified Opps × Win Rate % × Average ACV) ÷ Sales Cycle Days
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
              Dynamic daily throughput rate reflecting pipeline acceleration and stage drag.
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Real-Time Daily Velocity
            </div>
            <div className='tabular-nums' style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent-cyan)', letterSpacing: '-0.02em' }}>
              {formatCurrency(funnelSummary?.pipelineVelocity)}
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-dim)' }}> / day</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Forecast 4-Way Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}
      >
        <div className='kpi-card' style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
          <div className='kpi-header'>
            <span className='kpi-title'>AI Predicted Revenue</span>
            <span className='kpi-icon'>🧠</span>
          </div>
          <div className='kpi-value tabular-nums' style={{ color: 'var(--accent-emerald)' }}>
            {formatCurrency(forecast?.aiPredictedRevenue)}
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', margin: '8px 0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((forecast?.aiPredictedRevenue || 0) / maxForecast) * 100}%`, background: 'var(--accent-emerald)' }} />
          </div>
          <div className='kpi-subtext'>Sum of ML-calibrated individual deal probabilities</div>
        </div>

        <div className='kpi-card' style={{ borderLeft: '4px solid var(--accent-blue)' }}>
          <div className='kpi-header'>
            <span className='kpi-title'>Traditional Weighted</span>
            <span className='kpi-icon'>📊</span>
          </div>
          <div className='kpi-value tabular-nums' style={{ color: 'var(--accent-blue)' }}>
            {formatCurrency(forecast?.weightedRevenue)}
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', margin: '8px 0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((forecast?.weightedRevenue || 0) / maxForecast) * 100}%`, background: 'var(--accent-blue)' }} />
          </div>
          <div className='kpi-subtext'>Fixed static stage % multiplier</div>
        </div>

        <div className='kpi-card' style={{ borderLeft: '4px solid var(--accent-indigo)' }}>
          <div className='kpi-header'>
            <span className='kpi-title'>Commit Forecast</span>
            <span className='kpi-icon'>🔒</span>
          </div>
          <div className='kpi-value tabular-nums'>
            {formatCurrency(forecast?.commitRevenue)}
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', margin: '8px 0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((forecast?.commitRevenue || 0) / maxForecast) * 100}%`, background: 'var(--accent-indigo)' }} />
          </div>
          <div className='kpi-subtext'>Procurement & Negotiation stage deals</div>
        </div>

        <div className='kpi-card' style={{ borderLeft: '4px solid var(--accent-amber)' }}>
          <div className='kpi-header'>
            <span className='kpi-title'>Best Case Upside</span>
            <span className='kpi-icon'>🚀</span>
          </div>
          <div className='kpi-value tabular-nums'>
            {formatCurrency(forecast?.bestCaseRevenue)}
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', margin: '8px 0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((forecast?.bestCaseRevenue || 0) / maxForecast) * 100}%`, background: 'var(--accent-amber)' }} />
          </div>
          <div className='kpi-subtext'>Deals with &gt;40% conversion potential</div>
        </div>
      </div>

      {/* Sales Representative Leaderboard */}
      <div className='data-table-container'>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
            Sales Representative Velocity & Performance Leaderboard
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Quota pacing, active pipeline under management, and empirical win conversion rates.
          </p>
        </div>

        <table className='data-table'>
          <thead>
            <tr>
              <th>Representative</th>
              <th>Role</th>
              <th>Active Pipeline</th>
              <th>Closed-Won Revenue</th>
              <th>Win Rate %</th>
              <th>Avg Sales Cycle</th>
              <th>Active Deals</th>
            </tr>
          </thead>
          <tbody>
            {reps.map(r => (
              <tr key={r.id}>
                <td>
                  <div style={{ fontWeight: '700', color: '#fff' }}>{r.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>ID: {r.id.slice(0, 8)}...</div>
                </td>
                <td style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                  {r.role.replace(/_/g, ' ')}
                </td>
                <td style={{ color: 'var(--accent-cyan)', fontWeight: '700' }} className='tabular-nums'>
                  {formatCurrency(r.totalActivePipeline)}
                </td>
                <td style={{ color: 'var(--accent-emerald)', fontWeight: '700' }} className='tabular-nums'>
                  {formatCurrency(r.closedWonRevenue)}
                </td>
                <td>
                  <span className={`badge badge-${r.winRate >= 0.5 ? 'high' : r.winRate >= 0.3 ? 'medium' : 'low'} tabular-nums`}>
                    {formatPct(r.winRate)}
                  </span>
                </td>
                <td className='tabular-nums'>{r.avgCycleDays} days</td>
                <td className='tabular-nums'>{r.activeDealsCount} deals</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
