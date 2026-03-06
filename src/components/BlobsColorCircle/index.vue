<template>
  <div class="flow-circle" :class="{ paused: isPaused }" :style="wrapperStyle">
    <canvas ref="canvasEl"></canvas>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

/**
 * FlowCircleCanvas.vue
 * 纯 Canvas 的圆形颜色流转组件
 * - mode: 'blobs'（液态翻涌） | 'conic'（色环旋转，需支持 createConicGradient）
 * - 默认 blobs + 6s/圈；高分屏适配；透明背景；提供导出与播放控制
 */

interface Props {
  /** 圆直径（px） */
  size?: number
  /** 动画模式：'blobs' | 'conic' */
  mode?: 'blobs' | 'conic'
  /** 速度（秒/圈，越小越快） */
  speed?: number
  /** 颜色数组（>=2 更好看） */
  colors?: string[]
  /** 初始是否暂停 */
  paused?: boolean
  /** conic 模式色带微波动（0~1） */
  wobble?: number
  /** 柔光投影 */
  glow?: boolean
  /** 主色索引（用于提升主色存在感），默认第一个 */
  primaryIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 260,
  mode: 'blobs',
  speed: 6, // 默认 6 秒/圈
  // 默认配色（紫粉渐变色系）：浅紫粉、中粉紫、中紫色、深紫色
  colors: () => ['#E8D5FF', '#C084FC', '#8B5FFF', '#5D4AFF'],
  paused: false,
  wobble: 0.2,
  // 取消外部发光，整体更“平面”
  glow: false,
  primaryIndex: 0
})

const canvasEl = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let rafId = 0
let start = performance.now()
let running = !props.paused

const isPaused = computed(() => !running)
const dpr = () => Math.max(1, Math.min(2, window.devicePixelRatio || 1))

const wrapperStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  filter: props.glow ? 'drop-shadow(0 0 12px rgba(255,255,255,0.28))' : 'none'
}))

function hexToRgba(hex: string, a = 1) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const num = parseInt(h, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r},${g},${b},${a})`
}

function resizeCanvas() {
  if (!canvasEl.value || !ctx) return
  const s = props.size
  const _dpr = dpr()
  const cvs = canvasEl.value
  cvs.width = Math.round(s * _dpr)
  cvs.height = Math.round(s * _dpr)
  cvs.style.width = `${s}px`
  cvs.style.height = `${s}px`
  ctx.setTransform(_dpr, 0, 0, _dpr, 0, 0) // 逻辑像素坐标
}

function renderOneFrame(
  c: CanvasRenderingContext2D,
  t: number,
  size: number,
  mode: 'blobs' | 'conic',
  colors: string[],
  speed: number,
  wobble: number
) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2

  c.clearRect(0, 0, size, size)

  // 圆形裁剪
  c.save()
  c.beginPath()
  c.arc(cx, cy, r, 0, Math.PI * 2)
  c.clip()

  if (mode === 'conic' && 'createConicGradient' in c) {
    drawConic(c, t, cx, cy, r, size, colors, speed, wobble)
  } else if (mode === 'blobs') {
    drawBlobs(c, t, cx, cy, r, size, colors, speed)
  } else {
    drawConicFallback(c, t, cx, cy, r, size, colors, speed)
  }

  c.restore()
}

function drawConic(
  c: CanvasRenderingContext2D,
  t: number,
  cx: number,
  cy: number,
  r: number,
  size: number,
  colors: string[],
  speedSecPerTurn: number,
  wobble: number
) {
  const grad = c.createConicGradient(0, cx, cy)
  const n = colors.length
  const amp = Math.min(0.45 / n, wobble * 0.12)
  for (let i = 0; i < n; i++) {
    const base = i / n
    const pos = base + amp * Math.sin(t * 0.6 + i * 1.7)
    grad.addColorStop(((pos % 1) + 1) % 1, colors[i])
  }
  grad.addColorStop(1, colors[0])

  const ang = (t / Math.max(0.0001, speedSecPerTurn)) * Math.PI * 2
  c.save()
  c.translate(cx, cy)
  c.rotate(ang)
  c.translate(-cx, -cy)
  c.fillStyle = grad
  c.fillRect(0, 0, size, size)
  c.restore()
}

function drawConicFallback(
  c: CanvasRenderingContext2D,
  t: number,
  cx: number,
  cy: number,
  r: number,
  size: number,
  colors: string[],
  speedSecPerTurn: number
) {
  const steps = 240
  const ang0 = (t / Math.max(0.0001, speedSecPerTurn)) * Math.PI * 2
  for (let s = 0; s < steps; s++) {
    const p = s / steps
    const idx = p * colors.length
    const i0 = Math.floor(idx) % colors.length
    const i1 = (i0 + 1) % colors.length
    const k = idx - Math.floor(idx)
    const col = lerpColor(colors[i0], colors[i1], k)
    c.beginPath()
    c.moveTo(cx, cy)
    c.arc(cx, cy, r, ang0 + p * 2 * Math.PI, ang0 + (p + 1 / steps) * 2 * Math.PI)
    c.closePath()
    c.fillStyle = col
    c.fill()
  }
}

function drawBlobs(
  c: CanvasRenderingContext2D,
  t: number,
  cx: number,
  cy: number,
  r: number,
  size: number,
  colors: string[],
  speedSecPerTurn: number
) {
  const or = r * 0.42 // 轨道半径略调小，运动更丝滑
  const w = size
  const h = size

  // 透明背景
  c.globalCompositeOperation = 'source-over'
  c.clearRect(0, 0, w, h)

  // 采用更“平面”的叠加：颜色块柔和过渡，无球面暗边
  // 使用 screen 代替 lighter，减少发白过曝，更像水面层层叠加
  c.globalCompositeOperation = 'screen'
  const omega = (2 * Math.PI) / Math.max(0.0001, speedSecPerTurn)
  for (let i = 0; i < colors.length; i++) {
    const a = t * omega + i * 2.1

    // 通过多频正弦叠加制造轻微“涌动”偏移，营造水流感
    const driftX = 0.08 * r * Math.sin(t * 1.7 + i * 1.3) + 0.05 * r * Math.sin(t * 0.9 + i * 2.2)
    const driftY = 0.08 * r * Math.cos(t * 1.4 + i * 0.7) + 0.05 * r * Math.cos(t * 1.1 + i * 1.8)

    const x = cx + or * Math.cos(a * 0.9 + i) + driftX
    const y = cy + or * Math.sin(a * 1.1 + i * 0.3) + driftY

    // 颜色在相邻色间缓慢过渡，像水的色带流动
    const j = (i + 1) % colors.length
    let mix = 0.5 + 0.45 * Math.sin(t * 0.55 + i * 0.8)
    // 若混合涉及白色，降低白色参与度
    const iNearWhite = isColorNearWhite(colors[i])
    const jNearWhite = isColorNearWhite(colors[j])
    if (jNearWhite && !iNearWhite) mix = Math.min(mix, 0.35) // 往 i 偏
    if (iNearWhite && !jNearWhite) mix = Math.max(mix, 0.65) // 往 j 偏
    const rgbaStrong = lerpColorToRgba(colors[i], colors[j], mix, 0.9)
    const rgbaWeak = lerpColorToRgba(colors[i], colors[j], mix, 0.0)

    // 对接近白色的部分降低中心不透明度和影响半径，减少整体“发白”占比
    const isNearWhite = iNearWhite || jNearWhite
    let alphaScale = isNearWhite ? 0.35 : 1.0
    let radiusScale = isNearWhite ? 0.72 : 0.9

    // 提升主色存在感
    const primaryIdx = props.primaryIndex ?? 0
    if (i === primaryIdx) {
      alphaScale *= 1.25
      radiusScale = Math.min(0.98, radiusScale + 0.08)
    }

    const grad = c.createRadialGradient(x, y, 0, x, y, r * radiusScale)
    grad.addColorStop(0.0, rgbaWithAlpha(rgbaStrong, 0.92 * alphaScale))
    grad.addColorStop(0.62, rgbaWithAlpha(rgbaStrong, 0.92 * alphaScale))
    grad.addColorStop(1.0, rgbaWeak)

    c.fillStyle = grad
    c.beginPath()
    c.rect(0, 0, w, h)
    c.fill()
  }
  c.globalCompositeOperation = 'source-over'
}

function lerpColor(c1: string, c2: string, t: number) {
  const a = parseInt(c1.slice(1), 16)
  const b = parseInt(c2.slice(1), 16)
  const r1 = (a >> 16) & 255, g1 = (a >> 8) & 255, b1 = a & 255
  const r2 = (b >> 16) & 255, g2 = (b >> 8) & 255, b2 = b & 255
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const bl = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${bl})`
}

function lerpColorToRgba(c1: string, c2: string, t: number, a: number) {
  const A = parseInt(c1.slice(1), 16)
  const B = parseInt(c2.slice(1), 16)
  const r1 = (A >> 16) & 255, g1 = (A >> 8) & 255, b1 = A & 255
  const r2 = (B >> 16) & 255, g2 = (B >> 8) & 255, b2 = B & 255
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgba(${r},${g},${b},${a})`
}

function isColorNearWhite(hex: string) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const num = parseInt(h, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  // 距离白色的曼哈顿距离阈值，小于此值认为接近白色
  return (255 - r) + (255 - g) + (255 - b) < 45
}

function rgbaWithAlpha(rgba: string, alpha: number) {
  // 输入形如 rgba(r,g,b,a) 或 rgb(r,g,b)
  if (rgba.startsWith('rgba')) {
    return rgba.replace(/rgba\(([^)]+)\)/, (_m, inner) => {
      const parts = inner.split(',').map((s: string) => s.trim())
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`
    })
  } else if (rgba.startsWith('rgb')) {
    return rgba.replace(/rgb\(([^)]+)\)/, (_m, inner) => `rgba(${inner}, ${alpha})`)
  }
  return rgba
}

function loop(now: number) {
  if (!running) {
    rafId = requestAnimationFrame(loop)
    return
  }
  const t = (now - start) / 1000
  renderOneFrame(ctx!, t, props.size, props.mode, props.colors, props.speed, props.wobble)
  rafId = requestAnimationFrame(loop)
}

function play() { running = true }
function pause() { running = false }
function toggle() { running = !running }

/** 导出为圆形 PNG（默认 2x 分辨率） */
function exportPNG(scale = 2) {
  if (!canvasEl.value) return
  const s = props.size * scale
  const off = document.createElement('canvas')
  off.width = off.height = s
  const oc = off.getContext('2d')!
  const t = (performance.now() - start) / 1000
  renderOneFrame(oc, t, s, props.mode, props.colors, props.speed, props.wobble)
  const url = off.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = 'flow-circle.png'
  a.click()
}

onMounted(() => {
  const cvs = canvasEl.value!
  ctx = cvs.getContext('2d')
  if (!ctx) return
  resizeCanvas()
  start = performance.now()
  rafId = requestAnimationFrame(loop)
})

onUnmounted(() => cancelAnimationFrame(rafId))

watch(() => props.size, resizeCanvas)
watch(() => props.paused, (val) => { running = !val })
// 颜色/速度/模式/wobble 变更会在下一帧自动生效

defineExpose({ play, pause, toggle, exportPNG, canvas: canvasEl })
</script>

<style scoped>
.flow-circle {
  position: relative;
  display: inline-block;
  border-radius: 50%;
  overflow: hidden;
}
canvas {
  display: block;
  border-radius: 50%;
}
.paused {
  filter: saturate(.9) contrast(.96);
}
</style>
