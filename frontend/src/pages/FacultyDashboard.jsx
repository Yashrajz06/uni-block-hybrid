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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Snackbar
} from '@mui/material';
import { Upload, CheckCircle, Close, Assignment } from '@mui/icons-material';
import { facultyService } from '../services/facultyService';

const FacultyDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [grades, setGrades] = useState([]);
  const [pendingTranscripts, setPendingTranscripts] = useState([]);
  const [openGradeDialog, setOpenGradeDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [gradeForm, setGradeForm] = useState({
    studentId: '',
    courseCode: '',
    courseName: '',
    letterGrade: '',
    credits: '',
    semester: '',
    year: new Date().getFullYear()
  });

  const pendingCount = pendingTranscripts.length;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, transcriptsRes] = await Promise.all([
        facultyService.getProfile(),
        facultyService.getPendingTranscripts()
      ]);
      setProfile(profileRes.data);
      setPendingTranscripts(transcriptsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleUploadGrade = async () => {
    try {
      await facultyService.uploadGrade(gradeForm);
      setSnackbar({ open: true, message: 'Grade uploaded successfully', severity: 'success' });
      setOpenGradeDialog(false);
      setGradeForm({
        studentId: '',
        courseCode: '',
        courseName: '',
        letterGrade: '',
        credits: '',
        semester: '',
        year: new Date().getFullYear()
      });
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error uploading grade', severity: 'error' });
    }
  };

  const handleApproveTranscript = async (requestId) => {
    try {
      await facultyService.approveTranscript(requestId);
      setSnackbar({ open: true, message: 'Transcript approved successfully', severity: 'success' });
      loadData();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error approving transcript', severity: 'error' });
    }
  };

  const handleRejectTranscript = async (requestId) => {
    try {
      await facultyService.rejectTranscript(requestId);
      setSnackbar({ open: true, message: 'Transcript rejected', severity: 'success' });
      loadData();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error rejecting transcript', severity: 'error' });
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Faculty Dashboard
      </Typography>

      {/* Quick stats */}
      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Pending Transcript Requests</Typography>
            <Typography variant="h5">{pendingCount}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Pending Transcript Requests */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
                Pending Transcript Requests
              </Typography>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Request ID</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Requested Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingTranscripts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No pending transcript requests
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
                        <TableCell>{transcript.studentId?.department}</TableCell>
                        <TableCell>
                          <Chip
                            label={transcript.status}
                            color={transcript.status === 'pending' ? 'warning' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(transcript.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {transcript.status === 'pending' && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircle />}
                                onClick={() => handleApproveTranscript(transcript.requestId)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<Close />}
                                onClick={() => handleRejectTranscript(transcript.requestId)}
                              >
                                Reject
                              </Button>
                            </Box>
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

        {/* Grade Management */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Grade Management</Typography>
              <Button
                variant="contained"
                startIcon={<Upload />}
                onClick={() => setOpenGradeDialog(true)}
              >
                Upload Grade
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Course Code</TableCell>
                    <TableCell>Course Name</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Credits</TableCell>
                    <TableCell>Semester</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {grades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No grades uploaded yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    grades.map((grade, index) => (
                      <TableRow key={index}>
                        <TableCell>{grade.studentId}</TableCell>
                        <TableCell>{grade.courseCode}</TableCell>
                        <TableCell>{grade.courseName}</TableCell>
                        <TableCell>{grade.letterGrade}</TableCell>
                        <TableCell>{grade.credits}</TableCell>
                        <TableCell>{grade.semester}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Upload Grade Dialog */}
      <Dialog open={openGradeDialog} onClose={() => setOpenGradeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Grade</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Student ID"
                value={gradeForm.studentId}
                onChange={(e) => setGradeForm({ ...gradeForm, studentId: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Code"
                value={gradeForm.courseCode}
                onChange={(e) => setGradeForm({ ...gradeForm, courseCode: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Name"
                value={gradeForm.courseName}
                onChange={(e) => setGradeForm({ ...gradeForm, courseName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Letter Grade</InputLabel>
                <Select
                  value={gradeForm.letterGrade}
                  onChange={(e) => setGradeForm({ ...gradeForm, letterGrade: e.target.value })}
                  label="Letter Grade"
                >
                  <MenuItem value="A+">A+</MenuItem>
                  <MenuItem value="A">A</MenuItem>
                  <MenuItem value="A-">A-</MenuItem>
                  <MenuItem value="B+">B+</MenuItem>
                  <MenuItem value="B">B</MenuItem>
                  <MenuItem value="B-">B-</MenuItem>
                  <MenuItem value="C+">C+</MenuItem>
                  <MenuItem value="C">C</MenuItem>
                  <MenuItem value="F">F</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Credits"
                type="number"
                value={gradeForm.credits}
                onChange={(e) => setGradeForm({ ...gradeForm, credits: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Semester"
                type="number"
                value={gradeForm.semester}
                onChange={(e) => setGradeForm({ ...gradeForm, semester: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                value={gradeForm.year}
                onChange={(e) => setGradeForm({ ...gradeForm, year: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGradeDialog(false)}>Cancel</Button>
          <Button onClick={handleUploadGrade} variant="contained" startIcon={<CheckCircle />}>
            Upload
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

export default FacultyDashboard;
