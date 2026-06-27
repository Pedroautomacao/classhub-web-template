import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Tooltip, Typography,
} from '@mui/material'
import { Visibility, Delete } from '@mui/icons-material'
import dayjs from 'dayjs'
import { DataTable, type Column, type SortOrder } from '@/components/common/DataTable'
import { DatePickerField } from '@/components/common/DatePickerField'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { npsApi, npsTemplatesApi } from '@/api/nps.api'
import { useSnackbarStore } from '@/store/snackbar.store'
import { usePermission } from '@/hooks/usePermission'
import { Permission } from '@/utils/permissions'
import { getApiError } from '@/utils/errors'
import { BUCKET_COLORS, firstNpsQuestion, formatAnswerValue, npsBucket } from '@/utils/nps'
import type { NpsResponse } from '@/types'

function firstNpsScore(r: NpsResponse): number | null {
  const q = firstNpsQuestion(r.form_snapshot)
  if (!q) return null
  const v = r.answers?.[q.id]
  return typeof v === 'number' ? v : null
}

export function NpsResponsesTab() {
  const qc = useQueryClient()
  const { show } = useSnackbarStore()
  const { hasPermission } = usePermission()
  const canDelete = hasPermission(Permission.NPS_DELETE)

  const [templateFilter, setTemplateFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<SortOrder | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [viewResponse, setViewResponse] = useState<NpsResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<NpsResponse | null>(null)

  const { data: templates = [] } = useQuery({ queryKey: ['nps-templates'], queryFn: npsTemplatesApi.list })
  const templateName = (id: string | null) => templates.find((t) => t.id === id)?.name ?? '—'

  useEffect(() => { setPage(1) }, [templateFilter, dateFrom, dateTo, sortBy, sortOrder])

  const { data, isLoading } = useQuery({
    queryKey: ['nps-responses', templateFilter, dateFrom, dateTo, sortBy, sortOrder, page],
    queryFn: () => npsApi.list({
      template_id: templateFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
      page,
      page_size: 20,
    }),
  })
  const responses = data?.items ?? []

  const deleteMutation = useMutation({
    mutationFn: (id: string) => npsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nps-responses'] })
      setDeleteTarget(null)
      show('Resposta excluída.')
    },
    onError: (e) => show(getApiError(e, 'Erro ao excluir resposta.'), 'error'),
  })

  const columns: Column<NpsResponse>[] = [
    { key: 'created_at', label: 'Data', render: (r) => dayjs(r.created_at).format('DD/MM/YYYY HH:mm') },
    { key: 'campaign', label: 'Campanha', render: (r) => templateName(r.template_id) },
    {
      key: 'nps', label: 'NPS', align: 'center',
      render: (r) => {
        const score = firstNpsScore(r)
        if (score === null) return <Typography variant="body2" color="text.secondary">—</Typography>
        return <Chip label={score} size="small" sx={{ bgcolor: BUCKET_COLORS[npsBucket(score)], color: '#fff', fontWeight: 700 }} />
      },
    },
    {
      key: 'answered', label: 'Respostas', align: 'center',
      render: (r) => Object.keys(r.answers ?? {}).length,
    },
    {
      key: 'actions', label: '', align: 'right', width: 90,
      render: (r) => (
        <Stack direction="row" justifyContent="flex-end">
          <Tooltip title="Ver detalhes">
            <IconButton size="small" onClick={() => setViewResponse(r)}><Visibility fontSize="small" /></IconButton>
          </Tooltip>
          {canDelete && (
            <Tooltip title="Excluir">
              <IconButton size="small" color="error" onClick={() => setDeleteTarget(r)}><Delete fontSize="small" /></IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ]

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} flexWrap="wrap" alignItems={{ sm: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Campanha</InputLabel>
          <Select label="Campanha" value={templateFilter} onChange={(e) => setTemplateFilter(e.target.value)}>
            <MenuItem value="">Todas</MenuItem>
            {templates.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
          </Select>
        </FormControl>
        <DatePickerField label="De" size="small" value={dateFrom || null} maxDate={dateTo || undefined} onChange={(v) => setDateFrom(v ?? '')} sx={{ minWidth: 150 }} />
        <DatePickerField label="Até" size="small" value={dateTo || null} minDate={dateFrom || undefined} onChange={(v) => setDateTo(v ?? '')} sx={{ minWidth: 150 }} />
      </Stack>

      <DataTable
        columns={columns}
        rows={responses}
        loading={isLoading}
        emptyMessage="Nenhuma resposta encontrada."
        page={data?.page}
        pageCount={data?.pages}
        onPageChange={setPage}
        sortableColumns={['created_at']}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(by, order) => { setSortBy(by); setSortOrder(order) }}
      />

      {/* Detalhes da resposta */}
      <Dialog open={!!viewResponse} onClose={() => setViewResponse(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Resposta anônima</DialogTitle>
        <DialogContent>
          {viewResponse && (
            <Stack spacing={1.5} sx={{ pt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {dayjs(viewResponse.created_at).format('DD/MM/YYYY HH:mm')} · {templateName(viewResponse.template_id)}
              </Typography>
              {(viewResponse.form_snapshot ?? []).map((q) => {
                const val = viewResponse.answers?.[q.id]
                if (val === undefined || val === null || val === '') return null
                return (
                  <Box key={q.id}>
                    <Typography variant="caption" color="text.secondary">{q.text}</Typography>
                    {q.type === 'nps' && typeof val === 'number' ? (
                      <Box><Chip label={val} size="small" sx={{ bgcolor: BUCKET_COLORS[npsBucket(val)], color: '#fff', fontWeight: 700 }} /></Box>
                    ) : (
                      <Typography variant="body2">{formatAnswerValue(val)}</Typography>
                    )}
                  </Box>
                )
              })}
            </Stack>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setViewResponse(null)}>Fechar</Button></DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir resposta"
        message="Tem certeza que deseja excluir esta resposta?"
        confirmColor="error"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  )
}
