import { useState, useEffect, useRef } from 'react'
import {
  Box, Card, CardContent, Typography, CircularProgress, Alert,
  Button, Divider, Chip, Stack, Paper, IconButton
} from '@mui/material'
import {
  CheckCircle, Warning, Error as ErrorIcon, Monitor, Computer,
  Language, Router, Wifi, Speed, CameraAlt, Refresh, Dns,
  NetworkCheck, ArrowBack, ArrowForward, PhotoCamera
} from '@mui/icons-material'
import { alpha } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'

// Step constants
const STEP_MAIN = 1
const STEP_CAMERA = 3
const STEP_NETWORK = 4
const STEP_DNS = 5

function StatusIcon({ status }) {
  if (status === 'loading') return <CircularProgress size={20} thickness={5} />
  if (status === 'ok') return <CheckCircle sx={{ color: 'success.main' }} />
  if (status === 'warning') return <Warning sx={{ color: 'warning.main' }} />
  return <ErrorIcon sx={{ color: 'error.main' }} />
}

function CheckRow({ icon, label, value, status, children }) {
  const theme = useTheme()
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'primary.main', flexShrink: 0
        }}>
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={600}>{label}</Typography>
          <Typography variant="caption" color="text.secondary">
            {status === 'loading' ? 'Mendeteksi...' : value}
          </Typography>
        </Box>
        <StatusIcon status={status} />
      </Box>
      {children}
    </Box>
  )
}

export default function MyDevices() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [step, setStep] = useState(STEP_MAIN)

  // Detection states
  const [device, setDevice] = useState({ value: '', status: 'loading' })
  const [os, setOs] = useState({ value: '', status: 'loading' })
  const [browser, setBrowser] = useState({ value: '', status: 'loading' })
  const [isp, setIsp] = useState({ value: '', status: 'loading' })
  const [latency, setLatency] = useState({ value: '', status: 'loading' })
  const [network, setNetwork] = useState({ value: 'Perlu Pemeriksaan Network', status: 'error' })
  const [camera, setCamera] = useState({ value: 'Perlu Pemeriksaan Kamera', status: 'error' })

  // Camera test state
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)
  const [cameraPreview, setCameraPreview] = useState(false)
  const [cameraResult, setCameraResult] = useState(null)
  const [cameraCapturing, setCameraCapturing] = useState(false)

  // Network step state
  const [networkChecked, setNetworkChecked] = useState(false)
  const [dnsChecked, setDnsChecked] = useState(false)

  useEffect(() => {
    runDetection()
  }, [])

  async function runDetection() {
    // Device + OS + Browser (Bowser.js-like)
    const ua = navigator.userAgent
    const parsed = parseBrowser(ua)
    setDevice({ value: parsed.device, status: 'ok' })
    setOs({ value: parsed.os, status: 'ok' })
    setBrowser({ value: parsed.browser, status: 'ok' })

    // Latency: ping 10x
    measureLatency()

    // ISP
    try {
      const apiKey = import.meta.env.VITE_IPGEO_API_KEY || ''
      const res = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}`)
      const data = await res.json()
      const ispName = data.isp || data.organization || 'Unknown'
      const isWarning = ispName.toLowerCase().includes('telkom') || ispName.toLowerCase().includes('indihome')
      setIsp({ value: ispName, status: isWarning ? 'warning' : 'ok' })
    } catch {
      setIsp({ value: 'Tidak dapat mendeteksi', status: 'warning' })
    }
  }

  function parseBrowser(ua) {
    let device = 'desktop'
    if (/mobile/i.test(ua)) device = 'mobile'
    else if (/tablet/i.test(ua)) device = 'tablet'

    let os = 'Unknown OS'
    if (/Win/i.test(ua)) os = 'Windows'
    else if (/Mac/i.test(ua)) os = 'macOS'
    else if (/Linux/i.test(ua)) os = 'Linux'
    else if (/Android/i.test(ua)) os = 'Android'
    else if (/iPhone|iPad/i.test(ua)) os = 'iOS'

    let browserName = 'Unknown'
    let browserVersion = ''
    if (/Chrome\/(\d+)/i.test(ua)) { browserName = 'Chrome'; browserVersion = ua.match(/Chrome\/(\d+)/i)?.[1] || '' }
    else if (/Firefox\/(\d+)/i.test(ua)) { browserName = 'Firefox'; browserVersion = ua.match(/Firefox\/(\d+)/i)?.[1] || '' }
    else if (/Safari\/(\d+)/i.test(ua) && !/Chrome/i.test(ua)) { browserName = 'Safari'; browserVersion = ua.match(/Version\/(\d+)/i)?.[1] || '' }
    const browser = `${browserName}${browserVersion ? ' - ' + browserVersion : ''}`

    return { device, os, browser }
  }

  async function measureLatency() {
    const pings = []
    for (let i = 0; i < 10; i++) {
      const t = Date.now()
      try {
        await fetch('https://one.one.one.one/', { mode: 'no-cors', cache: 'no-store' })
      } catch {}
      pings.push(Date.now() - t)
      await new Promise(r => setTimeout(r, 200))
    }
    const avg = pings.reduce((a, b) => a + b, 0) / pings.length
    const status = avg <= 120 ? 'ok' : 'error'
    setLatency({ value: avg.toFixed(2), status })
  }

  async function startCameraTest() {
    setStep(STEP_CAMERA)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraPreview(true)
    } catch (e) {
      setCameraResult({ ok: false, error: e.message })
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraPreview(false)
  }

  function capturePhoto() {
    if (!videoRef.current) return
    setCameraCapturing(true)
    const canvas = canvasRef.current
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    // Simulate sending to Google Vision API
    setTimeout(() => {
      setCameraCapturing(false)
      setCameraResult({ ok: true })
      setCamera({ value: 'Kamera Berfungsi', status: 'ok' })
    }, 1500)
  }

  function finishCameraTest() {
    stopCamera()
    setStep(STEP_MAIN)
  }

  function goNetworkTest() {
    setStep(STEP_NETWORK)
  }

  function confirmNetwork(ok) {
    if (ok) setNetwork({ value: 'Kecepatan Internet Memadai', status: 'ok' })
    else setNetwork({ value: 'Kecepatan Internet Tidak Memadai', status: 'error' })
    setStep(STEP_MAIN)
  }

  function goDnsSetup() {
    setStep(STEP_DNS)
  }

  function confirmDns(ok) {
    if (ok) setIsp(prev => ({ ...prev, status: 'ok', value: prev.value + ' (WARP Aktif)' }))
    setStep(STEP_MAIN)
  }

  const allOk = [device, os, browser, isp, latency, network, camera].every(s => s.status === 'ok')

  // ── DNS step ──────────────────────────────────────────────
  if (step === STEP_DNS) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Card sx={{ maxWidth: 'sm', width: '100%', borderRadius: 3, p: 2 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Penggantian Alamat DNS</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ikuti langkah berikut untuk mengganti DNS menggunakan WARP 1.1.1.1 dari Cloudflare.
            </Typography>
            <Stack spacing={2} sx={{ mb: 3 }}>
              {[
                'Download dan install aplikasi WARP 1.1.1.1',
                'Buka aplikasi WARP setelah terinstall',
                'Tekan tombol koneksi hingga berwarna biru (Connected)',
                'Pastikan status menunjukkan "Connected"',
              ].map((s, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700 }}>{i + 1}</Box>
                  <Typography variant="body2" sx={{ pt: 0.5 }}>{s}</Typography>
                </Box>
              ))}
            </Stack>
            <Button variant="contained" color="primary" fullWidth sx={{ mb: 2 }}
              onClick={() => { window.open('https://one.one.one.one/', '_blank'); setDnsChecked(true) }}>
              Unduh DNS
            </Button>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
              Apakah anda sudah memastikan aplikasi WARP 1.1.1.1 dalam keadaan Aktif?
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" color="primary" disabled={!dnsChecked} onClick={() => confirmDns(true)}>Ya</Button>
              <Button variant="contained" color="error" onClick={() => confirmDns(false)}>Tidak</Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    )
  }

  // ── Network step ──────────────────────────────────────────
  if (step === STEP_NETWORK) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Card sx={{ maxWidth: 'sm', width: '100%', borderRadius: 3, p: 2 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Pemeriksaan Network</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Kecepatan internet yang direkomendasikan untuk melakukan assessment minimal 5 mbps untuk Download dan 1 mbps untuk Upload.
            </Typography>
            <Stack spacing={3}>
              <Box>
                <Typography variant="body2" fontWeight={600} gutterBottom>Cek kecepatan internet anda di bawah ini</Typography>
                <Button variant="contained" startIcon={<Speed />}
                  onClick={() => { window.open('https://www.speedtest.net/', '_blank'); setNetworkChecked(true) }}>
                  Cek Internet
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  NB: Tekan Tombol 'Cek Internet', Anda Akan Diarahkan ke Website Speedtest
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Apakah kecepatan internet anda sesuai dengan yang direkomendasikan?
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button variant="contained" color="primary" disabled={!networkChecked} onClick={() => confirmNetwork(true)}>Ya</Button>
                  <Button variant="contained" color="error" disabled={!networkChecked} onClick={() => confirmNetwork(false)}>Tidak</Button>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    )
  }

  // ── Camera step ───────────────────────────────────────────
  if (step === STEP_CAMERA) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Card sx={{ maxWidth: 'sm', width: '100%', borderRadius: 3, p: 2 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Tes Kamera</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Pastikan wajah Anda terlihat jelas dalam frame kamera.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Box sx={{ width: '100%', aspectRatio: '4/3', bgcolor: '#e8f4fd', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Contoh Benar</Typography>
                </Box>
              </Box>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Box sx={{ width: '100%', aspectRatio: '4/3', bgcolor: '#fde8e8', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Contoh Salah</Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ width: '100%', aspectRatio: '4/3', bgcolor: '#000', borderRadius: 2, overflow: 'hidden', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {cameraPreview
                ? <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                : <Typography color="white" variant="body2">Kamera tidak tersedia</Typography>
              }
            </Box>
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {cameraResult && (
              <Alert severity={cameraResult.ok ? 'success' : 'error'} sx={{ mb: 2 }}>
                {cameraResult.ok ? 'Kamera berhasil diverifikasi!' : `Kamera gagal: ${cameraResult.error}`}
              </Alert>
            )}

            <Stack direction="row" spacing={2}>
              {!cameraResult && (
                <Button variant="contained" startIcon={cameraCapturing ? <CircularProgress size={16} color="inherit" /> : <PhotoCamera />}
                  disabled={!cameraPreview || cameraCapturing} onClick={capturePhoto} fullWidth>
                  {cameraCapturing ? 'Memproses...' : 'Ambil Gambar'}
                </Button>
              )}
              <Button variant="outlined" onClick={finishCameraTest} fullWidth>
                {cameraResult ? 'Selesai' : 'Batal'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    )
  }

  // ── Main checklist ────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ maxWidth: 'sm', width: '100%', borderRadius: 3, p: 1 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={700} gutterBottom>Pemeriksaan Device</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Anda harus melewati pemeriksaan perangkat berikut
          </Typography>

          <Stack divider={<Divider />} spacing={0}>
            <CheckRow icon={<Computer fontSize="small" />} label="Perangkat" value={device.value} status={device.status} />
            <CheckRow icon={<Monitor fontSize="small" />} label="Sistem Operasi" value={os.value} status={os.status} />
            <CheckRow icon={<Language fontSize="small" />} label="Browser" value={browser.value} status={browser.status} />
            <CheckRow icon={<Router fontSize="small" />} label="ISP" value={isp.value} status={isp.status}>
              {isp.status === 'warning' && (
                <Box sx={{ pl: 7, pb: 1.5 }}>
                  <Typography variant="caption" color="warning.main" display="block">
                    Disarankan untuk mengganti alamat DNS
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Tekan tombol <strong>Ganti DNS</strong> yang ada dibawah ini
                  </Typography>
                  <Button variant="contained" size="small" startIcon={<Dns />} onClick={goDnsSetup}>
                    Ganti DNS
                  </Button>
                </Box>
              )}
            </CheckRow>
            <CheckRow icon={<Wifi fontSize="small" />} label="Latensi" value={latency.value ? `${latency.value} ms` : ''} status={latency.status}>
              {latency.status === 'error' && (
                <Box sx={{ pl: 7, pb: 1.5 }}>
                  <Typography variant="caption" color="error.main">
                    Latensi melebihi batas (max 120 ms)
                  </Typography>
                </Box>
              )}
            </CheckRow>
            <CheckRow icon={<NetworkCheck fontSize="small" />} label="Cek Kecepatan Internet" value={network.value} status={network.status}>
              {network.status === 'error' && (
                <Box sx={{ pl: 7, pb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Tekan tombol <strong>Tes Network</strong> yang ada dibawah ini
                  </Typography>
                  <Button variant="contained" size="small" startIcon={<Speed />} onClick={goNetworkTest}>
                    Tes Network
                  </Button>
                </Box>
              )}
            </CheckRow>
            <CheckRow icon={<CameraAlt fontSize="small" />} label="Kamera" value={camera.value} status={camera.status}>
              {camera.status === 'error' && (
                <Box sx={{ pl: 7, pb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Tekan tombol <strong>Tes Kamera</strong> yang ada di bawah ini
                  </Typography>
                  <Button variant="contained" size="small" startIcon={<CameraAlt />} onClick={startCameraTest}>
                    Tes Kamera
                  </Button>
                </Box>
              )}
            </CheckRow>
          </Stack>

          {allOk && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button variant="outlined" startIcon={<Refresh />} onClick={runDetection}>Re-run test</Button>
            </Box>
          )}

          {allOk && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button variant="contained" endIcon={<ArrowForward />} onClick={() => navigate('/deviceSetup')}>
                Lanjut ke Persiapan Perangkat
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
