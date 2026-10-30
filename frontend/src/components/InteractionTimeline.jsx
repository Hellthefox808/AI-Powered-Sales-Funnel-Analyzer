import React, { useState, useEffect } from 'react'
import { api } from '../services/api.js'

export function InteractionTimeline ({ deals = [], onRefresh }) {
  const [selectedDealId, setSelectedDealId] = useState('')
  const [dealDetail, setDealDetail] = useState(null)
  const [filterType, setFilterType] = useState('ALL')
  const [showAddForm, setShowAddForm] = useState(false)

  // New touchpoint form state
  const [touchContactId, setTouchContactId] = useState('')
  const [touchType, setTouchType] = useState('DEMO_CALL')
  const [touchSentiment, setTouchSentiment] = useState('POSITIVE')
  const [touchNotes, setTouchNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [statusMsg, setStatusMsg] = useState(null)

  useEffect(() => {
    if (deals.length > 0 && !selectedDealId) {
      setSelectedDealId(deals[0].id)
    }
  }, [deals, selectedDealId])

  useEffect(() => {
    if (selectedDealId) {
      loadDealDetail(selectedDealId)
    }
  }, [selectedDealId])

  const loadDealDetail = async (id) => {
    try {
      const res = await api.getDealById(id)
      setDealDetail(res)
      if (res.contacts && res.contacts.length > 0) {
        setTouchContactId(res.contacts[0].id)
      } else {
        setTouchContactId('')
      }
    } catch {
      // Ignored
    }
  }

  const handleCreateTouchpoint = async (e) => {
    e.preventDefault()
    if (!touchNotes.trim()) return

    setSubmitting(true)
    setStatusMsg(null)
    try {
      await api.addInteraction(selectedDealId, {
        contactId: touchContactId || null,
        type: touchType,
        sentiment: touchSentiment,
        notes: touchNotes
      })
      setStatusMsg('Buyer touchpoint successfully recorded and incorporated into ML feature graph!')
      setTouchNotes('')
      setShowAddForm(false)
      loadDealDetail(selectedDealId)
      onRefresh()
    } catch (err) {
      setStatusMsg(`Error: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const interactions = dealDetail?.interactions || []
  const contacts = dealDetail?.contacts || []
  const filteredInteractions = filterType === 'ALL'
    ? interactions
    : interactions.filter(i => i.type === filterType)

  return (
    <div className='data-table-container'>
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
          <h2 className='section-title'>Buyer Touchpoint & Interaction Timeline</h2>
          <p className='section-desc'>
            Chronological multi-channel buyer touchpoints directly influencing predictive win probabilities.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Select Opportunity */}
          <select
            className='filter-select'
            value={selectedDealId}
            onChange={(e) => setSelectedDealId(e.target.value)}
            aria-label='Select Opportunity to View Timeline'
          >
            {deals.map(d => (
              <option key={d.id} value={d.id}>
                {d.title} (${Number(d.acv).toLocaleString()})
              </option>
            ))}
          </select>

          {/* Filter by Type */}
          <select
            className='filter-select'
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label='Filter Touchpoint by Channel Type'
          >
            <option value='ALL'>All Touchpoint Types</option>
            <option value='EMAIL_SENT'>Email Sent</option>
            <option value='EMAIL_REPLY'>Email Reply</option>
            <option value='DISCOVERY_CALL'>Discovery Call</option>
            <option value='DEMO_CALL'>Demo Call</option>
            <option value='PROPOSAL_REVIEW'>Proposal Review</option>
            <option value='EXECUTIVE_SPONSOR_MEETING'>Executive Sponsor Meeting</option>
            <option value='CONTRACT_REDLINE'>Contract Redline</option>
          </select>

          {/* New Touchpoint Button */}
          <button
            className='btn-primary'
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ fontSize: '12px', padding: '8px 14px' }}
          >
            {showAddForm ? '✕ Cancel' : '+ Log Touchpoint'}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className='glass-alert glass-alert-info' style={{ padding: '10px 16px', marginBottom: '18px', fontSize: '13px' }}>
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Log Touchpoint Form Drawer with Contact Selector */}
      {showAddForm && (
        <form onSubmit={handleCreateTouchpoint} className='timeline-form-card'>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '14px' }}>
            Record Buyer Interaction for: <span style={{ color: 'var(--accent-cyan)' }}>{dealDetail?.deal?.title}</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
            {/* Participating Stakeholder Contact */}
            <div>
              <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                Participating Contact
              </label>
              <select
                className='filter-select'
                value={touchContactId}
                onChange={(e) => setTouchContactId(e.target.value)}
                style={{ width: '100%', marginTop: '6px' }}
              >
                <option value=''>No specific contact</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.role_title}) {c.is_economic_buyer ? '★ Economic Buyer' : c.is_champion ? '✔ Champion' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Channel Type */}
            <div>
              <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                Touchpoint Channel Type
              </label>
              <select
                className='filter-select'
                value={touchType}
                onChange={(e) => setTouchType(e.target.value)}
                style={{ width: '100%', marginTop: '6px' }}
              >
                <option value='DEMO_CALL'>Demo Call</option>
                <option value='DISCOVERY_CALL'>Discovery Call</option>
                <option value='EMAIL_SENT'>Email Sent</option>
                <option value='EMAIL_REPLY'>Email Reply</option>
                <option value='EXECUTIVE_SPONSOR_MEETING'>Executive Sponsor Meeting</option>
                <option value='PROPOSAL_REVIEW'>Proposal Review</option>
                <option value='SECURITY_AUDIT'>Security Audit</option>
                <option value='CONTRACT_REDLINE'>Contract Redline</option>
              </select>
            </div>

            {/* Sentiment */}
            <div>
              <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                Observed Buyer Sentiment
              </label>
              <select
                className='filter-select'
                value={touchSentiment}
                onChange={(e) => setTouchSentiment(e.target.value)}
                style={{ width: '100%', marginTop: '6px' }}
              >
                <option value='POSITIVE'>Positive — High Engagement</option>
                <option value='NEUTRAL'>Neutral — Routine Progress</option>
                <option value='NEGATIVE'>Negative — Friction / Hesitation</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Touchpoint Notes & Key Takeaways
            </label>
            <textarea
              rows='3'
              value={touchNotes}
              onChange={(e) => setTouchNotes(e.target.value)}
              placeholder='e.g., Reviewed enterprise SLA requirements with VP of Engineering, scheduled security review...'
              className='filter-input'
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '10px 14px',
                fontSize: '13px',
                display: 'block'
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type='button' className='btn-secondary' onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button type='submit' className='btn-primary' disabled={submitting}>
              {submitting ? 'Recording...' : 'Commit Touchpoint to Pipeline'}
            </button>
          </div>
        </form>
      )}

      {/* Timeline items list */}
      {filteredInteractions.length === 0
        ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No recorded touchpoints match this filter for the selected opportunity.
          </div>
          )
        : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredInteractions.map(i => {
              const dateStr = new Date(i.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })
              const sentimentColor = i.sentiment === 'POSITIVE'
                ? 'var(--accent-emerald)'
                : i.sentiment === 'NEGATIVE'
                  ? 'var(--accent-rose)'
                  : 'var(--accent-cyan)'

              return (
                <div key={i.id} className='timeline-item'>
                  <div className='timeline-dot' style={{ backgroundColor: sentimentColor, color: sentimentColor }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#fff' }}>
                        {i.type.replace(/_/g, ' ')}
                      </div>
                      <div className='tabular-nums' style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                        {dateStr}
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Stakeholder: <strong style={{ color: '#fff' }}>{i.contact_name || 'Prospect Stakeholder'}</strong> {i.contact_role_title && `(${i.contact_role_title})`}
                      {' '}&bull; Sentiment: <span style={{ color: sentimentColor, fontWeight: '700' }}>{i.sentiment}</span>
                    </div>

                    <div className='timeline-bubble'>
                      {i.notes}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          )}
    </div>
  )
}
