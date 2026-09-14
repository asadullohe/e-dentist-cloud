import { TABLE_UI } from '@e-dentist/shared'
import type { Column } from '@tanstack/react-table'
import { cn } from 'cn'
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon, EyeOffIcon } from 'lucide-react'
import { Button } from '../button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu'

interface Props<TData, TValue> {
  column: Column<TData, TValue>
  title: string
  className?: string
}

/// Ustun sarlavhasi: saralanadigan boʻlsa — ochiladigan menyu bilan
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: Props<TData, TValue>) {
  if (!column.getCanSort()) return <div className={cn(className)}>{title}</div>

  const sorted = column.getIsSorted()

  return (
    <div className={cn('flex items-center', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2.5 h-8 gap-1.5 px-2.5 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {sorted === 'desc' ? (
              <ArrowDownIcon />
            ) : sorted === 'asc' ? (
              <ArrowUpIcon />
            ) : (
              <ChevronsUpDownIcon />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUpIcon className="text-muted-foreground/70" />
            {TABLE_UI.sort_asc}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDownIcon className="text-muted-foreground/70" />
            {TABLE_UI.sort_desc}
          </DropdownMenuItem>
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                <EyeOffIcon className="text-muted-foreground/70" />
                {TABLE_UI.hide_column}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
