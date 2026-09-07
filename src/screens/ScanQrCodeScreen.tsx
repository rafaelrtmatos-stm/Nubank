import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Camera, Flashlight, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AppCustomData, Contact, TransferData } from '../types';
import { playQrBeep } from '../utils/audio';

interface ScanQrCodeScreenProps {
  onGoBack: () => void;
  onScanSuccess: (data: TransferData) => void;
  appData: AppCustomData;
}

export const ScanQrCodeScreen: React.FC<ScanQrCodeScreenProps> = ({
  onGoBack,
  onScanSuccess,
  appData,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scannedSuccess, setScannedSuccess] = useState<boolean>(false);
  const [scanErrorTimeout, setScanErrorTimeout] = useState<boolean>(false);

  // Initialize Camera Stream
  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Câmera não suportada neste navegador.');
        }

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => console.warn('Video play warning:', err));
        }

        // Check if flashlight/torch is available
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = (videoTrack.getCapabilities && videoTrack.getCapabilities()) as any;
          if (capabilities && capabilities.torch) {
            setHasTorch(true);
          }
        }
      } catch (err: any) {
        console.warn('Camera access error:', err);
        if (active) {
          setHasCameraPermission(false);
        }
      }
    }

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // 30-Second Timeout for QR Code Reading Error
  useEffect(() => {
    if (!isScanning || scannedSuccess || scanErrorTimeout) return;

    const timer = setTimeout(() => {
      setIsScanning(false);
      setScanErrorTimeout(true);
      if (navigator.vibrate) {
        navigator.vibrate([80, 50, 80]);
      }
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [isScanning, scannedSuccess, scanErrorTimeout]);

  // Native BarcodeDetector loop if supported
  useEffect(() => {
    let scanInterval: any = null;
    let isDetecting = false;

    if (hasCameraPermission && 'BarcodeDetector' in window) {
      try {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'data_matrix'],
        });

        scanInterval = setInterval(async () => {
          if (!videoRef.current || !isScanning || isDetecting || scanErrorTimeout) return;
          if (videoRef.current.readyState < 2) return;

          try {
            isDetecting = true;
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              handleDetectedCode(code);
            }
          } catch (e) {
            // Frame skip
          } finally {
            isDetecting = false;
          }
        }, 400);
      } catch (e) {
        console.warn('BarcodeDetector init error:', e);
      }
    }

    return () => {
      if (scanInterval) clearInterval(scanInterval);
    };
  }, [hasCameraPermission, isScanning, scanErrorTimeout]);

  // Flashlight toggle
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextState = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
      } catch (e) {
        console.warn('Torch toggle error:', e);
      }
    }
  };

  // Success handler for QR detection
  const handleDetectedCode = (rawCode?: string) => {
    if (!isScanning || scanErrorTimeout) return;
    setIsScanning(false);
    setScannedSuccess(true);

    playQrBeep();
    if (navigator.vibrate) {
      navigator.vibrate(80);
    }

    // Prepare transfer data based on app recipient or scanned code
    setTimeout(() => {
      const recipient: Contact = {
        id: 'qr-scanned',
        name: appData.defaultRecipientName || 'Papelaria & Suprimentos Modelo Ltda',
        initials: appData.defaultRecipientInitials || 'PM',
        document: appData.defaultRecipientDoc || '00.123.456/0001-00',
        institution: appData.defaultRecipientInstitution || 'Nu Pagamentos S.A.',
        accountType: appData.defaultRecipientAccountType || 'Conta Corrente PJ',
        pixKey: 'financeiro@papelariamodelo.exemplo.com',
      };

      const transferData: TransferData = {
        recipient,
        amount: appData.defaultTransferAmount || 340.50,
        date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        message: 'Pagamento via QR Code Pix (Simulação Fictícia)',
      };

      onScanSuccess(transferData);
    }, 600);
  };

  // Retry after timeout error
  const handleRetryScan = () => {
    setScanErrorTimeout(false);
    setIsScanning(true);
  };

  return (
    <div className="relative w-full h-full bg-black select-none overflow-hidden flex flex-col justify-between">
      {/* 1. Live Camera Feed */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-neutral-950">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Fallback ambient visual if camera permissions pending/unsupported */}
        {hasCameraPermission === false && (
          <div className="absolute inset-0 w-full h-full bg-linear-to-b from-stone-400 via-stone-500 to-stone-600 flex items-center justify-center">
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />
          </div>
        )}
      </div>

      {/* 2. Full-Screen Dark Shadow with Center Cutout ("a sombra preenche toda a tela e o meio sem nada") */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden flex items-center justify-center">
        <div
          className={`w-[275px] h-[275px] sm:w-[310px] sm:h-[310px] rounded-[32px] mt-12 transition-all duration-300 ${
            scannedSuccess ? 'scale-105' : ''
          }`}
          style={{
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.68)',
          }}
        >
          {/* Green flash on detection */}
          {scannedSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 rounded-[32px] bg-emerald-500/25 border-2 border-emerald-400 flex items-center justify-center"
            >
              <CheckCircle2 className="w-16 h-16 text-emerald-400 drop-shadow-lg" />
            </motion.div>
          )}
        </div>
      </div>

      {/* 3. Top Header: Back Button and Torch with Safe Area */}
      <div 
        className="relative z-20 px-5 flex items-center justify-between"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 3.25rem)' }}
      >
        <button
          id="btn-back-scan-qr"
          onClick={onGoBack}
          className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center transition-transform active:scale-90 cursor-pointer text-white drop-shadow-md bg-black/25 hover:bg-black/40"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-8 h-8 stroke-[2.4]" />
        </button>

        {hasTorch && (
          <button
            onClick={toggleTorch}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-md ${
              isTorchOn ? 'bg-amber-400 text-neutral-950' : 'bg-white/20 text-white backdrop-blur-md'
            }`}
            title="Lanterna"
          >
            <Flashlight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 4. Instructions above Cutout ("no meio sem nada em cima as bordas sombra preta") */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-6 -mt-2 pointer-events-none">
        <div className="w-8 h-8 mb-2 flex items-center justify-center text-white drop-shadow-md">
          <Camera className="w-6 h-6 stroke-[1.9]" />
        </div>
        <p className="text-sm sm:text-[15px] font-medium text-white max-w-[280px] leading-snug drop-shadow-md">
          Para fazer o pagamento, aponte a câmera para o QR Code.
        </p>
      </div>

      {/* 5. Center Viewport Spacer to let camera shine through without obstruction */}
      <div className="relative z-20 flex-1" />

      {/* 6. Clean Bottom Spacing (no simulation button) */}
      <div className="relative z-20 pb-8 px-6 min-h-[50px]" />

      {/* 7. Error Modal after 30 Seconds Timeout */}
      <AnimatePresence>
        {scanErrorTimeout && (
          <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-neutral-100 flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
              </div>

              <h3 className="text-lg font-bold text-neutral-900 mb-2">
                Não foi possível ler o QR code
              </h3>

              <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
                O tempo limite de leitura expirou. Verifique se o QR code está nítido, bem iluminado e posicionado dentro da área demarcada.
              </p>

              <div className="w-full flex flex-col gap-2.5">
                <button
                  type="button"
                  id="btn-retry-scan-qr"
                  onClick={handleRetryScan}
                  className="w-full py-3.5 bg-[#820AD1] hover:bg-[#6d08af] active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Tentar novamente</span>
                </button>

                <button
                  type="button"
                  id="btn-cancel-scan-qr"
                  onClick={onGoBack}
                  className="w-full py-3 text-neutral-600 hover:text-neutral-900 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Voltar para Área Pix
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

