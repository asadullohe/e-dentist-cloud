import { formatSom, PLAN_ITEM_STATUS_LABELS, PLAN_UI, TABLE_UI, UI_TEXT } from '@e-dentist/shared'
import { cn } from 'cn'
import {
  CheckIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SkipForwardIcon,
  Trash2Icon,
  UndoIcon,
} from 'lucide-react'
import type { PlanItem } from '@/entities/plan'
import {
  Badge,
  Button,
  DragHandle,
  type DragHandleProps,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui'

interface PlanItemRowProps {
  item: PlanItem
  editable: boolean
  handle: DragHandleProps
  onComplete(): void
  onEdit(): void
  onSkip(skip: boolean): void
  onRemove(): void
}

/// Rejaning bitta bandi. Asosiy amal — «Bajarildi»: u tashrif formasini
/// ochadi, chunki ish qilingani tashrif bilan isbotlanadi (13.4). Qolgan
/// amallar «⋯» ostida
export function PlanItemRow({
  item,
  editable,
  handle,
  onComplete,
  onEdit,
  onSkip,
  onRemove,
}: PlanItemRowProps) {
  const done = item.status === 'done'
  const skipped = item.status === 'skipped'

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-lg border px-1 py-1.5',
        done && 'bg-ok/10',
        skipped && 'opacity-60',
      )}
    >
      {editable && <DragHandle handle={handle} label={PLAN_UI.drag_item} />}
      <div className={cn('min-w-0 flex-1', !editable && 'pl-2')}>
        {/* Tish rozetkasi matn oqimida: telefonning tor ustunida u alohida
            qatorga tushib ketmasin */}
        <div className="text-sm">
          {item.tooth !== null && (
            <span className="bg-muted mr-1.5 rounded px-1.5 py-0.5 text-xs tabular-nums">
              {item.tooth}
            </span>
          )}
          {item.treatment}
          {item.status !== 'pending' && (
            <Badge variant="outline" className="ml-1.5 text-xs">
              {PLAN_ITEM_STATUS_LABELS[item.status]}
            </Badge>
          )}
        </div>
        {item.qty > 1 && (
          <div className="text-muted-foreground text-xs tabular-nums">
            {formatSom(item.price)} × {item.qty}
          </div>
        )}
        {item.note && <div className="text-muted-foreground text-xs">{item.note}</div>}
      </div>

      <span className="text-sm font-medium tabular-nums">{formatSom(item.total)}</span>

      {editable && item.status === 'pending' && (
        <Button
          variant="ghost"
          size="icon"
          className="text-ok size-8 shrink-0"
          aria-label={PLAN_UI.mark_done}
          title={PLAN_UI.mark_done}
          onClick={onComplete}
        >
          <CheckIcon />
        </Button>
      )}

      {/* Bajarilgan band tahrirlanmaydi: u tashrifga bogʻlangan va ish haqi
          hisobiga kirib boʻlgan — avval tashrifi oʻchiriladi */}
      {editable && !done && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="data-[state=open]:bg-muted size-8 shrink-0"
              aria-label={TABLE_UI.actions}
            >
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {!skipped && (
              <DropdownMenuItem onSelect={onEdit}>
                <PencilIcon />
                {UI_TEXT.edit}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => onSkip(!skipped)}>
              {skipped ? <UndoIcon /> : <SkipForwardIcon />}
              {skipped ? PLAN_UI.mark_unskip : PLAN_UI.mark_skip}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onRemove}>
              <Trash2Icon />
              {UI_TEXT.remove}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
