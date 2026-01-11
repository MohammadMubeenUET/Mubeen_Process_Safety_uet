
import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Sparkles, BrainCircuit, Camera, ZoomIn, ZoomOut, 
  Loader2, GitMerge, RotateCcw, Maximize, Settings, Plus, Trash2, X, Edit3, Activity 
} from 'lucide-react';
import { generateFaultTreeData } from '../services/geminiService';
import { FaultTreeNode } from '../types';

const NODE_WIDTH = 140;
const NODE_HEIGHT = 65;
const BASIC_RADIUS = 45; // Increased radius for Basic Events to fit text
const V_GAP = 90;
const H_GAP = 30;

// Visual Styles matching the reference image
const STYLES = {
  top: { fill: '#ef4444', stroke: '#991b1b', text: 'white' },     // Red
  intermediate: { fill: '#1e3a8a', stroke: '#172554', text: 'white' }, // Dark Blue
  basic: { fill: '#67e8f9', stroke: 'black', text: 'black' },      // Cyan
  line: 'black',
  gate: 'black'
};

const FaultTreeEditor = ({ onBack, initialData }: { onBack: () => void, initialData?: FaultTreeNode }) => {
  const [scenario, setScenario] = useState("");
  const [treeData, setTreeData] = useState<FaultTreeNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingNode, setEditingNode] = useState<{ node: FaultTreeNode } | null>(null);

  // Pan & Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load initial data if provided
  useEffect(() => {
    if (initialData) {
      setTreeData(initialData);
      setScenario(initialData.label);
    }
  }, [initialData]);

  // Mouse Handlers for Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.node, button, input, select, textarea')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!wrapperRef.current) return;

    const scaleAmount = -e.deltaY * 0.001;
    const newZoom = Math.min(Math.max(zoom + scaleAmount, 0.2), 3);

    const rect = wrapperRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const contentX = (mouseX - pan.x) / zoom;
    const contentY = (mouseY - pan.y) / zoom;

    const newPanX = mouseX - (contentX * newZoom);
    const newPanY = mouseY - (contentY * newZoom);

    setPan({ x: newPanX, y: newPanY });
    setZoom(newZoom);
  };

  const handleGenerate = async (mode: 'normal' | 'rigorous') => {
    if (!scenario) return alert("Please enter a scenario.");
    setLoading(true);
    try {
      const data = await generateFaultTreeData(scenario, mode);
      if (data) {
        setTreeData(data);
      } else {
        alert("Received empty data from AI.");
      }
    } catch (e) {
      alert("Failed to generate tree. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Manual Editing Functions ---
  const handleSaveNode = (updatedNode: FaultTreeNode) => {
      if (!treeData || !editingNode) return;
      
      const updateTree = (current: FaultTreeNode): FaultTreeNode | null => {
         if (current === editingNode.node) {
            return updatedNode;
         }
         if (current.children) {
            const newChildren = current.children
               .map(updateTree)
               .filter((n): n is FaultTreeNode => n !== null); 
            return { ...current, children: newChildren };
         }
         return current;
      };

      if (treeData === editingNode.node) {
         setTreeData(updatedNode);
      } else {
         const newRoot = updateTree(treeData);
         if (newRoot) setTreeData(newRoot);
      }
      setEditingNode(null);
  };

  const handleDeleteNode = () => {
    if (!treeData || !editingNode) return;
    
    if (treeData === editingNode.node) {
        alert("Cannot delete the Top Event. Start a new analysis instead.");
        return;
    }

    const deleteFromTree = (current: FaultTreeNode): FaultTreeNode | null => {
       if (current === editingNode.node) return null;
       if (current.children) {
         return {
            ...current,
            children: current.children
              .map(deleteFromTree)
              .filter((n): n is FaultTreeNode => n !== null)
         };
       }
       return current;
    };
    
    const newRoot = deleteFromTree(treeData);
    if (newRoot) setTreeData(newRoot);
    setEditingNode(null);
  };

  const handleAddChild = () => {
     if(!editingNode) return;
     const newChild: FaultTreeNode = { label: "New Event", type: "basic" };
     
     const updatedNode: FaultTreeNode = {
        ...editingNode.node,
        children: [...(editingNode.node.children || []), newChild],
        type: editingNode.node.type === 'basic' ? 'intermediate' : editingNode.node.type,
        gate: editingNode.node.gate || 'or'
     };
     
     handleSaveNode(updatedNode);
  };


  const getTreeWidth = (node: FaultTreeNode): number => {
    if (!node.children || node.children.length === 0) return NODE_WIDTH + H_GAP;
    return node.children.reduce((acc, child) => acc + getTreeWidth(child), 0);
  };

  const renderGate = (type: 'and' | 'or' | undefined, x: number, y: number) => {
    if (!type) return null;
    
    const isOr = type.toLowerCase() === 'or';
    
    return (
      <g transform={`translate(${x},${y})`}>
        {isOr ? (
           // OR Gate: Shield shape (Black Silhouette)
           <path d="M -15,0 Q 0,5 15,0 Q 15,20 0,35 Q -15,20 -15,0 Z" fill="black" />
        ) : (
           // AND Gate: Tombstone shape (Black Silhouette)
           <path d="M -15,0 L 15,0 L 15,20 A 15,15 0 0 1 -15,20 Z" fill="black" /> 
        )}
      </g>
    );
  };

  const renderNode = (node: FaultTreeNode, x: number, y: number): React.ReactElement[] => {
    const width = getTreeWidth(node);
    const centerX = x + width / 2;
    const elements: React.ReactElement[] = [];

    // Styling based on type
    let style = STYLES.intermediate;
    if (node.type === 'top') style = STYLES.top;
    if (node.type === 'basic') style = STYLES.basic;

    const isBasic = node.type === 'basic';

    // Draw Node
    elements.push(
      <g key={`node-${x}-${y}`} 
         className="node transition-all hover:opacity-90 cursor-pointer group"
         onClick={() => setEditingNode({ node })}
      >
        {isBasic ? (
          <g>
             <circle 
                cx={centerX} 
                cy={y + BASIC_RADIUS} 
                r={BASIC_RADIUS} 
                fill={style.fill} 
                stroke={style.stroke} 
                strokeWidth="1.5" 
             />
             <foreignObject 
               x={centerX - (BASIC_RADIUS * 0.85)} 
               y={y + (BASIC_RADIUS * 0.3)} 
               width={BASIC_RADIUS * 1.7} 
               height={BASIC_RADIUS * 1.4} 
               className="pointer-events-none"
             >
              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-center leading-tight px-1 break-words" style={{color: style.text}}>
                {node.label}
              </div>
            </foreignObject>
          </g>
        ) : (
          <g>
            <rect 
              x={centerX - NODE_WIDTH/2} 
              y={y} 
              width={NODE_WIDTH} 
              height={NODE_HEIGHT} 
              fill={style.fill} 
              stroke={style.stroke} 
              strokeWidth="1" 
              rx="0" 
            />
            <foreignObject x={centerX - NODE_WIDTH/2} y={y} width={NODE_WIDTH} height={NODE_HEIGHT} className="pointer-events-none">
              <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-center p-2 leading-tight" style={{color: style.text}}>
                {node.label}
              </div>
            </foreignObject>
          </g>
        )}
        
        {/* Hover Edit Hint */}
        <foreignObject x={centerX + NODE_WIDTH/2 - 20} y={y - 10} width={20} height={20}>
             <div className="hidden group-hover:flex bg-white border border-slate-300 text-slate-700 rounded-full w-5 h-5 items-center justify-center shadow-sm">
                <Edit3 size={10} />
             </div>
        </foreignObject>
      </g>
    );

    // Draw Children and Gate
    if (node.children && node.children.length > 0) {
      const gateY = y + (isBasic ? BASIC_RADIUS * 2 : NODE_HEIGHT) + 20; 
      
      // Line from Node to Gate Top
      const nodeBottomY = y + (isBasic ? BASIC_RADIUS * 2 : NODE_HEIGHT);
      elements.push(<path key={`l1-${x}-${y}`} d={`M ${centerX} ${nodeBottomY} L ${centerX} ${gateY}`} stroke="black" strokeWidth="1.5" />);
      
      // Render Gate Symbol
      elements.push(
        <React.Fragment key={`gate-${x}-${y}`}>
            {renderGate(node.gate, centerX, gateY)}
        </React.Fragment>
      );

      const gateBottomY = gateY + 35; // Bottom of gate symbol
      
      const childrenWidths = node.children.map(getTreeWidth);
      const totalChildrenWidth = childrenWidths.reduce((a,b)=>a+b, 0);
      let currentX = x + (width - totalChildrenWidth) / 2;
      
      const distLineY = gateBottomY + 15;
      const childTopY = distLineY + 20;

      // Calculate child centers for cleaner path generation
      const childCenters: number[] = [];
      let tempX = currentX;
      node.children.forEach((child, i) => {
          const childWidth = childrenWidths[i];
          childCenters.push(tempX + childWidth/2);
          tempX += childWidth;
      });

      const firstChildX = childCenters[0];
      const lastChildX = childCenters[childCenters.length - 1];

      // Construct optimized path (Orthogonal)
      // 1. Vertical stem from Gate
      let pathD = `M ${centerX} ${gateBottomY} L ${centerX} ${distLineY}`;

      // 2. Horizontal distribution bar
      if (node.children.length > 1) {
         pathD += ` M ${firstChildX} ${distLineY} L ${lastChildX} ${distLineY}`;
      }

      // 3. Vertical drops to children
      childCenters.forEach(cx => {
         pathD += ` M ${cx} ${distLineY} L ${cx} ${childTopY}`;
      });

      elements.push(
        <path 
          key={`connect-${x}-${y}`} 
          d={pathD} 
          fill="none" 
          stroke="black" 
          strokeWidth="1.5" 
        />
      );
      
      // Recursively render children
      let childRenderX = x + (width - totalChildrenWidth) / 2;
      node.children.forEach((child, i) => {
          const childWidth = childrenWidths[i];
          elements.push(...renderNode(child, childRenderX, childTopY));
          childRenderX += childWidth;
      });
    }

    return elements;
  };

  const handleSnapshot = async () => {
    if (!(window as any).html2canvas || !containerRef.current) return;
    const originalZoom = zoom;
    const originalPan = pan;
    setZoom(1);
    setPan({x:0, y:0});
    setTimeout(async () => {
      try {
        const canvas = await (window as any).html2canvas(containerRef.current, { scale: 2, backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = `FTA_${scenario.substring(0, 10)}.png`;
        link.href = canvas.toDataURL();
        link.click();
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
    
    // Center it
    const newPanX = (wrapperRect.width - contentW * newZoom) / 2;
    const newPanY = (wrapperRect.height - contentH * newZoom) / 2;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleResetZoom = () => {
     setZoom(1);
     setPan({ x: 0, y: 0 });
  };

  const totalWidth = treeData ? getTreeWidth(treeData) : 1000;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 bg-grid-pattern">
      <div className="sticky top-4 z-40 bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-slate-200 p-2 flex gap-3 mb-8">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-600 text-white hover:bg-slate-700 transition-colors"><ArrowLeft size={16}/></button>
        <div className="w-px h-6 bg-slate-300 self-center" />
        <button onClick={() => handleGenerate('normal')} disabled={loading} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-md">
          {loading ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>} Generate FTA
        </button>
        <button onClick={() => handleGenerate('rigorous')} disabled={loading} className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-md">
          {loading ? <Loader2 className="animate-spin" size={16}/> : <BrainCircuit size={16}/>} Detailed AI
        </button>
        <button onClick={handleSnapshot} className="w-10 h-10 flex items-center justify-center rounded-full bg-sky-500 text-white hover:bg-sky-600 shadow-md"><Camera size={16}/></button>

        <div className="w-px h-6 bg-slate-300 self-center" />
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

      {!treeData && (
        <div className="w-full max-w-2xl mb-12 animate-fade-in-up">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-blue-100 text-center">
             <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
               <GitMerge size={32} />
             </div>
             <h2 className="text-2xl font-bold text-slate-800 mb-2">Fault Tree Analysis</h2>
             <p className="text-slate-500 mb-6">Enter a top event below to generate a deductive failure analysis diagram.</p>
             <input 
                className="w-full p-4 text-lg bg-white text-black border border-slate-300 rounded-xl shadow-inner focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" 
                placeholder="e.g. Storage Tank Overflow, Engine Failure" 
                value={scenario} 
                onChange={e => setScenario(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleGenerate('normal')}
              />
          </div>
        </div>
      )}

      {treeData && (
        <div 
           ref={wrapperRef} 
           className="w-full flex-grow overflow-hidden relative cursor-grab active:cursor-grabbing border border-slate-200 rounded-2xl bg-white shadow-2xl min-h-[600px]"
           onMouseDown={handleMouseDown}
           onMouseMove={handleMouseMove}
           onMouseUp={handleMouseUp}
           onMouseLeave={handleMouseUp}
           onWheel={handleWheel}
        >
          <div 
             ref={containerRef} 
             className="relative" 
             style={{ 
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
                transformOrigin: '0 0', 
                padding: '80px', 
                width: 'fit-content',
                minWidth: 'min-content'
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

             <svg width={Math.max(1000, totalWidth)} height={1500} className="overflow-visible">
               {renderNode(treeData, 0, 0)}
             </svg>

          </div>
        </div>
      )}

      {/* --- NODE EDITOR MODAL --- */}
      {editingNode && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
           <div className="bg-white rounded-xl shadow-2xl p-6 w-[400px] animate-fade-in-up border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Settings size={18}/> Edit Fault Event</h3>
                 <button onClick={() => setEditingNode(null)} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
              </div>

              <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Event Description</label>
                    <textarea 
                      className="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800 resize-none h-20" 
                      value={editingNode.node.label}
                      onChange={e => setEditingNode({...editingNode, node: {...editingNode.node, label: e.target.value}})}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Event Type</label>
                        <select 
                           className="w-full p-2 border border-slate-300 rounded text-sm"
                           value={editingNode.node.type}
                           onChange={e => setEditingNode({...editingNode, node: {...editingNode.node, type: e.target.value as any}})}
                        >
                           <option value="top">Top Event</option>
                           <option value="intermediate">Intermediate</option>
                           <option value="basic">Basic Event</option>
                        </select>
                    </div>
                    {editingNode.node.type !== 'basic' && (
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Logic Gate</label>
                           <select 
                              className="w-full p-2 border border-slate-300 rounded text-sm"
                              value={editingNode.node.gate || 'or'}
                              onChange={e => setEditingNode({...editingNode, node: {...editingNode.node, gate: e.target.value as any}})}
                           >
                              <option value="or">OR Gate (+)</option>
                              <option value="and">AND Gate (•)</option>
                           </select>
                        </div>
                    )}
                 </div>
              </div>
              
              <div className="mt-6 flex flex-col gap-2">
                 <button onClick={handleAddChild} className="w-full py-2 bg-blue-50 text-blue-700 font-bold rounded hover:bg-blue-100 flex items-center justify-center gap-2 border border-blue-200">
                    <Plus size={16}/> Add Child Event
                 </button>
                 
                 <div className="flex gap-2 mt-2">
                    <button onClick={handleDeleteNode} className="flex-1 py-2 bg-white text-red-600 border border-red-200 font-bold rounded hover:bg-red-50 flex items-center justify-center gap-2">
                       <Trash2 size={16}/> Delete
                    </button>
                    <button onClick={() => handleSaveNode(editingNode.node)} className="flex-[2] py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">
                       Save Changes
                    </button>
                 </div>
              </div>

           </div>
        </div>
      )}

    </div>
  );
};

export default FaultTreeEditor;
