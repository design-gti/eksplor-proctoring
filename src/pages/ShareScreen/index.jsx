import { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Button, Alert, Stack,
  Chip, Avatar, CircularProgress, Divider, Grid
} from '@mui/material'
import {
  ScreenShare, StopScreenShare, PhotoCamera, CheckCircle,
  Warning, FiberManualRecord, ArrowForward, ArrowBack, Info
} from '@mui/icons-material'
import { alpha } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import useScreenRecording from '../../hooks/useScreenRecording'

const STEPS = [
  {
    id: 'recording',
    icon: <ScreenShare />,
    title: 'Share Screen Recording',
    subtitle: 'Layar Anda akan direkam selama assessment berlangsung',
    desc: 'Klik tombol di bawah, lalu pilih "Seluruh Layar" (Entire Screen) pada dialog yang muncul. Jangan pilih tab atau jendela tertentu.',
    color: 'primary',
  },
  {
    id: 'capture',
    icon: <PhotoCamera />,
    title: 'Share Screen Capture',
    subtitle: 'Screenshot otomatis diambil secara berkala',
    desc: 'Sistem akan mengambil screenshot layar Anda setiap 30 detik sebagai bukti assessment. Screenshot disimpan secara aman.',
    color: 'secondary',
  },
]

export default function ShareScreen() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)

  const {
    status, errorMessage, isRecording, captureCount, captures,
    videoRef, requestScreenShare, startRecording, startCapture, stopAll,
  } = useScreenRecording({ captureIntervalSec: 30 })

  const isScreenActive = status === 'active'
  const canProceed = isScreenActive && captureCount > 0

  // Auto-start capture once recording is active and user proceeds to step 2
  useEffect(() => {
    if (activeStep === 1 && isScreenActive && captureCount === 0) {
      startCapture()
    }
  }, [activeStep, isScreenActive])

  const bgGradient = `
    radial-gradient(circle at top right, ${alpha(theme.palette.primary.light, 0.2)} 0%, transparent 60%),
    radial-gradient(circle at bottom left, ${alpha(theme.palette.secondary.light, 0.2)} 0%, transparent 60%)
  `

  const cardStyle = {
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(12px)',
    borderRadius: theme.spacing(3),
    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
  }

  return (
    <Box sx={{ minHeight: '100vh', background: bgGradient, bgcolor: 'background.default', py: 4, px: 2 }}>
      <Box sx={{ maxWidth: 'md', mx: 'auto' }}>

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight={700} sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Persiapan Proctoring
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Aktifkan screen sharing dan capture sebelum memulai soal
          </Typography>
        </Box>

        {/* Step indicator */}
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
          {STEPS.map((s, i) => (
            <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{
                width: 32, height: 32,
                bgcolor: i < activeStep ? 'success.main' : i === activeStep ? `${s.color}.main` : 'grey.300',
                transition: 'all 0.3s',
              }}>
                {i < activeStep ? <CheckCircle sx={{ fontSize: 18 }} /> : <Typography variant="caption" fontWeight={700}>{i + 1}</Typography>}
              </Avatar>
              <Typography variant="body2" fontWeight={i === activeStep ? 700 : 400} color={i === activeStep ? 'text.primary' : 'text.secondary'}>
                {s.title}
              </Typography>
              {i < STEPS.length - 1 && <Box sx={{ width: 32, height: 2, bgcolor: i < activeStep ? 'success.main' : 'grey.300', borderRadius: 1 }} />}
            </Box>
          ))}
        </Stack>

        {/* ── Step 0: Screen Recording ────────────────────────────────── */}
        {activeStep === 0 && (
          <Card sx={cardStyle}>
            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 48, height: 48 }}>
                  <ScreenShare />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Share Screen Recording</Typography>
                  <Typography variant="body2" color="text.secondary">Layar Anda akan direkam selama assessment berlangsung</Typography>
                </Box>
              </Box>

              <Alert severity="info" icon={<Info />} sx={{ mb: 3, borderRadius: 2 }}>
                Saat dialog muncul, pilih <strong>"Seluruh Layar" (Entire Screen)</strong> — bukan tab atau jendela tertentu.
              </Alert>

              {/* Preview */}
              <Box sx={{
                width: '100%', aspectRatio: '16/9', maxHeight: 280, bgcolor: '#0d0d0d',
                borderRadius: 2, overflow: 'hidden', mb: 3, position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid', borderColor: isScreenActive ? 'success.main' : 'grey.300',
                transition: 'border-color 0.3s',
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: isScreenActive ? 'block' : 'none' }}
                />
                {!isScreenActive && (
                  <Box sx={{ textAlign: 'center' }}>
                    <ScreenShare sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
                    <Typography variant="body2" color="grey.500">Preview layar akan muncul di sini</Typography>
                  </Box>
                )}
                {isScreenActive && (
                  <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 0.5,
                    bgcolor: 'rgba(0,0,0,0.6)', borderRadius: 1, px: 1, py: 0.5 }}>
                    <FiberManualRecord sx={{ color: '#ef4444', fontSize: 12, animation: 'pulse 1.5s infinite' }} />
                    <Typography variant="caption" color="white" fontWeight={700}>LIVE</Typography>
                  </Box>
                )}
              </Box>

              {/* Status */}
              {status === 'idle' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button variant="contained" size="large" startIcon={<ScreenShare />}
                    onClick={startRecording} sx={{ borderRadius: 2, py: 1.5 }}>
                    Mulai Screen Recording
                  </Button>
                </Box>
              )}
              {status === 'requesting' && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">Menunggu izin screen sharing...</Typography>
                </Stack>
              )}
              {status === 'active' && (
                <Stack spacing={2}>
                  <Chip icon={<CheckCircle />} label="Screen sharing aktif" color="success" sx={{ alignSelf: 'flex-start', fontWeight: 700 }} />
                  <Stack direction="row" spacing={2}>
                    <Button variant="contained" endIcon={<ArrowForward />}
                      onClick={() => setActiveStep(1)} sx={{ borderRadius: 2 }}>
                      Lanjut ke Screen Capture
                    </Button>
                    <Button variant="outlined" color="error" size="small" startIcon={<StopScreenShare />} onClick={stopAll}>
                      Hentikan
                    </Button>
                  </Stack>
                </Stack>
              )}
              {status === 'stopped' && (
                <Stack spacing={1}>
                  <Alert severity="warning">Screen sharing dihentikan. Harap aktifkan kembali.</Alert>
                  <Button variant="contained" startIcon={<ScreenShare />} onClick={startRecording} sx={{ alignSelf: 'flex-start', borderRadius: 2 }}>
                    Aktifkan Ulang
                  </Button>
                </Stack>
              )}
              {status === 'error' && (
                <Stack spacing={1}>
                  <Alert severity="error">{errorMessage}</Alert>
                  <Button variant="outlined" startIcon={<ScreenShare />} onClick={startRecording} sx={{ alignSelf: 'flex-start', borderRadius: 2 }}>
                    Coba Lagi
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Step 1: Screen Capture ──────────────────────────────────── */}
        {activeStep === 1 && (
          <Card sx={cardStyle}>
            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', width: 48, height: 48 }}>
                  <PhotoCamera />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Share Screen Capture</Typography>
                  <Typography variant="body2" color="text.secondary">Screenshot otomatis setiap 30 detik sebagai bukti</Typography>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  <Chip
                    icon={captureCount > 0 ? <CheckCircle /> : <CircularProgress size={14} />}
                    label={captureCount > 0 ? `${captureCount} screenshot` : 'Mengambil screenshot...'}
                    color={captureCount > 0 ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
              </Box>

              {/* Screen share still active indicator */}
              {isScreenActive
                ? <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} icon={<FiberManualRecord sx={{ color: '#ef4444' }} />}>
                    Screen recording aktif — screenshot diambil otomatis setiap 30 detik
                  </Alert>
                : <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    Screen sharing berhenti! <Button size="small" onClick={() => { setActiveStep(0); startRecording() }}>Aktifkan ulang</Button>
                  </Alert>
              }

              {/* Capture gallery */}
              {captures.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Screenshot Terbaru</Typography>
                  <Grid container spacing={1}>
                    {[...captures].reverse().slice(0, 6).map((cap, i) => (
                      <Grid key={i} size={{ xs: 6, sm: 4 }}>
                        <Box sx={{ position: 'relative', borderRadius: 1.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                          <img src={cap.dataUrl} alt={`capture ${i}`} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0,0,0,0.6)', px: 1, py: 0.5 }}>
                            <Typography variant="caption" color="white" sx={{ fontSize: 9 }}>
                              {new Date(cap.timestamp).toLocaleTimeString('id-ID')}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {captures.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress size={32} sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">Screenshot pertama sedang diambil...</Typography>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              <Stack direction="row" spacing={2} justifyContent="space-between">
                <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => setActiveStep(0)}>
                  Kembali
                </Button>
                <Button
                  variant="contained" size="large" endIcon={<ArrowForward />}
                  disabled={!canProceed}
                  onClick={() => navigate('/soal')}
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  Mulai Soal Assessment
                </Button>
              </Stack>
              {!canProceed && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Menunggu screenshot pertama sebelum memulai soal...
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        {/* Back to assessment */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button variant="text" startIcon={<ArrowBack />} color="inherit" onClick={() => { stopAll(); navigate('/assessment') }}>
            Kembali ke Aturan Assessment
          </Button>
        </Box>
      </Box>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </Box>
  )
}
