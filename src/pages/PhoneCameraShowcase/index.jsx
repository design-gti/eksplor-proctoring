import { useState } from 'react'
import {
  Box, Typography, Chip, Button, Stack, ToggleButton, ToggleButtonGroup,
  IconButton, Alert, CircularProgress, TextField, Paper
} from '@mui/material'
import {
  PhoneAndroid, CheckCircle, Error as ErrorIcon, CameraAlt,
  NoPhotography, Warning, Wifi, WifiOff, Refresh, ArrowBack
} from '@mui/icons-material'
import { alpha } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'

// ── Phone frame wrapper ────────────────────────────────────────────────────
function PhoneFrame({ label, optionTag, optionColor = 'primary', children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label={optionTag} size="small" color={optionColor} sx={{ fontWeight: 700 }} />
        <Typography variant="subtitle2" fontWeight={700}>{label}</Typography>
      </Box>
      {/* Phone shell */}
      <Box sx={{
        width: 220,
        height: 440,
        borderRadius: '32px',
        border: '8px solid #1a1a2e',
        bgcolor: '#000',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 8, left: '50%', transform: 'translateX(-50%)',
          width: 60, height: 6,
          bgcolor: '#1a1a2e',
          borderRadius: '0 0 8px 8px',
          zIndex: 10,
        }
      }}>
        {children}
      </Box>
    </Box>
  )
}

// ── Option A/B/C — Custom /phone-camera page ───────────────────────────────
function PhoneUICustom({ state }) {
  const statusConfig = {
    idle: { bg: '#111827', icon: <ErrorIcon sx={{ fontSize: 48, color: '#ef4444' }} />, title: 'Link Tidak Valid', sub: 'Scan ulang QR code dari DeviceSetup', chip: null, showWarn: false },
    requesting: { bg: '#111827', icon: <CameraAlt sx={{ fontSize: 48, color: '#6b7280' }} />, title: 'Mengakses Kamera...', sub: 'Izinkan akses kamera', chip: null, showWarn: true },
    connecting: { bg: '#111827', icon: null, title: 'Menghubungkan...', sub: 'Pastikan halaman DeviceSetup terbuka', chip: null, showWarn: true, loading: true },
    connected: { bg: '#0d1117', icon: null, title: null, sub: null, chip: { label: 'Streaming ke komputer', color: 'success' }, showWarn: true, isLive: true },
    denied: { bg: '#111827', icon: <NoPhotography sx={{ fontSize: 48, color: '#ef4444' }} />, title: 'Izin Kamera Ditolak', sub: 'Buka pengaturan browser & aktifkan kamera', chip: null, showWarn: false, showRetry: true },
    error: { bg: '#111827', icon: <ErrorIcon sx={{ fontSize: 48, color: '#ef4444' }} />, title: 'Koneksi Gagal', sub: 'Coba scan ulang QR code', chip: null, showWarn: false, showRetry: true },
  }
  const s = statusConfig[state] || statusConfig.idle

  return (
    <Box sx={{ width: '100%', height: '100%', bgcolor: s.bg, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Top bar */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 1,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2,
      }}>
        <PhoneAndroid sx={{ color: 'white', fontSize: 14 }} />
        <Typography variant="caption" fontWeight={700} color="white" sx={{ fontSize: 10 }}>
          Kamera HP — Proctoring
        </Typography>
      </Box>

      {/* Live camera simulation */}
      {s.isLive && (
        <Box sx={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #1a2a1a 0%, #0d1a0d 40%, #111 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Simulated camera view */}
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Room simulation */}
            <Box sx={{ position: 'absolute', inset: 0, opacity: 0.3,
              background: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px)',
            }} />
            <Box sx={{ position: 'absolute', bottom: '20%', left: '10%', right: '10%', height: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }} />
            <Box sx={{ position: 'absolute', top: '30%', left: '20%', width: 40, height: 60, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }} />
          </Box>
          {/* REC indicator */}
          <Box sx={{ position: 'absolute', top: 28, right: 12, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#ef4444', animation: 'pulse 1.5s infinite' }} />
            <Typography variant="caption" color="white" sx={{ fontSize: 9, fontWeight: 700 }}>REC</Typography>
          </Box>
        </Box>
      )}

      {/* Center content for non-live states */}
      {!s.isLive && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, px: 2, pt: 4 }}>
          {s.loading
            ? <CircularProgress size={40} sx={{ color: '#f97316' }} />
            : s.icon
          }
          {s.title && <Typography color="white" variant="body2" fontWeight={600} textAlign="center" sx={{ fontSize: 12 }}>{s.title}</Typography>}
          {s.sub && <Typography color="grey.500" sx={{ fontSize: 10, textAlign: 'center', lineHeight: 1.4 }}>{s.sub}</Typography>}
          {s.showRetry && (
            <Button size="small" variant="outlined" color="warning" startIcon={<Refresh />} sx={{ fontSize: 10, py: 0.5 }}>
              Coba Lagi
            </Button>
          )}
        </Box>
      )}

      {/* Bottom overlay */}
      <Box sx={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3,
        background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
        px: 1.5, py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
      }}>
        {s.chip && (
          <Chip
            icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
            label={s.chip.label}
            color={s.chip.color}
            size="small"
            sx={{ fontSize: 10, height: 22 }}
          />
        )}
        {s.showWarn && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(0,0,0,0.5)', borderRadius: 1, px: 1, py: 0.5 }}>
            <Warning sx={{ color: '#fbbf24', fontSize: 11 }} />
            <Typography sx={{ fontSize: 9, color: 'white', lineHeight: 1.3 }}>
              Jangan tutup halaman ini
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

// ── Option D — Jitsi embed ─────────────────────────────────────────────────
function PhoneUIJitsi({ state }) {
  return (
    <Box sx={{ width: '100%', height: '100%', bgcolor: '#1e1e2e', display: 'flex', flexDirection: 'column' }}>
      {/* Jitsi-style top bar */}
      <Box sx={{ bgcolor: '#2d2d44', px: 1.5, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ color: '#a78bfa', fontSize: 11, fontWeight: 700 }}>Jitsi Meet</Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {['#ef4444', '#f59e0b', '#22c55e'].map((c, i) => (
            <Box key={i} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c }} />
          ))}
        </Box>
      </Box>

      {state === 'prejoin' && (
        // Pre-join screen
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, px: 2 }}>
          <Box sx={{ width: 60, height: 60, borderRadius: '50%', bgcolor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhoneAndroid sx={{ color: '#9ca3af', fontSize: 28 }} />
          </Box>
          <Typography color="white" sx={{ fontSize: 12, fontWeight: 700 }}>exam_92XK3F</Typography>
          <TextField
            size="small"
            placeholder="Masukkan nama Anda"
            variant="outlined"
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': { bgcolor: '#374151', borderRadius: 1, fontSize: 11, color: 'white' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4b5563' },
            }}
          />
          <Button variant="contained" size="small" fullWidth
            sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, fontSize: 10, textTransform: 'none' }}>
            Gabung Sekarang
          </Button>
          <Typography color="grey.500" sx={{ fontSize: 9, textAlign: 'center' }}>
            Atau bergabung tanpa akun
          </Typography>
        </Box>
      )}

      {state === 'connected' && (
        // In-meeting screen
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Main video area */}
          <Box sx={{ flex: 1, bgcolor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {/* Self video tile */}
            <Box sx={{
              width: '80%', aspectRatio: '3/4', borderRadius: 1.5,
              background: 'linear-gradient(135deg, #1a2a1a, #0d1a0d)',
              border: '2px solid #7c3aed', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Box sx={{ opacity: 0.3, width: '100%', height: '100%',
                background: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 21px)'
              }} />
            </Box>
            {/* REC */}
            <Box sx={{ position: 'absolute', top: 6, right: 8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#ef4444' }} />
              <Typography sx={{ color: 'white', fontSize: 8, fontWeight: 700 }}>LIVE</Typography>
            </Box>
            {/* Participant count */}
            <Box sx={{ position: 'absolute', top: 6, left: 8 }}>
              <Chip label="2 peserta" size="small" sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 8, height: 18 }} />
            </Box>
          </Box>

          {/* Toolbar */}
          <Box sx={{ bgcolor: '#1e1e2e', px: 1, py: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            {[
              { icon: '🎤', label: 'Mute', active: true },
              { icon: '📹', label: 'Cam', active: true },
              { icon: '💬', label: 'Chat', active: false },
              { icon: '⋯', label: 'More', active: false },
              { icon: '📵', label: 'Leave', active: false, red: true },
            ].map((btn, i) => (
              <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                <Box sx={{
                  width: 28, height: 28, borderRadius: '50%',
                  bgcolor: btn.red ? '#ef4444' : btn.active ? '#374151' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, cursor: 'pointer',
                }}>
                  {btn.icon}
                </Box>
                <Typography sx={{ fontSize: 7, color: btn.red ? '#ef4444' : '#9ca3af' }}>{btn.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}

// ── Main Showcase Page ─────────────────────────────────────────────────────
const STATE_LABELS = {
  idle: 'Tidak Ada QR',
  requesting: 'Minta Izin Kamera',
  connecting: 'Menghubungkan...',
  connected: 'Terhubung (Live)',
  denied: 'Izin Ditolak',
  error: 'Koneksi Gagal',
}

export default function PhoneCameraShowcase() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [activeState, setActiveState] = useState('connected')
  const [jitsiState, setJitsiState] = useState('connected')

  const bgGradient = `
    radial-gradient(circle at top right, ${alpha(theme.palette.primary.light, 0.15)} 0%, transparent 50%),
    radial-gradient(circle at bottom left, ${alpha(theme.palette.secondary.light, 0.15)} 0%, transparent 50%)
  `

  return (
    <Box sx={{ minHeight: '100vh', background: bgGradient, bgcolor: 'background.default', py: 4, px: 2 }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/deviceSetup')} sx={{ mb: 3 }} size="small">
          Kembali ke DeviceSetup
        </Button>

        <Typography variant="h5" fontWeight={700} gutterBottom>
          Perbandingan UI Kamera HP — 4 Opsi
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Ini adalah tampilan yang dilihat user di HP setelah scan QR. Opsi A, B, C punya UI yang sama (perbedaan hanya di cara koneksi "di balik layar"). Opsi D menggunakan Jitsi Meet.
        </Typography>

        {/* State switcher for A/B/C */}
        <Paper variant="outlined" sx={{ p: 2, mb: 4, borderRadius: 2 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" gutterBottom>
            GANTI STATE — Opsi A / B / C
          </Typography>
          <ToggleButtonGroup value={activeState} exclusive onChange={(_, v) => v && setActiveState(v)} size="small" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {Object.entries(STATE_LABELS).map(([key, label]) => (
              <ToggleButton key={key} value={key} sx={{ fontSize: 11, textTransform: 'none', borderRadius: '20px !important', border: '1px solid !important', px: 1.5, py: 0.5 }}>
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Paper>

        {/* 4 phone frames */}
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', mb: 5 }}>

          {/* Option A */}
          <Box>
            <PhoneFrame label="PeerJS + TURN" optionTag="Opsi A" optionColor="primary">
              <PhoneUICustom state={activeState} />
            </PhoneFrame>
            <Box sx={{ mt: 1.5, maxWidth: 220 }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: 10, lineHeight: 1.5 }}>
                ✅ Minimal code change<br/>
                ✅ No new account<br/>
                ⚠️ Butuh TURN + deploy untuk cross-WiFi
              </Typography>
            </Box>
          </Box>

          {/* Option B */}
          <Box>
            <PhoneFrame label="Firebase + WebRTC" optionTag="Opsi B" optionColor="info">
              <PhoneUICustom state={activeState} />
            </PhoneFrame>
            <Box sx={{ mt: 1.5, maxWidth: 220 }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: 10, lineHeight: 1.5 }}>
                ✅ Cross-network otomatis<br/>
                ✅ Tidak perlu TURN<br/>
                ⚠️ Kode signaling lebih kompleks
              </Typography>
            </Box>
          </Box>

          {/* Option C */}
          <Box>
            <PhoneFrame label="Agora RTC SDK" optionTag="Opsi C" optionColor="success">
              <PhoneUICustom state={activeState} />
            </PhoneFrame>
            <Box sx={{ mt: 1.5, maxWidth: 220 }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: 10, lineHeight: 1.5 }}>
                ✅ Paling reliable (global CDN)<br/>
                ✅ 10k menit/bulan gratis<br/>
                ⚠️ Perlu App ID dari Agora.io
              </Typography>
            </Box>
          </Box>

          {/* Option D */}
          <Box>
            <PhoneFrame label="Jitsi Meet Embed" optionTag="Opsi D" optionColor="warning">
              <PhoneUIJitsi state={jitsiState} />
            </PhoneFrame>
            <Box sx={{ mt: 1.5, maxWidth: 220 }}>
              <Stack direction="row" spacing={0.5} sx={{ mb: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                <Button size="small" variant={jitsiState === 'prejoin' ? 'contained' : 'outlined'} sx={{ fontSize: 9, py: 0.3, px: 1, minWidth: 0 }} onClick={() => setJitsiState('prejoin')}>Pre-join</Button>
                <Button size="small" variant={jitsiState === 'connected' ? 'contained' : 'outlined'} color="success" sx={{ fontSize: 9, py: 0.3, px: 1, minWidth: 0 }} onClick={() => setJitsiState('connected')}>In-Meeting</Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: 10, lineHeight: 1.5 }}>
                ✅ Gratis selamanya<br/>
                ✅ Paling cepat (30 menit)<br/>
                ❌ UX berbeda — user harus isi nama & tap Gabung<br/>
                ❌ Tampilan tidak bisa di-custom
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Summary table */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>Kesimpulan dari Sisi User HP</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: 0, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            {[
              ['', 'Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
              ['UI Custom', '✅ Ya', '✅ Ya', '✅ Ya', '❌ Jitsi UI'],
              ['Langkah di HP', '1 langkah (izin)', '1 langkah (izin)', '1 langkah (izin)', '3 langkah (form nama → tap gabung → kamera)'],
              ['Cross-WiFi', '⚠️ + TURN', '✅ Otomatis', '✅ Otomatis', '✅ Otomatis'],
              ['Gratis', '✅ Open Relay', '✅ Firebase', '✅ 10k menit', '✅ Unlimited'],
              ['Effort kode', '🟢 Minimal', '🔴 Besar', '🟡 Sedang', '🟢 30 menit'],
            ].map((row, ri) => (
              row.map((cell, ci) => (
                <Box key={`${ri}-${ci}`} sx={{
                  px: 1.5, py: 1,
                  bgcolor: ri === 0 ? alpha(theme.palette.primary.main, 0.08) : ci === 0 ? alpha(theme.palette.grey[100], 0.5) : 'transparent',
                  borderBottom: ri < 5 ? '1px solid' : 'none',
                  borderRight: ci < 4 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  fontWeight: ri === 0 || ci === 0 ? 700 : 400,
                }}>
                  <Typography variant="caption" sx={{ fontSize: ri === 0 ? 11 : 10, fontWeight: ri === 0 || ci === 0 ? 700 : 400 }}>
                    {cell}
                  </Typography>
                </Box>
              ))
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
