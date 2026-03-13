export default function CockpitOverlay() {
  return (
    <div className="cockpit-overlay">
      {/* Crosshair reticle */}
      <div className="crosshair">
        <div className="crosshair-h" />
        <div className="crosshair-v" />
        <div className="crosshair-circle" />
      </div>

      {/* Cockpit frame edges */}
      <div className="cockpit-frame cockpit-frame-top" />
      <div className="cockpit-frame cockpit-frame-bottom" />
      <div className="cockpit-frame cockpit-frame-left" />
      <div className="cockpit-frame cockpit-frame-right" />
    </div>
  )
}
