import {
  ParticleSize,
  Canvas,
  Shape,
  HSL,
  RGB,
  ColorInput,
  Position
} from '../demo/src/types'
import { hexToRgb } from './funcs'
import { State } from '../particles'

type Image = {
  obj?: CanvasImageSource
  ratio?: number
  loaded?: boolean
  src?: string
}

type ParticleT = {
  color: any // string | { value: ColorInput }
  draw: () => void
  radius: number
  radius_bubble?: number
  size_status: boolean
  x: number
  y: number
  vx: number
  vx_i: number
  vy: number
  vy_i: number
  vo: number
  vs: number
  opacity: number
  opacity_bubble?: number
  opacity_status: boolean
  img: Image
  shape: Shape
}

interface Options {
  canvas: Canvas
  checkOverlap: (p: Particle, position?: Position) => void
  color: string | { value: ColorInput }
  opacity: number
  position?: { x: number; y: number }
  particleSize: ParticleSize
  shape: Shape
  moveBounce?: boolean
  pJS: State
}
export default class Particle implements ParticleT {
  radius: number
  radius_bubble?: number
  x: number
  vx: number
  y: number
  vy: number
  vs!: number
  opacity: number
  opacity_bubble?: number
  opacity_status!: boolean
  vo!: number
  size_status!: boolean
  vx_i: number
  vy_i: number
  shape: Shape = 'circle'
  static canvas: Canvas
  static pJS: State
  static checkOverlap: (p: Particle, position?: Position) => void
  color: ColorInput
  img: Image = {}

  constructor(options: Options) {
    const {
      canvas,
      color,
      moveBounce,
      opacity,
      particleSize,
      position,
      pJS
    } = options

    if (!Particle.canvas) {
      Particle.canvas = canvas
    }

    if (!Particle.pJS) {
      Particle.pJS = pJS
    }

    /* size */
    this.radius = (particleSize.random ? Math.random() : 1) * particleSize.value
    if (particleSize.anim.enable) {
      this.size_status = false
      this.vs = particleSize.anim.speed / 100
      if (!particleSize.anim.sync) {
        this.vs = this.vs * Math.random()
      }
    }
    /* position */
    this.x = position ? position.x : Math.random() * canvas.w
    this.y = position ? position.y : Math.random() * canvas.h
    /* check position  - into the canvas */
    if (this.x > canvas.w - this.radius * 2) this.x = this.x - this.radius
    else if (this.x < this.radius * 2) this.x = this.x + this.radius
    if (this.y > canvas.h - this.radius * 2) this.y = this.y - this.radius
    else if (this.y < this.radius * 2) this.y = this.y + this.radius
    /* check position - avoid overlap */
    if (moveBounce) {
      Particle.checkOverlap(this, position)
    }
    this.color = 'gray'
    if (typeof color === 'object' && typeof color.value === 'object') {
      if (Array.isArray(color.value)) {
        var color_selected =
          color.value[
            Math.floor(Math.random() * pJS.particles.color.value.length)
          ]
        ;(this.color as any).rgb = hexToRgb(color_selected)!
      } else {
        const colorValue = color.value

        if (
          (['r', 'g', 'b'] as (keyof RGB)[]).every(
            (key: keyof RGB) => (colorValue as RGB)[key] !== undefined
          )
        ) {
          const { r, g, b } = color.value as RGB
          ;((this.color as unknown) as { rgb: RGB }).rgb = {
            r,
            g,
            b
          }
        }
        if (
          (['h', 's', 'l'] as (keyof HSL)[]).every(
            key => (colorValue as HSL)[key] !== undefined
          )
        ) {
          const { h, s, l } = color.value as HSL
          ;((this.color as unknown) as { hsl: HSL }).hsl = {
            h,
            s,
            l
          }
        }
      }
    } else if (typeof color === 'object' && color.value == 'random') {
      ;((this.color as unknown) as { rgb: RGB }).rgb = {
        r: Math.floor(Math.random() * (255 - 0 + 1)) + 0,
        g: Math.floor(Math.random() * (255 - 0 + 1)) + 0,
        b: Math.floor(Math.random() * (255 - 0 + 1)) + 0
      }
    } else if (typeof color === 'object' && typeof color.value == 'string') {
      ;(this.color as any) = color
      ;(this.color as any).rgb = hexToRgb((this.color as any).value)!
    }
    /* opacity */
    this.opacity =
      (pJS.particles.opacity.random ? Math.random() : 1) *
      pJS.particles.opacity.value
    if (pJS.particles.opacity.anim.enable) {
      this.opacity_status = false
      this.vo = pJS.particles.opacity.anim.speed / 100
      if (!pJS.particles.opacity.anim.sync) {
        this.vo = this.vo * Math.random()
      }
    }
    /* animation - velocity for speed */
    var velbase: Partial<Position> = {}
    switch (pJS.particles.move.direction) {
      case 'top':
        velbase = { x: 0, y: -1 }
        break
      case 'top-right':
        velbase = { x: 0.5, y: -0.5 }
        break
      case 'right':
        velbase = { x: 1, y: -0 }
        break
      case 'bottom-right':
        velbase = { x: 0.5, y: 0.5 }
        break
      case 'bottom':
        velbase = { x: 0, y: 1 }
        break
      case 'bottom-left':
        velbase = { x: -0.5, y: 1 }
        break
      case 'left':
        velbase = { x: -1, y: 0 }
        break
      case 'top-left':
        velbase = { x: -0.5, y: -0.5 }
        break
      default:
        velbase = { x: 0, y: 0 }
        break
    }
    if (pJS.particles.move.straight) {
      this.vx = velbase.x!
      this.vy = velbase.y!
      if (pJS.particles.move.random) {
        this.vx = this.vx * Math.random()
        this.vy = this.vy * Math.random()
      }
    } else {
      this.vx = velbase.x! + Math.random() - 0.5
      this.vy = velbase.y! + Math.random() - 0.5
    }
    // var theta = 2.0 * Math.PI * Math.random();
    // this.vx = Math.cos(theta);
    // this.vy = Math.sin(theta);
    this.vx_i = this.vx
    this.vy_i = this.vy
    /* if shape is image */
    var shape_type = pJS.particles.shape.type
    if (typeof shape_type == 'object') {
      if (Array.isArray(shape_type)) {
        var shape_selected =
          shape_type[Math.floor(Math.random() * shape_type.length)]
        this.shape = shape_selected
      }
    } else {
      this.shape = shape_type as Shape
    }
    if (this.shape == 'image') {
      var sh = pJS.particles.shape
      this.img = {
        src: sh.image.src as any,
        ratio: sh.image.width / sh.image.height
      }
      if (!this.img.ratio) this.img.ratio = 1
      if (pJS.tmp.img_type == 'svg' && pJS.tmp.source_svg != undefined) {
        pJS.fn.vendors.createSvgImg!(this)
        if (pJS.tmp.pushing) {
          this.img.loaded = false
        }
      }
    }
  }

  draw() {
    var p: ParticleT = this
    const { pJS } = Particle

    if (p.radius_bubble != undefined) {
      var radius = p.radius_bubble
    } else {
      var radius = p.radius
    }
    if (p.opacity_bubble != undefined) {
      var opacity = p.opacity_bubble
    } else {
      var opacity = p.opacity
    }
    if (p.color.rgb) {
      var color_value =
        'rgba(' +
        p.color.rgb.r +
        ',' +
        p.color.rgb.g +
        ',' +
        p.color.rgb.b +
        ',' +
        opacity +
        ')'
    } else {
      var color_value =
        'hsla(' +
        p.color.hsl.h +
        ',' +
        p.color.hsl.s +
        '%,' +
        p.color.hsl.l +
        '%,' +
        opacity +
        ')'
    }
    const { canvas } = Particle

    canvas.ctx!.fillStyle = color_value
    canvas.ctx!.beginPath()
    switch (p.shape) {
      case 'circle':
        canvas.ctx!.arc(p.x, p.y, radius, 0, Math.PI * 2, false)
        break
      case 'edge':
        canvas.ctx!.rect(p.x - radius, p.y - radius, radius * 2, radius * 2)
        break
      case 'triangle':
        pJS.fn.vendors.drawShape!(
          canvas.ctx!,
          p.x - radius,
          p.y + radius / 1.66,
          radius * 2,
          3,
          2
        )
        break
      case 'polygon':
        pJS.fn.vendors.drawShape!(
          canvas.ctx!,
          p.x - radius / (pJS.particles.shape.polygon.nb_sides / 3.5), // startX
          p.y - radius / (2.66 / 3.5), // startY
          (radius * 2.66) / (pJS.particles.shape.polygon.nb_sides / 3), // sideLength
          pJS.particles.shape.polygon.nb_sides, // sideCountNumerator
          1 // sideCountDenominator
        )
        break
      case 'star':
        pJS.fn.vendors.drawShape!(
          canvas.ctx!,
          p.x - (radius * 2) / (pJS.particles.shape.polygon.nb_sides / 4), // startX
          p.y - radius / ((2 * 2.66) / 3.5), // startY
          (radius * 2 * 2.66) / (pJS.particles.shape.polygon.nb_sides / 3), // sideLength
          pJS.particles.shape.polygon.nb_sides, // sideCountNumerator
          2 // sideCountDenominator
        )
        break
      case 'image':
        let img_obj: any

        if (pJS.tmp.img_type == 'svg') {
          img_obj = p.img.obj
        } else {
          img_obj = pJS.tmp.img_obj
        }
        const draw = () => {
          canvas.ctx!.drawImage(
            img_obj as any,
            p.x - radius,
            p.y - radius,
            radius * 2,
            (radius * 2) / p.img!.ratio!
          )
        }
        if (img_obj) {
          draw()
        }
        break
    }
    canvas.ctx!.closePath()
    if (pJS.particles.shape.stroke.width > 0) {
      canvas.ctx!.strokeStyle = pJS.particles.shape.stroke.color
      canvas.ctx!.lineWidth = pJS.particles.shape.stroke.width
      canvas.ctx!.stroke()
    }
    canvas.ctx!.fill()
  }
}
