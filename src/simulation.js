import { PLANETS, SUN, AU_KM, SPEED_OF_LIGHT_KM_S } from './solarSystemData'

// Simulation works in AU for positions, km/s for speeds
// Time is tracked in simulation-days

export function createSimulation() {
  // Ship state
  const ship = {
    x: 0,          // AU
    y: 1.2,        // AU — start just outside Earth's orbit
    z: 0,          // AU — altitude above ecliptic
    vx: 0,         // AU/s (simulation seconds)
    vy: 0,
    vz: 0,
    heading: -Math.PI / 2, // pointing toward sun initially
    pitch: 0,      // radians, positive = nose up
    roll: 0,
    throttle: 0,   // 0..1 fraction of lightspeed
    speed: 0,      // current speed in km/s
  }

  // Simulation time in days from epoch
  let simTime = 0
  // Time warp multiplier: 1 = real time, higher = faster
  let timeWarp = 1

  function getBodyPosition(body, time) {
    if (body.orbitRadius === 0) return { x: 0, y: 0 }
    const angularVelocity = (2 * Math.PI) / body.orbitalPeriod // radians per day
    const angle = body.startAngle + angularVelocity * time
    return {
      x: body.orbitRadius * Math.cos(angle),
      y: body.orbitRadius * Math.sin(angle),
    }
  }

  function update(dt, keys) {
    // dt is real seconds from requestAnimationFrame
    const simDt = dt * timeWarp // simulated seconds worth of days
    const dayDt = simDt / 86400 // convert sim-seconds to days

    // Steering
    const turnRate = 2.0 // radians per real second
    if (keys.left) ship.heading -= turnRate * dt
    if (keys.right) ship.heading += turnRate * dt
    if (keys.pitchUp) ship.pitch += turnRate * dt
    if (keys.pitchDown) ship.pitch -= turnRate * dt

    // Mouse look deltas (from pointer lock)
    if (keys.yawDelta) {
      ship.heading += keys.yawDelta
      keys.yawDelta = 0
    }
    if (keys.pitchDelta) {
      ship.pitch += keys.pitchDelta
      keys.pitchDelta = 0
    }

    // Clamp pitch to avoid flipping
    ship.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, ship.pitch))

    // Throttle control (fraction of c)
    const throttleRate = 0.15 // per second
    if (keys.up) ship.throttle = Math.min(1, ship.throttle + throttleRate * dt)
    if (keys.down) ship.throttle = Math.max(0, ship.throttle - throttleRate * dt)
    if (keys.brake) ship.throttle = Math.max(0, ship.throttle - throttleRate * 3 * dt)

    // Speed in km/s
    ship.speed = ship.throttle * SPEED_OF_LIGHT_KM_S

    // Convert speed to AU/s for position updates
    const speedAU = ship.speed / AU_KM

    // Apply velocity in heading+pitch direction (3D)
    ship.vx = speedAU * Math.cos(ship.pitch) * Math.cos(ship.heading)
    ship.vy = speedAU * Math.cos(ship.pitch) * Math.sin(ship.heading)
    ship.vz = speedAU * Math.sin(ship.pitch)

    // Update position (multiply by timeWarp so ship also moves faster in warp)
    ship.x += ship.vx * simDt
    ship.y += ship.vy * simDt
    ship.z += ship.vz * simDt

    // Advance simulation time
    simTime += dayDt

    // Compute planet positions (planets stay in ecliptic plane, pz=0)
    const bodies = [
      { ...SUN, px: 0, py: 0, pz: 0 },
      ...PLANETS.map(p => {
        const pos = getBodyPosition(p, simTime)
        return { ...p, px: pos.x, py: pos.y, pz: 0 }
      }),
    ]

    return {
      ship: { ...ship },
      bodies,
      simTime,
      timeWarp,
    }
  }

  function setTimeWarp(w) {
    timeWarp = w
  }

  function getState() {
    const bodies = [
      { ...SUN, px: 0, py: 0, pz: 0 },
      ...PLANETS.map(p => {
        const pos = getBodyPosition(p, simTime)
        return { ...p, px: pos.x, py: pos.y, pz: 0 }
      }),
    ]
    return { ship: { ...ship }, bodies, simTime, timeWarp }
  }

  return { update, setTimeWarp, getState }
}
