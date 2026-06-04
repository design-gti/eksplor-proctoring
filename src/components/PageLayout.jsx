import { Box, Toolbar } from '@mui/material'
import Navbar from './Navbar'

/**
 * Wraps page content with a fixed Navbar + proper top padding.
 * Usage: <PageLayout><YourPageContent /></PageLayout>
 */
export default function PageLayout({ children, hideNavbar = false }) {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      {!hideNavbar && <Navbar />}
      {!hideNavbar && <Toolbar sx={{ minHeight: '56px !important' }} />}
      {children}
    </Box>
  )
}
