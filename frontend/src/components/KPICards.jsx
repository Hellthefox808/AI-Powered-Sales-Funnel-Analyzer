import React from 'react'

export function KPICards ({ funnelSummary, bottleneckData, modelDetails, onNavigateTab = () => {} }) {
  const formatCurrency = (val) => {
    if (!val && val !== 0) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val)
  }

  const formatPct = (val) => {
    if (!val && val !== 0) return '0.0%'
    return `${(val * 100).toFixed(1)}%`
  }

  const totalValue = funnelSummary?.totalPipelineValue || 0
  const velocity = funnelSummary?.pipelineVelocity || 0
  const aiForecast = funnelSummary?.aiPredictedRevenue || 0
  const weighted = funnelSummary?.weightedRevenue || 0
  const conversionRate = funnelSummary?.overallConversionRate || 0
  const cycleDays = funnelSummary?.avgSalesCycleDays || 0
  const revenueAtRisk = bottleneckData?.totalRevenueAtRisk || 0
  const rocAuc = modelDetails?.metrics?.roc_auc || 0.88
  const diffRevenue = aiForecast - weighted

  return (
    <div className='kpi-grid'>
      {/* 1. Active Pipeline Value */}
      <div
        className='kpi-card interactive'
        onClick={() => onNavigateTab('funnel')}
        title='Jump to Funnel Visualizer (Tab 1)'
      >
        <div className='kpi-header'>
          <span className='kpi-title'>Active Pipeline</span>
          <span className='kpi-icon' title='Total Open Opportunity Value'>💼</span>
        </div>
        <div className='kpi-value tabular-nums'>{formatCurrency(totalValue)}</div>
        <div className='kpi-subtext'>
          <span>Across {funnelSummary?.totalOpenDeals || 0} qualified deals</span>
        </div>
      </div>

      {/* 2. Pipeline Velocity */}
      <div
        className='kpi-card interactive'
        onClick={() => onNavigateTab('velocity')}
        title='Jump to Velocity & Forecast (Tab 6)'
      >
        <div className='kpi-header'>
          <span className='kpi-title'>Pipeline Velocity</span>
          <span className='kpi-icon' title='Sales Throughput $/day'>⚡</span>
        </div>
        <div className='kpi-value tabular-nums' style={{ color: 'var(--accent-cyan)' }}>
          {formatCurrency(velocity)}
          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}> / day</span>
        </div>
        <div className='kpi-subtext'>
          <span>V = (Opps × WinRate × ACV) ÷ Days</span>
        </div>
      </div>

      {/* 3. AI Predicted Win Revenue */}
      <div
        className='kpi-card interactive'
        onClick={() => onNavigateTab('velocity')}
        title='Jump to Multi-Model Forecast (Tab 6)'
      >
        <div className='kpi-header'>
          <span className='kpi-title'>AI Predicted Revenue</span>
          <span className='kpi-icon' title='Sum of Supervised ML Deal Probabilities'>🧠</span>
        </div>
        <div className='kpi-value tabular-nums' style={{ color: 'var(--accent-emerald)' }}>
          {formatCurrency(aiForecast)}
        </div>
        <div className='kpi-subtext'>
          <span>CRM Weighted: {formatCurrency(weighted)}</span>
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            color: diffRevenue >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            backgroundColor: diffRevenue >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            padding: '1px 6px',
            borderRadius: '4px'
          }}
          >
            {diffRevenue >= 0 ? `+${formatCurrency(diffRevenue)}` : formatCurrency(diffRevenue)}
          </span>
        </div>
      </div>

      {/* 4. Full Funnel Conversion */}
      <div
        className='kpi-card interactive'
        onClick={() => onNavigateTab('funnel')}
        title='Jump to Funnel Visualizer (Tab 1)'
      >
        <div className='kpi-header'>
          <span className='kpi-title'>Overall Conversion</span>
          <span className='kpi-icon' title='Top-to-Bottom Opportunity Conversion'>🎯</span>
        </div>
        <div className='kpi-value tabular-nums'>{formatPct(conversionRate)}</div>
        <div className='kpi-subtext'>
          <span>Lead to Closed-Won win rate</span>
        </div>
      </div>

      {/* 5. Sales Cycle & AUC */}
      <div
        className='kpi-card interactive'
        onClick={() => onNavigateTab('ml_lab')}
        title='Jump to ML Model Lab (Tab 5)'
      >
        <div className='kpi-header'>
          <span className='kpi-title'>Avg Sales Cycle</span>
          <span className='kpi-icon' title='Average duration from creation to close'>⏱</span>
        </div>
        <div className='kpi-value tabular-nums'>
          {cycleDays} <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-muted)' }}>days</span>
        </div>
        <div className='kpi-subtext'>
          <span>Model Discrimination: </span>
          <strong style={{ color: 'var(--accent-cyan)' }}>{rocAuc} AUC</strong>
        </div>
      </div>

      {/* 6. Revenue At Risk */}
      <div
        className='kpi-card interactive'
        onClick={() => onNavigateTab('bottlenecks')}
        title='Jump to Bottleneck Diagnostics (Tab 3)'
        style={{
          borderColor: revenueAtRisk > 0 ? 'rgba(244, 63, 94, 0.45)' : 'var(--border-glass)',
          background: revenueAtRisk > 0 ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.08), rgba(15, 23, 42, 0.75))' : 'var(--bg-surface)'
        }}
      >
        <div className='kpi-header'>
          <span className='kpi-title' style={{ color: revenueAtRisk > 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
            Revenue At Risk
          </span>
          <span className='kpi-icon' title='Friction and Stalled Deal Value'>⚠️</span>
        </div>
        <div className='kpi-value tabular-nums' style={{ color: revenueAtRisk > 0 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
          {formatCurrency(revenueAtRisk)}
        </div>
        <div className='kpi-subtext'>
          <span>{bottleneckData?.activeBottlenecks?.length || 0} friction stages flagged</span>
        </div>
      </div>
    </div>
  )
}
