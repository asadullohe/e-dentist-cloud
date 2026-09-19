import {
  age,
  formatDate,
  formatUzPhone,
  PATIENT_UI,
  QUEUE_CABINET_UI,
  TABLE_UI,
  UI_TEXT,
} from '@e-dentist/shared'
import type { ColumnDef } from '@tanstack/react-table'
import { BellPlusIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import type { Patient } from '@/entities/patient'
import {
  Button,
  type ColumnMeta,
  DataTableColumnHeader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  type FacetOption,
} from '@/shared/ui'

interface Actions {
  onEdit: (patient: Patient) => void
  onRemove: (patient: Patient) => void
  /// Bugungi navbatga qoʻshish — `queue.manage` boʻlsa (10.3)
  onEnqueue?: ((patient: Patient) => void) | undefined
  /// `patients.write` boʻlmasa amallar ustuni chiqmaydi (kuzatuvchi)
  canEdit: boolean
  /// thead filtri uchun shifokorlar roʻyxati
  doctorOptions: readonly FacetOption[]
}

/// Funksiya, konstanta emas: ustun nomlari joriy tilda oʻqilishi uchun
export function patientColumns({
  onEdit,
  onRemove,
  onEnqueue,
  canEdit,
  doctorOptions,
}: Actions): ColumnDef<Patient>[] {
  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: 'fio',
      // Filtr yoʻq: sahifa tepasidagi qidiruv (ism yoki telefon) uni qamrab oladi
      meta: { title: PATIENT_UI.col_fio, className: 'whitespace-normal' } satisfies ColumnMeta,
      header: ({ column }) => <DataTableColumnHeader column={column} title={PATIENT_UI.col_fio} />,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.fio}
          {row.original.phone && (
            <span className="text-muted-foreground block text-xs sm:hidden">
              {formatUzPhone(row.original.phone)}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      meta: {
        title: PATIENT_UI.col_phone,
        className: 'hidden sm:table-cell',
        filter: { type: 'text' },
      } satisfies ColumnMeta,
      header: PATIENT_UI.col_phone,
      enableSorting: false,
      cell: ({ row }) => (row.original.phone ? formatUzPhone(row.original.phone) : '—'),
    },
    {
      accessorKey: 'birthDate',
      meta: {
        title: PATIENT_UI.col_age,
        className: 'hidden w-44 md:table-cell',
        // Yosh oraligʻi — Patients.tsx uni serverga ageFrom/ageTo qilib uzatadi
        filter: { type: 'range' },
      } satisfies ColumnMeta,
      header: ({ column }) => <DataTableColumnHeader column={column} title={PATIENT_UI.col_age} />,
      cell: ({ row }) => {
        const birth = row.original.birthDate
        if (!birth) return '—'
        const iso = birth.slice(0, 10)
        const years = age(iso)
        if (years === null) return '—'
        return (
          <>
            {PATIENT_UI.years(years)}
            <span className="text-muted-foreground ml-2 text-xs">{formatDate(iso)}</span>
          </>
        )
      },
    },
    {
      // Biriktirilgan shifokor. Filtr serverda (`doctorId`)
      accessorKey: 'doctorId',
      meta: {
        title: PATIENT_UI.col_doctor,
        className: 'hidden w-44 md:table-cell',
        filter: doctorOptions.length ? { type: 'select', options: doctorOptions } : undefined,
      } satisfies ColumnMeta,
      header: PATIENT_UI.col_doctor,
      enableSorting: false,
      cell: ({ row }) =>
        row.original.doctorName ? (
          <span>{row.original.doctorName}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'address',
      meta: {
        title: PATIENT_UI.col_address,
        className: 'hidden lg:table-cell',
        filter: { type: 'text' },
      } satisfies ColumnMeta,
      header: PATIENT_UI.col_address,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.address ?? '—'}</span>
      ),
    },
    {
      id: 'actions',
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 data-[state=open]:bg-muted"
                aria-label={TABLE_UI.actions}
              >
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {onEnqueue && (
                <DropdownMenuItem onClick={() => onEnqueue(row.original)}>
                  <BellPlusIcon />
                  {QUEUE_CABINET_UI.enqueue}
                </DropdownMenuItem>
              )}
              {canEdit && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(row.original)}>
                    <PencilIcon />
                    {UI_TEXT.edit}
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => onRemove(row.original)}>
                    <Trash2Icon />
                    {UI_TEXT.remove}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]
  // Amallar ustuni: tahrir/oʻchirish yoki navbatga qoʻshish — bittasi boʻlsa ham
  const hasActions = canEdit || onEnqueue !== undefined
  return hasActions ? columns : columns.filter((column) => column.id !== 'actions')
}
