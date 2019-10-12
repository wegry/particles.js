export type Shape =
  | 'circle'
  | 'edge'
  | 'triangle'
  | 'polygon'
  | 'star'
  | 'image'
export type InteractivityMode =
  | 'push'
  | 'remove'
  | 'bubble'
  | 'repulse'
  | 'grab'

export type Position = {
  x: number
  y: number
}

export type ColorInput =
  | {
      rgb?: RGB
      hsl?: HSL
    }
  | RGB & HSL
  | string

export type HSL = { h: number; s: number; l: number }
export type RGB = {
  r: number
  g: number
  b: number
}

export type ParticleSize = {
  value: number
  random: boolean
  anim: {
    enable: boolean
    speed: number
    size_min: number
    sync: boolean
  }
}

export type Canvas = {
  el: HTMLCanvasElement
  w: number
  h: number
  pxratio?: number
  ctx?: CanvasRenderingContext2D
}
