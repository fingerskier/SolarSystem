export default function OrbitPanel({ orbitState, nearestName, nearestDist, onToggleOrbit }) {
  const canOrbit = nearestDist < 0.01 // within ~1.5M km
  const isOrbiting = orbitState?.active

  return (
    <div className="orbit-panel">
      <div className="hud-title">ORBIT</div>
      {isOrbiting ? (
        <>
          <div className="orbit-status orbiting">ORBITING {orbitState.targetName}</div>
          <button className="plot-course-btn cancel-btn" onClick={() => onToggleOrbit(null)}>
            Break Orbit [O]
          </button>
        </>
      ) : canOrbit ? (
        <>
          <div className="orbit-status ready">ORBIT AVAILABLE</div>
          <div>{nearestName} in range</div>
          <button className="plot-course-btn active" onClick={() => onToggleOrbit(nearestName)}>
            Enter Orbit [O]
          </button>
        </>
      ) : (
        <>
          <div className="orbit-status">NO TARGET IN RANGE</div>
          <div className="orbit-hint">Approach a planet within ~1.5M km</div>
        </>
      )}
    </div>
  )
}
