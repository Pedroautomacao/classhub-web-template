import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, FormControlLabel, FormGroup, Grid,
  IconButton, InputLabel, MenuItem, Select, Stack, Switch, TextField, Tooltip,
  Typography,
} from '@mui/material'
import { Add, Close, Delete, Edit, PlayArrow } from '@mui/icons-material'
import { npsTemplatesApi, type NpsTemplateCreate } from '@/api/nps.api'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useSnackbarStore } from '@/store/snackbar.store'
import { usePermission } from '@/hooks/usePermission'
import { Permission } from '@/utils/permissions'
import { getApiError } from '@/utils/errors'
import { BUCKET_LABELS } from '@/utils/nps'
import type { NpsBucket, NpsQuestion, NpsQuestionType, NpsTemplate } from '@/types'

const TYPE_LABELS: Record<NpsQuestionType, string> = {
  nps: 'NPS (0–10)',
  rating: 'Avaliação (estrelas)',
  scale: 'Escala',
  single_choice: 'Escolha única',
  multiple_choice: 'Múltipla escolha',
  text: 'Texto livre',
}

const BUCKETS: NpsBucket[] = ['detractor', 'passive', 'promoter']

function genQuestionId(): string {
  // crypto.randomUUID só existe em contexto seguro (HTTPS/localhost); fallback p/ HTTP.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function newQuestion(type: NpsQuestionType = 'nps'): NpsQuestion {
  const base: NpsQuestion = { id: genQuestionId(), type, text: '', required: true }
  if (type === 'single_choice' || type === 'multiple_choice') base.options = ['']
  if (type === 'rating') base.config = { max: 5 }
  if (type === 'scale') base.config = { min: 1, max: 5 }
  return base
}

// ── Editor de uma pergunta ────────────────────────────────────────────────────

interface QuestionEditorProps {
  index: number
  question: NpsQuestion
  npsOptions: NpsQuestion[] // perguntas tipo nps disponíveis para condição
  onChange: (patch: Partial<NpsQuestion>) => void
  onChangeType: (type: NpsQuestionType) => void
  onRemove: () => void
}

function QuestionEditor({ index, question, npsOptions, onChange, onChangeType, onRemove }: QuestionEditorProps) {
  const isChoice = question.type === 'single_choice' || question.type === 'multiple_choice'
  const options = question.options ?? []

  const setOption = (i: number, val: string) => {
    const next = [...options]
    next[i] = val
    onChange({ options: next })
  }

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
            fullWidth size="small"
            value={question.text}
            onChange={(e) => onChange({ text: e.target.value })}
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Tipo de resposta</InputLabel>
            <Select
              label="Tipo de resposta"
              value={question.type}
              onChange={(e) => onChangeType(e.target.value as NpsQuestionType)}
            >
              {Object.entries(TYPE_LABELS).map(([v, l]) => (
                <MenuItem key={v} value={v} disabled={v === 'nps' && npsOptions.length > 0}>{l}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Config: rating */}
          {question.type === 'rating' && (
            <TextField
              label="Nº de estrelas" type="number" size="small" sx={{ maxWidth: 160 }}
              value={question.config?.max ?? 5}
              onChange={(e) => onChange({ config: { ...question.config, max: Number(e.target.value) || 5 } })}
              inputProps={{ min: 2, max: 10 }}
            />
          )}

          {/* Config: scale */}
          {question.type === 'scale' && (
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label="Mínimo" type="number" size="small" fullWidth
                  value={question.config?.min ?? 1}
                  onChange={(e) => onChange({ config: { ...question.config, min: Number(e.target.value) } })}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label="Máximo" type="number" size="small" fullWidth
                  value={question.config?.max ?? 5}
                  onChange={(e) => onChange({ config: { ...question.config, max: Number(e.target.value) } })}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label="Rótulo mín." size="small" fullWidth
                  value={question.config?.min_label ?? ''}
                  onChange={(e) => onChange({ config: { ...question.config, min_label: e.target.value } })}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label="Rótulo máx." size="small" fullWidth
                  value={question.config?.max_label ?? ''}
                  onChange={(e) => onChange({ config: { ...question.config, max_label: e.target.value } })}
                />
              </Grid>
            </Grid>
          )}

          {/* Opções: choice */}
          {isChoice && (
            <Box>
              <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
                Opções de resposta
              </Typography>
              <Stack spacing={1}>
                {options.map((opt, oi) => (
                  <Stack key={oi} direction="row" spacing={1} alignItems="center">
                    <TextField
                      size="small" fullWidth placeholder={`Opção ${oi + 1}`}
                      value={opt}
                      onChange={(e) => setOption(oi, e.target.value)}
                    />
                    <IconButton size="small" color="error" onClick={() => onChange({ options: options.filter((_, i) => i !== oi) })}>
                      <Close fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
                <Button size="small" startIcon={<Add />} onClick={() => onChange({ options: [...options, ''] })} sx={{ alignSelf: 'flex-start' }}>
                  Adicionar opção
                </Button>
              </Stack>
            </Box>
          )}

          {/* Condição (follow-up condicional por faixa de NPS) */}
          {npsOptions.length > 0 && (
            <Box sx={{ borderTop: '1px dashed', borderColor: 'divider', pt: 1.5 }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={!!question.condition}
                    onChange={(e) => onChange({
                      condition: e.target.checked
                        ? { question_id: npsOptions[0].id, buckets: ['detractor'] }
                        : undefined,
                    })}
                  />
                }
                label={<Typography variant="caption">Mostrar só conforme a nota de uma pergunta de NPS</Typography>}
              />
              {question.condition && (
                <Stack spacing={1.5} mt={1}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Pergunta de NPS</InputLabel>
                    <Select
                      label="Pergunta de NPS"
                      value={question.condition.question_id}
                      onChange={(e) => onChange({ condition: { ...question.condition!, question_id: e.target.value } })}
                    >
                      {npsOptions.map((q) => (
                        <MenuItem key={q.id} value={q.id}>{q.text || '(sem texto)'}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormGroup row>
                    {BUCKETS.map((b) => {
                      const checked = question.condition!.buckets.includes(b)
                      return (
                        <FormControlLabel
                          key={b}
                          control={
                            <Checkbox
                              size="small" checked={checked}
                              onChange={(e) => {
                                const buckets = e.target.checked
                                  ? [...question.condition!.buckets, b]
                                  : question.condition!.buckets.filter((x) => x !== b)
                                onChange({ condition: { ...question.condition!, buckets } })
                              }}
                            />
                          }
                          label={<Typography variant="caption">{BUCKET_LABELS[b]}</Typography>}
                        />
                      )
                    })}
                  </FormGroup>
                </Stack>
              )}
            </Box>
          )}

          <FormControlLabel
            control={<Switch size="small" checked={question.required} onChange={(e) => onChange({ required: e.target.checked })} />}
            label={<Typography variant="caption">{question.required ? 'Obrigatória' : 'Opcional'}</Typography>}
          />
        </Stack>
      </CardContent>
    </Card>
  )
}

// ── Modal de template ─────────────────────────────────────────────────────────

interface TemplateFormModalProps {
  open: boolean
  template: NpsTemplate | null
  onClose: () => void
}

function TemplateFormModal({ open, template, onClose }: TemplateFormModalProps) {
  const qc = useQueryClient()
  const { show } = useSnackbarStore()
  const [name, setName] = useState('')
  const [questions, setQuestions] = useState<NpsQuestion[]>([])

  useEffect(() => {
    if (open) {
      setName(template?.name ?? '')
      setQuestions(template ? structuredClone(template.questions) : [])
    }
  }, [open, template])

  const updateQuestion = (index: number, patch: Partial<NpsQuestion>) =>
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)))

  // Invariante: trocar o tipo gera um id NOVO (semanticamente é outra pergunta),
  // mantendo a agregação por id sempre com um único tipo.
  const changeType = (index: number, type: NpsQuestionType) =>
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== index) return q
      const replaced = newQuestion(type)
      return { ...replaced, text: q.text, required: q.required }
    }))

  const removeQuestion = (index: number) =>
    setQuestions((prev) => prev.filter((_, i) => i !== index))

  const save = useMutation({
    mutationFn: (payload: NpsTemplateCreate) =>
      template ? npsTemplatesApi.update(template.id, payload) : npsTemplatesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nps-templates'] })
      show(template ? 'Template atualizado!' : 'Template criado!')
      onClose()
    },
    onError: (e) => show(getApiError(e, 'Erro ao salvar template.'), 'error'),
  })

  const handleSave = () => {
    if (!name.trim()) { show('Dê um nome ao template.', 'error'); return }
    if (questions.length === 0) { show('Adicione pelo menos uma pergunta.', 'error'); return }
    if (questions.filter((q) => q.type === 'nps').length > 1) {
      show('Só é permitida uma pergunta do tipo NPS por template.', 'error'); return
    }
    for (const q of questions) {
      if (!q.text.trim()) { show('Toda pergunta precisa de um texto.', 'error'); return }
      if ((q.type === 'single_choice' || q.type === 'multiple_choice')) {
        const opts = (q.options ?? []).map((o) => o.trim()).filter(Boolean)
        if (opts.length === 0) { show(`A pergunta "${q.text}" precisa de ao menos uma opção.`, 'error'); return }
      }
    }
    // Limpa opções vazias antes de enviar
    const cleaned = questions.map((q) => ({
      ...q,
      options: q.options ? q.options.map((o) => o.trim()).filter(Boolean) : undefined,
    }))
    save.mutate({ name: name.trim(), questions: cleaned })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{template ? 'Editar Template' : 'Novo Template'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Alert severity="info">
            <Typography variant="body2" fontWeight={600} gutterBottom>Como montar a pesquisa</Typography>
            <Typography variant="body2" component="div">
              Dê um nome, adicione perguntas e escolha o <strong>tipo de resposta</strong> de cada uma:
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                <li><strong>NPS (0–10)</strong>: pergunta-chave de recomendação. Classifica em Detrator (0–6), Neutro (7–8) e Promotor (9–10).</li>
                <li><strong>Avaliação / Escala</strong>: notas, ex.: satisfação de 1 a 5.</li>
                <li><strong>Escolha única / Múltipla escolha</strong>: opções pré-definidas.</li>
                <li><strong>Texto livre</strong>: comentário aberto (vira nuvem de palavras + análise de sentimento).</li>
              </Box>
              <strong>Ative</strong> um template para publicá-lo no link público. A opção <em>"Mostrar só conforme a nota"</em> cria um follow-up condicional (ex.: pergunta extra só para quem é detrator).
            </Typography>
          </Alert>
          <TextField label="Nome do template *" fullWidth value={name} onChange={(e) => setName(e.target.value)} />

          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Typography variant="subtitle2">Perguntas ({questions.length})</Typography>
              <Button size="small" startIcon={<Add />} onClick={() => setQuestions((p) => [newQuestion(p.some((q) => q.type === 'nps') ? 'text' : 'nps'), ...p])}>
                Adicionar pergunta
              </Button>
            </Stack>

            <Stack spacing={2}>
              {questions.map((q, index) => (
                <QuestionEditor
                  key={q.id}
                  index={index}
                  question={q}
                  npsOptions={questions.filter((o) => o.type === 'nps' && o.id !== q.id)}
                  onChange={(patch) => updateQuestion(index, patch)}
                  onChangeType={(type) => changeType(index, type)}
                  onRemove={() => removeQuestion(index)}
                />
              ))}
              {questions.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  Nenhuma pergunta. Clique em "Adicionar pergunta".
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={save.isPending}>
          {template ? 'Salvar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Card de template ──────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: NpsTemplate
  canWrite: boolean
  canDelete: boolean
  onEdit: (t: NpsTemplate) => void
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
                <IconButton size="small" onClick={() => onEdit(template)}><Edit fontSize="small" /></IconButton>
              </Tooltip>
            )}
            {canDelete && !template.is_active && (
              <Tooltip title="Excluir">
                <IconButton size="small" color="error" onClick={() => onDelete(template.id)}><Delete fontSize="small" /></IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>

        <Stack spacing={0.5} mt={1.5}>
          {template.questions.map((q, i) => (
            <Stack key={q.id} direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 20 }}>{i + 1}.</Typography>
              <Typography variant="body2" flex={1} noWrap>{q.text}{q.required ? ' *' : ''}</Typography>
              <Chip label={TYPE_LABELS[q.type] ?? q.type} size="small" variant="outlined" />
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

// ── Tab principal ─────────────────────────────────────────────────────────────

export function NpsTemplatesTab() {
  const qc = useQueryClient()
  const { show } = useSnackbarStore()
  const { hasPermission } = usePermission()
  const canWrite = hasPermission(Permission.NPS_WRITE)
  const canDelete = hasPermission(Permission.NPS_DELETE)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<NpsTemplate | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['nps-templates'],
    queryFn: npsTemplatesApi.list,
  })

  const activateMutation = useMutation({
    mutationFn: npsTemplatesApi.activate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nps-templates'] })
      show('Template ativado!')
    },
    onError: (e) => show(getApiError(e, 'Erro ao ativar template.'), 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: npsTemplatesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nps-templates'] })
      show('Template excluído.')
      setDeleteId(null)
    },
    onError: (e) => show(getApiError(e, 'Erro ao excluir template.'), 'error'),
  })

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" mb={2}>
        {canWrite && (
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditTarget(null); setModalOpen(true) }}>
            Novo Template
          </Button>
        )}
      </Stack>

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
                onEdit={(tpl) => { setEditTarget(tpl); setModalOpen(true) }}
                onActivate={(id) => activateMutation.mutate(id)}
                onDelete={setDeleteId}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <TemplateFormModal open={modalOpen} template={editTarget} onClose={() => { setModalOpen(false); setEditTarget(null) }} />

      <ConfirmDialog
        open={!!deleteId}
        title="Excluir template"
        message="Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita."
        confirmColor="error"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </Box>
  )
}
