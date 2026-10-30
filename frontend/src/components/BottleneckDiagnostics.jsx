import React, { useState } from 'react'
import { api } from '../services/api.js'

export function BottleneckDiagnostics ({ bottleneckData, currentUser, onRefresh }) {
  const [editingStage, setEditingStage] = useState(null)
  const [conversionPct, setConversionPct] = useState(0.65)
  const [cycleDays, setCycleDays] = useState(10)
  const [maxDays, setMaxDays] = useState(20)
  const [statusMsg, setStatusMsg] = useState(null)

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val || 0)
  }

  const formatPct = (val) => `${((val || 0) * 100).toFixed(0)}%`

  const handleSaveBenchmark = async (stage) => {
    try {
      await api.updateBenchmark(stage, {
        expectedConversionPct: Number(conversionPct),
        expectedCycleDays: Number(cycleDays),
        maxHealthyDays: Number(maxDays)
      })
      setStatusMsg(`Benchmark for ${stage} successfully updated!`)
      setEditingStage(null)
      onRefresh()
    } catch (err) {
      setStatusMsg(`Error: ${err.message}`)
    }
  }

  const bottlenecks = bottleneckData?.activeBottlenecks || []
  const totalRevenueAtRisk = bottleneckData?.totalRevenueAtRisk || 0

  const getSeverityBorder = (sev) => {
    if (sev === 'CRITICAL') return 'var(--accent-rose)'
    if (sev === 'HIGH') return 'var(--accent-amber)'
    return 'var(--accent-cyan)'
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '14px'
      }}
      >
        <div>
          <h2 className='section-title'>Pipeline Bottlenecks & Friction Diagnostics</h2>
          <p className='section-desc'>
            Statistical drop-off detection and stalled deal isolation against historical benchmarks.
          </p>
        </div>
        <div style={{
          backgroundColor: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.35)',
          borderRadius: '12px',
          padding: '10px 18px',
          color: 'var(--accent-rose)',
          fontWeight: '700',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        >
          <span>⚠️ Total Revenue at Risk:</span>
          <span className='tabular-nums' style={{ fontSize: '16px' }}>{formatCurrency(totalRevenueAtRisk)}</span>
        </div>
      </div>

      {statusMsg && (
        <div className='glass-alert glass-alert-info' style={{ padding: '10px 16px', marginBottom: '18px', fontSize: '13px' }}>
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {bottlenecks.length === 0
        ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-glass)'
          }}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎉</div>
            <div style={{ fontWeight: '700', color: '#fff', fontSize: '16px' }}>No Active Bottlenecks Detected</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              All pipeline stages are converting and progressing within normal statistical bounds.
            </div>
          </div>
          )
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {bottlenecks.map(b => (
              <div
                key={b.stage}
                className='bottleneck-card'
                style={{
                  borderLeft: `4px solid ${getSeverityBorder(b.severity)}`
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#fff' }}>{b.label}</h3>
                      <span className={`badge badge-${b.severity === 'CRITICAL' ? 'bottleneck' : b.severity === 'HIGH' ? 'warning' : 'healthy'}`}>
                        {b.severity} SEVERITY
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                      Stage Identifier: <code style={{ color: 'var(--accent-cyan)' }}>{b.stage}</code> &bull; {b.totalDealsInStage} total open deals in stage
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Revenue at Risk
                    </div>
                    <div className='tabular-nums' style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent-rose)' }}>
                      {formatCurrency(b.revenueAtRisk)}
                    </div>
                  </div>
                </div>

                {/* Metric Comparison Strip */}
                <div className='bottleneck-strip'>
                  <div className='bottleneck-stat-box'>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Conversion Rate</div>
                    <div
                      className='tabular-nums'
                      style={{
                        fontSize: '15px',
                        fontWeight: '700',
                        color: b.currentConversionRate < b.benchmarkConversionRate ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                        marginTop: '2px'
                      }}
                    >
                      {formatPct(b.currentConversionRate)} <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>(Target: {formatPct(b.benchmarkConversionRate)})</span>
                    </div>
                  </div>

                  <div className='bottleneck-stat-box'>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Cycle Duration</div>
                    <div
                      className='tabular-nums'
                      style={{
                        fontSize: '15px',
                        fontWeight: '700',
                        color: b.currentAvgDays > b.benchmarkCycleDays ? 'var(--accent-rose)' : '#fff',
                        marginTop: '2px'
                      }}
                    >
                      {b.currentAvgDays} days <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>(Bench: {b.benchmarkCycleDays}d)</span>
                    </div>
                  </div>

                  <div className='bottleneck-stat-box'>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Stalled Deals Count</div>
                    <div
                      className='tabular-nums'
                      style={{
                        fontSize: '15px',
                        fontWeight: '700',
                        color: b.stalledDealsCount > 0 ? 'var(--accent-rose)' : '#fff',
                        marginTop: '2px'
                      }}
                    >
                      {b.stalledDealsCount} deals <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>(&gt;{b.maxHealthyDays} days threshold)</span>
                    </div>
                  </div>
                </div>

                {/* Root Cause & Playbook Cards */}
                <div className='diagnostic-box-grid'>
                  <div className='diagnostic-box root-cause'>
                    <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--accent-rose)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      ⚡ Root Cause Diagnostic
                    </div>
                    <div style={{ fontSize: '13px', color: '#f1f5f9', lineHeight: '1.45' }}>
                      {b.primaryCause}
                    </div>
                  </div>

                  <div className='diagnostic-box playbook'>
                    <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      🛡 Prescriptive Remediation Playbook
                    </div>
                    <div style={{ fontSize: '13px', color: '#f1f5f9', lineHeight: '1.45' }}>
                      {b.recommendedPlaybook}
                    </div>
                  </div>
                </div>

                {/* Stalled Deals Sub-List */}
                {b.stalledDeals?.length > 0 && (
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      At-Risk Stalled Opportunities in Stage:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {b.stalledDeals.map(d => (
                        <span key={d.id} className='stalled-deal-chip'>
                          <span style={{ color: 'var(--accent-rose)' }}>●</span>
                          <strong>{d.title}</strong>
                          <span className='tabular-nums' style={{ color: 'var(--accent-emerald)' }}>({formatCurrency(d.acv)})</span>
                          <span className='tabular-nums' style={{ color: 'var(--accent-amber)', fontSize: '11px' }}>{d.daysInStage}d idle</span>
                          <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Owner: {d.ownerName}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Benchmark Target Editor for RevOps Admin */}
                {currentUser?.role === 'revops_admin' && (
                  <div style={{ marginTop: '18px', borderTop: '1px solid var(--border-glass)', paddingTop: '14px' }}>
                    {editingStage === b.stage
                      ? (
                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          background: 'var(--bg-surface-elevated)',
                          padding: '12px 16px',
                          borderRadius: '10px'
                        }}
                        >
                          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Conv Target (0-1):
                            <input
                              type='number'
                              step='0.05'
                              min='0'
                              max='1'
                              value={conversionPct}
                              onChange={(e) => setConversionPct(e.target.value)}
                              style={{ marginLeft: '6px', padding: '4px 8px', width: '68px', background: 'var(--bg-glass-card)', color: '#fff', border: '1px solid var(--border-glass)', borderRadius: '6px' }}
                            />
                          </label>
                          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Expected Days:
                            <input
                              type='number'
                              value={cycleDays}
                              onChange={(e) => setCycleDays(e.target.value)}
                              style={{ marginLeft: '6px', padding: '4px 8px', width: '68px', background: 'var(--bg-glass-card)', color: '#fff', border: '1px solid var(--border-glass)', borderRadius: '6px' }}
                            />
                          </label>
                          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Max Healthy Days:
                            <input
                              type='number'
                              value={maxDays}
                              onChange={(e) => setMaxDays(e.target.value)}
                              style={{ marginLeft: '6px', padding: '4px 8px', width: '68px', background: 'var(--bg-glass-card)', color: '#fff', border: '1px solid var(--border-glass)', borderRadius: '6px' }}
                            />
                          </label>
                          <button className='btn-primary' onClick={() => handleSaveBenchmark(b.stage)} style={{ fontSize: '11px', padding: '6px 12px' }}>
                            Save Targets
                          </button>
                          <button className='btn-secondary' onClick={() => setEditingStage(null)} style={{ fontSize: '11px', padding: '6px 12px' }}>
                            Cancel
                          </button>
                        </div>
                        )
                      : (
                        <button
                          className='btn-secondary'
                          onClick={() => {
                            setEditingStage(b.stage)
                            setConversionPct(b.benchmarkConversionRate)
                            setCycleDays(b.benchmarkCycleDays)
                            setMaxDays(b.maxHealthyDays)
                          }}
                          style={{ fontSize: '11.5px', padding: '6px 12px' }}
                        >
                          ⚙ Calibrate Stage Benchmark Targets
                        </button>
                        )}
                  </div>
                )}
              </div>
            ))}
          </div>
          )}
    </div>
  )
}
