import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Box, IconButton, Switch, Tooltip, Stack } from '@mui/material'
import { Edit, Delete } from '@mui/icons-material'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column, type SortOrder } from '@/components/common/DataTable'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PlanFormModal } from './components/PlanFormModal'
import { plansApi } from '@/api/plans.api'
import { useSnackbarStore } from '@/store/snackbar.store'
import { getApiError } from '@/utils/errors'
import { usePermission } from '@/hooks/usePermission'
import { Permission } from '@/utils/permissions'
import { exportToXlsx } from '@/utils/export'
import type { Plan } from '@/types'

export function PlansListPage() {
  const { show } = useSnackbarStore()
  const { hasPermission } = usePermission()
  const canWrite = hasPermission(Permission.PLANS_WRITE)
  const canDelete = hasPermission(Permission.PLANS_DELETE)

  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<Plan | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null)
  const [toggleTarget, setToggleTarget] = useState<Plan | null>(null)
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<SortOrder | undefined>(undefined)
  const [isExporting, setIsExporting] = useState(false)

  const { data: plans = [], isLoading, refetch } = useQuery({
    queryKey: ['plans', sortBy, sortOrder],
    queryFn: () => plansApi.list({ sort_by: sortBy, sort_order: sortOrder }),
  })

  const createMutation = useMutation({
    mutationFn: plansApi.create,
    onSuccess: () => {
      refetch()
      setFormOpen(false)
      show('Plano criado com sucesso!')
    },
    onError: (error) => show(getApiError(error, 'Erro ao criar plano.'), 'error'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Plan> }) =>
      plansApi.update(id, data),
    onSuccess: () => {
      refetch()
      setFormOpen(false)
      setSelected(null)
      show('Plano atualizado!')
    },
    onError: (error) => show(getApiError(error, 'Erro ao atualizar plano.'), 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => plansApi.remove(id),
    onSuccess: () => {
      refetch()
      setDeleteTarget(null)
      show('Plano excluído.')
    },
    onError: (error) => show(getApiError(error, 'Erro ao excluir plano.'), 'error'),
  })

  const handleSubmit = (values: { name: string; description?: string; duration_months: number; price: number; benefits: string[] }) => {
    const payload = {
      name: values.name,
      description: values.description ?? null,
      duration_months: values.duration_months,
      price: String(values.price),
      benefits: values.benefits.length > 0 ? values.benefits : null,
    }
    if (selected) {
      updateMutation.mutate({ id: selected.id, data: payload })
    } else {
      createMutation.mutate(payload as Parameters<typeof plansApi.create>[0])
    }
  }

  const handleToggleActive = (plan: Plan) => {
    updateMutation.mutate({ id: plan.id, data: { is_active: !plan.is_active } })
    setToggleTarget(null)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const rows = await plansApi.list()
      exportToXlsx(rows, [
        { label: 'Nome', value: (p) => p.name },
        { label: 'Descrição', value: (p) => p.description ?? '' },
        { label: 'Preço', value: (p) => p.price ?? '' },
      ], 'planos')
    } finally {
      setIsExporting(false)
    }
  }

  const columns: Column<Plan>[] = [
    { key: 'name', label: 'Nome' },
    { key: 'description', label: 'Descrição', render: (p) => p.description ?? '—' },
    {
      key: 'duration_months',
      label: 'Duração',
      render: (p) => `${p.duration_months} ${p.duration_months === 1 ? 'mês' : 'meses'}`,
    },
    {
      key: 'price',
      label: 'Preço',
      render: (p) =>
        parseFloat(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    },
    {
      key: 'is_active',
      label: 'Ativo',
      align: 'center',
      render: (p) => (
        <Tooltip title={p.is_active ? 'Desativar' : 'Ativar'}>
          <Switch
            size="small"
            checked={p.is_active}
            disabled={!canWrite}
            onChange={() => setToggleTarget(p)}
          />
        </Tooltip>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      width: 90,
      render: (p) => (
        <Stack direction="row" justifyContent="flex-end">
          {canWrite && (
            <Tooltip title="Editar">
              <IconButton
                size="small"
                onClick={() => {
                  setSelected(p)
                  setFormOpen(true)
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Excluir">
              <IconButton size="small" color="error" onClick={() => setDeleteTarget(p)}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ]

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <Box>
      <PageHeader
        title="Planos"
        subtitle="Gerencie os planos de assinatura disponíveis"
        actionLabel="Novo Plano"
        actionDisabled={!canWrite}
        helpContent={{
          what: 'A tela de Planos define os pacotes de curso oferecidos pela escola. Cada plano tem um nome, duração em meses e preço — e é selecionado no momento da matrícula.',
          actions: [
            'Criar novos planos com nome, duração e valor',
            'Editar planos existentes',
            'Ativar ou desativar planos (planos inativos não aparecem no formulário de matrícula)',
          ],
          tips: [
            'Crie planos distintos para diferenciar frequências, durações ou modalidades (ex: Plano Semestral, Plano Anual).',
            'Um plano desativado não pode ser escolhido em novas matrículas, mas contratos já criados são mantidos.',
          ],
          flow: 'Criação do Plano → Uso no Formulário de Matrícula → Associado ao Contrato do Aluno.',
        }}
        onAction={() => {
          setSelected(null)
          setFormOpen(true)
        }}
      />

      <DataTable
        columns={columns}
        rows={plans}
        loading={isLoading}
        emptyMessage="Nenhum plano cadastrado."
        onExport={handleExport}
        isExporting={isExporting}
        sortableColumns={['name', 'duration_months', 'price', 'is_active', 'created_at']}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(by, order) => { setSortBy(by); setSortOrder(order) }}
      />

      <PlanFormModal
        open={formOpen}
        plan={selected}
        loading={isMutating}
        onClose={() => {
          setFormOpen(false)
          setSelected(null)
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir Plano"
        message={`Tem certeza que deseja excluir o plano "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={!!toggleTarget}
        title={toggleTarget?.is_active ? 'Desativar Plano' : 'Ativar Plano'}
        message={
          toggleTarget?.is_active
            ? `Desativar o plano "${toggleTarget?.name}"? Ele não aparecerá mais na landing page.`
            : `Ativar o plano "${toggleTarget?.name}"? Ele voltará a aparecer na landing page.`
        }
        confirmLabel={toggleTarget?.is_active ? 'Desativar' : 'Ativar'}
        confirmColor={toggleTarget?.is_active ? 'warning' : 'primary'}
        loading={updateMutation.isPending}
        onConfirm={() => toggleTarget && handleToggleActive(toggleTarget)}
        onCancel={() => setToggleTarget(null)}
      />
    </Box>
  )
}
