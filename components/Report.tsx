
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Sparkles, Loader2, Save, Trash2, 
  BarChart2, AlertCircle, TrendingUp, BookOpen, Grid, Activity
} from 'lucide-react';
import { generateQraData } from '../services/geminiService';
import { QraData, QraScenario } from '../types';

const QRAEditor = ({ onBack, initialData }: { onBack: () => void, initialData?: QraData }) => {
  const [facilityType, setFacilityType] = useState("");
  const [data, setData] = useState<QraData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'fn' | 'matrix'>('fn');

  // Load initial data
  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setFacilityType(initialData.facilityType);
    } else if (!data) {
      // Initial dummy data only if no data
      setData({
        facilityType: "LPG Storage",
        scenarios: [
          { id: '1', name: "Catastrophic Tank Rupture", frequency: 1e-6, fatalities: 50 },
          { id: '2', name: "Loading Arm Leak (Jet Fire)", frequency: 1e-4, fatalities: 2 },
          { id: '3', name: "BLEVE", frequency: 5e-7, fatalities: 100 },
          { id: '4', name: "Pipe Rupture", frequency: 1e-5, fatalities: 5 }
        ],
        totalPLL: 0
      });
    }
  }, [initialData]);

  // Update calculations
  useEffect(() => {
    if (data) {
      const pll = data.scenarios.reduce((acc, s) => acc + (s.frequency * s.fatalities), 0);
      if (pll !== data.totalPLL) {
        setData(prev => prev ? ({ ...prev, totalPLL: pll }) : null);
      }
    }
  }, [data?.scenarios]);

  const handleGenerate = async () => {
    if (!facilityType) return alert("Please enter facility type.");
    setLoading(true);
    try {
      const result = await generateQraData(facilityType);
      setData(result);
    } catch (e) {
      alert("Failed to generate QRA data.");
    } finally {
      setLoading(false);
    }
  };

  const updateScenario = (id: string, field: keyof QraScenario, value: any) => {
    if (data) {
      const newScenarios = data.scenarios.map(s => s.id === id ? { ...s, [field]: value } : s);
      setData({ ...data, scenarios: newScenarios });
    }
  };

  const deleteScenario = (id: string) => {
    if (data) {
      setData({ ...data, scenarios: data.scenarios.filter(s => s.id !== id) });
    }
  };

  // --- F-N Curve Rendering ---
  const renderFNCurve = () => {
    if (!data || data.scenarios.length === 0) return null;

    const width = 600;
    const height = 450;
    const padding = { top: 40, right: 40, bottom: 60, left: 70 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Log Scale Limits
    const minN = 1, maxN = 1000; // X-axis: 1 to 1000 Fatalities
    const minF = 1e-8, maxF = 1e-2; // Y-axis: 10^-8 to 10^-2 Freq

    const logX = (n: number) => {
       const val = Math.max(n, minN);
       return padding.left + (Math.log10(val) - Math.log10(minN)) / (Math.log10(maxN) - Math.log10(minN)) * chartW;
    };
    const logY = (f: number) => {
       const val = Math.max(f, minF);
       return (height - padding.bottom) - (Math.log10(val) - Math.log10(minF)) / (Math.log10(maxF) - Math.log10(minF)) * chartH;
    };

    // Calculate Cumulative Frequencies
    const sorted = [...data.scenarios].sort((a, b) => b.fatalities - a.fatalities);
    const points: {N: number, F: number}[] = [];
    const groupedByN: Record<number, number> = {};
    
    sorted.forEach(s => {
       // Snap fatalities to min 1 for log scale
       const n = Math.max(1, s.fatalities);
       groupedByN[n] = (groupedByN[n] || 0) + s.frequency;
    });

    const uniqueNs = Object.keys(groupedByN).map(Number).sort((a, b) => b - a);
    let cumFreq = 0;
    uniqueNs.forEach(n => {
       cumFreq += groupedByN[n];
       points.push({ N: n, F: cumFreq });
    });

    // Step Line Path
    let pathData = "";
    points.forEach((p, i) => {
      if (i === 0) {
         pathData += `M ${logX(p.N)} ${logY(p.F)}`;
      } else {
         // Step horizontal then vertical
         const prev = points[i-1];
         pathData += ` L ${logX(p.N)} ${logY(prev.F)} L ${logX(p.N)} ${logY(p.F)}`;
      }
    });

    // Background Zones (Polygons)
    // Unacceptable (Top Right): Points > Line 10^-3 to 10^-5
    const polyUnacceptable = `
      M ${logX(1)} ${logY(1e-3)} 
      L ${logX(1000)} ${logY(1e-6)} 
      L ${logX(1000)} ${logY(maxF)} 
      L ${logX(1)} ${logY(maxF)} Z
    `;
    
    // Acceptable (Bottom Left): Points < Line 10^-5 to 10^-8
    const polyAcceptable = `
      M ${logX(1)} ${logY(1e-5)} 
      L ${logX(1000)} ${logY(1e-8)} 
      L ${logX(1000)} ${logY(minF)} 
      L ${logX(1)} ${logY(minF)} Z
    `;

    // ALARP is the background color, regions overlay it
    
    return (
      <div className="relative bg-white rounded-lg shadow-sm border border-slate-200">
         <div className="absolute top-4 right-4 flex flex-col items-end gap-2 text-xs font-bold pointer-events-none">
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 border border-red-300"></span> Unacceptable</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-50 border border-yellow-200"></span> ALARP</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-green-50 border border-green-200"></span> Acceptable</div>
         </div>
         
         <svg width={width} height={height} className="mx-auto">
            {/* Base Background: ALARP (Yellow) */}
            <rect x={padding.left} y={padding.top} width={chartW} height={chartH} fill="#fffbeb" />

            {/* Unacceptable Zone (Red) */}
            <path d={polyUnacceptable} fill="#fee2e2" />

            {/* Acceptable Zone (Green) */}
            <path d={polyAcceptable} fill="#ecfdf5" />

            {/* Grid Lines */}
            {[1e-8, 1e-7, 1e-6, 1e-5, 1e-4, 1e-3, 1e-2].map((val, i) => (
              <line key={`gy-${i}`} x1={padding.left} y1={logY(val)} x2={width-padding.right} y2={logY(val)} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3" />
            ))}
            {[1, 10, 100, 1000].map((val, i) => (
              <line key={`gx-${i}`} x1={logX(val)} y1={padding.top} x2={logX(val)} y2={height-padding.bottom} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3" />
            ))}

            {/* Axis Labels */}
            <text x={width/2} y={height-15} textAnchor="middle" fontSize="13" fill="#334155" fontWeight="bold">Number of Fatalities (N)</text>
            <text x={20} y={height/2} textAnchor="middle" transform={`rotate(-90, 20, ${height/2})`} fontSize="13" fill="#334155" fontWeight="bold">Frequency F (events/yr)</text>

            {/* Tick Labels */}
            {[1, 10, 100, 1000].map(v => (
               <text key={`tx-${v}`} x={logX(v)} y={height-40} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="medium">{v}</text>
            ))}
            {[1e-2, 1e-4, 1e-6, 1e-8].map(v => (
               <text key={`ty-${v}`} x={padding.left-10} y={logY(v)} textAnchor="end" fontSize="10" fill="#64748b" dominantBaseline="middle">10<sup>{Math.log10(v)}</sup></text>
            ))}

            {/* Criteria Lines (Solid) */}
            <path d={`M ${logX(1)} ${logY(1e-3)} L ${logX(1000)} ${logY(1e-6)}`} stroke="#ef4444" strokeWidth="2" fill="none" />
            <path d={`M ${logX(1)} ${logY(1e-5)} L ${logX(1000)} ${logY(1e-8)}`} stroke="#10b981" strokeWidth="2" fill="none" />

            {/* Data Plot */}
            <path d={pathData} fill="none" stroke="#2563eb" strokeWidth="3" opacity="0.8" />
            
            {/* Data Points */}
            {points.map((p, i) => (
               <g key={i} className="group cursor-pointer">
                 <circle cx={logX(p.N)} cy={logY(p.F)} r="5" fill="#2563eb" stroke="white" strokeWidth="2" />
                 {/* Tooltip */}
                 <foreignObject x={logX(p.N) + 10} y={logY(p.F) - 20} width="150" height="50" className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    <div className="bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg">
                       <strong>N: {p.N}</strong><br/>
                       Freq: {p.F.toExponential(2)}
                    </div>
                 </foreignObject>
               </g>
            ))}
         </svg>
      </div>
    );
  };

  // --- Risk Matrix Rendering ---
  const renderRiskMatrix = () => {
     if (!data) return null;

     // Matrix Definitions
     const rows = [
        { label: "Frequent (5)", min: 1e-1 },
        { label: "Probable (4)", min: 1e-2 },
        { label: "Occasional (3)", min: 1e-3 },
        { label: "Remote (2)", min: 1e-4 },
        { label: "Improbable (1)", min: 0 }
     ];
     const cols = [
        { label: "Negligible (1)", max: 1 },
        { label: "Minor (2)", max: 2 },
        { label: "Moderate (3)", max: 5 },
        { label: "Major (4)", max: 10 },
        { label: "Catastrophic (5)", max: Infinity }
     ];

     // 5x5 Grid Colors (Standard)
     const getCellColor = (rIdx: number, cIdx: number) => {
        // rIdx 0 is Top (Frequent), cIdx 4 is Right (Catastrophic)
        const score = (5 - rIdx) * (cIdx + 1);
        if (score >= 15) return "bg-red-500";
        if (score >= 8) return "bg-yellow-400";
        return "bg-green-500";
     };

     // Map Scenarios to Grid
     const mappedScenarios = data.scenarios.map(s => {
        // Find Row (Frequency)
        let rIdx = rows.findIndex(r => s.frequency >= r.min);
        if (rIdx === -1) rIdx = 4; // Default to lowest

        // Find Col (Severity)
        let cIdx = cols.findIndex(c => s.fatalities <= c.max);
        if (cIdx === -1) cIdx = 4; // Default to highest

        return { ...s, rIdx, cIdx };
     });

     return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
           <div className="flex">
              {/* Y Axis Label */}
              <div className="w-8 flex items-center justify-center">
                 <div className="-rotate-90 text-sm font-bold text-slate-500 whitespace-nowrap">Likelihood / Frequency</div>
              </div>
              
              <div className="flex-grow">
                 <div className="grid grid-rows-5 gap-1 mb-1">
                    {rows.map((row, rIdx) => (
                       <div key={rIdx} className="flex h-16">
                          <div className="w-24 text-[10px] font-bold text-slate-500 flex items-center justify-end pr-2 leading-tight text-right">
                             {row.label}
                          </div>
                          <div className="flex-grow grid grid-cols-5 gap-1">
                             {cols.map((col, cIdx) => (
                                <div key={cIdx} className={`relative rounded border border-white/20 hover:opacity-90 transition-opacity ${getCellColor(rIdx, cIdx)}`}>
                                   {/* Render Dots */}
                                   <div className="absolute inset-0 flex items-center justify-center flex-wrap content-center gap-1 p-1">
                                      {mappedScenarios.filter(s => s.rIdx === rIdx && s.cIdx === cIdx).map(s => (
                                         <div key={s.id} className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md cursor-help border border-slate-300 hover:scale-125 transition-transform" title={`${s.name} (F:${s.frequency}, N:${s.fatalities})`}>
                                            {s.id}
                                         </div>
                                      ))}
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    ))}
                 </div>
                 
                 {/* X Axis Label */}
                 <div className="flex ml-24">
                    {cols.map((col, i) => (
                       <div key={i} className="flex-1 text-[10px] font-bold text-slate-500 text-center px-1">
                          {col.label}
                       </div>
                    ))}
                 </div>
                 <div className="text-center text-sm font-bold text-slate-500 mt-2 ml-24">
                    Severity (Fatalities)
                 </div>
              </div>
           </div>
        </div>
     );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
         <div className="flex items-center gap-4">
           <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
             <ArrowLeft size={18} />
           </button>
           <div>
             <h1 className="text-xl font-bold flex items-center gap-2">
               <BarChart2 className="text-emerald-600" size={20}/> Quantitative Risk Assessment (QRA)
             </h1>
             <p className="text-xs text-slate-500">Numerical Risk Calculation</p>
           </div>
         </div>
         <div className="flex gap-3">
            <div className="relative group">
              <input 
                className="w-64 pl-4 pr-10 py-2 bg-slate-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-800 placeholder-slate-500 transition-all"
                placeholder="Facility Type (e.g. Ammonia Plant)..."
                value={facilityType}
                onChange={e => setFacilityType(e.target.value)}
              />
              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="absolute right-1 top-1 p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>}
              </button>
            </div>
         </div>
      </div>

      <div className="flex-grow p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-auto bg-grid-pattern">
        
        {/* Left: Scenario Table (Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
           <div className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-lg h-full">
               <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex justify-between">
                  <span>Hazard Scenarios</span>
                  <span className="text-xs font-normal text-slate-500">Edit values to update chart</span>
               </div>
               <div className="overflow-y-auto flex-grow p-4 space-y-3 max-h-[600px]">
                 {data?.scenarios.map((s, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200 hover:border-emerald-400 transition-colors group">
                       <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                             <span className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600">{idx+1}</span>
                             <input 
                               className="bg-transparent font-semibold text-slate-800 outline-none w-48" 
                               value={s.name} 
                               onChange={e => updateScenario(s.id, 'name', e.target.value)}
                             />
                          </div>
                          <button onClick={() => deleteScenario(s.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                       </div>
                       <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="text-xs text-slate-500 block mb-1">Frequency (/yr)</label>
                            <input 
                              type="number" step="1e-9"
                              className="bg-white border border-slate-300 rounded px-2 py-1 w-full text-blue-700 font-mono focus:border-emerald-500 outline-none text-xs"
                              value={s.frequency}
                              onChange={e => updateScenario(s.id, 'frequency', parseFloat(e.target.value))}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 block mb-1">Fatalities (N)</label>
                            <input 
                              type="number"
                              className="bg-white border border-slate-300 rounded px-2 py-1 w-full text-orange-600 font-mono focus:border-orange-500 outline-none text-xs"
                              value={s.fatalities}
                              onChange={e => updateScenario(s.id, 'fatalities', parseFloat(e.target.value))}
                            />
                          </div>
                       </div>
                    </div>
                 ))}
               </div>
               {/* Total Risk Panel */}
               <div className="p-6 bg-slate-50 border-t border-slate-200 mt-auto">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="p-2 bg-emerald-100 rounded-lg"><TrendingUp size={20} className="text-emerald-600"/></div>
                     <div>
                        <div className="text-xs text-slate-500 uppercase font-bold">Total Potential Loss of Life (PLL)</div>
                        <div className="text-2xl font-mono font-bold text-slate-800">{data?.totalPLL.toExponential(3)} <span className="text-sm text-slate-500 font-sans">/yr</span></div>
                     </div>
                  </div>
               </div>
           </div>
        </div>

        {/* Right: Visualization Tabs (Span 7) */}
        <div className="lg:col-span-7 flex flex-col">
            <div className="bg-slate-200 p-1 rounded-lg flex gap-1 mb-4 w-fit">
               <button 
                  onClick={() => setActiveTab('fn')} 
                  className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'fn' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                  <Activity size={16}/> Societal Risk (F-N Curve)
               </button>
               <button 
                  onClick={() => setActiveTab('matrix')} 
                  className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'matrix' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                  <Grid size={16}/> Individual Risk (Matrix)
               </button>
            </div>

            {activeTab === 'fn' ? (
               <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center shadow-lg animate-fade-in">
                  <h3 className="text-lg font-bold text-slate-700 mb-6 w-full text-center">F-N Curve</h3>
                  <div className="w-full overflow-hidden flex justify-center">
                     {renderFNCurve()}
                  </div>
               </div>
            ) : (
               <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-lg animate-fade-in">
                   <h3 className="text-lg font-bold text-slate-700 mb-6 w-full text-center">Risk Heat Map</h3>
                   {renderRiskMatrix()}
                   <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-500">
                      <p><strong>Note:</strong> Numbers in bubbles correspond to the Scenario IDs in the table on the left. Overlapping scenarios will be grouped in the same cell.</p>
                   </div>
               </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default QRAEditor;
