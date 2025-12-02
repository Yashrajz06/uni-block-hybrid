import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip
} from '@mui/material';
import { Assignment, Verified, Download } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { studentService } from '../services/studentService';
import { Alert, Snackbar } from '@mui/material';

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, transcriptsRes, certificatesRes] = await Promise.all([
        studentService.getProfile(),
        studentService.getTranscripts(),
        studentService.getCertificates()
      ]);
      setProfile(profileRes.data);
      setTranscripts(transcriptsRes.data);
      setCertificates(certificatesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const cgpaTrendData = transcripts
    .filter((t) => typeof t.cgpa === 'number')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((t, index) => ({
      name: t.issuedAt ? new Date(t.issuedAt).toLocaleDateString() : `Req ${index + 1}`,
      cgpa: t.cgpa
    }));

  const totalTranscripts = transcripts.length;
  const issuedTranscripts = transcripts.filter((t) => t.status === 'issued').length;
  const totalCertificates = certificates.length;

  const handleRequestTranscript = async () => {
    try {
      await studentService.requestTranscript();
      setSnackbar({ open: true, message: 'Transcript request submitted successfully', severity: 'success' });
      loadData();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error requesting transcript', severity: 'error' });
    }
  };

  const handleDownloadCredential = async (type, id) => {
    try {
      const response = await studentService.downloadCredential(type, id);
      // Handle download
      console.log('Credential data:', response.data);
    } catch (error) {
      console.error('Error downloading credential:', error);
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Student Dashboard
      </Typography>

      {/* Quick stats */}
      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Current CGPA</Typography>
              <Typography variant="h5">{profile?.cgpa ?? 'N/A'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Transcripts</Typography>
              <Typography variant="h5">{issuedTranscripts}/{totalTranscripts}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Certificates</Typography>
              <Typography variant="h5">{totalCertificates}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Profile Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Summary
              </Typography>
              {profile && (
                <>
                  <Typography><strong>Name:</strong> {profile.firstName} {profile.lastName}</Typography>
                  <Typography><strong>Student ID:</strong> {profile.studentId}</Typography>
                  <Typography><strong>Department:</strong> {profile.department}</Typography>
                  <Typography><strong>Program:</strong> {profile.program}</Typography>
                  <Typography><strong>CGPA:</strong> {profile.cgpa}</Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions + CGPA Trend */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<Assignment />}
                  onClick={handleRequestTranscript}
                >
                  Request Transcript
                </Button>
                <Button variant="outlined" startIcon={<Verified />}>
                  View Certificates
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                CGPA Trend
              </Typography>
              {cgpaTrendData.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  CGPA history will appear here once transcripts are issued.
                </Typography>
              ) : (
                <Box sx={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cgpaTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="cgpa" stroke="#1976d2" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Transcripts */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Transcripts
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Request ID</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Issued Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transcripts.map((transcript) => (
                    <TableRow key={transcript._id}>
                      <TableCell>{transcript.requestId}</TableCell>
                      <TableCell>
                        <Chip
                          label={transcript.status}
                          color={
                            transcript.status === 'issued' ? 'success' :
                            transcript.status === 'pending' ? 'warning' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {transcript.issuedAt ? new Date(transcript.issuedAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        {transcript.status === 'issued' && (
                          <>
                            <Button
                              size="small"
                              onClick={() => handleDownloadCredential('transcript', transcript.requestId)}
                            >
                              <Download />
                            </Button>
                            {transcript.qrCode && (
                              <Box sx={{ mt: 1 }}>
                                <img src={transcript.qrCode} alt="QR Code" style={{ width: 64, height: 64 }} />
                              </Box>
                            )}
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Certificates */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Certificates
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Certificate ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Issued Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {certificates.map((cert) => (
                    <TableRow key={cert._id}>
                      <TableCell>{cert.certificateId}</TableCell>
                      <TableCell>{cert.type}</TableCell>
                      <TableCell>{cert.title}</TableCell>
                      <TableCell>{new Date(cert.issuedDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => handleDownloadCredential('certificate', cert.certificateId)}
                        >
                          <Download />
                        </Button>
                        {cert.qrCode && (
                          <Box sx={{ mt: 1 }}>
                            <img src={cert.qrCode} alt="QR Code" style={{ width: 64, height: 64 }} />
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

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

export default StudentDashboard;

