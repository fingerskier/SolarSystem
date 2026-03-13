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

  // Autopilot state
  let autopilot = {
    active: false,
    targetName: null,
    phase: 'idle', // 'turning', 'accelerating', 'cruising', 'decelerating', 'arriving'
  }

  // Orbit state
  let orbit = {
    active: false,
    targetName: null,
    altitude: 0, // orbit altitude in AU
    angle: 0,    // current orbit angle
  }

  function getBodyPosition(body, time) {
    if (body.orbitRadius === 0) return { x: 0, y: 0 }
    const angularVelocity = (2 * Math.PI) / body.orbitalPeriod // radians per day
    const angle = body.startAngle + angularVelocity * time
    return {
      x: body.orbitRadius * Math.cos(angle),
      y: body.orbitRadius * Math.sin(angle),
    }
  }

  function findBody(name) {
    if (name === 'Sun') return SUN
    return PLANETS.find(p => p.name === name)
  }

  function getBodyPos(name, time) {
    const body = findBody(name)
    if (!body) return null
    if (body.orbitRadius === 0) return { x: 0, y: 0, z: 0 }
    const pos = getBodyPosition(body, time)
    return { x: pos.x, y: pos.y, z: 0 }
  }

  function distToBody(name, time) {
    const pos = getBodyPos(name, time)
    if (!pos) return Infinity
    const dx = pos.x - ship.x
    const dy = pos.y - ship.y
    const dz = pos.z - ship.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  // Orbit radius in AU: visual orbit is proportional to planet radius
  function orbitAltitudeForBody(name) {
    const body = findBody(name)
    if (!body) return 0.001
    // Orbit at ~3x the planet's radius (in AU)
    return Math.max((body.radius * 3) / AU_KM, 0.0005)
  }

  function setAutopilot(targetName) {
    if (!targetName) {
      autopilot = { active: false, targetName: null, phase: 'idle' }
      return
    }
    // Cancel orbit if active
    if (orbit.active) {
      orbit = { active: false, targetName: null, altitude: 0, angle: 0 }
    }
    autopilot = { active: true, targetName, phase: 'turning' }
  }

  function setOrbit(targetName) {
    if (orbit.active) {
      // Disengage orbit
      orbit = { active: false, targetName: null, altitude: 0, angle: 0 }
      return
    }
    if (!targetName) return
    // Cancel autopilot
    autopilot = { active: false, targetName: null, phase: 'idle' }

    const alt = orbitAltitudeForBody(targetName)
    const pos = getBodyPos(targetName, simTime)
    if (!pos) return

    // Calculate initial orbit angle from ship position relative to body
    const dx = ship.x - pos.x
    const dy = ship.y - pos.y
    const angle = Math.atan2(dy, dx)

    orbit = { active: true, targetName, altitude: alt, angle }
    ship.throttle = 0
    ship.speed = 0
  }

  function getAutopilotState() {
    return { ...autopilot }
  }

  function getOrbitState() {
    return { ...orbit }
  }

  function normalizeAngle(a) {
    while (a > Math.PI) a -= 2 * Math.PI
    while (a < -Math.PI) a += 2 * Math.PI
    return a
  }

  function updateAutopilot(dt, simDt) {
    if (!autopilot.active) return
    const pos = getBodyPos(autopilot.targetName, simTime)
    if (!pos) { autopilot.active = false; return }

    const dx = pos.x - ship.x
    const dy = pos.y - ship.y
    const dz = pos.z - ship.z
    const distAU = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const distKm = distAU * AU_KM

    // Target heading and pitch
    const targetHeading = Math.atan2(dy, dx)
    const horizontalDist = Math.sqrt(dx * dx + dy * dy)
    const targetPitch = Math.atan2(dz, horizontalDist)

    const headingError = normalizeAngle(targetHeading - ship.heading)
    const pitchError = targetPitch - ship.pitch

    const turnRate = 3.0 * dt
    const aligned = Math.abs(headingError) < 0.05 && Math.abs(pitchError) < 0.05

    // Always steer toward target
    if (Math.abs(headingError) > 0.001) {
      ship.heading += Math.sign(headingError) * Math.min(Math.abs(headingError), turnRate)
    }
    if (Math.abs(pitchError) > 0.001) {
      ship.pitch += Math.sign(pitchError) * Math.min(Math.abs(pitchError), turnRate)
    }
    ship.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, ship.pitch))

    // Arrival threshold: close enough to enter orbit range
    const arrivalDist = orbitAltitudeForBody(autopilot.targetName) * 5

    if (distAU < arrivalDist) {
      // Arrived - brake to stop
      autopilot.phase = 'arriving'
      ship.throttle = Math.max(0, ship.throttle - 0.5 * dt)
      if (ship.throttle < 0.001) {
        ship.throttle = 0
        autopilot.phase = 'idle'
        autopilot.active = false
      }
    } else {
      // Calculate stopping distance at current speed
      // Deceleration rate: throttleRate * 3 * c (brake rate)
      const brakeDecel = 0.15 * 3 * SPEED_OF_LIGHT_KM_S // km/s per real second
      const stoppingDistKm = (ship.speed * ship.speed) / (2 * brakeDecel)
      const stoppingDistAU = stoppingDistKm / AU_KM

      if (stoppingDistAU >= distAU * 0.8) {
        // Need to decelerate
        autopilot.phase = 'decelerating'
        ship.throttle = Math.max(0.001, ship.throttle - 0.3 * dt)
      } else if (aligned) {
        // Accelerate — target throttle proportional to distance
        autopilot.phase = distAU > 0.5 ? 'cruising' : 'accelerating'
        const targetThrottle = Math.min(1.0, distAU * 2)
        if (ship.throttle < targetThrottle) {
          ship.throttle = Math.min(1, ship.throttle + 0.15 * dt)
        }
      } else {
        autopilot.phase = 'turning'
      }
    }
  }

  function updateOrbit(dt, simDt) {
    if (!orbit.active) return
    const pos = getBodyPos(orbit.targetName, simTime)
    if (!pos) { orbit.active = false; return }

    // Orbital speed: complete orbit in ~60 real-seconds (regardless of body size)
    const orbitPeriodSec = 60
    const angularSpeed = (2 * Math.PI) / orbitPeriodSec
    orbit.angle += angularSpeed * dt

    // Position ship in orbit
    ship.x = pos.x + orbit.altitude * Math.cos(orbit.angle)
    ship.y = pos.y + orbit.altitude * Math.sin(orbit.angle)
    ship.z = 0

    // Point ship along orbit tangent
    ship.heading = orbit.angle + Math.PI / 2
    ship.pitch = 0

    // Zero throttle/speed while orbiting
    ship.throttle = 0
    ship.speed = 0
    ship.vx = 0
    ship.vy = 0
    ship.vz = 0
  }

  function update(dt, keys) {
    // dt is real seconds from requestAnimationFrame
    const simDt = dt * timeWarp // simulated seconds worth of days
    const dayDt = simDt / 86400 // convert sim-seconds to days

    // Handle orbit mode
    if (orbit.active) {
      // Advance simulation time
      simTime += dayDt
      updateOrbit(dt, simDt)

      // Compute planet positions
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
        autopilot: getAutopilotState(),
        orbit: getOrbitState(),
      }
    }

    // Handle autopilot
    if (autopilot.active) {
      updateAutopilot(dt, simDt)
    }

    // Manual steering (only when autopilot is off)
    if (!autopilot.active) {
      const turnRate = 2.0
      if (keys.left) ship.heading -= turnRate * dt
      if (keys.right) ship.heading += turnRate * dt
      if (keys.pitchUp) ship.pitch += turnRate * dt
      if (keys.pitchDown) ship.pitch -= turnRate * dt

      if (keys.yawDelta) {
        ship.heading += keys.yawDelta
        keys.yawDelta = 0
      }
      if (keys.pitchDelta) {
        ship.pitch += keys.pitchDelta
        keys.pitchDelta = 0
      }

      ship.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, ship.pitch))

      // Throttle control (fraction of c)
      const throttleRate = 0.15
      if (keys.up) ship.throttle = Math.min(1, ship.throttle + throttleRate * dt)
      if (keys.down) ship.throttle = Math.max(0, ship.throttle - throttleRate * dt)
      if (keys.brake) ship.throttle = Math.max(0, ship.throttle - throttleRate * 3 * dt)
    }

    // Speed in km/s
    ship.speed = ship.throttle * SPEED_OF_LIGHT_KM_S

    // Convert speed to AU/s for position updates
    const speedAU = ship.speed / AU_KM

    // Apply velocity in heading+pitch direction (3D)
    ship.vx = speedAU * Math.cos(ship.pitch) * Math.cos(ship.heading)
    ship.vy = speedAU * Math.cos(ship.pitch) * Math.sin(ship.heading)
    ship.vz = speedAU * Math.sin(ship.pitch)

    // Update position
    ship.x += ship.vx * simDt
    ship.y += ship.vy * simDt
    ship.z += ship.vz * simDt

    // Advance simulation time
    simTime += dayDt

    // Compute planet positions
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
      autopilot: getAutopilotState(),
      orbit: getOrbitState(),
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
    return {
      ship: { ...ship },
      bodies,
      simTime,
      timeWarp,
      autopilot: getAutopilotState(),
      orbit: getOrbitState(),
    }
  }

  return { update, setTimeWarp, getState, setAutopilot, setOrbit, distToBody }
}
