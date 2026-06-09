import { useState, useRef, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Button, Stepper, Step, StepLabel, StepContent,
  Stack, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem,
  FormControl, InputLabel, IconButton, Chip, LinearProgress, Alert, Tabs, Tab
} from '@mui/material'
import {
  Cameraswitch, Mic, Settings, PlayArrow, Stop, ArrowForward, CheckCircle,
  VolumeUp, ArrowBack, PhoneAndroid, QrCode2, LinkOff, Wifi
} from '@mui/icons-material'
import { QRCodeSVG } from 'qrcode.react'
import { alpha } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import useSecondaryCamera from '../../hooks/useSecondaryCamera'

function MicWaveform({ level }) {
  const bars = 20
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, height: 48 }}>
      {Array.from({ length: bars }, (_, i) => {
        const barLevel = Math.max(5, level * (0.5 + Math.random() * 0.5) * 100)
        const color = barLevel > 70 ? '#f44336' : barLevel > 40 ? '#ff9800' : '#4caf50'
        return (
          <Box key={i} sx={{
            width: 4, borderRadius: 2,
            height: `${Math.max(8, (barLevel / 100) * 48)}px`,
            bgcolor: color,
            transition: 'height 0.1s ease',
          }} />
        )
      })}
    </Box>
  )
}

export default function DeviceSetup() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)

  // Camera (laptop)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameras, setCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState('')
  const [cameraLabel, setCameraLabel] = useState('')
  const [cameraActive, setCameraActive] = useState(false)

  // Microphone
  const [mics, setMics] = useState([])
  const [selectedMic, setSelectedMic] = useState('')
  const [micLabel, setMicLabel] = useState('')
  const [micTesting, setMicTesting] = useState(false)
  const [micLevel, setMicLevel] = useState(0)
  const [micSilent, setMicSilent] = useState(false)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const animFrameRef = useRef(null)

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTab, setDialogTab] = useState(0)

  // Secondary camera (HP)
  const {
    qrUrl, connectionStatus, remoteVideoRef, errorMessage,
    startListening, disconnect, simulateConnect, simulateWaiting, simulateDisconnect,
  } = useSecondaryCamera({ enabled: true })

  useEffect(() => {
    loadDevices()
    return () => stopCamera()
  }, [])

  async function loadDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cams = devices.filter(d => d.kind === 'videoinput')
      const micsArr = devices.filter(d => d.kind === 'audioinput')
      setCameras(cams)
      setMics(micsArr)
      if (cams.length) { setSelectedCamera(cams[0].deviceId); setCameraLabel(cams[0].label || 'Camera 1') }
      if (micsArr.length) { setSelectedMic(micsArr[0].deviceId); setMicLabel(micsArr[0].label || 'Microphone 1') }
    } catch {}
  }

  async function startCamera(deviceId) {
    stopCamera()
    try {
      const constraints = { video: deviceId ? { deviceId: { exact: deviceId } } : true }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraActive(true)
    } catch {}
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  async function startMicTest() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true
      })
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      audioCtxRef.current = ctx
      analyserRef.current = analyser
      setMicTesting(true)
      const data = new Uint8Array(analyser.frequencyBinCount)
      function tick() {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length / 255
        setMicLevel(avg)
        setMicSilent(avg < 0.02)
        animFrameRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch {}
  }

  function stopMicTest() {
    cancelAnimationFrame(animFrameRef.current)
    audioCtxRef.current?.close()
    setMicTesting(false)
    setMicLevel(0)
    setMicSilent(false)
  }

  const bgGradient = `
    radial-gradient(circle at top right, ${alpha(theme.palette.primary.light, 0.2)} 0%, transparent 60%),
    radial-gradient(circle at bottom left, ${alpha(theme.palette.secondary.light, 0.2)} 0%, transparent 60%)
  `

  // ── Secondary camera step content ─────────────────────────────────────────
  function SecondaryCameraStep() {
    return (
      <Box>
        {/* Idle */}
        {connectionStatus === 'idle' && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <PhoneAndroid sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body1" fontWeight={600} gutterBottom>
              Gunakan HP sebagai Kamera Kedua
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 360, mx: 'auto' }}>
              HP akan merekam sudut pandang ruangan/meja belajar Anda sebagai pengawasan tambahan.
            </Typography>
            <Button variant="contained" startIcon={<QrCode2 />} onClick={startListening} sx={{ mb: 1 }}>
              Hubungkan Kamera HP
            </Button>
          </Box>
        )}

        {/* Waiting — show QR */}
        {connectionStatus === 'waiting' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, gap: 2 }}>
            <Chip icon={<Wifi />} label="Menunggu koneksi HP..." color="warning" />
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Scan QR code ini menggunakan HP Anda. HP akan membuka halaman kamera secara otomatis.
            </Typography>

            {qrUrl && (
              <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '2px solid', borderColor: 'warning.main' }}>
                <QRCodeSVG value={qrUrl} size={180} />
              </Box>
            )}

            <Typography variant="caption" color="text.disabled" textAlign="center" sx={{ maxWidth: 300, wordBreak: 'break-all' }}>
              {qrUrl}
            </Typography>

            <Alert severity="info" sx={{ maxWidth: 360 }}>
              Pastikan HP dan laptop terhubung ke jaringan yang sama (WiFi). Untuk jaringan berbeda, diperlukan konfigurasi HTTPS.
            </Alert>

            <Button variant="outlined" color="error" size="small" startIcon={<LinkOff />} onClick={disconnect}>
              Batalkan
            </Button>
          </Box>
        )}

        {/* Connected — show remote video preview */}
        {connectionStatus === 'connected' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, gap: 2 }}>
            <Chip icon={<CheckCircle />} label="HP Terhubung" color="success" />
            <Box sx={{
              width: '100%', maxWidth: 280, aspectRatio: '4/3',
              bgcolor: '#000', borderRadius: 2, overflow: 'hidden',
              border: '2px solid', borderColor: 'success.main',
            }}>
              <video
                ref={remoteVideoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Live preview kamera HP (kamera belakang)
            </Typography>
            <Button variant="outlined" color="error" size="small" startIcon={<LinkOff />} onClick={disconnect}>
              Putuskan Koneksi
            </Button>
          </Box>
        )}

        {/* Error */}
        {connectionStatus === 'error' && (
          <Box sx={{ py: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage || 'Gagal terhubung ke HP.'}
            </Alert>
            <Button variant="outlined" onClick={disconnect}>Coba Lagi</Button>
          </Box>
        )}

        {/* Demo/simulation buttons */}
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.disabled" display="block" gutterBottom>
            Demo (tanpa HP nyata):
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            <Button size="small" variant="outlined" color="warning" onClick={simulateWaiting}>
              Simulasi Menunggu
            </Button>
            <Button size="small" variant="outlined" color="success" onClick={simulateConnect}>
              Simulasi Terhubung
            </Button>
            <Button size="small" variant="outlined" color="error" onClick={simulateDisconnect}>
              Simulasi Terputus
            </Button>
          </Stack>
        </Box>

        {/* Step navigation */}
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => setActiveStep(1)}>
            Kembali
          </Button>
          <Button variant="outlined" color="secondary"
            onClick={() => { disconnect(); setActiveStep(3) }}>
            Lewati
          </Button>
          <Button variant="contained" endIcon={<ArrowForward />}
            onClick={() => setActiveStep(3)}>
            Lanjut
          </Button>
        </Stack>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', background: bgGradient, bgcolor: 'background.default', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', py: 5, px: 2 }}>
      <Card sx={{ maxWidth: 'md', width: '100%', borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)' }}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/my-devices')} sx={{ mb: 2 }} size="small">
            Kembali
          </Button>
          <Typography variant="h4" fontWeight={600} gutterBottom>Persiapan Perangkat</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Pastikan kamera dan mikrofon Anda berfungsi dengan baik sebelum memulai assessment
          </Typography>

          <Stepper activeStep={activeStep} orientation="vertical">

            {/* Step 0: Camera */}
            <Step>
              <StepLabel>Konfigurasi Kamera</StepLabel>
              <StepContent>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Pilih Perangkat</Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Button variant="contained" size="small" startIcon={<Cameraswitch />}
                    onClick={() => { startCamera(selectedCamera); setDialogOpen(true); setDialogTab(0) }}>
                    {cameraLabel || 'Camera'}
                  </Button>
                  <Button variant="outlined" size="small" startIcon={<Mic />}
                    onClick={() => { setDialogOpen(true); setDialogTab(1) }}>
                    {micLabel || 'Microphone'}
                  </Button>
                  <IconButton size="small" onClick={() => setDialogOpen(true)}>
                    <Settings fontSize="small" />
                  </IconButton>
                </Stack>

                <Box sx={{
                  width: '100%', aspectRatio: '4/3', minHeight: 300, bgcolor: '#1a1a1a',
                  borderRadius: 2, overflow: 'hidden', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {cameraActive
                    ? <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                    : (
                      <Box sx={{ textAlign: 'center' }}>
                        <Button variant="outlined" sx={{ color: 'white', borderColor: 'white' }} startIcon={<Cameraswitch />}
                          onClick={() => startCamera(selectedCamera)}>
                          Mulai Kamera
                        </Button>
                        <Typography variant="caption" color="grey.400" display="block" sx={{ mt: 1 }}>
                          Pilih kamera untuk memulai preview
                        </Typography>
                      </Box>
                    )
                  }
                </Box>

                <Button variant="contained" endIcon={<ArrowForward />}
                  disabled={!cameraActive}
                  onClick={() => setActiveStep(1)}>
                  Lanjutkan ke Mikrofon
                </Button>
              </StepContent>
            </Step>

            {/* Step 1: Microphone */}
            <Step>
              <StepLabel>Tes Mikrofon</StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  <MicWaveform level={micTesting ? micLevel : 0} />
                  <LinearProgress variant="determinate" value={micLevel * 100}
                    sx={{ mt: 1, height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.primary.main, 0.1) }} />
                </Box>

                <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VolumeUp color={micTesting ? 'primary' : 'disabled'} />
                      <Typography variant="body2" fontWeight={600}>
                        {micTesting ? 'Tes Mikrofon Aktif' : 'Mikrofon'}
                      </Typography>
                      {micTesting && (
                        <Chip label={`${Math.round(micLevel * 100)}%`} size="small" color="primary" sx={{ ml: 'auto' }} />
                      )}
                    </Box>
                    {micTesting && micSilent && (
                      <Alert severity="warning" sx={{ mt: 1 }}>Tidak ada suara terdeteksi</Alert>
                    )}
                  </CardContent>
                </Card>

                <Stack direction="row" spacing={2}>
                  {!micTesting
                    ? <Button variant="contained" startIcon={<PlayArrow />} onClick={startMicTest}>Mulai Tes</Button>
                    : <Button variant="outlined" color="error" startIcon={<Stop />} onClick={stopMicTest}>Hentikan Tes</Button>
                  }
                  <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => setActiveStep(0)}>
                    Kembali
                  </Button>
                  <Button variant="contained" endIcon={<ArrowForward />} onClick={() => { stopMicTest(); setActiveStep(2) }}>
                    Selesai
                  </Button>
                </Stack>
              </StepContent>
            </Step>

            {/* Step 2: Secondary Camera (HP) — NEW */}
            <Step>
              <StepLabel
                optional={<Typography variant="caption" color="text.secondary">Opsional</Typography>}
              >
                Kamera HP
              </StepLabel>
              <StepContent>
                <SecondaryCameraStep />
              </StepContent>
            </Step>

            {/* Step 3: Done */}
            <Step>
              <StepLabel>Persiapan Selesai</StepLabel>
              <StepContent>
                <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle />}>
                  Perangkat Anda siap digunakan untuk assessment!
                </Alert>
                {connectionStatus === 'connected' && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Kamera HP terhubung — pastikan HP tetap aktif dan tidak tertutup selama assessment.
                  </Alert>
                )}
                <Button variant="contained" endIcon={<ArrowForward />} onClick={() => navigate('/assessment')}>
                  Mulai Assessment
                </Button>
              </StepContent>
            </Step>
          </Stepper>
        </CardContent>
      </Card>

      {/* Device Settings Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Pengaturan Perangkat</DialogTitle>
        <Tabs value={dialogTab} onChange={(_, v) => setDialogTab(v)} sx={{ px: 2 }}>
          <Tab label="Kamera" />
          <Tab label="Mikrofon" />
        </Tabs>
        <DialogContent>
          {dialogTab === 0 && (
            <Box sx={{ mt: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Kamera</InputLabel>
                <Select value={selectedCamera} label="Kamera" onChange={e => {
                  setSelectedCamera(e.target.value)
                  const cam = cameras.find(c => c.deviceId === e.target.value)
                  setCameraLabel(cam?.label || 'Camera')
                  startCamera(e.target.value)
                }}>
                  {cameras.map(c => <MenuItem key={c.deviceId} value={c.deviceId}>{c.label || 'Camera'}</MenuItem>)}
                </Select>
              </FormControl>
              <Button size="small" sx={{ mt: 1 }} onClick={loadDevices}>Refresh Kamera</Button>
            </Box>
          )}
          {dialogTab === 1 && (
            <FormControl fullWidth size="small" sx={{ mt: 1 }}>
              <InputLabel>Mikrofon</InputLabel>
              <Select value={selectedMic} label="Mikrofon" onChange={e => {
                setSelectedMic(e.target.value)
                const mic = mics.find(m => m.deviceId === e.target.value)
                setMicLabel(mic?.label || 'Microphone')
              }}>
                {mics.map(m => <MenuItem key={m.deviceId} value={m.deviceId}>{m.label || 'Microphone'}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', px: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            {cameraLabel && <Chip icon={<Cameraswitch />} label={cameraLabel} size="small" />}
            {micLabel && <Chip icon={<Mic />} label={micLabel} size="small" />}
          </Box>
          <Button variant="contained" size="large" fullWidth onClick={() => setDialogOpen(false)}>Selesai</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
