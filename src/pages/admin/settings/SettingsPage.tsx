import { useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Paper, Stack, Typography, TextField, Button,
  CircularProgress, Alert, Grid, Divider,
} from '@mui/material'
import { Save, UploadFile, Delete } from '@mui/icons-material'
import { PageHeader } from '@/components/common/PageHeader'
import { settingsApi } from '@/api/settings.api'
import { useSnackbarStore } from '@/store/snackbar.store'
import { getApiError } from '@/utils/errors'
import { fileToBase64 } from '@/api/files.api'

const schema = z.object({
  school_name: z.string().min(1, 'Nome da escola é obrigatório'),
  welcome_text: z.string().optional(),
  welcome_image: z.string().optional(),
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

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  })

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const welcomeImage = watch('welcome_image')

  useEffect(() => {
    if (settings) {
      reset({
        school_name: settings.school_name,
        welcome_text: settings.welcome_text ?? '',
        welcome_image: settings.welcome_image ?? '',
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

  const onSubmit = (values: FormValues) => {
    mutation.mutate({
      school_name: values.school_name,
      welcome_text: values.welcome_text || undefined,
      welcome_image: values.welcome_image || null,
      semester_start: values.semester_start || undefined,
      semester_end: values.semester_end || undefined,
      whatsapp: values.whatsapp || undefined,
      instagram: values.instagram || undefined,
    })
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const base64 = await fileToBase64(file)
    const dataUrl = `data:${file.type};base64,${base64}`
    setValue('welcome_image', dataUrl, { shouldDirty: true })
  }

  if (isLoading) return <Box><Typography>Carregando...</Typography></Box>

  return (
    <Box>
      <PageHeader
        title="Configurações da Escola"
        subtitle="Gerencie as informações e aparência da escola"
        helpContent={{
          what: 'A tela de Configurações controla as informações globais da escola exibidas no sistema e nos formulários públicos: nome, texto de boas-vindas, imagem da landing page, datas do semestre e redes sociais.',
          actions: [
            'Atualizar o nome oficial da escola (aparece na landing page e nos formulários)',
            'Personalizar o texto e a imagem de boas-vindas da landing page pública',
            'Definir as datas de início e fim do semestre atual',
            'Configurar links de WhatsApp e Instagram exibidos publicamente',
          ],
          tips: [
            'O nome da escola configurado aqui é exibido em todas as telas do sistema para os usuários logados.',
            'A imagem de boas-vindas aparece na hero section da landing page — use uma imagem de boa qualidade (mínimo 1200px de largura).',
            'Atualize as datas do semestre no início de cada período para manter o sistema alinhado com o calendário escolar.',
          ],
          flow: 'Configure aqui antes de lançar o sistema → Revise no início de cada semestre → Qualquer alteração reflete imediatamente nas telas públicas.',
        }}
      />
      <Paper sx={{ p: { xs: 3, md: 4 }, maxWidth: 700 }}>
        <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
          {mutation.isError && <Alert severity="error">Erro ao salvar. Tente novamente.</Alert>}

          <Typography variant="subtitle1" fontWeight={600} color="primary">Informações Gerais</Typography>
          <TextField label="Nome da escola *" fullWidth error={!!errors.school_name} helperText={errors.school_name?.message} {...register('school_name')} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Início do semestre" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} {...register('semester_start')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Fim do semestre" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} {...register('semester_end')} />
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
                placeholder="@fluentflow"
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
            name="welcome_image"
            control={control}
            render={() => (
              <Box>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Imagem de boas-vindas
                </Typography>
                {welcomeImage ? (
                  <Stack spacing={1}>
                    <Box
                      component="img"
                      src={welcomeImage}
                      alt="Imagem de boas-vindas"
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
                        onClick={() => setValue('welcome_image', '', { shouldDirty: true })}
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

    </Box>
  )
}
