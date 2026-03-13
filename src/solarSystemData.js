// Real solar system data
// Distances in AU (1 AU = 149,597,870.7 km)
// Radii in km
// Orbital periods in Earth days
// Colors are approximate visual colors

export const AU_KM = 149_597_870.7
export const SPEED_OF_LIGHT_KM_S = 299_792.458
export const SPEED_OF_LIGHT_AU_S = SPEED_OF_LIGHT_KM_S / AU_KM

export const SUN = {
  name: 'Sun',
  radius: 696_340,
  color: '#FDB813',
  glowColor: 'rgba(253, 184, 19, 0.3)',
  orbitRadius: 0,
  orbitalPeriod: 0,
  startAngle: 0,
  isStar: true,
}

export const PLANETS = [
  {
    name: 'Mercury',
    radius: 2_439.7,
    color: '#B5A7A7',
    orbitRadius: 0.387,   // AU
    orbitalPeriod: 87.97, // days
    startAngle: Math.random() * Math.PI * 2,
  },
  {
    name: 'Venus',
    radius: 6_051.8,
    color: '#E8CDA0',
    orbitRadius: 0.723,
    orbitalPeriod: 224.7,
    startAngle: Math.random() * Math.PI * 2,
  },
  {
    name: 'Earth',
    radius: 6_371,
    color: '#6B93D6',
    orbitRadius: 1.0,
    orbitalPeriod: 365.25,
    startAngle: Math.random() * Math.PI * 2,
  },
  {
    name: 'Mars',
    radius: 3_389.5,
    color: '#C1440E',
    orbitRadius: 1.524,
    orbitalPeriod: 687.0,
    startAngle: Math.random() * Math.PI * 2,
  },
  {
    name: 'Jupiter',
    radius: 69_911,
    color: '#C88B3A',
    orbitRadius: 5.203,
    orbitalPeriod: 4_332.59,
    startAngle: Math.random() * Math.PI * 2,
  },
  {
    name: 'Saturn',
    radius: 58_232,
    color: '#E8D191',
    orbitRadius: 9.537,
    orbitalPeriod: 10_759.22,
    startAngle: Math.random() * Math.PI * 2,
    rings: { innerRadius: 74_500, outerRadius: 140_220, color: 'rgba(210, 190, 150, 0.5)' },
  },
  {
    name: 'Uranus',
    radius: 25_362,
    color: '#D1E7E7',
    orbitRadius: 19.191,
    orbitalPeriod: 30_688.5,
    startAngle: Math.random() * Math.PI * 2,
  },
  {
    name: 'Neptune',
    radius: 24_622,
    color: '#5B5DDF',
    orbitRadius: 30.069,
    orbitalPeriod: 60_182.0,
    startAngle: Math.random() * Math.PI * 2,
  },
]

export const ALL_BODIES = [SUN, ...PLANETS]
