import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './theme'
import Login from './pages/Login'
import MyDevices from './pages/MyDevices'
import DeviceSetup from './pages/DeviceSetup'
import Assessment from './pages/Assessment'
import ShareScreen from './pages/ShareScreen'
import Soal from './pages/Soal'
import PhoneCamera from './pages/PhoneCamera'
import PhoneCameraShowcase from './pages/PhoneCameraShowcase'

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
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
      </BrowserRouter>
    </ThemeProvider>
  )
}
