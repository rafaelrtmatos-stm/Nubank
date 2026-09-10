import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Share2, 
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  Copy,
  Image as ImageIcon,
  Loader2,
  X
} from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { TransferData, AppCustomData } from '../types';

interface ReceiptScreenProps {
  transferData: TransferData;
  appData: AppCustomData;
  onGoHome: () => void;
}

export const ReceiptScreen: React.FC<ReceiptScreenProps> = ({
  transferData,
  appData,
  onGoHome,
}) => {
  const { recipient, amount } = transferData;
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [generatedImgUrl, setGeneratedImgUrl] = useState<string | null>(null);
  const receiptCardRef = useRef<HTMLDivElement>(null);

  // Generate realistic Nubank Pix EndToEndId / Transaction ID
  const [transactionId] = useState(() => {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(16).substring(2, 10);
    const randomHex2 = Math.random().toString(16).substring(2, 12);
    return `E18236120${datePart}2215s${randomHex}${randomHex2}`.substring(0, 36);
  });

  // Current formatted timestamp (e.g., "27 AGO 2026 - 19:15:45")
  const formattedDateTime = (() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const time = now.toTimeString().split(' ')[0];
    return `${day} ${month} ${year} - ${time}`;
  })();

  // Formatted Amount
  const formattedAmount = amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const isBillPayment = transferData?.isBillPayment || false;

  // Payer (Origem) info from appData registered in system
  const payerName = isBillPayment
    ? (appData.userName || 'TITULAR DA CONTA')
    : (appData.companyName || appData.userName || 'TITULAR DA CONTA');
  const payerInstitution = 'NU PAGAMENTOS - IP';
  const payerAgency = appData.agency || '0001';
  const payerAccount = appData.accountNumber || '00000000-0';
  const payerCnpj = appData.cnpj?.replace(/\D/g, '') || '';
  const payerCpfMasked = appData.cnpj ? appData.cnpj : '***.000.000-**';

  // Recipient (Destino / Beneficiário) info from recipient searched/selected
  const destName = recipient.name || (isBillPayment ? 'Concessionária de Energia S.A.' : 'Destinatário Pix');
  const destPixKey = recipient.pixKey || '';
  const destInstitution = recipient.institution || 'NU PAGAMENTOS - IP';
  const destAgency = recipient.agency || '0001';
  const destAccount = recipient.account || '00000000-0';
  const destAccountType = recipient.accountType || (isBillPayment ? 'Conta corrente' : 'Conta de pagamentos');
  const destDocument = recipient.document || '00.000.000/0001-00';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Generate Image from the DOM element
  const generateReceiptImage = async (): Promise<string | null> => {
    if (!receiptCardRef.current) return null;
    try {
      setIsGenerating(true);
      const dataUrl = await toPng(receiptCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        skipFonts: true,
        fontEmbedCSS: '',
      });
      setGeneratedImgUrl(dataUrl);
      return dataUrl;
    } catch (err) {
      console.error('Erro ao gerar imagem do comprovante:', err);
      showToast('Não foi possível gerar a imagem');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Share (Web Share API with file or download fallback)
  const handleShare = async () => {
    try {
      setIsGenerating(true);
      const imgDataUrl = await generateReceiptImage();
      if (!imgDataUrl || !receiptCardRef.current) {
        setIsGenerating(false);
        return;
      }

      // Try native sharing if supported
      if (navigator.share) {
        try {
          const blob = await toBlob(receiptCardRef.current, {
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            skipFonts: true,
            fontEmbedCSS: '',
          });
          if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'comprovante-pix.png', { type: 'image/png' })] })) {
            const file = new File([blob], `comprovante-pix-${Date.now()}.png`, { type: 'image/png' });
            await navigator.share({
              title: 'Comprovante Pix Nubank',
              text: `Comprovante de transferência Pix de ${formattedAmount} para ${destName}`,
              files: [file],
            });
            showToast('Comprovante compartilhado!');
            return;
          }
        } catch (shareErr) {
          // If user cancels or permission denied, fall back to share modal
          console.log('Share API fallthrough or canceled', shareErr);
        }
      }

      // Open visual share modal with download & image options
      setShowShareModal(true);
    } catch (e) {
      console.error(e);
      setShowShareModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Download directly as PNG image
  const handleDownloadImage = async () => {
    let url = generatedImgUrl;
    if (!url) {
      url = await generateReceiptImage();
    }
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprovante-pix-${destName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Imagem do comprovante baixada!');
    }
  };

  // Copy plain text receipt
  const handleCopyText = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `COMPROVANTE DE TRANSFERÊNCIA PIX - NUBANK\n` +
        `Data: ${formattedDateTime}\n` +
        `Valor: ${formattedAmount}\n` +
        `Tipo: Pix\n` +
        `ID da transação: ${transactionId}\n\n` +
        `DESTINO:\n` +
        `Nome: ${destName}\n` +
        `Instituição: ${destInstitution}\n` +
        `Agência: ${destAgency} | Conta: ${destAccount}\n\n` +
        `ORIGEM:\n` +
        `Nome: ${payerName}\n` +
        `Instituição: ${payerInstitution}\n` +
        `Agência: ${payerAgency} | Conta: ${payerAccount}\n` +
        `CNPJ: ${payerCnpj}`
      );
      showToast('Texto do comprovante copiado!');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white select-none text-neutral-900 font-sans overflow-hidden relative">
      {/* Top Action Bar with Safe Area */}
      <div 
        className="px-4 pb-3 flex items-center justify-between shrink-0 border-b border-neutral-100 bg-white z-10"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 2.75rem)' }}
      >
        <button
          id="btn-receipt-back"
          onClick={onGoHome}
          className="w-11 h-11 -ml-1 rounded-full flex items-center justify-center text-neutral-800 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer"
          aria-label="Voltar para o início"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
        </button>

        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Comprovante
        </span>

        <button
          id="btn-share-receipt"
          onClick={handleShare}
          disabled={isGenerating}
          className="w-11 h-11 -mr-1 rounded-full flex items-center justify-center text-neutral-800 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          aria-label="Compartilhar imagem do comprovante"
          title="Compartilhar ou Baixar Imagem"
        >
          {isGenerating ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#820AD1]" />
          ) : (
            <Share2 className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Main Scrollable Receipt Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Printable / Capturable Container */}
        <div ref={receiptCardRef} className="bg-white">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="px-6 pt-6 pb-2"
          >
            {/* Header with Nu Logo + Verified Badge */}
            <div className="flex items-center gap-1.5 mb-6">
              <div className="flex items-center">
                <img src="/nu-logo.png" alt="Nubank" className="w-7 h-7 rounded-md" />
              </div>
              <div className="w-4 h-4 rounded-full bg-neutral-700 text-white flex items-center justify-center -mt-1 ml-0.5">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            </div>

            {/* Title and Date */}
            <h1 className="text-[21px] sm:text-[23px] font-bold text-neutral-900 tracking-tight leading-tight">
              {isBillPayment ? 'Comprovante de pagamento' : 'Comprovante de transferência'}
            </h1>
            <p className="text-[13px] text-neutral-500 font-medium mt-1 mb-8">
              {transferData?.receiptDateFormatted || formattedDateTime}
            </p>

            {/* Summary Section */}
            {isBillPayment ? (
              <div className="space-y-4 text-[14px]">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-900 font-normal">Valor</span>
                  <span className="text-neutral-900 font-normal text-right">{formattedAmount}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-neutral-900 font-normal">Tipo de pagamento</span>
                  <span className="text-neutral-900 font-normal text-right">Boleto</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-neutral-900 font-normal">Vencimento</span>
                  <span className="text-neutral-900 font-normal text-right">
                    {transferData?.dueDate || '20.07.2026'}
                  </span>
                </div>

                <div className="flex justify-between items-start pt-1">
                  <span className="text-neutral-900 font-normal shrink-0">Código identificador</span>
                  <span className="text-neutral-900 font-normal text-right text-xs max-w-[200px] sm:max-w-[220px] break-all leading-relaxed font-mono">
                    {transferData?.identifierCode || 'BOLETO33733841850847025'}
                  </span>
                </div>

                {transferData?.nossoNumero && (
                  <div className="flex justify-between items-start pt-1">
                    <span className="text-neutral-900 font-normal shrink-0">Nosso número</span>
                    <span className="text-neutral-900 font-normal text-right text-xs max-w-[200px] sm:max-w-[220px] break-all leading-relaxed font-mono">
                      {transferData.nossoNumero}
                    </span>
                  </div>
                )}

                {transferData?.barcodeNumber && (
                  <div className="flex justify-between items-start pt-1">
                    <span className="text-neutral-900 font-normal shrink-0">Código de barras</span>
                    <span className="text-neutral-900 font-normal text-right text-xs max-w-[200px] sm:max-w-[220px] break-all leading-relaxed font-mono">
                      {transferData.barcodeNumber}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-start pt-1">
                  <span className="text-neutral-900 font-normal shrink-0">Descrição original</span>
                  <span className="text-neutral-900 font-normal text-right text-xs max-w-[200px] sm:max-w-[220px] leading-relaxed">
                    {transferData?.originalDescription || `Venc: ${transferData?.dueDate || '20.07.2026'} - ${formattedAmount}`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-[14px]">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-900 font-normal">Valor</span>
                  <span className="text-neutral-900 font-normal text-right">{formattedAmount}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-neutral-900 font-normal">Tipo de transferência</span>
                  <span className="text-neutral-900 font-normal text-right">Pix</span>
                </div>

                <div className="flex justify-between items-start pt-1">
                  <span className="text-neutral-900 font-normal shrink-0">ID da transação</span>
                  <span className="text-neutral-900 font-normal text-right text-xs max-w-[200px] sm:max-w-[220px] break-all leading-relaxed font-mono">
                    {transactionId}
                  </span>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-neutral-100 my-7" />

            {/* Section: Destino / Beneficiário */}
            <div className="space-y-4">
              <h2 className="text-[13px] font-medium text-neutral-600">
                {isBillPayment ? 'Beneficiário' : 'Destino'}
              </h2>

              <div className="space-y-4 text-[14px]">
                <div className="flex justify-between items-start">
                  <span className="text-neutral-900 font-normal shrink-0">Nome</span>
                  <span className="text-neutral-900 font-normal text-right max-w-[210px] leading-snug">
                    {destName}
                  </span>
                </div>

                {isBillPayment ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-900 font-normal">CNPJ</span>
                      <span className="text-neutral-900 font-normal text-right font-mono text-xs">
                        {destDocument}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-neutral-900 font-normal">Instituição</span>
                      <span className="text-neutral-900 font-normal text-right uppercase">
                        {destInstitution}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-900 font-normal">Instituição</span>
                      <span className="text-neutral-900 font-normal text-right uppercase">
                        {destInstitution}
                      </span>
                    </div>

                    {destPixKey && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-900 font-normal">Chave Pix</span>
                        <span className="text-neutral-900 font-normal text-right font-mono text-xs">
                          {destPixKey}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-neutral-900 font-normal">Agência</span>
                      <span className="text-neutral-900 font-normal text-right">
                        {destAgency}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-neutral-900 font-normal">Conta</span>
                      <span className="text-neutral-900 font-normal text-right">
                        {destAccount}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-neutral-900 font-normal">Tipo de conta</span>
                      <span className="text-neutral-900 font-normal text-right">
                        {destAccountType}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-neutral-100 my-7" />

            {/* Section: Origem */}
            <div className="space-y-4 pb-6">
              <h2 className="text-[13px] font-medium text-neutral-600">
                Origem
              </h2>

              <div className="space-y-4 text-[14px]">
                <div className="flex justify-between items-start">
                  <span className="text-neutral-900 font-normal shrink-0">Nome</span>
                  <span className="text-neutral-900 font-normal text-right max-w-[210px] uppercase leading-snug">
                    {payerName}
                  </span>
                </div>

                {isBillPayment ? (
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-900 font-normal">CPF</span>
                    <span className="text-neutral-900 font-normal text-right">
                      {payerCpfMasked}
                    </span>
                  </div>
                ) : null}

                <div className="flex justify-between items-center">
                  <span className="text-neutral-900 font-normal">Instituição</span>
                  <span className="text-neutral-900 font-normal text-right uppercase">
                    {payerInstitution}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-neutral-900 font-normal">Agência</span>
                  <span className="text-neutral-900 font-normal text-right">
                    {payerAgency}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-neutral-900 font-normal">Conta</span>
                  <span className="text-neutral-900 font-normal text-right">
                    {payerAccount}
                  </span>
                </div>

                {!isBillPayment ? (
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-900 font-normal">CNPJ</span>
                    <span className="text-neutral-900 font-normal text-right">
                      {payerCnpj}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>

          {/* Gray Legal & Support Footer Section */}
          <div className="bg-[#f5f5f5] p-6 pt-5 space-y-3">
            <p className="text-[12px] font-semibold text-neutral-900 leading-tight">
              Nu Pagamentos S.A. - Instituição de Pagamento
            </p>
            <p className="text-[12px] font-bold text-neutral-900 leading-tight">
              CNPJ 18.236.120/0001-58
            </p>

            <div className="pt-2">
              <p className="text-[12px] font-bold text-neutral-900 leading-tight">
                ID da transação:
              </p>
              <p className="text-[12px] font-bold text-neutral-900 break-all leading-tight font-mono">
                {transactionId}
              </p>
              <p className="text-[12px] text-neutral-500 mt-1.5 leading-snug">
                Estamos aqui para ajudar se você tiver alguma dúvida.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => alert("Abrindo canais de atendimento e suporte Nu...")}
                className="text-[13px] font-bold text-[#820AD1] hover:underline flex items-center gap-1.5 cursor-pointer py-1"
              >
                <span>Me ajuda</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="pt-3">
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Ouvidoria: 0800 887 0463 ou demais canais em nubank.com.br/contatos#ouvidoria (Atendimento das 8h às 18h em dias úteis).
              </p>
            </div>
          </div>
        </div>

        {/* Action Button to Share or Return Home */}
        <div className="p-6 bg-white border-t border-neutral-100 space-y-3">
          <button
            id="btn-generate-image-share"
            onClick={handleShare}
            disabled={isGenerating}
            className="w-full py-4 rounded-full bg-[#820AD1] hover:bg-[#7008b4] active:scale-[0.98] text-white font-semibold text-sm transition-all cursor-pointer shadow-md shadow-purple-900/10 text-center flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando imagem...</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Compartilhar comprovante em imagem</span>
              </>
            )}
          </button>

          <button
            id="btn-receipt-finish"
            onClick={onGoHome}
            className="w-full py-3.5 rounded-full bg-neutral-100 hover:bg-neutral-200 active:scale-[0.98] text-neutral-800 font-semibold text-sm transition-all cursor-pointer text-center"
          >
            Voltar para o início
          </button>
        </div>
      </div>

      {/* Share / Export Image Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 max-h-[90vh] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <h3 className="text-base font-bold text-neutral-900">
                  Compartilhar comprovante
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview of Generated Image */}
              {generatedImgUrl && (
                <div className="my-4 max-h-56 overflow-y-auto rounded-2xl border border-neutral-200 shadow-inner p-2 bg-neutral-50 flex justify-center">
                  <img
                    src={generatedImgUrl}
                    alt="Comprovante Pix Nubank"
                    className="max-h-52 w-auto object-contain rounded-lg shadow-sm"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleDownloadImage}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#820AD1] hover:bg-[#7008b4] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar imagem (PNG)</span>
                </button>

                <button
                  onClick={handleCopyText}
                  className="w-full py-3 px-4 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copiar dados em texto</span>
                </button>

                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full py-2.5 text-center text-xs font-semibold text-neutral-500 hover:text-neutral-900 cursor-pointer mt-1"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-xs px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 z-50 font-medium whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
