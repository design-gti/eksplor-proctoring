import { useState } from 'react'
import {
  Box, Card, CardContent, Typography, TextField, Button,
  InputAdornment, IconButton, Alert, CircularProgress, Divider, Avatar
} from '@mui/material'
import {
  Visibility, VisibilityOff, Lock, Person, School, ArrowForward
} from '@mui/icons-material'
import { alpha } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const theme = useTheme()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const bgGradient = `
    radial-gradient(circle at top right, ${alpha(theme.palette.primary.light, 0.2)} 0%, transparent 60%),
    radial-gradient(circle at bottom left, ${alpha(theme.palette.secondary.light, 0.2)} 0%, transparent 60%)
  `

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.username || !form.password) {
      setError('Username dan password wajib diisi.')
      return
    }
    setLoading(true)
    // Simulate auth — replace with real API call
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)

    // Mock: any credentials work for demo
    if (form.password.length < 4) {
      setError('Username atau password salah.')
      return
    }
    navigate('/my-devices')
  }

  return (
    <Box sx={{
      minHeight: '100vh', background: bgGradient, bgcolor: 'background.default',
      display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2
    }}>
      <Card sx={{
        maxWidth: 420, width: '100%', borderRadius: 4,
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
      }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          {/* Logo / Brand */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar sx={{
              width: 64, height: 64, mx: 'auto', mb: 2,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }}>
              <School sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h5" fontWeight={700} sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Online Assessment
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Masuk untuk memulai assessment
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Username / Email" name="username"
              value={form.username} onChange={handleChange}
              autoComplete="username" autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" fontSize="small" />
                  </InputAdornment>
                )
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="Password" name="password" type={showPassword ? 'text' : 'password'}
              value={form.password} onChange={handleChange}
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword(v => !v)} edge="end">
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit" variant="contained" fullWidth size="large"
              endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}
              disabled={loading}
              sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: 15 }}
            >
              {loading ? 'Memverifikasi...' : 'Masuk'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.disabled">Informasi</Typography>
          </Divider>

          <Box sx={{ bgcolor: alpha(theme.palette.info.main, 0.06), borderRadius: 2, p: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Gunakan username dan password yang diberikan oleh penyelenggara assessment. Hubungi admin jika mengalami kendala login.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
