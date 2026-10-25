'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

/** Diapositivas profesionales que rotan por el fondo del tablero. */
interface Slide {
  id: string
  src: string
  /** `photo` cubre la pantalla con la operación; `brand` muestra el logotipo en una placa. */
  kind: 'photo' | 'brand'
  /** Encuadre de la foto (el material original es un banner ancho). */
  crop?: string
  eyebrow: string
  title: string
}

const SLIDES: Slide[] = [
  { id: 'patio', kind: 'photo', src: '/cedis-patio-trucks-header.png', crop: 'object-center', eyebrow: 'Patio · En CD', title: 'Unidades monitoreadas en patio' },
  { id: 'marca', kind: 'brand', src: '/logistica-mg-logo.png', eyebrow: 'Logística M&G', title: 'Control de flota y embarques' },
  { id: 'ruta', kind: 'photo', src: '/cedis-patio-trucks-header.png', crop: 'object-left', eyebrow: 'Supervisor · Ruta', title: 'Seguimiento de unidades en tránsito' },
  { id: 'marca-mark', kind: 'brand', src: '/logistica-mg-logo-mark.png', eyebrow: 'TMS', title: 'Planeación, patio y resumen en un tablero' },
]

const ROTATION_MS = 7500

/**
 * Carrusel de fondo de la página de inicio: alterna la operación en patio con las placas
 * de marca sobre la paleta azul del logotipo. Es decorativo (`aria-hidden`, sin eventos de
 * puntero) y se queda quieto para quien prefiere menos movimiento.
 */
export function BrandBackdrop() {
  const [index, setIndex] = useState(0)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setAnimated(true)
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), ROTATION_MS)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-background">
      {/* Halo de marca: azules y verde del logotipo */}
      <div
        className="absolute -top-[28vmin] -left-[18vmin] size-[min(130vw,1200px)] opacity-30 blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 38% 38%, var(--brand-blue), transparent 60%), radial-gradient(circle at 72% 72%, var(--brand-sky), transparent 58%), radial-gradient(circle at 45% 100%, var(--brand-teal), transparent 55%)',
        }}
      />

      {SLIDES.map((slide, i) => {
        const active = i === index
        return (
          <div
            key={slide.id}
            style={{ transition: 'opacity 1500ms ease-in-out' }}
            className={cn('absolute inset-0', active ? 'opacity-100' : 'opacity-0')}
          >
            {slide.kind === 'photo' ? (
              <div
                className="absolute inset-0"
                style={{ transition: 'transform 9000ms linear', transform: active ? 'scale(1.08)' : 'scale(1)' }}
              >
                <Image
                  src={slide.src}
                  alt=""
                  fill
                  sizes="100vw"
                  priority={i === 0}
                  className={cn('object-cover', slide.crop)}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-[8vmin]">
                <div className="relative flex h-[42vmin] w-full max-w-3xl items-center justify-center rounded-3xl bg-white/90 p-[4vmin] shadow-[0_30px_90px_-20px_rgba(3,16,31,0.85)] ring-1 ring-white/20">
                  <Image src={slide.src} alt="" width={1024} height={559} className="h-full w-auto object-contain" />
                </div>
              </div>
            )}

            {/* Velo azul: la foto se asoma en los huecos y la placa de marca queda suave,
                de modo que el tablero sigue siendo legible sobre cualquier diapositiva */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  slide.kind === 'photo'
                    ? 'linear-gradient(to top, var(--background) 3%, rgba(5,31,61,0.5) 45%, rgba(5,31,61,0.12) 100%)'
                    : 'linear-gradient(to top, var(--background) 3%, rgba(5,31,61,0.86) 50%, rgba(5,31,61,0.68) 100%)',
              }}
            />
          </div>
        )
      })}

      {/* Rótulo de la diapositiva en turno + indicadores del carrusel */}
      <div className="absolute bottom-20 left-6 hidden flex-col gap-1.5 lg:flex">
        <span className="h-0.5 w-12 rounded-full bg-brand-sky" />
        <p className="font-mono text-[10px] tracking-[0.3em] text-brand-sky uppercase">{SLIDES[index].eyebrow}</p>
        <p className="text-sm font-semibold text-foreground/70">{SLIDES[index].title}</p>
      </div>
      <div className="absolute right-6 bottom-20 hidden items-center gap-2 lg:flex">
        {SLIDES.map((slide, i) => (
          <span
            key={slide.id}
            style={{ transition: 'all 600ms ease-in-out' }}
            className={cn('h-1.5 rounded-full', i === index ? 'w-7 bg-brand-sky' : 'w-1.5 bg-foreground/30')}
          />
        ))}
      </div>
    </div>
  )
}
