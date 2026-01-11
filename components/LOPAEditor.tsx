
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Sparkles, Loader2, Plus, Trash2, Save, 
  XCircle, CheckCircle, Layers, FileText
} from 'lucide-react';
import { generateLopaData } from '../services/geminiService';
import { LopaScenario, IPL } from '../types';
import ReportModal from './ReportModal';

// Exact layers from the provided reference image (Outer to Inner)
const ONION_LAYERS = [
  { id: 'Community', label: '9. Community Emergency Response', color: '#000000', textColors: 'white', radius: 190 }, 
  { id: 'Plant', label: '8. Plant Emergency Response', color: '#ff0000', textColors: 'white', radius: 170 },
  { id: 'FireGas', label: '7. Fire & Gas System', color: '#ff5e00', textColors: 'black', radius: 150 },
  { id: 'Bunds', label: '6. Physical Containment (Bunds)', color: '#ffaa00', textColors: 'black', radius: 130 },
  { id: 'Relief', label: '5. Physical Protection (Relief)', color: '#ffea00', textColors: 'black', radius: 110 },
  { id: 'SIS', label: '4. Safety Instrumented System', color: '#eaff8f', textColors: 'black', radius: 90 },
  { id: 'Alarm', label: '3. Alarms & Operator Intervention', color: '#9fff9f', textColors: 'black', radius: 70 },
  { id: 'BPCS', label: '2. Basic Process Control System', color: '#ccffff', textColors: 'black', radius: 50 },
  // Layer 1 is the center "Process" graphic, handled separately
];

const LOPAEditor = ({ onBack, initialData }: { onBack: () => void, initialData?: LopaScenario }) => {
  const [scenarioInput, setScenarioInput] = useState("");
  const [data, setData] = useState<LopaScenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredIPLIndex, setHoveredIPLIndex] = useState<number | null>(null);
  
  // Report State
  const [showReport, setShowReport] = useState(false);
  const onionRef = useRef<HTMLDivElement>(null);

  // Default empty state or load initial data
  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setScenarioInput(initialData.consequenceDescription);
    } else if (!data) {
      setData({
        id: '1',
        initiatingEvent: "Pump Seal Failure",
        frequency: 0.1,
        consequenceDescription: "Release of flammable liquid leading to fire",
        targetFrequency: 1e-4,
        ipls: [
          { name: "High Pressure Alarm", pfd: 0.1, layerType: 'Alarm' },
          { name: "Relief Valve", pfd: 0.01, layerType: 'Relief' }
        ],
        mitigatedFrequency: 0,
        riskGap: 0
      });
    }
  }, [initialData]);

  // Calculate results whenever inputs change
  useEffect(() => {
    if (data) {
      const iplFactor = data.ipls.reduce((acc, ipl) => acc * ipl.pfd, 1);
      const mitigated = data.frequency * iplFactor;
      const gap = mitigated / data.targetFrequency;
      
      if (mitigated !== data.mitigatedFrequency || gap !== data.riskGap) {
         setData(prev => prev ? ({ ...prev, mitigatedFrequency: mitigated, riskGap: gap }) : null);
      }
    }
  }, [data?.frequency, data?.targetFrequency, data?.ipls]);

  const handleGenerate = async () => {
    if (!scenarioInput) return alert("Please enter a scenario description.");
    setLoading(true);
    try {
      const result = await generateLopaData(scenarioInput);
      setData(result);
    } catch (e) {
      alert("Failed to generate LOPA data.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof LopaScenario, value: any) => {
    if (data) setData({ ...data, [field]: value });
  };

  const updateIPL = (idx: number, field: keyof IPL, value: any) => {
    if (data) {
      const newIPLs = [...data.ipls];
      newIPLs[idx] = { ...newIPLs[idx], [field]: value };
      setData({ ...data, ipls: newIPLs });
    }
  };

  const addIPL = () => {
    if (data) setData({ ...data, ipls: [...data.ipls, { name: "New IPL", pfd: 1.0, layerType: 'BPCS' }] });
  };

  const removeIPL = (idx: number) => {
    if (data) {
      const newIPLs = [...data.ipls];
      newIPLs.splice(idx, 1);
      setData({ ...data, ipls: newIPLs });
    }
  };

  const formatSci = (num: number) => {
    if (num === 0) return "0";
    if (num >= 0.01 && num <= 1000) return Number(num).toFixed(4).replace(/\.?0+$/, "");
    return Number(num).toExponential(2);
  };

  // --- Onion Diagram Render ---
  const renderOnionDiagram = () => {
    const activeLayerId = hoveredIPLIndex !== null && data ? data.ipls[hoveredIPLIndex].layerType : null;
    const centerX = 200;
    const centerY = 200;

    return (
      <svg width="400" height="400" viewBox="0 0 400 400" className="mx-auto drop-shadow-2xl">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
          </marker>
        </defs>

        {/* 1. Render Rings (Outer to Inner) */}
        {ONION_LAYERS.map((layer) => {
            const isActive = layer.id === activeLayerId;
            
            return (
              <g key={layer.id} className="transition-all duration-300">
                {/* Circle Shape */}
                <circle 
                  cx={centerX} cy={centerY} 
                  r={layer.radius} 
                  fill={layer.color}
                  stroke={isActive ? "white" : "rgba(0,0,0,0.1)"}
                  strokeWidth={isActive ? 3 : 1}
                  filter={isActive ? "url(#glow)" : ""}
                  className="transition-all duration-300 ease-out"
                />

                {/* Curved Text Path Definition */}
                <path 
                   id={`textPath-${layer.id}`} 
                   d={`M ${centerX - layer.radius}, ${centerY} a ${layer.radius},${layer.radius} 0 1,1 ${2 * layer.radius},0 a ${layer.radius},${layer.radius} 0 1,1 -${2 * layer.radius},0`} 
                   fill="none" 
                   stroke="none"
                />
                
                {/* Label Text */}
                <text fontSize="10" fill={layer.textColors} fontWeight="bold" textAnchor="middle" dy="-5">
                   <textPath href={`#textPath-${layer.id}`} startOffset="50%" textAnchor="middle">
                      {layer.label.toUpperCase()}
                   </textPath>
                </text>
              </g>
            );
        })}

        {/* 2. Center "Process" Layer */}
        <g>
           <circle cx={centerX} cy={centerY} r="30" fill="white" stroke="black" strokeWidth="1"/>
           <text x={centerX} y={centerY - 10} textAnchor="middle" fontSize="9" fontWeight="bold">1. Process</text>
           {/* Simple Tank Icon */}
           <rect x={centerX - 10} y={centerY - 2} width="20" height="18" rx="2" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />
           <path d={`M ${centerX - 10} ${centerY - 2} Q ${centerX} ${centerY + 5} ${centerX + 10} ${centerY - 2}`} fill="none" stroke="#334155" strokeWidth="1" />
           <line x1={centerX + 10} y1={centerY + 10} x2={centerX + 18} y2={centerY + 10} stroke="#334155" strokeWidth="1" />
           <line x1={centerX + 14} y1={centerY + 10} x2={centerX + 14} y2={centerY + 16} stroke="#334155" strokeWidth="1" />
        </g>

        {/* 3. Highlight Arrow Indicator */}
        {activeLayerId && (
           <g className="animate-pulse">
              {(() => {
                 const layer = ONION_LAYERS.find(l => l.id === activeLayerId);
                 if (!layer) return null;
                 // Calculate arrow position (pointing from right side)
                 const arrowX = centerX + layer.radius + 10;
                 return (
                    <g>
                       <line 
                          x1={arrowX + 40} y1={centerY} 
                          x2={arrowX} y2={centerY} 
                          stroke="#ef4444" 
                          strokeWidth="3" 
                          markerEnd="url(#arrow)" 
                       />
                       <rect x={arrowX + 45} y={centerY - 12} width="90" height="24" rx="4" fill="#ef4444" />
                       <text x={arrowX + 90} y={centerY} fill="white" fontSize="11" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
                          CURRENT LAYER
                       </text>
                    </g>
                 );
              })()}
           </g>
        )}

      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
             <ArrowLeft size={18} />
           </button>
           <div>
             <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <Layers className="text-emerald-600" size={20}/> Layers of Protection Analysis (LOPA)
             </h1>
             <p className="text-xs text-slate-500">Semi-quantitative risk verification</p>
           </div>
        </div>
        
        <div className="flex gap-3">
           <div className="relative group">
             <input 
               className="w-64 pl-4 pr-10 py-2 bg-slate-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all"
               placeholder="Describe scenario (e.g. Tank Overfill)..."
               value={scenarioInput}
               onChange={e => setScenarioInput(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleGenerate()}
             />
             <button 
                onClick={handleGenerate} 
                disabled={loading}
                className="absolute right-1 top-1 p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>}
              </button>
           </div>

           <button onClick={() => setShowReport(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors shadow-md">
             <FileText size={16}/> Report
           </button>
           
           <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md">
             <Save size={16}/> Save
           </button>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-grow p-8 flex justify-center overflow-auto bg-grid-pattern">
        {data && (
          <div className="w-full max-w-7xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
            
            {/* Header / Context */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Initiating Event</label>
                 <input 
                    className="w-full p-2 bg-white border border-slate-300 rounded font-semibold text-slate-800 focus:border-emerald-500 outline-none" 
                    value={data.initiatingEvent} 
                    onChange={e => updateField('initiatingEvent', e.target.value)}
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Consequence</label>
                 <textarea 
                    rows={1}
                    className="w-full p-2 bg-white border border-slate-300 rounded text-slate-600 focus:border-emerald-500 outline-none resize-none" 
                    value={data.consequenceDescription} 
                    onChange={e => updateField('consequenceDescription', e.target.value)}
                 />
               </div>
            </div>

            <div className="flex flex-col lg:flex-row flex-grow">
               
               {/* LEFT PANEL: Calculations */}
               <div className="flex-grow p-8 border-r border-slate-200 lg:w-3/5">
                  {/* Frequency Input */}
                  <div className="grid grid-cols-12 gap-4 items-center mb-6">
                     <div className="col-span-3">
                       <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                         <div className="text-xs text-emerald-600 font-bold uppercase mb-1">Initiating Freq (/yr)</div>
                         <input 
                            type="number"
                            step="0.000001"
                            className="text-2xl font-bold text-emerald-900 bg-transparent text-center w-full outline-none" 
                            value={data.frequency}
                            onChange={e => updateField('frequency', parseFloat(e.target.value))}
                         />
                       </div>
                     </div>
                     <div className="col-span-1 flex justify-center text-slate-400 font-bold text-xl">×</div>
                     <div className="col-span-8 flex items-center text-slate-400 italic text-sm">
                        Probability of Failure on Demand (PFD) Multipliers
                     </div>
                  </div>

                  {/* IPLs Table */}
                  <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <div className="text-xs font-bold text-slate-400 uppercase">Independent Protection Layers (IPLs)</div>
                        <div className="text-xs font-bold text-slate-400 uppercase mr-4">Onion Layer Mapping</div>
                     </div>
                     
                     {data.ipls.map((ipl, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-3 animate-fade-in p-2 rounded-lg transition-colors border-l-4 ${hoveredIPLIndex === idx ? 'bg-amber-50 border-amber-500 shadow-sm' : 'bg-transparent border-transparent'}`}
                        onMouseEnter={() => setHoveredIPLIndex(idx)}
                        onMouseLeave={() => setHoveredIPLIndex(null)}
                      >
                        <div className="flex-grow flex items-center bg-white border border-slate-300 rounded-lg p-2 shadow-sm focus-within:ring-2 focus-within:ring-emerald-100">
                           <input 
                             className="flex-grow font-medium text-slate-700 outline-none min-w-0 bg-transparent text-sm" 
                             value={ipl.name} 
                             onChange={e => updateIPL(idx, 'name', e.target.value)} 
                           />
                           <div className="w-px h-6 bg-slate-200 mx-2"></div>
                           
                           {/* Layer Type Selector */}
                           <select 
                             className="w-40 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded p-1 outline-none mr-2 truncate"
                             value={ipl.layerType || 'BPCS'}
                             onChange={e => updateIPL(idx, 'layerType', e.target.value)}
                           >
                              {ONION_LAYERS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                           </select>

                           <div className="w-px h-6 bg-slate-200 mx-2"></div>
                           <span className="text-xs text-slate-400 mr-2 font-bold">PFD:</span>
                           <input 
                             type="number"
                             step="0.001"
                             className="w-20 text-right font-mono text-sm text-slate-800 outline-none bg-white border border-slate-200 rounded px-1" 
                             value={ipl.pfd} 
                             onChange={e => updateIPL(idx, 'pfd', parseFloat(e.target.value))} 
                           />
                        </div>
                        <button onClick={() => removeIPL(idx)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                      </div>
                     ))}
                     <button onClick={addIPL} className="text-xs flex items-center gap-1 text-emerald-600 font-bold hover:text-emerald-800 mt-2 px-2">
                       <Plus size={14}/> Add IPL
                     </button>
                  </div>

                  <div className="border-t border-slate-200 my-8"></div>

                  {/* Results Blocks */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-bold uppercase mb-2">Mitigated Frequency</div>
                        <div className="text-2xl font-mono text-slate-800">{formatSci(data.mitigatedFrequency)} <span className="text-sm text-slate-400 font-sans">/yr</span></div>
                     </div>

                     <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-bold uppercase mb-2">Target Frequency (TMEL)</div>
                         <div className="flex items-center gap-2">
                           <input 
                              type="number" 
                              step="0.000001"
                              className="text-xl font-mono text-slate-800 bg-transparent outline-none w-full"
                              value={data.targetFrequency}
                              onChange={e => updateField('targetFrequency', parseFloat(e.target.value))}
                           />
                           <span className="text-sm text-slate-400">/yr</span>
                         </div>
                     </div>
                  </div>
                  
                  {/* Risk Gap Indicator */}
                  <div className={`mt-4 p-4 rounded-xl border-2 flex flex-col justify-center items-center relative overflow-hidden ${data.riskGap <= 1 ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
                    <div className="relative z-10 text-center">
                      <div className="text-xs font-bold uppercase mb-1 opacity-80">Risk Gap Ratio</div>
                      <div className="text-3xl font-black">{data.riskGap.toFixed(2)}</div>
                      <div className="text-sm font-bold mt-1 flex items-center justify-center gap-1">
                        {data.riskGap <= 1 ? <><CheckCircle size={16}/> Acceptable Risk</> : <><XCircle size={16}/> Not Acceptable Risk</>}
                      </div>
                    </div>
                 </div>

               </div>

               {/* RIGHT PANEL: Onion Diagram */}
               <div className="lg:w-2/5 bg-slate-100 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-4 left-4 text-slate-500 font-bold text-sm tracking-wider uppercase flex items-center gap-2">
                     <Layers size={16} /> Protection Layers Diagram
                  </div>
                  
                  {/* Diagram Container */}
                  <div className="relative z-10 scale-90 mt-8" ref={onionRef}>
                     {renderOnionDiagram()}
                  </div>

                  <div className="mt-8 text-center px-6 py-4 bg-white/50 rounded-lg border border-slate-200 max-w-sm">
                     <p className="text-xs text-slate-500 leading-relaxed flex items-start gap-2 text-left">
                        <Sparkles size={14} className="flex-shrink-0 text-amber-500 mt-0.5" />
                        <span>Hover over an IPL in the table on the left. The corresponding layer in the onion diagram will be highlighted with an arrow to show which line of defense it represents.</span>
                     </p>
                  </div>
               </div>
            </div>

          </div>
        )}
      </div>

      <ReportModal 
        isOpen={showReport} 
        onClose={() => setShowReport(false)} 
        data={data}
        moduleName="LOPA"
        diagramRef={onionRef}
      />
    </div>
  );
};

export default LOPAEditor;
