import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: { main: '#005589', light: '#3d80aa', dark: '#003d63' },
    secondary: { main: '#F57C00', light: '#ffad42', dark: '#bb4d00' },
    background: { default: '#f0f6fa' }, // very light teal tint — matches reference
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
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: '#ffffff', color: '#333333' },
      },
    },
  },
})

export default theme
