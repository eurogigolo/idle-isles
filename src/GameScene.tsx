import type { ActivityDefinition } from './game'

interface GameSceneProps {
  activity: ActivityDefinition | null
  isActive: boolean
  progress: number
}

export function GameScene({ activity, isActive, progress }: GameSceneProps) {
  const sceneMode = getSceneMode(activity)
  const sceneClass = activity
    ? `scene-${activity.group.toLowerCase()} scene-${sceneMode}`
    : 'scene-idle'

  return (
    <div className={`space-scene ${sceneClass}`}>
      <div className="starfield" />
      <div className="scene-aurora" />
      <div className="scene-grid" />
      <div className="scene-scanlines" />
      <div className="orbit-ring outer" />
      <div className="orbit-ring inner" />
      <div className="scene-particles">
        <span className="particle one" />
        <span className="particle two" />
        <span className="particle three" />
        <span className="particle four" />
      </div>
      <SceneBody mode={sceneMode} />
      <div className={isActive ? 'ship active' : 'ship'}>
        <span className="ship-nose" />
        <span className="ship-core" />
        <span className="ship-wing left" />
        <span className="ship-wing right" />
        <span className="ship-trail" />
      </div>
      <SceneEffect mode={sceneMode} isActive={isActive} />
      <div className="scene-readout">
        <span>{activity ? activity.group : 'Docked'}</span>
        <strong>{activity ? activity.name : 'Awaiting mission'}</strong>
      </div>
      <div className="scene-progress">
        <span style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

type SceneMode =
  | 'idle'
  | 'asteroid-mining'
  | 'wreck-salvage'
  | 'nebula-siphoning'
  | 'exo-surveying'
  | 'production'
  | 'combat'

function getSceneMode(activity: ActivityDefinition | null): SceneMode {
  if (!activity) return 'idle'

  switch (activity.primarySkill) {
    case 'asteroidMining':
      return 'asteroid-mining'
    case 'wreckSalvage':
      return 'wreck-salvage'
    case 'nebulaSiphoning':
      return 'nebula-siphoning'
    case 'exoSurveying':
      return 'exo-surveying'
    case 'shipyardFabrication':
    case 'lifeSystemsSynthesis':
    case 'quantumRefining':
    case 'nanofabAssembly':
      return 'production'
    case 'gunnery':
    case 'engineering':
      return 'combat'
  }
}

function SceneBody({ mode }: { mode: SceneMode }) {
  if (mode === 'asteroid-mining') {
    return (
      <div className="scene-body asteroid-field">
        <span className="asteroid large" />
        <span className="asteroid medium" />
        <span className="asteroid small" />
      </div>
    )
  }

  if (mode === 'wreck-salvage') {
    return (
      <div className="scene-body wreck-field">
        <span className="wreck-hull" />
        <span className="wreck-panel one" />
        <span className="wreck-panel two" />
      </div>
    )
  }

  if (mode === 'nebula-siphoning') {
    return (
      <div className="scene-body nebula-cloud">
        <span className="cloud one" />
        <span className="cloud two" />
        <span className="cloud three" />
      </div>
    )
  }

  if (mode === 'exo-surveying') {
    return (
      <div className="scene-body planet-scan">
        <span className="planet" />
        <span className="scan-ring one" />
        <span className="scan-ring two" />
      </div>
    )
  }

  if (mode === 'production') {
    return (
      <div className="scene-body fabrication-grid">
        <span className="fab-ring" />
        <span className="fab-core" />
        <span className="fab-arm one" />
        <span className="fab-arm two" />
      </div>
    )
  }

  if (mode === 'combat') {
    return (
      <div className="scene-body threat-lock">
        <span className="enemy-core" />
        <span className="target-ring one" />
        <span className="target-ring two" />
      </div>
    )
  }

  return (
    <div className="scene-body dock-lane">
      <span className="station-ring" />
      <span className="station-core" />
    </div>
  )
}

function SceneEffect({ mode, isActive }: { mode: SceneMode; isActive: boolean }) {
  return (
    <div className={isActive ? 'scene-effect active' : 'scene-effect'}>
      {mode === 'combat' ? (
        <>
          <span className="bolt one" />
          <span className="bolt two" />
          <span className="impact-pulse" />
          <span className="damage-flare one" />
          <span className="damage-flare two" />
        </>
      ) : mode === 'production' ? (
        <>
          <span className="fab-beam one" />
          <span className="fab-beam two" />
          <span className="assembly-spark" />
          <span className="assembly-spark two" />
        </>
      ) : mode === 'nebula-siphoning' ? (
        <>
          <span className="siphon-line one" />
          <span className="siphon-line two" />
          <span className="collector-glow" />
        </>
      ) : mode === 'exo-surveying' ? (
        <>
          <span className="scan-line" />
          <span className="probe-dot one" />
          <span className="probe-dot two" />
        </>
      ) : (
        <>
          <span className="work-beam" />
          <span className="dust one" />
          <span className="dust two" />
        </>
      )}
    </div>
  )
}
