import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Camera, 
  Flashlight, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2,
  FileText,
  Loader2,
  UploadCloud
} from 'lucide-react';
import { AppCustomData, Contact, TransferData } from '../types';
import { playQrBeep } from '../utils/audio';
import { extractRecipientFromReceipt, ExtractedRecipientData } from '../utils/transferReceiptParser';
import { RecipientReceiptModal } from '../components/RecipientReceiptModal';

interface ScanQrCodeScreenProps {
  onGoBack: () => void;
  onScanSuccess: (data: TransferData) => void;
  onAddContact?: (contact: Contact) => void;
  onSelectRecipient?: (contact: Contact, initialAmount?: number) => void;
  appData: AppCustomData;
}

export const ScanQrCodeScreen: React.FC<ScanQrCodeScreenProps> = ({
  onGoBack,
  onScanSuccess,
  onAddContact,
  onSelectRecipient,
  appData,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scannedSuccess, setScannedSuccess] = useState<boolean>(false);
  const [scanErrorTimeout, setScanErrorTimeout] = useState<boolean>(false);

  // Receipt upload state
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [extractedRecipient, setExtractedRecipient] = useState<ExtractedRecipientData | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

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
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => console.warn('Video play warning:', e));
        }
        setHasCameraPermission(true);

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
        name: appData.defaultRecipientName || 'Destinatário QR Code',
        initials: appData.defaultRecipientInitials || 'QR',
        document: appData.defaultRecipientDoc || '00.000.000/0001-00',
        institution: appData.defaultRecipientInstitution || 'Nu Pagamentos S.A.',
        accountType: appData.defaultRecipientAccountType || 'Conta Corrente PJ',
        pixKey: 'qrcode@pix.exemplo.com',
      };

      const transferData: TransferData = {
        recipient,
        amount: appData.defaultTransferAmount || 10.00,
        date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        message: 'Pagamento via QR Code Pix',
      };

      onScanSuccess(transferData);
    }, 600);
  };

  const handleRetryScan = () => {
    setScanErrorTimeout(false);
    setIsScanning(true);
    setScannedSuccess(false);
  };

  // Upload file (PDF or Image receipt)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingReceipt(true);
    setUploadedFileName(file.name);

    try {
      const extracted = await extractRecipientFromReceipt(file);
      setExtractedRecipient(extracted);
      setIsReceiptModalOpen(true);
    } catch (err) {
      console.warn('Receipt parsing error:', err);
      setExtractedRecipient({
        name: 'Destinatário Comprovante',
        initials: 'DC',
        document: '***.000.000-**',
        institution: 'Nu Pagamentos S.A.',
        accountType: 'Conta de pagamentos',
        pixKey: '',
        amount: 0,
      });
      setIsReceiptModalOpen(true);
    } finally {
      setIsProcessingReceipt(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveAndTransfer = (contact: Contact, suggestedAmount?: number) => {
    setIsReceiptModalOpen(false);
    if (onAddContact) {
      onAddContact(contact);
    }

    if (onSelectRecipient) {
      onSelectRecipient(contact, suggestedAmount);
    } else {
      const transferData: TransferData = {
        recipient: contact,
        amount: suggestedAmount && suggestedAmount > 0 ? suggestedAmount : (appData.defaultTransferAmount || 10.00),
        date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        message: 'Transferência Pix',
      };
      onScanSuccess(transferData);
    }
  };

  const handleSaveOnly = (contact: Contact) => {
    setIsReceiptModalOpen(false);
    if (onAddContact) {
      onAddContact(contact);
    }
    onGoBack();
  };

  return (
    <div className="relative w-full h-full bg-black select-none font-sans overflow-hidden flex flex-col justify-between">
      {/* Hidden file input for PDF / Photo receipt */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/*"
        onChange={handleFileUpload}
        className="hidden"
        id="input-qr-screen-file"
      />

      {/* 1. Camera Feed or Fallback Background */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black flex items-center justify-center">
        {hasCameraPermission === false ? (
          <div className="flex flex-col items-center justify-center px-6 text-center text-white/70">
            <Camera className="w-12 h-12 mb-3 text-neutral-500 stroke-[1.5]" />
            <p className="text-xs max-w-xs leading-relaxed mb-4">
              Câmera desativada ou não autorizada. Você pode extrair um comprovante ou QR Code em PDF ou imagem.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-full bg-[#820AD1] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
            >
              <FileText className="w-4 h-4" />
              <span>Extrair comprovante (PDF / Foto)</span>
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* 2. Shaded Overlay with Center Camera Cutout */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 0 1000px rgba(0, 0, 0, 0.65)',
          clipPath: 'polygon(0% 0%, 0% 100%, 15% 100%, 15% 32%, 85% 32%, 85% 68%, 15% 68%, 15% 100%, 100% 100%, 100% 0%)',
        }}
      />

      {/* Viewport Frame with Scanner Reticle */}
      <div 
        className="absolute z-10 pointer-events-none rounded-3xl"
        style={{
          top: '32%',
          left: '15%',
          width: '70%',
          height: '36%',
          border: '1.5px solid rgba(255, 255, 255, 0.45)',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        }}
      >
        {/* Reticle Corners */}
        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-xl" />
        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-xl" />
        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-xl" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-xl" />

        {/* Laser Scanning Line Animation */}
        {isScanning && !scanErrorTimeout && !scannedSuccess && (
          <motion.div
            animate={{
              top: ['5%', '90%', '5%'],
              opacity: [0.3, 0.85, 0.3],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-[#a855f7] to-transparent shadow-[0_0_8px_#a855f7]"
          />
        )}

        {/* Success Checkmark Feedback */}
        <AnimatePresence>
          {scannedSuccess && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#820AD1]/40 backdrop-blur-xs rounded-3xl flex items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full bg-white text-[#820AD1] flex items-center justify-center shadow-xl">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Top Header: Back Button and Torch with Safe Area */}
      <div 
        className="relative z-20 px-5 flex items-center justify-between"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 3.25rem)' }}
      >
        <button
          id="btn-back-scan-qr"
          onClick={onGoBack}
          className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center transition-transform active:scale-90 cursor-pointer text-white drop-shadow-md bg-black/35 hover:bg-black/50"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-8 h-8 stroke-[2.4]" />
        </button>

        <div className="flex items-center gap-2">
          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-md ${
                isTorchOn ? 'bg-amber-400 text-neutral-950' : 'bg-black/35 text-white backdrop-blur-md hover:bg-black/50'
              }`}
              title="Lanterna"
            >
              <Flashlight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Instructions above Cutout */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-6 -mt-2 pointer-events-none">
        <div className="w-8 h-8 mb-2 flex items-center justify-center text-white drop-shadow-md">
          <Camera className="w-6 h-6 stroke-[1.9]" />
        </div>
        <p className="text-sm sm:text-[15px] font-medium text-white max-w-[280px] leading-snug drop-shadow-md">
          Aponte a câmera para o QR Code.
        </p>
      </div>

      {/* 5. Center Viewport Spacer */}
      <div className="relative z-20 flex-1" />

      {/* 6. Bottom Spacer */}
      <div className="relative z-20 pb-8 px-6 flex flex-col items-center gap-2" />

      {/* 7. Error Modal after 30 Seconds Timeout */}
      <AnimatePresence>
        {scanErrorTimeout && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
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

              <p className="text-sm text-neutral-600 mb-5 leading-relaxed">
                O tempo limite de leitura expirou. Você pode tentar novamente ou extrair os dados de um comprovante em PDF ou foto.
              </p>

              <div className="w-full flex flex-col gap-2.5">
                <button
                  type="button"
                  id="btn-upload-receipt-fallback"
                  onClick={() => {
                    setScanErrorTimeout(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full py-3.5 bg-[#820AD1] hover:bg-[#6d08af] active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Extrair comprovante Pix (PDF/Foto)</span>
                </button>

                <button
                  type="button"
                  id="btn-retry-scan-qr"
                  onClick={handleRetryScan}
                  className="w-full py-2.5 text-neutral-700 hover:text-neutral-900 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
                  Tentar novamente com a câmera
                </button>

                <button
                  type="button"
                  id="btn-cancel-scan-qr"
                  onClick={onGoBack}
                  className="w-full py-2 text-neutral-500 hover:text-neutral-700 font-medium text-xs transition-colors cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Recipient Receipt Extracted Modal */}
      <RecipientReceiptModal
        isOpen={isReceiptModalOpen}
        extractedData={extractedRecipient}
        fileName={uploadedFileName}
        onClose={() => setIsReceiptModalOpen(false)}
        onSaveAndTransfer={handleSaveAndTransfer}
        onSaveOnly={handleSaveOnly}
      />
    </div>
  );
};
