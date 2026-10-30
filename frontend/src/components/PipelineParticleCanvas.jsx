import React, { useRef, useEffect, useState } from 'react'

export function PipelineParticleCanvas ({ isPaused = false, density = 'normal' }) {
  const canvasRef = useRef(null)
  const animFrameId = useRef(null)
  const mousePos = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5, active: false })
  const particlesRef = useRef(null)
  const timeStateRef = useRef({ lastNow: 0, accumulatedTime: 0 })
  const renderStaticFrameRef = useRef(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Detect user OS reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Listen to window pointer movements so pointerEvents: none on canvas doesn't block capture
  useEffect(() => {
    const handlePointerMove = (e) => {
      mousePos.current.targetX = Math.max(0, Math.min(1, e.clientX / window.innerWidth))
      mousePos.current.targetY = Math.max(0, Math.min(1, e.clientY / window.innerHeight))
      mousePos.current.active = true
    }

    const handlePointerLeave = () => {
      mousePos.current.targetX = 0.5
      mousePos.current.targetY = 0.5
      mousePos.current.active = false
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', handlePointerLeave, { passive: true })
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  // Initialize or reconfigure particle pool when density or reduced motion changes
  useEffect(() => {
    const particleCount = prefersReducedMotion
      ? 24
      : density === 'high'
        ? 75
        : density === 'low'
          ? 35
          : 50

    const palette = [
      { r: 56, g: 189, b: 248 }, // Cyan (Qualified pipeline)
      { r: 16, g: 185, b: 129 }, // Emerald (High win probability)
      { r: 129, g: 140, b: 248 }, // Indigo (Procurement & Demo)
      { r: 245, g: 158, b: 11 }, // Amber (Stalled deal review)
      { r: 244, g: 63, b: 94 } // Rose (Critical friction point)
    ]

    const newParticles = []
    for (let i = 0; i < particleCount; i++) {
      const u = (i / particleCount) * Math.PI * 2 + Math.random() * 0.4
      const v = Math.random() * Math.PI * 2
      const r1 = 0.75 + (Math.random() - 0.5) * 0.3
      const r2 = 0.75 + (Math.random() - 0.5) * 0.3

      newParticles.push({
        u,
        v,
        r1,
        r2,
        omegaU: 0.15 + (Math.random() - 0.5) * 0.2,
        omegaV: 0.12 + (Math.random() - 0.5) * 0.18,
        driftY: Math.random() * 2 - 1,
        driftSpeedY: 0.04 + Math.random() * 0.06,
        baseRadius: 1.6 + Math.random() * 2.2,
        color: palette[i % palette.length],
        pulseOffset: Math.random() * Math.PI * 2
      })
    }
    particlesRef.current = newParticles
  }, [density, prefersReducedMotion])

  // Main rendering engine
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = 1

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // If paused or under reduced motion, render immediate frame so canvas is never left blank
      if (renderStaticFrameRef.current) {
        renderStaticFrameRef.current()
      }
    }

    resize()
    window.addEventListener('resize', resize)

    let isDocumentVisible = !document.hidden
    const handleVisibilityChange = () => {
      isDocumentVisible = !document.hidden
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const drawScene = (currentT) => {
      ctx.clearRect(0, 0, width, height)

      const particles = particlesRef.current || []
      if (particles.length === 0) return

      // Smooth mouse easing
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.08
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.08

      const mxOffset = (mousePos.current.x - 0.5) * 60
      const myOffset = (mousePos.current.y - 0.5) * 60

      const theta = currentT * 0.65
      const phi = currentT * 0.45

      const cosT = Math.cos(theta)
      const sinT = Math.sin(theta)
      const cosP = Math.cos(phi)
      const sinP = Math.sin(phi)

      const d4 = 2.8
      const d3 = 3.2
      const minDim = Math.min(width, height)
      const projected = []

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Manifold parameter evolution over time
        const curU = p.u + currentT * p.omegaU
        const curV = p.v + currentT * p.omegaV

        // Funnel gravitational drift (deals progressing downwards through funnel)
        const funnelYDrift = (p.driftY + currentT * p.driftSpeedY) % 2 - 1

        const x0 = p.r1 * Math.cos(curU)
        const y0 = p.r1 * Math.sin(curU) + funnelYDrift * 0.25
        const z0 = p.r2 * Math.cos(curV)
        const w0 = p.r2 * Math.sin(curV)

        // 1. Orthogonal rotation in X-W plane
        const x1 = x0 * cosT - w0 * sinT
        const w1 = x0 * sinT + w0 * cosT

        // 2. Orthogonal rotation in Z-W plane
        const z1 = z0 * cosP - w1 * sinP
        const w2 = z0 * sinP + w1 * cosP
        const y1 = y0

        // 3. Perspective 4D -> 3D projection
        const scale4 = d4 / Math.max(0.1, d4 - w2 * 0.45)
        const x3 = x1 * scale4
        const y3 = y1 * scale4
        const z3 = z1 * scale4

        // 4. Perspective 3D -> 2D screen projection
        const scale3 = 1 / Math.max(0.2, d3 + z3 * 0.45)
        const sx = width * 0.5 + x3 * scale3 * minDim * 0.9 + mxOffset * scale3
        const sy = height * 0.5 + y3 * scale3 * minDim * 0.9 + myOffset * scale3

        const depthAlpha = Math.max(0.12, Math.min(0.75, (scale4 - 0.4) * 0.8))
        const pulse = 1 + Math.sin(currentT * 2.8 + p.pulseOffset) * 0.22
        const rad = Math.max(1.2, p.baseRadius * scale3 * 3.2 * pulse)

        projected.push({ sx, sy, rad, alpha: depthAlpha, color: p.color })
      }

      // Draw proximity connection filaments
      ctx.lineWidth = 1
      const maxDist = 90
      for (let i = 0; i < projected.length; i++) {
        const pA = projected[i]
        for (let j = i + 1; j < projected.length; j++) {
          const pB = projected[j]
          const dx = pA.sx - pB.sx
          const dy = pA.sy - pB.sy
          const distSq = dx * dx + dy * dy

          if (distSq < maxDist * maxDist) {
            const dist = Math.sqrt(distSq)
            const filamentAlpha = (1 - dist / maxDist) * Math.min(pA.alpha, pB.alpha) * 0.38
            ctx.strokeStyle = `rgba(${pA.color.r}, ${pA.color.g}, ${pA.color.b}, ${filamentAlpha})`
            ctx.beginPath()
            ctx.moveTo(pA.sx, pA.sy)
            ctx.lineTo(pB.sx, pB.sy)
            ctx.stroke()
          }
        }
      }

      // Draw particle glowing cores
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i]
        const { r, g, b } = p.color

        // Radial glow
        const glowRadius = p.rad * 2.6
        const glowGrad = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, glowRadius)
        glowGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.9})`)
        glowGrad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.25})`)
        glowGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)

        ctx.fillStyle = glowGrad
        ctx.beginPath()
        ctx.arc(p.sx, p.sy, glowRadius, 0, Math.PI * 2)
        ctx.fill()

        // Crisp white core
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, p.alpha * 1.5)})`
        ctx.beginPath()
        ctx.arc(p.sx, p.sy, Math.max(0.8, p.rad * 0.45), 0, Math.PI * 2)
        ctx.fill()
      }
    }

    renderStaticFrameRef.current = () => {
      const t = timeStateRef.current.accumulatedTime * 0.00045
      drawScene(t)
    }

    const loop = (now) => {
      if (!timeStateRef.current.lastNow) {
        timeStateRef.current.lastNow = now
      }
      const delta = now - timeStateRef.current.lastNow
      timeStateRef.current.lastNow = now

      if (!isPaused && !prefersReducedMotion && isDocumentVisible) {
        timeStateRef.current.accumulatedTime += delta
      }

      const t = prefersReducedMotion ? 1.0 : timeStateRef.current.accumulatedTime * 0.00045
      drawScene(t)

      if (!isPaused && !prefersReducedMotion) {
        animFrameId.current = window.requestAnimationFrame(loop)
      }
    }

    animFrameId.current = window.requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (animFrameId.current) {
        window.cancelAnimationFrame(animFrameId.current)
      }
    }
  }, [isPaused, prefersReducedMotion])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden'
      }}
      aria-hidden='true'
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  )
}
