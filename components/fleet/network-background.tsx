'use client'

import { useEffect, useRef } from 'react'

const NODES: { label: string; x: number; y: number; tone: 'primary' | 'success' | 'warning' | 'violet' }[] = [
  { label: 'CD VILLAHERMOSA', x: 0.5, y: 0.34, tone: 'primary' },
  { label: 'EKT MACUSPANA', x: 0.36, y: 0.24, tone: 'primary' },
  { label: 'EKT CARDENAS', x: 0.94, y: 0.23, tone: 'success' },
  { label: 'EKT COMALCALCO', x: 0.72, y: 0.12, tone: 'primary' },
  { label: 'MEGA MINATITLAN', x: 0.66, y: 0.4, tone: 'warning' },
  { label: 'EKT TUXTLA', x: 0.16, y: 0.46, tone: 'violet' },
  { label: 'EKT TAPACHULA', x: 0.08, y: 0.78, tone: 'primary' },
  { label: 'EKT JUCHITAN', x: 0.3, y: 0.7, tone: 'success' },
  { label: 'EKT FRONTERA', x: 0.84, y: 0.62, tone: 'primary' },
  { label: 'EKT PICHUCALCO', x: 0.56, y: 0.82, tone: 'violet' },
  { label: 'EKT COATZACOALCOS', x: 0.98, y: 0.88, tone: 'warning' },
  { label: '', x: 0.22, y: 0.12, tone: 'primary' },
  { label: '', x: 0.82, y: 0.38, tone: 'primary' },
]

const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [0, 8],
  [5, 6],
  [5, 7],
  [7, 9],
  [4, 10],
  [3, 2],
  [1, 11],
  [4, 12],
  [12, 8],
]

export function NetworkBackground() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const styles = getComputedStyle(document.documentElement)
    const color = (name: string) => styles.getPropertyValue(name).trim() || '#0ea5e9'
    const palette = {
      primary: color('--primary'),
      success: color('--success'),
      warning: color('--warning'),
      violet: color('--violet'),
      border: color('--border'),
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let frame = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height)

      ctx.strokeStyle = palette.border
      ctx.globalAlpha = 0.35
      ctx.lineWidth = 1
      for (let gx = 0; gx < width; gx += 64) {
        for (let gy = 0; gy < height; gy += 64) {
          ctx.fillStyle = palette.border
          ctx.fillRect(gx, gy, 1.5, 1.5)
        }
      }

      const pos = NODES.map((n) => ({ ...n, px: n.x * width, py: n.y * height }))

      EDGES.forEach(([a, b], i) => {
        const A = pos[a]
        const B = pos[b]
        ctx.globalAlpha = 0.22
        ctx.strokeStyle = palette.primary
        ctx.beginPath()
        ctx.moveTo(A.px, A.py)
        ctx.lineTo(B.px, B.py)
        ctx.stroke()

        const progress = reduceMotion ? 0.5 : ((time / 6000 + i * 0.137) % 1)
        const x = A.px + (B.px - A.px) * progress
        const y = A.py + (B.py - A.py) * progress
        ctx.globalAlpha = 0.8
        ctx.fillStyle = palette[B.tone]
        ctx.shadowColor = palette[B.tone]
        ctx.shadowBlur = 12
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      })

      pos.forEach((n, i) => {
        const pulse = reduceMotion ? 0.5 : (Math.sin(time / 900 + i) + 1) / 2
        const c = palette[n.tone]
        ctx.globalAlpha = 0.18 + pulse * 0.2
        ctx.fillStyle = c
        ctx.beginPath()
        ctx.arc(n.px, n.py, 9 + pulse * 5, 0, Math.PI * 2)
        ctx.fill()

        ctx.globalAlpha = 0.95
        ctx.shadowColor = c
        ctx.shadowBlur = 16
        ctx.beginPath()
        ctx.arc(n.px, n.py, 3.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        if (n.label) {
          ctx.globalAlpha = 0.75
          ctx.fillRect(n.px + 12, n.py - 4, 2, 8)
          ctx.font = '500 10px "JetBrains Mono", monospace'
          ctx.fillText(n.label, n.px + 18, n.py + 3.5)
        }
      })
      ctx.globalAlpha = 1

      if (!reduceMotion) frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-70" />
}
