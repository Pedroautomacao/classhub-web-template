import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Stack, TextField, MenuItem, InputAdornment, IconButton, Tooltip, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
} from '@mui/material'
import { Search, Edit, WhatsApp } from '@mui/icons-material'
import dayjs from 'dayjs'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column, type SortOrder } from '@/components/common/DataTable'
import { paymentsApi } from '@/api/payments.api'
import { plansApi } from '@/api/plans.api'
import { useSnackbarStore } from '@/store/snackbar.store'
import { usePermission } from '@/hooks/usePermission'
import { Permission } from '@/utils/permissions'
import { getApiError } from '@/utils/errors'
import { formatPhoneDisplay, whatsappUrl } from '@/utils/phone'
import type { PaymentRow, PaymentMethod, ContractDisplayStatus } from '@/types'

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'pix', label: 'PIX' },
  { value: 'credit_card', label: 'Cartão de crédito' },
  { value: 'bank_slip', label: 'Boleto' },
  { value: 'cash', label: 'Dinheiro' },
]

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: 'PIX',
  credit_card: 'Cartão',
  bank_slip: 'Boleto',
  cash: 'Dinheiro',
}

const CONTRACT_STATUS_LABEL: Record<ContractDisplayStatus, string> = {
  active: 'Ativo',
  expiring_soon: 'Vencendo',
  expired: 'Vencido',
  cancelled: 'Cancelado',
  no_contract: 'Sem contrato',
}

const CONTRACT_STATUS_COLOR: Record<ContractDisplayStatus, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  expiring_soon: 'warning',
  expired: 'error',
  cancelled: 'default',
  no_contract: 'default',
}


function formatBRL(v: string | number | null | undefined): string {
  if (v == null) return '—'
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (Number.isNaN(n)) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function PaymentsListPage() {
  const qc = useQueryClient()
  const { show } = useSnackbarStore()
  const { hasPermission } = usePermission()
  const canWrite = hasPermission(Permission.PAYMENTS_WRITE)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<SortOrder | undefined>(undefined)

  const [editTarget, setEditTarget] = useState<PaymentRow | null>(null)
  const [editPlan, setEditPlan] = useState<string>('')
  const [editMethod, setEditMethod] = useState<string>('')
  const [editDay, setEditDay] = useState<string>('')

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data: plans = [] } = useQuery({
    queryKey: ['plans', 'all-for-payments'],
    queryFn: () => plansApi.list(),
    staleTime: 60_000,
  })

  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ['payments', search, planFilter, methodFilter, dayFilter, sortBy, sortOrder],
    queryFn: () => paymentsApi.list({
      search: search || undefined,
      plan_id: planFilter || undefined,
      payment_method: (methodFilter || undefined) as PaymentMethod | undefined,
      payment_day: dayFilter ? Number(dayFilter) : undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ studentId, payload }: { studentId: string; payload: { plan_id?: string | null; payment_method?: PaymentMethod | null; payment_day?: number | null } }) =>
      paymentsApi.update(studentId, payload),
    onSuccess: () => {
      refetch()
      qc.invalidateQueries({ queryKey: ['students'] })
      setEditTarget(null)
      show('Pagamento atualizado!')
    },
    onError: (err) => show(getApiError(err, 'Erro ao atualizar pagamento.'), 'error'),
  })

  const openEdit = (row: PaymentRow) => {
    setEditTarget(row)
    setEditPlan(row.plan_id ?? '')
    setEditMethod(row.payment_method ?? '')
    setEditDay(row.payment_day != null ? String(row.payment_day) : '')
  }

  const submitEdit = () => {
    if (!editTarget) return
    const dayNum = editDay ? Number(editDay) : null
    if (dayNum != null && (dayNum < 1 || dayNum > 31)) {
      show('Dia de vencimento deve estar entre 1 e 31.', 'error')
      return
    }
    updateMutation.mutate({
      studentId: editTarget.id,
      payload: {
        plan_id: editPlan || null,
        payment_method: (editMethod || null) as PaymentMethod | null,
        payment_day: dayNum,
      },
    })
  }

  const handleWhatsApp = (phone: string | null) => {
    const url = whatsappUrl(phone)
    if (url) window.open(url, '_blank')
  }

  const columns: Column<PaymentRow>[] = [
    { key: 'full_name', label: 'Aluno' },
    { key: 'plan', label: 'Plano', render: (r) => r.plan?.name ?? '—' },
    {
      key: 'payment_method', label: 'Pagamento',
      render: (r) => r.payment_method ? PAYMENT_METHOD_LABEL[r.payment_method] : '—',
    },
    { key: 'payment_day', label: 'Vencimento', align: 'center', render: (r) => r.payment_day ?? '—' },
    { key: 'monthly_value', label: 'Valor', align: 'right', render: (r) => formatBRL(r.monthly_value) },
    {
      key: 'contract_status', label: 'Contrato', align: 'center',
      render: (r) => (
        <Chip
          label={CONTRACT_STATUS_LABEL[r.contract_status]}
          color={CONTRACT_STATUS_COLOR[r.contract_status]}
          size="small" variant="outlined"
        />
      ),
    },
    {
      key: 'next_due_date', label: 'Próx. vencimento',
      render: (r) => r.next_due_date ? dayjs(r.next_due_date).format('DD/MM/YYYY') : '—',
    },
    {
      key: 'phone', label: 'Telefone',
      render: (r) => r.phone ? (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Tooltip title="Abrir WhatsApp">
            <IconButton size="small" color="success" onClick={() => handleWhatsApp(r.phone)}>
              <WhatsApp fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="body2">{formatPhoneDisplay(r.phone)}</Typography>
        </Stack>
      ) : '—',
    },
    {
      key: 'actions', label: '', align: 'right', width: 60,
      render: (r) => canWrite ? (
        <Tooltip title="Editar pagamento">
          <IconButton size="small" onClick={() => openEdit(r)}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null,
    },
  ]

  return (
    <Box>
      <PageHeader
        title="Pagamentos"
        subtitle="Gestão financeira dos alunos ativos"
        helpContent={{
          what: 'A tela de Pagamentos consolida os dados financeiros de cada aluno ativo: plano vigente, forma de pagamento, dia de vencimento, valor mensal, status do contrato e próximo vencimento calculado.',
          actions: [
            'Visualizar o plano, forma de pagamento, dia de vencimento e valor mensal de cada aluno',
            'Conferir o status do contrato (ativo, vencendo em 30 dias, vencido, cancelado ou sem contrato)',
            'Ver a próxima data de vencimento calculada com base no dia de vencimento e mês corrente',
            'Filtrar por nome, plano, forma de pagamento e dia de vencimento',
            'Ordenar a tabela por qualquer coluna clicando no cabeçalho',
            'Editar inline o plano, a forma de pagamento e o dia de vencimento de qualquer aluno',
            'Iniciar conversa no WhatsApp diretamente da linha do aluno (cobrança, lembrete, etc.)',
          ],
          tips: [
            'O status "Vencendo" aparece quando o contrato tem fim em até 30 dias.',
            'A próxima data de vencimento respeita o último dia do mês (ex: dia 31 em fevereiro vira o último dia válido).',
            'Editar o plano aqui altera o aluno — a página complementa Contratos (que cuida do ciclo contratual em si).',
            'Permissões PAYMENTS_READ (ver) e PAYMENTS_WRITE (editar) controlam o acesso à tela.',
          ],
          flow: 'Aluno matriculado → plano e forma de pagamento definidos → acompanhamento mensal e cobranças aqui.',
        }}
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Buscar por nome..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ minWidth: 260 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select size="small" label="Plano"
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {plans.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
        </TextField>
        <TextField
          select size="small" label="Forma de pagamento"
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">Todas</MenuItem>
          {PAYMENT_METHODS.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
        </TextField>
        <TextField
          select size="small" label="Dia de vencimento"
          value={dayFilter}
          onChange={(e) => setDayFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <MenuItem key={d} value={String(d)}>{d}</MenuItem>
          ))}
        </TextField>
      </Stack>

      <DataTable
        columns={columns}
        rows={rows}
        loading={isLoading}
        emptyMessage="Nenhum aluno encontrado."
        sortableColumns={['full_name', 'phone', 'payment_day', 'payment_method', 'created_at']}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(by, order) => { setSortBy(by); setSortOrder(order) }}
      />

      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Editar Pagamento</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Aluno: <strong>{editTarget?.full_name}</strong>
            </Typography>
            <TextField
              select label="Plano" fullWidth
              value={editPlan}
              onChange={(e) => setEditPlan(e.target.value)}
            >
              <MenuItem value="">— Nenhum —</MenuItem>
              {plans.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </TextField>
            <TextField
              select label="Forma de pagamento" fullWidth
              value={editMethod}
              onChange={(e) => setEditMethod(e.target.value)}
            >
              <MenuItem value="">— Nenhuma —</MenuItem>
              {PAYMENT_METHODS.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
            </TextField>
            <TextField
              select label="Dia de vencimento" fullWidth
              value={editDay}
              onChange={(e) => setEditDay(e.target.value)}
            >
              <MenuItem value="">— Nenhum —</MenuItem>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <MenuItem key={d} value={String(d)}>{d}</MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditTarget(null)}>Cancelar</Button>
          <Button variant="contained" disabled={updateMutation.isPending} onClick={submitEdit}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
