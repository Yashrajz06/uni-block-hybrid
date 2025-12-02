import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Card,
  CardContent
} from '@mui/material';
import { Verified, Assignment, Add, Delete } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { adminService } from '../services/adminService';

const COLORS = ['#4caf50', '#ff9800', '#f44336', '#2196f3'];

const AdminDashboard = () => {
  const [pendingTranscripts, setPendingTranscripts] = useState([]);
  const [openCertDialog, setOpenCertDialog] = useState(false);
  const [openTranscriptDialog, setOpenTranscriptDialog] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [certForm, setCertForm] = useState({
    studentId: '',
    type: 'degree',
    title: '',
    description: ''
  });
  const [courses, setCourses] = useState([
    { courseCode: '', courseName: '', credits: '', grade: '', semester: '', year: new Date().getFullYear() }
  ]);
  const [analytics, setAnalytics] = useState(null);
  const [verificationStats, setVerificationStats] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transcriptsRes, analyticsRes, verificationRes] = await Promise.all([
        adminService.getPendingTranscripts(),
        adminService.getAnalyticsOverview(),
        adminService.getVerificationStats()
      ]);
      setPendingTranscripts(transcriptsRes.data);
      setAnalytics(analyticsRes.data);
      setVerificationStats(verificationRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleIssueCertificate = async () => {
    try {
      await adminService.issueCertificate(certForm);
      setSnackbar({ open: true, message: 'Certificate issued successfully', severity: 'success' });
      setOpenCertDialog(false);
      setCertForm({ studentId: '', type: 'degree', title: '', description: '' });
      loadData();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error issuing certificate', severity: 'error' });
    }
  };

  const handleOpenTranscriptDialog = (transcript) => {
    setSelectedTranscript(transcript);
    setCourses(transcript.courses && transcript.courses.length > 0 
      ? transcript.courses 
      : [{ courseCode: '', courseName: '', credits: '', grade: '', semester: '', year: new Date().getFullYear() }]
    );
    setOpenTranscriptDialog(true);
  };

  const handleIssueTranscript = async () => {
    try {
      await adminService.issueTranscript({
        requestId: selectedTranscript.requestId,
        courses: courses.filter(c => c.courseCode && c.courseName)
      });
      setSnackbar({ open: true, message: 'Transcript issued successfully', severity: 'success' });
      setOpenTranscriptDialog(false);
      setSelectedTranscript(null);
      loadData();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error issuing transcript', severity: 'error' });
    }
  };

  const addCourse = () => {
    setCourses([...courses, { courseCode: '', courseName: '', credits: '', grade: '', semester: '', year: new Date().getFullYear() }]);
  };

  const transcriptStatusData = analytics
    ? Object.entries(analytics.transcriptStatus || {}).map(([status, count], index) => ({
        name: status,
        value: count
      }))
    : [];

  const userGrowthData = analytics
    ? analytics.userGrowth.map(item => ({
        name: `${item.month}/${String(item.year).toString().slice(-2)}`,
        count: item.count
      }))
    : [];

  const verificationTrendData = verificationStats
    ? verificationStats.last30Days.map(d => ({ name: d.date.slice(5), count: d.count }))
    : [];

  const removeCourse = (index) => {
    setCourses(courses.filter((_, i) => i !== index));
  };

  const updateCourse = (index, field, value) => {
    const updated = [...courses];
    updated[index][field] = value;
    setCourses(updated);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Stats cards */}
      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Total Students</Typography>
              <Typography variant="h5">{analytics?.totalStudents ?? '—'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Total Faculty</Typography>
              <Typography variant="h5">{analytics?.totalFaculty ?? '—'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Transcripts</Typography>
              <Typography variant="h5">{analytics?.totalTranscripts ?? '—'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Certificates</Typography>
              <Typography variant="h5">{analytics?.totalCertificates ?? '—'}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 2 }}>
        {/* Transcript status pie chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant="h6" gutterBottom>
              Transcript Status Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={transcriptStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {transcriptStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* User growth line chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant="h6" gutterBottom>
              User Growth (Last Months)
            </Typography>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#1976d2" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 2 }}>
        {/* Verification stats */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Verifications Today</Typography>
              <Typography variant="h4">{verificationStats?.today ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 260 }}>
            <Typography variant="h6" gutterBottom>
              Verification Activity (Last 30 Days)
            </Typography>
            <ResponsiveContainer width="100%" height="80%">
              <LineChart data={verificationTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#4caf50" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Certificate Management */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Certificate Management</Typography>
              <Button
                variant="contained"
                startIcon={<Verified />}
                onClick={() => setOpenCertDialog(true)}
              >
                Issue Certificate
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Transcript Management */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
              Transcript Management
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Request ID</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>CGPA</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingTranscripts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No transcript requests
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingTranscripts.map((transcript) => (
                      <TableRow key={transcript._id}>
                        <TableCell>{transcript.requestId}</TableCell>
                        <TableCell>
                          {transcript.studentId?.firstName} {transcript.studentId?.lastName}
                        </TableCell>
                        <TableCell>{transcript.studentId?.studentId}</TableCell>
                        <TableCell>
                          <Chip
                            label={transcript.status}
                            color={
                              transcript.status === 'approved' ? 'success' :
                              transcript.status === 'pending' ? 'warning' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{transcript.cgpa || transcript.studentId?.cgpa || 'N/A'}</TableCell>
                        <TableCell>
                          {transcript.status === 'approved' && (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Assignment />}
                              onClick={() => handleOpenTranscriptDialog(transcript)}
                            >
                              Issue Transcript
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Issue Certificate Dialog */}
      <Dialog open={openCertDialog} onClose={() => setOpenCertDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Issue Certificate</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Student ID"
                value={certForm.studentId}
                onChange={(e) => setCertForm({ ...certForm, studentId: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  value={certForm.type}
                  onChange={(e) => setCertForm({ ...certForm, type: e.target.value })}
                  label="Type"
                >
                  <MenuItem value="degree">Degree</MenuItem>
                  <MenuItem value="diploma">Diploma</MenuItem>
                  <MenuItem value="certificate">Certificate</MenuItem>
                  <MenuItem value="achievement">Achievement</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={certForm.title}
                onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={certForm.description}
                onChange={(e) => setCertForm({ ...certForm, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCertDialog(false)}>Cancel</Button>
          <Button onClick={handleIssueCertificate} variant="contained">
            Issue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Issue Transcript Dialog */}
      <Dialog open={openTranscriptDialog} onClose={() => setOpenTranscriptDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Issue Transcript - {selectedTranscript?.requestId}
        </DialogTitle>
        <DialogContent>
          {selectedTranscript && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Student: {selectedTranscript.studentId?.firstName} {selectedTranscript.studentId?.lastName}</Typography>
              <Typography variant="subtitle2">Student ID: {selectedTranscript.studentId?.studentId}</Typography>
              <Typography variant="subtitle2">CGPA: {selectedTranscript.cgpa || selectedTranscript.studentId?.cgpa || 'N/A'}</Typography>
            </Box>
          )}
          <Typography variant="h6" gutterBottom>Courses</Typography>
          {courses.map((course, index) => (
            <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Course Code"
                  value={course.courseCode}
                  onChange={(e) => updateCourse(index, 'courseCode', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Course Name"
                  value={course.courseName}
                  onChange={(e) => updateCourse(index, 'courseName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                <TextField
                  fullWidth
                  size="small"
                  label="Credits"
                  type="number"
                  value={course.credits}
                  onChange={(e) => updateCourse(index, 'credits', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                <TextField
                  fullWidth
                  size="small"
                  label="Grade"
                  value={course.grade}
                  onChange={(e) => updateCourse(index, 'grade', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                <TextField
                  fullWidth
                  size="small"
                  label="Sem"
                  type="number"
                  value={course.semester}
                  onChange={(e) => updateCourse(index, 'semester', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                <TextField
                  fullWidth
                  size="small"
                  label="Year"
                  type="number"
                  value={course.year}
                  onChange={(e) => updateCourse(index, 'year', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                <IconButton onClick={() => removeCourse(index)} color="error">
                  <Delete />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          <Button startIcon={<Add />} onClick={addCourse} variant="outlined" size="small">
            Add Course
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTranscriptDialog(false)}>Cancel</Button>
          <Button onClick={handleIssueTranscript} variant="contained">
            Issue Transcript
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDashboard;
