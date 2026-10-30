import React, { useState, useEffect, useCallback } from 'react'
import { api } from './services/api.js'
import { Header } from './components/Header.jsx'
import { KPICards } from './components/KPICards.jsx'
import { FunnelVisualizer } from './components/FunnelVisualizer.jsx'
import { PredictiveLeadScoring } from './components/PredictiveLeadScoring.jsx'
import { WhatIfSimulatorModal } from './components/WhatIfSimulatorModal.jsx'
import { BottleneckDiagnostics } from './components/BottleneckDiagnostics.jsx'
import { InteractionTimeline } from './components/InteractionTimeline.jsx'
import { MLModelLab } from './components/MLModelLab.jsx'
import { PipelineVelocityForecast } from './components/PipelineVelocityForecast.jsx'
import { PipelineParticleCanvas } from './components/PipelineParticleCanvas.jsx'

export default function App () {
  const [activeTab, setActiveTab] = useState('funnel')
  const [currentUser, setCurrentUser] = useState(null)
  const [funnelData, setFunnelData] = useState(null)
  const [deals, setDeals] = useState([])
  const [bottleneckData, setBottleneckData] = useState(null)
  const [modelDetails, setModelDetails] = useState(null)
  const [selectedDealForSim, setSelectedDealForSim] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [particlePaused, setParticlePaused] = useState(false)

  const refreshAllData = useCallback(async () => {
    setIsSyncing(true)
    try {
      const [fData, dData, bData, mData] = await Promise.all([
        api.getFunnel(),
        api.getDeals(),
        api.getBottlenecks(),
        api.getActiveModel()
      ])
      setFunnelData(fData)
      setDeals(dData.deals || [])
      setBottleneckData(bData)
      setModelDetails(mData)
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      setIsSyncing(false)
    }
  }, [])

  const loginAndFetch = useCallback(async (email) => {
    setIsSyncing(true)
    setErrorMessage(null)
    try {
      const loginRes = await api.login(email, 'password123')
      setCurrentUser(loginRes.user)
      localStorage.setItem('funnel_active_email', email)
      await refreshAllData()
    } catch (err) {
      setErrorMessage(`Authentication failed: ${err.message}`)
    } finally {
      setIsSyncing(false)
    }
  }, [refreshAllData])

  // Initialize with persisted persona or default to admin account on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('funnel_active_email') || 'admin@funnel.ai'
    loginAndFetch(savedEmail)
  }, [loginAndFetch])

  // Keyboard navigation shortcuts: 1-6 switch tabs, P toggles 4D particles, R refreshes data
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Don't intercept when user is typing in form controls
      const tag = e.target.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return

      if (e.key === '1') setActiveTab('funnel')
      if (e.key === '2') setActiveTab('leads')
      if (e.key === '3') setActiveTab('bottlenecks')
      if (e.key === '4') setActiveTab('timeline')
      if (e.key === '5') setActiveTab('ml_lab')
      if (e.key === '6') setActiveTab('velocity')
      if (e.key === 'p' || e.key === 'P') setParticlePaused(prev => !prev)
      if (e.key === 'r' || e.key === 'R') refreshAllData()
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [refreshAllData])

  return (
    <>
      {/* 4D Opportunity Particle Telemetry Field */}
      <PipelineParticleCanvas isPaused={particlePaused} density='normal' />

      <div className='app-container'>
        <Header
          currentUser={currentUser}
          onSwitchRole={loginAndFetch}
          isSyncing={isSyncing}
          onRefresh={refreshAllData}
          particlePaused={particlePaused}
          onToggleParticle={() => setParticlePaused(prev => !prev)}
        />

        {errorMessage && (
          <div className='glass-alert'>
            <span><strong>Notice:</strong> {errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Level Executive Metric Strip */}
        <KPICards
          funnelSummary={funnelData?.summary}
          bottleneckData={bottleneckData}
          modelDetails={modelDetails}
          onNavigateTab={setActiveTab}
        />

        {/* Sub-View Navigation Tabs */}
        <nav className='tabs-navigation' aria-label='Main Dashboard Sections'>
          <button
            className={`tab-btn ${activeTab === 'funnel' ? 'active' : ''}`}
            onClick={() => setActiveTab('funnel')}
          >
            <span>📊</span> Funnel Visualizer
            <span className='kbd-pill'>1</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => setActiveTab('leads')}
          >
            <span>🎯</span> Predictive Lead Scoring
            <span className='kbd-pill'>2</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'bottlenecks' ? 'active' : ''}`}
            onClick={() => setActiveTab('bottlenecks')}
          >
            <span>⚠️</span> Bottleneck Diagnostics
            {bottleneckData?.activeBottlenecks?.length > 0 && (
              <span className='tab-badge'>
                {bottleneckData.activeBottlenecks.length}
              </span>
            )}
            <span className='kbd-pill'>3</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <span>⏳</span> Touchpoint Timeline
            <span className='kbd-pill'>4</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'ml_lab' ? 'active' : ''}`}
            onClick={() => setActiveTab('ml_lab')}
          >
            <span>🧠</span> ML Model Lab
            <span className='kbd-pill'>5</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'velocity' ? 'active' : ''}`}
            onClick={() => setActiveTab('velocity')}
          >
            <span>📈</span> Velocity & Forecast
            <span className='kbd-pill'>6</span>
          </button>
        </nav>

        {/* Main Tab Content Display */}
        <main>
          {activeTab === 'funnel' && (
            <FunnelVisualizer
              stages={funnelData?.stages || []}
              deals={deals}
              onSelectDeal={(deal) => setSelectedDealForSim(deal)}
              onAdvanceStage={refreshAllData}
            />
          )}

          {activeTab === 'leads' && (
            <PredictiveLeadScoring
              deals={deals}
              onSelectDeal={(deal) => setSelectedDealForSim(deal)}
              onAdvanceStage={refreshAllData}
            />
          )}

          {activeTab === 'bottlenecks' && (
            <BottleneckDiagnostics
              bottleneckData={bottleneckData}
              currentUser={currentUser}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'timeline' && (
            <InteractionTimeline
              deals={deals}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'ml_lab' && (
            <MLModelLab
              modelDetails={modelDetails}
              currentUser={currentUser}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'velocity' && (
            <PipelineVelocityForecast
              funnelSummary={funnelData?.summary}
              refreshTrigger={isSyncing}
            />
          )}
        </main>

        {/* What-If Simulator Modal */}
        {selectedDealForSim && (
          <WhatIfSimulatorModal
            deal={selectedDealForSim}
            onClose={() => setSelectedDealForSim(null)}
            onRefresh={refreshAllData}
          />
        )}
      </div>
    </>
  )
}
