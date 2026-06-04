import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider, CssBaseline, Toolbar, Box } from '@mui/material'
import theme from './theme'
import Login from './pages/Login'
import MyDevices from './pages/MyDevices'
import DeviceSetup from './pages/DeviceSetup'
import Assessment from './pages/Assessment'
import ShareScreen from './pages/ShareScreen'
import Soal from './pages/Soal'
import PhoneCamera from './pages/PhoneCamera'
import PhoneCameraShowcase from './pages/PhoneCameraShowcase'
import Navbar from './components/Navbar'

// Pages that should NOT show the navbar (phone-only pages)
const NO_NAVBAR_ROUTES = ['/phone-camera', '/phone-showcase']

function AppLayout() {
  const location = useLocation()
  const showNavbar = !NO_NAVBAR_ROUTES.includes(location.pathname)
  return (
    <Box>
      {showNavbar && <Navbar />}
      {showNavbar && <Toolbar sx={{ minHeight: '56px !important' }} />}
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/main" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/my-devices" element={<MyDevices />} />
        <Route path="/deviceSetup" element={<DeviceSetup />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/share-screen" element={<ShareScreen />} />
        <Route path="/soal" element={<Soal />} />
        <Route path="/phone-camera" element={<PhoneCamera />} />
        <Route path="/phone-showcase" element={<PhoneCameraShowcase />} />
      </Routes>
    </Box>
  )
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ThemeProvider>
  )
}
