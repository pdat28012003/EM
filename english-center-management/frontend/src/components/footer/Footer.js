import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  IconButton,
  Divider
} from '@mui/material';
import {
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
  LocationOn,
  Phone,
  Email,
  AccessTime
} from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        color: 'white',
        mt: 'auto',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h5" sx={{ mb: 2, color: '#ecf0f1' }}>
              English Center
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#bdc3c7', lineHeight: 1.6 }}>
              Your gateway to mastering English language skills with professional guidance and modern teaching methods.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <IconButton
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    backgroundColor: '#3498db',
                    transform: 'translateY(-3px)'
                  }
                }}
              >
                <Facebook />
              </IconButton>
              <IconButton
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    backgroundColor: '#3498db',
                    transform: 'translateY(-3px)'
                  }
                }}
              >
                <Twitter />
              </IconButton>
              <IconButton
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    backgroundColor: '#3498db',
                    transform: 'translateY(-3px)'
                  }
                }}
              >
                <Instagram />
              </IconButton>
              <IconButton
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    backgroundColor: '#3498db',
                    transform: 'translateY(-3px)'
                  }
                }}
              >
                <LinkedIn />
              </IconButton>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ mb: 2, color: '#3498db', textTransform: 'uppercase', letterSpacing: 1 }}>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography
                component={Link}
                to="/"
                sx={{
                  color: '#bdc3c7',
                  textDecoration: 'none',
                  '&:hover': { color: '#3498db' }
                }}
              >
                Home
              </Typography>
              <Typography
                component={Link}
                to="/courses"
                sx={{
                  color: '#bdc3c7',
                  textDecoration: 'none',
                  '&:hover': { color: '#3498db' }
                }}
              >
                Courses
              </Typography>
              <Typography
                component={Link}
                to="/about"
                sx={{
                  color: '#bdc3c7',
                  textDecoration: 'none',
                  '&:hover': { color: '#3498db' }
                }}
              >
                About Us
              </Typography>
              <Typography
                component={Link}
                to="/contact"
                sx={{
                  color: '#bdc3c7',
                  textDecoration: 'none',
                  '&:hover': { color: '#3498db' }
                }}
              >
                Contact
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ mb: 2, color: '#3498db', textTransform: 'uppercase', letterSpacing: 1 }}>
              Services
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography
                component={Link}
                to="/courses/general-english"
                sx={{
                  color: '#bdc3c7',
                  textDecoration: 'none',
                  '&:hover': { color: '#3498db' }
                }}
              >
                General English
              </Typography>
              <Typography
                component={Link}
                to="/courses/business-english"
                sx={{
                  color: '#bdc3c7',
                  textDecoration: 'none',
                  '&:hover': { color: '#3498db' }
                }}
              >
                Business English
              </Typography>
              <Typography
                component={Link}
                to="/courses/exam-preparation"
                sx={{
                  color: '#bdc3c7',
                  textDecoration: 'none',
                  '&:hover': { color: '#3498db' }
                }}
              >
                Exam Preparation
              </Typography>
              <Typography
                component={Link}
                to="/courses/conversation"
                sx={{
                  color: '#bdc3c7',
                  textDecoration: 'none',
                  '&:hover': { color: '#3498db' }
                }}
              >
                Conversation Classes
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ mb: 2, color: '#3498db', textTransform: 'uppercase', letterSpacing: 1 }}>
              Contact Info
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ color: '#3498db', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: '#bdc3c7' }}>
                  123 Education Street, City, Country
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ color: '#3498db', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: '#bdc3c7' }}>
                  +1 (555) 123-4567
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ color: '#3498db', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: '#bdc3c7' }}>
                  info@englishcenter.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime sx={{ color: '#3498db', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: '#bdc3c7' }}>
                  Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-5PM
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', my: 3 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#bdc3c7' }}>
            © 2024 English Center. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Typography
              component={Link}
              to="/privacy"
              sx={{
                color: '#bdc3c7',
                textDecoration: 'none',
                '&:hover': { color: '#3498db' }
              }}
            >
              Privacy Policy
            </Typography>
            <Typography
              component={Link}
              to="/terms"
              sx={{
                color: '#bdc3c7',
                textDecoration: 'none',
                '&:hover': { color: '#3498db' }
              }}
            >
              Terms of Service
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
