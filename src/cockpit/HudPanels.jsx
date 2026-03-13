import { AU_KM, SPEED_OF_LIGHT_KM_S } from '../solarSystemData'

const TIME_WARP_LABELS = {
  1: '1x',
  60: '1 min/s',
  3600: '1 hr/s',
  86400: '1 day/s',
  604800: '1 wk/s',
  2592000: '1 mo/s',
}

function formatDist(km) {
  if (km < 1_000_000) return `${km.toFixed(0)} km`
  if (km < AU_KM) return `${(km / 1_000_000).toFixed(2)} M km`
  return `${(km / AU_KM).toFixed(4)} AU`
}

function formatSpeed(kmps) {
  if (kmps < 1) return `${(kmps * 1000).toFixed(0)} m/s`
  if (kmps < 1000) return `${kmps.toFixed(1)} km/s`
  return `${kmps.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} km/s`
}

const PHASE_LABELS = {
  turning: 'ALIGNING',
  accelerating: 'ACCELERATING',
  cruising: 'CRUISING',
  decelerating: 'DECELERATING',
  arriving: 'ARRIVING',
  idle: 'IDLE',
}

export default function HudPanels({ hud }) {
  const speedPct = (hud.speed / SPEED_OF_LIGHT_KM_S) * 100
  const simDays = Math.floor(hud.simTime)
  const simYears = (hud.simTime / 365.25).toFixed(2)
  const warpLabel = TIME_WARP_LABELS[hud.timeWarp] || `${hud.timeWarp}x`
  const ap = hud.autopilot
  const orb = hud.orbit

  return (
    <>
      <div className="hud top-left">
        <div className="hud-title">NAVIGATION</div>
        <div>Speed: {formatSpeed(hud.speed)}</div>
        <div>Throttle: {speedPct.toFixed(1)}% c</div>
        <div className="throttle-bar">
          <div className="throttle-fill" style={{ width: `${speedPct}%` }} />
        </div>
        <div>Position: ({hud.x.toFixed(3)}, {hud.y.toFixed(3)}, {hud.z.toFixed(3)}) AU</div>
        {ap?.active && (
          <div className="autopilot-status">
            AP: {ap.targetName} — {PHASE_LABELS[ap.phase] || ap.phase}
          </div>
        )}
        {orb?.active && (
          <div className="orbit-active-status">
            ORBIT: {orb.targetName}
          </div>
        )}
      </div>

      <div className="hud top-right">
        <div className="hud-title">PROXIMITY</div>
        <div>Nearest: {hud.nearest}</div>
        <div>Distance: {formatDist(hud.nearestDist)}</div>
      </div>

      <div className="hud bottom-left">
        <div className="hud-title">TIME</div>
        <div>Day {simDays} ({simYears} years)</div>
        <div>Warp: {warpLabel}</div>
      </div>

      <div className="hud bottom-right controls">
        <div className="hud-title">CONTROLS</div>
        <div>W/&#x2191; Accelerate</div>
        <div>S/&#x2193; Decelerate</div>
        <div>A/&#x2190; Yaw left</div>
        <div>D/&#x2192; Yaw right</div>
        <div>Q Pitch up</div>
        <div>E Pitch down</div>
        <div>Mouse Look (click)</div>
        <div>Space Brake</div>
        <div>, / . Time warp -/+</div>
        <div className="controls-divider" />
        <div>T Plot course</div>
        <div>O Orbit planet</div>
      </div>
    </>
  )
}
