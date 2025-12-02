import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { Close, CameraAlt } from '@mui/icons-material';

const QRScanner = ({ onScan, onClose, open }) => {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Only stop scanning when dialog closes or component unmounts.
    // Starting is triggered explicitly by the user via the "Start Camera" button
    // to ensure the DOM element with id="qr-reader" exists.
    if (!open && scanning) {
      stopScanning();
    }

    return () => {
      if (scanning) {
        stopScanning();
      }
    };
  }, [open, scanning]);

  const startScanning = async () => {
    try {
      const container = document.getElementById('qr-reader');
      if (!container) {
        throw new Error('HTML Element with id=qr-reader not found');
      }
      const html5QrCode = new Html5Qrcode('qr-reader');
      
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          handleScanSuccess(decodedText, html5QrCode);
        },
        (errorMessage) => {
          // Ignore scanning errors
        }
      );

      scannerRef.current = html5QrCode;
      setScanning(true);
      setError('');
    } catch (err) {
      setError('Failed to start camera. Please ensure camera permissions are granted.');
      console.error('QR Scanner error:', err);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
      setScanning(false);
    }
  };

  const handleScanSuccess = (decodedText, html5QrCode) => {
    stopScanning();
    if (onScan) {
      onScan(decodedText);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Scan QR Code
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: 'center' }}>
          <Box
            id="qr-reader"
            sx={{
              width: '100%',
              minHeight: '300px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#000',
              borderRadius: 1
            }}
          />
          {error && (
            <Box sx={{ mt: 2, color: 'error.main' }}>
              {error}
            </Box>
          )}
          {!scanning && !error && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<CameraAlt />}
                onClick={startScanning}
              >
                Start Camera
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default QRScanner;


