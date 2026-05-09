import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Grid,
  CircularProgress,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Typography,
  Box,
  Chip,
  IconButton,
} from '@mui/material'
import { Add, Close } from '@mui/icons-material'
import type { Plan } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  duration_months: z.number({ message: 'Informe um número inteiro' }).int().min(1, 'Mínimo 1 mês'),
  price: z.number({ message: 'Informe um valor' }).positive('Preço deve ser positivo'),
})

type FormValues = z.infer<typeof schema>

interface PlanFormModalProps {
  open: boolean
  plan?: Plan | null
  loading?: boolean
  onClose: () => void
  onSubmit: (values: FormValues & { benefits: string[] }) => void
}

export function PlanFormModal({
  open,
  plan,
  loading = false,
  onClose,
  onSubmit,
}: PlanFormModalProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))

  const isEdit = !!plan

  const [benefits, setBenefits] = useState<string[]>([])
  const [benefitInput, setBenefitInput] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      reset(
        plan
          ? {
              name: plan.name,
              description: plan.description ?? '',
              duration_months: plan.duration_months,
              price: parseFloat(plan.price),
            }
          : { name: '', description: '', duration_months: 1, price: 0 }
      )
      setBenefits(plan?.benefits ?? [])
      setBenefitInput('')
    }
  }, [open, plan, reset])

  const addBenefit = () => {
    const trimmed = benefitInput.trim()
    if (!trimmed || benefits.includes(trimmed)) return
    setBenefits((prev) => [...prev, trimmed])
    setBenefitInput('')
  }

  const removeBenefit = (b: string) => setBenefits((prev) => prev.filter((x) => x !== b))

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>{isEdit ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
      <DialogContent sx={{ overflowX: 'hidden' }}>
        <Stack component="form" id="plan-form" onSubmit={handleSubmit((v) => onSubmit({ ...v, benefits }))} spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Nome *"
            fullWidth
            error={!!errors.name}
            helperText={errors.name?.message}
            {...register('name')}
          />
          <TextField
            label="Descrição"
            fullWidth
            multiline
            rows={2}
            {...register('description')}
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Duração *"
                type="number"
                fullWidth
                slotProps={{ input: { endAdornment: <InputAdornment position="end">meses</InputAdornment> } }}
                error={!!errors.duration_months}
                helperText={errors.duration_months?.message}
                {...register('duration_months', { valueAsNumber: true })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Preço *"
                type="number"
                fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }}
                error={!!errors.price}
                helperText={errors.price?.message}
                {...register('price', { valueAsNumber: true })}
              />
            </Grid>
          </Grid>

          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>Vantagens</Typography>
            <Stack direction="row" spacing={1} mb={1}>
              <TextField
                size="small"
                fullWidth
                placeholder="Ex: 2 aulas por semana"
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBenefit() } }}
              />
              <IconButton onClick={addBenefit} color="primary" disabled={!benefitInput.trim()}>
                <Add />
              </IconButton>
            </Stack>
            {benefits.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {benefits.map((b) => (
                  <Chip
                    key={b}
                    label={b}
                    size="small"
                    onDelete={() => removeBenefit(b)}
                    deleteIcon={<Close fontSize="small" />}
                  />
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          type="submit"
          form="plan-form"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {isEdit ? 'Salvar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
