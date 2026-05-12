import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Download,
  LogOut,
  User as UserIcon,
  ChevronRight,
  Send
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  setDoc,
  doc, 
  getDocs,
  orderBy,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut
} from 'firebase/auth';
import { db, auth } from './lib/firebase';
import { Loan, Payment, UserProfile, AmortizationTableEntry } from './types';
import { calculateAmortization, LOAN_STATUS_LABELS, LOAN_STATUS_COLORS } from './services/loanService';
import { generateContractPDF, generateVoucherPDF } from './services/pdfService';
import { cn } from './lib/utils';
import { format } from 'date-fns';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Fetch or create profile
        const profileRef = doc(db, 'users', u.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: u.uid,
            email: u.email || '',
            displayName: u.displayName || 'Usuario',
            role: u.email === 'albertosamboypadilla@gmail.com' ? 'admin' : 'client',
            createdAt: new Date().toISOString()
          };
          try {
            await setDoc(profileRef, newProfile);
          } catch (e) {
            console.error('Error creating profile:', e);
          }
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !profile) return;

    let q = query(collection(db, 'loans'), orderBy('createdAt', 'desc'));
    if (profile.role !== 'admin') {
      q = query(collection(db, 'loans'), where('clientId', '==', user.uid), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loanData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Loan));
      setLoans(loanData);
    });

    return () => unsubscribe();
  }, [user, profile]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0066FF]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl shadow-2xl p-10 text-center space-y-8">
          <div className="w-20 h-20 bg-[#E31B23]/10 rounded-2xl flex items-center justify-center mx-auto border border-[#E31B23]/20">
            <CreditCard className="w-10 h-10 text-[#E31B23]" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">PrestaFlow</h1>
            <p className="text-[#888888] mt-2 text-sm font-medium tracking-widest uppercase">High Performance Financial Management</p>
          </div>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-black rounded-lg px-6 py-4 font-bold hover:bg-[#0066FF] hover:text-white transition-all duration-300 transform hover:-translate-y-1"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            IDENTIFICARSE CON GOOGLE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#E31B23] selection:text-white pb-12">
      {/* Navigation */}
      <nav className="bg-black/80 backdrop-blur-md border-b border-[#1a1a1a] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-[#E31B23] p-1.5 rounded-sm">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter uppercase italic">PrestaFlow</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00FF00] animate-pulse"></div>
                <span className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Servidor Activo</span>
              </div>
              <div className="h-8 w-[1px] bg-[#1a1a1a]"></div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-white uppercase">{profile?.displayName}</p>
                  <p className="text-[10px] text-[#888888] uppercase tracking-tight">{profile?.role}</p>
                </div>
                <button onClick={handleLogout} className="p-2 text-[#888888] hover:text-[#E31B23] transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-[#1a1a1a] pb-8">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-white mb-2">OPERACIONES</h2>
            <p className="text-[#888888] font-mono text-sm uppercase tracking-tighter">Panel de Gestión v2.4.0 • {format(new Date(), 'dd/MM/yyyy')}</p>
          </div>
          {profile?.role === 'client' && (
            <button
              onClick={() => setShowLoanForm(true)}
              className="inline-flex items-center justify-center gap-2 bg-[#E31B23] text-white px-8 py-3.5 rounded-sm font-black uppercase tracking-widest hover:bg-[#c0171d] transition-all shadow-lg shadow-[#E31B23]/10 transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Solicitar Crédito
            </button>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content: Loan List */}
          <div className="lg:col-span-8 space-y-6">
            <h3 className="text-xs font-black text-[#555555] uppercase tracking-[0.3em] flex items-center gap-3">
              <div className="w-8 h-[1px] bg-[#555555]"></div>
              Registros {profile?.role === 'admin' ? 'Globales' : 'de Usuario'}
            </h3>
            
            {loans.length === 0 ? (
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] border-dashed rounded-lg p-20 text-center">
                <FileText className="w-12 h-12 text-[#1a1a1a] mx-auto mb-4" />
                <p className="text-[#555555] font-mono text-xs uppercase tracking-widest">Base de datos vacía</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {loans.map(loan => (
                  <div 
                    key={loan.id}
                    onClick={() => setSelectedLoan(loan)}
                    className={cn(
                      "bg-[#0a0a0a] border p-6 transition-all cursor-pointer group relative overflow-hidden",
                      selectedLoan?.id === loan.id ? "border-[#0066FF] bg-[#0066FF]/5" : "border-[#1a1a1a] hover:border-[#333333]"
                    )}
                  >
                    {selectedLoan?.id === loan.id && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#0066FF]"></div>
                    )}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                          <span className="font-mono font-bold text-2xl text-white tracking-tighter">${loan.amount.toLocaleString()}</span>
                          <span className={cn(
                            "px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border",
                            loan.status === 'active' ? "border-[#0066FF] text-[#0066FF]" : 
                            loan.status === 'pending' ? "border-[#E31B23] text-[#E31B23]" : "border-[#333333] text-[#555555]"
                          )}>
                            {LOAN_STATUS_LABELS[loan.status]}
                          </span>
                        </div>
                        <p className="text-xs uppercase font-bold tracking-widest text-[#555555]">
                          {loan.clientName} <span className="mx-2 opacity-30">/</span> {loan.termMonths} Meses <span className="mx-2 opacity-30">/</span> {loan.interestRate}% Tasa
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-mono text-[#444] uppercase tracking-tighter mb-1">ID: #{loan.id?.slice(-6)}</p>
                        <ChevronRight className={cn("w-5 h-5 ml-auto transition-all", selectedLoan?.id === loan.id ? "text-[#0066FF] translate-x-1" : "text-[#1a1a1a]")} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Details/Actions */}
          <div className="lg:col-span-4 h-fit">
            {selectedLoan ? (
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-8 shadow-2xl sticky top-32">
                <div className="flex justify-between items-center mb-10 border-b border-[#1a1a1a] pb-6">
                  <h3 className="font-black text-xs uppercase tracking-[0.25em] text-[#E31B23]">Expediente Detallado</h3>
                  <button onClick={() => setSelectedLoan(null)} className="text-[#333] hover:text-white transition-colors">
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>

                <div className="space-y-6 mb-12">
                  <div className="flex justify-between items-end border-b border-[#1a1a1a] pb-2">
                    <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest uppercase">Estado Operativo</span>
                    <span className="text-xs font-black uppercase tracking-widest text-white">{LOAN_STATUS_LABELS[selectedLoan.status]}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-[#1a1a1a] pb-2">
                    <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Capital Principal</span>
                    <span className="font-mono font-bold text-xl text-white tracking-tighter">${selectedLoan.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-[#1a1a1a] pb-2">
                    <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Retorno Mensual</span>
                    <span className="font-mono font-bold text-xl text-white tracking-tighter">${selectedLoan.amortizationTable[0].payment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-[#1a1a1a] pb-2">
                    <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Interés Aplicado</span>
                    <span className="font-mono text-white text-sm">{selectedLoan.interestRate}% APR</span>
                  </div>
                </div>

                <div className="grid gap-3">
                  {/* Admin Actions */}
                  {profile.role === 'admin' && selectedLoan.status === 'pending' && (
                    <button 
                      onClick={() => approveLoan(selectedLoan)}
                      className="w-full flex items-center justify-center gap-2 bg-[#0066FF] text-white px-4 py-4 font-black uppercase text-xs tracking-widest hover:bg-[#0052cc] transition-all hover:scale-[1.02]"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Autorizar Desembolso
                    </button>
                  )}

                  {/* Document Generation */}
                  <button 
                    onClick={() => {
                      const doc = generateContractPDF(selectedLoan);
                      doc.save(`CONTRATO_${selectedLoan.clientName.replace(/\s/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
                    }}
                    className="w-full flex items-center justify-center gap-2 border border-[#333] text-[#888] px-4 py-4 font-black uppercase text-xs tracking-widest hover:bg-white hover:text-black transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Exportar Contrato
                  </button>

                  {/* Signature Simulation */}
                  {selectedLoan.status === 'approved' && (
                    <button 
                      onClick={() => requestSignature(selectedLoan)}
                      className="w-full flex items-center justify-center gap-2 bg-[#E31B23] text-white px-4 py-4 font-black uppercase text-xs tracking-widest hover:bg-[#c0171d] transition-all shadow-lg shadow-[#E31B23]/20"
                    >
                      <Send className="w-4 h-4" />
                      Solicitar Documentación
                    </button>
                  )}

                  {/* Payment Actions */}
                  {selectedLoan.status === 'active' && (
                    <button 
                      onClick={() => registerPayment(selectedLoan)}
                      className="w-full flex items-center justify-center gap-2 bg-[#0066FF] text-white px-4 py-4 font-black uppercase text-xs tracking-widest hover:bg-[#0052cc] transition-all shadow-lg shadow-[#0066FF]/20"
                    >
                      <CreditCard className="w-4 h-4" />
                      Ejecutar Pago
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-10 text-center flex flex-col items-center justify-center h-[400px]">
                <div className="w-20 h-20 border border-[#1a1a1a] rounded-full flex items-center justify-center mb-6">
                  <AlertCircle className="w-8 h-8 text-[#1a1a1a]" />
                </div>
                <p className="text-[#333] font-black uppercase text-xs tracking-[0.3em]">Seleccione un Registro</p>
                <p className="text-[#1a1a1a] text-[10px] mt-4 max-w-[200px] leading-relaxed uppercase tracking-widest">El sistema requiere un ID activo para desplegar los controles de operación y auditoría.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Loan Application Model */}
      {showLoanForm && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] w-full max-w-lg shadow-2xl p-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Nueva Operación</h3>
                <p className="text-[#555] text-[10px] font-bold uppercase tracking-widest mt-1">Solicitud de Crédito Financiero</p>
              </div>
              <button onClick={() => setShowLoanForm(false)} className="text-[#333] hover:text-white transition-colors">
                <Plus className="w-8 h-8 rotate-45" />
              </button>
            </div>
            <form onSubmit={submitLoanRequest} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#555] uppercase tracking-widest">Monto de Inversión ($)</label>
                <input required name="amount" type="number" placeholder="0.00" className="w-full bg-black border border-[#1a1a1a] rounded-none px-6 py-4 font-mono text-2xl text-white focus:border-[#E31B23] outline-none transition-all placeholder:text-[#1a1a1a]" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#555] uppercase tracking-widest">Plazo de Retorno</label>
                  <select required name="months" className="w-full bg-black border border-[#1a1a1a] rounded-none px-6 py-4 font-bold uppercase text-xs text-white focus:border-[#E31B23] outline-none transition-all appearance-none cursor-pointer">
                    <option value="6">06 Meses</option>
                    <option value="12">12 Meses</option>
                    <option value="24">24 Meses</option>
                    <option value="36">36 Meses</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#555] uppercase tracking-widest">DNI / ID Fiscal</label>
                  <input required name="dni" type="text" placeholder="ID-000000" className="w-full bg-black border border-[#1a1a1a] rounded-none px-6 py-4 text-xs font-bold uppercase text-white focus:border-[#E31B23] outline-none transition-all placeholder:text-[#1a1a1a]" />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#E31B23] text-white py-5 font-black uppercase text-sm tracking-[0.3em] hover:bg-[#c0171d] transition-all shadow-xl shadow-[#E31B23]/10 mt-8"
              >
                Ejecutar Solicitud
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  async function submitLoanRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || !profile) return;

    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    const months = Number(formData.get('months'));
    const dni = formData.get('dni') as string;
    
    const interestRate = 12; // Example fixed rate
    const amortizationTable = calculateAmortization(amount, interestRate, months);

    const newLoan: Omit<Loan, 'id'> = {
      clientId: user.uid,
      clientName: profile.displayName,
      clientDni: dni,
      amount,
      interestRate,
      termMonths: months,
      status: 'pending',
      amortizationTable,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'loans'), newLoan);
      setShowLoanForm(false);
      
      // Audit Log
      await addDoc(collection(db, 'audit_logs'), {
        userId: user.uid,
        action: 'loan_request',
        details: `Solicitud de préstamo por $${amount}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error submitting loan:', error);
    }
  }

  async function approveLoan(loan: Loan) {
    if (!loan.id) return;
    try {
      await updateDoc(doc(db, 'loans', loan.id), {
        status: 'approved',
        approvedAt: new Date().toISOString()
      });
      setSelectedLoan({ ...loan, status: 'approved' });
    } catch (error) {
      console.error('Error approving loan:', error);
    }
  }

  async function requestSignature(loan: Loan) {
    if (!loan.id) return;
    try {
      // Call mock server endpoint
      const res = await fetch('/api/signature-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: loan.id,
          clientEmail: user?.email,
          clientName: loan.clientName
        })
      });
      const data = await res.json();
      
      if (data.success) {
        // Simulate automatic signing for demo purposes
        setTimeout(async () => {
          await updateDoc(doc(db, 'loans', loan.id!), {
            status: 'active',
            signatureRequestId: data.requestId,
            signatureStatus: 'signed'
          });
          alert('Firma completada automáticamente (Simulación)');
        }, 2000);
      }
    } catch (error) {
      console.error('Error requesting signature:', error);
    }
  }

  async function registerPayment(loan: Loan) {
    if (!loan.id) return;
    
    // Find next pending installment
    const installmentIndex = loan.amortizationTable.findIndex(r => r.status === 'pending');
    if (installmentIndex === -1) return;
    
    const installment = loan.amortizationTable[installmentIndex];
    const transId = `VOU_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const newPayment: Payment = {
      loanId: loan.id,
      clientId: loan.clientId,
      amount: installment.payment,
      date: new Date().toISOString(),
      transactionId: transId,
      installmentNumber: installmentIndex + 1
    };

    try {
      // 1. Record payment
      await addDoc(collection(db, 'payments'), newPayment);

      // 2. Update loan table
      const newTable = [...loan.amortizationTable];
      newTable[installmentIndex].status = 'paid';
      
      const isComplete = installmentIndex === loan.amortizationTable.length - 1;
      
      await updateDoc(doc(db, 'loans', loan.id), {
        amortizationTable: newTable,
        status: isComplete ? 'closed' : 'active'
      });

      // 3. Generate Voucher and simulate download (since we don't have production storage upload in one click easily here)
      const voucher = generateVoucherPDF({ ...loan, amortizationTable: newTable }, newPayment);
      voucher.save(`${transId}_RECIBO.pdf`);

      // 4. Simulate Email Sending
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user?.email,
          subject: `Comprobante de Pago - Préstamo ${loan.id} - ${loan.clientName}`,
          body: `Hola ${loan.clientName}, confirmamos la recepción de tu pago. Adjunto encontrarás tu comprobante. Tu próximo pago es el ${isComplete ? 'N/A' : newTable[installmentIndex + 1].dueDate}.`
        })
      });

      alert('Pago registrado con éxito. El voucher se ha generado y enviado por correo.');
    } catch (error) {
      console.error('Error registering payment:', error);
    }
  }
}
