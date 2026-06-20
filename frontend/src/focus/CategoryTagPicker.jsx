import { useState } from 'react'
import { Input, Tag } from '../design'
import {
  IconBook,
  IconDumbbell,
  IconBriefcase,
  IconBookOpen,
  IconBrush,
  IconSparkle,
} from '../design/icons'
import './category.css'

// 카테고리 프리셋 (선 아이콘 + 라벨)
export const CATEGORIES = [
  { id: '공부', Icon: IconBook },
  { id: '운동', Icon: IconDumbbell },
  { id: '업무', Icon: IconBriefcase },
  { id: '독서', Icon: IconBookOpen },
  { id: '취미', Icon: IconBrush },
  { id: '기타', Icon: IconSparkle },
]

// 자주 쓰는 태그 제안 (커스텀 입력도 가능)
const SUGGESTED_TAGS = [
  '코테',
  '프로젝트',
  '영어',
  '유산소',
  '근력',
  '독서',
  '복습',
  '회의',
]

export function categoryIcon(id) {
  return CATEGORIES.find((c) => c.id === id)?.Icon || IconSparkle
}

// 카테고리 아이콘을 인라인으로 렌더 (toast 등 문자열에는 사용 불가)
export function CategoryIcon({ id, size = 15 }) {
  const Icon = categoryIcon(id)
  return <Icon size={size} />
}

// 카테고리 선택 + 태그(프리셋/커스텀) 추가 UI
export function CategoryTagPicker({ category, onCategory, tags, onTags }) {
  const [custom, setCustom] = useState('')

  function addTag(t) {
    const v = t.trim()
    if (!v || tags.includes(v)) return
    onTags([...tags, v])
  }
  function removeTag(t) {
    onTags(tags.filter((x) => x !== t))
  }
  function submitCustom() {
    addTag(custom)
    setCustom('')
  }

  const available = SUGGESTED_TAGS.filter((t) => !tags.includes(t))

  return (
    <div className="catpick">
      <div className="catpick__label">카테고리</div>
      <div className="catpick__cats">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`catchip ${category === c.id ? 'is-on' : ''}`}
            onClick={() => onCategory(c.id)}
          >
            <span className="catchip__icon"><c.Icon size={15} /></span>
            {c.id}
          </button>
        ))}
      </div>

      <div className="catpick__label">태그</div>
      {tags.length > 0 && (
        <div className="catpick__tags">
          {tags.map((t) => (
            <Tag key={t} onRemove={() => removeTag(t)}>
              #{t}
            </Tag>
          ))}
        </div>
      )}

      <div className="catpick__custom">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submitCustom()
            }
          }}
          placeholder="태그 직접 입력 후 Enter"
        />
      </div>

      {available.length > 0 && (
        <div className="catpick__suggest">
          {available.map((t) => (
            <button
              key={t}
              type="button"
              className="tagchip"
              onClick={() => addTag(t)}
            >
              + {t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
