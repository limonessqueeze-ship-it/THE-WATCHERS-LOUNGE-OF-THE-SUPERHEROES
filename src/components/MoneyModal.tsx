import React, { useState, useEffect } from 'react';
import { 
  X, 
  Coins, 
  Send, 
  Search, 
  CheckCircle2, 
  User, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Wallet, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchAllUsersFromSupabase, transferMoneyInSupabase, isSupabaseConfigured, DbUser } from '../lib/supabase';

interface MoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBalance?: number;
  setUserBalance?: React.Dispatch<React.SetStateAction<number>>;
}

// Default MCU community users to ensure transfer list is never empty
const DEFAULT_RECIPIENTS: DbUser[] = [
  {
    id: 'user-mcu-loki',
    nombre: 'Loki God of Stories',
    agent_handle: '@loki_god_stories',
    foto_de_perfil: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
    dinero: 1250
  },
  {
    id: 'user-mcu-strange',
    nombre: 'Doctor Strange Supreme',
    agent_handle: '@strange_supreme',
    foto_de_perfil: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200&auto=format&fit=crop',
    dinero: 980
  },
  {
    id: 'user-mcu-wanda',
    nombre: 'Scarlet Witch (Wanda Maximoff)',
    agent_handle: '@scarlet_wanda',
    foto_de_perfil: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop',
    dinero: 1500
  },
  {
    id: 'user-mcu-mobius',
    nombre: 'Mobius M. Mobius',
    agent_handle: '@agent_mobius_tva',
    foto_de_perfil: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    dinero: 750
  },
  {
    id: 'user-mcu-sylvie',
    nombre: 'Sylvie Laufeydottir',
    agent_handle: '@sylvie_variant',
    foto_de_perfil: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    dinero: 890
  }
];

export const MoneyModal: React.FC<MoneyModalProps> = ({
  isOpen,
  onClose,
  userBalance,
  setUserBalance
}) => {
  const { user, updateNexusPoints } = useAuth();

  const [activeView, setActiveView] = useState<'balance' | 'transfer'>('balance');
  const [usersList, setUsersList] = useState<DbUser[]>(DEFAULT_RECIPIENTS);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [selectedUser, setSelectedUser] = useState<DbUser | null>(null);
  const [transferAmount, setTransferAmount] = useState<string>('50');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentBalance = user ? user.nexusPoints : (userBalance ?? 500);

  // Fetch users from Supabase
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      if (isSupabaseConfigured) {
        const dbUsers = await fetchAllUsersFromSupabase();
        if (dbUsers && dbUsers.length > 0) {
          // Merge with default recipient list, avoiding duplicates
          const existingIds = new Set(dbUsers.map(u => u.id));
          const combined = [
            ...dbUsers,
            ...DEFAULT_RECIPIENTS.filter(d => !existingIds.has(d.id))
          ];
          setUsersList(combined);
        } else {
          setUsersList(DEFAULT_RECIPIENTS);
        }
      } else {
        setUsersList(DEFAULT_RECIPIENTS);
      }
    } catch (e) {
      console.error('Error loading users list:', e);
      setUsersList(DEFAULT_RECIPIENTS);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter out the current user from transfer target list
  const availableRecipients = usersList.filter(u => {
    if (user && (u.id === user.id || u.nombre.toLowerCase() === user.username.toLowerCase())) {
      return false;
    }
    const query = searchUser.toLowerCase();
    return (
      u.nombre.toLowerCase().includes(query) ||
      (u.agent_handle && u.agent_handle.toLowerCase().includes(query))
    );
  });

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedUser) {
      setErrorMessage('Por favor selecciona a un usuario de la lista.');
      return;
    }

    const amount = parseInt(transferAmount, 10);

    if (isNaN(amount) || amount <= 0) {
      setErrorMessage('Ingresa una cantidad válida a transferir.');
      return;
    }

    if (amount > currentBalance) {
      setErrorMessage(`Saldo insuficiente. Tienes ${currentBalance} MN y quieres transferir ${amount} MN.`);
      return;
    }

    // Execute transfer
    // 1. Deduct from sender
    updateNexusPoints(-amount);
    if (setUserBalance) {
      setUserBalance(prev => Math.max(0, prev - amount));
    }

    // 2. Transfer in Supabase
    if (user && isSupabaseConfigured) {
      await transferMoneyInSupabase(user.id, selectedUser.id, amount);
    }

    // 3. Update local list recipient balance display
    setUsersList(prev => prev.map(u => {
      if (u.id === selectedUser.id) {
        return { ...u, dinero: (u.dinero ?? 500) + amount };
      }
      return u;
    }));

    setSuccessMessage(`¡Has transferido con éxito ${amount} Monedas Nexus a ${selectedUser.nombre}! 🎉`);
    
    // Reset form after short delay
    setTimeout(() => {
      setSelectedUser(null);
      setTransferAmount('50');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0d0607] border border-[#D4AF37]/50 rounded-3xl p-6 sm:p-8 relative shadow-2xl my-auto space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#1c080a] border border-[#DC2626]/50 text-slate-300 hover:text-white hover:bg-red-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18080a] border border-[#D4AF37]/40 text-[#D4AF37] font-mono text-xs font-bold uppercase tracking-wider">
            <Coins className="w-4 h-4 text-amber-400" /> BANCO CENTRAL MULTIVERSAL TVA
          </div>
          <h2 className="font-cinzel text-2xl sm:text-3xl font-black text-white">
            MI DINERO Y <span className="text-[#DC2626]">TRANSFERENCIAS</span>
          </h2>
          <p className="text-xs text-slate-300 font-mono">
            Administra tus Monedas Nexus (MN) o transfiere créditos a cualquier usuario del multiverso.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-2xl bg-[#120708] border border-[#2d0a0a] p-1.5 gap-2">
          <button
            type="button"
            onClick={() => setActiveView('balance')}
            className={`flex-1 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeView === 'balance'
                ? 'bg-[#DC2626] text-white shadow-lg shadow-red-950/60'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>MI SALDO</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('transfer')}
            className={`flex-1 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeView === 'transfer'
                ? 'bg-[#DC2626] text-white shadow-lg shadow-red-950/60'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>TRANSFERIR DINERO</span>
          </button>
        </div>

        {/* Success / Error Messages */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-mono font-bold flex items-center gap-3 shadow-lg animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-950/90 border border-red-500 text-red-200 text-xs font-mono font-bold flex items-center gap-3 shadow-lg animate-shake">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* VIEW 1: MI SALDO */}
        {activeView === 'balance' && (
          <div className="space-y-6">
            
            {/* Balance Highlight Card */}
            <div className="tva-card rounded-2xl p-6 border border-amber-500/40 text-center space-y-4 relative overflow-hidden bg-gradient-to-b from-[#18080a] to-[#0d0607]">
              <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/50 flex items-center justify-center mx-auto shadow-inner">
                <Coins className="w-9 h-9 text-[#D4AF37]" />
              </div>

              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400 block font-bold">
                  TU DINERO DISPONIBLE
                </span>
                <div className="font-cinzel text-4xl sm:text-5xl font-black text-[#D4AF37] mt-1 tracking-tight">
                  {currentBalance.toLocaleString()} <span className="text-xl sm:text-2xl font-mono text-amber-200">MN</span>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/80 border border-red-800 text-amber-300 font-mono text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Rango Actual: {user?.rank || 'Agente de la TVA'}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setActiveView('transfer')}
                className="p-4 rounded-2xl bg-[#140708] border border-amber-500/40 hover:border-amber-400 text-left space-y-2 group transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Send className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <h4 className="font-cinzel font-bold text-white text-sm">Transferir a un Usuario</h4>
                  <p className="text-xs text-slate-400 font-mono">Envía Monedas Nexus a cualquier agente</p>
                </div>
              </button>

              <div className="p-4 rounded-2xl bg-[#120708] border border-[#2d0a0a] text-left space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-cinzel font-bold text-white text-sm">Bolsa Garantizada por TVA</h4>
                  <p className="text-xs text-slate-400 font-mono">Tus créditos están protegidos en la base de datos</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: TRANSFERIR DINERO */}
        {activeView === 'transfer' && (
          <form onSubmit={handleExecuteTransfer} className="space-y-5">
            
            {/* Step 1: Search & Pick User */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                  <User className="w-4 h-4" /> 1. Elige al Usuario Destinatario
                </label>
                <button
                  type="button"
                  onClick={loadUsers}
                  className="text-[11px] font-mono text-slate-400 hover:text-amber-300 flex items-center gap-1"
                  title="Actualizar lista de usuarios"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingUsers ? 'animate-spin' : ''}`} />
                  <span>Actualizar lista</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  placeholder="Buscar usuario por nombre o @handle..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090304] border border-[#2d0a0a] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              {/* Recipients Grid List */}
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 no-scrollbar border border-[#2d0a0a] p-2 rounded-2xl bg-[#080304]">
                {availableRecipients.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono text-center py-6">
                    No se encontraron usuarios con ese nombre.
                  </p>
                ) : (
                  availableRecipients.map(u => {
                    const isSelected = selectedUser?.id === u.id;
                    return (
                      <div
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-950/60 border-amber-400 shadow-lg'
                            : 'bg-[#100607] border-[#250809] hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={u.foto_de_perfil || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'}
                            alt={u.nombre}
                            className="w-9 h-9 rounded-full object-cover border border-amber-500/30"
                          />
                          <div>
                            <h4 className="font-bold text-white text-xs">{u.nombre}</h4>
                            <span className="text-[10px] font-mono text-amber-400/80 block">
                              {u.agent_handle || `@${u.nombre.toLowerCase().replace(/\s+/g, '_')}`}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-300">
                            {(u.dinero ?? 500).toLocaleString()} MN
                          </span>
                          {isSelected && (
                            <span className="block text-[10px] font-mono text-emerald-400 font-bold">
                              ✓ Seleccionado
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected Target Summary */}
            {selectedUser && (
              <div className="p-3.5 rounded-2xl bg-[#18090a] border border-amber-500/50 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Transferir a:</span>
                <span className="text-amber-300 font-bold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  {selectedUser.nombre} ({selectedUser.agent_handle || '@agente'})
                </span>
              </div>
            )}

            {/* Step 2: Amount Input */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                2. Monto a Transferir (Tu Saldo: {currentBalance} MN)
              </label>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Coins className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    min="1"
                    max={currentBalance}
                    value={transferAmount}
                    onChange={e => setTransferAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090304] border border-[#2d0a0a] text-sm text-white font-mono focus:outline-none focus:border-[#DC2626]"
                  />
                </div>

                <div className="flex items-center gap-1">
                  {[50, 100, 250].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTransferAmount(val.toString())}
                      className="px-2.5 py-2.5 rounded-xl bg-[#140708] border border-[#2d0a0a] hover:border-amber-400 text-amber-300 font-mono text-xs font-bold transition-colors"
                    >
                      +{val}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTransferAmount(currentBalance.toString())}
                    className="px-2.5 py-2.5 rounded-xl bg-amber-950 border border-amber-600 text-amber-200 font-mono text-xs font-bold hover:bg-amber-900 transition-colors"
                  >
                    Todo
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Transfer Button */}
            <button
              type="submit"
              disabled={!selectedUser}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2 ${
                selectedUser
                  ? 'bg-gradient-to-r from-[#DC2626] via-red-600 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white shadow-red-950/60 active:scale-98'
                  : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {selectedUser 
                  ? `Confirmar Transferencia de ${transferAmount || 0} MN a ${selectedUser.nombre}`
                  : 'Selecciona un usuario para transferir'}
              </span>
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
