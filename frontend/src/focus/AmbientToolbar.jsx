// 앰비언트 사운드 선택 + 데스크탑 알림 토글 + 단축키 안내 툴바.
export function AmbientToolbar({ ambient, notif }) {
  const notifOn = notif.permission === 'granted'
  const notifLabel = !notif.supported
    ? '🔕 알림 미지원'
    : notifOn
      ? '🔔 알림 켜짐'
      : '🔕 알림 켜기'

  return (
    <div className="qw-toolbar">
      <div className="qw-toolbar__group" role="group" aria-label="앰비언트 사운드">
        {ambient.presets.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`qw-chip ${ambient.current === p.id ? 'is-on' : ''}`}
            onClick={() => ambient.play(p.id)}
            title={`${p.label} 사운드`}
          >
            {p.label}
          </button>
        ))}
        {ambient.current !== 'off' && (
          <input
            className="qw-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={ambient.volume}
            onChange={(e) => ambient.setVolume(Number(e.target.value))}
            aria-label="사운드 볼륨"
            title="볼륨"
          />
        )}
      </div>

      <button
        type="button"
        className={`qw-chip ${notifOn ? 'is-on' : ''}`}
        onClick={() => !notifOn && notif.request()}
        disabled={!notif.supported}
        title="세션 종료 시 데스크탑 알림"
      >
        {notifLabel}
      </button>

      <span className="qw-hint" title="키보드 단축키">
        ⌨️ Space 시작/정지 · R 리셋 · S 건너뛰기
      </span>
    </div>
  )
}
