import { TABLE_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import { CheckIcon, PlusCircleIcon } from 'lucide-react'
import { Badge } from '../badge'
import { Button } from '../button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../command'
import { Popover, PopoverContent, PopoverTrigger } from '../popover'
import { Separator } from '../separator'

export interface FacetOption {
  value: string
  label: string
}

interface Props {
  title: string
  options: readonly FacetOption[]
  selected: readonly string[]
  onChange: (values: string[]) => void
  /// Har variantda nechta qator borligi — boʻlsa yonida koʻrsatiladi
  counts?: ReadonlyMap<string, number>
}

/// Toolbar filtri: tugma, ochilganda belgilanadigan roʻyxat. Tanlanganlar
/// tugmaning oʻzida nishon boʻlib koʻrinadi — jadval sarlavhasi toza qoladi
export function DataTableFacetedFilter({ title, options, selected, onChange, counts }: Props) {
  const chosen = new Set(selected)

  function toggle(value: string) {
    const next = new Set(chosen)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    onChange([...next])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircleIcon />
          {title}
          {chosen.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-1 h-4" />
              <div className="flex gap-1">
                {chosen.size > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {TABLE_UI.selected(chosen.size)}
                  </Badge>
                ) : (
                  options
                    .filter((option) => chosen.has(option.value))
                    .map((option) => (
                      <Badge
                        key={option.value}
                        variant="secondary"
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0" align="start">
        <Command>
          <CommandInput placeholder={TABLE_UI.filter_search} />
          <CommandList>
            <CommandEmpty>{TABLE_UI.no_results}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const active = chosen.has(option.value)
                return (
                  <CommandItem key={option.value} onSelect={() => toggle(option.value)}>
                    <div
                      className={cn(
                        'flex size-4 items-center justify-center rounded-[4px] border border-primary',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible',
                      )}
                    >
                      <CheckIcon className="size-3.5" />
                    </div>
                    <span>{option.label}</span>
                    {counts?.has(option.value) && (
                      <span className="ml-auto font-mono text-xs text-muted-foreground">
                        {counts.get(option.value)}
                      </span>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {chosen.size > 0 && (
              <>
                <Separator />
                <CommandGroup>
                  <CommandItem onSelect={() => onChange([])} className="justify-center text-center">
                    {TABLE_UI.filter_clear}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
