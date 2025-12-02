import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student',
    firstName: '',
    lastName: '',
    studentId: '',
    facultyId: '',
    adminId: '',
    department: '',
    program: '',
    designation: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Prepare data based on role
      const registrationData = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        firstName: formData.firstName,
        lastName: formData.lastName,
        department: formData.department
      };

      // Add role-specific fields
      if (formData.role === 'student') {
        if (!formData.studentId || !formData.program) {
          setError('Student ID and Program are required for students');
          setLoading(false);
          return;
        }
        registrationData.studentId = formData.studentId;
        registrationData.program = formData.program;
        registrationData.dateOfBirth = new Date('2000-01-01').toISOString();
        registrationData.enrollmentDate = new Date().toISOString();
      } else if (formData.role === 'faculty') {
        if (!formData.facultyId || !formData.designation) {
          setError('Faculty ID and Designation are required for faculty');
          setLoading(false);
          return;
        }
        registrationData.facultyId = formData.facultyId;
        registrationData.designation = formData.designation;
      } else if (formData.role === 'admin') {
        if (!formData.adminId) {
          setError('Admin ID is required for admins');
          setLoading(false);
          return;
        }
        registrationData.adminId = formData.adminId;
      }

      await authService.register(registrationData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Register
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                label="Role"
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="faculty">Faculty</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="firstName"
              label="First Name"
              value={formData.firstName}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="lastName"
              label="Last Name"
              value={formData.lastName}
              onChange={handleChange}
            />
            {formData.role === 'student' && (
              <TextField
                margin="normal"
                required
                fullWidth
                name="studentId"
                label="Student ID"
                value={formData.studentId}
                onChange={handleChange}
              />
            )}
            {formData.role === 'faculty' && (
              <TextField
                margin="normal"
                required
                fullWidth
                name="facultyId"
                label="Faculty ID"
                value={formData.facultyId}
                onChange={handleChange}
              />
            )}
            {formData.role === 'admin' && (
              <TextField
                margin="normal"
                required
                fullWidth
                name="adminId"
                label="Admin ID"
                value={formData.adminId}
                onChange={handleChange}
              />
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              name="department"
              label="Department"
              value={formData.department}
              onChange={handleChange}
            />
            {formData.role === 'student' && (
              <TextField
                margin="normal"
                required
                fullWidth
                name="program"
                label="Program"
                value={formData.program}
                onChange={handleChange}
              />
            )}
            {formData.role === 'faculty' && (
              <TextField
                margin="normal"
                required
                fullWidth
                name="designation"
                label="Designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="e.g., Professor, Assistant Professor"
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
            <Box textAlign="center">
              <Link href="/login" variant="body2">
                Already have an account? Sign In
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;

