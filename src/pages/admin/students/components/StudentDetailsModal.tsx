import { useQuery } from '@tanstack/react-query'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Box,
  Chip, Divider, Typography, Grid, IconButton, Tooltip, CircularProgress,
} from '@mui/material'
import { WhatsApp } from '@mui/icons-material'
import dayjs from 'dayjs'
import { contractsApi } from '@/api/contracts.api'
import { StudentStatusChip } from './StudentStatusChip'
import { DAYS } from '@/utils/availability'
import { formatPhoneDisplay, whatsappUrl } from '@/utils/phone'
import type { Student, PaymentMethod, ContractStatus } from '@/types'

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de crédito',
  bank_slip: 'Boleto',
  cash: 'Dinheiro',
}

const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  active: 'Ativo',
  expired: 'Expirado',
  cancelled: 'Cancelado',
}

const CONTRACT_STATUS_COLOR: Record<ContractStatus, 'success' | 'error' | 'default'> = {
  active: 'success',
  expired: 'error',
  cancelled: 'default',
}

const DAY_LABEL: Record<string, string> = Object.fromEntries(DAYS.map((d) => [d.value, d.label]))

function openWhatsApp(phone: string) {
  const url = whatsappUrl(phone)
  if (url) window.open(url, '_blank')
}

function formatBRL(v: string | number | null | undefined): string {
  if (v == null) return '—'
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (Number.isNaN(n)) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface FieldProps {
  label: string
  children?: React.ReactNode
}

function Field({ label, children }: FieldProps) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
        {label}
      </Typography>
      <Box sx={{ mt: 0.25 }}>
        {children ?? <Typography variant="body2">—</Typography>}
      </Box>
    </Box>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="overline" color="text.secondary" sx={{ display: 'block', fontWeight: 700, mt: 1.5 }}>
      {children}
    </Typography>
  )
}

interface Props {
  student: Student | null
  onClose: () => void
}

export function StudentDetailsModal({ student, onClose }: Props) {
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['contracts', 'by-student', student?.id],
    queryFn: () => contractsApi.list({ student_id: student!.id }),
    enabled: !!student,
  })

  if (!student) return null

  const availability = student.availability ?? []

  return (
    <Dialog open={!!student} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detalhes do Aluno</DialogTitle>
      <DialogContent>
        <Stack spacing={1} sx={{ pt: 0.5 }}>
          <SectionTitle>Dados pessoais</SectionTitle>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field label="Nome completo">
                <Typography variant="body2" fontWeight={600}>{student.full_name}</Typography>
              </Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field label="CPF">
                <Typography variant="body2">{student.cpf ?? '—'}</Typography>
              </Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field label="E-mail">
                <Typography variant="body2">{student.email ?? '—'}</Typography>
              </Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field label="Telefone">
                {student.phone ? (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Tooltip title="Abrir WhatsApp">
                      <IconButton size="small" color="success" onClick={() => openWhatsApp(student.phone!)}>
                        <WhatsApp fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Typography variant="body2">{formatPhoneDisplay(student.phone)}</Typography>
                  </Stack>
                ) : <Typography variant="body2">—</Typography>}
              </Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field label="Instagram">
                <Typography variant="body2">{student.instagram ?? '—'}</Typography>
              </Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field label="Data de nascimento">
                <Typography variant="body2">
                  {student.birth_date ? dayjs(student.birth_date).format('DD/MM/YYYY') : '—'}
                </Typography>
              </Field>
            </Grid>
          </Grid>

          <Divider sx={{ mt: 1.5 }} />
          <SectionTitle>Plano e pagamento</SectionTitle>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Field label="Plano">
                <Typography variant="body2">{student.plan?.name ?? '—'}</Typography>
              </Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Field label="Valor mensal">
                <Typography variant="body2">{formatBRL(student.plan?.price)}</Typography>
              </Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Field label="Forma de pagamento">
                <Typography variant="body2">
                  {student.payment_method ? PAYMENT_METHOD_LABEL[student.payment_method] : '—'}
                </Typography>
              </Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Field label="Dia de vencimento">
                <Typography variant="body2">{student.payment_day ?? '—'}</Typography>
              </Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Field label="Cupom">
                <Typography variant="body2">{student.coupon ?? '—'}</Typography>
              </Field>
            </Grid>
          </Grid>

          <Divider sx={{ mt: 1.5 }} />
          <SectionTitle>Acadêmico</SectionTitle>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Field label="Status">
                <StudentStatusChip status={student.status} />
              </Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Field label="Nível">
                <Typography variant="body2">{student.level ?? '—'}</Typography>
              </Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Field label="Contrato aceito">
                <Typography variant="body2">{student.contract_accepted ? 'Sim' : 'Não'}</Typography>
              </Field>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Field label="Turmas">
                {student.classes?.length ? (
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {student.classes.map((c) => (
                      <Chip key={c.id} label={c.name} size="small" variant="outlined" />
                    ))}
                  </Stack>
                ) : (
                  <Chip label="Sem turma" size="small" variant="outlined" color="warning" />
                )}
              </Field>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Field label="Disponibilidade">
                {availability.length ? (
                  <Stack spacing={0.25}>
                    {availability.map((a) => (
                      <Typography key={a.day} variant="body2">
                        <strong>{DAY_LABEL[a.day] ?? a.day}:</strong>{' '}
                        {a.slots.length
                          ? a.slots.map((s) => `${s.start}–${s.end}`).join(', ')
                          : '—'}
                      </Typography>
                    ))}
                  </Stack>
                ) : <Typography variant="body2">—</Typography>}
              </Field>
            </Grid>
          </Grid>

          <Divider sx={{ mt: 1.5 }} />
          <SectionTitle>Contratos</SectionTitle>
          {contractsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={20} />
            </Box>
          ) : contracts.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Sem contratos registrados.</Typography>
          ) : (
            <Stack spacing={1}>
              {contracts.map((c) => (
                <Box key={c.id} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Typography variant="body2">
                      <strong>Início:</strong> {dayjs(c.start_date).format('DD/MM/YYYY')}
                      {' · '}
                      <strong>Término:</strong> {c.end_date ? dayjs(c.end_date).format('DD/MM/YYYY') : '—'}
                    </Typography>
                    <Chip
                      label={CONTRACT_STATUS_LABEL[c.status]}
                      color={CONTRACT_STATUS_COLOR[c.status]}
                      size="small" variant="outlined"
                    />
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}

          <Divider sx={{ mt: 1.5 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field label="Cadastrado em">
                <Typography variant="body2">{dayjs(student.created_at).format('DD/MM/YYYY HH:mm')}</Typography>
              </Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field label="Última atualização">
                <Typography variant="body2">{dayjs(student.updated_at).format('DD/MM/YYYY HH:mm')}</Typography>
              </Field>
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  )
}
