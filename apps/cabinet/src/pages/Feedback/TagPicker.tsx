import { FEEDBACK_TAG_LABELS, FEEDBACK_TAGS, type FeedbackTag } from '@e-dentist/shared'
import { cn } from 'cn'

/// Tez tanlovlar: bir nechtasi tanlanadi. Sarlavha bahoga qarab —
/// «nima yoqdi?» yoki «nima yoqmadi?»
export function TagPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: FeedbackTag[]
  onChange: (next: FeedbackTag[]) => void
}) {
  function toggle(tag: FeedbackTag) {
    onChange(value.includes(tag) ? value.filter((item) => item !== tag) : [...value, tag])
  }
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex flex-wrap gap-2">
        {FEEDBACK_TAGS.map((tag) => {
          const on = value.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(tag)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                on
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent',
              )}
            >
              {FEEDBACK_TAG_LABELS[tag]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
