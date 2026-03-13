import { ALL_BODIES } from '../solarSystemData'

const targets = ALL_BODIES.map(b => b.name)

export default function PlotCourse({ visible, onSelect, onClose, currentTarget }) {
  if (!visible) return null

  return (
    <div className="plot-course-panel">
      <div className="hud-title">PLOT COURSE</div>
      <div className="plot-course-hint">Select destination:</div>
      <div className="plot-course-list">
        {targets.map(name => (
          <button
            key={name}
            className={`plot-course-btn ${name === currentTarget ? 'active' : ''}`}
            onClick={() => onSelect(name)}
          >
            {name}
            {name === currentTarget && ' ●'}
          </button>
        ))}
      </div>
      <div className="plot-course-actions">
        {currentTarget && (
          <button className="plot-course-btn cancel-btn" onClick={() => onSelect(null)}>
            Disengage
          </button>
        )}
        <button className="plot-course-btn close-btn" onClick={onClose}>
          Close [T]
        </button>
      </div>
    </div>
  )
}
