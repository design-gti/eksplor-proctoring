import { useEffect, useState } from 'react'
import { Box, Card, CardContent, Typography, Button, Stack } from '@mui/material'
import { ArrowBack, FullscreenExit } from '@mui/icons-material'
import { alpha } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'

export default function Soal() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {})
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  function handleExit() {
    const confirmed = window.confirm('Apakah Anda yakin ingin keluar dari assessment?')
    if (confirmed) {
      document.exitFullscreen?.()
      navigate('/assessment')
    }
  }

  const bgGradient = `
    radial-gradient(circle at top right, ${alpha(theme.palette.primary.light, 0.2)} 0%, transparent 60%),
    radial-gradient(circle at bottom left, ${alpha(theme.palette.secondary.light, 0.2)} 0%, transparent 60%)
  `

  return (
    <Box sx={{ minHeight: '100vh', background: bgGradient, bgcolor: 'background.default', display: 'flex', justifyContent: 'center', py: 4, px: 2 }}>
      <Box sx={{ maxWidth: 'lg', width: '100%' }}>
        <Card sx={{
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
          borderRadius: theme.spacing(3), boxShadow: '0 10px 40px rgba(0,0,0,0.08)', p: { xs: 2, md: 4 }
        }}>
          <CardContent>
            <Typography variant="h4" fontWeight={700} sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 4
            }}>
              Soal Assessment
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Soal 1</Typography>
              <Typography variant="body1">
                Jelaskan perbedaan antara penerapan teknik Deep Learning dan Machine Learning klasik dalam konteks Computer Vision. Berikan contoh kasus penggunaan yang sesuai untuk masing-masing pendekatan.
              </Typography>
              <Typography variant="body2" fontStyle="italic" color="text.secondary" sx={{ mt: 2 }}>
                * Ini hanya contoh soal. Isikan konten soal assessment sesuai kebutuhan.
              </Typography>
            </Box>

            <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Button variant="outlined" color="secondary" startIcon={<ArrowBack />} onClick={() => navigate('/assessment')}>
                Kembali ke Instruksi
              </Button>
              <Button variant="outlined" color="error" startIcon={<FullscreenExit />} onClick={handleExit}>
                Keluar Assessment
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
