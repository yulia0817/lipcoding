import { Modal } from '../design'
import { IconKeyboard, IconVolume, IconPalette } from '../design/icons'
import './howto.css'

const STEPS = [
  {
    n: '1',
    title: '집중할 일 적기',
    desc: '“무엇에 집중할까요?” 칸에 할 일을 적어요. 음성(🎤)으로도 입력할 수 있어요. 카테고리·태그도 달 수 있어요.',
  },
  {
    n: '2',
    title: '시작 → 짧은 준비 화면',
    desc: '시작을 누르면 장착한 스킨에 맞춘 준비 화면이 잠깐 나와요. 화면을 누르면 바로 건너뛸 수 있어요.',
  },
  {
    n: '3',
    title: '집중 타이머',
    desc: '설정한 시간만큼 타이머가 돌아가요. 집중할수록 가운데 불꽃이 더 크게 타올라요. Space로 일시정지/재개할 수 있어요.',
  },
  {
    n: '4',
    title: '한 줄 회고 → 휴식',
    desc: '집중이 끝나면 한 줄 회고를 남겨요(생략 가능). 이어서 휴식 모드가 열려 스트레칭 동작을 안내해요. 집중 전에도 “휴식하기”로 먼저 쉴 수 있어요.',
  },
  {
    n: '5',
    title: '기록 보기',
    desc: '주간 리포트·날짜별 기록·활동 분석·통계에서 내가 무엇에 얼마나 집중했는지 한눈에 볼 수 있어요.',
  },
]

const TIPS = [
  [IconKeyboard, '단축키', 'Space 시작/정지 · R 리셋 · S 건너뛰기'],
  [IconVolume, '배경 소리', '모닥불·빗소리·숲 소리를 켜면 화면 분위기도 같이 바뀌어요. (저장되지 않는 일시 효과)'],
  [IconPalette, '스킨 보관함', '원하는 스킨을 고르면 집중 화면과 준비 화면 전체 분위기가 바뀌어요. (저장됨)'],
]

export function HowToGuide({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Focus Scene 사용법">
      <div className="howto">
        <ol className="howto__steps">
          {STEPS.map((s) => (
            <li key={s.n} className="howto__step">
              <span className="howto__num">{s.n}</span>
              <div>
                <div className="howto__title">{s.title}</div>
                <div className="howto__desc">{s.desc}</div>
              </div>
            </li>
          ))}
        </ol>
        <div className="howto__tips">
          {TIPS.map(([Icon, k, v]) => (
            <div key={k} className="howto__tip">
              <span className="howto__tip-key"><Icon size={15} /> {k}</span>
              <span className="howto__tip-val">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
