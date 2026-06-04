import { AppBar, Toolbar, Box, Typography, Chip } from '@mui/material'
import { School } from '@mui/icons-material'

export default function Navbar() {
  return (
    <AppBar position="fixed" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', zIndex: 1200 }}>
      <Toolbar sx={{ minHeight: 56, px: { xs: 2, md: 3 }, justifyContent: 'space-between' }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <School sx={{ color: 'primary.main', fontSize: 24 }} />
          <Typography variant="subtitle1" fontWeight={700} color="primary.main">
            Talentlytica
          </Typography>
        </Box>

        {/* Language switcher */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label="ID" size="small" color="primary" sx={{ fontWeight: 700, cursor: 'pointer' }} />
          <Chip label="EN" size="small" variant="outlined" sx={{ fontWeight: 700, cursor: 'pointer', color: 'text.secondary' }} />
        </Box>
      </Toolbar>
    </AppBar>
  )
}
