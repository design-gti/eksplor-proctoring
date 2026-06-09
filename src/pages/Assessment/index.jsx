import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box, Card, CardContent, Typography, Button, Avatar, Alert, Chip,
  CircularProgress, Stack, Fab, LinearProgress, TextField, Tooltip,
  IconButton
} from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  Face, Fullscreen, FullscreenExit, Help, Quiz, Security,
  CheckCircle, Cancel, Logout, Warning, PhoneAndroid, Person,
  ScreenShare, StopScreenShare, FiberManualRecord, PhotoCamera, Info,
  Videocam, VideocamOff, KeyboardArrowDown, KeyboardArrowUp
} from '@mui/icons-material'
import { alpha } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import useFullscreen from '../../hooks/useFullscreen'
import useTabSwitch from '../../hooks/useTabSwitch'
import useMultipleMonitor from '../../hooks/useMultipleMonitor'
import useFaceDetection from '../../hooks/useFaceDetection'
import usePhoneDetection from '../../hooks/usePhoneDetection'
import useSecondaryCamera from '../../hooks/useSecondaryCamera'
import useScreenRecording from '../../hooks/useScreenRecording'

const keyframes = `
  @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
  @keyframes attention { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.1);opacity:0.8} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
`

// Step enum untuk flow sebelum mulai
const STEP_RULES = 'rules'       // halaman aturan + kamera status
const STEP_SCREEN = 'screen'     // share screen + recording
const STEP_ACTIVE = 'active'     // assessment sedang berjalan

export default function Assessment() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [step, setStep] = useState(STEP_RULES)
  const [answers, setAnswers] = useState({ q1: '', q2: '' })
  const [captureCount, setCaptureCount] = useState(0)
  const captureIntervalRef = useRef(null)
  const canvasRef = useRef(document.createElement('canvas'))

  // Timer
  const [timeLeft, setTimeLeft] = useState(60 * 60)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef(null)

  // Proctoring hooks
  const { isFullscreen, requestFullscreen, exitFullscreen } = useFullscreen()
  const { tabSwitchCount } = useTabSwitch()
  const { hasMultipleMonitors } = useMultipleMonitor()
  const {
    faceDetected, faceCount, hasMultipleFaces, loading: faceLoading,
    setFaceDetected, setFaceCount, setHasMultipleFaces, setLoading: setFaceLoading,
    videoRef: laptopVideoRef, startCamera, stopCamera,
  } = useFaceDetection({ enabled: true })
  const { phoneDetected } = usePhoneDetection({ enabled: true })

  // Screen recording
  const {
    status: screenStatus, errorMessage: screenError, isRecording,
    videoRef: screenVideoRef, startRecording, stopAll: stopScreen,
  } = useScreenRecording({ captureIntervalSec: 30 })

  const screenActive = screenStatus === 'active'

  // Secondary camera
  const {
    connectionStatus: hpStatus, remoteVideoRef: hpVideoRef,
    simulateConnect: hpSimulateConnect, simulateDisconnect: hpSimulateDisconnect,
  } = useSecondaryCamera({ enabled: true })
  const hpConnected = hpStatus === 'connected'

  // Camera monitor panel state
  const [camPanelOpen, setCamPanelOpen] = useState(true)

  // ── Start laptop camera on mount, stop on unmount ────────────────────────
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (step === STEP_ACTIVE) {
      const total = 60 * 60
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); return 0 }
          setProgress(((total - t + 1) / total) * 100)
          return t - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [step])

  // ── Periodic screen capture during active assessment ───────────────────────
  useEffect(() => {
    if (step !== STEP_ACTIVE || !screenActive) return
    const doCapture = () => {
      const video = screenVideoRef.current
      if (!video || video.readyState < 2) return
      const canvas = canvasRef.current
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720
      canvas.getContext('2d').drawImage(video, 0, 0)
      setCaptureCount(n => n + 1)
      // Production: upload canvas.toDataURL('image/jpeg', 0.7) to backend
    }
    setTimeout(doCapture, 1000)
    captureIntervalRef.current = setInterval(doCapture, 30_000)
    return () => clearInterval(captureIntervalRef.current)
  }, [step, screenActive])

  // ── Prevent refresh during assessment ─────────────────────────────────────
  useEffect(() => {
    if (step !== STEP_ACTIVE) return
    const handler = e => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [step])

  function formatTime(s) {
    const m = Math.floor(s / 60)
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  // Demo mode: always allow proceeding (validation logic dikerjakan engineer)
  const canProceedToScreen = true
  const canStartAssessment = true

  function handleExit() {
    const ok = window.confirm('Keluar dari assessment? Semua progres akan hilang.')
    if (ok) {
      exitFullscreen()
      clearInterval(timerRef.current)
      clearInterval(captureIntervalRef.current)
      stopScreen()
      setStep(STEP_RULES)
    }
  }

  // Violations (shown as toasts in active state)
  const violations = [
    !isFullscreen && { key: 'fs', severity: 'error', message: 'Mode Fullscreen tidak aktif!' },
    tabSwitchCount > 0 && { key: 'tab', severity: 'warning', message: `Perpindahan Tab Terdeteksi (${tabSwitchCount}x)` },
    hasMultipleMonitors && { key: 'mm', severity: 'error', message: 'Multiple Monitor Terdeteksi!' },
    !faceDetected && { key: 'face', severity: 'error', message: 'Wajah Tidak Terdeteksi' },
    hasMultipleFaces && { key: 'mf', severity: 'error', message: `Terdeteksi ${faceCount} wajah. Hanya boleh ada 1 wajah.` },
    phoneDetected && { key: 'phone', severity: 'error', message: 'Ponsel Terdeteksi!' },
    !screenActive && { key: 'screen', severity: 'error', message: 'Screen Recording Berhenti!' },
  ].filter(Boolean)

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
      <style>{keyframes}</style>

      <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>

        {/* ══ STEP 1: RULES + CAMERA STATUS ══════════════════════════════════ */}
        {step === STEP_RULES && (
          <Card sx={{ ...cardStyle, p: { xs: 2, md: 4 } }}>
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight={700} sx={{
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  Assessment Online
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 480, mx: 'auto' }}>
                  Selamat datang di assessment online. Sebelum memulai, pastikan Anda memahami aturan-aturan berikut:
                </Typography>
              </Box>

              <Grid container spacing={3} sx={{ mb: 4 }} alignItems="flex-start">
                {/* Left: Rules */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'primary.main', px: 2.5, py: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
                        <Security sx={{ fontSize: 18, color: 'white' }} />
                      </Avatar>
                      <Typography fontWeight={700} color="white">Aturan Assessment</Typography>
                    </Box>
                    {[
                      { icon: <Fullscreen />, title: 'Mode Fullscreen Wajib', desc: 'Assessment harus dikerjakan dalam mode fullscreen' },
                      { icon: <Quiz />, title: 'Dilarang Berpindah Tab', desc: 'Anda tidak diperbolehkan berpindah tab saat assessment berlangsung' },
                      { icon: <ScreenShare />, title: 'Share Screen Wajib', desc: 'Layar Anda akan direkam selama assessment berlangsung' },
                      { icon: <Person />, title: 'Dilarang Menggunakan Multiple Monitor', desc: 'Hanya boleh menggunakan satu monitor' },
                      { icon: <Face />, title: 'Wajah Harus Terdeteksi', desc: 'Wajah Anda harus terdeteksi dan hanya boleh ada satu wajah' },
                      { icon: <PhoneAndroid />, title: 'Dilarang Menggunakan Ponsel', desc: 'Ponsel dan perangkat elektronik lainnya tidak boleh terdeteksi kamera' },
                      { icon: <Security />, title: 'Dilarang Refresh atau Tutup Halaman', desc: 'Jangan me-refresh atau menutup halaman ini selama assessment berlangsung' },
                    ].map((rule, i, arr) => (
                      <Box key={i} sx={{
                        display: 'flex', gap: 2, px: 2.5, py: 2,
                        borderBottom: i < arr.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.07)}` : 'none',
                      }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                          {rule.icon}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{rule.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{rule.desc}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Card>
                </Grid>

                {/* Right: Camera cards stacked */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={2}>

                    {/* Status Kamera Laptop */}
                    <Card variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'warning.main', px: 2.5, py: 1.5 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(255,255,255,0.2)' }}>
                          <Face sx={{ fontSize: 16, color: 'white' }} />
                        </Avatar>
                        <Typography fontWeight={700} color="white">Kamera Laptop</Typography>
                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#fff', animation: 'blink 2s infinite' }} />
                          <Typography variant="caption" color="white" fontWeight={700} sx={{ fontSize: 10 }}>LIVE</Typography>
                        </Box>
                      </Box>

                      {/* Live webcam feed */}
                      <Box sx={{ position: 'relative', bgcolor: '#111', aspectRatio: '4/3', overflow: 'hidden' }}>
                        <video
                          ref={laptopVideoRef}
                          autoPlay muted playsInline
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'scaleX(-1)' }}
                        />
                        {/* Face detection status badge */}
                        <Box sx={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
                          {faceLoading ? (
                            <Chip
                              icon={<CircularProgress size={12} sx={{ color: 'white !important' }} />}
                              label="Mendeteksi wajah..."
                              size="small"
                              sx={{ bgcolor: 'rgba(0,0,0,0.65)', color: 'white', fontWeight: 600, fontSize: 10, height: 22, backdropFilter: 'blur(4px)' }}
                            />
                          ) : faceDetected && !hasMultipleFaces ? (
                            <Chip
                              icon={<CheckCircle sx={{ fontSize: '12px !important', color: '#22c55e !important' }} />}
                              label="1 wajah terdeteksi"
                              size="small"
                              sx={{ bgcolor: 'rgba(0,0,0,0.65)', color: '#22c55e', fontWeight: 700, fontSize: 10, height: 22, backdropFilter: 'blur(4px)' }}
                            />
                          ) : hasMultipleFaces ? (
                            <Chip
                              icon={<Warning sx={{ fontSize: '12px !important', color: '#f59e0b !important' }} />}
                              label={`${faceCount} wajah terdeteksi`}
                              size="small"
                              sx={{ bgcolor: 'rgba(0,0,0,0.65)', color: '#f59e0b', fontWeight: 700, fontSize: 10, height: 22, backdropFilter: 'blur(4px)' }}
                            />
                          ) : (
                            <Chip
                              icon={<Cancel sx={{ fontSize: '12px !important', color: '#ef4444 !important' }} />}
                              label="Wajah tidak terdeteksi"
                              size="small"
                              sx={{ bgcolor: 'rgba(0,0,0,0.65)', color: '#ef4444', fontWeight: 700, fontSize: 10, height: 22, backdropFilter: 'blur(4px)' }}
                            />
                          )}
                        </Box>
                      </Box>

                      {phoneDetected && (
                        <Alert severity="error" icon={<PhoneAndroid />} sx={{ borderRadius: 0, py: 0.75 }}>
                          <Typography variant="caption" fontWeight={600}>Ponsel Terdeteksi! Harap jauhkan dari area ujian.</Typography>
                        </Alert>
                      )}
                    </Card>

                    {/* Kamera HP */}
                    <Card variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'primary.main', px: 2.5, py: 1.5 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(255,255,255,0.2)' }}>
                          <PhoneAndroid sx={{ fontSize: 16, color: 'white' }} />
                        </Avatar>
                        <Typography fontWeight={700} color="white">Kamera HP</Typography>
                        <Box sx={{ ml: 'auto' }}>
                          <Chip
                            size="small"
                            label={hpConnected ? 'Terhubung' : 'Tidak Terhubung'}
                            sx={{
                              height: 20, fontSize: 10, fontWeight: 700,
                              bgcolor: hpConnected ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.15)',
                              color: hpConnected ? '#86efac' : 'rgba(255,255,255,0.8)',
                              border: 'none',
                            }}
                          />
                        </Box>
                      </Box>

                      <Box sx={{ position: 'relative', bgcolor: '#0d1117', aspectRatio: '4/3', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {hpConnected ? (
                          <>
                            <video
                              ref={hpVideoRef}
                              autoPlay muted playsInline
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                            <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 0.5,
                              bgcolor: 'rgba(0,0,0,0.6)', borderRadius: 1, px: 1, py: 0.4 }}>
                              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e', animation: 'blink 1.5s infinite' }} />
                              <Typography sx={{ fontSize: 9, color: '#22c55e', fontWeight: 700 }}>LIVE</Typography>
                            </Box>
                          </>
                        ) : (
                          <Box sx={{ textAlign: 'center', px: 3, py: 2 }}>
                            <Box sx={{
                              width: 52, height: 52, borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.15)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5,
                            }}>
                              <PhoneAndroid sx={{ fontSize: 26, color: 'rgba(255,255,255,0.25)' }} />
                            </Box>
                            <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', mb: 1.5, lineHeight: 1.4 }}>
                              Hubungkan HP sebagai<br />kamera kedua proctoring
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={hpSimulateConnect}
                              sx={{
                                fontSize: 11, py: 0.5, px: 2,
                                color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)',
                                '&:hover': { borderColor: 'rgba(255,255,255,0.5)', bgcolor: 'rgba(255,255,255,0.05)' },
                              }}
                            >
                              Simulasi Hubungkan
                            </Button>
                          </Box>
                        )}
                      </Box>

                      {hpConnected && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, py: 1, bgcolor: alpha(theme.palette.success.main, 0.06) }}>
                          <Button size="small" color="error" onClick={hpSimulateDisconnect} sx={{ fontSize: 11 }}>
                            Putuskan
                          </Button>
                        </Box>
                      )}
                    </Card>

                  </Stack>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Stack direction="row" spacing={2}>
                  <Button variant="outlined" color="secondary" size="large"
                    startIcon={isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                    onClick={isFullscreen ? exitFullscreen : requestFullscreen}
                    sx={{ py: 1.5, px: 4, transition: 'all 0.2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 } }}>
                    {isFullscreen ? 'Keluar Fullscreen' : 'Aktifkan Fullscreen'}
                  </Button>
                  <Button variant="contained" color="primary" size="large"
                    startIcon={<ScreenShare />}
                    disabled={!canProceedToScreen}
                    onClick={() => setStep(STEP_SCREEN)}
                    sx={{ py: 1.5, px: 6, transition: 'all 0.2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 }, '&.Mui-disabled': { bgcolor: 'grey.400' } }}>
                    Mulai Assessment
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* ══ STEP 2: SHARE SCREEN + RECORDING ═══════════════════════════════ */}
        {step === STEP_SCREEN && (
          <Card sx={{ ...cardStyle, maxWidth: 720, mx: 'auto', p: { xs: 2, md: 4 } }}>
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar sx={{ mx: 'auto', mb: 2, width: 56, height: 56, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                  <ScreenShare sx={{ fontSize: 28 }} />
                </Avatar>
                <Typography variant="h5" fontWeight={700} gutterBottom>Share Screen Recording</Typography>
                <Typography variant="body2" color="text.secondary">
                  Layar Anda akan direkam selama assessment berlangsung sebagai bagian dari proses pengawasan.
                </Typography>
              </Box>

              <Alert severity="info" icon={<Info />} sx={{ mb: 3, borderRadius: 2 }}>
                Saat dialog muncul, pilih <strong>"Seluruh Layar" (Entire Screen)</strong> — bukan tab atau jendela tertentu. Pastikan seluruh layar Anda dibagikan.
              </Alert>

              {/* Screen preview */}
              <Box sx={{
                width: '100%', aspectRatio: '16/9', maxHeight: 260, bgcolor: '#0d0d0d',
                borderRadius: 2, overflow: 'hidden', mb: 3, position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid', borderColor: screenActive ? 'success.main' : 'grey.600',
                transition: 'border-color 0.3s',
              }}>
                <video ref={screenVideoRef} autoPlay muted playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: screenActive ? 'block' : 'none' }} />
                {!screenActive && (
                  <Box sx={{ textAlign: 'center' }}>
                    <ScreenShare sx={{ fontSize: 48, color: 'grey.600', mb: 1 }} />
                    <Typography variant="body2" color="grey.500">Preview layar akan muncul setelah share screen diaktifkan</Typography>
                  </Box>
                )}
                {screenActive && (
                  <Box sx={{
                    position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 0.5,
                    bgcolor: 'rgba(0,0,0,0.7)', borderRadius: 1, px: 1, py: 0.5
                  }}>
                    <FiberManualRecord sx={{ color: '#ef4444', fontSize: 12, animation: 'blink 1.5s infinite' }} />
                    <Typography variant="caption" color="white" fontWeight={700} sx={{ fontSize: 11 }}>REC</Typography>
                  </Box>
                )}
              </Box>

              {/* Status & actions */}
              {screenStatus === 'idle' && (
                <Stack spacing={2} alignItems="flex-start">
                  <Button variant="contained" size="large" startIcon={<ScreenShare />}
                    onClick={startRecording} sx={{ borderRadius: 2, py: 1.5, px: 4 }}>
                    Bagikan Layar & Mulai Recording
                  </Button>
                </Stack>
              )}

              {screenStatus === 'requesting' && (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CircularProgress size={22} />
                  <Typography variant="body2" color="text.secondary">Menunggu izin screen sharing...</Typography>
                </Stack>
              )}

              {screenActive && (
                <Stack spacing={2}>
                  <Chip icon={<CheckCircle />} label="Screen sharing aktif — Recording berjalan" color="success" sx={{ alignSelf: 'flex-start', fontWeight: 700 }} />
                  <Stack direction="row" spacing={2}>
                    <Button variant="contained" color="primary" size="large" startIcon={<Quiz />}
                      onClick={() => setStep(STEP_ACTIVE)}
                      sx={{ borderRadius: 2, py: 1.5, px: 4, fontWeight: 700 }}>
                      Lanjutkan ke Soal
                    </Button>
                    <Button variant="outlined" color="error" size="small" startIcon={<StopScreenShare />} onClick={stopScreen}>
                      Batalkan
                    </Button>
                  </Stack>
                </Stack>
              )}

              {screenStatus === 'stopped' && (
                <Stack spacing={1}>
                  <Alert severity="warning">Screen sharing dihentikan. Aktifkan kembali untuk melanjutkan.</Alert>
                  <Button variant="contained" startIcon={<ScreenShare />} onClick={startRecording} sx={{ alignSelf: 'flex-start', borderRadius: 2 }}>
                    Aktifkan Ulang
                  </Button>
                </Stack>
              )}

              {screenStatus === 'error' && (
                <Stack spacing={1}>
                  <Alert severity="error">{screenError || 'Gagal memulai screen sharing.'}</Alert>
                  <Button variant="outlined" startIcon={<ScreenShare />} onClick={startRecording} sx={{ alignSelf: 'flex-start' }}>
                    Coba Lagi
                  </Button>
                </Stack>
              )}

              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button variant="text" size="small" color="secondary" onClick={() => { stopScreen(); setStep(STEP_RULES) }}>
                  ← Kembali ke Aturan
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* ══ STEP 3: ACTIVE ASSESSMENT ═══════════════════════════════════════ */}
        {step === STEP_ACTIVE && (
          <Stack spacing={3}>
            {/* Header bar */}
            <Card sx={{ ...cardStyle, borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}><Person /></Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Waktu Tersisa</Typography>
                      <Typography variant="h5" fontWeight={700} color={timeLeft < 300 ? 'error.main' : 'text.primary'}>
                        {formatTime(timeLeft)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* REC indicator */}
                  {screenActive && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: alpha('#ef4444', 0.1), borderRadius: 2, px: 2, py: 1, border: '1px solid', borderColor: alpha('#ef4444', 0.3) }}>
                      <FiberManualRecord sx={{ color: '#ef4444', fontSize: 14, animation: 'blink 1.5s infinite' }} />
                      <Typography variant="caption" fontWeight={700} color="error.main">RECORDING</Typography>
                      {captureCount > 0 && (
                        <Chip label={`${captureCount} screenshot`} size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                      )}
                    </Box>
                  )}

                  <Box sx={{ textAlign: 'right', minWidth: 180 }}>
                    <Typography variant="caption" color="text.secondary">Progress Assessment</Typography>
                    <Typography variant="body2" fontWeight={600}>{Math.round(progress)}%</Typography>
                    <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4, mt: 0.5 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Monitoring status */}
            <Card sx={{ ...cardStyle, borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Security color="primary" />
                  <Typography variant="h6" fontWeight={700}>Status Pengawasan</Typography>
                </Box>
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  {[
                    { label: isFullscreen ? 'Mode Fullscreen Aktif' : 'Mode Fullscreen Tidak Aktif', ok: isFullscreen, icon: <Fullscreen /> },
                    { label: tabSwitchCount === 0 ? 'Tidak Ada Perpindahan Tab' : `Perpindahan Tab (${tabSwitchCount}x)`, ok: tabSwitchCount === 0, icon: <Quiz /> },
                    { label: screenActive ? 'Screen Recording Aktif' : 'Screen Recording Berhenti', ok: screenActive, icon: <ScreenShare /> },
                    { label: !hasMultipleMonitors ? 'Hanya Satu Monitor' : 'Multiple Monitor Terdeteksi', ok: !hasMultipleMonitors, icon: <Person /> },
                    { label: faceDetected && !hasMultipleFaces ? 'Satu Wajah Terdeteksi' : hasMultipleFaces ? `Terdeteksi ${faceCount} Wajah` : 'Wajah Tidak Terdeteksi', ok: faceDetected && !hasMultipleFaces, icon: <Face /> },
                    { label: !phoneDetected ? 'Tidak Ada Ponsel' : 'Ponsel Terdeteksi', ok: !phoneDetected, icon: <PhoneAndroid /> },
                    { label: hpConnected ? 'Kamera HP Aktif' : 'Kamera HP Tidak Terhubung', ok: hpConnected, icon: <PhotoCamera /> },
                  ].map((item, i) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                      <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5,
                        borderRadius: 4, border: '1px solid',
                        bgcolor: item.ok ? alpha(theme.palette.success.main, 0.12) : alpha(theme.palette.error.main, 0.12),
                        borderColor: item.ok ? alpha(theme.palette.success.main, 0.3) : alpha(theme.palette.error.main, 0.3),
                        color: item.ok ? 'success.main' : 'error.main',
                        transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' },
                      }}>
                        <Box sx={{ color: 'inherit', display: 'flex' }}>{item.icon}</Box>
                        <Typography variant="caption" fontWeight={600} sx={{ flex: 1 }}>{item.label}</Typography>
                        {item.ok ? <CheckCircle sx={{ fontSize: 16 }} /> : <Cancel sx={{ fontSize: 16 }} />}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <Button variant="outlined" color="secondary" size="small" startIcon={<Logout />} onClick={handleExit}>
                  Keluar Assessment
                </Button>
              </CardContent>
            </Card>

            {/* Questions */}
            <Card sx={{ ...cardStyle, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: '24px 24px 0 0' }}>
                <Quiz color="primary" />
                <Typography variant="h6" fontWeight={700}>Soal Assessment</Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={4}>
                  {[
                    { key: 'q1', q: 'Jelaskan perbedaan antara penerapan teknik Deep Learning dan Machine Learning klasik dalam konteks Computer Vision. Berikan contoh kasus penggunaan yang sesuai untuk masing-masing pendekatan.' },
                    { key: 'q2', q: 'Bandingkan dan kontraskan penggunaan arsitektur CNN dan Transformer dalam aplikasi pengenalan wajah. Berikan analisis tentang kelebihan dan kekurangan masing-masing pendekatan dalam konteks ini.' },
                  ].map((soal, i) => (
                    <Box key={soal.key}>
                      <Typography variant="h6" fontWeight={700} gutterBottom>Soal {i + 1}</Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>{soal.q}</Typography>
                      <TextField multiline rows={6} fullWidth variant="outlined" placeholder="Tuliskan jawaban Anda di sini..."
                        value={answers[soal.key]}
                        onChange={e => setAnswers(a => ({ ...a, [soal.key]: e.target.value }))}
                        sx={{ bgcolor: 'white' }} />
                    </Box>
                  ))}
                </Stack>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" color="primary" size="large" sx={{ borderRadius: 2, py: 1, px: 4, fontWeight: 700 }}>
                    Selesai & Kirim Jawaban
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        )}
      </Box>

      {/* ── Camera Monitor — minimalist floating thumbnails ─────────────────── */}
      {step === STEP_ACTIVE && (
        <Box sx={{ position: 'fixed', bottom: 92, right: 24, zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75 }}>

          {/* Toggle pill */}
          <Tooltip title={camPanelOpen ? 'Sembunyikan kamera' : 'Tampilkan kamera'} placement="left">
            <Box
              onClick={() => setCamPanelOpen(o => !o)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer',
                bgcolor: 'rgba(15,20,30,0.75)', backdropFilter: 'blur(8px)',
                borderRadius: 10, px: 1.25, py: 0.5,
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 0.8 },
              }}
            >
              <Videocam sx={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }} />
              <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: 0.3 }}>
                Kamera
              </Typography>
              {camPanelOpen
                ? <KeyboardArrowDown sx={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }} />
                : <KeyboardArrowUp sx={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }} />}
            </Box>
          </Tooltip>

          {/* Two thumbnails side by side */}
          {camPanelOpen && (
            <Box sx={{ display: 'flex', gap: 1 }}>

              {/* Laptop thumbnail */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                <Box sx={{
                  position: 'relative', width: 108, borderRadius: 1.5, overflow: 'hidden',
                  aspectRatio: '4/3', bgcolor: '#111',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  border: `1px solid ${faceDetected && !hasMultipleFaces ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.35)'}`,
                  transition: 'border-color 0.3s',
                }}>
                  <video ref={laptopVideoRef} autoPlay muted playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'scaleX(-1)' }} />
                  {/* Status dot top-right */}
                  <Box sx={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%',
                    bgcolor: faceDetected && !hasMultipleFaces ? '#22c55e' : '#ef4444',
                    boxShadow: `0 0 6px ${faceDetected && !hasMultipleFaces ? '#22c55e' : '#ef4444'}`,
                    animation: 'blink 2s infinite',
                  }} />
                </Box>
                {/* Label */}
                <Typography sx={{ fontSize: 9.5, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: 0.3 }}>
                  Laptop
                </Typography>
              </Box>

              {/* HP thumbnail */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                <Box sx={{
                  position: 'relative', width: 108, borderRadius: 1.5, overflow: 'hidden',
                  aspectRatio: '4/3', bgcolor: '#111',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  border: `1px solid ${hpConnected ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  transition: 'border-color 0.3s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {hpConnected
                    ? <video ref={hpVideoRef} autoPlay muted playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <Box sx={{ textAlign: 'center' }}>
                        <PhoneAndroid sx={{ fontSize: 22, color: 'rgba(255,255,255,0.15)' }} />
                      </Box>
                  }
                  {/* Status dot top-right */}
                  <Box sx={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%',
                    bgcolor: hpConnected ? '#22c55e' : 'rgba(255,255,255,0.2)',
                    boxShadow: hpConnected ? '0 0 6px #22c55e' : 'none',
                    animation: hpConnected ? 'blink 2s infinite' : 'none',
                  }} />
                  {/* Simulasi overlay — only for demo */}
                  {!hpConnected && (
                    <Box
                      onClick={hpSimulateConnect}
                      sx={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer',
                        bgcolor: 'rgba(0,0,0,0.5)',
                        '&:hover': { opacity: 1 },
                      }}
                    >
                      <Typography sx={{ fontSize: 9, color: 'white', fontWeight: 700, bgcolor: 'rgba(245,158,11,0.8)', borderRadius: 1, px: 0.75, py: 0.25 }}>
                        Simulasi
                      </Typography>
                    </Box>
                  )}
                  {hpConnected && (
                    <Box
                      onClick={hpSimulateDisconnect}
                      sx={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer',
                        bgcolor: 'rgba(0,0,0,0.45)',
                        '&:hover': { opacity: 1 },
                      }}
                    >
                      <Typography sx={{ fontSize: 9, color: 'white', fontWeight: 700, bgcolor: 'rgba(239,68,68,0.8)', borderRadius: 1, px: 0.75, py: 0.25 }}>
                        Putuskan
                      </Typography>
                    </Box>
                  )}
                </Box>
                {/* Label */}
                <Typography sx={{ fontSize: 9.5, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: 0.3 }}>
                  HP
                </Typography>
              </Box>

            </Box>
          )}
        </Box>
      )}

      {/* FAB Help */}
      <Fab size="medium" sx={{
        position: 'fixed', bottom: 32, right: 32,
        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        color: 'white',
      }}>
        <Help />
      </Fab>

      {/* Violation toasts — only during active assessment */}
      {step === STEP_ACTIVE && violations.length > 0 && (
        <Box sx={{ position: 'fixed', top: 80, right: 24, maxWidth: 380, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {violations.map(v => (
            <Alert key={v.key} severity={v.severity} variant="filled" icon={<Warning />}>
              {v.message}
            </Alert>
          ))}
        </Box>
      )}
    </Box>
  )
}
