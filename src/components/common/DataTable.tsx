import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Skeleton,
  Typography,
  Box,
  Button,
  CircularProgress,
} from '@mui/material'
import { FileDownload } from '@mui/icons-material'
import type { ReactNode } from 'react'

export type SortOrder = 'asc' | 'desc'

export interface Column<T> {
  key: string
  label: string
  width?: number | string
  align?: 'left' | 'center' | 'right'
  render?: (row: T) => ReactNode
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  emptyMessage?: string
  skeletonRows?: number
  onExport?: () => void
  isExporting?: boolean
  sortableColumns?: string[]
  sortBy?: string
  sortOrder?: SortOrder
  onSortChange?: (sortBy: string, sortOrder: SortOrder) => void
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading = false,
  emptyMessage = 'Nenhum registro encontrado.',
  skeletonRows = 5,
  onExport,
  isExporting = false,
  sortableColumns,
  sortBy,
  sortOrder,
  onSortChange,
}: DataTableProps<T>) {
  const isSortable = (key: string) => !!sortableColumns?.includes(key) && !!onSortChange

  const handleSort = (key: string) => {
    if (!onSortChange) return
    const nextOrder: SortOrder = sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc'
    onSortChange(key, nextOrder)
  }

  return (
    <Box>
      {onExport && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={isExporting ? <CircularProgress size={14} color="inherit" /> : <FileDownload />}
            onClick={onExport}
            disabled={isExporting}
          >
            Exportar Excel
          </Button>
        </Box>
      )}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            {columns.map((col) => {
              const sortable = isSortable(col.key)
              const active = sortable && sortBy === col.key
              return (
                <TableCell
                  key={col.key}
                  align={col.align ?? 'left'}
                  sortDirection={active ? sortOrder : false}
                  sx={{ fontWeight: 700, width: col.width }}
                >
                  {sortable ? (
                    <TableSortLabel
                      active={active}
                      direction={active ? sortOrder : 'asc'}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              )
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">{emptyMessage}</Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                hover
                sx={{ '&:last-child td': { border: 0 } }}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} align={col.align ?? 'left'}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
    </Box>
  )
}
