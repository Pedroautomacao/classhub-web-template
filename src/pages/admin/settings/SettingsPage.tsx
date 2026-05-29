import { useEffect, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Paper, Stack, Typography, TextField, Button,
  CircularProgress, Alert, Grid, Divider, Chip, IconButton,
  InputAdornment,
} from '@mui/material'
import { Save, UploadFile, Delete, Add } from '@mui/icons-material'
import { PageHeader } from '@/components/common/PageHeader'
import { DatePickerField } from '@/components/common/DatePickerField'
import { settingsApi } from '@/api/settings.api'
import { useSnackbarStore } from '@/store/snackbar.store'
import { getApiError } from '@/utils/errors'
import { fileToBase64 } from '@/api/files.api'

const schema = z.object({
  school_name: z.string().min(1, 'Nome da escola é obrigatório'),
  welcome_text: z.string().optional(),
  hero_bg_url: z.string().optional(),
  semester_start: z.string().optional(),
  semester_end: z.string().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function SettingsPage() {
  const qc = useQueryClient()
  const { show } = useSnackbarStore()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [newLevel, setNewLevel] = useState('')

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  })

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const heroBgUrl = watch('hero_bg_url')
  const levelOptions = settings?.level_options ?? []

  useEffect(() => {
    if (settings) {
      reset({
        school_name: settings.school_name,
        welcome_text: settings.welcome_text ?? '',
        hero_bg_url: settings.hero_bg_url ?? '',
        semester_start: settings.semester_start ?? '',
        semester_end: settings.semester_end ?? '',
        whatsapp: settings.whatsapp ?? '',
        instagram: settings.instagram ?? '',
      })
    }
  }, [settings, reset])

  const mutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      qc.invalidateQueries({ queryKey: ['landing'] })
      show('Configurações salvas!')
    },
    onError: (error) => show(getApiError(error, 'Erro ao salvar configurações.'), 'error'),
  })

  const levelMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (error) => show(getApiError(error, 'Erro ao atualizar níveis.'), 'error'),
  })

  const onSubmit = (values: FormValues) => {
    mutation.mutate({
      school_name: values.school_name,
      welcome_text: values.welcome_text || undefined,
      hero_bg_url: values.hero_bg_url || null,
      semester_start: values.semester_start || undefined,
      semester_end: values.semester_end || undefined,
      whatsapp: values.whatsapp || undefined,
      instagram: values.instagram || undefined,
    })
  }

  const handleAddLevel = () => {
    const trimmed = newLevel.trim()
    if (!trimmed || levelOptions.includes(trimmed)) return
    levelMutation.mutate({ level_options: [...levelOptions, trimmed] })
    setNewLevel('')
  }

  const handleRemoveLevel = (level: string) => {
    levelMutation.mutate({ level_options: levelOptions.filter((l) => l !== level) })
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const base64 = await fileToBase64(file)
    const dataUrl = `data:${file.type};base64,${base64}`
    setValue('hero_bg_url', dataUrl, { shouldDirty: true })
  }

  if (isLoading) return <Box><Typography>Carregando...</Typography></Box>

  return (
    <Box>
      <PageHeader
        title="Configurações da Escola"
        subtitle="Gerencie as informações e aparência da escola"
        helpContent={{
          what: 'A tela de Configurações controla as informações globais da escola exibidas no sistema e nos formulários públicos: nome, texto de boas-vindas, imagem de fundo do Hero da landing, datas do semestre, redes sociais e os níveis de idioma disponíveis.',
          actions: [
            'Atualizar o nome oficial da escola (aparece na landing page e nos formulários)',
            'Personalizar o texto e a imagem de fundo do Hero da landing page pública',
            'Definir as datas de início e fim do semestre atual',
            'Configurar links de WhatsApp e Instagram exibidos publicamente',
            'Gerenciar os níveis de idioma disponíveis para classificar alunos e turmas',
          ],
          tips: [
            'O nome da escola configurado aqui é exibido em todas as telas do sistema.',
            'A imagem do Hero aparece como background da seção principal da landing — use imagem de boa qualidade (mínimo 1600px de largura). Sem imagem cadastrada, o Hero exibe o gradiente Lumina como fallback.',
            'Um nível de idioma só pode ser removido se não estiver em uso por nenhum aluno ou turma.',
          ],
          flow: 'Configure aqui antes de lançar o sistema → Revise no início de cada semestre → Qualquer alteração reflete imediatamente nas telas públicas.',
        }}
      />
      <Stack spacing={3} sx={{ maxWidth: 700 }}>
        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
            {mutation.isError && <Alert severity="error">Erro ao salvar. Tente novamente.</Alert>}

            <Typography variant="subtitle1" fontWeight={600} color="primary">Informações Gerais</Typography>
            <TextField label="Nome da escola *" fullWidth error={!!errors.school_name} helperText={errors.school_name?.message} {...register('school_name')} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="semester_start"
                  control={control}
                  render={({ field }) => (
                    <DatePickerField
                      label="Início do semestre"
                      fullWidth
                      value={field.value || null}
                      onChange={(v) => field.onChange(v ?? '')}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="semester_end"
                  control={control}
                  render={({ field }) => (
                    <DatePickerField
                      label="Fim do semestre"
                      fullWidth
                      value={field.value || null}
                      onChange={(v) => field.onChange(v ?? '')}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider />
            <Typography variant="subtitle1" fontWeight={600} color="primary">Landing Page</Typography>
            <TextField label="Texto de boas-vindas" multiline rows={3} fullWidth {...register('welcome_text')} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="WhatsApp"
                  fullWidth
                  placeholder="5511999999999"
                  helperText="Número com DDI e DDD, sem espaços ou símbolos"
                  {...register('whatsapp')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Instagram"
                  fullWidth
                  placeholder="@escolaclasshub"
                  helperText="Usuário com ou sem @"
                  {...register('instagram')}
                />
              </Grid>
            </Grid>

            {/* Imagem de boas-vindas */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
            <Controller
              name="hero_bg_url"
              control={control}
              render={() => (
                <Box>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    Imagem de fundo do Hero
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                    Aparece como background da seção principal da landing. Sem imagem, o Hero usa o gradiente Lumina como fallback.
                    <br />
                    <strong>Proporção recomendada:</strong> 16:9 horizontal (ex: 1920×1080 ou 2560×1440). Mínimo 1600px de largura para boa qualidade em telas grandes.
                  </Typography>
                  {heroBgUrl ? (
                    <Stack spacing={1}>
                      <Box
                        component="img"
                        src={heroBgUrl}
                        alt="Imagem de fundo do Hero"
                        sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                      />
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small" variant="outlined" startIcon={<UploadFile />}
                          onClick={() => imageInputRef.current?.click()}
                        >
                          Substituir
                        </Button>
                        <Button
                          size="small" variant="outlined" color="error" startIcon={<Delete />}
                          onClick={() => setValue('hero_bg_url', '', { shouldDirty: true })}
                        >
                          Remover
                        </Button>
                      </Stack>
                    </Stack>
                  ) : (
                    <Button variant="outlined" startIcon={<UploadFile />} onClick={() => imageInputRef.current?.click()}>
                      Fazer upload da imagem
                    </Button>
                  )}
                </Box>
              )}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit" variant="contained" startIcon={mutation.isPending ? <CircularProgress size={18} color="inherit" /> : <Save />}
                disabled={mutation.isPending || !isDirty}
              >
                {mutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </Box>
          </Stack>
        </Paper>

        {/* Níveis de idioma */}
        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600} color="primary">Níveis de Idioma</Typography>
              <Typography variant="body2" color="text.secondary">
                Opções disponíveis para classificar alunos e turmas. Um nível só pode ser removido se não estiver em uso.
              </Typography>
            </Box>

            {levelOptions.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {levelOptions.map((level) => (
                  <Chip
                    key={level}
                    label={level}
                    onDelete={() => handleRemoveLevel(level)}
                    disabled={levelMutation.isPending}
                    variant="outlined"
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                Nenhum nível cadastrado ainda.
              </Typography>
            )}

            <TextField
              label="Adicionar nível"
              size="small"
              placeholder="Ex: A1, B2, Iniciante..."
              value={newLevel}
              onChange={(e) => setNewLevel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddLevel() } }}
              sx={{ maxWidth: 340 }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={handleAddLevel}
                        disabled={!newLevel.trim() || levelMutation.isPending}
                      >
                        <Add fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>
        </Paper>
      </Stack>
    </Box>
  )
}
