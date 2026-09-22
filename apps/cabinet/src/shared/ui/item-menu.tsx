import { TABLE_UI, UI_TEXT } from '@e-dentist/shared'
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'

/// «⋯» — tahrirlash va oʻchirish. Tur plitkasi, xizmat kartasi va
/// reja bandi uchun bitta menyu
export function ItemMenu({ onEdit, onRemove }: { onEdit: () => void; onRemove: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 data-[state=open]:bg-muted"
          aria-label={TABLE_UI.actions}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={onEdit}>
          <PencilIcon />
          {UI_TEXT.edit}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onRemove}>
          <Trash2Icon />
          {UI_TEXT.remove}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
