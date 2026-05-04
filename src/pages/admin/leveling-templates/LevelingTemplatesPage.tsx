import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Add,
  Close,
  Delete,
  Edit,
  PlayArrow,
} from '@mui/icons-material'
import { levelingTemplatesApi } from '@/api/leveling-templates.api'
import type { LevelingTemplate } from '@/types'
import { PageHeader } from '@/components/common/PageHeader'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useSnackbarStore } from '@/store/snackbar.store'
import { usePermission } from '@/hooks/usePermission'
import { Permission } from '@/utils/permissions'

// ── Zod schema ──────────────────────────────────────────────────────────────

const questionSchema = z.object({
  id: z.string(),
  type: z.enum(['single_choice', 'multiple_choice', 'text']),
  text: z.string().min(1, 'Texto da pergunta é obrigatório'),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
})

const templateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  questions: z.array(questionSchema).min(1, 'Adicione pelo menos uma pergunta'),
})

type TemplateFormValues = z.infer<typeof templateSchema>

// ── Question type label ──────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  text: 'Texto livre',
  single_choice: 'Escolha única',
  multiple_choice: 'Múltipla escolha',
}

// ── Template card ────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: LevelingTemplate
  canWrite: boolean
  canDelete: boolean
  onEdit: (t: LevelingTemplate) => void
  onActivate: (id: string) => void
  onDelete: (id: string) => void
}

function TemplateCard({ template, canWrite, canDelete, onEdit, onActivate, onDelete }: TemplateCardProps) {
  return (
    <Card variant="outlined" sx={{ border: template.is_active ? '2px solid' : undefined, borderColor: 'success.main' }}>
      <CardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Box flex={1}>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <Typography variant="subtitle1" fontWeight={700}>{template.name}</Typography>
              {template.is_active && <Chip label="Ativo" color="success" size="small" />}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {template.questions.length} pergunta{template.questions.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5}>
            {canWrite && !template.is_active && (
              <Tooltip title="Ativar template">
                <IconButton size="small" color="success" onClick={() => onActivate(template.id)}>
                  <PlayArrow fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canWrite && (
              <Tooltip title="Editar">
                <IconButton size="small" onClick={() => onEdit(template)}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDelete && !template.is_active && (
              <Tooltip title="Excluir">
                <IconButton size="small" color="error" onClick={() => onDelete(template.id)}>
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>

        <Stack spacing={0.5} mt={1.5}>
          {template.questions.map((q, i) => (
            <Stack key={q.id} direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 20 }}>
                {i + 1}.
              </Typography>
              <Typography variant="body2" flex={1} noWrap>{q.text}</Typography>
              <Chip label={TYPE_LABELS[q.type] ?? q.type} size="small" variant="outlined" />
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

// ── Question editor ──────────────────────────────────────────────────────────

interface QuestionEditorProps {
  index: number
  control: any
  register: any
  watch: any
  errors: any
  onRemove: () => void
}

function QuestionEditor({ index, control, register, watch, errors, onRemove }: QuestionEditorProps) {
  const type = watch(`questions.${index}.type`)
  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: `questions.${index}.options` as any,
  })

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle2" color="primary">Pergunta {index + 1}</Typography>
            <IconButton size="small" color="error" onClick={onRemove}>
              <Close fontSize="small" />
            </IconButton>
          </Stack>

          <TextField
            label="Texto da pergunta *"
            fullWidth
            size="small"
            error={!!errors?.questions?.[index]?.text}
            helperText={errors?.questions?.[index]?.text?.message}
            {...register(`questions.${index}.text`)}
          />

          <Controller
            control={control}
            name={`questions.${index}.type`}
            render={({ field }) => (
              <FormControl size="small" fullWidth>
                <InputLabel>Tipo de resposta</InputLabel>
                <Select {...field} label="Tipo de resposta">
                  <MenuItem value="text">Texto livre</MenuItem>
                  <MenuItem value="single_choice">Escolha única</MenuItem>
                  <MenuItem value="multiple_choice">Múltipla escolha</MenuItem>
                </Select>
              </FormControl>
            )}
          />

          {(type === 'single_choice' || type === 'multiple_choice') && (
            <Box>
              <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
                Opções de resposta
              </Typography>
              <Stack spacing={1}>
                {optionFields.map((opt, oi) => (
                  <Stack key={opt.id} direction="row" spacing={1} alignItems="center">
                    <TextField
                      size="small"
                      fullWidth
                      placeholder={`Opção ${oi + 1}`}
                      {...register(`questions.${index}.options.${oi}`)}
                    />
                    <IconButton size="small" color="error" onClick={() => removeOption(oi)}>
                      <Close fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={() => appendOption('')}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Adicionar opção
                </Button>
              </Stack>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

// ── Template form modal ──────────────────────────────────────────────────────

interface TemplateFormModalProps {
  open: boolean
  template: LevelingTemplate | null
  onClose: () => void
}

function TemplateFormModal({ open, template, onClose }: TemplateFormModalProps) {
  const qc = useQueryClient()
  const { show: showSnackbar } = useSnackbarStore()

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: template
      ? { name: template.name, questions: template.questions }
      : { name: '', questions: [] },
  })

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: 'questions',
  })

  const createMutation = useMutation({
    mutationFn: levelingTemplatesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leveling-templates'] })
      showSnackbar('Template criado!', 'success')
      onClose()
    },
    onError: () => showSnackbar('Erro ao criar template', 'error'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => levelingTemplatesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leveling-templates'] })
      showSnackbar('Template atualizado!', 'success')
      onClose()
    },
    onError: () => showSnackbar('Erro ao atualizar template', 'error'),
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = (values: TemplateFormValues) => {
    const payload = {
      name: values.name,
      questions: values.questions.map((q, i) => ({
        id: q.id || `q${i + 1}`,
        type: q.type,
        text: q.text,
        options: q.options?.filter(Boolean),
        required: q.required ?? true,
      })),
    }
    if (template) {
      updateMutation.mutate({ id: template.id, data: payload })
    } else {
      createMutation.mutate(payload as any)
    }
  }

  const addQuestion = () => {
    appendQuestion({
      id: `q${Date.now()}`,
      type: 'text',
      text: '',
      options: [],
      required: true,
    })
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{template ? 'Editar Template' : 'Novo Template'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} component="form" id="template-form" onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Nome do template *"
            fullWidth
            error={!!errors.name}
            helperText={errors.name?.message}
            {...register('name')}
          />

          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Typography variant="subtitle2">
                Perguntas ({questionFields.length})
              </Typography>
              <Button size="small" startIcon={<Add />} onClick={addQuestion}>
                Adicionar pergunta
              </Button>
            </Stack>

            {errors.questions && !Array.isArray(errors.questions) && (
              <Typography variant="caption" color="error" mb={1} display="block">
                {(errors.questions as any).message}
              </Typography>
            )}

            <Stack spacing={2}>
              {questionFields.map((field, index) => (
                <QuestionEditor
                  key={field.id}
                  index={index}
                  control={control}
                  register={register}
                  watch={watch}
                  errors={errors}
                  onRemove={() => removeQuestion(index)}
                />
              ))}
              {questionFields.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  Nenhuma pergunta adicionada. Clique em "Adicionar pergunta".
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          type="submit"
          form="template-form"
          variant="contained"
          disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
        >
          {template ? 'Salvar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export function LevelingTemplatesPage() {
  const qc = useQueryClient()
  const { show: showSnackbar } = useSnackbarStore()
  const { hasPermission } = usePermission()
  const canWrite = hasPermission(Permission.LEVELING_WRITE)
  const canDelete = hasPermission(Permission.LEVELING_DELETE)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<LevelingTemplate | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['leveling-templates'],
    queryFn: levelingTemplatesApi.list,
  })

  const activateMutation = useMutation({
    mutationFn: levelingTemplatesApi.activate,
    onSuccess: (activated) => {
      qc.setQueryData<LevelingTemplate[]>(['leveling-templates'], (old) =>
        old ? old.map((t) => ({ ...t, is_active: t.id === activated.id })) : old
      )
      showSnackbar('Template ativado!', 'success')
    },
    onError: () => showSnackbar('Erro ao ativar template', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: levelingTemplatesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leveling-templates'] })
      showSnackbar('Template excluído!', 'success')
      setDeleteId(null)
    },
    onError: () => showSnackbar('Erro ao excluir template', 'error'),
  })

  const handleEdit = (template: LevelingTemplate) => {
    setEditTarget(template)
    setModalOpen(true)
  }

  const handleNewTemplate = () => {
    setEditTarget(null)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditTarget(null)
  }

  return (
    <Box>
      <PageHeader
        title="Templates de Nivelamento"
        subtitle="Gerencie os formulários de nivelamento dinâmicos"
        actionLabel={canWrite ? 'Novo Template' : undefined}
        onAction={canWrite ? handleNewTemplate : undefined}
        helpContent={{
          what: 'Esta tela permite criar e gerenciar o formulário de nivelamento que os candidatos preenchem publicamente. O template define as perguntas, tipos de resposta e ordem exibida no formulário.',
          actions: [
            'Criar templates com perguntas de texto, escolha única ou múltipla escolha',
            'Reordenar, editar e remover perguntas',
            'Ativar um template para que ele seja exibido no link público',
            'Visualizar o histórico de templates anteriores',
          ],
          tips: [
            'Apenas um template pode estar ativo por vez — ativar um novo desativa o anterior automaticamente.',
            'Respostas já recebidas ficam vinculadas ao template ativo na época do preenchimento, preservando o histórico.',
            'Pense nas perguntas como um teste de nível: gramática, vocabulário, autoavaliação e objetivos do aluno.',
          ],
          flow: 'Crie o Template aqui → Ative-o → Compartilhe o Link Público → Candidatos preenchem → Analise em Formulários de Nivelamento.',
        }}
      />

      {isLoading ? (
        <Typography color="text.secondary">Carregando...</Typography>
      ) : templates.length === 0 ? (
        <Typography color="text.secondary">Nenhum template criado ainda.</Typography>
      ) : (
        <Grid container spacing={2}>
          {templates.map((t) => (
            <Grid key={t.id} size={{ xs: 12, md: 6 }}>
              <TemplateCard
                template={t}
                canWrite={canWrite}
                canDelete={canDelete}
                onEdit={handleEdit}
                onActivate={(id) => activateMutation.mutate(id)}
                onDelete={setDeleteId}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <TemplateFormModal
        open={modalOpen}
        template={editTarget}
        onClose={handleModalClose}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Excluir template"
        message="Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </Box>
  )
}
