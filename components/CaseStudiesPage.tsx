
import React, { useState } from 'react';
import { 
  ArrowLeft, BookOpen, Activity, GitMerge, FileText, BarChart2, 
  ChevronRight, AlertTriangle, Shield, TrendingUp, Search, X, Printer
} from 'lucide-react';
import { BOWTIE_CASES, FTA_CASES, ETA_CASES, LOPA_CASES, QRA_CASES, HAZOP_CASES } from '../services/caseStudies';
import { CaseStudyWrapper } from '../types';

interface CaseStudiesPageProps {
  onBack: () => void;
  onSelectCase: (module: 'editor' | 'eventtree' | 'faulttree' | 'lopa' | 'qra' | 'hazop', data: any) => void;
}

const CaseStudiesPage: React.FC<CaseStudiesPageProps> = ({ onBack, onSelectCase }) => {
  const [activeCategory, setActiveCategory] = useState<'qualitative' | 'semi' | 'quantitative'>('qualitative');
  const [selectedReport, setSelectedReport] = useState<{
     module: 'editor' | 'eventtree' | 'faulttree' | 'lopa' | 'qra' | 'hazop';
     data: any;
     wrapper: CaseStudyWrapper<any>;
  } | null>(null);

  const handleCaseClick = (module: any, wrapper: CaseStudyWrapper<any>) => {
     setSelectedReport({ module, data: wrapper.data, wrapper });
  };

  const openDiagram = () => {
    if (selectedReport) {
       onSelectCase(selectedReport.module, selectedReport.data);
    }
  };

  const renderReportContent = (text: string) => {
    // Simple markdown-ish parser for the report display
    return text.split('\n').map((line, i) => {
       if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-slate-800 mt-4 mb-2">{line.replace('### ', '')}</h3>;
       if (line.startsWith('**')) return <p key={i} className="font-bold text-slate-800 my-2">{line.replace(/\*\*/g, '')}</p>;
       if (line.startsWith('- ')) return <li key={i} className="ml-4 text-slate-600 mb-1">{line.replace('- ', '')}</li>;
       if (line.trim() === '') return <br key={i}/>;
       return <p key={i} className="text-slate-600 leading-relaxed mb-2">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-6 shadow-lg">
         <div className="max-w-7xl mx-auto">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors">
               <ArrowLeft size={16}/> Back to Home
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-3">
               <BookOpen className="text-amber-500" size={32}/> Safety Case Studies
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl">
               Explore real-world industrial incidents and safety analyses. Select a case study to view the detailed incident report and interactive diagrams.
            </p>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
         
         {/* Sidebar Navigation */}
         <div className="space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Categories</div>
            <button 
               onClick={() => setActiveCategory('qualitative')}
               className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center transition-all ${activeCategory === 'qualitative' ? 'bg-white shadow-md text-emerald-700 border-l-4 border-emerald-600' : 'text-slate-600 hover:bg-slate-200'}`}
            >
               <span className="font-semibold">Qualitative Analysis</span>
               {activeCategory === 'qualitative' && <ChevronRight size={16}/>}
            </button>
            <button 
               onClick={() => setActiveCategory('semi')}
               className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center transition-all ${activeCategory === 'semi' ? 'bg-white shadow-md text-orange-700 border-l-4 border-orange-600' : 'text-slate-600 hover:bg-slate-200'}`}
            >
               <span className="font-semibold">Semi-Quantitative</span>
               {activeCategory === 'semi' && <ChevronRight size={16}/>}
            </button>
            <button 
               onClick={() => setActiveCategory('quantitative')}
               className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center transition-all ${activeCategory === 'quantitative' ? 'bg-white shadow-md text-red-700 border-l-4 border-red-600' : 'text-slate-600 hover:bg-slate-200'}`}
            >
               <span className="font-semibold">Quantitative Analysis</span>
               {activeCategory === 'quantitative' && <ChevronRight size={16}/>}
            </button>
         </div>

         {/* Content Area */}
         <div className="lg:col-span-3 space-y-8">
            
            {activeCategory === 'qualitative' && (
               <div className="space-y-8 animate-fade-in">
                  
                  {/* BowTie Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                     <div className="bg-emerald-50/50 p-4 border-b border-emerald-100 flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><Shield size={20}/></div>
                        <div>
                           <h2 className="text-lg font-bold text-slate-800">BowTie Analysis</h2>
                           <p className="text-xs text-slate-500">Barrier-based risk management</p>
                        </div>
                     </div>
                     <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(BOWTIE_CASES).map(([name, wrapper]) => (
                           <button key={name} onClick={() => handleCaseClick('editor', wrapper)} className="group text-left p-4 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all shadow-sm hover:shadow-md">
                              <div className="font-bold text-slate-800 group-hover:text-emerald-700 mb-1 flex justify-between">
                                 {wrapper.title}
                                 <BookOpen size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="text-xs text-slate-500 line-clamp-2 mb-2">{wrapper.summary}</div>
                              <div className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded border border-slate-200">Click to view Report</div>
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* FTA Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                     <div className="bg-indigo-50/50 p-4 border-b border-indigo-100 flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><GitMerge size={20}/></div>
                        <div>
                           <h2 className="text-lg font-bold text-slate-800">Fault Tree Analysis (FTA)</h2>
                           <p className="text-xs text-slate-500">Deductive failure analysis</p>
                        </div>
                     </div>
                     <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(FTA_CASES).map(([name, wrapper]) => (
                           <button key={name} onClick={() => handleCaseClick('faulttree', wrapper)} className="group text-left p-4 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all shadow-sm hover:shadow-md">
                              <div className="font-bold text-slate-800 group-hover:text-indigo-700 mb-1 flex justify-between">
                                 {wrapper.title}
                                 <BookOpen size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="text-xs text-slate-500 mb-2">{wrapper.summary}</div>
                              <div className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded border border-slate-200">Click to view Report</div>
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* ETA Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                     <div className="bg-emerald-50/50 p-4 border-b border-emerald-100 flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><Activity size={20}/></div>
                        <div>
                           <h2 className="text-lg font-bold text-slate-800">Event Tree Analysis (ETA)</h2>
                           <p className="text-xs text-slate-500">Consequence modeling</p>
                        </div>
                     </div>
                     <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(ETA_CASES).map(([name, wrapper]) => (
                           <button key={name} onClick={() => handleCaseClick('eventtree', wrapper)} className="group text-left p-4 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all shadow-sm hover:shadow-md">
                              <div className="font-bold text-slate-800 group-hover:text-emerald-700 mb-1 flex justify-between">
                                 {wrapper.title}
                                 <BookOpen size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="text-xs text-slate-500 mb-2">{wrapper.summary}</div>
                              <div className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded border border-slate-200">Click to view Report</div>
                           </button>
                        ))}
                     </div>
                  </div>

               </div>
            )}

            {activeCategory === 'semi' && (
               <div className="space-y-8 animate-fade-in">
                  
                   {/* HAZOP Section */}
                   <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                     <div className="bg-orange-50/50 p-4 border-b border-orange-100 flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Activity size={20}/></div>
                        <div>
                           <h2 className="text-lg font-bold text-slate-800">HAZOP Study</h2>
                           <p className="text-xs text-slate-500">Hazard and Operability Analysis</p>
                        </div>
                     </div>
                     <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(HAZOP_CASES).map(([name, wrapper]) => (
                           <button key={name} onClick={() => handleCaseClick('hazop', wrapper)} className="group text-left p-4 rounded-lg border border-slate-200 hover:border-orange-500 hover:bg-orange-50/30 transition-all shadow-sm hover:shadow-md">
                              <div className="font-bold text-slate-800 group-hover:text-orange-700 mb-1 flex justify-between">
                                 {wrapper.title}
                                 <BookOpen size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="text-xs text-slate-500 mb-2">{wrapper.summary}</div>
                              <div className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded border border-slate-200">Click to view Report</div>
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* LOPA Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                     <div className="bg-amber-50/50 p-4 border-b border-amber-100 flex items-center gap-3">
                        <div className="bg-amber-100 p-2 rounded-lg text-amber-600"><FileText size={20}/></div>
                        <div>
                           <h2 className="text-lg font-bold text-slate-800">LOPA (Layers of Protection)</h2>
                           <p className="text-xs text-slate-500">Semi-quantitative risk verification</p>
                        </div>
                     </div>
                     <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(LOPA_CASES).map(([name, wrapper]) => (
                           <button key={name} onClick={() => handleCaseClick('lopa', wrapper)} className="group text-left p-4 rounded-lg border border-slate-200 hover:border-amber-500 hover:bg-amber-50/30 transition-all shadow-sm hover:shadow-md">
                              <div className="font-bold text-slate-800 group-hover:text-amber-700 mb-1 flex justify-between">
                                 {wrapper.title}
                                 <BookOpen size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="text-xs text-slate-500 mb-2">{wrapper.summary}</div>
                              <div className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded border border-slate-200">Click to view Report</div>
                           </button>
                        ))}
                     </div>
                  </div>

               </div>
            )}

            {activeCategory === 'quantitative' && (
               <div className="space-y-8 animate-fade-in">
                  
                  {/* QRA Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                     <div className="bg-red-50/50 p-4 border-b border-red-100 flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-lg text-red-600"><BarChart2 size={20}/></div>
                        <div>
                           <h2 className="text-lg font-bold text-slate-800">Quantitative Risk Assessment (QRA)</h2>
                           <p className="text-xs text-slate-500">Numerical risk calculation (F-N Curves)</p>
                        </div>
                     </div>
                     <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(QRA_CASES).map(([name, wrapper]) => (
                           <button key={name} onClick={() => handleCaseClick('qra', wrapper)} className="group text-left p-4 rounded-lg border border-slate-200 hover:border-red-500 hover:bg-red-50/30 transition-all shadow-sm hover:shadow-md">
                              <div className="font-bold text-slate-800 group-hover:text-red-700 mb-1 flex justify-between">
                                 {wrapper.title}
                                 <BookOpen size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="text-xs text-slate-500 mb-2">{wrapper.summary}</div>
                              <div className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded border border-slate-200">Click to view Report</div>
                           </button>
                        ))}
                     </div>
                  </div>

               </div>
            )}

         </div>
      </div>

      {/* REPORT VIEWER MODAL */}
      {selectedReport && (
         <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
               {/* REPORT HEADER WITH LOGO */}
               <div className="bg-slate-900 text-white p-6 flex justify-between items-center border-b border-slate-700">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-emerald-500 flex items-center justify-center rounded-md">
                        <Activity className="text-white" strokeWidth={2.5} size={24} />
                     </div>
                     <div>
                        <h2 className="font-bold text-xl tracking-tight">Safety for All</h2>
                        <div className="text-xs text-emerald-400 uppercase tracking-widest">Incident Investigation Report</div>
                     </div>
                  </div>
                  <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-slate-700 rounded-full transition-colors"><X/></button>
               </div>

               {/* REPORT CONTENT */}
               <div className="flex-grow overflow-y-auto p-10 bg-white">
                  <div className="max-w-3xl mx-auto">
                     <div className="border-b-2 border-slate-100 pb-6 mb-8">
                        <h1 className="text-4xl font-black text-slate-900 mb-2">{selectedReport.wrapper.title}</h1>
                        <p className="text-lg text-slate-500 font-medium">{selectedReport.wrapper.summary}</p>
                     </div>
                     <div className="prose prose-slate max-w-none">
                        {renderReportContent(selectedReport.wrapper.report)}
                     </div>
                  </div>
               </div>

               {/* FOOTER ACTIONS */}
               <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                  <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors">
                     <Printer size={16} /> Print Report
                  </button>
                  <button 
                     onClick={openDiagram}
                     className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/30 flex items-center gap-2 transform transition-all hover:-translate-y-0.5"
                  >
                     <Activity size={18}/> Open Interactive Diagram
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default CaseStudiesPage;
