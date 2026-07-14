import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Stack, TextField, InputAdornment, ToggleButtonGroup, ToggleButton,
  Chip, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Divider,
} from '@mui/material'
import { Search, CheckCircle, Cancel, Warning, Visibility } from '@mui/icons-material'
import dayjs from 'dayjs'
import { DataTable, type Column, type SortOrder } from '@/components/common/DataTable'
import { DatePickerField } from '@/components/common/DatePickerField'
import { enrollmentSubmissionsApi } from '@/api/enrollment-submissions.api'
import { DAYS } from '@/utils/availability'
import type { EnrollmentSubmission } from '@/types'

function formatCpf(cpf: string) {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11) return cpf
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function dayLabel(value: string) {
  return DAYS.find((d) => d.value === value)?.label ?? value
}

type StatusFilter = 'all' | 'renewed' | 'not_renewed'

export function ReEnrollmentSubmissionsTab() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<SortOrder | undefined>(undefined)
  const [detail, setDetail] = useState<EnrollmentSubmission | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => { setPage(1) }, [search, statusFilter, dateFrom, dateTo, sortBy, sortOrder])

  const renewedParam = statusFilter === 'all' ? undefined : statusFilter === 'renewed'

  const { data, isLoading } = useQuery({
    queryKey: ['re-enrollment-submissions', search, statusFilter, dateFrom, dateTo, page, sortBy, sortOrder],
    queryFn: () => enrollmentSubmissionsApi.listReEnrollment({
      search: search || undefined,
      renewed: renewedParam,
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
      key: 'renewed', label: 'Matriculou', align: 'center',
      render: (r) => r.renewed
        ? <CheckCircle color="success" fontSize="small" />
        : <Cancel color="error" fontSize="small" />,
    },
    {
      key: 'created_at', label: 'Data e hora',
      render: (r) => dayjs(r.created_at).format('DD/MM/YYYY HH:mm'),
    },
    {
      key: 'conflict', label: 'Conflitos', align: 'center',
      render: (r) => {
        if (!r.renewed) return <Typography variant="body2" color="text.secondary">—</Typography>
        return (
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
            {r.has_conflict
              ? <Chip icon={<Warning />} label="Conflito" size="small" color="warning" variant="outlined" />
              : <Chip label="OK" size="small" color="success" variant="outlined" />}
            <Tooltip title="Ver turmas e disponibilidade">
              <IconButton size="small" onClick={() => setDetail(r)}>
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        )
      },
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
        <ToggleButtonGroup
          size="small"
          exclusive
          value={statusFilter}
          onChange={(_, v) => { if (v !== null) setStatusFilter(v as StatusFilter) }}
        >
          <ToggleButton value="all">Todos</ToggleButton>
          <ToggleButton value="renewed">Rematricularam</ToggleButton>
          <ToggleButton value="not_renewed">Não rematricularam</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <DataTable
        columns={columns}
        rows={rows}
        loading={isLoading}
        emptyMessage="Nenhuma resposta de rematrícula encontrada."
        page={data?.page}
        pageCount={data?.pages}
        onPageChange={setPage}
        sortableColumns={['full_name', 'renewed', 'created_at', 'has_conflict']}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(by, order) => { setSortBy(by); setSortOrder(order) }}
      />

      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Turmas e disponibilidade — {detail?.full_name}</DialogTitle>
        <DialogContent>
          {detail && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              {detail.has_conflict && (
                <Chip icon={<Warning />} label="Há conflito entre as turmas atuais e a nova disponibilidade" color="warning" variant="outlined" sx={{ alignSelf: 'flex-start' }} />
              )}

              <Typography variant="subtitle2" fontWeight={700} color="primary">Turmas atuais do aluno</Typography>
              {detail.classes_snapshot?.length ? (
                <Stack spacing={1}>
                  {detail.classes_snapshot.map((c, i) => (
                    <Box key={c.id ?? i} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                      <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                      {c.schedule.length ? c.schedule.map((s, j) => (
                        <Typography key={j} variant="caption" color="text.secondary" display="block">
                          {dayLabel(s.day)} — {s.start_time} às {s.end_time}
                        </Typography>
                      )) : (
                        <Typography variant="caption" color="text.secondary">Sem horário cadastrado.</Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">O aluno não estava em nenhuma turma.</Typography>
              )}

              <Divider />

              <Typography variant="subtitle2" fontWeight={700} color="primary">Nova disponibilidade registrada</Typography>
              {detail.availability_snapshot?.length ? (
                <Stack spacing={1}>
                  {detail.availability_snapshot.map((a, i) => (
                    <Box key={i}>
                      <Typography variant="body2" fontWeight={600}>{dayLabel(a.day)}</Typography>
                      {a.slots.map((slot, j) => (
                        <Typography key={j} variant="caption" color="text.secondary" display="block">
                          {slot.start} às {slot.end}
                        </Typography>
                      ))}
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">Nenhuma disponibilidade informada.</Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetail(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
