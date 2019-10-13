import Particle from './Particle'

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

export type Particles = {
  size: ParticleSize
  number: {
    value: number
    density: { enable: boolean; value_area: number }
  }
  color: { value: string }
  shape: {
    type: {} | Shape
    stroke: {
      width: number
      color: string
    }
    polygon: {
      nb_sides: number
    }
    image: {
      src: string
      width: number
      height: number
    }
  }
  opacity: {
    random: boolean
    value: number
    anim: {
      enable: boolean
      speed: number
      sync: boolean
      opacity_min: number
    }
  }
  line_linked: {
    enable: boolean
    distance: number
    color: string
    color_rgb_line?: { r: number; g: number; b: number }
    opacity: number
    width: number
  }
  move: {
    enable: boolean
    speed: number
    direction:
      | 'none'
      | 'top'
      | 'top-right'
      | 'top-left'
      | 'right'
      | 'left'
      | 'bottom'
      | 'bottom-right'
      | 'bottom-left'
    random: boolean
    straight: boolean
    out_mode: 'out' | 'bounce'
    bounce: boolean
    attract: {
      enable: false
      rotateX: number
      rotateY: number
    }
  }
  array?: Particle[]
}

export type Api = {
  particles: Particles
  interactivity: {
    detect_on: 'canvas' | 'window'
    el?: Element | Window
    events: {
      onhover: {
        enable: true
        mode: InteractivityMode
      }
      onclick: {
        enable: true
        mode: InteractivityMode
      }
      resize: true
    }
    modes: {
      grab: {
        distance: number
        line_linked: {
          opacity: 1
        }
      }
      bubble: {
        distance: number
        size: number
        duration: 0.4
        opacity?: number
      }
      repulse: {
        distance: number
        duration: 0.4
      }
      push: {
        particles_nb: number
      }
      remove: {
        particles_nb: 2
      }
    }
    mouse?: {
      pos_x: number
      pos_y: number
      click_pos_x?: number
      click_pos_y?: number
      click_time?: number
    }
    status?: 'mousemove' | 'mouseleave'
  }
  retina_detect: boolean
}
