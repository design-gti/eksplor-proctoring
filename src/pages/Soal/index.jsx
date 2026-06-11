import { useEffect, useState } from 'react'
import { Box, Typography, IconButton, Tooltip, Button } from '@mui/material'
import {
  AccessTime, Menu, InfoOutlined, ArrowBack, ArrowForward,
  Videocam, KeyboardArrowDown, KeyboardArrowUp, CheckCircle, Cancel, PhoneAndroid,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import useFaceDetection from '../../hooks/useFaceDetection'
import useSecondaryCamera from '../../hooks/useSecondaryCamera'

// ── Sample questions ──────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 1,
    counter: '1/40',
    stimulus: [
      { type: 'text', content: '" Anda diminta untuk mengkoordinasikan sebuah pesta hiburan. Berikut susunan instruksinya;' },
      { type: 'spacer' },
      { type: 'ol', items: [
        'Perencanaan Acara: Memutuskan aktivitas, agenda dan target peserta',
        'Perencanaan Anggaran: Membuat rencana anggaran untuk acaranya',
        'Perencanaan Tempat dan Tanggal: Memesan tempat dan mengkonfirmasi tanggalnya',
        'Pengiriman Undangan: Mengirimkan undangan',
      ]},
      { type: 'spacer' },
      { type: 'text', content: 'Berdasarkan instruksi di atas, di langkah mana untuk menentukan siapa pihak yang diundang? "' },
    ],
    options: [
      { key: 'A', text: 'Menolak untuk mengembalikan dana pelanggan' },
      { key: 'B', text: 'Meminta pelanggan untuk menghubungi manager terkait.' },
      { key: 'C', text: 'Mencoba mengalihkan masalah kepada yang lain.' },
      { key: 'D', text: 'Meminta maaf terlebih dulu, lalu bertanya detail permasalahan pelanggan.' },
    ],
  },
  {
    id: 2,
    counter: '2/40',
    stimulus: [
      { type: 'text', content: '" Seorang pelanggan menghubungi layanan pelanggan Anda dan mengklaim bahwa produk yang mereka beli rusak. Mereka meminta pengembalian dana penuh, namun kebijakan perusahaan menyatakan pengembalian dana hanya bisa dilakukan dalam 7 hari setelah pembelian, sementara pelanggan menghubungi pada hari ke-10.' },
      { type: 'spacer' },
      { type: 'text', content: 'Sebagai agen layanan pelanggan, tindakan apa yang paling tepat untuk Anda lakukan? "' },
    ],
    options: [
      { key: 'A', text: 'Menolak untuk mengembalikan dana pelanggan' },
      { key: 'B', text: 'Meminta pelanggan untuk menghubungi manager terkait.' },
      { key: 'C', text: 'Mencoba mengalihkan masalah kepada yang lain.' },
      { key: 'D', text: 'Meminta maaf terlebih dulu, lalu bertanya detail permasalahan pelanggan.' },
    ],
  },
]

const TOTAL_QUESTIONS = 40
const TOTAL_TIME = 40 * 60 // 40 minutes in seconds

// ── Toggle switch (visual only) ───────────────────────────────────────────────
function ToggleSwitch({ on, onChange }) {
  return (
    <Box
      onClick={() => onChange(!on)}
      sx={{
        width: 40, height: 20, borderRadius: 10, cursor: 'pointer', position: 'relative',
        bgcolor: on ? '#016699' : '#E03131', transition: 'background-color 0.2s',
        flexShrink: 0,
      }}
    >
      <Box sx={{
        position: 'absolute', top: 2, left: on ? 22 : 2,
        width: 16, height: 16, borderRadius: '50%', bgcolor: 'white',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      }} />
    </Box>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Soal() {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME)
  const [toggleOn, setToggleOn] = useState(false)
  const [camPanelOpen, setCamPanelOpen] = useState(true)

  // Camera hooks
  const {
    faceDetected, hasMultipleFaces, faceCount,
    videoRef: laptopVideoRef, startCamera, stopCamera,
  } = useFaceDetection({ enabled: true })

  const {
    connectionStatus: hpStatus, remoteVideoRef: hpVideoRef,
    simulateConnect: hpSimulateConnect, simulateDisconnect: hpSimulateDisconnect,
  } = useSecondaryCamera({ enabled: true })
  const hpConnected = hpStatus === 'connected'

  const question = QUESTIONS[currentIndex] ?? QUESTIONS[0]
  const progress = ((currentIndex) / TOTAL_QUESTIONS) * 100
  const timeProgress = ((TOTAL_TIME - timeLeft) / TOTAL_TIME) * 100

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => (t <= 1 ? 0 : t - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // ── Fullscreen ─────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {})
    return () => { document.exitFullscreen?.().catch(() => {}) }
  }, [])

  // ── Laptop camera ──────────────────────────────────────────────────────────
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  function formatTime(s) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  function handleSelect(key) {
    setAnswers(a => ({ ...a, [question.id]: key }))
  }

  function handleNext() {
    if (currentIndex < QUESTIONS.length - 1) setCurrentIndex(i => i + 1)
  }

  function handlePrev() {
    if (currentIndex > 0) setCurrentIndex(i => i - 1)
  }

  const selectedKey = answers[question.id]

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'white', overflow: 'hidden' }}>

      {/* ── Top progress bar ─────────────────────────────────────────────── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        px: '60px', height: 36, flexShrink: 0, bgcolor: 'white',
        borderBottom: '1px solid #DEE2E6',
      }}>
        <AccessTime sx={{ fontSize: 20, color: '#016699', flexShrink: 0 }} />
        {/* Track */}
        <Box sx={{ flex: 1, height: 10, borderRadius: 20, bgcolor: '#E7F5FF', position: 'relative', overflow: 'hidden' }}>
          <Box sx={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${timeProgress}%`,
            bgcolor: '#016699', borderRadius: 20,
            transition: 'width 1s linear',
          }} />
        </Box>
        <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#212529', flexShrink: 0, minWidth: 52, textAlign: 'right' }}>
          - {formatTime(timeLeft)}
        </Typography>
      </Box>

      {/* ── Split content ─────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left — Stimulus */}
        <Box sx={{
          flex: 1, bgcolor: 'white', overflow: 'auto',
          display: 'flex', flexDirection: 'column',
          px: '60px', py: '49px',
          borderRight: '1px solid #DEE2E6',
        }}>
          {/* Counter */}
          <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#495057', mb: 3 }}>
            {question.counter}
          </Typography>

          {/* Stimulus body */}
          <Box sx={{ maxWidth: 601 }}>
            {question.stimulus.map((block, i) => {
              if (block.type === 'spacer') return <Box key={i} sx={{ height: 16 }} />
              if (block.type === 'text') return (
                <Typography key={i} sx={{
                  fontSize: 20, color: '#212529', lineHeight: 1.6,
                  textAlign: 'justify', whiteSpace: 'pre-wrap', mb: 1.5,
                }}>
                  {block.content}
                </Typography>
              )
              if (block.type === 'ol') return (
                <Box key={i} component="ol" sx={{ pl: 3, m: 0, mb: 1.5 }}>
                  {block.items.map((item, j) => (
                    <Typography key={j} component="li" sx={{ fontSize: 20, color: '#212529', lineHeight: 1.6, mb: 0.5 }}>
                      {item}
                    </Typography>
                  ))}
                </Box>
              )
              return null
            })}
          </Box>
        </Box>

        {/* Right — Answer options */}
        <Box sx={{
          flex: 1, bgcolor: '#F8F9FA', overflow: 'auto',
          display: 'flex', flexDirection: 'column',
          px: '48px', pt: '170px', pb: '32px',
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', maxWidth: 624 }}>
            {question.options.map(opt => {
              const isSelected = selectedKey === opt.key
              return (
                <Box
                  key={opt.key}
                  onClick={() => handleSelect(opt.key)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    bgcolor: isSelected ? '#E7F5FF' : 'white',
                    border: '1px solid',
                    borderColor: isSelected ? '#016699' : '#D6E6FF',
                    borderRadius: '8px', p: '12px', minHeight: 64,
                    cursor: 'pointer',
                    boxShadow: '0px 4px 12px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s',
                    '&:hover': { borderColor: '#016699', bgcolor: '#f0f8fc' },
                  }}
                >
                  {/* Letter box */}
                  <Box sx={{
                    width: 32, height: 32, flexShrink: 0,
                    border: '1px solid',
                    borderColor: isSelected ? '#016699' : '#016699',
                    bgcolor: isSelected ? '#016699' : 'transparent',
                    borderRadius: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Typography sx={{
                      fontSize: 16, fontWeight: 400, lineHeight: 1,
                      color: isSelected ? 'white' : '#016699',
                    }}>
                      {opt.key}
                    </Typography>
                  </Box>

                  {/* Answer text */}
                  <Typography sx={{ fontSize: 14, color: '#212529', flex: 1, lineHeight: 1.4 }}>
                    {opt.text}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        </Box>

      </Box>

      {/* ── Bottom toolbar ────────────────────────────────────────────────── */}
      <Box sx={{
        height: 56, px: '60px', flexShrink: 0,
        borderTop: '1px solid #DEE2E6', bgcolor: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Left controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title="Menu">
            <IconButton size="small" sx={{ color: '#495057' }}>
              <Menu sx={{ fontSize: 24 }} />
            </IconButton>
          </Tooltip>

          {/* Vertical divider */}
          <Box sx={{ width: '1px', height: 23, bgcolor: '#DEE2E6', mx: 0.5 }} />

          <ToggleSwitch on={toggleOn} onChange={setToggleOn} />

          <Tooltip title="Informasi">
            <IconButton size="small" sx={{ color: '#495057' }}>
              <InfoOutlined sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Right nav */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {/* Prev */}
          <IconButton
            onClick={handlePrev}
            disabled={currentIndex === 0}
            sx={{
              width: 36, height: 36,
              border: '1px solid #016699',
              borderRadius: '50%',
              color: '#016699',
              '&:hover': { bgcolor: '#E7F5FF' },
              '&.Mui-disabled': { borderColor: '#CED4DA', color: '#CED4DA' },
            }}
          >
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>

          {/* Next */}
          <IconButton
            onClick={handleNext}
            sx={{
              width: 36, height: 36,
              bgcolor: '#016699', borderRadius: '50%', color: 'white',
              '&:hover': { bgcolor: '#005589' },
            }}
          >
            <ArrowForward sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Box>

      {/* ── Floating camera monitor ───────────────────────────────────────── */}
      <Box sx={{
        position: 'fixed', bottom: 72, right: 20, zIndex: 999,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75,
      }}>
        <Tooltip title={camPanelOpen ? 'Sembunyikan kamera' : 'Tampilkan kamera'} placement="left">
          <Box
            onClick={() => setCamPanelOpen(o => !o)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer',
              bgcolor: 'rgba(15,20,30,0.75)', backdropFilter: 'blur(8px)',
              borderRadius: 10, px: 1.25, py: 0.5,
              border: '1px solid rgba(255,255,255,0.1)',
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
                <Box sx={{
                  position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%',
                  bgcolor: faceDetected && !hasMultipleFaces ? '#22c55e' : '#ef4444',
                  boxShadow: `0 0 6px ${faceDetected && !hasMultipleFaces ? '#22c55e' : '#ef4444'}`,
                  animation: 'soal-blink 2s infinite',
                }} />
              </Box>
              <Typography sx={{ fontSize: 9.5, color: 'rgba(0,0,0,0.4)', fontWeight: 600, letterSpacing: 0.3 }}>
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
                  : <PhoneAndroid sx={{ fontSize: 22, color: 'rgba(255,255,255,0.15)' }} />
                }
                <Box sx={{
                  position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%',
                  bgcolor: hpConnected ? '#22c55e' : 'rgba(255,255,255,0.2)',
                  boxShadow: hpConnected ? '0 0 6px #22c55e' : 'none',
                  animation: hpConnected ? 'soal-blink 2s infinite' : 'none',
                }} />
                {!hpConnected && (
                  <Box onClick={hpSimulateConnect} sx={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s',
                    cursor: 'pointer', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { opacity: 1 },
                  }}>
                    <Typography sx={{ fontSize: 9, color: 'white', fontWeight: 700,
                      bgcolor: 'rgba(245,158,11,0.85)', borderRadius: 1, px: 0.75, py: 0.25 }}>
                      Simulasi
                    </Typography>
                  </Box>
                )}
                {hpConnected && (
                  <Box onClick={hpSimulateDisconnect} sx={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s',
                    cursor: 'pointer', bgcolor: 'rgba(0,0,0,0.45)', '&:hover': { opacity: 1 },
                  }}>
                    <Typography sx={{ fontSize: 9, color: 'white', fontWeight: 700,
                      bgcolor: 'rgba(239,68,68,0.8)', borderRadius: 1, px: 0.75, py: 0.25 }}>
                      Putuskan
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography sx={{ fontSize: 9.5, color: 'rgba(0,0,0,0.4)', fontWeight: 600, letterSpacing: 0.3 }}>
                HP
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <style>{`@keyframes soal-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </Box>
  )
}
