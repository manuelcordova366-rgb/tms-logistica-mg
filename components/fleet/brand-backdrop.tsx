'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

/** Brand marks cycled by the backdrop slideshow. */
const LOGOS = ['/logistica-mg-logo.png', '/logistica-mg-logo-mark.png']
const ROTATION_MS = 8000

/**
 * Slideshow of the Logística M&G TMS mark behind the app. It rotates between the two
 * brand assets over a glow built from the palette the rest of the UI uses (primary /
 * violet), stays decorative (`aria-hidden`, no pointer events) and holds still for
 * reduced-motion users.
 */
export function BrandBackdrop() {
  const [index, setIndex] = useState(0)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setAnimated(true)
    const id = window.setInterval(() => setIndex((i) => (i + 1) % LOGOS.length), ROTATION_MS)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 flex items-center justify-center overflow-hidden">
      <div
        className="absolute size-[min(120vw,1100px)] opacity-20 blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 32% 30%, var(--primary), transparent 58%), radial-gradient(circle at 68% 72%, var(--violet), transparent 58%), radial-gradient(circle at 50% 100%, var(--success), transparent 55%)',
        }}
      />
      <div className="relative h-[30vmin] w-[54vmin] max-h-80">
        {LOGOS.map((src, i) => (
          <div
            key={src}
            className={cn(
              'absolute inset-0 flex items-center justify-center rounded-2xl bg-white/[0.06] p-[6%]',
              animated && 'transition-opacity duration-[2500ms] ease-in-out',
              i === index ? 'opacity-100' : 'opacity-0',
            )}
          >
            <Image src={src} alt="" fill sizes="54vmin" className="object-contain opacity-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
