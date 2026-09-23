import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Search, 
  HelpCircle, 
  Eye, 
  EyeOff, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Barcode, 
  CreditCard, 
  Share2, 
  X, 
  CheckCircle2, 
  Copy, 
  Filter,
  DollarSign,
  Calendar,
  Building2,
  Lock,
  Receipt,
  Dices
} from 'lucide-react';
import { AppCustomData, ScreenName, Transaction, TransferData } from '../types';
import { NuReceiptLogo } from '../components/NuReceiptLogo';

interface ExtratoScreenProps {
  appData: AppCustomData;
  isBalanceVisible: boolean;
  onToggleBalance: () => void;
  onGoBack: () => void;
  onNavigate: (screen: ScreenName) => void;
  onViewReceipt?: (transferData: TransferData) => void;
  onRegenerateTransactions?: () => void;
}

export const ExtratoScreen: React.FC<ExtratoScreenProps> = ({
  appData,
  isBalanceVisible,
  onToggleBalance,
  onGoBack,
  onNavigate,
  onViewReceipt,
  onRegenerateTransactions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'in' | 'out' | 'pix' | 'bill'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const formattedBalance = Number(appData.balance).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  // Filter transactions based on query and filter tab
  const filteredTransactions = useMemo(() => {
    return appData.transactions.filter((tx) => {
      // Filter by type
      if (selectedFilter === 'in' && tx.amount < 0) return false;
      if (selectedFilter === 'out' && tx.amount >= 0) return false;
      if (selectedFilter === 'pix' && !tx.title.toLowerCase().includes('pix') && !tx.subtitle.toLowerCase().includes('pix')) return false;
      if (selectedFilter === 'bill' && !tx.title.toLowerCase().includes('boleto') && !tx.subtitle.toLowerCase().includes('boleto') && tx.type !== 'bill_payment') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = tx.title.toLowerCase().includes(query);
        const matchesSubtitle = tx.subtitle.toLowerCase().includes(query);
        const matchesDate = tx.date.toLowerCase().includes(query);
        const matchesAmount = Math.abs(tx.amount).toString().includes(query);
        if (!matchesTitle && !matchesSubtitle && !matchesDate && !matchesAmount) {
          return false;
        }
      }

      return true;
    });
  }, [appData.transactions, selectedFilter, searchQuery]);

  const handleCopyTransactionInfo = (tx: Transaction) => {
    const text = `Comprovante Nu Empresas\n${tx.title}\n${tx.subtitle}\nValor: R$ ${Math.abs(tx.amount).toFixed(2)}\nData: ${tx.date}\nID: ${tx.id}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    showToast('Dados do comprovante copiados!');
  };

  return (
    <div className="flex flex-col h-full w-full bg-white select-none overflow-y-auto">
      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-60 bg-neutral-900/95 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 backdrop-blur-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar with Safe Area */}
      <div 
        className="bg-white border-b border-neutral-100 px-4 pb-3 sticky top-0 z-30 flex items-center justify-between"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 1rem)' }}
      >
        <button
          id="btn-extrato-back"
          onClick={onGoBack}
          className="w-10 h-10 rounded-full hover:bg-neutral-100 active:scale-95 flex items-center justify-center text-neutral-800 transition-all cursor-pointer"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
        </button>

        <h1 className="text-base font-bold text-neutral-900">
          Conta PJ
        </h1>

        <div className="flex items-center gap-1">
          {onRegenerateTransactions && (
            <button
              onClick={onRegenerateTransactions}
              className="w-10 h-10 rounded-full hover:bg-neutral-100 active:scale-95 flex items-center justify-center text-neutral-800 transition-all cursor-pointer"
              title="Gerar novo extrato aleatório"
              aria-label="Gerar novo extrato aleatório"
            >
              <Dices className="w-5 h-5 text-[#820AD1]" />
            </button>
          )}
          <button
            onClick={onToggleBalance}
            className="w-10 h-10 rounded-full hover:bg-neutral-100 active:scale-95 flex items-center justify-center text-neutral-800 transition-all cursor-pointer"
            aria-label={isBalanceVisible ? "Ocultar saldo" : "Exibir saldo"}
          >
            {isBalanceVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          <button
            onClick={() => alert("Ajuda sobre sua Conta PJ: Suporte 24h via chat ou telefone.")}
            className="w-10 h-10 rounded-full hover:bg-neutral-100 active:scale-95 flex items-center justify-center text-neutral-800 transition-all cursor-pointer"
            aria-label="Ajuda"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Account Balance Header Card */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Saldo disponível
          </span>
        </div>

        <div className="mt-1 flex items-baseline gap-2">
          {isBalanceVisible ? (
            <span className="text-3xl font-extrabold text-neutral-900 tracking-tight">
              {formattedBalance}
            </span>
          ) : (
            <div className="h-9 flex items-center gap-1.5 py-1">
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
            </div>
          )}
        </div>

        <p className="text-[11px] text-neutral-400 mt-1">
          Agência {appData.agency || '0001'} • Conta {appData.accountNumber || '••••••••-•'} • {appData.companyName || 'Conta PJ'}
        </p>

        {/* Dinheiro guardado Card */}
        <div 
          onClick={() => alert("Dinheiro Guardado PJ: seu dinheiro rende 100% do CDI com liquidez diária.")}
          className="mt-4 p-3.5 rounded-2xl bg-[#f5f5f7] hover:bg-[#ebebed] active:scale-[0.99] flex items-center justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-100 text-[#820AD1] flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-900">Dinheiro guardado</p>
              <p className="text-[11px] text-neutral-500">Rendimento a 100% do CDI</p>
            </div>
          </div>
          <span className="text-xs font-bold text-neutral-900">
            {isBalanceVisible ? 'R$ 0,00' : '••••'}
          </span>
        </div>

        {/* Quick Action Pills */}
        <div className="mt-5 grid grid-cols-4 gap-2.5">
          <button
            onClick={() => alert(`Dados para depósito:\nBanco: 260 - Nu Pagamentos S.A.\nAgência: ${appData.agency || '0001'}\nConta: ${appData.accountNumber || '••••••••-•'}\nCNPJ: ${appData.cnpj || 'Não cadastrado'}`)}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-[#f5f5f7] hover:bg-[#ebebed] active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-neutral-900 shadow-2xs">
              <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-[11px] font-semibold text-neutral-800">Depositar</span>
          </button>

          <button
            onClick={() => onNavigate('PaymentOptions')}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-[#f5f5f7] hover:bg-[#ebebed] active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-neutral-900 shadow-2xs">
              <Barcode className="w-5 h-5 text-[#820AD1]" />
            </div>
            <span className="text-[11px] font-semibold text-neutral-800">Pagar</span>
          </button>

          <button
            onClick={() => onNavigate('SelectRecipient')}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-[#f5f5f7] hover:bg-[#ebebed] active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-neutral-900 shadow-2xs">
              <ArrowUpRight className="w-5 h-5 text-[#820AD1]" />
            </div>
            <span className="text-[11px] font-semibold text-neutral-800">Transferir</span>
          </button>

          <button
            onClick={() => onNavigate('AreaPix')}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-[#f5f5f7] hover:bg-[#ebebed] active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-neutral-900 shadow-2xs">
              <DollarSign className="w-5 h-5 text-[#820AD1]" />
            </div>
            <span className="text-[11px] font-semibold text-neutral-800">Área Pix</span>
          </button>
        </div>
      </div>

      <div className="h-2 bg-[#f0f1f5] my-1" />

      {/* Histórico e Extrato Section */}
      <div className="px-5 pt-4 pb-20 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-neutral-900">
            Histórico da conta
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-medium">
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'movimentação' : 'movimentações'}
            </span>
            {onRegenerateTransactions && (
              <button
                onClick={onRegenerateTransactions}
                title="Sortear novas movimentações aleatórias"
                className="flex items-center gap-1 text-[11px] font-semibold text-[#820AD1] bg-purple-50 hover:bg-purple-100 active:scale-95 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Aleatório</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, valor ou data..."
            className="w-full pl-10 pr-9 py-2.5 bg-[#f5f5f7] border-none rounded-xl text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#820AD1]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-5 px-5">
          {[
            { id: 'all', label: 'Tudo' },
            { id: 'in', label: 'Entradas' },
            { id: 'out', label: 'Saídas' },
            { id: 'pix', label: 'Pix' },
            { id: 'bill', label: 'Boletos' },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setSelectedFilter(chip.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                selectedFilter === chip.id
                  ? 'bg-[#820AD1] text-white shadow-xs'
                  : 'bg-[#f5f5f7] text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        <div className="mt-2 space-y-2.5">
          {filteredTransactions.map((tx) => {
            const isNegative = tx.amount < 0;
            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTransaction(tx)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-neutral-50 active:bg-neutral-100 border border-neutral-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isNegative ? 'bg-neutral-100 text-neutral-700' : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {isNegative ? (
                      <ArrowUpRight className="w-5 h-5 stroke-[2]" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5 stroke-[2]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-neutral-900 truncate">
                      {tx.title}
                    </p>
                    <p className="text-[11px] text-neutral-500 truncate">
                      {tx.subtitle}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {tx.date}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-xs sm:text-sm font-bold tracking-tight ${
                      isNegative ? 'text-neutral-900' : 'text-emerald-600'
                    }`}
                  >
                    {isBalanceVisible ? (
                      `${isNegative ? '-' : '+'} ${Math.abs(tx.amount).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}`
                    ) : (
                      '••••••'
                    )}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredTransactions.length === 0 && (
            <div className="py-12 text-center text-neutral-400 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 p-6">
              <p className="text-xs font-medium">Nenhuma transação encontrada para os filtros selecionados.</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setSelectedFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-xs text-[#820AD1] font-semibold underline cursor-pointer"
                >
                  Limpar filtros
                </button>
                {onRegenerateTransactions && (
                  <button
                    onClick={onRegenerateTransactions}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#820AD1] text-white text-xs font-bold rounded-xl active:scale-95 shadow-xs transition-all cursor-pointer"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Gerar Extrato Fictício</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail & Comprovante Bottom Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-[2px]">
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="bg-white rounded-t-[28px] sm:rounded-3xl w-full max-w-md p-6 text-neutral-900 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <NuReceiptLogo size="sm" />
                  <span className="text-sm font-bold text-neutral-900">Comprovante de transação</span>
                </div>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Amount & Title */}
              <div className="py-5 text-center">
                <span
                  className={`text-3xl font-extrabold tracking-tight ${
                    selectedTransaction.amount < 0 ? 'text-neutral-900' : 'text-emerald-600'
                  }`}
                >
                  {selectedTransaction.amount < 0 ? '-' : '+'} R$ {Math.abs(selectedTransaction.amount).toFixed(2).replace('.', ',')}
                </span>
                <h3 className="text-sm font-bold text-neutral-900 mt-1">
                  {selectedTransaction.title}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {selectedTransaction.date}
                </p>
              </div>

              {/* Metadata Card */}
              <div className="bg-[#f5f5f7] rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Destino / Favorecido</span>
                  <span className="font-bold text-neutral-900 text-right">{selectedTransaction.subtitle}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Instituição</span>
                  <span className="font-semibold text-neutral-800">Nu Pagamentos S.A. (260)</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Origem</span>
                  <span className="font-semibold text-neutral-800">{appData.companyName || 'Conta PJ'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Tipo de transação</span>
                  <span className="font-semibold text-neutral-800">
                    {selectedTransaction.type === 'bill_payment' || selectedTransaction.title.toLowerCase().includes('boleto') ? 'Pagamento de boleto' : 'Pix'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
                  <span className="text-neutral-500">ID da Transação</span>
                  <span className="font-mono text-[10px] text-neutral-600 truncate max-w-[170px]">
                    {selectedTransaction.id || 'E18236120202609071936s133d058f09'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 space-y-2.5">
                <button
                  onClick={() => {
                    if (onViewReceipt) {
                      const isBill = selectedTransaction.type === 'bill_payment' || selectedTransaction.category?.toLowerCase().includes('boleto') || selectedTransaction.title.toLowerCase().includes('boleto');
                      onViewReceipt({
                        recipient: selectedTransaction.recipient || {
                          id: selectedTransaction.id,
                          name: selectedTransaction.subtitle.replace(/\s*-\s*(Pix|Boleto).*$/i, '').trim() || (isBill ? 'Beneficiário do Boleto' : 'Destinatário'),
                          initials: selectedTransaction.subtitle.substring(0, 2).toUpperCase() || (isBill ? 'BO' : 'PI'),
                          document: '***.803.262-**',
                          institution: isBill ? 'BANCO DO BRASIL S.A.' : 'NU PAGAMENTOS - IP',
                          accountType: 'Conta corrente',
                          agency: '0001',
                          account: '00000000-0',
                        },
                        amount: Math.abs(selectedTransaction.amount),
                        date: selectedTransaction.date || 'Hoje',
                        isBillPayment: isBill,
                        transactionId: selectedTransaction.id || 'E18236120202609071936s133d058f09',
                        receiptDateFormatted: `${selectedTransaction.date || '07 SET 2026'} - 16:37:03`,
                      });
                      setSelectedTransaction(null);
                    } else {
                      handleCopyTransactionInfo(selectedTransaction);
                    }
                  }}
                  className="w-full py-3.5 bg-[#820AD1] hover:bg-[#6f09b5] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Ver comprovante completo</span>
                </button>

                <button
                  onClick={() => {
                    handleCopyTransactionInfo(selectedTransaction);
                    setSelectedTransaction(null);
                  }}
                  className="w-full py-3 bg-[#f5f5f7] hover:bg-[#ebebed] text-neutral-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copiar dados da transação</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
