import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Teachers from './components/Teachers';
import Classes from './components/Classes';
import Payments from './components/Payments';
import Curriculum from './components/Curriculum';
import CurriculumDetail from './components/CurriculumDetail';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/curriculum" element={<Curriculum />} />
            <Route path="/curriculum/:curriculumId" element={<CurriculumDetail />} />
            <Route path="/schedules" element={<div>Schedules - Coming Soon</div>} />
            <Route path="/test-scores" element={<div>Test Scores - Coming Soon</div>} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
