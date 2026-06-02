import { useEffect, useRef, useState } from 'react'
import { Box, Typography, CircularProgress, Chip, Alert, Button } from '@mui/material'
import {
  CameraAlt, CheckCircle, Error as ErrorIcon, NoPhotography, PhoneAndroid, Warning
} from '@mui/icons-material'
import { alpha } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'

// Status: 'idle' | 'requesting-camera' | 'connecting' | 'connected' | 'error' | 'permission-denied'

export default function PhoneCamera() {
  const theme = useTheme()
  const localVideoRef = useRef(null)
  const peerRef = useRef(null)
  const streamRef = useRef(null)
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const peerId = new URLSearchParams(window.location.search).get('peer')

  useEffect(() => {
    if (!peerId) { setStatus('idle'); return }
    connectToDesktop()
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      peerRef.current?.destroy()
    }
  }, [])

  async function connectToDesktop() {
    setStatus('requesting-camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      setStatus('connecting')
      const { Peer } = await import('peerjs')
      const peer = new Peer()
      peerRef.current = peer

      peer.on('open', () => {
        const call = peer.call(peerId, stream)
        call.on('stream', () => setStatus('connected'))
        call.on('close', () => setStatus('error'))
        call.on('error', () => { setStatus('error'); setErrorMsg('Koneksi terputus.') })
        // Set connected after short delay if no stream event (desktop already answered)
        setTimeout(() => {
          setStatus(s => s === 'connecting' ? 'connected' : s)
        }, 3000)
      })

      peer.on('error', (err) => {
        setStatus('error')
        setErrorMsg(
          err.type === 'peer-unavailable'
            ? 'Komputer tidak ditemukan. Pastikan halaman DeviceSetup terbuka di komputer.'
            : `Error: ${err.type}`
        )
      })
    } catch (e) {
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setStatus('permission-denied')
      } else {
        setStatus('error')
        setErrorMsg(e.message)
      }
    }
  }

  const bgColor = status === 'connected' ? '#000' : theme.palette.grey[900]

  return (
    <Box sx={{
      minHeight: '100dvh', bgcolor: bgColor, display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Top bar */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5, zIndex: 10,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
        position: 'absolute', top: 0, left: 0, right: 0,
      }}>
        <PhoneAndroid sx={{ color: 'white', fontSize: 20 }} />
        <Typography variant="body2" fontWeight={700} color="white">
          Kamera HP — Proctoring
        </Typography>
      </Box>

      {/* Camera video (fills screen) */}
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          display: status === 'connected' || status === 'connecting' || status === 'requesting-camera' ? 'block' : 'none',
        }}
      />

      {/* Overlay for non-connected states */}
      {status !== 'connected' && (
        <Box sx={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 3, px: 3,
          position: 'relative', zIndex: 5,
        }}>
          {status === 'idle' && (
            <>
              <ErrorIcon sx={{ fontSize: 64, color: 'error.light' }} />
              <Typography color="white" variant="h6" textAlign="center">Link Tidak Valid</Typography>
              <Typography color="grey.400" variant="body2" textAlign="center">
                Scan ulang QR code dari halaman DeviceSetup di komputer.
              </Typography>
            </>
          )}

          {status === 'requesting-camera' && (
            <>
              <CameraAlt sx={{ fontSize: 64, color: 'grey.400' }} />
              <Typography color="white" variant="h6" textAlign="center">Mengakses Kamera...</Typography>
              <Typography color="grey.400" variant="body2" textAlign="center">
                Izinkan akses kamera saat browser meminta izin.
              </Typography>
            </>
          )}

          {status === 'connecting' && (
            <>
              <CircularProgress size={56} sx={{ color: 'secondary.main' }} />
              <Typography color="white" variant="h6" textAlign="center">Menghubungkan ke Komputer...</Typography>
              <Typography color="grey.400" variant="body2" textAlign="center">
                Pastikan halaman DeviceSetup terbuka di komputer Anda.
              </Typography>
            </>
          )}

          {status === 'permission-denied' && (
            <>
              <NoPhotography sx={{ fontSize: 64, color: 'error.light' }} />
              <Typography color="white" variant="h6" textAlign="center">Izin Kamera Ditolak</Typography>
              <Typography color="grey.400" variant="body2" textAlign="center">
                Buka Pengaturan browser, aktifkan izin kamera, lalu muat ulang halaman ini.
              </Typography>
              <Button variant="outlined" color="secondary" onClick={() => window.location.reload()}>
                Coba Lagi
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <ErrorIcon sx={{ fontSize: 64, color: 'error.light' }} />
              <Typography color="white" variant="h6" textAlign="center">Koneksi Gagal</Typography>
              <Typography color="grey.400" variant="body2" textAlign="center">
                {errorMsg || 'Terjadi kesalahan. Coba scan ulang QR code.'}
              </Typography>
              <Button variant="outlined" color="secondary" onClick={() => window.location.reload()}>
                Coba Lagi
              </Button>
            </>
          )}
        </Box>
      )}

      {/* Bottom overlay — always visible when connected */}
      <Box sx={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
        px: 2, py: 3, display: 'flex', flexDirection: 'column', gap: 1.5,
        alignItems: 'center',
      }}>
        {status === 'connected' && (
          <>
            <Chip
              icon={<CheckCircle />}
              label="Streaming ke komputer"
              color="success"
              sx={{ fontWeight: 700 }}
            />
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              bgcolor: alpha('#000', 0.5), borderRadius: 2, px: 2, py: 1,
            }}>
              <Warning sx={{ color: 'warning.main', fontSize: 18 }} />
              <Typography variant="caption" color="white">
                Jangan tutup halaman ini selama assessment berlangsung
              </Typography>
            </Box>
          </>
        )}

        {(status === 'connecting' || status === 'requesting-camera') && (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            bgcolor: alpha('#000', 0.5), borderRadius: 2, px: 2, py: 1,
          }}>
            <Warning sx={{ color: 'warning.main', fontSize: 18 }} />
            <Typography variant="caption" color="white">
              Jangan tutup halaman ini
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
