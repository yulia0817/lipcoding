// 모닥불 시각화. intensity(0~1)에 따라 불꽃이 커지고, active=false면 잔잔한 불씨.
export function Campfire({ intensity = 0, active = false }) {
  // idle에서도 불꽃이 분명히 보이도록 최소 크기를 키움(0.35 → 0.6)
  const scale = active ? 0.7 + intensity * 0.8 : 0.6
  const brightness = active ? 0.8 + intensity * 0.6 : 0.7
  return (
    <div className="campfire" aria-hidden="true">
      <div
        className={`campfire__flames ${active ? 'is-active' : 'is-idle'}`}
        style={{ '--cf-scale': scale, '--cf-bright': brightness }}
      >
        <span className="campfire__flame campfire__flame--outer" />
        <span className="campfire__flame campfire__flame--mid" />
        <span className="campfire__flame campfire__flame--inner" />
      </div>
      <div className="campfire__logs">
        <span className="campfire__log campfire__log--a" />
        <span className="campfire__log campfire__log--b" />
      </div>
      <div
        className="campfire__glow"
        style={{ opacity: active ? 0.3 + intensity * 0.4 : 0.2 }}
      />
    </div>
  )
}
