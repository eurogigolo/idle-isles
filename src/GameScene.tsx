import { useEffect, useRef } from 'react'

export type GameSceneAction =
  | 'idle'
  | 'woodcutting'
  | 'fishing'
  | 'mining'
  | 'smelting'
  | 'combat'

interface GameSceneProps {
  area: string
  action: GameSceneAction
  isActive: boolean
  progress: number
}

type ParticleKind = 'rect' | 'spark' | 'drop' | 'dust' | 'text'
type EffectKind = 'woodcutting' | 'fishing' | 'mining' | 'smelting' | 'combat'
type ToolKind = 'axe' | 'rod' | 'pickaxe' | 'hammer' | 'sword'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
  color: string
  kind: ParticleKind
  size: number
  width?: number
  height?: number
  rotation?: number
  spin?: number
  text?: string
}

interface ImpactEffect {
  x: number
  y: number
  age: number
  life: number
  color: string
  kind: EffectKind
  strong: boolean
}

interface ScenePropsSnapshot {
  area: string
  action: GameSceneAction
  isActive: boolean
  progress: number
}

interface Pose {
  x: number
  y: number
  scale: number
  facing: 1 | -1
  bodyLean: number
  bodySway: number
  headTilt: number
  offArmAngle: number
  toolAngle: number
  toolKind: ToolKind
  done: boolean
  recoil: number
}

interface SceneSize {
  width: number
  height: number
}

const PARTICLE_LIMIT = 25
const DEFAULT_PROPS: ScenePropsSnapshot = {
  area: 'Hearth Camp',
  action: 'idle',
  isActive: false,
  progress: 0,
}

export function GameScene({ area, action, isActive, progress }: GameSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const propsRef = useRef<ScenePropsSnapshot>(DEFAULT_PROPS)
  const sizeRef = useRef<SceneSize>({ width: 1, height: 1 })
  const particlesRef = useRef<Particle[]>([])
  const effectsRef = useRef<ImpactEffect[]>([])
  const lastTimeRef = useRef(0)
  const phaseRef = useRef({ action: 'idle' as GameSceneAction, phase: 0, progress: 0 })
  const doneUntilRef = useRef(0)

  useEffect(() => {
    propsRef.current = { area, action, isActive, progress }
  }, [area, action, isActive, progress])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return undefined
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return undefined
    }

    const sceneCanvas = canvas
    const renderingContext = context

    function resizeCanvas() {
      const rect = sceneCanvas.getBoundingClientRect()
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.round(rect.width))
      const height = Math.max(1, Math.round(rect.height))

      sizeRef.current = { width, height }
      sceneCanvas.width = Math.round(width * pixelRatio)
      sceneCanvas.height = Math.round(height * pixelRatio)
      renderingContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    resizeCanvas()

    const resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(sceneCanvas)

    let frameId = 0

    function frame(time: number) {
      const previousTime = lastTimeRef.current || time
      const deltaMs = Math.min(48, time - previousTime || 16)
      lastTimeRef.current = time

      const snapshot = propsRef.current
      const cycleMs = getCycleMs(snapshot.action)
      const phase = snapshot.isActive
        ? (time % cycleMs) / cycleMs
        : (time % 3600) / 3600

      maybeSpawnImpact(snapshot, phase, time, sizeRef.current, particlesRef.current, effectsRef.current)
      updateParticles(particlesRef.current, deltaMs)
      updateEffects(effectsRef.current, deltaMs)
      drawScene(
        renderingContext,
        sizeRef.current,
        snapshot,
        phase,
        time,
        particlesRef.current,
        effectsRef.current,
        doneUntilRef.current > time,
      )

      frameId = window.requestAnimationFrame(frame)
    }

    frameId = window.requestAnimationFrame(frame)

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <canvas
      aria-label={`${area} ${action} scene`}
      className="game-scene-canvas"
      ref={canvasRef}
      role="img"
    />
  )

  function maybeSpawnImpact(
    snapshot: ScenePropsSnapshot,
    phase: number,
    time: number,
    size: SceneSize,
    particles: Particle[],
    effects: ImpactEffect[],
  ) {
    const previous = phaseRef.current

    if (previous.action !== snapshot.action || !snapshot.isActive) {
      phaseRef.current = { action: snapshot.action, phase, progress: snapshot.progress }
      return
    }

    const impactPhase = getImpactPhase(snapshot.action)
    const crossedImpact =
      snapshot.action !== 'idle' && crossedPhase(previous.phase, phase, impactPhase)
    const progressWrapped =
      snapshot.progress < Math.max(4, previous.progress - 35) ||
      (snapshot.progress >= 98 && previous.progress < 98)

    if (crossedImpact) {
      spawnImpact(snapshot.action, size, particles, effects, false)
    }

    if (progressWrapped && snapshot.action !== 'idle') {
      spawnImpact(snapshot.action, size, particles, effects, true)
      doneUntilRef.current = time + 1000
    }

    phaseRef.current = { action: snapshot.action, phase, progress: snapshot.progress }
  }
}

function getCycleMs(action: GameSceneAction) {
  if (action === 'fishing') {
    return 2200
  }

  if (action === 'mining') {
    return 1450
  }

  if (action === 'smelting' || action === 'combat') {
    return 1500
  }

  return 1800
}

function getImpactPhase(action: GameSceneAction) {
  if (action === 'fishing') {
    return 0.62
  }

  if (action === 'mining') {
    return 0.47
  }

  if (action === 'smelting') {
    return 0.52
  }

  if (action === 'combat') {
    return 0.43
  }

  return 0.55
}

function crossedPhase(previous: number, current: number, target: number) {
  return previous <= current
    ? previous < target && current >= target
    : previous < target || current >= target
}

function updateParticles(particles: Particle[], deltaMs: number) {
  for (const particle of particles) {
    const seconds = deltaMs / 1000

    particle.age += deltaMs
    particle.x += particle.vx * seconds
    particle.y += particle.vy * seconds
    particle.rotation = (particle.rotation ?? 0) + (particle.spin ?? 0) * seconds

    if (particle.kind !== 'text') {
      particle.vy += (particle.kind === 'dust' ? -18 : 560) * seconds
    }
  }

  removeExpired(particles)
}

function updateEffects(effects: ImpactEffect[], deltaMs: number) {
  for (const effect of effects) {
    effect.age += deltaMs
  }

  removeExpired(effects)
}

function removeExpired<T extends { age: number; life: number }>(items: T[]) {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (items[index].age >= items[index].life) {
      items.splice(index, 1)
    }
  }
}

function spawnImpact(
  action: GameSceneAction,
  size: SceneSize,
  particles: Particle[],
  effects: ImpactEffect[],
  strong: boolean,
) {
  const point = getImpactPoint(action, size)
  const effectKind: EffectKind = action === 'idle' ? 'woodcutting' : action

  effects.push({
    x: point.x,
    y: point.y,
    age: 0,
    life: action === 'combat' ? 170 : 130,
    color: action === 'mining' ? '#ffcf5f' : '#fff0a8',
    kind: effectKind,
    strong,
  })

  if (action === 'woodcutting') {
    const count = strong ? 12 : 8

    for (let index = 0; index < count; index += 1) {
      particles.push({
        x: point.x + randomRange(-4, 4),
        y: point.y + randomRange(-6, 6),
        vx: randomRange(-175, 120),
        vy: randomRange(-230, -80),
        age: 0,
        life: randomRange(430, 650),
        color: index % 2 === 0 ? '#b97943' : '#e1b46f',
        kind: 'rect',
        size: 1,
        width: randomRange(3, 5),
        height: randomRange(5, 8),
        rotation: randomRange(-0.8, 0.8),
        spin: randomRange(-5, 5),
      })
    }
  } else if (action === 'fishing') {
    const count = strong ? 9 : 6

    for (let index = 0; index < count; index += 1) {
      particles.push({
        x: point.x + randomRange(-5, 5),
        y: point.y + randomRange(-2, 4),
        vx: randomRange(-85, 85),
        vy: randomRange(-170, -70),
        age: 0,
        life: randomRange(360, 560),
        color: index % 2 === 0 ? '#d9f0e6' : '#8fc9bf',
        kind: 'drop',
        size: randomRange(2.4, 4.2),
      })
    }
  } else if (action === 'mining') {
    const sparkCount = strong ? 10 : 7

    for (let index = 0; index < sparkCount; index += 1) {
      particles.push({
        x: point.x,
        y: point.y,
        vx: randomRange(-135, 140),
        vy: randomRange(-250, -90),
        age: 0,
        life: randomRange(330, 520),
        color: index % 2 === 0 ? '#ffcb45' : '#ed8b34',
        kind: 'spark',
        size: randomRange(2, 3.8),
        rotation: randomRange(0, Math.PI),
        spin: randomRange(-7, 7),
      })
    }

    for (let index = 0; index < 3; index += 1) {
      particles.push({
        x: point.x + randomRange(-7, 7),
        y: point.y + randomRange(-2, 8),
        vx: randomRange(-25, 35),
        vy: randomRange(-45, -15),
        age: 0,
        life: randomRange(430, 640),
        color: '#a99a8d',
        kind: 'dust',
        size: randomRange(7, 11),
      })
    }
  } else if (action === 'smelting') {
    const count = strong ? 12 : 9

    for (let index = 0; index < count; index += 1) {
      particles.push({
        x: point.x + randomRange(-5, 5),
        y: point.y,
        vx: randomRange(-130, 160),
        vy: randomRange(-315, -110),
        age: 0,
        life: randomRange(380, 620),
        color: index % 3 === 0 ? '#fff0a8' : index % 2 === 0 ? '#ffbd55' : '#e85b3d',
        kind: 'spark',
        size: randomRange(2.2, 4.2),
        rotation: randomRange(0, Math.PI),
        spin: randomRange(-6, 6),
      })
    }
  } else if (action === 'combat') {
    const damage = strong ? '+2' : Math.random() > 0.45 ? '+2' : '+1'

    particles.push({
      x: point.x + 16,
      y: point.y - 36,
      vx: randomRange(-8, 8),
      vy: -42,
      age: 0,
      life: 720,
      color: '#f6edd5',
      kind: 'text',
      size: strong ? 18 : 15,
      text: damage,
    })
  }

  while (particles.length > PARTICLE_LIMIT) {
    particles.shift()
  }
}

function getImpactPoint(action: GameSceneAction, size: SceneSize) {
  const groundY = getGroundY(size.height)

  if (action === 'mining') {
    return { x: size.width * 0.38, y: groundY - 48 }
  }

  if (action === 'fishing') {
    return { x: size.width * 0.63, y: groundY + size.height * 0.12 }
  }

  if (action === 'smelting') {
    return { x: size.width * 0.62, y: groundY - 54 }
  }

  if (action === 'combat') {
    return { x: size.width * 0.68, y: groundY - 72 }
  }

  return { x: size.width * 0.35, y: groundY - 108 }
}

function drawScene(
  context: CanvasRenderingContext2D,
  size: SceneSize,
  snapshot: ScenePropsSnapshot,
  phase: number,
  time: number,
  particles: Particle[],
  effects: ImpactEffect[],
  done: boolean,
) {
  const { width, height } = size

  context.clearRect(0, 0, width, height)
  drawBackground(context, size, snapshot.area, snapshot.action, time)
  drawActionTarget(context, size, snapshot.action, phase, snapshot.isActive, effects, time)
  drawParticles(context, particles)
  drawEffects(context, effects)
  drawCharacter(
    context,
    getPoseForAction(snapshot.action, phase, snapshot.isActive, size, time, done),
  )
  drawWindowShade(context, size)
}

function drawBackground(
  context: CanvasRenderingContext2D,
  size: SceneSize,
  area: string,
  action: GameSceneAction,
  time: number,
) {
  const { width, height } = size
  const groundY = getGroundY(height)
  const forgeTint = action === 'smelting' ? 0.16 : 0
  const mineTint = action === 'mining' ? 0.1 : 0
  const fishingTint = action === 'fishing' ? 0.22 : 0
  const sky = context.createLinearGradient(0, 0, 0, height)

  sky.addColorStop(0, mixColor(mixColor('#5c7689', '#4e7892', fishingTint), '#544f68', mineTint))
  sky.addColorStop(
    0.52,
    mixColor(mixColor('#93c1b3', '#9cc8bb', fishingTint), '#a98b78', forgeTint + mineTint * 0.5),
  )
  sky.addColorStop(0.78, mixColor(mixColor('#e5c47c', '#dacb8d', fishingTint), '#d49a5a', forgeTint))
  sky.addColorStop(1, '#2c5746')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  drawSun(context, width * 0.82, height * 0.18, Math.max(34, Math.min(48, width * 0.065)))
  drawCloud(context, cloudX(width, time, 0.1), height * 0.21, width * 0.11, 0.75)
  drawCloud(context, cloudX(width, time, 0.56), height * 0.31, width * 0.082, 0.48)

  const hillBack = context.createLinearGradient(0, height * 0.42, 0, groundY)
  hillBack.addColorStop(
    0,
    action === 'smelting' ? '#846b58' : action === 'fishing' ? '#5f9078' : '#5d8567',
  )
  hillBack.addColorStop(
    1,
    action === 'smelting' ? '#4d453c' : action === 'fishing' ? '#2f6b62' : '#356b54',
  )
  context.fillStyle = hillBack
  context.beginPath()
  context.moveTo(0, groundY - height * 0.16)
  context.lineTo(width * 0.14, groundY - height * 0.28)
  context.lineTo(width * 0.29, groundY - height * 0.2)
  context.lineTo(width * 0.43, groundY - height * 0.34)
  context.lineTo(width * 0.58, groundY - height * 0.19)
  context.lineTo(width * 0.75, groundY - height * 0.3)
  context.lineTo(width, groundY - height * 0.17)
  context.lineTo(width, groundY)
  context.lineTo(0, groundY)
  context.closePath()
  context.fill()

  const treeAlpha = action === 'smelting' ? 0.34 : 0.52
  drawTree(context, width * 0.12, groundY + 4, 0.56, time, '#2f7450', treeAlpha)
  drawTree(context, width * 0.22, groundY + 2, 0.48, time + 800, '#276349', treeAlpha)
  drawTree(context, width * 0.83, groundY + 6, 0.52, time + 1500, '#2c6b4e', treeAlpha)
  drawTree(context, width * 0.92, groundY + 8, 0.42, time + 2200, '#235a42', treeAlpha)

  const ground = context.createLinearGradient(0, groundY, 0, height)
  ground.addColorStop(
    0,
    action === 'smelting'
      ? '#61463d'
      : action === 'mining'
        ? '#65574d'
        : action === 'fishing'
          ? '#74aebb'
          : '#2e7759',
  )
  ground.addColorStop(
    1,
    action === 'smelting'
      ? '#211b1a'
      : action === 'mining'
        ? '#2e2825'
        : action === 'fishing'
          ? '#24513c'
          : '#263a2e',
  )
  context.fillStyle = ground
  context.fillRect(0, groundY, width, height - groundY)

  if (action === 'fishing') {
    drawWaterLines(context, size, time)
  } else {
    context.strokeStyle = 'rgba(246, 237, 213, 0.08)'
    context.lineWidth = 1

    for (let x = -20; x < width + 24; x += 42) {
      context.beginPath()
      context.moveTo(x, groundY + 7)
      context.lineTo(x + 26, height)
      context.stroke()
    }
  }

  context.fillStyle = 'rgba(10, 13, 12, 0.14)'
  context.beginPath()
  context.ellipse(width * 0.5, groundY + height * 0.13, width * 0.24, height * 0.035, 0, 0, Math.PI * 2)
  context.fill()

  if (area.toLowerCase().includes('pine')) {
    drawTree(context, width * 0.7, groundY + 2, 0.55, time + 900, '#286557', 0.48)
  }
}

function drawSun(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  const glow = context.createRadialGradient(x, y, radius * 0.2, x, y, radius * 2.3)

  glow.addColorStop(0, 'rgba(240, 194, 94, 0.58)')
  glow.addColorStop(1, 'rgba(240, 194, 94, 0)')
  context.fillStyle = glow
  context.beginPath()
  context.arc(x, y, radius * 2.3, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = '#f0c25e'
  context.beginPath()
  context.arc(x, y, radius, 0, Math.PI * 2)
  context.fill()
}

function drawCloud(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  alpha: number,
) {
  context.save()
  context.globalAlpha = alpha
  context.fillStyle = '#f6edd5'
  fillPill(context, x, y, width, width * 0.22)
  context.beginPath()
  context.arc(x + width * 0.26, y, width * 0.18, 0, Math.PI * 2)
  context.arc(x + width * 0.58, y - width * 0.03, width * 0.14, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function drawWaterLines(context: CanvasRenderingContext2D, size: SceneSize, time: number) {
  const { width, height } = size
  const groundY = getGroundY(height)

  context.strokeStyle = 'rgba(246, 237, 213, 0.2)'
  context.lineWidth = 2
  context.lineCap = 'round'

  for (let row = 0; row < 5; row += 1) {
    const y = groundY + 28 + row * 24
    const offset = (time * 0.014 + row * 31) % 82

    for (let x = -80 + offset; x < width + 80; x += 82) {
      context.beginPath()
      context.moveTo(x, y)
      context.quadraticCurveTo(x + 18, y - 4, x + 36, y)
      context.quadraticCurveTo(x + 54, y + 4, x + 72, y)
      context.stroke()
    }
  }
}

function drawTree(
  context: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  scale: number,
  time: number,
  color: string,
  alpha = 1,
) {
  const rustle = Math.sin(time / 1900 + x * 0.02) * 0.025

  context.save()
  context.translate(x, groundY)
  context.scale(scale, scale)
  context.globalAlpha = alpha
  context.fillStyle = '#5f3b25'
  fillRoundRect(context, -8, -82, 16, 84, 5)
  context.translate(0, -82)
  context.rotate(rustle)
  context.fillStyle = color
  drawCanopy(context, 0, -34, 60, '#54aa6f', color)
  context.restore()
}

function drawCanopy(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  topColor: string,
  lowColor: string,
) {
  const gradient = context.createLinearGradient(0, y - size, 0, y + size * 0.5)

  gradient.addColorStop(0, topColor)
  gradient.addColorStop(1, lowColor)
  context.fillStyle = gradient
  context.beginPath()
  context.moveTo(x, y - size * 0.85)
  context.lineTo(x + size * 0.58, y + size * 0.18)
  context.lineTo(x + size * 0.28, y + size * 0.18)
  context.lineTo(x + size * 0.68, y + size * 0.74)
  context.lineTo(x - size * 0.68, y + size * 0.74)
  context.lineTo(x - size * 0.28, y + size * 0.18)
  context.lineTo(x - size * 0.58, y + size * 0.18)
  context.closePath()
  context.fill()
}

function cloudX(width: number, time: number, offset: number) {
  return ((time * 0.006 + width * offset) % (width + 180)) - 90
}

function drawActionTarget(
  context: CanvasRenderingContext2D,
  size: SceneSize,
  action: GameSceneAction,
  phase: number,
  isActive: boolean,
  effects: ImpactEffect[],
  time: number,
) {
  if (action === 'woodcutting') {
    drawProminentTree(context, size, phase, isActive, time)
  } else if (action === 'fishing') {
    drawFishingTarget(context, size, phase, isActive, effects, time)
  } else if (action === 'mining') {
    drawMiningRocks(context, size, phase, isActive)
  } else if (action === 'smelting') {
    drawForgeTarget(context, size, phase, isActive)
  } else if (action === 'combat') {
    drawEnemy(context, size, phase, isActive, effects)
  }
}

function drawProminentTree(
  context: CanvasRenderingContext2D,
  size: SceneSize,
  phase: number,
  isActive: boolean,
  time: number,
) {
  const groundY = getGroundY(size.height)
  const hitShake = isActive ? impactShake(phase, getImpactPhase('woodcutting'), 0.1) : 0
  const x = size.width * 0.35 + hitShake * 4
  const scale = sceneScale(size)

  context.save()
  context.translate(x, groundY + 3)
  context.scale(scale, scale)
  context.fillStyle = '#5f3b25'
  fillRoundRect(context, -12, -124, 24, 126, 6)
  context.fillStyle = 'rgba(246, 237, 213, 0.12)'
  fillRoundRect(context, -8, -116, 5, 104, 3)
  context.fillStyle = '#4b2f22'
  fillRoundRect(context, -30, -18, 22, 14, 8)
  fillRoundRect(context, 10, -12, 26, 14, 8)
  context.translate(0, -132)
  context.rotate(Math.sin(time / 1800) * 0.025 + hitShake * 0.03)
  drawCanopy(context, 0, -26, 74, '#58ad74', '#2f7750')
  drawCanopy(context, -8, -64, 54, '#6ab982', '#3b8a5f')
  context.restore()
}

function drawFishingTarget(
  context: CanvasRenderingContext2D,
  size: SceneSize,
  phase: number,
  isActive: boolean,
  effects: ImpactEffect[],
  time: number,
) {
  const groundY = getGroundY(size.height)
  const scale = sceneScale(size)
  const bobberX = size.width * 0.63
  const hitDip = isActive ? Math.abs(impactShake(phase, getImpactPhase('fishing'), 0.16)) : 0
  const bobberY = groundY + size.height * 0.12 + Math.sin(time / 620) * 3 + hitDip * 12
  const rodTipX = size.width * 0.42 + scale * 89
  const rodTipY = groundY - scale * 86

  context.save()
  context.strokeStyle = 'rgba(246, 237, 213, 0.62)'
  context.lineWidth = 1.5
  context.beginPath()
  context.moveTo(rodTipX, rodTipY)
  context.quadraticCurveTo(
    size.width * 0.53,
    groundY - size.height * 0.08,
    bobberX,
    bobberY - 3,
  )
  context.stroke()
  context.restore()

  drawFishShadow(context, size.width * 0.29, groundY + size.height * 0.13, time * 0.0012, 0.8)
  drawFishShadow(context, size.width * 0.78, groundY + size.height * 0.18, time * -0.001, 0.58)

  context.save()
  context.translate(bobberX, bobberY)
  context.strokeStyle = `rgba(246, 237, 213, ${0.34 + hitDip * 0.28})`
  context.lineWidth = 2

  for (let ring = 0; ring < 3; ring += 1) {
    const wave = ((time / 1200 + ring * 0.28) % 1) + hitDip * 0.32

    context.globalAlpha = Math.max(0, 1 - wave)
    context.beginPath()
    context.ellipse(0, 4, 16 + wave * 36, 5 + wave * 12, 0, 0, Math.PI * 2)
    context.stroke()
  }

  context.globalAlpha = 1
  context.fillStyle = '#f6edd5'
  fillRoundRect(context, -4, -12, 8, 18, 4)
  context.fillStyle = '#9c2e43'
  fillRoundRect(context, -4, -12, 8, 8, 4)
  context.restore()

  if (effects.some((effect) => effect.kind === 'fishing' && effect.age < 180)) {
    context.save()
    context.translate(bobberX, bobberY)
    context.strokeStyle = 'rgba(246, 237, 213, 0.72)'
    context.lineWidth = 2
    context.beginPath()
    context.arc(-9, -4, 8, Math.PI * 0.9, Math.PI * 1.8)
    context.stroke()
    context.beginPath()
    context.arc(10, -2, 7, Math.PI * 1.2, Math.PI * 2.1)
    context.stroke()
    context.restore()
  }
}

function drawFishShadow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  phase: number,
  scale: number,
) {
  context.save()
  context.translate(x + Math.sin(phase) * 22, y + Math.cos(phase * 1.3) * 5)
  context.scale(scale, scale)
  context.globalAlpha = 0.28
  context.fillStyle = '#21473f'
  context.beginPath()
  context.ellipse(0, 0, 28, 9, 0, 0, Math.PI * 2)
  context.fill()
  context.beginPath()
  context.moveTo(-24, 0)
  context.lineTo(-42, -10)
  context.lineTo(-40, 10)
  context.closePath()
  context.fill()
  context.restore()
}

function drawMiningRocks(
  context: CanvasRenderingContext2D,
  size: SceneSize,
  phase: number,
  isActive: boolean,
) {
  const groundY = getGroundY(size.height)
  const shake = isActive ? impactShake(phase, getImpactPhase('mining'), 0.1) * 4 : 0
  const scale = sceneScale(size)

  context.save()
  context.translate(size.width * 0.38 + shake, groundY - 4)
  context.scale(scale, scale)
  drawBoulder(context, -54, -56, 116, 68, '#77685f', '#4c4542')
  context.fillStyle = '#c07a42'
  fillRoundRect(context, -28, -42, 8, 44, 4)
  fillRoundRect(context, 12, -48, 7, 50, 4)
  context.fillStyle = '#a99a8d'
  drawBoulder(context, 64, -34, 50, 34, '#94877a', '#5b524d')
  drawBoulder(context, -102, -28, 44, 28, '#8a7c70', '#534a45')
  context.restore()
}

function drawForgeTarget(
  context: CanvasRenderingContext2D,
  size: SceneSize,
  phase: number,
  isActive: boolean,
) {
  const groundY = getGroundY(size.height)
  const scale = sceneScale(size)
  const pulse = isActive ? impactShake(phase, getImpactPhase('smelting'), 0.12) : 0

  context.save()
  context.translate(size.width * 0.62, groundY - 2)
  context.scale(scale, scale)

  context.fillStyle = '#22282c'
  fillRoundRect(context, -40, -54, 80, 16, 5)
  fillRoundRect(context, -24, -42, 48, 34, 5)
  context.fillStyle = '#303943'
  fillRoundRect(context, -55, -63, 110, 16, 8)

  context.fillStyle = pulse > 0.02 ? '#fff0a8' : '#ff9e4a'
  fillRoundRect(context, -30, -73, 60, 9, 5)
  context.fillStyle = `rgba(255, 150, 67, ${0.2 + pulse * 0.28})`
  context.beginPath()
  context.ellipse(0, -66, 48, 19, 0, 0, Math.PI * 2)
  context.fill()
  context.restore()

  context.save()
  context.translate(size.width * 0.84, groundY)
  context.scale(scale, scale)
  context.fillStyle = '#2b2422'
  fillRoundRect(context, -42, -68, 84, 68, 8)
  context.fillStyle = '#ef6a3d'
  fillRoundRect(context, -30, -71, 60, 16, 8)
  context.fillStyle = `rgba(255, 184, 77, ${0.58 + Math.sin(phase * Math.PI * 2) * 0.16})`
  context.beginPath()
  context.ellipse(0, -63, 30, 10, 0, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function drawEnemy(
  context: CanvasRenderingContext2D,
  size: SceneSize,
  phase: number,
  isActive: boolean,
  effects: ImpactEffect[],
) {
  const groundY = getGroundY(size.height)
  const scale = sceneScale(size)
  const hit = isActive ? impactShake(phase, getImpactPhase('combat'), 0.18) : 0
  const recoil = hit * 12
  const flashing = effects.some((effect) => effect.kind === 'combat' && effect.age < 80)

  context.save()
  context.translate(size.width * 0.68 + recoil, groundY - 2)
  context.scale(scale, scale)
  context.fillStyle = 'rgba(10, 13, 12, 0.2)'
  context.beginPath()
  context.ellipse(0, 0, 42, 9, 0, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = flashing ? '#ffd5d5' : '#8a6a58'
  context.beginPath()
  context.ellipse(0, -38, 38, 28, 0, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = flashing ? '#fff8f0' : '#6c5147'
  context.beginPath()
  context.arc(-22, -58, 12, 0, Math.PI * 2)
  context.arc(22, -58, 12, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#26342f'
  context.beginPath()
  context.arc(-13, -43, 3, 0, Math.PI * 2)
  context.arc(11, -43, 3, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function drawBoulder(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  topColor: string,
  lowColor: string,
) {
  const gradient = context.createLinearGradient(x, y, x, y + height)

  gradient.addColorStop(0, topColor)
  gradient.addColorStop(1, lowColor)
  context.fillStyle = gradient
  context.beginPath()
  context.moveTo(x + width * 0.16, y + height * 0.2)
  context.lineTo(x + width * 0.5, y)
  context.lineTo(x + width * 0.87, y + height * 0.22)
  context.lineTo(x + width, y + height * 0.72)
  context.lineTo(x + width * 0.68, y + height)
  context.lineTo(x + width * 0.18, y + height * 0.9)
  context.lineTo(x, y + height * 0.54)
  context.closePath()
  context.fill()
}

function drawCharacter(context: CanvasRenderingContext2D, pose: Pose) {
  context.save()
  context.translate(pose.x + pose.recoil + pose.bodySway, pose.y)
  context.scale(pose.scale * pose.facing, pose.scale)
  context.rotate(pose.bodyLean)

  context.fillStyle = 'rgba(10, 13, 12, 0.24)'
  context.beginPath()
  context.ellipse(0, 4, 36, 9, 0, 0, Math.PI * 2)
  context.fill()

  drawLegs(context)
  drawArm(context, -13, -56, pose.offArmAngle, 28, '#d69a58')
  drawToolArm(context, pose.toolAngle, pose.toolKind)
  drawBody(context)

  context.save()
  context.translate(0, -84)
  context.rotate(pose.headTilt)
  drawHead(context)
  context.restore()

  if (pose.done) {
    context.fillStyle = '#f6edd5'
    context.beginPath()
    context.arc(23, -96, 3, 0, Math.PI * 2)
    context.arc(32, -106, 2.2, 0, Math.PI * 2)
    context.fill()
  }

  context.restore()
}

function drawLegs(context: CanvasRenderingContext2D) {
  context.fillStyle = '#26342f'
  fillRoundRect(context, -14, -34, 10, 36, 4)
  fillRoundRect(context, 5, -34, 10, 36, 4)
  context.fillStyle = '#1d2724'
  fillRoundRect(context, -18, -3, 17, 7, 3)
  fillRoundRect(context, 4, -3, 17, 7, 3)
}

function drawBody(context: CanvasRenderingContext2D) {
  const tunic = context.createLinearGradient(0, -70, 0, -32)

  tunic.addColorStop(0, '#c24a61')
  tunic.addColorStop(1, '#823044')
  context.fillStyle = tunic
  fillRoundRect(context, -17, -72, 34, 42, 9)
  context.fillStyle = 'rgba(255, 255, 255, 0.13)'
  fillRoundRect(context, -12, -67, 6, 31, 4)
  context.fillStyle = '#26342f'
  fillRoundRect(context, -18, -37, 36, 7, 3)
}

function drawHead(context: CanvasRenderingContext2D) {
  context.fillStyle = '#d69a58'
  context.beginPath()
  context.arc(0, 0, 15, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#d4a72c'
  fillRoundRect(context, -15, -16, 30, 12, 6)
  context.fillStyle = '#26342f'
  context.beginPath()
  context.arc(-5, -1, 2, 0, Math.PI * 2)
  context.arc(6, -1, 2, 0, Math.PI * 2)
  context.fill()
}

function drawArm(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  color: string,
) {
  context.save()
  context.translate(x, y)
  context.rotate(angle)
  context.strokeStyle = color
  context.lineWidth = 8
  context.lineCap = 'round'
  context.beginPath()
  context.moveTo(0, 0)
  context.lineTo(length, 0)
  context.stroke()
  context.strokeStyle = '#26342f'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(length * 0.62, 4)
  context.lineTo(length, 4)
  context.stroke()
  context.restore()
}

function drawToolArm(context: CanvasRenderingContext2D, angle: number, toolKind: ToolKind) {
  drawArm(context, 12, -58, angle + 0.15, 30, '#d69a58')

  context.save()
  context.translate(28, -58)
  context.rotate(angle)
  drawTool(context, toolKind)
  context.restore()
}

function drawTool(context: CanvasRenderingContext2D, toolKind: ToolKind) {
  if (toolKind === 'sword') {
    context.fillStyle = '#d9e1e6'
    fillRoundRect(context, 0, -3, 58, 6, 3)
    context.fillStyle = '#d4a72c'
    fillRoundRect(context, -5, -8, 12, 16, 4)
    context.fillStyle = '#5f3b25'
    fillRoundRect(context, -16, -3, 16, 6, 3)
    return
  }

  if (toolKind === 'rod') {
    context.strokeStyle = '#8a5c36'
    context.lineWidth = 5
    context.lineCap = 'round'
    context.beginPath()
    context.moveTo(0, 0)
    context.quadraticCurveTo(38, -8, 84, -18)
    context.stroke()
    context.strokeStyle = '#f6edd5'
    context.lineWidth = 1.5
    context.beginPath()
    context.moveTo(78, -17)
    context.lineTo(88, -19)
    context.stroke()
    return
  }

  const handleLength = toolKind === 'hammer' ? 46 : 58

  context.fillStyle = toolKind === 'hammer' ? '#5f3b25' : '#8a5c36'
  fillRoundRect(context, 0, -3, handleLength, 6, 3)
  context.fillStyle = '#9ba7af'

  if (toolKind === 'axe') {
    context.beginPath()
    context.moveTo(handleLength - 3, -18)
    context.lineTo(handleLength + 19, -8)
    context.lineTo(handleLength + 18, 9)
    context.lineTo(handleLength - 5, 17)
    context.lineTo(handleLength + 2, 0)
    context.closePath()
    context.fill()
  } else if (toolKind === 'pickaxe') {
    fillRoundRect(context, handleLength - 22, -7, 44, 9, 5)
    context.beginPath()
    context.moveTo(handleLength - 24, -5)
    context.lineTo(handleLength - 38, 2)
    context.lineTo(handleLength - 19, 3)
    context.closePath()
    context.fill()
  } else {
    fillRoundRect(context, handleLength - 8, -13, 24, 26, 5)
  }
}

function getPoseForAction(
  action: GameSceneAction,
  phase: number,
  isActive: boolean,
  size: SceneSize,
  time: number,
  done: boolean,
): Pose {
  const scale = sceneScale(size)
  const groundY = getGroundY(size.height)
  const idleWave = Math.sin(time / 1900)
  const base: Pose = {
    x: size.width * 0.5,
    y: groundY,
    scale,
    facing: 1,
    bodyLean: idleWave * 0.025,
    bodySway: idleWave * 3,
    headTilt: idleWave * 0.08,
    offArmAngle: 0.55 + idleWave * 0.08,
    toolAngle: -1.18 + idleWave * 0.05,
    toolKind: 'axe',
    done,
    recoil: 0,
  }

  if (!isActive || action === 'idle') {
    return base
  }

  if (done) {
    return {
      ...base,
      x:
        action === 'combat'
          ? size.width * 0.43
          : action === 'smelting'
            ? size.width * 0.49
            : action === 'fishing'
              ? size.width * 0.42
              : size.width * 0.53,
      facing: action === 'woodcutting' || action === 'mining' ? -1 : 1,
      bodyLean: -0.04,
      headTilt: 0.07,
      offArmAngle: 0.35,
      toolAngle: 1.15,
      toolKind: toolForAction(action),
    }
  }

  if (action === 'woodcutting') {
    const swing = swingValue(phase, 0.24, 0.55, 0.82)

    return {
      ...base,
      x: size.width * 0.53,
      facing: -1,
      bodyLean: -0.08 + swing * 0.2,
      bodySway: 0,
      headTilt: -0.05 + swing * 0.12,
      offArmAngle: 0.2 + swing * 0.28,
      toolAngle: lerp(-1.95, 0.62, swing),
      toolKind: 'axe',
    }
  }

  if (action === 'fishing') {
    const tug = Math.abs(impactShake(phase, getImpactPhase('fishing'), 0.22))
    const breathing = Math.sin(phase * Math.PI * 2) * 0.03

    return {
      ...base,
      x: size.width * 0.42,
      facing: 1,
      bodyLean: -0.03 - tug * 0.1,
      bodySway: Math.sin(phase * Math.PI * 2) * 1.5 - tug * 3,
      headTilt: -0.04 + tug * 0.12,
      offArmAngle: 0.28 + tug * 0.18,
      toolAngle: -0.62 + breathing - tug * 0.18,
      toolKind: 'rod',
    }
  }

  if (action === 'mining') {
    const swing = swingValue(phase, 0.2, 0.47, 0.76)

    return {
      ...base,
      x: size.width * 0.52,
      facing: -1,
      bodyLean: -0.05 + swing * 0.24,
      bodySway: 0,
      headTilt: swing * 0.1,
      offArmAngle: 0.12 + swing * 0.32,
      toolAngle: lerp(-1.75, 0.85, swing),
      toolKind: 'pickaxe',
    }
  }

  if (action === 'smelting') {
    const swing = swingValue(phase, 0.22, 0.52, 0.78)

    return {
      ...base,
      x: size.width * 0.48,
      facing: 1,
      bodyLean: -0.04 + swing * 0.18,
      bodySway: 0,
      headTilt: swing * 0.08,
      offArmAngle: 0.18 + swing * 0.24,
      toolAngle: lerp(-1.65, 1.1, swing),
      toolKind: 'hammer',
    }
  }

  const attack = swingValue(phase, 0.18, 0.43, 0.7)
  const enemyAttack = phase > 0.72 && phase < 0.88 ? Math.sin(((phase - 0.72) / 0.16) * Math.PI) : 0

  return {
    ...base,
    x: size.width * 0.43,
    facing: 1,
    bodyLean: 0.04 + attack * 0.18,
    bodySway: attack * 8,
    headTilt: attack * 0.06,
    offArmAngle: 0.2 + attack * 0.18,
    toolAngle: lerp(-0.95, 0.12, attack),
    toolKind: 'sword',
    recoil: -enemyAttack * 8,
  }
}

function toolForAction(action: GameSceneAction): ToolKind {
  if (action === 'mining') {
    return 'pickaxe'
  }

  if (action === 'fishing') {
    return 'rod'
  }

  if (action === 'smelting') {
    return 'hammer'
  }

  if (action === 'combat') {
    return 'sword'
  }

  return 'axe'
}

function swingValue(phase: number, raiseEnd: number, hitAt: number, recoverEnd: number) {
  if (phase < raiseEnd) {
    return easeInOut(phase / raiseEnd) * 0.28
  }

  if (phase < hitAt) {
    return lerp(0.28, 1, easeInCubic((phase - raiseEnd) / (hitAt - raiseEnd)))
  }

  if (phase < recoverEnd) {
    return lerp(1, 0, easeOutCubic((phase - hitAt) / (recoverEnd - hitAt)))
  }

  return 0
}

function impactShake(phase: number, hitAt: number, duration: number) {
  const distance = phase >= hitAt ? phase - hitAt : phase + 1 - hitAt

  if (distance > duration) {
    return 0
  }

  const fade = 1 - distance / duration
  return Math.sin(distance * Math.PI * 16) * fade
}

function drawParticles(context: CanvasRenderingContext2D, particles: Particle[]) {
  for (const particle of particles) {
    const alpha = Math.max(0, 1 - particle.age / particle.life)

    context.save()
    context.globalAlpha = alpha
    context.translate(particle.x, particle.y)
    context.rotate(particle.rotation ?? 0)
    context.fillStyle = particle.color
    context.strokeStyle = particle.color

    if (particle.kind === 'text') {
      context.font = `700 ${particle.size}px system-ui, sans-serif`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(particle.text ?? '', 0, 0)
    } else if (particle.kind === 'dust' || particle.kind === 'drop') {
      context.beginPath()
      context.arc(0, 0, particle.size, 0, Math.PI * 2)
      context.fill()
    } else if (particle.kind === 'spark') {
      context.lineWidth = 2
      context.lineCap = 'round'
      context.beginPath()
      context.moveTo(-particle.size * 1.6, 0)
      context.lineTo(particle.size * 1.6, 0)
      context.stroke()
    } else {
      fillRoundRect(
        context,
        -(particle.width ?? 4) / 2,
        -(particle.height ?? 6) / 2,
        particle.width ?? 4,
        particle.height ?? 6,
        1.5,
      )
    }

    context.restore()
  }
}

function drawEffects(context: CanvasRenderingContext2D, effects: ImpactEffect[]) {
  for (const effect of effects) {
    const alpha = Math.max(0, 1 - effect.age / effect.life)

    if (effect.kind === 'fishing') {
      const spread = effect.age / effect.life

      context.save()
      context.translate(effect.x, effect.y)
      context.globalAlpha = alpha
      context.strokeStyle = '#d9f0e6'
      context.lineWidth = 2
      context.beginPath()
      context.ellipse(0, 3, 18 + spread * 34, 7 + spread * 12, 0, 0, Math.PI * 2)
      context.stroke()
      context.beginPath()
      context.moveTo(-11, -5)
      context.quadraticCurveTo(-4, -18, 2, -5)
      context.quadraticCurveTo(10, -17, 15, -5)
      context.stroke()
      context.restore()
      continue
    }

    const lineCount = effect.strong ? 7 : 4
    const radius = effect.strong ? 30 : 20

    context.save()
    context.translate(effect.x, effect.y)
    context.globalAlpha = alpha
    context.strokeStyle = effect.color
    context.lineWidth = effect.kind === 'combat' ? 3 : 2
    context.lineCap = 'round'

    for (let index = 0; index < lineCount; index += 1) {
      const angle = (index / lineCount) * Math.PI * 2
      const inner = radius * 0.3
      const outer = radius * (0.78 + effect.age / effect.life * 0.28)

      context.beginPath()
      context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
      context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
      context.stroke()
    }

    if (effect.kind === 'smelting') {
      context.fillStyle = `rgba(255, 189, 85, ${alpha * 0.5})`
      context.beginPath()
      context.ellipse(0, 0, radius * 1.15, radius * 0.5, 0, 0, Math.PI * 2)
      context.fill()
    }

    context.restore()
  }
}

function drawWindowShade(context: CanvasRenderingContext2D, size: SceneSize) {
  const { width, height } = size
  const vignette = context.createRadialGradient(
    width * 0.5,
    height * 0.5,
    Math.min(width, height) * 0.28,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.72,
  )

  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(8, 11, 10, 0.28)')
  context.fillStyle = vignette
  context.fillRect(0, 0, width, height)

  context.strokeStyle = 'rgba(246, 237, 213, 0.08)'
  context.lineWidth = 1

  for (let x = 0; x < width; x += 40) {
    context.beginPath()
    context.moveTo(x + 0.5, 0)
    context.lineTo(x + 0.5, height)
    context.stroke()
  }

  for (let y = 0; y < height; y += 40) {
    context.beginPath()
    context.moveTo(0, y + 0.5)
    context.lineTo(width, y + 0.5)
    context.stroke()
  }
}

function fillRoundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
  context.fill()
}

function fillPill(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  fillRoundRect(context, x - width / 2, y - height / 2, width, height, height / 2)
}

function sceneScale(size: SceneSize) {
  return Math.max(0.72, Math.min(1.12, Math.min(size.width / 720, size.height / 420)))
}

function getGroundY(height: number) {
  return height * 0.74
}

function easeInOut(value: number) {
  const clamped = clamp01(value)

  return clamped < 0.5 ? 2 * clamped * clamped : 1 - Math.pow(-2 * clamped + 2, 2) / 2
}

function easeInCubic(value: number) {
  const clamped = clamp01(value)

  return clamped * clamped * clamped
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - clamp01(value), 3)
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function mixColor(from: string, to: string, amount: number) {
  const fromRgb = colorToRgb(from)
  const toRgb = colorToRgb(to)
  const mixAmount = clamp01(amount)
  const red = Math.round(lerp(fromRgb.red, toRgb.red, mixAmount))
  const green = Math.round(lerp(fromRgb.green, toRgb.green, mixAmount))
  const blue = Math.round(lerp(fromRgb.blue, toRgb.blue, mixAmount))

  return `rgb(${red}, ${green}, ${blue})`
}

function colorToRgb(color: string) {
  if (color.startsWith('#')) {
    return hexToRgb(color)
  }

  const match = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(color)

  if (match) {
    return {
      red: Number(match[1]),
      green: Number(match[2]),
      blue: Number(match[3]),
    }
  }

  return { red: 0, green: 0, blue: 0 }
}

function hexToRgb(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16)

  return {
    red: (value >> 16) & 255,
    green: (value >> 8) & 255,
    blue: value & 255,
  }
}
