import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Chip
} from '@mui/material';
import { QrCodeScanner, Search, CheckCircle, Cancel } from '@mui/icons-material';
import { verifyService } from '../services/verifyService';
import QRScanner from '../components/QRScanner';

const VerifierPortal = () => {
  const [verificationId, setVerificationId] = useState('');
  const [qrData, setQrData] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await verifyService.getStats();
        setStats(res.data);
      } catch (e) {
        console.error('Failed to load verification stats', e);
      }
    };
    loadStats();
  }, []);

  const handleVerifyById = async () => {
    if (!verificationId) {
      setError('Please enter a verification ID');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Extract type and id from verification ID
      // Format: "transcript-TRX-..." or "certificate-CERT-..."
      let type = '';
      let id = '';
      
      if (verificationId.startsWith('transcript-')) {
        type = 'transcript';
        id = verificationId.substring('transcript-'.length);
      } else if (verificationId.startsWith('certificate-')) {
        type = 'certificate';
        id = verificationId.substring('certificate-'.length);
      } else {
        setError('Invalid ID format. Use "transcript-..." or "certificate-..."');
        setLoading(false);
        return;
      }
      
      const response = await verifyService.verifyById(type, id, '', '');
      setResult({ ...response.data, credentialType: type, credentialId: id });
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = (scannedData) => {
    setQrData(scannedData);
    setScannerOpen(false);
    handleVerifyByQR(scannedData);
  };

  const handleVerifyByQR = async (data = null) => {
    const dataToVerify = data || qrData;
    if (!dataToVerify) {
      setError('Please enter QR code data or scan a QR code');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await verifyService.verifyByQR(dataToVerify);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
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
            Instant Credential Verification
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Verify blockchain-backed university credentials in seconds using QR code or credential ID.
          </Typography>

          {/* Stats strip */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Verifications Today</Typography>
                  <Typography variant="h5">{stats?.today ?? 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Total Verifications</Typography>
                  <Typography variant="h5">{stats?.total ?? 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Demo Credential</Typography>
                  <Typography variant="body2" component="div" color="text.secondary">
                    Try: <Chip size="small" label="CERT-2024-DEMO-001" />
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* QR Code Verification */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <QrCodeScanner sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Scan QR Code
                  </Typography>
                  <TextField
                    fullWidth
                    label="QR Code Data"
                    multiline
                    rows={4}
                    value={qrData}
                    onChange={(e) => setQrData(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<QrCodeScanner />}
                      onClick={() => setScannerOpen(true)}
                      fullWidth
                    >
                      Scan QR Code
                    </Button>
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleVerifyByQR()}
                    disabled={loading || !qrData}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Verify QR Code'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* ID Verification */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Search sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Verify by ID
                  </Typography>
                  <TextField
                    fullWidth
                    label="Verification ID"
                    value={verificationId}
                    onChange={(e) => setVerificationId(e.target.value)}
                    placeholder="e.g., transcript-TRX-123456"
                    sx={{ mb: 2 }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleVerifyById}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Verify ID'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Verification Result */}
            {result && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Verification Result
                    </Typography>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          {result.verified ? (
                            <CheckCircle color="success" sx={{ fontSize: 64, mb: 1 }} />
                          ) : (
                            <Cancel color="error" sx={{ fontSize: 64, mb: 1 }} />
                          )}
                          <Typography variant="h5" gutterBottom>
                            {result.verified ? 'Credential Verified' : 'Verification Failed'}
                          </Typography>
                          <Box sx={{ position: 'relative', display: 'inline-flex', mt: 1 }}>
                            <CircularProgress
                              variant="determinate"
                              value={Math.max(0, Math.min(100, result.score || 0))}
                              size={80}
                              thickness={4}
                              color={result.verified ? 'success' : 'warning'}
                            />
                            <Box
                              sx={{
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                position: 'absolute',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Typography variant="subtitle1" component="div">
                                {Math.round(result.score || 0)}%
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                            Authenticity Score
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={8}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>Credential Details</Typography>
                          {result.credentialId && (
                            <Typography variant="body2">
                              <strong>ID:</strong> {result.credentialId}
                            </Typography>
                          )}
                          {result.credentialType && (
                            <Typography variant="body2">
                              <strong>Type:</strong> {result.credentialType}
                            </Typography>
                          )}
                        </Box>

                        {result.details && (
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
                            <Card variant="outlined">
                              <CardContent>
                                <Typography variant="subtitle2">Hash Integrity</Typography>
                                <Typography color={result.details.hashMatch ? 'success.main' : 'error.main'}>
                                  {result.details.hashMatch ? 'Verified' : 'Failed'}
                                </Typography>
                              </CardContent>
                            </Card>
                            <Card variant="outlined">
                              <CardContent>
                                <Typography variant="subtitle2">IPFS Document</Typography>
                                <Typography color={result.details.ipfsValid ? 'success.main' : 'error.main'}>
                                  {result.details.ipfsValid ? 'Valid' : 'Missing/Invalid'}
                                </Typography>
                              </CardContent>
                            </Card>
                            <Card variant="outlined">
                              <CardContent>
                                <Typography variant="subtitle2">Signature</Typography>
                                <Typography color={result.details.signatureValid ? 'success.main' : 'error.main'}>
                                  {result.details.signatureValid ? 'Valid' : 'Invalid/Not Present'}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>
      <QRScanner
        open={scannerOpen}
        onScan={handleScanQR}
        onClose={() => setScannerOpen(false)}
      />
    </Container>
  );
};

export default VerifierPortal;

