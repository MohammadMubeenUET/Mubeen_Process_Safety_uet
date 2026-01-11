
import React, { useState, useRef, useEffect } from 'react';
import { 
  Activity, ChevronDown, ChevronRight, Menu, X, MessageSquare, 
  Send, CheckCircle, Target, BookOpen, User, Building, Mail, 
  Briefcase, ArrowRight, HelpCircle, Lock, KeyRound
} from 'lucide-react';
import { getChatResponse } from '../services/geminiService';

interface LandingPageProps {
  onNavigate: (page: 'landing' | 'editor' | 'eventtree' | 'faulttree' | 'lopa' | 'qra' | 'hazop' | 'fmea' | 'case-studies') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Modals State
  const [isTrialOpen, setTrialOpen] = useState(false);
  const [isAboutOpen, setAboutOpen] = useState(false);
  const [isLearnMoreOpen, setLearnMoreOpen] = useState(false);
  const [isSignInOpen, setSignInOpen] = useState(false);
  const [isSupportOpen, setSupportOpen] = useState(false);
  const [isChatOpen, setChatOpen] = useState(false);

  // Auth State
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [pendingModule, setPendingModule] = useState<string | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: 'Hi! I am the Safety Assistant. How can I help you today?' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Forms State
  const [trialForm, setTrialForm] = useState({ name: '', email: '', company: '', role: '' });
  const [trialSubmitted, setTrialSubmitted] = useState(false);
  const [signInEmail, setSignInOpenEmail] = useState('');

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user' as const, text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    const history = chatMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    const response = await getChatResponse(userMsg.text, history);

    setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    setChatLoading(false);
  };

  const handleTrialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission
    setTimeout(() => {
        setTrialSubmitted(true);
    }, 800);
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if(signInEmail.includes('@')) {
        alert("Welcome back! Your 7-day trial access is active.");
        setSignInOpen(false);
    } else {
        alert("Please enter a valid email address.");
    }
  };

  const handleModuleClick = (module: any) => {
    if (module === 'editor') {
        onNavigate(module); // BowTie is free
    } else {
        setPendingModule(module);
        setAuthOpen(true);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authPassword === "3520211624113") {
        if (pendingModule) onNavigate(pendingModule as any);
        setAuthOpen(false);
        setAuthPassword("");
        setPendingModule(null);
    } else {
        alert("Incorrect Access Code. Please contact administrator.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col relative font-sans">
      
      {/* --- NAVIGATION --- */}
      <nav className="flex justify-between items-center px-6 md:px-10 h-[70px] bg-slate-900/90 backdrop-blur-md border-b border-slate-800 relative z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 flex items-center justify-center rounded-md shadow-lg shadow-emerald-500/20">
            <Activity className="text-white" strokeWidth={2.5} size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Safety for All</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 text-sm font-medium text-slate-400 items-center h-full">
          <div className="nav-item h-full flex items-center cursor-pointer hover:text-emerald-400 transition-colors" onClick={() => setAboutOpen(true)}>About us</div>
          
          <div className="nav-item h-full flex items-center cursor-pointer hover:text-emerald-400 transition-colors group relative">
            <span className="flex items-center gap-1">Products <ChevronDown size={14} /></span>
            <div className="absolute top-[70px] left-0 bg-slate-800 border border-slate-700 border-t-[3px] border-t-emerald-500 min-w-[260px] hidden group-hover:flex flex-col shadow-2xl rounded-b-md">
              
              {/* Qualitative Analysis */}
              <div className="group/sub relative px-5 py-3 text-slate-300 hover:bg-slate-700 hover:text-white flex justify-between items-center transition-colors border-b border-slate-700/50">
                <span>Qualitative Analysis</span>
                <ChevronRight size={14} className="text-slate-500" />
                {/* Submenu */}
                <div className="absolute top-0 right-full bg-slate-800 border border-slate-700 border-t-[3px] border-t-emerald-500 min-w-[240px] hidden group-hover/sub:flex flex-col shadow-2xl rounded-l-md rounded-br-md -mr-[1px]">
                  <div className="px-5 py-3 hover:bg-slate-700 cursor-pointer flex justify-between items-center" onClick={() => handleModuleClick('editor')}>
                    <span className="text-emerald-400 font-semibold">BowTie Analysis</span>
                  </div>
                  <div className="px-5 py-3 hover:bg-slate-700 cursor-pointer flex justify-between items-center" onClick={() => handleModuleClick('faulttree')}>
                    <span className="text-emerald-400 font-semibold">Fault Tree Analysis</span>
                    <Lock size={14} className="text-slate-500"/>
                  </div>
                  <div className="px-5 py-3 hover:bg-slate-700 cursor-pointer flex justify-between items-center" onClick={() => handleModuleClick('eventtree')}>
                    <span className="text-emerald-400 font-semibold">Event Tree Analysis</span>
                    <Lock size={14} className="text-slate-500"/>
                  </div>
                </div>
              </div>

              {/* Semi-Quantitative Analysis */}
              <div className="group/sub relative px-5 py-3 text-slate-300 hover:bg-slate-700 hover:text-white flex justify-between items-center transition-colors border-b border-slate-700/50">
                <span>Semi-Quantitative</span>
                <ChevronRight size={14} className="text-slate-500" />
                {/* Submenu */}
                <div className="absolute top-0 right-full bg-slate-800 border border-slate-700 border-t-[3px] border-t-emerald-500 min-w-[240px] hidden group-hover/sub:flex flex-col shadow-2xl rounded-l-md rounded-br-md -mr-[1px]">
                  <div className="px-5 py-3 hover:bg-slate-700 cursor-pointer flex justify-between items-center" onClick={() => handleModuleClick('hazop')}>
                    <span className="text-emerald-400 font-semibold">HAZOP Study</span>
                    <Lock size={14} className="text-slate-500"/>
                  </div>
                  <div className="px-5 py-3 hover:bg-slate-700 cursor-pointer flex justify-between items-center" onClick={() => handleModuleClick('lopa')}>
                    <span className="text-emerald-400 font-semibold">LOPA</span>
                    <Lock size={14} className="text-slate-500"/>
                  </div>
                  <div className="px-5 py-3 hover:bg-slate-700 cursor-pointer flex justify-between items-center" onClick={() => handleModuleClick('fmea')}>
                    <span className="text-emerald-400 font-semibold">FMEA</span>
                    <Lock size={14} className="text-slate-500"/>
                  </div>
                </div>
              </div>

              {/* Quantitative Analysis */}
              <div className="group/sub relative px-5 py-3 text-slate-300 hover:bg-slate-700 hover:text-white flex justify-between items-center transition-colors">
                <span>Quantitative Analysis</span>
                <ChevronRight size={14} className="text-slate-500" />
                 {/* Submenu */}
                 <div className="absolute top-0 right-full bg-slate-800 border border-slate-700 border-t-[3px] border-t-emerald-500 min-w-[240px] hidden group-hover/sub:flex flex-col shadow-2xl rounded-l-md rounded-br-md -mr-[1px]">
                  <div className="px-5 py-3 hover:bg-slate-700 cursor-pointer flex justify-between items-center" onClick={() => handleModuleClick('qra')}>
                    <span className="text-emerald-400 font-semibold">QRA</span>
                    <Lock size={14} className="text-slate-500"/>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
          <div className="nav-item h-full flex items-center cursor-pointer hover:text-emerald-400 transition-colors" onClick={() => onNavigate('case-studies')}>Case Studies</div>
          <div className="nav-item h-full flex items-center cursor-pointer hover:text-emerald-400 transition-colors">Industries</div>
          <div className="nav-item h-full flex items-center cursor-pointer hover:text-emerald-400 transition-colors" onClick={() => setSupportOpen(true)}>Support</div>
          
          <button onClick={() => setSignInOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg font-bold transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95 ml-2">
            Sign In
          </button>
        </div>

        <div className="md:hidden flex items-center">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <div className="relative h-[calc(100vh-70px)] min-h-[500px] flex items-center px-6 md:px-20 bg-[image:linear-gradient(to_right,#0f172a_30%,rgba(15,23,42,0.6)),url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center">
        <div className="max-w-[700px] z-10 relative animate-fade-in-up">
          <div className="text-[13px] font-bold text-emerald-400 mb-4 tracking-[2px] uppercase flex items-center gap-2">
            <span className="w-8 h-0.5 bg-emerald-500 inline-block"></span>
            Enterprise Safety Solution
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight text-white drop-shadow-2xl">
            Visualizing Risk for<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Safer Operations</span>
          </h1>
          <p className="text-lg text-slate-300 mb-10 leading-relaxed max-w-[550px]">
            Empower your organization with advanced Bowtie methodology. Identify hazards, visualize barriers, and prevent incidents before they happen with AI-powered insights.
          </p>
          <div className="flex gap-4 flex-wrap">
            <button 
                onClick={() => setTrialOpen(true)} 
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xl shadow-emerald-900/50 hover:shadow-emerald-500/40 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 flex items-center gap-2 group"
            >
              Request Free Trial <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
            </button>
            <button 
                onClick={() => setLearnMoreOpen(true)} 
                className="px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-emerald-400 text-white hover:text-emerald-400 font-bold rounded-xl transition-all duration-300 shadow-lg transform hover:-translate-y-1"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* AUTH MODAL */}
      {isAuthOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in text-white border border-slate-700">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900">
              <h2 className="text-lg font-bold flex items-center gap-2"><Lock className="text-emerald-500" size={18}/> Protected Module</h2>
              <button onClick={() => { setAuthOpen(false); setAuthPassword(""); setPendingModule(null); }} className="text-slate-400 hover:text-white"><X size={20}/></button>
            </div>
            <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
              <div className="text-center mb-4">
                 <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-500">
                    <KeyRound size={24} />
                 </div>
                 <p className="text-sm text-slate-300">Enter access code to unlock this module.</p>
              </div>
              <div>
                <input 
                  autoFocus
                  required 
                  type="password" 
                  className="w-full p-3 bg-slate-900 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-500 text-center tracking-widest text-lg font-bold" 
                  placeholder="• • • • • • • • • • • • •" 
                  value={authPassword} 
                  onChange={e => setAuthPassword(e.target.value)} 
                />
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all shadow-lg">Unlock Module</button>
            </form>
          </div>
        </div>
      )}

      {/* TRIAL REQUEST MODAL */}
      {isTrialOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in text-white border border-slate-700">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900">
              <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-400"><Briefcase className="text-emerald-500" size={20}/> Request 7-Day Trial</h2>
              <button onClick={() => { setTrialOpen(false); setTrialSubmitted(false); }} className="text-slate-400 hover:text-white"><X size={20}/></button>
            </div>
            
            {trialSubmitted ? (
               <div className="p-10 text-center flex flex-col items-center">
                 <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4"><CheckCircle size={32}/></div>
                 <h3 className="text-2xl font-bold text-white mb-2">Request Received!</h3>
                 <p className="text-slate-400 mb-6">Our admin team will review your details. Once approved, you will receive an authorization email to sign in.</p>
                 <button onClick={() => { setTrialOpen(false); setTrialSubmitted(false); }} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500">Close</button>
               </div>
            ) : (
              <form onSubmit={handleTrialSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input required className="w-full pl-10 p-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-400" placeholder="John Doe" value={trialForm.name} onChange={e => setTrialForm({...trialForm, name: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Work Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input required type="email" className="w-full pl-10 p-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-400" placeholder="john@company.com" value={trialForm.email} onChange={e => setTrialForm({...trialForm, email: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">Company</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 text-slate-400" size={16} />
                      <input required className="w-full pl-10 p-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-400" placeholder="Acme Inc." value={trialForm.company} onChange={e => setTrialForm({...trialForm, company: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">Job Title</label>
                    <input required className="w-full p-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-400" placeholder="Safety Manager" value={trialForm.role} onChange={e => setTrialForm({...trialForm, role: e.target.value})} />
                  </div>
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">Submit Request</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SUPPORT MODAL */}
      {isSupportOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in text-white border border-slate-700">
             <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900">
              <h2 className="text-xl font-bold flex items-center gap-2 text-teal-400"><HelpCircle className="text-teal-500" size={20}/> Contact Support</h2>
              <button onClick={() => setSupportOpen(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
            </div>
            <div className="p-8">
               <p className="text-slate-300 mb-6">
                 Need assistance with a specific module? Reach out to our dedicated support teams directly.
               </p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 hover:border-teal-500/50 transition-colors group">
                     <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-teal-400">Support</div>
                     <a href="mailto:support@sfl.com.pk" className="text-teal-400 hover:underline font-mono text-sm">support@sfl.com.pk</a>
                  </div>

                  <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 hover:border-emerald-500/50 transition-colors group">
                     <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-emerald-400">Quantitative Analysis</div>
                     <a href="mailto:Quantitative.Analysis@sfl.com.pk" className="text-emerald-400 hover:underline font-mono text-xs break-all">Quantitative.Analysis@sfl.com.pk</a>
                  </div>
                  
                  <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 hover:border-blue-500/50 transition-colors group">
                     <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-blue-400">Qualitative Analysis</div>
                     <a href="mailto:Qualitative.Analysis@sfl.com.pk" className="text-blue-400 hover:underline font-mono text-xs break-all">Qualitative.Analysis@sfl.com.pk</a>
                  </div>

                  <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 hover:border-orange-500/50 transition-colors group">
                     <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-orange-400">Semi-Quantitative Analysis</div>
                     <a href="mailto:Semi-Quantitative.Analysis@sfl.com.pk" className="text-orange-400 hover:underline font-mono text-xs break-all">Semi-Quantitative.Analysis@sfl.com.pk</a>
                  </div>
               </div>
            </div>
            <div className="bg-slate-900 p-4 flex justify-end border-t border-slate-700">
              <button onClick={() => setSupportOpen(false)} className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ABOUT US MODAL */}
      {isAboutOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-fade-in text-white border border-slate-700">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900">
              <h2 className="text-xl font-bold flex items-center gap-2">About Us</h2>
              <button onClick={() => setAboutOpen(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh]">
               <div className="flex gap-6">
                 <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center flex-shrink-0"><Target size={24}/></div>
                 <div>
                   <h3 className="text-lg font-bold text-white mb-2">Our Mission</h3>
                   <p className="text-slate-400 leading-relaxed">
                     To democratize advanced safety analysis by providing intuitive, AI-powered tools that empower every safety professional, from the shop floor to the boardroom, to proactively identify and mitigate risks.
                   </p>
                 </div>
               </div>
               
               {/* Founder Section */}
               <div className="mt-8 pt-8 border-t border-slate-700">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><User size={20} className="text-emerald-500"/> Meet the Founder</h3>
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-shrink-0 mx-auto md:mx-0">
                       <img 
                         src="./Mubeen Ahsan.jpg" 
                         alt="Mubeen Ahsan" 
                         className="w-32 h-32 rounded-full object-cover border-4 border-slate-600 shadow-xl"
                       />
                       <div className="text-center mt-3">
                         <div className="font-bold text-white">Mubeen Ahsan</div>
                         <div className="text-xs text-emerald-400 font-medium">Founder & CEO</div>
                       </div>
                    </div>
                    <div className="flex-grow space-y-4 text-slate-300 leading-relaxed text-sm">
                       <p>
                         I am a Chemical Engineer and a graduate of the <strong>University of Engineering and Technology (UET), Lahore, Pakistan</strong>, driven by a simple yet powerful belief: safety should never be complicated or out of reach.
                       </p>
                       <p>
                         During my Master’s degree studies, I witnessed the unseen struggle of safety professionals—skilled individuals spending countless hours manually preparing reports, diagrams, and risk assessments. In an age defined by automation and innovation, safety work remained trapped in outdated, labor-intensive processes. This gap did not just waste time; it limited the true potential of safety to protect lives.
                       </p>
                       <p>
                         Motivated by this realization, I introduced the vision of <strong>Safety for All (SfL)</strong>. My mission is to break barriers in safety management by making modern, intelligent safety tools accessible to everyone—from small workplaces to large industries.
                       </p>
                       <p>
                         For me, safety is more than compliance; it is a responsibility, a culture, and a fundamental right. Through Safety for All, I envision a future where technology empowers people, simplifies safety, and ensures that every life is protected—because safety is for all.
                       </p>
                    </div>
                  </div>
               </div>
            </div>
            <div className="bg-slate-900 p-4 flex justify-end border-t border-slate-700">
              <button onClick={() => setAboutOpen(false)} className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* LEARN MORE MODAL */}
      {isLearnMoreOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-fade-in text-white border border-slate-700">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900 flex-shrink-0">
              <h2 className="text-xl font-bold flex items-center gap-2"><BookOpen className="text-emerald-500" size={20}/> Learn More</h2>
              <button onClick={() => setLearnMoreOpen(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
            </div>
            <div className="p-8 overflow-y-auto space-y-6 leading-relaxed text-slate-300 text-base">
               <div>
                 <strong className="text-white block mb-2 text-lg border-b border-slate-600 pb-2">Our Aims</strong>
                 <ul className="space-y-2 list-disc pl-5 marker:text-emerald-500">
                    <li>Reducing time wastage in conventional risk assessment processes</li>
                    <li>Preventing the neglect of small but high-impact hazards</li>
                    <li>Minimizing human error in safety documentation</li>
                    <li>Enabling smarter, faster, and more reliable safety decisions</li>
                 </ul>
               </div>

               <p>
                 <strong className="text-white block mb-1">Evolution of Risk Management</strong>
                 Traditionally, risk management has been confined to static spreadsheets and dense reports that are difficult to interpret and often collect dust on shelves. This approach creates a disconnect between the analyzed risks and the operational reality. Our platform bridges this gap by transforming static data into dynamic, visual models that are easily understood by all stakeholders, ensuring that safety critical information is accessible when and where it's needed most.
               </p>
               <p>
                 <strong className="text-white block mb-1">The Power of BowTie Methodology</strong>
                 At the core of our solution is the BowTie methodology, a powerful visual tool that maps the path from potential causes (threats) to the central hazard and subsequent consequences. By clearly visualizing the "barriers" on both sides of the top event—preventive controls on the left and recovery measures on the right—organizations can instantly identify weaknesses in their defense systems. This clarity is essential for prioritizing maintenance, training, and resource allocation.
               </p>
               <p>
                 <strong className="text-white block mb-1">Integrating Quantitative Analysis</strong>
                 While qualitative models provide the big picture, quantitative data drives precision. Our platform seamlessly integrates Event Tree Analysis (ETA) and Fault Tree Analysis (FTA) with the broader risk framework. This allows safety engineers to not only visualize the "what" and "how" of potential accidents but also calculate the "how likely," enabling data-driven decision-making for complex systems where reliability is paramount.
               </p>
               <p>
                 <strong className="text-white block mb-1">AI-Driven Insights</strong>
                 We leverage cutting-edge Artificial Intelligence to augment human expertise. Our AI assistants help identify potential blind spots by suggesting threats and consequences based on vast databases of industrial incidents. This doesn't replace the safety expert but acts as a tireless co-pilot, reducing cognitive load and helping to ensure that no critical scenario is overlooked in the analysis process. Our Gemini 3 models analyze specific contextual data to generate bespoke diagrams.
               </p>
            </div>
          </div>
        </div>
      )}

      {/* SIGN IN MODAL */}
      {isSignInOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in text-white border border-slate-700">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900">
              <h2 className="text-xl font-bold">Sign In</h2>
              <button onClick={() => setSignInOpen(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
            </div>
            <form onSubmit={handleSignIn} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Authorized Email</label>
                <input required type="email" className="w-full p-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-400" placeholder="name@company.com" value={signInEmail} onChange={e => setSignInOpenEmail(e.target.value)} />
                <p className="text-xs text-slate-400 mt-2">Use the email approved during trial request.</p>
              </div>
              <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-emerald-600/20">Access Dashboard</button>
            </form>
          </div>
        </div>
      )}

      {/* --- AI CHATBOT WIDGET --- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Chat Window */}
        {isChatOpen && (
          <div className="mb-4 w-[350px] h-[500px] bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden animate-fade-in-up">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"><MessageSquare size={16}/></div>
                <div>
                  <h3 className="font-bold text-sm">Safety Assistant</h3>
                  <span className="text-xs text-emerald-100 flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Online</span>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors"><X size={18}/></button>
            </div>
            
            <div className="flex-grow p-4 overflow-y-auto bg-slate-900 space-y-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-br-none' 
                      : 'bg-slate-700 border border-slate-600 text-white rounded-bl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                   <div className="bg-slate-700 border border-slate-600 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1 items-center">
                     <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                     <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                     <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                   </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChatSubmit} className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
              <input 
                className="flex-grow bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400"
                placeholder="Type a message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={isChatLoading || !chatInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
        
        {/* Toggle Button */}
        {!isChatOpen && (
           <button 
             onClick={() => setChatOpen(true)} 
             className="w-14 h-14 bg-emerald-600 hover:bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95"
           >
             <MessageSquare size={24} />
           </button>
        )}
      </div>

    </div>
  );
};

export default LandingPage;
