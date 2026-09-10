/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SplashScreen } from './screens/SplashScreen';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { PaymentOptionsScreen } from './screens/PaymentOptionsScreen';
import { AreaPixScreen } from './screens/AreaPixScreen';
import { SelectRecipientScreen } from './screens/SelectRecipientScreen';
import { TransferScreen } from './screens/TransferScreen';
import { ConfirmTransferScreen } from './screens/ConfirmTransferScreen';
import { ReceiptScreen } from './screens/ReceiptScreen';
import { ScanQrCodeScreen } from './screens/ScanQrCodeScreen';
import { EditMenuModal } from './components/EditMenuModal';
import { PixPushNotification } from './components/PixPushNotification';
import { AppCustomData, Contact, ScreenName, Transaction, TransferData, ActivePixNotification } from './types';
import { DEFAULT_APP_DATA, INITIAL_TRANSACTIONS, INITIAL_CONTACTS } from './data/mockData';
import { playPixNotificationSound } from './utils/audio';
import { 
  showNativeSystemNotification, 
  registerServiceWorkerForNotifications 
} from './utils/nativeNotification';
import { CheckCircle2, Sliders, Edit3, ArrowDownLeft } from 'lucide-react';

const STORAGE_KEY = 'nu_empresas_custom_data_v2';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Splash');
  const [screenStack, setScreenStack] = useState<ScreenName[]>(['Splash']);
  
  // App Custom Data (Persistent in localStorage only)
  const [appData, setAppData] = useState<AppCustomData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure the app always has at least 10 transactions
        let loadedTransactions: Transaction[] = [];
        if (Array.isArray(parsed.transactions) && parsed.transactions.length >= 10) {
          loadedTransactions = parsed.transactions;
        } else if (Array.isArray(parsed.transactions) && parsed.transactions.length > 0) {
          const existingIds = new Set(parsed.transactions.map((t: Transaction) => t.id));
          const missing = INITIAL_TRANSACTIONS.filter((t) => !existingIds.has(t.id));
          loadedTransactions = [...parsed.transactions, ...missing];
        } else {
          loadedTransactions = INITIAL_TRANSACTIONS;
        }

        // Ensure the app always has at least 8 contacts
        let loadedContacts: Contact[] = [];
        if (Array.isArray(parsed.contacts) && parsed.contacts.length >= 8) {
          loadedContacts = parsed.contacts;
        } else if (Array.isArray(parsed.contacts) && parsed.contacts.length > 0) {
          const existingIds = new Set(parsed.contacts.map((c: Contact) => c.id));
          const missing = INITIAL_CONTACTS.filter((c) => !existingIds.has(c.id));
          loadedContacts = [...parsed.contacts, ...missing];
        } else {
          loadedContacts = INITIAL_CONTACTS;
        }

        return {
          ...DEFAULT_APP_DATA,
          ...parsed,
          contacts: loadedContacts,
          transactions: loadedTransactions,
        };
      }
    } catch (e) {
      console.error('Error loading saved data from localStorage', e);
    }
    return DEFAULT_APP_DATA;
  });

  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(true);
  const [skipIntro, setSkipIntro] = useState<boolean>(false);
  const [preselectedContact, setPreselectedContact] = useState<Contact | null>(null);
  const [transferInitialAmount, setTransferInitialAmount] = useState<number | undefined>(undefined);
  const [receiptSecretUnlocked, setReceiptSecretUnlocked] = useState(false);
  
  // Edit mode states
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isInlineEditMode, setIsInlineEditMode] = useState<boolean>(false);

  // Active simulated Pix push notification
  const [activePixNotification, setActivePixNotification] = useState<ActivePixNotification | null>(null);
  const notificationTimerRef = React.useRef<any>(null);

  const [activeTransfer, setActiveTransfer] = useState<TransferData>({
    recipient: {
      id: 'default',
      name: appData.defaultRecipientName,
      initials: appData.defaultRecipientInitials,
      document: appData.defaultRecipientDoc,
      institution: appData.defaultRecipientInstitution,
      accountType: appData.defaultRecipientAccountType,
    },
    amount: appData.defaultTransferAmount,
    date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize service worker for native push notifications on device status bar
  useEffect(() => {
    registerServiceWorkerForNotifications();
  }, []);

  // Auto-save to localStorage whenever appData updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (e) {
      console.error('Failed to save data', e);
    }
  }, [appData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdateField = <K extends keyof AppCustomData>(key: K, value: AppCustomData[K]) => {
    setAppData((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveAppData = (newData: AppCustomData) => {
    setAppData(newData);
    showToast('Alterações salvas com sucesso!');
  };

  const handleResetData = () => {
    setAppData(DEFAULT_APP_DATA);
    setIsBalanceVisible(true);
    setSkipIntro(false);
    localStorage.removeItem(STORAGE_KEY);
    showToast('Dados zerados com sucesso. O aplicativo está no estado virgem!');
  };

  // Trigger Pix Receive Simulation
  const handleTriggerSimulatedPix = (
    senderName?: string,
    amount?: number,
    bank?: string,
    message?: string,
    delaySeconds: number = 0
  ) => {
    const finalSender = senderName || appData.simulatedPixSender || 'CLIENTE REMETENTE';
    const finalAmount = amount !== undefined ? amount : appData.simulatedPixAmount;
    const finalBank = bank || appData.simulatedPixBank || 'Nu Pagamentos S.A.';
    const finalMsg = message !== undefined ? message : appData.simulatedPixMessage;

    if (delaySeconds > 0) {
      showToast(`Notificação Pix agendada para daqui a ${delaySeconds} segundos...`);
    }

    setTimeout(() => {
      // Play realistic bank mobile sound if enabled
      if (appData.pixNotificationSound !== false) {
        playPixNotificationSound();
      }

      // Trigger native device system notification (aparece na barra de notificações do celular/PC em segundo plano)
      showNativeSystemNotification({
        senderName: finalSender,
        amount: finalAmount,
        bankName: finalBank,
        message: finalMsg,
      });

      // Auto update balance and add to transaction history
      if (appData.pixAutoCreditBalance !== false) {
        const newBalance = appData.balance + finalAmount;
        const now = new Date();
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const newTx: Transaction = {
          id: 'tx-pix-rec-' + Date.now(),
          type: 'pix_receive',
          title: 'Transferência recebida',
          subtitle: `${finalSender} - Pix`,
          amount: finalAmount,
          date: 'Hoje, ' + timeStr,
          recipient: {
            id: 'sender-' + Date.now(),
            name: finalSender,
            initials: finalSender.substring(0, 2).toUpperCase(),
            document: '***.***.***-**',
            institution: finalBank,
            accountType: 'Conta Corrente',
          }
        };

        setAppData((prev) => ({
          ...prev,
          balance: prev.balance + finalAmount,
          transactions: [newTx, ...prev.transactions]
        }));
      }

      // Set active push notification on top of the phone screen
      const notif: ActivePixNotification = {
        id: 'notif-' + Date.now(),
        senderName: finalSender,
        amount: finalAmount,
        bankName: finalBank,
        message: finalMsg,
        timestamp: 'agora',
      };
      setActivePixNotification(notif);

      // Auto-clear notification after 9 seconds if not clicked/dismissed
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      notificationTimerRef.current = setTimeout(() => {
        setActivePixNotification(null);
      }, 9000);
    }, delaySeconds * 1000);
  };

  const navigateTo = (screen: ScreenName) => {
    setScreenStack((prev) => [...prev, screen]);
    setCurrentScreen(screen);
  };

  const goBack = () => {
    if (screenStack.length > 1) {
      const newStack = [...screenStack];
      newStack.pop();
      const previousScreen = newStack[newStack.length - 1];
      setScreenStack(newStack);
      setCurrentScreen(previousScreen);
    } else {
      setCurrentScreen('Home');
    }
  };

  const handleAddContact = (newContact: Contact) => {
    setAppData((prev) => {
      const existingIndex = prev.contacts.findIndex(
        (c) =>
          (c.document && c.document !== '***.***.***-**' && c.document === newContact.document) ||
          (c.name.trim().toLowerCase() === newContact.name.trim().toLowerCase())
      );

      let updatedContacts = [...prev.contacts];
      if (existingIndex >= 0) {
        updatedContacts[existingIndex] = { ...updatedContacts[existingIndex], ...newContact };
      } else {
        updatedContacts = [newContact, ...updatedContacts];
      }

      return {
        ...prev,
        contacts: updatedContacts,
      };
    });
  };

  const handleStartTransfer = (contact?: Contact, amount?: number, unlockSecret?: boolean) => {
    setReceiptSecretUnlocked(!!unlockSecret);
    if (contact) {
      setPreselectedContact(contact);
      setTransferInitialAmount(amount);
      navigateTo('Transfer');
    } else {
      setPreselectedContact(null);
      setTransferInitialAmount(undefined);
      navigateTo('SelectRecipient');
    }
  };

  const handleSelectRecipient = (contact: Contact, amount?: number) => {
    setPreselectedContact(contact);
    setTransferInitialAmount(amount);
    navigateTo('Transfer');
  };

  const handleContinueTransfer = (data: TransferData) => {
    setActiveTransfer(data);
    navigateTo('ConfirmTransfer');
  };

  const handleConfirmTransfer = (data: TransferData) => {
    // Deduct exact amount from balance
    setAppData((prev) => {
      const updatedBalance = Number(Math.max(0, prev.balance - data.amount).toFixed(2));
      
      const newTx: Transaction = {
        id: 'tx-' + Date.now(),
        type: 'pix_send',
        title: 'Transferência enviada',
        subtitle: `${data.recipient.name} - Pix`,
        amount: -data.amount,
        date: 'Hoje, ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        recipient: data.recipient
      };

      return {
        ...prev,
        balance: updatedBalance,
        transactions: [newTx, ...prev.transactions]
      };
    });

    // Show receipt
    navigateTo('Receipt');
    showToast(`Pix de ${data.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} enviado com sucesso!`);
  };

  return (
    <div className="w-full min-h-screen h-screen bg-white text-neutral-900 flex flex-col font-sans relative overflow-hidden select-none">
      {/* Screen Content - 100% Fullscreen Mobile App Style */}
      <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {currentScreen === 'Splash' && (
            <motion.div
              key="splash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full flex-1"
            >
              <SplashScreen
                onFinish={() => {
                  setScreenStack(['Login']);
                  setCurrentScreen('Login');
                }}
              />
            </motion.div>
          )}

          {currentScreen === 'Login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex-1"
            >
              <LoginScreen
                appData={appData}
                onNavigate={() => navigateTo('Home')}
                skipIntro={skipIntro}
                onToggleSkipIntro={setSkipIntro}
                onUpdateField={handleUpdateField}
                isInlineEditMode={isInlineEditMode}
              />
            </motion.div>
          )}

          {currentScreen === 'Home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex-1"
            >
              <HomeScreen
                appData={appData}
                isBalanceVisible={isBalanceVisible}
                onToggleBalance={() => setIsBalanceVisible(!isBalanceVisible)}
                onNavigate={(screen) => navigateTo(screen)}
                onOpenEditModal={() => setIsEditModalOpen(true)}
                onUpdateField={handleUpdateField}
                isInlineEditMode={isInlineEditMode}
                onTriggerSimulatedPix={handleTriggerSimulatedPix}
              />
            </motion.div>
          )}

          {currentScreen === 'PaymentOptions' && (
            <motion.div
              key="payment_options"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex-1"
            >
              <PaymentOptionsScreen
                onGoBack={goBack}
                onNavigate={(screen) => navigateTo(screen)}
                onGenerateReceiptFromPdf={(transferData) => {
                  setActiveTransfer(transferData);
                  navigateTo('Receipt');
                }}
              />
            </motion.div>
          )}

          {currentScreen === 'AreaPix' && (
            <motion.div
              key="area_pix"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex-1"
            >
              <AreaPixScreen
                onGoBack={goBack}
                onNavigateTransfer={handleStartTransfer}
                onNavigateScanQrCode={() => navigateTo('ScanQrCode')}
                contacts={appData.contacts}
              />
            </motion.div>
          )}

          {currentScreen === 'SelectRecipient' && (
            <motion.div
              key="select_recipient"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex-1"
            >
              <SelectRecipientScreen
                onGoBack={() => {
                  setReceiptSecretUnlocked(false);
                  goBack();
                }}
                onSelectRecipient={(c, amt) => {
                  setReceiptSecretUnlocked(false);
                  handleSelectRecipient(c, amt);
                }}
                onNavigateScanQrCode={() => navigateTo('ScanQrCode')}
                onAddContact={handleAddContact}
                contacts={appData.contacts}
                initialShowReceiptSecret={receiptSecretUnlocked}
              />
            </motion.div>
          )}

          {currentScreen === 'Transfer' && (
            <motion.div
              key="transfer"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex-1"
            >
              <TransferScreen
                onGoBack={goBack}
                onContinue={handleContinueTransfer}
                contacts={appData.contacts}
                preselectedContact={preselectedContact}
                initialAmount={transferInitialAmount}
                accountBalance={appData.balance}
              />
            </motion.div>
          )}

          {currentScreen === 'ConfirmTransfer' && (
            <motion.div
              key="confirm_transfer"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex-1"
            >
              <ConfirmTransferScreen
                onGoBack={goBack}
                onConfirmTransfer={handleConfirmTransfer}
                transferData={activeTransfer}
              />
            </motion.div>
          )}

          {currentScreen === 'Receipt' && (
            <motion.div
              key="receipt"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex-1"
            >
              <ReceiptScreen
                transferData={activeTransfer}
                appData={appData}
                onGoHome={() => {
                  setScreenStack(['Home']);
                  setCurrentScreen('Home');
                }}
              />
            </motion.div>
          )}

          {currentScreen === 'ScanQrCode' && (
            <motion.div
              key="scan_qr_code"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex-1"
            >
              <ScanQrCodeScreen
                onGoBack={goBack}
                onScanSuccess={(scannedTransfer) => {
                  setActiveTransfer(scannedTransfer);
                  navigateTo('ConfirmTransfer');
                  showToast('QR Code identificado com sucesso!');
                }}
                onAddContact={handleAddContact}
                onSelectRecipient={handleSelectRecipient}
                appData={appData}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pix Push Notification in Mobile App / Tab Bar */}
      <PixPushNotification
        notification={activePixNotification}
        onDismiss={() => setActivePixNotification(null)}
        onClickNotification={() => {
          navigateTo('Home');
          setActivePixNotification(null);
          setTimeout(() => {
            const el = document.getElementById('recent-activity-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }, 200);
        }}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto bg-neutral-900/95 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl backdrop-blur-sm flex items-center gap-2.5 border border-white/10"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* Floating Indicator when Direct Inline Edit Mode is Active */}
      {isInlineEditMode && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-purple-900/90 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-purple-400/40 flex items-center gap-2 backdrop-blur-sm">
          <Edit3 className="w-3.5 h-3.5 text-amber-300" />
          <span>Modo Edição Ativo: toque nos campos sublinhados para editar</span>
          <button
            onClick={() => setIsInlineEditMode(false)}
            className="ml-1 bg-white/20 hover:bg-white/30 rounded-full px-1.5 py-0.5 text-[10px]"
          >
            Desativar
          </button>
        </div>
      )}

      {/* Full Edit Menu Modal (Triggered by 3 clicks on Left Menu Icon) */}
      <EditMenuModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        data={appData}
        onSave={handleSaveAppData}
        onReset={handleResetData}
        isInlineEditMode={isInlineEditMode}
        onToggleInlineEditMode={setIsInlineEditMode}
        onTriggerSimulatedPix={handleTriggerSimulatedPix}
      />
    </div>
  );
}
