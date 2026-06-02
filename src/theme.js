import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: { main: '#1a3c6b', light: '#4d6fa5', dark: '#0d2244' },
    secondary: { main: '#F57C00', light: '#ffad42', dark: '#bb4d00' },
    background: { default: '#F5F5F5' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
  },
})

export default theme
