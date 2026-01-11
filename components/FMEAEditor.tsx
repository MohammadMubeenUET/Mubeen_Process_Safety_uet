
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Sparkles, Loader2, Plus, Trash2, Save, 
  ClipboardList, BrainCircuit, Download, AlertTriangle
} from 'lucide-react';
import { generateFMEAData } from '../services/geminiService';
import { FmeaSystem, FmeaRow } from '../types';

interface FMEAEditorProps {
  onBack: () => void;
  initialData?: FmeaSystem;
}

const FMEAEditor: React.FC<FMEAEditorProps> = ({ onBack, initialData }) => {
  const [systemInput, setSystemInput] = useState("");
  const [currentSystem, setCurrentSystem] = useState<FmeaSystem | null>(null);
  const [loading, setLoading] = useState(false);

  // Initial Data or Empty State
  useEffect(() => {
    if (initialData) {
      setCurrentSystem(initialData);
      setSystemInput(initialData.systemName);
    } else if (!currentSystem) {
      setCurrentSystem({
        id: '1',
        systemName: "Main Feed Pump System",
        rows: [createEmptyRow()]
      });
    }
  }, [initialData]);

  const createEmptyRow = (): FmeaRow => ({
    id: Math.random().toString(36).substr(2, 9),
    processStep: "",
    failureMode: "",
    failureEffect: "",
    severity: 5,
    cause: "",
    occurrence: 5,
    controls: "",
    detection: 5,
    rpn: 125,
    actions: "",
    responsibility: ""
  });

  const calculateRPN = (s: number, o: number, d: number) => s * o * d;

  const handleGenerate = async (mode: 'normal' | 'rigorous') => {
    if (!systemInput) return alert("Please enter a System Name/Process.");
    setLoading(true);
    try {
      const result = await generateFMEAData(systemInput, mode);
      setCurrentSystem(result);
    } catch (e) {
      alert("Failed to generate FMEA.");
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (id: string, field: keyof FmeaRow, value: any) => {
    if (!currentSystem) return;
    const newRows = currentSystem.rows.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        // Auto-recalc RPN if S, O, or D changed
        if (field === 'severity' || field === 'occurrence' || field === 'detection') {
           updatedRow.rpn = calculateRPN(updatedRow.severity, updatedRow.occurrence, updatedRow.detection);
        }
        return updatedRow;
      }
      return row;
    });
    setCurrentSystem({ ...currentSystem, rows: newRows });
  };

  const addRow = () => {
    if (!currentSystem) return;
    setCurrentSystem({ ...currentSystem, rows: [...currentSystem.rows, createEmptyRow()] });
  };

  const deleteRow = (id: string) => {
    if (!currentSystem) return;
    setCurrentSystem({ ...currentSystem, rows: currentSystem.rows.filter(r => r.id !== id) });
  };

  const exportCSV = () => {
    if(!currentSystem) return;
    const headers = "Process Step,Failure Mode,Effect,Severity,Cause,Occurrence,Controls,Detection,RPN,Actions,Responsibility\n";
    const rows = currentSystem.rows.map(r => 
      `"${r.processStep}","${r.failureMode}","${r.failureEffect}",${r.severity},"${r.cause}",${r.occurrence},"${r.controls}",${r.detection},${r.rpn},"${r.actions}","${r.responsibility}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FMEA_${currentSystem.systemName.replace(/\s/g, '_')}.csv`;
    a.click();
  };

  const getRPNColor = (rpn: number) => {
     if (rpn >= 100) return 'bg-red-100 text-red-700';
     if (rpn >= 40) return 'bg-yellow-100 text-yellow-700';
     return 'bg-green-100 text-green-700';
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between sticky top-0 z-20 shadow-sm gap-4">
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
             <ArrowLeft size={18} />
           </button>
           <div>
             <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <ClipboardList className="text-violet-600" size={20}/> FMEA Analysis
             </h1>
             <p className="text-xs text-slate-500">Failure Mode and Effects Analysis</p>
           </div>
        </div>
        
        <div className="flex flex-grow max-w-2xl gap-2 items-center">
            <input 
              className="flex-grow px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-sm transition-all"
              placeholder="Enter System Name (e.g. Hydraulic Press Line)..."
              value={systemInput}
              onChange={e => setSystemInput(e.target.value)}
            />
            <button onClick={() => handleGenerate('normal')} disabled={loading} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm whitespace-nowrap">
               {loading ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>} AI Draft
            </button>
            <button onClick={() => handleGenerate('rigorous')} disabled={loading} className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 shadow-sm whitespace-nowrap">
               {loading ? <Loader2 className="animate-spin" size={16}/> : <BrainCircuit size={16}/>} Rigorous AI
            </button>
        </div>

        <div className="flex gap-2">
           <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-md">
             <Download size={16}/> Export
           </button>
           <button className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md">
             <Save size={16}/> Save
           </button>
        </div>
      </div>

      {/* Main Worksheet Area */}
      <div className="flex-grow p-4 overflow-auto">
         {currentSystem && (
           <div className="bg-white rounded-lg shadow-xl border border-slate-300 min-w-[1500px]">
              
              {/* System Header */}
              <div className="bg-slate-50 p-4 border-b border-slate-300 flex gap-8">
                 <div className="flex-grow">
                    <label className="text-xs font-bold text-slate-500 uppercase">System / Process Name</label>
                    <input className="w-full bg-transparent font-bold text-lg text-slate-800 outline-none border-b border-dashed border-slate-300 focus:border-violet-500" 
                      value={currentSystem.systemName} onChange={e => setCurrentSystem({...currentSystem, systemName: e.target.value})} 
                    />
                 </div>
              </div>

              {/* Spreadsheet Table */}
              <table className="w-full text-sm text-left border-collapse">
                 <thead className="bg-slate-800 text-white sticky top-0 z-10">
                    <tr>
                       <th className="p-3 border-r border-slate-600 w-12 text-center">#</th>
                       <th className="p-3 border-r border-slate-600 w-32">Process Step / Item</th>
                       <th className="p-3 border-r border-slate-600 w-48">Failure Mode</th>
                       <th className="p-3 border-r border-slate-600 w-48">Effect</th>
                       <th className="p-3 border-r border-slate-600 w-16 text-center bg-red-900" title="Severity (1-10)">S</th>
                       <th className="p-3 border-r border-slate-600 w-48">Potential Causes</th>
                       <th className="p-3 border-r border-slate-600 w-16 text-center bg-orange-900" title="Occurrence (1-10)">O</th>
                       <th className="p-3 border-r border-slate-600 w-48 bg-blue-900">Current Controls</th>
                       <th className="p-3 border-r border-slate-600 w-16 text-center bg-yellow-900" title="Detection (1-10)">D</th>
                       <th className="p-3 border-r border-slate-600 w-20 text-center font-bold">RPN</th>
                       <th className="p-3 border-r border-slate-600 w-48">Recommended Actions</th>
                       <th className="p-3 border-r border-slate-600 w-32">Responsibility</th>
                       <th className="p-3 w-10"></th>
                    </tr>
                 </thead>
                 <tbody>
                    {currentSystem.rows.map((row, idx) => (
                        <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50 group align-top">
                           <td className="p-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                           
                           {/* Process Step */}
                           <td className="p-2 border-r border-slate-200">
                              <textarea className="w-full h-full bg-transparent outline-none resize-none min-h-[60px]" 
                                value={row.processStep} onChange={e => updateRow(row.id, 'processStep', e.target.value)} placeholder="Step 1..." />
                           </td>

                           {/* Failure Mode */}
                           <td className="p-2 border-r border-slate-200">
                              <textarea className="w-full h-full bg-transparent outline-none resize-none min-h-[60px]" 
                                value={row.failureMode} onChange={e => updateRow(row.id, 'failureMode', e.target.value)} placeholder="Mode..." />
                           </td>

                           {/* Effect */}
                           <td className="p-2 border-r border-slate-200">
                              <textarea className="w-full h-full bg-transparent outline-none resize-none min-h-[60px]" 
                                value={row.failureEffect} onChange={e => updateRow(row.id, 'failureEffect', e.target.value)} placeholder="Effect..." />
                           </td>

                           {/* Severity (S) */}
                           <td className="p-2 border-r border-slate-200 bg-red-50/30 text-center align-middle">
                              <select className="bg-white border border-slate-300 rounded p-1 w-full text-center" value={row.severity} onChange={e => updateRow(row.id, 'severity', parseInt(e.target.value))}>
                                {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                              </select>
                           </td>

                           {/* Cause */}
                           <td className="p-2 border-r border-slate-200">
                              <textarea className="w-full h-full bg-transparent outline-none resize-none min-h-[60px]" 
                                value={row.cause} onChange={e => updateRow(row.id, 'cause', e.target.value)} placeholder="Cause..." />
                           </td>

                           {/* Occurrence (O) */}
                           <td className="p-2 border-r border-slate-200 bg-orange-50/30 text-center align-middle">
                              <select className="bg-white border border-slate-300 rounded p-1 w-full text-center" value={row.occurrence} onChange={e => updateRow(row.id, 'occurrence', parseInt(e.target.value))}>
                                {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                              </select>
                           </td>

                           {/* Controls */}
                           <td className="p-2 border-r border-slate-200 bg-blue-50/30">
                              <textarea className="w-full h-full bg-transparent outline-none resize-none min-h-[60px] text-sm" 
                                value={row.controls} onChange={e => updateRow(row.id, 'controls', e.target.value)} placeholder="Current Prevention..." />
                           </td>

                           {/* Detection (D) */}
                           <td className="p-2 border-r border-slate-200 bg-yellow-50/30 text-center align-middle">
                              <select className="bg-white border border-slate-300 rounded p-1 w-full text-center" value={row.detection} onChange={e => updateRow(row.id, 'detection', parseInt(e.target.value))}>
                                {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                              </select>
                           </td>

                           {/* RPN */}
                           <td className="p-2 border-r border-slate-200 text-center align-middle font-bold">
                              <div className={`px-2 py-1 rounded ${getRPNColor(row.rpn)}`}>
                                 {row.rpn}
                              </div>
                           </td>

                           {/* Actions */}
                           <td className="p-2 border-r border-slate-200">
                              <textarea className="w-full h-full bg-transparent outline-none resize-none min-h-[60px] text-violet-600 font-medium" 
                                value={row.actions} onChange={e => updateRow(row.id, 'actions', e.target.value)} placeholder="Improvements..." />
                           </td>

                           {/* Responsibility */}
                           <td className="p-2 border-r border-slate-200">
                              <textarea className="w-full h-full bg-transparent outline-none resize-none min-h-[60px]" 
                                value={row.responsibility} onChange={e => updateRow(row.id, 'responsibility', e.target.value)} placeholder="Who & When" />
                           </td>

                           {/* Delete */}
                           <td className="p-2 text-center align-middle">
                              <button onClick={() => deleteRow(row.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                           </td>
                        </tr>
                    ))}
                 </tbody>
              </table>

              <div className="p-4 border-t border-slate-200 flex justify-between items-center">
                 <button onClick={addRow} className="flex items-center gap-2 text-blue-600 font-bold hover:bg-blue-50 px-3 py-2 rounded transition-colors">
                    <Plus size={16}/> Add Row
                 </button>
                 <div className="flex gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 border border-red-200 rounded"></span> High Risk (RPN &ge; 100)</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></span> Medium Risk (RPN &ge; 40)</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 border border-green-200 rounded"></span> Low Risk</div>
                 </div>
              </div>
           </div>
         )}
      </div>
    </div>
  );
};

export default FMEAEditor;
