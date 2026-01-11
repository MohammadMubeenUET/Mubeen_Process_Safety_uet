
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Edit2, RefreshCw, X, Trash2, ChevronLeft, ChevronRight, 
  ZoomIn, ZoomOut, RotateCcw, Sparkles, Loader2, BrainCircuit, 
  Camera, Settings, Info, ChevronDown, Activity, Maximize, FileJson, 
  ShieldCheck, Plus, Minus
} from 'lucide-react';
import { generateBowTieData, parseHazopToBowTie } from '../services/geminiService';
import { BowTieData, Barrier, BarrierCategory, Effectiveness } from '../types';

interface BowtieEditorProps {
  onBack: () => void;
  initialData?: BowTieData;
}

const BARRIER_COLORS: Record<BarrierCategory, string> = {
  'Safety Critical Equipment': '#FF0000', // Red
  'Safety Critical Task': '#A587CA', // Purple
  'Procedural': '#FF9933', // Orange
  'Design': '#C0504D', // Dark Red/Brown
  'Asset Integrity': '#FFCCFF', // Pink
  'Training': '#99CCFF', // Cyan/Light Blue
  'Operations': '#0000CC', // Dark Blue
  'Maintenance': '#92D050', // Green
  'Others': '#FFC000' // Yellow
};

const EFFECTIVENESS_COLORS: Record<Effectiveness, string> = {
  'High': '#22c55e',    // Green
  'Medium': '#eab308',  // Yellow
  'Low': '#f97316',     // Orange
  'Poor': '#ef4444',    // Red
  'Unrated': '#94a3b8'  // Grey
};

const INITIAL_DATA: BowTieData = {
  hazard: { code: "WBT-H.03", title: "Lifting operations" },
  topEvent: "Dropped Object",
  threats: [
    { 
      name: "Structural failure of crane", 
      barriers: [
        { id: "b1", label: "Check inspection status", category: "Procedural", owner: "Operator", performanceStandard: "Verified daily", effectiveness: "High" },
        { id: "b2", label: "Pre-lift crane check", category: "Safety Critical Task", owner: "Supervisor", effectiveness: "Medium" }
      ] 
    },
    { 
      name: "Load too heavy", 
      barriers: [
        { id: "b3", label: "Overload protection", category: "Safety Critical Equipment", owner: "Maintenance", reliability: "High", effectiveness: "High" },
        { id: "b4", label: "Check safe working load", category: "Procedural", owner: "Operator", effectiveness: "Low" }
      ] 
    },
    { 
      name: "Incorrect rigging", 
      barriers: [
        { id: "b5", label: "Lift stability check", category: "Safety Critical Task", owner: "Rigger", effectiveness: "Medium" }
      ] 
    },
    { 
      name: "Strong winds", 
      barriers: [
        { id: "b6", label: "Monitor weather criteria", category: "Operations", owner: "Site Manager", effectiveness: "High" }
      ] 
    }
  ],
  consequences: [
    { 
      name: "Personnel injury", 
      barriers: [
        { id: "b7", label: "PA warnings", category: "Design", owner: "Ops", effectiveness: "Medium" },
        { id: "b8", label: "Restrict access area", category: "Procedural", owner: "Safety Officer", effectiveness: "Low" }
      ] 
    },
    { 
      name: "Asset damage", 
      barriers: [
        { id: "b9", label: "Protective covers", category: "Maintenance", owner: "Maintenance Team", effectiveness: "High" }
      ] 
    }
  ]
};

const BowtieEditor: React.FC<BowtieEditorProps> = ({ onBack, initialData }) => {
  const [data, setData] = useState<BowTieData>(INITIAL_DATA);
  const [collapsedThreats, setCollapsedThreats] = useState<Record<number, boolean>>({});
  const [collapsedCons, setCollapsedCons] = useState<Record<number, boolean>>({});
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [svgPaths, setSvgPaths] = useState<{ left: string[], right: string[], center: string[] }>({ left: [], right: [], center: [] });
  
  // Pan & Zoom State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const [isGenerating, setIsGenerating] = useState(false);
  
  // Legend State
  const [showLegend, setShowLegend] = useState(false);
  
  const [showHazopInput, setShowHazopInput] = useState(false);
  const [hazopText, setHazopText] = useState("");
  
  // Barrier Modal State
  const [editingBarrier, setEditingBarrier] = useState<{
    barrier: Barrier;
    pathIndex: number; // Index of threat or consequence
    barrierIndex: number;
    side: 'threat' | 'consequence';
  } | null>(null);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const topEventRef = useRef<HTMLDivElement>(null);
  const hazardRef = useRef<HTMLDivElement>(null);
  const [editData, setEditData] = useState<BowTieData | null>(null);

  // Load initial data if provided
  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  const calculatePaths = () => {
    if (!containerRef.current || !topEventRef.current) return;
    // Note: getBoundingClientRect works correctly with transform, but we need to normalize by zoom
    const root = containerRef.current;
    const rootRect = root.getBoundingClientRect();
    
    // Top Event Metrics
    const teRect = topEventRef.current.getBoundingClientRect();
    // Calculate positions relative to the container's own coordinate space (unscaled)
    const teLeft = (teRect.left - rootRect.left) / zoom;
    const teRight = (teRect.right - rootRect.left) / zoom;
    const teCenterY = ((teRect.top + teRect.height/2) - rootRect.top) / zoom;
    
    const leftPaths: string[] = [];
    const rightPaths: string[] = [];
    const centerPaths: string[] = [];

    // --- LEFT SIDE CALCULATION ---
    const leftGroups = root.querySelectorAll('.left-side .path-group');
    const leftPoints: {x: number, y: number}[] = [];
    let maxLeftX = 0; 

    leftGroups.forEach((group) => {
      const threatNode = group.querySelector('.threat') as HTMLElement;
      const barrierWrapper = group.querySelector('.barriers-wrapper') as HTMLElement;
      
      let connectEl = threatNode;
      if (barrierWrapper && !barrierWrapper.classList.contains('collapsed-wrapper')) {
         const barriers = barrierWrapper.querySelectorAll('.barrier-node');
         if(barriers.length > 0) {
            connectEl = barriers[barriers.length - 1] as HTMLElement;
         }
      }
      
      const elRect = connectEl.getBoundingClientRect();
      const rightX = (elRect.right - rootRect.left) / zoom;
      const centerY = ((elRect.top + elRect.height / 2) - rootRect.top) / zoom;
      
      leftPoints.push({ x: rightX, y: centerY });
      if (rightX > maxLeftX) maxLeftX = rightX;
    });

    const leftBusX = maxLeftX + 25; 

    leftPoints.forEach(pt => {
        const cpOffset = (teLeft - leftBusX) * 0.5;
        leftPaths.push(`M ${pt.x} ${pt.y} L ${leftBusX} ${pt.y} C ${leftBusX + cpOffset} ${pt.y}, ${teLeft - cpOffset} ${teCenterY}, ${teLeft} ${teCenterY}`);
    });

    // --- RIGHT SIDE CALCULATION ---
    const rightGroups = root.querySelectorAll('.right-side .path-group');
    const rightPoints: {x: number, y: number}[] = [];
    let minRightX = Infinity; 

    rightGroups.forEach((group) => {
      const barrierWrapper = group.querySelector('.barriers-wrapper') as HTMLElement;
      const consNode = group.querySelector('.consequence') as HTMLElement;
      
      let connectEl = consNode;
      if (barrierWrapper && !barrierWrapper.classList.contains('collapsed-wrapper')) {
         const barriers = barrierWrapper.querySelectorAll('.barrier-node');
         if(barriers.length > 0) {
            connectEl = barriers[0] as HTMLElement;
         }
      }
      
      const elRect = connectEl.getBoundingClientRect();
      const leftX = (elRect.left - rootRect.left) / zoom;
      const centerY = ((elRect.top + elRect.height / 2) - rootRect.top) / zoom;
      
      rightPoints.push({ x: leftX, y: centerY });
      if (leftX < minRightX) minRightX = leftX;
    });

    const rightBusX = minRightX - 25;

    rightPoints.forEach(pt => {
        const cpOffset = (rightBusX - teRight) * 0.5;
        rightPaths.push(`M ${teRight} ${teCenterY} C ${teRight + cpOffset} ${teCenterY}, ${rightBusX - cpOffset} ${pt.y}, ${rightBusX} ${pt.y} L ${pt.x} ${pt.y}`);
    });

    // --- CENTER (HAZARD) LINE ---
    if (hazardRef.current) {
        const hRect = hazardRef.current.getBoundingClientRect();
        const hx = ((hRect.left + hRect.width / 2) - rootRect.left) / zoom;
        const hy = (hRect.bottom - rootRect.top) / zoom;
        const topOfCircle = (teRect.top - rootRect.top) / zoom;
        
        centerPaths.push(`M ${hx} ${hy} L ${hx} ${topOfCircle}`);
    }

    setSvgPaths({ left: leftPaths, right: rightPaths, center: centerPaths });
  };

  useEffect(() => {
    let active = true;
    const loop = () => {
      if(active) {
        calculatePaths();
        requestAnimationFrame(loop);
      }
    };
    requestAnimationFrame(loop);
    return () => { active = false; };
  }, [data, collapsedThreats, collapsedCons, zoom, pan]);

  const handleSnapshot = async () => {
    if (!(window as any).html2canvas || !containerRef.current) return;
    const originalZoom = zoom;
    const originalPan = pan;
    
    // Temporarily reset view for snapshot
    setZoom(1);
    setPan({x:0, y:0});
    
    setTimeout(async () => {
      try {
        const canvas = await (window as any).html2canvas(containerRef.current, {
          scale: 2,
          backgroundColor: '#ffffff'
        });
        const link = document.createElement('a');
        link.download = `Bowtie_${data.hazard.code}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch(e) {
        console.error(e);
      } finally {
        setZoom(originalZoom);
        setPan(originalPan);
      }
    }, 100);
  };

  const handleFitScreen = () => {
    if (!containerRef.current || !wrapperRef.current) return;
    
    const contentW = containerRef.current.offsetWidth; 
    const contentH = containerRef.current.offsetHeight;

    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const availWidth = wrapperRect.width - 80; 
    const availHeight = wrapperRect.height - 80;

    const scale = Math.min(availWidth / contentW, availHeight / contentH);
    const newZoom = Math.min(Math.max(scale, 0.2), 2);
    
    // Center logic
    const newPanX = (wrapperRect.width - contentW * newZoom) / 2;
    const newPanY = (wrapperRect.height - contentH * newZoom) / 2;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleResetZoom = () => {
     setZoom(1);
     setPan({x:0, y:0}); 
  };

  const handleAI = async (mode: 'normal' | 'rigorous') => {
    if (!editData) return;
    setIsGenerating(true);
    try {
      const result = await generateBowTieData(editData.hazard.title, editData.topEvent, mode);
      setEditData(prev => prev ? ({ ...prev, ...result }) : null);
    } catch(e) {
      alert("AI Generation failed. See console.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleHazopImport = async () => {
    setIsGenerating(true);
    try {
      const result = await parseHazopToBowTie(hazopText);
      setEditData(prev => prev ? ({ ...prev, ...result }) : null);
      setShowHazopInput(false);
    } catch(e) {
      alert("HAZOP Parsing failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleAll = () => {
    if (Object.keys(collapsedThreats).length > 0) {
      setCollapsedThreats({});
      setCollapsedCons({});
    } else {
      const newT: Record<number, boolean> = {};
      data.threats.forEach((_, i) => newT[i] = true);
      const newC: Record<number, boolean> = {};
      data.consequences.forEach((_, i) => newC[i] = true);
      setCollapsedThreats(newT);
      setCollapsedCons(newC);
    }
  };

  // Barrier Actions
  const handleBarrierClick = (barrier: Barrier, pathIndex: number, barrierIndex: number, side: 'threat' | 'consequence') => {
    setEditingBarrier({ barrier: { ...barrier }, pathIndex, barrierIndex, side });
  };

  const saveBarrier = () => {
    if (!editingBarrier) return;
    const { barrier, pathIndex, barrierIndex, side } = editingBarrier;
    const newData = { ...data };
    
    if (side === 'threat') {
      newData.threats[pathIndex].barriers[barrierIndex] = barrier;
    } else {
      newData.consequences[pathIndex].barriers[barrierIndex] = barrier;
    }
    
    setData(newData);
    setEditingBarrier(null);
  };

  // Render a specific barrier
  const renderBarrierNode = (barrier: Barrier, pathIdx: number, barrierIdx: number, side: 'threat' | 'consequence', isLast: boolean) => {
    const effectivenessColor = EFFECTIVENESS_COLORS[barrier.effectiveness || 'Unrated'];
    
    return (
      <React.Fragment key={barrier.id}>
        <div 
          className="node barrier-node w-[140px] flex flex-col items-center relative z-10 cursor-pointer group transition-transform hover:scale-105 flex-shrink-0"
          onClick={() => handleBarrierClick(barrier, pathIdx, barrierIdx, side)}
        >
          {/* Main Card */}
          <div className="bg-white border border-slate-400 rounded w-full min-h-[70px] flex flex-col items-center shadow-sm relative z-20 overflow-hidden">
             
             {/* 1. Header with Label */}
             <div className="w-full bg-slate-50 border-b border-slate-200 p-1.5 text-center relative">
                {/* Green "Tab" indicator at top */}
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-emerald-600 rounded-b-sm shadow-sm"></div>
                <div className="text-[10px] font-bold text-slate-800 leading-tight mt-1 line-clamp-2">{barrier.label}</div>
             </div>

             {/* 2. Owner/Role Section */}
             <div className="w-full p-1 text-center bg-white border-b border-slate-200">
                <div className="text-[9px] font-bold text-blue-800 truncate">{barrier.owner || "Unknown Role"}</div>
             </div>

             {/* 3. Category Colored Band */}
             <div 
                className="w-full py-1 text-center border-b border-slate-200 flex items-center justify-center"
                style={{ backgroundColor: BARRIER_COLORS[barrier.category] || '#ccc' }}
             >
                <div className="text-[9px] font-bold text-white uppercase drop-shadow-md truncate px-1">
                   {barrier.category === 'Safety Critical Equipment' ? 'SCE' : 
                    barrier.category === 'Safety Critical Task' ? 'SCT' :
                    barrier.category}
                </div>
             </div>

             {/* 4. Details / Perf Standard */}
             <div className="w-full p-1 bg-slate-50 flex-grow flex items-center justify-center">
               <div className="text-[8px] text-slate-500 leading-none text-center line-clamp-2">
                 {barrier.performanceStandard || "No Criteria Defined"}
               </div>
             </div>

             {/* Effectiveness Badge */}
             <div 
                className="absolute bottom-1 right-1 w-3 h-3 rounded-full border border-white shadow-md z-30" 
                style={{ backgroundColor: effectivenessColor }} 
                title={`Effectiveness: ${barrier.effectiveness || 'Unrated'}`}
             />

             {/* Hover Edit Icon */}
             <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
               <Settings size={16} className="text-slate-700 bg-white/80 rounded-full p-0.5" />
             </div>
          </div>
          
          {/* Connector line passing through (visual only, z-index -10) */}
          <div className="absolute top-1/2 w-full h-0.5 bg-slate-800 -z-10" />
        </div>
        {/* Connector line after barrier */}
        {(side === 'consequence' || !isLast) && (
          <div className="w-8 h-0.5 bg-slate-800 flex-shrink-0" />
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="bg-slate-50 bg-grid-pattern min-h-screen flex flex-col items-center relative overflow-hidden">
      
      {/* Toolbar */}
      <div className="sticky top-5 z-40 flex flex-wrap justify-center gap-3 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-slate-200">
        <button onClick={onBack} className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-600 text-white hover:w-auto hover:px-4 transition-all overflow-hidden group">
          <ArrowLeft size={16} className="min-w-[16px]" />
          <span className="max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 whitespace-nowrap transition-all duration-300">Home</span>
        </button>
        <div className="w-px h-6 bg-slate-300 self-center mx-1" />
        
        <button onClick={() => { setEditData(JSON.parse(JSON.stringify(data))); setIsEditorOpen(true); }} className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-600 text-white hover:w-auto hover:px-4 transition-all overflow-hidden group">
          <Edit2 size={16} className="min-w-[16px]" />
          <span className="max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 whitespace-nowrap transition-all duration-300">Structure Editor</span>
        </button>
        
        <button onClick={toggleAll} className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-600 text-white hover:w-auto hover:px-4 transition-all overflow-hidden group">
          <RefreshCw size={16} className="min-w-[16px]" />
          <span className="max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 whitespace-nowrap transition-all duration-300">Toggle View</span>
        </button>

        <button onClick={handleSnapshot} className="flex items-center justify-center w-10 h-10 rounded-full bg-sky-500 text-white hover:w-auto hover:px-4 transition-all overflow-hidden group">
          <Camera size={16} className="min-w-[16px]" />
          <span className="max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 whitespace-nowrap transition-all duration-300">Snapshot</span>
        </button>

        <div className="w-px h-6 bg-slate-300 self-center mx-1" />
        
        <div className="flex items-center gap-2 px-2">
           <div className="cursor-pointer" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}>
             <ZoomOut size={16} className="text-slate-500 hover:text-emerald-600" />
           </div>
           <span className="text-xs font-bold text-slate-600 w-8 text-center">{Math.round(zoom * 100)}%</span>
           <div className="cursor-pointer" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
             <ZoomIn size={16} className="text-slate-500 hover:text-emerald-600" />
           </div>
           <div className="w-px h-4 bg-slate-300 mx-1"></div>
           <div className="cursor-pointer" onClick={handleResetZoom} title="Reset Zoom">
             <RotateCcw size={14} className="text-slate-400 hover:text-slate-600" />
           </div>
           <div className="cursor-pointer" onClick={handleFitScreen} title="Fit to Screen">
             <Maximize size={14} className="text-slate-400 hover:text-slate-600" />
           </div>
        </div>
      </div>

      <div className="mt-4 px-4 py-2 bg-white/80 backdrop-blur rounded-full border border-slate-200 text-sm font-semibold text-slate-600 tracking-wide uppercase">
        Project: {data.hazard.title}
      </div>
      
      {/* Main Diagram Area */}
      <div 
        className="w-full flex-grow overflow-hidden relative" 
        ref={wrapperRef}
      >
        <div 
          ref={containerRef}
          className="bg-white rounded-3xl shadow-xl border border-slate-100 p-16 flex items-stretch gap-20 relative origin-top-left transition-transform duration-75 ease-out"
          style={{ 
             transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
             transformOrigin: '0 0',
             width: 'fit-content',
             minWidth: 'min-content',
             // Center initially if no pan
             marginLeft: pan.x === 0 && zoom === 1 ? 'auto' : undefined,
             marginRight: pan.x === 0 && zoom === 1 ? 'auto' : undefined,
          }}
        >
          {/* SfL WATERMARK */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-1 opacity-30 pointer-events-none z-0">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
                   <Activity className="text-white" size={18} />
                </div>
                <div className="text-left">
                   <div className="text-xl font-black text-slate-900 leading-none">SfL</div>
                   <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Safety for All</div>
                </div>
             </div>
             <div className="text-[9px] font-bold text-slate-900 uppercase tracking-wider mt-0.5">Founder Mubeen Ahsan</div>
          </div>

          {/* Connections Layer */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
            {svgPaths.center.map((d, i) => <path key={`c-${i}`} d={d} stroke="black" strokeWidth="2" fill="none" />)}
            {svgPaths.left.map((d, i) => <path key={`l-${i}`} d={d} stroke="black" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
            {svgPaths.right.map((d, i) => <path key={`r-${i}`} d={d} stroke="black" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
          </svg>

          {/* Left Column (Threats) */}
          <div className="left-side flex flex-col gap-8 min-w-[200px]">
            <div className="flex flex-col gap-10 justify-center flex-grow">
              {data.threats.map((threat, idx) => (
                <div key={threat.id || idx} className="path-group flex items-center relative">
                   {/* UPDATED THREAT NODE */}
                   <div className="node threat w-[200px] h-[100px] bg-gradient-to-b from-blue-500 to-blue-700 rounded-lg p-2 shadow-lg relative flex flex-col items-center justify-center group flex-shrink-0 border border-blue-800">
                     {/* Inner White Box */}
                     <div className="w-full h-full bg-white rounded-sm flex flex-col items-center justify-center p-2 shadow-inner">
                          <div className="text-xs font-bold text-slate-400 uppercase mb-1">Threat</div>
                          <div className="text-sm font-bold text-center leading-tight text-slate-900">{threat.name}</div>
                     </div>
                     {/* Collapse Button (Top Right) */}
                     <button 
                       className={`absolute -top-2 -right-2 w-6 h-6 bg-white rounded border border-blue-400 flex items-center justify-center text-blue-700 hover:scale-110 transition-transform shadow z-20 ${collapsedThreats[idx] ? 'bg-blue-100' : ''}`}
                       onClick={() => setCollapsedThreats(p => ({...p, [idx]: !p[idx]}))}
                     >
                       {collapsedThreats[idx] ? <Plus size={14} /> : <Minus size={14} />}
                     </button>
                   </div>

                   <div className={`barriers-wrapper flex items-center transition-all duration-500 origin-left ${collapsedThreats[idx] ? 'collapsed-wrapper scale-x-0 opacity-0 max-w-0 overflow-hidden' : 'scale-x-100 opacity-100 max-w-[1000px]'}`}>
                     <div className="w-8 h-0.5 bg-slate-800 flex-shrink-0" />
                     {threat.barriers.map((b, bIdx) => renderBarrierNode(b, idx, bIdx, 'threat', bIdx === threat.barriers.length - 1))}
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center Column */}
          <div className="flex flex-col items-center justify-center z-20 gap-8">
            {/* UPDATED HAZARD BOX */}
            <div ref={hazardRef} className="w-[220px] h-[140px] bg-yellow-400 relative flex items-center justify-center p-3 shadow-2xl rounded-sm hazard-box border border-slate-900">
               {/* Stripes Background */}
               <div className="absolute inset-0" style={{ 
                  background: 'repeating-linear-gradient(45deg, #fbbf24, #fbbf24 10px, #1a1a1a 10px, #1a1a1a 20px)',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
                  zIndex: 0
               }}></div>
               
               {/* Inner White Box */}
               <div className="relative z-10 bg-white w-full h-full flex flex-col items-center justify-center border border-slate-400 shadow-xl p-2">
                 <div className="text-sm font-black uppercase text-slate-800 mb-1 tracking-wider">Hazard</div>
                 <div className="text-sm font-bold text-slate-900 leading-tight text-center">{data.hazard.title}</div>
                 <div className="text-[9px] text-slate-400 mt-1">{data.hazard.code}</div>
               </div>
            </div>

            <div className="h-[60px] w-1 bg-transparent -my-4 z-0"></div>

            {/* UPDATED TOP EVENT CIRCLE */}
            <div ref={topEventRef} className="w-[200px] h-[200px] rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-800 flex items-center justify-center shadow-2xl relative border-4 border-red-900/30 z-20">
              {/* Inner White Square */}
              <div className="w-[120px] h-[120px] bg-white flex flex-col items-center justify-center text-center p-2 shadow-[0_0_15px_rgba(0,0,0,0.2)] border border-slate-200">
                <div className="font-black text-xs text-red-600 uppercase mb-1 tracking-wider">Top Event</div>
                <div className="text-sm font-bold text-slate-900 leading-tight">{data.topEvent}</div>
              </div>
              {/* Side Connectors (Visual) */}
              <div className="absolute -left-3 w-6 h-6 bg-white border border-slate-300 rounded flex items-center justify-center shadow-sm">
                  <div className="w-3 h-0.5 bg-slate-600"></div>
              </div>
              <div className="absolute -right-3 w-6 h-6 bg-white border border-slate-300 rounded flex items-center justify-center shadow-sm">
                  <div className="w-3 h-0.5 bg-slate-600"></div>
              </div>
            </div>
          </div>

          {/* Right Column (Consequences) */}
          <div className="right-side flex flex-col gap-8 min-w-[200px]">
            <div className="flex flex-col gap-10 justify-center flex-grow">
              {data.consequences.map((cons, idx) => (
                <div key={cons.id || idx} className="path-group flex items-center relative">
                   <div className={`barriers-wrapper flex items-center transition-all duration-500 origin-right ${collapsedCons[idx] ? 'collapsed-wrapper scale-x-0 opacity-0 max-w-0 overflow-hidden' : 'scale-x-100 opacity-100'}`}>
                     {cons.barriers.map((b, bIdx) => renderBarrierNode(b, idx, bIdx, 'consequence', bIdx === cons.barriers.length - 1))}
                   </div>
                   
                   {!collapsedCons[idx] && (
                     <div className="h-0.5 bg-slate-800 flex-grow min-w-[2rem] mx-[-1px]" />
                   )}
                   
                   {/* UPDATED CONSEQUENCE NODE */}
                   <div className="node consequence w-[200px] h-[100px] bg-gradient-to-b from-red-500 to-red-700 rounded-lg p-2 shadow-lg relative flex flex-col items-center justify-center group flex-shrink-0 border border-red-800">
                     {/* Inner White Box */}
                     <div className="w-full h-full bg-white rounded-sm flex flex-col items-center justify-center p-2 shadow-inner">
                          <div className="text-xs font-bold text-slate-400 uppercase mb-1">Consequence</div>
                          <div className="text-sm font-bold text-center leading-tight text-slate-900">{cons.name}</div>
                     </div>
                     
                     <button 
                       className={`absolute -top-2 -left-2 w-6 h-6 bg-white rounded border border-red-400 flex items-center justify-center text-red-700 hover:scale-110 transition-transform shadow z-20 ${collapsedCons[idx] ? 'bg-red-100' : ''}`}
                       onClick={() => setCollapsedCons(p => ({...p, [idx]: !p[idx]}))}
                     >
                       {collapsedCons[idx] ? <Plus size={14} /> : <Minus size={14} />}
                     </button>
                   </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
      
      {/* ... (rest of modals) ... */}
      
      {/* --- COLLAPSIBLE LEGEND WIDGET --- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
         {/* The Card */}
         {showLegend && (
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-2xl rounded-xl overflow-hidden w-[280px] animate-fade-in-up pointer-events-auto">
               <div className="bg-slate-100 p-2 border-b border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 px-2">Legend</span>
                  <button onClick={() => setShowLegend(false)} className="text-slate-400 hover:text-slate-600 p-1"><X size={14} /></button>
               </div>
               
               <div className="p-3 border-b border-slate-200 bg-slate-50">
                   <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Effectiveness Rating</h4>
                   <div className="grid grid-cols-2 gap-2">
                       {Object.entries(EFFECTIVENESS_COLORS).map(([eff, color]) => (
                           <div key={eff} className="flex items-center gap-2">
                               <div className="w-3 h-3 rounded-full shadow-sm border border-black/10 flex-shrink-0" style={{ backgroundColor: color }}></div>
                               <span className="text-xs text-slate-700">{eff}</span>
                           </div>
                       ))}
                   </div>
               </div>

               <div className="p-3 grid gap-2 max-h-[200px] overflow-y-auto">
                   <h4 className="text-[10px] font-bold text-slate-500 uppercase">Barrier Categories</h4>
                  {Object.entries(BARRIER_COLORS).map(([cat, color]) => (
                  <div key={cat} className="flex items-center gap-3 p-1 hover:bg-slate-50 rounded">
                     <div className="w-8 h-3 rounded shadow-sm border border-black/10 flex-shrink-0" style={{ backgroundColor: color }}></div>
                     <span className="text-xs font-medium text-slate-700 leading-tight">{cat}</span>
                  </div>
                  ))}
               </div>
            </div>
         )}
         
         {/* The Toggle Button */}
         <button 
            onClick={() => setShowLegend(!showLegend)} 
            className="pointer-events-auto h-12 px-5 rounded-full shadow-xl flex items-center gap-2 font-bold transition-all transform hover:scale-105 bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
         >
            {showLegend ? <ChevronDown size={18} /> : <Info size={18} className="text-amber-400" />}
            <span className="text-sm">{showLegend ? 'Hide Info' : 'Legend'}</span>
         </button>
      </div>

      {/* ... (Barrier Modal) ... */}
      {editingBarrier && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex justify-center items-center p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-in-up flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center flex-shrink-0">
                 <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                   <Settings size={20} className="text-emerald-600" />
                   Edit Barrier Details
                 </h3>
                 <div className="flex items-center gap-2">
                    <button onClick={() => setEditingBarrier(null)} className="text-slate-400 hover:text-slate-600 ml-2"><X size={20}/></button>
                 </div>
              </div>
              
              <div className="p-6 overflow-y-auto">
                 {/* Basic Info */}
                 <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Barrier Description</label>
                        <input 
                          className="w-full p-2 bg-white border border-slate-300 rounded font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" 
                          value={editingBarrier.barrier.label}
                          onChange={e => setEditingBarrier({ ...editingBarrier, barrier: { ...editingBarrier.barrier, label: e.target.value } })}
                        />
                    </div>
                    
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Barrier Category (Type)</label>
                        <select 
                          className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={editingBarrier.barrier.category}
                          onChange={e => setEditingBarrier({ ...editingBarrier, barrier: { ...editingBarrier.barrier, category: e.target.value as BarrierCategory } })}
                        >
                          {Object.keys(BARRIER_COLORS).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        {/* Visual Preview */}
                        <div className="mt-2 h-2 w-full rounded-full" style={{ backgroundColor: BARRIER_COLORS[editingBarrier.barrier.category] }}></div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Owner / Responsible</label>
                        <input 
                          className="w-full p-2 bg-white border border-slate-300 rounded text-sm text-slate-900" 
                          placeholder="e.g. Maintenance Supervisor"
                          value={editingBarrier.barrier.owner || ''}
                          onChange={e => setEditingBarrier({ ...editingBarrier, barrier: { ...editingBarrier.barrier, owner: e.target.value } })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Verification / Testing</label>
                        <input 
                          className="w-full p-2 bg-white border border-slate-300 rounded text-sm text-slate-900" 
                          placeholder="e.g. Annual Inspection"
                          value={editingBarrier.barrier.verification || ''}
                          onChange={e => setEditingBarrier({ ...editingBarrier, barrier: { ...editingBarrier.barrier, verification: e.target.value } })}
                        />
                    </div>
                 </div>

                 {/* Barrier Effectiveness Section */}
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                       <ShieldCheck size={16} className="text-green-600"/> Barrier Effectiveness
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="col-span-2">
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Overall Effectiveness</label>
                           <div className="flex gap-2">
                              {Object.entries(EFFECTIVENESS_COLORS).map(([eff, color]) => (
                                 <button
                                    key={eff}
                                    onClick={() => setEditingBarrier({ ...editingBarrier, barrier: { ...editingBarrier.barrier, effectiveness: eff as Effectiveness } })}
                                    className={`flex-1 py-2 text-xs font-bold rounded border transition-all ${
                                       editingBarrier.barrier.effectiveness === eff 
                                       ? 'ring-2 ring-offset-1 ring-slate-400 scale-105' 
                                       : 'opacity-60 hover:opacity-100'
                                    }`}
                                    style={{ 
                                       backgroundColor: editingBarrier.barrier.effectiveness === eff ? color : '#f1f5f9',
                                       borderColor: color,
                                       color: editingBarrier.barrier.effectiveness === eff ? 'white' : '#475569'
                                    }}
                                 >
                                    {eff}
                                 </button>
                              ))}
                           </div>
                       </div>

                       <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Adequacy (Capability)</label>
                          <textarea 
                             className="w-full p-2 bg-white border border-slate-300 rounded text-xs h-20 resize-none text-slate-900 focus:border-emerald-500 outline-none"
                             placeholder="Does this barrier fully stop the scenario?"
                             value={editingBarrier.barrier.adequacy || ''}
                             onChange={e => setEditingBarrier({ ...editingBarrier, barrier: { ...editingBarrier.barrier, adequacy: e.target.value } })}
                          />
                       </div>

                       <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reliability (Availability)</label>
                          <textarea 
                             className="w-full p-2 bg-white border border-slate-300 rounded text-xs h-20 resize-none text-slate-900 focus:border-emerald-500 outline-none"
                             placeholder="How likely is it to work when needed?"
                             value={editingBarrier.barrier.reliabilityAssessment || ''}
                             onChange={e => setEditingBarrier({ ...editingBarrier, barrier: { ...editingBarrier.barrier, reliabilityAssessment: e.target.value } })}
                          />
                       </div>
                    </div>
                 </div>

                 {/* Additional Details */}
                 <div className="grid grid-cols-2 gap-4">
                     <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Performance Standard / Criteria</label>
                        <textarea 
                          className="w-full p-2 bg-white border border-slate-300 rounded text-sm resize-none h-16 text-slate-900" 
                          placeholder="e.g. Valve opens at 150psi +/- 5%"
                          value={editingBarrier.barrier.performanceStandard || ''}
                          onChange={e => setEditingBarrier({ ...editingBarrier, barrier: { ...editingBarrier.barrier, performanceStandard: e.target.value } })}
                        />
                     </div>
                 </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
                 <button onClick={() => setEditingBarrier(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded">Cancel</button>
                 <button onClick={saveBarrier} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded shadow-lg hover:bg-emerald-700">Save Barrier</button>
              </div>
            </div>
         </div>
      )}

      {/* Editor Modal - STRUCTURE (Simplified for now) */}
      {isEditorOpen && editData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Edit2 size={20} className="text-emerald-600"/> Edit Bowtie Structure</h2>
              <button onClick={() => setIsEditorOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X /></button>
            </div>

            <div className="overflow-y-auto p-6 space-y-8 bg-white">
              {/* Context Section */}
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Hazard Context</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Hazard Code</label>
                    <input className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900" value={editData.hazard.code} onChange={e => setEditData({...editData, hazard: {...editData.hazard, code: e.target.value}})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Hazard Title</label>
                    <input className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900" value={editData.hazard.title} onChange={e => setEditData({...editData, hazard: {...editData.hazard, title: e.target.value}})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Top Event</label>
                  <input className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900" value={editData.topEvent} onChange={e => setEditData({...editData, topEvent: e.target.value})} />
                </div>

                {/* AI Tools */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button onClick={() => handleAI('normal')} disabled={isGenerating} className="flex-1 py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity">
                    {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} Auto-fill
                  </button>
                  <button onClick={() => handleAI('rigorous')} disabled={isGenerating} className="flex-1 py-2 px-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity">
                    {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <BrainCircuit size={16} />} Rigorous AI
                  </button>
                  <button onClick={() => setShowHazopInput(!showHazopInput)} className="flex-1 py-2 px-4 bg-cyan-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-cyan-800 transition-colors">
                    <FileJson size={16} /> Import HAZOP
                  </button>
                </div>

                {showHazopInput && (
                  <div className="mt-4 p-4 bg-sky-50 border border-sky-200 rounded-lg animate-fade-in">
                    <label className="block text-xs font-bold text-sky-600 mb-2">Paste HAZOP Report Text</label>
                    <textarea 
                      className="w-full p-3 bg-white border border-slate-300 rounded-lg h-32 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none"
                      value={hazopText}
                      onChange={e => setHazopText(e.target.value)}
                      placeholder="Node: Gas Line, Deviation: High Pressure..."
                    />
                    <div className="flex justify-end mt-2">
                       <button onClick={handleHazopImport} disabled={isGenerating} className="text-xs bg-sky-600 text-white px-3 py-1.5 rounded hover:bg-sky-700 disabled:opacity-50">Generate from Text</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Threats Editor - Simplified for names only, barriers managed in main view */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Threats & Barriers</h3>
                  <button className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full hover:bg-emerald-100 transition-colors flex items-center gap-1" onClick={() => setEditData({...editData, threats: [...editData.threats, {name: "New Threat", barriers: []}]})}>
                     <Plus size={14} /> Add Threat
                  </button>
                </div>
                <div className="space-y-4">
                  {editData.threats.map((t, tIdx) => (
                    <div key={tIdx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-emerald-500 transition-colors">
                       <div className="flex gap-2 items-center mb-3">
                         <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">{tIdx + 1}</span>
                         <input className="flex-grow font-semibold text-slate-800 bg-transparent border-b border-transparent focus:border-emerald-500 outline-none px-1" value={t.name} onChange={e => {
                           const n = [...editData.threats]; n[tIdx].name = e.target.value; setEditData({...editData, threats: n});
                         }} />
                         <button onClick={() => { const n = [...editData.threats]; n.splice(tIdx, 1); setEditData({...editData, threats: n}); }} className="text-red-400 hover:text-red-500"><Trash2 size={16}/></button>
                       </div>
                       <div className="pl-8 border-l-2 border-slate-100 space-y-2">
                         {t.barriers.map((b, bIdx) => (
                           <div key={bIdx} className="flex gap-2 items-center group">
                             <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: BARRIER_COLORS[b.category] || '#ccc'}} />
                             <input className="flex-grow text-sm text-slate-600 bg-transparent border-b border-transparent focus:border-emerald-500 outline-none" value={b.label} onChange={e => {
                               const n = [...editData.threats]; n[tIdx].barriers[bIdx].label = e.target.value; setEditData({...editData, threats: n});
                             }} />
                             <button onClick={() => { const n = [...editData.threats]; n[tIdx].barriers.splice(bIdx, 1); setEditData({...editData, threats: n}); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"><X size={14}/></button>
                           </div>
                         ))}
                         <button onClick={() => { 
                           const n = [...editData.threats]; 
                           n[tIdx].barriers.push({id: Date.now().toString(), label: "New Barrier", category: "Safety Critical Equipment"}); 
                           setEditData({...editData, threats: n}); 
                         }} className="text-xs text-blue-500 hover:text-blue-700 font-medium mt-2 flex items-center gap-1">
                           <Plus size={12} /> Add Barrier
                         </button>
                       </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consequences Editor */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Consequences & Barriers</h3>
                  <button className="text-xs bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1 rounded-full hover:bg-rose-100 transition-colors flex items-center gap-1" onClick={() => setEditData({...editData, consequences: [...editData.consequences, {name: "New Consequence", barriers: []}]})}>
                     <Plus size={14} /> Add Consequence
                  </button>
                </div>
                <div className="space-y-4">
                  {editData.consequences.map((c, cIdx) => (
                    <div key={cIdx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-red-500 transition-colors">
                       <div className="flex gap-2 items-center mb-3">
                         <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">{cIdx + 1}</span>
                         <input className="flex-grow font-semibold text-slate-800 bg-transparent border-b border-transparent focus:border-red-500 outline-none px-1" value={c.name} onChange={e => {
                           const n = [...editData.consequences]; n[cIdx].name = e.target.value; setEditData({...editData, consequences: n});
                         }} />
                         <button onClick={() => { const n = [...editData.consequences]; n.splice(cIdx, 1); setEditData({...editData, consequences: n}); }} className="text-red-400 hover:text-red-500"><Trash2 size={16}/></button>
                       </div>
                       <div className="pr-8 border-r-2 border-slate-100 space-y-2" dir="rtl">
                         {c.barriers.map((b, bIdx) => (
                           <div key={bIdx} className="flex gap-2 items-center group" dir="ltr">
                             <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: BARRIER_COLORS[b.category] || '#ccc'}} />
                             <input className="flex-grow text-sm text-slate-600 bg-transparent border-b border-transparent focus:border-red-500 outline-none" value={b.label} onChange={e => {
                               const n = [...editData.consequences]; n[cIdx].barriers[bIdx].label = e.target.value; setEditData({...editData, consequences: n});
                             }} />
                             <button onClick={() => { const n = [...editData.consequences]; n[cIdx].barriers.splice(bIdx, 1); setEditData({...editData, consequences: n}); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"><X size={14}/></button>
                           </div>
                         ))}
                         <button onClick={() => { 
                           const n = [...editData.consequences]; 
                           n[cIdx].barriers.push({id: Date.now().toString(), label: "New Barrier", category: "Safety Critical Equipment"}); 
                           setEditData({...editData, consequences: n}); 
                         }} className="text-xs text-blue-500 hover:text-blue-700 font-medium mt-2 flex items-center gap-1" dir="ltr">
                           <Plus size={12} /> Add Barrier
                         </button>
                       </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setIsEditorOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors">Cancel</button>
              <button onClick={() => { setData(editData); setIsEditorOpen(false); }} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-lg transition-colors">Save Changes</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BowtieEditor;
