import { useState, useEffect, useRef } from 'react'
import {
  Box, Card, CardContent, Typography, Button, Avatar, Alert, Chip,
  CircularProgress, Stack, Fab, LinearProgress, TextField
} from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  Face, Fullscreen, FullscreenExit, Help, Quiz, Security,
  CheckCircle, Cancel, Logout, Warning, PhoneAndroid, Person
} from '@mui/icons-material'
import { alpha } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import useFullscreen from '../../hooks/useFullscreen'
import useTabSwitch from '../../hooks/useTabSwitch'
import useScreenShare from '../../hooks/useScreenShare'
import useMultipleMonitor from '../../hooks/useMultipleMonitor'
import useFaceDetection from '../../hooks/useFaceDetection'
import usePhoneDetection from '../../hooks/usePhoneDetection'
import useSecondaryCamera from '../../hooks/useSecondaryCamera'

const keyframes = `
  @keyframes pulse {
    0%,100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  @keyframes attention {
    0%,100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }
`

export default function Assessment() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [isStarted, setIsStarted] = useState(false)
  const [answers, setAnswers] = useState({ q1: '', q2: '' })

  // Timer
  const [timeLeft, setTimeLeft] = useState(60 * 60)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef(null)

  // Proctoring hooks
  const { isFullscreen, fullscreenExitCount, requestFullscreen, exitFullscreen } = useFullscreen()
  const { tabSwitchCount } = useTabSwitch()
  const { isScreenShared } = useScreenShare()
  const { hasMultipleMonitors } = useMultipleMonitor()
  const {
    faceDetected, faceCount, hasMultipleFaces, loading: faceLoading,
    setFaceDetected, setFaceCount, setHasMultipleFaces, setLoading: setFaceLoading
  } = useFaceDetection({ enabled: true })
  const { phoneDetected, setPhoneDetected } = usePhoneDetection({ enabled: true })

  // Secondary camera (HP)
  const {
    qrUrl: hpQrUrl, connectionStatus: hpStatus, remoteVideoRef: hpVideoRef,
    startListening: hpStartListening, disconnect: hpDisconnect,
    simulateConnect: hpSimulateConnect, simulateDisconnect: hpSimulateDisconnect,
  } = useSecondaryCamera({ enabled: true })
  const hpConnected = hpStatus === 'connected'

  // Start timer when assessment starts
  useEffect(() => {
    if (isStarted) {
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
  }, [isStarted])

  // Prevent close/refresh during assessment
  useEffect(() => {
    if (!isStarted) return
    const handler = e => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isStarted])

  function formatTime(s) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const canStart = isFullscreen && !faceLoading && faceDetected && !hasMultipleFaces && !phoneDetected

  function handleStart() {
    setIsStarted(true)
  }

  function handleExit() {
    const confirmed = window.confirm('Apakah Anda yakin ingin keluar dari assessment? Semua progres Anda akan hilang.')
    if (confirmed) {
      exitFullscreen()
      clearInterval(timerRef.current)
      setIsStarted(false)
    }
  }

  // Violations to show as toasts when started
  const violations = [
    !isFullscreen && { key: 'fs', severity: 'error', message: 'Mode Fullscreen tidak aktif!' },
    tabSwitchCount > 0 && { key: 'tab', severity: 'warning', message: `Perpindahan Tab Terdeteksi (${tabSwitchCount}x)` },
    isScreenShared && { key: 'ss', severity: 'error', message: 'Screen Sharing Terdeteksi!' },
    hasMultipleMonitors && { key: 'mm', severity: 'error', message: 'Multiple Monitor Terdeteksi!' },
    !faceDetected && { key: 'face', severity: 'error', message: 'Wajah Tidak Terdeteksi' },
    hasMultipleFaces && { key: 'mf', severity: 'error', message: `Terdeteksi ${faceCount} wajah. Hanya boleh ada 1 wajah.` },
    phoneDetected && { key: 'phone', severity: 'error', message: 'Ponsel Terdeteksi! Harap jauhkan ponsel.' },
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

        {/* ── PRE-ASSESSMENT STATE ── */}
        {!isStarted && (
          <Card sx={{ ...cardStyle, p: { xs: 2, md: 4 } }}>
            <CardContent>
              {/* Header */}
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

              {/* Two columns */}
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
                      { icon: <Fullscreen />, title: 'Dilarang Melakukan Screen Sharing', desc: 'Anda tidak diperbolehkan melakukan screen sharing' },
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

                {/* Right: Camera status */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'warning.main', px: 2.5, py: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
                        <Face sx={{ fontSize: 18, color: 'white' }} />
                      </Avatar>
                      <Typography fontWeight={700} color="white">Status Kamera</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, py: 3, px: 3 }}>
                      {faceLoading ? (
                        <CircularProgress size={60} thickness={5} sx={{ strokeLinecap: 'round' }} />
                      ) : faceDetected ? (
                        <>
                          <Avatar sx={{
                            width: 70, height: 70, bgcolor: alpha(theme.palette.success.main, 0.9),
                            animation: 'pulse 2s infinite'
                          }}>
                            <Face sx={{ fontSize: 36, color: 'white' }} />
                          </Avatar>
                          <Typography variant="h6" fontWeight={700} color="success.main">Wajah Terdeteksi</Typography>
                          {hasMultipleFaces && (
                            <Alert severity="error">Terdeteksi {faceCount} wajah. Hanya boleh ada 1 wajah.</Alert>
                          )}
                        </>
                      ) : (
                        <>
                          <Avatar sx={{
                            width: 70, height: 70, bgcolor: alpha(theme.palette.error.main, 0.9),
                            animation: 'attention 1.5s infinite'
                          }}>
                            <Face sx={{ fontSize: 36, color: 'white' }} />
                          </Avatar>
                          <Typography variant="h6" fontWeight={700} color="error.main">Wajah Tidak Terdeteksi</Typography>
                          <Alert severity="warning" variant="outlined">
                            Posisikan wajah Anda dengan jelas di depan kamera
                          </Alert>
                        </>
                      )}

                      {phoneDetected && (
                        <Alert severity="error" icon={<PhoneAndroid />}>
                          <Typography variant="body2" fontWeight={600}>Ponsel Terdeteksi!</Typography>
                          <Typography variant="caption">Harap jauhkan ponsel dan perangkat elektronik lainnya</Typography>
                        </Alert>
                      )}

                      {/* Demo controls for slicing */}
                      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Button size="small" variant="outlined" onClick={() => { setFaceDetected(true); setFaceCount(1); setHasMultipleFaces(false); setFaceLoading(false) }}>
                          Simulasi Wajah Terdeteksi
                        </Button>
                        <Button size="small" variant="outlined" color="error" onClick={() => { setFaceDetected(false); setFaceLoading(false) }}>
                          Simulasi Tidak Terdeteksi
                        </Button>
                        <Button size="small" variant="outlined" color="warning" onClick={() => { setFaceDetected(true); setFaceCount(2); setHasMultipleFaces(true); setFaceLoading(false) }}>
                          Simulasi Multi Wajah
                        </Button>
                      </Box>
                    </Box>
                  </Card>

                  {/* HP Camera card */}
                  <Card variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: hpConnected ? 'success.main' : 'info.main', px: 2.5, py: 1.5 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(255,255,255,0.2)' }}>
                        <PhoneAndroid sx={{ fontSize: 16, color: 'white' }} />
                      </Avatar>
                      <Typography fontWeight={700} color="white" variant="body1">Kamera HP</Typography>
                      <Chip
                        label={hpConnected ? 'Terhubung' : 'Belum Terhubung'}
                        size="small"
                        sx={{ ml: 'auto', bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 700 }}
                      />
                    </Box>
                    <Box sx={{ px: 2.5, py: 2 }}>
                      {hpConnected ? (
                        <Stack spacing={1} alignItems="center">
                          <Box sx={{ width: '100%', maxWidth: 200, aspectRatio: '16/9', bgcolor: '#000', borderRadius: 1.5, overflow: 'hidden', border: '2px solid', borderColor: 'success.main' }}>
                            <video ref={hpVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </Box>
                          <Typography variant="caption" color="success.main" fontWeight={600}>Live preview kamera belakang HP</Typography>
                          <Button size="small" variant="outlined" color="error" onClick={hpDisconnect}>Putuskan</Button>
                        </Stack>
                      ) : (
                        <Stack spacing={1.5}>
                          {hpStatus === 'waiting' && hpQrUrl ? (
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Box sx={{ p: 1, bgcolor: 'white', borderRadius: 1.5, border: '1px solid', borderColor: 'warning.main', flexShrink: 0 }}>
                                <QRCodeSVG value={hpQrUrl} size={80} />
                              </Box>
                              <Stack spacing={0.5}>
                                <Chip label="Menunggu HP scan QR..." color="warning" size="small" />
                                <Typography variant="caption" color="text.secondary">
                                  Scan QR dengan HP untuk menghubungkan kamera belakang
                                </Typography>
                                <Button size="small" variant="outlined" color="error" onClick={hpDisconnect} sx={{ alignSelf: 'flex-start' }}>Batalkan</Button>
                              </Stack>
                            </Stack>
                          ) : (
                            <Stack spacing={0.75}>
                              <Typography variant="caption" color="text.secondary">
                                Hubungkan HP sebagai kamera pengawas sudut ruangan (opsional).
                              </Typography>
                              <Button size="small" variant="outlined" startIcon={<PhoneAndroid />} onClick={hpStartListening} sx={{ alignSelf: 'flex-start' }}>
                                Hubungkan HP Sekarang
                              </Button>
                              <Stack direction="row" spacing={1}>
                                <Button size="small" variant="text" color="success" onClick={hpSimulateConnect}>Demo: Terhubung</Button>
                                <Button size="small" variant="text" color="error" onClick={hpSimulateDisconnect}>Demo: Terputus</Button>
                              </Stack>
                            </Stack>
                          )}
                        </Stack>
                      )}
                    </Box>
                  </Card>
                </Grid>
              </Grid>

              {/* Action buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined" color="secondary" size="large"
                    startIcon={isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                    onClick={isFullscreen ? exitFullscreen : requestFullscreen}
                    sx={{ py: 1.5, px: 4, '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 }, transition: 'all 0.2s' }}>
                    {isFullscreen ? 'Keluar Fullscreen' : 'Aktifkan Fullscreen'}
                  </Button>
                  <Button
                    variant="contained" color="primary" size="large"
                    startIcon={<Quiz />}
                    disabled={!canStart}
                    onClick={handleStart}
                    sx={{ py: 1.5, px: 6, '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 }, transition: 'all 0.2s', '&.Mui-disabled': { bgcolor: 'grey.400' } }}>
                    Mulai Assessment
                  </Button>
                </Stack>

                {(!faceDetected || hasMultipleFaces || phoneDetected || !isFullscreen) && (
                  <Alert severity="warning" sx={{ width: 'fit-content', borderRadius: 2 }}>
                    {!faceDetected
                      ? 'Wajah Anda harus terdeteksi untuk memulai assessment'
                      : hasMultipleFaces
                        ? 'Hanya boleh ada satu wajah yang terdeteksi'
                        : phoneDetected
                          ? 'Ponsel terdeteksi. Harap jauhkan ponsel dari area ujian'
                          : 'Aktifkan fullscreen untuk memulai assessment'}
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* ── ASSESSMENT ACTIVE STATE ── */}
        {isStarted && (
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
                  <Box sx={{ textAlign: 'right', minWidth: 200 }}>
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
                    { label: tabSwitchCount === 0 ? 'Tidak Ada Perpindahan Tab' : `Perpindahan Tab Terdeteksi (${tabSwitchCount}x)`, ok: tabSwitchCount === 0, icon: <Quiz /> },
                    { label: !isScreenShared ? 'Tidak Ada Screen Sharing' : 'Screen Sharing Terdeteksi', ok: !isScreenShared, icon: <Fullscreen /> },
                    { label: !hasMultipleMonitors ? 'Hanya Satu Monitor' : 'Multiple Monitor Terdeteksi', ok: !hasMultipleMonitors, icon: <Person /> },
                    { label: faceDetected && !hasMultipleFaces ? 'Satu Wajah Terdeteksi' : hasMultipleFaces ? `Terdeteksi ${faceCount} Wajah` : 'Wajah Tidak Terdeteksi', ok: faceDetected && !hasMultipleFaces, icon: <Face /> },
                    { label: !phoneDetected ? 'Tidak Ada Ponsel' : 'Ponsel Terdeteksi', ok: !phoneDetected, icon: <PhoneAndroid /> },
                    { label: hpConnected ? 'Kamera HP Aktif' : 'Kamera HP Tidak Terhubung', ok: hpConnected, icon: <PhoneAndroid /> },
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
                      <TextField
                        multiline rows={6} fullWidth variant="outlined" placeholder="Tuliskan jawaban Anda di sini..."
                        value={answers[soal.key]}
                        onChange={e => setAnswers(a => ({ ...a, [soal.key]: e.target.value }))}
                        sx={{ bgcolor: 'white' }}
                      />
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

      {/* HP Camera PIP — shown during active assessment when connected */}
      {isStarted && hpConnected && (
        <Box sx={{
          position: 'fixed', bottom: 80, left: 24, zIndex: 999,
          borderRadius: 2, overflow: 'hidden',
          border: '2px solid', borderColor: 'success.main',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          <video
            ref={hpVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: 160, height: 90, objectFit: 'cover', display: 'block' }}
          />
          <Box sx={{ position: 'absolute', top: 4, left: 4 }}>
            <Chip label="Kamera HP" size="small" color="success" sx={{ fontSize: 10, height: 20, fontWeight: 700 }} />
          </Box>
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

      {/* Violation toasts */}
      {isStarted && violations.length > 0 && (
        <Box sx={{ position: 'fixed', top: 24, right: 24, maxWidth: 380, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 1 }}>
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
