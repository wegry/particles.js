/* -----------------------------------------------
/* Author : Zachary Wegrzyniak, Vincent Garreau  - vincentgarreau.com
/* MIT license: http://opensource.org/licenses/MIT
/* How to use? : Check the GitHub README
/* v2.0.0
/* ----------------------------------------------- */

import deepExtend from 'deep-extend'
import { Canvas, HSL, Position, Api, RecursivePartial } from './lib/types'
import { apiDefaults } from './lib/api'
import { hexToRgb, clamp } from './lib/funcs'
import Particle from './lib/Particle'

export class particulate {
  config: Api

  canvas: Canvas
  checkAnimFrame?: number
  drawAnimFrame?: number

  static tmp: {
    bubble_clicking?: boolean
    bubble_duration_end?: boolean
    checkAnimFrame?: number
    count_svg?: number
    img_error?: boolean
    img_type?: string
    img_obj?: CanvasImageSource
    source_svg?: 'string'
    pushing?: boolean
    obj?: {
      size_value: number
      size_anim_speed: number
      move_speed: number
      line_linked_distance: number
      line_linked_width: number
      mode_grab_distance: number
      mode_bubble_distance: number
      mode_bubble_size: number
      mode_repulse_distance: number
    }
    repulse_clicking?: boolean
    repulse_count?: number
    repulse_finish?: boolean
    retina?: {}
  }

  init() {
    /* init canvas + particles */
    this.retinaInit()
    this.canvasInit()
    this.canvasSize()
    this.canvasPaint()
    this.particlesCreate!()
    this.densityAutoParticles!()
    /* particles.line_linked - convert hex colors to rgb */
    this.config.particles.line_linked.color_rgb_line = hexToRgb(
      this.config.particles.line_linked.color
    )!
  }

  retinaInit() {
    if (this.config.retina_detect && window.devicePixelRatio > 1) {
      this.canvas.pxratio = window.devicePixelRatio
      particulate.tmp.retina = true
    } else {
      this.canvas.pxratio = 1
      particulate.tmp.retina = false
    }
    this.canvas.w = this.canvas.el.offsetWidth * this.canvas.pxratio
    this.canvas.h = this.canvas.el.offsetHeight * this.canvas.pxratio

    const tmpObj = particulate.tmp.obj!

    this.config.particles.size.value = tmpObj.size_value * this.canvas.pxratio
    this.config.particles.size.anim.speed =
      tmpObj.size_anim_speed * this.canvas.pxratio
    this.config.particles.move.speed = tmpObj.move_speed * this.canvas.pxratio
    this.config.particles.line_linked.distance =
      tmpObj.line_linked_distance * this.canvas.pxratio
    this.config.interactivity.modes.grab.distance =
      tmpObj.mode_grab_distance * this.canvas.pxratio
    this.config.interactivity.modes.bubble.distance =
      tmpObj.mode_bubble_distance * this.canvas.pxratio
    this.config.particles.line_linked.width =
      tmpObj.line_linked_width * this.canvas.pxratio
    this.config.interactivity.modes.bubble.size =
      tmpObj.mode_bubble_size * this.canvas.pxratio
    this.config.interactivity.modes.repulse.distance =
      tmpObj.mode_repulse_distance * this.canvas.pxratio
  }

  canvasInit() {
    this.canvas.ctx = this.canvas.el.getContext('2d')!
  }
  canvasSize() {
    this.canvas.el.width = this.canvas.w
    this.canvas.el.height = this.canvas.h
    if (particulate && this.config.interactivity.events.resize) {
      window.addEventListener('resize', () => {
        this.canvas.w = this.canvas.el.offsetWidth
        this.canvas.h = this.canvas.el.offsetHeight
        /* resize canvas */
        if (particulate.tmp.retina) {
          this.canvas.w *= this.canvas!.pxratio!
          this.canvas.h *= this.canvas!.pxratio!
        }
        this.canvas.el.width = this.canvas.w
        this.canvas.el.height = this.canvas.h
        /* repaint canvas on anim disabled */
        if (!this.config.particles.move.enable) {
          this.particlesEmpty()
          this.particlesCreate()
          this.particlesDraw()
          this.densityAutoParticles()
        }
        /* density particles enabled */
        this.densityAutoParticles()
      })
    }
  }
  canvasPaint() {
    this.canvas.ctx!.fillRect(0, 0, this.canvas.w, this.canvas.h)
  }
  canvasClear() {
    this.canvas.ctx!.clearRect(0, 0, this.canvas.w, this.canvas.h)
  }
  /* --------- pJS functions - particles ----------- */
  particlesCreate() {
    for (var i = 0; i < this.config.particles.number.value; i++) {
      this.config.particles.array!.push(
        new Particle({
          particles: this.config.particles,
          color: this.config.particles.color,
          opacity: this.config.particles.opacity.value,
          canvas: this.canvas,
          checkOverlap: this.checkOverlap,
          shape: this.config.particles.shape as any,
          createSvgImg: this.createSvgImg
        })
      )
    }
  }
  particlesUpdate() {
    for (const [i, p] of this.config.particles.array!.entries()) {
      if (this.config.particles.move.enable) {
        var ms = this.config.particles.move.speed / 2
        p.x += p.vx * ms
        p.y += p.vy * ms
      }
      /* change opacity status */
      if (this.config.particles.opacity.anim.enable) {
        if (p.opacity_status == true) {
          if (p.opacity >= this.config.particles.opacity.value)
            p.opacity_status = false
          p.opacity += p.vo
        } else {
          if (p.opacity <= this.config.particles.opacity.anim.opacity_min)
            p.opacity_status = true
          p.opacity -= p.vo
        }
        if (p.opacity < 0) p.opacity = 0
      }
      /* change size */
      if (this.config.particles.size.anim.enable) {
        if (p.size_status == true) {
          if (p.radius >= this.config.particles.size.value)
            p.size_status = false
          p.radius += p.vs
        } else {
          if (p.radius <= this.config.particles.size.anim.size_min)
            p.size_status = true
          p.radius -= p.vs
        }
        if (p.radius < 0) p.radius = 0
      }
      /* change particle position if it is out of canvas */
      const new_pos = (() => {
        if (this.config.particles.move.out_mode == 'bounce') {
          return {
            x_left: p.radius,
            x_right: this.canvas.w,
            y_top: p.radius,
            y_bottom: this.canvas.h
          }
        } else {
          return {
            x_left: -p.radius,
            x_right: this.canvas.w + p.radius,
            y_top: -p.radius,
            y_bottom: this.canvas.h + p.radius
          }
        }
      })()

      if (p.x - p.radius > this.canvas.w) {
        p.x = new_pos.x_left
        p.y = Math.random() * this.canvas.h
      } else if (p.x + p.radius < 0) {
        p.x = new_pos.x_right
        p.y = Math.random() * this.canvas.h
      }
      if (p.y - p.radius > this.canvas.h) {
        p.y = new_pos.y_top
        p.x = Math.random() * this.canvas.w
      } else if (p.y + p.radius < 0) {
        p.y = new_pos.y_bottom
        p.x = Math.random() * this.canvas.w
      }
      /* out of canvas modes */
      switch (this.config.particles.move.out_mode) {
        case 'bounce':
          if (p.x + p.radius > this.canvas.w) p.vx = -p.vx
          else if (p.x - p.radius < 0) p.vx = -p.vx
          if (p.y + p.radius > this.canvas.h) p.vy = -p.vy
          else if (p.y - p.radius < 0) p.vy = -p.vy
          break
      }
      /* events */
      if (this.config.interactivity.events.onhover.mode === 'grab') {
        this.grabParticle(p)
      }
      if (
        this.config.interactivity.events.onhover.mode === 'bubble' ||
        this.config.interactivity.events.onclick.mode === 'bubble'
      ) {
        this.bubbleParticle(p)
      }
      if (
        this.config.interactivity.events.onhover.mode === 'repulse' ||
        this.config.interactivity.events.onclick.mode === 'repulse'
      ) {
        this.repulseParticle!(p)
      }
      /* interaction auto between particles */
      if (
        this.config.particles.line_linked.enable ||
        this.config.particles.move.attract.enable
      ) {
        for (var j = i + 1; j < this.config.particles.array!.length; j++) {
          var p2 = this.config.particles.array![j]
          /* link particles */
          if (this.config.particles.line_linked.enable) {
            this.linkParticles(p, p2)
          }
          /* attract particles */
          if (this.config.particles.move.attract.enable) {
            this.attractParticles(p, p2)
          }
          /* bounce particles */
          if (this.config.particles.move.bounce) {
            this.bounceParticles!(p, p2)
          }
        }
      }
    }
  }
  particlesDraw() {
    /* clear canvas */
    this.canvas.ctx!.clearRect(0, 0, this.canvas.w, this.canvas.h)
    /* update each particles param */
    this.particlesUpdate()
    /* draw each particle */
    for (var i = 0; i < this.config.particles.array!.length; i++) {
      var p = this.config.particles.array![i]
      p.draw()
    }
  }

  checkOverlap(p1: Particle, position?: Position) {
    for (var i = 0; i < this.config.particles.array!.length; i++) {
      var p2 = this.config.particles.array![i]
      var dx = p1.x - p2.x,
        dy = p1.y - p2.y,
        dist = Math.sqrt(dx * dx + dy * dy)
      if (dist <= p1.radius + p2.radius) {
        p1.x = position ? position.x : Math.random() * this.canvas.w
        p1.y = position ? position.y : Math.random() * this.canvas.h
        this.checkOverlap(p1)
      }
    }
  }

  particlesRefresh() {
    /* init all */
    cancelAnimationFrame(this.checkAnimFrame!)
    cancelAnimationFrame(this.drawAnimFrame!)
    particulate.tmp.source_svg = undefined
    particulate.tmp.img_obj = undefined
    particulate.tmp.count_svg = 0
    this.particlesEmpty!()
    this.canvasClear!()
    /* restart */
    this.start()
  }

  particlesEmpty() {
    this.config.particles.array = []
  }

  createSvgImg(p: Particle) {
    /* set color to svg element */
    var svgXml = particulate.tmp.source_svg,
      rgbHex = /#([0-9A-F]{3,6})/gi,
      coloredSvgXml = svgXml!.replace(rgbHex, function(m, r, g, b) {
        const { color } = p
        if (typeof color === 'object' && 'rgb' in color) {
          const { rgb } = color
          var color_value =
            'rgba(' +
            rgb!.r +
            ',' +
            rgb!.g +
            ',' +
            rgb!.b +
            ',' +
            p.opacity +
            ')'
        } else {
          const { hsl } = p.color as { hsl: HSL }
          var color_value =
            'hsla(' +
            hsl.h +
            ',' +
            hsl.s +
            '%,' +
            hsl.l +
            '%,' +
            p.opacity +
            ')'
        }
        return color_value
      })
    /* prepare to create img with colored svg */
    const svg = new Blob([coloredSvgXml], {
        type: 'image/svg+xml;charset=utf-8'
      }),
      DOMURL = window.URL,
      url = DOMURL.createObjectURL(svg)
    /* create particle img obj */
    var img = new Image()
    img.addEventListener('load', () => {
      p.img.obj = img
      p.img.loaded = true
      DOMURL.revokeObjectURL(url)
      particulate.tmp.count_svg!++
    })
    img.src = url
  }

  destroypJS() {
    cancelAnimationFrame(this.drawAnimFrame!)
    this.canvas.el.remove()
    pJSDom = null!
  }

  densityAutoParticles() {
    if (this.config.particles.number.density.enable) {
      /* calc area */
      var area = (this.canvas.el.width * this.canvas.el.height) / 1000
      if (particulate.tmp.retina) {
        area = area / (this.canvas.pxratio! * 2)
      }
      /* calc number of particles based on density area */
      var nb_particles =
        (area * this.config.particles.number.value) /
        this.config.particles.number.density.value_area
      /* add or remove X particles */
      var missing_particles = this.config.particles.array!.length - nb_particles
      if (missing_particles < 0) this.pushParticles(Math.abs(missing_particles))
      else this.removeParticles(missing_particles)
    }
  }

  eventsListeners() {
    /* events target element */
    if (this.config.interactivity.detect_on == 'window') {
      this.config.interactivity.el = window
    } else {
      this.config.interactivity.el = this.canvas.el
    }
    /* detect mouse pos - on hover / click event */
    if (
      this.config.interactivity.events.onhover.enable ||
      this.config.interactivity.events.onclick.enable
    ) {
      /* el on mousemove */
      this.config.interactivity.el.addEventListener('mousemove', (
        e: any /*MouseEvent*/
      ) => {
        if (this.config.interactivity.el == window) {
          var pos_x = e.clientX,
            pos_y = e.clientY
        } else {
          var pos_x = e.offsetX || e.clientX,
            pos_y = e.offsetY || e.clientY
        }
        this.config.interactivity.mouse!.pos_x = pos_x
        this.config.interactivity.mouse!.pos_y = pos_y
        if (particulate.tmp.retina) {
          this.config.interactivity.mouse!.pos_x *= this.canvas.pxratio!
          this.config.interactivity.mouse!.pos_y *= this.canvas.pxratio!
        }
        this.config.interactivity.status = 'mousemove'
      })
      /* el on onmouseleave */
      this.config.interactivity.el.addEventListener('mouseleave', (_: any) => {
        this.config.interactivity.mouse!.pos_x = null!
        this.config.interactivity.mouse!.pos_y = null!
        this.config.interactivity.status = 'mouseleave'
      })
    }
    /* on click event */
    if (this.config.interactivity.events.onclick.enable) {
      this.config.interactivity.el.addEventListener('click', () => {
        this.config.interactivity.mouse!.click_pos_x = this.config.interactivity.mouse!.pos_x
        this.config.interactivity.mouse!.click_pos_y = this.config.interactivity.mouse!.pos_y
        this.config.interactivity.mouse!.click_time = new Date().getTime()
        if (this.config.interactivity.events.onclick.enable) {
          switch (this.config.interactivity.events.onclick.mode) {
            case 'push':
              if (this.config.particles.move.enable) {
                this.pushParticles!(
                  this.config.interactivity.modes.push.particles_nb,
                  this.config.interactivity.mouse
                )
              } else {
                if (this.config.interactivity.modes.push.particles_nb == 1) {
                  this.pushParticles!(
                    this.config.interactivity.modes.push.particles_nb,
                    this.config.interactivity.mouse
                  )
                } else if (
                  this.config.interactivity.modes.push.particles_nb > 1
                ) {
                  this.pushParticles!(
                    this.config.interactivity.modes.push.particles_nb
                  )
                }
              }
              break
            case 'remove':
              this.removeParticles!(
                this.config.interactivity.modes.remove.particles_nb
              )
              break
            case 'bubble':
              particulate.tmp.bubble_clicking = true
              break
            case 'repulse':
              particulate.tmp.repulse_clicking = true
              particulate.tmp.repulse_count = 0
              particulate.tmp.repulse_finish = false
              setTimeout(() => {
                particulate.tmp.repulse_clicking = false
              }, this.config.interactivity.modes.repulse.duration * 1000)
              break
          }
        }
      })
    }
  }

  pushParticles(nb: number, pos?: { pos_x: number; pos_y: number }) {
    particulate.tmp.pushing = true
    for (const i of Array(Math.floor(nb)).keys()) {
      this.config.particles.array!.push(
        new Particle!({
          particles: this.config.particles,
          color: this.config.particles.color,
          opacity: this.config.particles.opacity.value,
          position: {
            x: pos ? pos.pos_x : Math.random() * this.canvas.w,
            y: pos ? pos.pos_y : Math.random() * this.canvas.h
          },
          canvas: this.canvas,
          checkOverlap: this.checkOverlap,
          shape: this.config.particles.shape as any,
          createSvgImg: this.createSvgImg
        })
      )
      if (i == nb - 1) {
        if (!this.config.particles.move.enable) {
          this.particlesDraw!()
        }
        particulate.tmp.pushing = false
      }
    }
  }
  removeParticles(nb: number) {
    this.config.particles.array!.splice(0, nb)
    if (!this.config.particles.move.enable) {
      this.particlesDraw!()
    }
  }
  bubbleParticle(p: Particle) {
    /* on hover event */
    if (
      this.config.interactivity.events.onhover.enable &&
      this.config.interactivity.events.onhover.mode === 'bubble'
    ) {
      const dx_mouse = p.x - this.config.interactivity.mouse!.pos_x,
        dy_mouse = p.y - this.config.interactivity.mouse!.pos_y,
        dist_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse),
        ratio = 1 - dist_mouse / this.config.interactivity.modes.bubble.distance
      const init = () => {
        p.opacity_bubble = p.opacity
        p.radius_bubble = p.radius
      }
      /* mousemove - check ratio */
      if (dist_mouse <= this.config.interactivity.modes.bubble.distance) {
        if (ratio >= 0 && this.config.interactivity.status == 'mousemove') {
          /* size */
          if (
            this.config.interactivity.modes.bubble.size !=
            this.config.particles.size.value
          ) {
            let size: number
            if (
              this.config.interactivity.modes.bubble.size >
              this.config.particles.size.value
            ) {
              size =
                p.radius + this.config.interactivity.modes.bubble.size * ratio
              if (size >= 0) {
                p.radius_bubble = size
              }
            } else {
              var dif = p.radius - this.config.interactivity.modes.bubble.size
              size = p.radius - dif * ratio
              if (size > 0) {
                p.radius_bubble = size
              } else {
                p.radius_bubble = 0
              }
            }
          }
          /* opacity */
          if (
            this.config.interactivity.modes.bubble.opacity !=
            this.config.particles.opacity.value
          ) {
            if (
              this.config.interactivity.modes.bubble.opacity! >
              this.config.particles.opacity.value
            ) {
              const opacity =
                this.config.interactivity.modes.bubble.opacity! * ratio
              if (
                opacity > p.opacity &&
                opacity <= this.config.interactivity.modes.bubble.opacity!
              ) {
                p.opacity_bubble = opacity
              }
            } else {
              const opacity =
                p.opacity -
                (this.config.particles.opacity.value -
                  this.config.interactivity.modes.bubble.opacity!) *
                  ratio
              if (
                opacity < p.opacity &&
                opacity >= this.config.interactivity.modes.bubble.opacity!
              ) {
                p.opacity_bubble = opacity
              }
            }
          }
        }
      } else {
        init()
      }
      /* mouseleave */
      if (this.config.interactivity.status == 'mouseleave') {
        init()
      }
    } else if (
      /* on click event */
      this.config.interactivity.events.onclick.enable &&
      this.config.interactivity.events.onclick.mode === 'bubble'
    ) {
      if (particulate.tmp.bubble_clicking) {
        var dx_mouse = p.x - this.config.interactivity.mouse!.click_pos_x!,
          dy_mouse = p.y - this.config.interactivity.mouse!.click_pos_y!,
          dist_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse),
          time_spent =
            (new Date().getTime() -
              this.config.interactivity.mouse!.click_time!) /
            1000
        if (time_spent > this.config.interactivity.modes.bubble.duration) {
          particulate.tmp.bubble_duration_end = true
        }
        if (time_spent > this.config.interactivity.modes.bubble.duration * 2) {
          particulate.tmp.bubble_clicking = false
          particulate.tmp.bubble_duration_end = false
        }
      }
      const process = (
        bubble_param: any,
        particles_param: any,
        p_obj_bubble: any,
        p_obj: any,
        id: 'size' | 'opacity'
      ) => {
        if (bubble_param != particles_param) {
          if (!particulate.tmp.bubble_duration_end) {
            if (dist_mouse <= this.config.interactivity.modes.bubble.distance) {
              if (p_obj_bubble != undefined) var obj = p_obj_bubble
              else var obj = p_obj
              if (obj != bubble_param) {
                var value =
                  p_obj -
                  (time_spent * (p_obj - bubble_param)) /
                    this.config.interactivity.modes.bubble.duration
                if (id == 'size') p.radius_bubble = value
                if (id == 'opacity') p.opacity_bubble = value
              }
            } else {
              if (id == 'size') p.radius_bubble = undefined
              if (id == 'opacity') p.opacity_bubble = undefined
            }
          } else {
            if (p_obj_bubble != undefined) {
              var value_tmp =
                  p_obj -
                  (time_spent * (p_obj - bubble_param)) /
                    this.config.interactivity.modes.bubble.duration,
                dif = bubble_param - value_tmp
              value = bubble_param + dif
              if (id == 'size') p.radius_bubble = value
              if (id == 'opacity') p.opacity_bubble = value
            }
          }
        }
      }
      if (particulate.tmp.bubble_clicking) {
        /* size */
        process(
          this.config.interactivity.modes.bubble.size,
          this.config.particles.size.value,
          p.radius_bubble,
          p.radius,
          'size'
        )
        /* opacity */
        process(
          this.config.interactivity.modes.bubble.opacity,
          this.config.particles.opacity.value,
          p.opacity_bubble,
          p.opacity,
          'opacity'
        )
      }
    }
  }
  repulseParticle(p: Particle) {
    if (
      this.config.interactivity.events.onhover.enable &&
      this.config.interactivity.events.onhover.mode === 'repulse' &&
      this.config.interactivity.status == 'mousemove'
    ) {
      var dx_mouse = p.x - this.config.interactivity.mouse!.pos_x,
        dy_mouse = p.y - this.config.interactivity.mouse!.pos_y,
        dist_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse)
      var normVec = { x: dx_mouse / dist_mouse, y: dy_mouse / dist_mouse },
        repulseRadius = this.config.interactivity.modes.repulse.distance,
        velocity = 100,
        repulseFactor = clamp(
          (1 / repulseRadius) *
            (-1 * Math.pow(dist_mouse / repulseRadius, 2) + 1) *
            repulseRadius *
            velocity,
          0,
          50
        )
      var pos = {
        x: p.x + normVec.x * repulseFactor,
        y: p.y + normVec.y * repulseFactor
      }
      if (this.config.particles.move.out_mode == 'bounce') {
        if (pos.x - p.radius > 0 && pos.x + p.radius < this.canvas.w)
          p.x = pos.x
        if (pos.y - p.radius > 0 && pos.y + p.radius < this.canvas.h)
          p.y = pos.y
      } else {
        p.x = pos.x
        p.y = pos.y
      }
    } else if (
      this.config.interactivity.events.onclick.enable &&
      this.config.interactivity.events.onclick.mode === 'repulse'
    ) {
      if (!particulate.tmp.repulse_finish) {
        particulate.tmp.repulse_count!++
        if (
          particulate.tmp.repulse_count == this.config.particles.array!.length
        ) {
          particulate.tmp.repulse_finish = true
        }
      }
      if (particulate.tmp.repulse_clicking) {
        var repulseRadius = Math.pow(
          this.config.interactivity.modes.repulse.distance / 6,
          3
        )
        var dx = this.config.interactivity.mouse!.click_pos_x! - p.x,
          dy = this.config.interactivity.mouse!.click_pos_y! - p.y,
          d = dx * dx + dy * dy
        var force = (-repulseRadius / d) * 1
        const process = () => {
          var f = Math.atan2(dy, dx)
          p.vx = force * Math.cos(f)
          p.vy = force * Math.sin(f)
          if (this.config.particles.move.out_mode == 'bounce') {
            var pos = {
              x: p.x + p.vx,
              y: p.y + p.vy
            }
            if (pos.x + p.radius > this.canvas.w) p.vx = -p.vx
            else if (pos.x - p.radius < 0) p.vx = -p.vx
            if (pos.y + p.radius > this.canvas.h) p.vy = -p.vy
            else if (pos.y - p.radius < 0) p.vy = -p.vy
          }
        }
        // default
        if (d <= repulseRadius) {
          process()
        }
      } else {
        if (particulate.tmp.repulse_clicking == false) {
          p.vx = p.vx_i
          p.vy = p.vy_i
        }
      }
    }
  }
  grabParticle = (p: Particle) => {
    if (
      this.config.interactivity.events.onhover.enable &&
      this.config.interactivity.status == 'mousemove'
    ) {
      var dx_mouse = p.x - this.config.interactivity.mouse!.pos_x,
        dy_mouse = p.y - this.config.interactivity.mouse!.pos_y,
        dist_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse)
      /* draw a line between the cursor and the particle if the distance between them is under the config distance */
      if (dist_mouse <= this.config.interactivity.modes.grab.distance) {
        var opacity_line =
          this.config.interactivity.modes.grab.line_linked.opacity -
          dist_mouse /
            (1 / this.config.interactivity.modes.grab.line_linked.opacity) /
            this.config.interactivity.modes.grab.distance
        if (opacity_line > 0) {
          /* style */
          var color_line = this.config.particles.line_linked.color_rgb_line!
          this.canvas.ctx!.strokeStyle =
            'rgba(' +
            color_line.r +
            ',' +
            color_line.g +
            ',' +
            color_line.b +
            ',' +
            opacity_line +
            ')'
          this.canvas.ctx!.lineWidth = this.config.particles.line_linked.width
          //this.canvas.ctx.lineCap = 'round'; /* performance issue */
          /* path */
          this.canvas.ctx!.beginPath()
          this.canvas.ctx!.moveTo(p.x, p.y)
          this.canvas.ctx!.lineTo(
            this.config.interactivity.mouse!.pos_x,
            this.config.interactivity.mouse!.pos_y
          )
          this.canvas.ctx!.stroke()
          this.canvas.ctx!.closePath()
        }
      }
    }
  }

  bounceParticles(p1: Particle, p2: Particle) {
    var dx = p1.x - p2.x,
      dy = p1.y - p2.y,
      dist = Math.sqrt(dx * dx + dy * dy),
      dist_p = p1.radius + p2.radius
    if (dist <= dist_p) {
      p1.vx = -p1.vx
      p1.vy = -p1.vy
      p2.vx = -p2.vx
      p2.vy = -p2.vy
    }
  }

  linkParticles(p1: Particle, p2: Particle) {
    var dx = p1.x - p2.x,
      dy = p1.y - p2.y,
      dist = Math.sqrt(dx * dx + dy * dy)
    /* draw a line between p1 and p2 if the distance between them is under the config distance */
    if (dist <= this.config.particles.line_linked.distance) {
      var opacity_line =
        this.config.particles.line_linked.opacity -
        dist /
          (1 / this.config.particles.line_linked.opacity) /
          this.config.particles.line_linked.distance
      if (opacity_line > 0) {
        /* style */
        var color_line = this.config.particles.line_linked.color_rgb_line!
        this.canvas.ctx!.strokeStyle =
          'rgba(' +
          color_line.r +
          ',' +
          color_line.g +
          ',' +
          color_line.b +
          ',' +
          opacity_line +
          ')'
        this.canvas.ctx!.lineWidth = this.config.particles.line_linked.width
        //this.canvas.ctx.lineCap = 'round'; /* performance issue */
        /* path */
        this.canvas.ctx!.beginPath()
        this.canvas.ctx!.moveTo(p1.x, p1.y)
        this.canvas.ctx!.lineTo(p2.x, p2.y)
        this.canvas.ctx!.stroke()
        this.canvas.ctx!.closePath()
      }
    }
  }
  attractParticles(p1: Particle, p2: Particle) {
    /* condensed particles */
    var dx = p1.x - p2.x,
      dy = p1.y - p2.y,
      dist = Math.sqrt(dx * dx + dy * dy)
    if (dist <= this.config.particles.line_linked.distance) {
      var ax = dx / (this.config.particles.move.attract.rotateX * 1000),
        ay = dy / (this.config.particles.move.attract.rotateY * 1000)
      p1.vx -= ax
      p1.vy -= ay
      p2.vx += ax
      p2.vy += ay
    }
  }

  start() {
    if (this.config.particles.shape.type === 'image') {
      particulate.tmp.img_type = this.config.particles.shape.image.src.substr(
        this.config.particles.shape.image.src.length - 3
      )
      this.loadImg(particulate.tmp.img_type!)
    } else {
      this.checkBeforeDraw()
    }
  }

  loadImg(type: string) {
    particulate.tmp.img_error = undefined
    if (this.config.particles.shape.image.src != '') {
      if (type == 'svg') {
        var xhr = new XMLHttpRequest()
        xhr.open('GET', this.config.particles.shape.image.src)
        xhr.onreadystatechange = data => {
          if (xhr.readyState == 4) {
            if (xhr.status == 200) {
              particulate.tmp.source_svg = xhr.response
              this.checkBeforeDraw!()
            } else {
              console.log('Error pJS - Image not found')
              particulate.tmp.img_error = true
            }
          }
        }
        xhr.send()
      } else {
        var img = new Image()
        img.addEventListener('load', () => {
          particulate.tmp.img_obj = img
          this.checkBeforeDraw!()
        })
        img.src = this.config.particles.shape.image.src
      }
    } else {
      console.log('Error pJS - No image.src')
      particulate.tmp.img_error = true
    }
  }

  checkBeforeDraw() {
    // if shape is image
    if (this.config.particles.shape.type == 'image') {
      if (
        particulate.tmp.img_type == 'svg' &&
        particulate.tmp.source_svg == undefined
      ) {
        particulate.tmp.checkAnimFrame = requestAnimationFrame(() => {})
      } else {
        //console.log('images loaded! cancel check');
        cancelAnimationFrame(particulate.tmp.checkAnimFrame!)
        if (!particulate.tmp.img_error) {
          this.init()
          this.draw()
        }
      }
    } else {
      this.init()
      this.draw()
    }
  }

  draw() {
    if (this.config.particles.shape.type == 'image') {
      if (particulate.tmp.img_type == 'svg') {
        if (particulate.tmp.count_svg! >= this.config.particles.number.value) {
          this.particlesDraw()
          if (!this.config.particles.move.enable)
            cancelAnimationFrame(this.drawAnimFrame!)
          else this.drawAnimFrame = requestAnimationFrame(() => this.draw())
        } else {
          //console.log('still loading...');
          if (!particulate.tmp.img_error)
            this.drawAnimFrame = requestAnimationFrame(() => this.draw())
        }
      } else {
        if (particulate.tmp.img_obj != undefined) {
          this.particlesDraw!()
          if (!this.config.particles.move.enable)
            cancelAnimationFrame(this.drawAnimFrame!)
          else this.drawAnimFrame = requestAnimationFrame(() => this.draw())
        } else {
          if (!particulate.tmp.img_error)
            this.drawAnimFrame = requestAnimationFrame(() => this.draw())
        }
      }
    } else {
      this.particlesDraw()
      if (!this.config.particles.move.enable)
        cancelAnimationFrame(this.drawAnimFrame!)
      else this.drawAnimFrame = requestAnimationFrame(() => this.draw())
    }
  }

  constructor(tag_id: string, params: RecursivePartial<Api>) {
    const canvas_el = document.querySelector<HTMLCanvasElement>(
      '#' + tag_id + ' > .particles-js-canvas-el'
    )!

    this.canvas = {
      el: canvas_el,
      w: canvas_el.offsetWidth,
      h: canvas_el.offsetHeight
    }

    /* particles.js variables with default values */
    this.config = apiDefaults
    /* params settings */
    if (params) {
      deepExtend(this.config, params)
    }
    particulate.tmp = {}
    particulate.tmp.obj = {
      size_value: this.config.particles.size.value,
      size_anim_speed: this.config.particles.size.anim.speed,
      move_speed: this.config.particles.move.speed,
      line_linked_distance: this.config.particles.line_linked.distance,
      line_linked_width: this.config.particles.line_linked.width,
      mode_grab_distance: this.config.interactivity.modes.grab.distance,
      mode_bubble_distance: this.config.interactivity.modes.bubble.distance,
      mode_bubble_size: this.config.interactivity.modes.bubble.size,
      mode_repulse_distance: this.config.interactivity.modes.repulse.distance
    }
    /* ---------- pJS functions - canvas ------------ */

    /* ---------- pJS functions - particles interaction ------------ */

    this.eventsListeners()
    this.start()
  }
}

export let pJSDom: particulate[] = []

export default function(tag_id: string, params: RecursivePartial<Api>) {
  //console.log(params);

  /* no string id? so it's object params, and set the id with default id */
  if (typeof tag_id != 'string') {
    params = tag_id
    tag_id = 'particles-js'
  }

  /* no id? set the id to default id */
  if (!tag_id) {
    tag_id = 'particles-js'
  }

  /* pJS elements */
  var pJS_tag = document.getElementById(tag_id),
    pJS_canvas_class = 'particles-js-canvas-el',
    exist_canvas = pJS_tag!.getElementsByClassName(pJS_canvas_class)

  /* remove canvas if exists into the pJS target tag */
  if (exist_canvas.length) {
    while (exist_canvas.length > 0) {
      pJS_tag!.removeChild(exist_canvas[0])
    }
  }

  /* create canvas element */
  var canvas_el = document.createElement('canvas')
  canvas_el.className = pJS_canvas_class

  /* set size canvas */
  canvas_el.style.width = '100%'
  canvas_el.style.height = '100%'

  /* append canvas */
  var canvas = document.getElementById(tag_id)!.appendChild(canvas_el)

  /* launch particle.js */
  if (canvas != null) {
    pJSDom.push(new particulate(tag_id, params))
  }
}
