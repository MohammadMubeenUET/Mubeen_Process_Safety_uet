
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Sparkles, Loader2, Plus, Trash2, Save, 
  FileText, BrainCircuit, Activity, Download, BookOpen
} from 'lucide-react';
import { generateHazopData } from '../services/geminiService';
import { HazopNode, HazopRow, RiskScore } from '../types';

interface HazopEditorProps {
  onBack: () => void;
  initialData?: HazopNode;
}

const HazopEditor: React.FC<HazopEditorProps> = ({ onBack, initialData }) => {
  const [nodeInput, setNodeInput] = useState("");
  const [currentNode, setCurrentNode] = useState<HazopNode | null>(null);
  const [loading, setLoading] = useState(false);

  // --- Risk Matrix Logic (5x5) ---
  const calculateRisk = (s: number, f: number): { rr: string, color: string } => {
    const score = s * f;
    if (score >= 15) return { rr: `High (${score})`, color: '#ef4444' }; // Red
    if (score >= 8) return { rr: `Med (${score})`, color: '#eab308' };  // Yellow
    return { rr: `Low (${score})`, color: '#22c55e' };                  // Green
  };

  // Initial Data or Empty State
  useEffect(() => {
    if (initialData) {
      setCurrentNode(initialData);
      setNodeInput(initialData.name);
    } else if (!currentNode) {
      setCurrentNode({
        id: '1',
        name: "Node 1: Transfer Line",
        designIntent: "Transfer solvent from Tank A to Tank B at 50kg/hr",
        rows: [
          createEmptyRow()
        ]
      });
    }
  }, [initialData]);

  const createEmptyRow = (): HazopRow => ({
    id: Math.random().toString(36).substr(2, 9),
    deviation: "",
    cause: "",
    consequence: "",
    riskBefore: { s: 3, f: 3, rr: "", color: "" },
    safeguardsInstrumental: "",
    safeguardsOther: "",
    riskAfter: { s: 3, f: 1, rr: "", color: "" },
    recommendations: "",
    responsibility: "Process Eng",
    status: 'Open'
  });

  const handleGenerate = async (mode: 'normal' | 'rigorous') => {
    if (!nodeInput) return alert("Please enter a Node Name/Description.");
    setLoading(true);
    try {
      const result = await generateHazopData(nodeInput, mode);
      setCurrentNode(result);
    } catch (e) {
      alert("Failed to generate HAZOP.");
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (id: string, field: keyof HazopRow, value: any) => {
    if (!currentNode) return;
    const newRows = currentNode.rows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    );
    setCurrentNode({ ...currentNode, rows: newRows });
  };

  const updateRisk = (id: string, type: 'riskBefore' | 'riskAfter', subField: 's' | 'f', value: number) => {
    if (!currentNode) return;
    const newRows = currentNode.rows.map(row => {
      if (row.id === id) {
        const currentRisk = row[type];
        const newRisk = { ...currentRisk, [subField]: value };
        return { ...row, [type]: newRisk };
      }
      return row;
    });
    setCurrentNode({ ...currentNode, rows: newRows });
  };

  const addRow = () => {
    if (!currentNode) return;
    setCurrentNode({ ...currentNode, rows: [...currentNode.rows, createEmptyRow()] });
  };

  const deleteRow = (id: string) => {
    if (!currentNode) return;
    setCurrentNode({ ...currentNode, rows: currentNode.rows.filter(r => r.id !== id) });
  };

  const exportCSV = () => {
    if(!currentNode) return;
    const headers = "Deviation,Cause,Consequence,Risk(S),Risk(F),Risk(RR),Safeguards(Inst),Safeguards(Other),Residual(S),Residual(F),Residual(RR),Recommendations\n";
    const rows = currentNode.rows.map(r => 
      `"${r.deviation}","${r.cause}","${r.consequence}",${r.riskBefore.s},${r.riskBefore.f},${calculateRisk(r.riskBefore.s, r.riskBefore.f).rr},"${r.safeguardsInstrumental}","${r.safeguardsOther}",${r.riskAfter.s},${r.riskAfter.f},${calculateRisk(r.riskAfter.s, r.riskAfter.f).rr},"${r.recommendations}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HAZOP_${currentNode.name.replace(/\s/g, '_')}.csv`;
    a.click();
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
               <Activity className="text-orange-600" size={20}/> HAZOP Study
             </h1>
             <p className="text-xs text-slate-500">Hazard and Operability Analysis Worksheet</p>
           </div>
        </div>
        
        <div className="flex flex-grow max-w-2xl gap-2 items-center">
            <input 
              className="flex-grow px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all"
              placeholder="Enter Node Description (e.g. Node 1: Reactor Feed Pump)..."
              value={nodeInput}
              onChange={e => setNodeInput(e.target.value)}
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
         {currentNode && (
           <div className="bg-white rounded-lg shadow-xl border border-slate-300 min-w-[1400px]">
              
              {/* Node Header */}
              <div className="bg-slate-50 p-4 border-b border-slate-300 flex gap-8">
                 <div className="flex-grow">
                    <label className="text-xs font-bold text-slate-500 uppercase">Node Name</label>
                    <input className="w-full bg-transparent font-bold text-lg text-slate-800 outline-none border-b border-dashed border-slate-300 focus:border-orange-500" 
                      value={currentNode.name} onChange={e => setCurrentNode({...currentNode, name: e.target.value})} 
                    />
                 </div>
                 <div className="flex-grow-[2]">
                    <label className="text-xs font-bold text-slate-500 uppercase">Design Intent</label>
                    <input className="w-full bg-transparent text-slate-700 outline-none border-b border-dashed border-slate-300 focus:border-orange-500" 
                      value={currentNode.designIntent} onChange={e => setCurrentNode({...currentNode, designIntent: e.target.value})} 
                    />
                 </div>
              </div>

              {/* Spreadsheet Table */}
              <table className="w-full text-sm text-left border-collapse">
                 <thead className="bg-slate-800 text-white sticky top-0 z-10">
                    <tr>
                       <th className="p-3 border-r border-slate-600 w-12 text-center">#</th>
                       <th className="p-3 border-r border-slate-600 w-32">Deviation</th>
                       <th className="p-3 border-r border-slate-600 w-48">Causes</th>
                       <th className="p-3 border-r border-slate-600 w-48">Consequences</th>
                       <th className="p-1 border-r border-slate-600 w-24 text-center bg-slate-700">
                          <div className="text-[10px] uppercase opacity-70 mb-1">Risk (Pre)</div>
                          <div className="grid grid-cols-3 gap-1"><span>S</span><span>F</span><span>RR</span></div>
                       </th>
                       <th className="p-3 border-r border-slate-600 w-48 bg-blue-900">Safeguards (Instrumental)</th>
                       <th className="p-3 border-r border-slate-600 w-48 bg-blue-900">Safeguards (Other)</th>
                       <th className="p-1 border-r border-slate-600 w-24 text-center bg-emerald-900">
                          <div className="text-[10px] uppercase opacity-70 mb-1">Risk (Post)</div>
                          <div className="grid grid-cols-3 gap-1"><span>S</span><span>F</span><span>RR</span></div>
                       </th>
                       <th className="p-3 border-r border-slate-600 w-48">Recommendations</th>
                       <th className="p-3 w-10"></th>
                    </tr>
                 </thead>
                 <tbody>
                    {currentNode.rows.map((row, idx) => {
                       const riskPre = calculateRisk(row.riskBefore.s, row.riskBefore.f);
                       const riskPost = calculateRisk(row.riskAfter.s, row.riskAfter.f);
                       
                       return (
                        <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50 group align-top">
                           <td className="p-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                           
                           {/* Deviation */}
                           <td className="p-2 border-r border-slate-200">
                              <textarea className="w-full h-full bg-transparent outline-none resize-none min-h-[60px]" 
                                value={row.deviation} onChange={e => updateRow(row.id, 'deviation', e.target.value)} placeholder="e.g. No Flow" />
                           </td>

                           {/* Cause */}
                           <td className="p-2 border-r border-slate-200">
                              <textarea className="w-full h-full bg-transparent outline-none resize-none min-h-[60px]" 
                                value={row.cause} onChange={e => updateRow(row.id, 'cause', e.target.value)} placeholder="e.g. Pump Failure" />
                           </td>

                           {/* Consequence */}
                           <td className="p-2 border-r border-slate-200">
                              <textarea className="w-full h-full bg-transparent outline-none resize-none min-h-[60px]" 
                                value={row.consequence} onChange={e => updateRow(row.id, 'consequence', e.target.value)} placeholder="e.g. Loss of prod." />
                           </td>

                           {/* Risk Pre */}
                           <td className="p-1 border-r border-slate-200 bg-slate-50 text-center align-middle">
                              <div className="grid grid-cols-3 gap-1 items-center h-full">
                                 <select className="bg-white border border-slate-300 rounded text-xs p-0.5 w-full" value={row.riskBefore.s} onChange={e => updateRisk(row.id, 'riskBefore', 's', parseInt(e.target.value))}>
                                   {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                                 </select>
                                 <select className="bg-white border border-slate-300 rounded text-xs p-0.5 w-full" value={row.riskBefore.f} onChange={e => updateRisk(row.id, 'riskBefore', 'f', parseInt(e.target.value))}>
                                   {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                                 </select>
                                 <div className="text-[10px] font-bold px-0.5 py-1 rounded text-white truncate" style={{ backgroundColor: riskPre.color }}>
                                    {riskPre.rr}
                                 </div>
                              </div>
                           </td>

                           {/* Safeguards Inst */}
                           <td className="p-2 border-r border-slate-200 bg-blue-50/30">
                              <textarea className="w-full h-full bg-transparent outline-none resize-none min-h-[60px] text-sm" 
                                value={row.safeguardsInstrumental} onChange={e => updateRow(row.id, 'safeguardsInstrumental', e.target.value)} placeholder="Tag & Action" />
                           </td>

                           {/* Safeguards Other */}
                           <td className="p-2 border-r border-slate-200 bg-blue-50/30">
                              <textarea className="w-full h-full bg-transparent outline-none resize-none min-h-[60px] text-sm" 
                                value={row.safeguardsOther} onChange={e => updateRow(row.id, 'safeguardsOther', e.target.value)} placeholder="SOPs, PPE..." />
                           </td>

                           {/* Risk Post */}
                           <td className="p-1 border-r border-slate-200 bg-emerald-50 text-center align-middle">
                              <div className="grid grid-cols-3 gap-1 items-center h-full">
                                 <select className="bg-white border border-slate-300 rounded text-xs p-0.5 w-full" value={row.riskAfter.s} onChange={e => updateRisk(row.id, 'riskAfter', 's', parseInt(e.target.value))}>
                                   {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                                 </select>
                                 <select className="bg-white border border-slate-300 rounded text-xs p-0.5 w-full" value={row.riskAfter.f} onChange={e => updateRisk(row.id, 'riskAfter', 'f', parseInt(e.target.value))}>
                                   {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                                 </select>
                                 <div className="text-[10px] font-bold px-0.5 py-1 rounded text-white truncate" style={{ backgroundColor: riskPost.color }}>
                                    {riskPost.rr}
                                 </div>
                              </div>
                           </td>

                           {/* Recommendations */}
                           <td className="p-2 border-r border-slate-200">
                              <textarea className="w-full h-full bg-transparent outline-none resize-none min-h-[60px] text-orange-700 font-medium" 
                                value={row.recommendations} onChange={e => updateRow(row.id, 'recommendations', e.target.value)} placeholder="Actions required..." />
                           </td>

                           {/* Delete */}
                           <td className="p-2 text-center align-middle">
                              <button onClick={() => deleteRow(row.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                           </td>
                        </tr>
                       );
                    })}
                 </tbody>
              </table>

              <div className="p-4 border-t border-slate-200 flex justify-between items-center">
                 <button onClick={addRow} className="flex items-center gap-2 text-emerald-600 font-bold hover:bg-emerald-50 px-3 py-2 rounded transition-colors">
                    <Plus size={16}/> Add Row
                 </button>
                 <div className="flex gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full"></span> High Risk (&ge;15)</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-400 rounded-full"></span> Medium Risk (8-14)</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full"></span> Low Risk (&le;7)</div>
                 </div>
              </div>
           </div>
         )}
      </div>
    </div>
  );
};

export default HazopEditor;
