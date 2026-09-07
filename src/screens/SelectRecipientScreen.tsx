import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  QrCode, 
  Building2, 
  Search,
  ArrowRight
} from 'lucide-react';
import { Contact } from '../types';

interface SelectRecipientScreenProps {
  onGoBack: () => void;
  onSelectRecipient: (contact: Contact) => void;
  contacts: Contact[];
}

export const SelectRecipientScreen: React.FC<SelectRecipientScreenProps> = ({
  onGoBack,
  onSelectRecipient,
  contacts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Frequent contacts (first 3)
  const frequentContacts = contacts.slice(0, 3);

  // Filtered contacts for search
  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.document.toLowerCase().includes(q) ||
      (c.pixKey && c.pixKey.toLowerCase().includes(q)) ||
      c.institution.toLowerCase().includes(q)
    );
  });

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if matching contact exists
    const match = contacts.find(
      (c) => c.name.toLowerCase() === searchQuery.toLowerCase().trim()
    );
    if (match) {
      onSelectRecipient(match);
      return;
    }

    // Otherwise create custom recipient from search query
    const customContact: Contact = {
      id: 'custom-' + Date.now(),
      name: searchQuery.trim(),
      initials: searchQuery.trim().substring(0, 2).toUpperCase(),
      document: '***.***.***-**',
      institution: 'Nu Pagamentos S.A.',
      accountType: 'Conta Corrente PJ',
      pixKey: searchQuery.trim(),
    };
    onSelectRecipient(customContact);
  };

  return (
    <div className="flex flex-col h-full bg-white select-none text-neutral-900 relative font-sans overflow-hidden">
      {/* Top Close Button (X) */}
      <div className="px-5 py-2 flex items-center shrink-0">
        <button
          id="btn-close-recipient-modal"
          onClick={onGoBack}
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-neutral-800 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-6 h-6 stroke-[2]" />
        </button>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 px-6 pt-1 overflow-y-auto pb-6">
        {/* Main Title */}
        <h1 className="text-[23px] sm:text-[25px] font-bold text-neutral-900 tracking-tight leading-tight">
          Para quem você quer transferir?
        </h1>

        {/* Input Field Section */}
        <div className="mt-7">
          <label className="text-[13px] text-neutral-500 font-normal block">
            Insira o dado de quem vai receber
          </label>
          <form onSubmit={handleCustomSubmit} className="mt-1">
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-200 focus-within:border-neutral-900 transition-colors">
              <input
                id="input-recipient-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nome, CPF/CNPJ ou chave Pix"
                className="w-full text-base sm:text-[17px] text-neutral-900 placeholder:text-neutral-400 placeholder:font-normal font-medium bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => alert("Abrir leitor de QR Code para transferência Pix...")}
                className="text-neutral-900 hover:text-[#820AD1] p-1 shrink-0 cursor-pointer transition-colors"
                title="Escanear QR Code"
              >
                <QrCode className="w-6 h-6" />
              </button>
            </div>
          </form>

          {/* Quick confirmation if typed text and not empty */}
          {searchQuery.trim() && (
            <motion.button
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleCustomSubmit}
              className="mt-2.5 w-full py-2.5 px-4 bg-purple-50 text-[#820AD1] font-bold rounded-xl text-xs flex items-center justify-between hover:bg-purple-100 transition-colors cursor-pointer"
            >
              <span>Continuar para: <strong>{searchQuery}</strong></span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Section: Você sempre costuma pagar */}
        {!searchQuery && (
          <div className="mt-8">
            <p className="text-[13px] text-neutral-500 font-normal mb-4">
              Você sempre costuma pagar
            </p>

            <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
              {/* Item 1: V Mendes */}
              <div 
                onClick={() => onSelectRecipient(frequentContacts[0] || contacts[0])}
                className="flex flex-col items-center shrink-0 w-[94px] cursor-pointer group"
              >
                <div className="w-[72px] h-[72px] rounded-full bg-[#f5f5f5] group-hover:bg-[#ebebeb] group-active:scale-95 flex items-center justify-center transition-all mb-2">
                  <Building2 className="w-7 h-7 text-neutral-900" />
                </div>
                <p className="text-[12px] font-bold text-neutral-900 leading-tight text-center truncate w-full">
                  V Mendes
                </p>
                <p className="text-[12px] font-bold text-neutral-900 leading-tight text-center truncate w-full">
                  Ribeiro Com...
                </p>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight text-center mt-0.5 truncate w-full">
                  BCO DO BRASI...
                </p>
              </div>

              {/* Item 2: José Pinto */}
              <div 
                onClick={() => onSelectRecipient(frequentContacts[1] || contacts[1] || contacts[0])}
                className="flex flex-col items-center shrink-0 w-[94px] cursor-pointer group"
              >
                <div className="w-[72px] h-[72px] rounded-full bg-[#f5f5f5] group-hover:bg-[#ebebeb] group-active:scale-95 flex items-center justify-center transition-all mb-2">
                  <span className="text-[15px] font-bold text-neutral-800">JP</span>
                </div>
                <p className="text-[12px] font-bold text-neutral-900 leading-tight text-center truncate w-full">
                  José Pinto
                </p>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight text-center mt-3 truncate w-full">
                  NU PAGAMENT...
                </p>
              </div>

              {/* Item 3: Williams Caleb */}
              <div 
                onClick={() => onSelectRecipient(frequentContacts[2] || contacts[2] || contacts[0])}
                className="flex flex-col items-center shrink-0 w-[94px] cursor-pointer group"
              >
                <div className="w-[72px] h-[72px] rounded-full bg-[#f5f5f5] group-hover:bg-[#ebebeb] group-active:scale-95 flex items-center justify-center transition-all mb-2">
                  <Building2 className="w-7 h-7 text-neutral-900" />
                </div>
                <p className="text-[12px] font-bold text-neutral-900 leading-tight text-center truncate w-full">
                  61.557.754
                </p>
                <p className="text-[12px] font-bold text-neutral-900 leading-tight text-center truncate w-full">
                  Williams Cal...
                </p>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight text-center mt-0.5 truncate w-full">
                  NU PAGAMENT...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section: Todos os seus contatos */}
        <div className="mt-8">
          <p className="text-[13px] text-neutral-500 font-normal mb-2">
            Todos os seus contatos
          </p>

          <div className="divide-y divide-neutral-100">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => onSelectRecipient(contact)}
                className="py-4 flex items-center gap-4 cursor-pointer group hover:bg-neutral-50/80 -mx-6 px-6 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-[#f5f5f5] group-hover:bg-[#ebebeb] group-active:scale-95 flex items-center justify-center shrink-0 transition-all">
                  {contact.document && contact.document.length > 14 ? (
                    <Building2 className="w-6 h-6 text-neutral-900" />
                  ) : contact.initials ? (
                    <span className="text-xs font-bold text-neutral-800">{contact.initials}</span>
                  ) : (
                    <Building2 className="w-6 h-6 text-neutral-900" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-neutral-900 leading-snug group-hover:text-[#820AD1] transition-colors">
                    {contact.name}
                  </p>
                </div>
              </div>
            ))}

            {filteredContacts.length === 0 && (
              <div className="py-8 text-center text-neutral-500">
                <p className="text-xs">Nenhum contato encontrado para "{searchQuery}"</p>
                <button
                  type="button"
                  onClick={handleCustomSubmit}
                  className="mt-3 text-xs text-[#820AD1] font-bold underline"
                >
                  Continuar transferência para "{searchQuery}"
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Home Indicator */}
      <div className="p-4 pt-1 shrink-0 bg-white">
        <div className="w-32 sm:w-36 h-1 bg-black rounded-full mx-auto" />
      </div>
    </div>
  );
};
