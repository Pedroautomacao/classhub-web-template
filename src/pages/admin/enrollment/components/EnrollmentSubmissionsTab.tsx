import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Box, Stack, TextField, InputAdornment } from '@mui/material'
import { Search } from '@mui/icons-material'
import dayjs from 'dayjs'
import { DataTable, type Column, type SortOrder } from '@/components/common/DataTable'
import { DatePickerField } from '@/components/common/DatePickerField'
import { enrollmentSubmissionsApi } from '@/api/enrollment-submissions.api'
import type { EnrollmentSubmission } from '@/types'

function formatCpf(cpf: string) {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11) return cpf
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function EnrollmentSubmissionsTab() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<SortOrder | undefined>(undefined)

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => { setPage(1) }, [search, dateFrom, dateTo, sortBy, sortOrder])

  const { data, isLoading } = useQuery({
    queryKey: ['enrollment-submissions', search, dateFrom, dateTo, page, sortBy, sortOrder],
    queryFn: () => enrollmentSubmissionsApi.listEnrollment({
      search: search || undefined,
      created_after: dateFrom || undefined,
      created_before: dateTo || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
      page,
      page_size: 20,
    }),
  })

  const rows = data?.items ?? []

  const columns: Column<EnrollmentSubmission>[] = [
    { key: 'full_name', label: 'Nome' },
    { key: 'cpf', label: 'CPF', render: (r) => r.cpf ? formatCpf(r.cpf) : '—' },
    {
      key: 'created_at', label: 'Data e hora',
      render: (r) => dayjs(r.created_at).format('DD/MM/YYYY HH:mm'),
    },
  ]

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} flexWrap="wrap" alignItems={{ sm: 'center' }}>
        <TextField
          size="small"
          placeholder="Buscar por nome ou CPF..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
          sx={{ minWidth: 260 }}
        />
        <DatePickerField label="De" size="small" value={dateFrom || null} maxDate={dateTo || undefined} onChange={(v) => setDateFrom(v ?? '')} sx={{ minWidth: 150 }} />
        <DatePickerField label="Até" size="small" value={dateTo || null} minDate={dateFrom || undefined} onChange={(v) => setDateTo(v ?? '')} sx={{ minWidth: 150 }} />
      </Stack>

      <DataTable
        columns={columns}
        rows={rows}
        loading={isLoading}
        emptyMessage="Nenhuma resposta de matrícula encontrada."
        page={data?.page}
        pageCount={data?.pages}
        onPageChange={setPage}
        sortableColumns={['full_name', 'created_at']}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(by, order) => { setSortBy(by); setSortOrder(order) }}
      />
    </Box>
  )
}
