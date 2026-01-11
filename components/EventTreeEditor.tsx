import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Sparkles, BrainCircuit, Camera, ZoomIn, ZoomOut, 
  Loader2, Activity, RotateCcw, Maximize, BookOpen, FileText, 
  X, CheckCircle2, Layout, Settings, Edit3, Trash2, Plus, GitMerge
} from 'lucide-react';
import { generateEventTreeData } from '../services/geminiService';
import { EventTreeData, EventTreeNode } from '../types';

const COLUMN_WIDTH = 240;
const ROW_HEIGHT = 90;
const NODE_WIDTH = 180;
const NODE_HEIGHT = 50;
const COLOR_LINE_TRUE = "#ef4444";
const COLOR_LINE_FALSE = "#3b82f6";

const REACTOR_EXAMPLE: EventTreeData = {
  initiatingEvent: "Pipe Crack (Coolant Leak)",
  pivotalEvents: ["HPIS Activates?", "LPIS Activates?", "Operator Action?"],
  root: {
    type: "branch",
    children: [
      {
        path: "Success",
        probability: 0.99,
        node: { type: "leaf", outcome: "Safe Shutdown" }
      },
      {
        path: "Failure",
        probability: 0.01,
        node: {
          type: "branch",
          children: [
            {
              path: "Success",
              probability: 0.9,
              node: { type: "leaf", outcome: "Safe Shutdown (Low Press)" }
            },
            {
              path: "Failure",
              probability: 0.1,
              node: {
                type: "branch",
                children: [
                  {
                    path: "Success",
                    probability: 0.8,
                    node: { type: "leaf", outcome: "Manual Recovery" }
                  },
                  {
                    path: "Failure",
                    probability: 0.2,
                    node: { type: "leaf", outcome: "Core Damage" }
                  }
                ]
              }
            }
          ]
        }
      }
    ]
  }
};

const EventTreeEditor = ({ onBack, initialData }: { onBack: () => void, initialData?: EventTreeData }) => {
  const [scenario, setScenario] = useState("");
  const [treeData, setTreeData] = useState<EventTreeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const [editingNode, setEditingNode] = useState<{ node: EventTreeNode, depth: number, pathLabel?: string, probability?: number } | null>(null);
  const [editingPivotal, setEditingPivotal] = useState<{ index: number, value: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData) {
      setTreeData(initialData);
      setScenario(initialData.initiatingEvent);
    }
  }, [initialData]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.group, button, input')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
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
      const data = await generateEventTreeData(scenario, mode);
      if (data) setTreeData(data);
      else alert("Received empty data from AI.");
    } catch (e) {
      alert("Failed to generate tree. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadExample = () => {
    setTreeData(JSON.parse(JSON.stringify(REACTOR_EXAMPLE)));
    setScenario("Reactor Coolant Loss");
  };

  const saveNodeChanges = (updatedValues: any) => {
    if (!treeData || !editingNode) return;
    
    const updateTreeRecursive = (node: EventTreeNode): EventTreeNode => {
        if (node === editingNode.node) {
            const newNode = { ...node, ...updatedValues };
            delete (newNode as any).pathLabel;
            delete (newNode as any).probability;
            return newNode;
        }

        if (node.children) {
            const newChildren = node.children.map(child => {
                if (child.node === editingNode.node) {
                    return {
                        ...child,
                        path: updatedValues.pathLabel !== undefined ? updatedValues.pathLabel : child.path,
                        probability: updatedValues.probability !== undefined ? parseFloat(updatedValues.probability) : child.probability,
                        node: {
                            ...child.node,
                            outcome: updatedValues.outcome !== undefined ? updatedValues.outcome : child.node.outcome,
                            type: updatedValues.type || child.node.type,
                            children: updatedValues.children || child.node.children
                        }
                    };
                } else {
                    return { ...child, node: updateTreeRecursive(child.node) };
                }
            });
            return { ...node, children: newChildren };
        }
        return node;
    };

    if (editingNode.node === treeData.root) {
         const newRoot = { ...treeData.root, ...updatedValues };
         setTreeData({ ...treeData, root: newRoot });
    } else {
         const newRoot = updateTreeRecursive(treeData.root);
         setTreeData({ ...treeData, root: newRoot });
    }
    setEditingNode(null);
  };

  const extendNode = () => {
    saveNodeChanges({ type: "branch", children: [
      { path: "Success", probability: 0.9, node: { type: "leaf", outcome: "Safe" } },
      { path: "Failure", probability: 0.1, node: { type: "leaf", outcome: "Fail" } }
    ], outcome: undefined });
  };

  const deleteNodeBranch = () => {
    saveNodeChanges({ type: "leaf", children: [], outcome: "New Outcome" });
  };

  const addPivotalEvent = () => {
    if (!treeData) return;
    setTreeData({ ...treeData, pivotalEvents: [...treeData.pivotalEvents, "New Event"] });
  };
  
  const removePivotalEvent = (index: number) => {
    if (!treeData) return;
    const newPivotal = [...treeData.pivotalEvents];
    newPivotal.splice(index, 1);
    setTreeData({ ...treeData, pivotalEvents: newPivotal });
  };

  const useLayout = (data: EventTreeData | null) => {
    return useMemo(() => {
      if (!data) return null;
      const nodePositions = new Map<EventTreeNode, { y: number, leafIdx: number }>();
      let leafCounter = 0;
      const traverse = (node: EventTreeNode) => {
        if (!node.children || node.children.length === 0) {
          const y = leafCounter * ROW_HEIGHT + ROW_HEIGHT / 2;
          nodePositions.set(node, { y, leafIdx: leafCounter });
          leafCounter++;
          return y;
        } else {
          const childYs = node.children.map(child => traverse(child.node));
          const minY = Math.min(...childYs);
          const maxY = Math.max(...childYs);
          const avgY = (minY + maxY) / 2;
          nodePositions.set(node, { y: avgY, leafIdx: -1 });
          return avgY;
        }
      };
      traverse(data.root);
      return { nodePositions, totalLeaves: leafCounter };
    }, [data]);
  };

  const layout = useLayout(treeData);

  const getOutcomeStyle = (outcome: string) => {
      const lower = (outcome || "").toLowerCase();
      if (lower.includes('critical') || lower.includes('fatality') || lower.includes('damage') || lower.includes('meltdown') || lower.includes('fire')) return { bg: '#fca5a5', border: '#b91c1c', text: '#7f1d1d' };
      if (lower.includes('recovery') || lower.includes('safe') || lower.includes('success') || lower.includes('ok') || lower.includes('shutdown')) return { bg: '#fef08a', border: '#eab308', text: '#854d0e' };
      return { bg: '#e2e8f0', border: '#64748b', text: '#1e293b' };
  };

  const renderNodeRecursively = (node: EventTreeNode, depth: number, labelFromParent: string, probFromParent: number): React.ReactElement[] => {
    if (!layout || !treeData) return [];
    const pos = layout.nodePositions.get(node);
    if (!pos) return [];

    const x = depth * COLUMN_WIDTH + (COLUMN_WIDTH / 2);
    const y = pos.y;
    const elements: React.ReactElement[] = [];
    const isRoot = depth === 0;
    const isLeaf = !node.children || node.children.length === 0;
    
    let boxLabel = "";
    let boxSub = "";
    let boxStyle = { bg: "white", border: "#334155", text: "#1e293b" };

    if (isRoot) {
        boxLabel = treeData.initiatingEvent;
        boxSub = "P = 1.0";
        boxStyle = { bg: "#e0f2fe", border: "#0ea5e9", text: "#0c4a6e" };
    } else if (isLeaf) {
        boxLabel = node.outcome || "Unknown";
        boxSub = probFromParent ? `P ≈ ${probFromParent}` : ""; 
        boxStyle = getOutcomeStyle(boxLabel);
    } else {
        const eventName = treeData.pivotalEvents[depth - 1] || "Event";
        boxLabel = `${eventName} - ${labelFromParent || "?"}`;
        boxSub = `P = ${probFromParent}`;
    }

    const renderX = isLeaf ? (treeData.pivotalEvents.length + 1) * COLUMN_WIDTH + (COLUMN_WIDTH/2) : x;

    elements.push(
      <g key={`node-${depth}-${y}`} className="transition-all hover:opacity-90 cursor-pointer group" onClick={() => setEditingNode({ node, depth, pathLabel: labelFromParent, probability: probFromParent })}>
         <rect x={renderX - NODE_WIDTH/2} y={y - NODE_HEIGHT/2} width={NODE_WIDTH} height={NODE_HEIGHT} fill={boxStyle.bg} stroke={boxStyle.border} strokeWidth="1.5" rx="4" className="group-hover:stroke-blue-500 group-hover:stroke-2" />
         <foreignObject x={renderX - NODE_WIDTH/2} y={y - NODE_HEIGHT/2} width={NODE_WIDTH} height={NODE_HEIGHT} className="pointer-events-none">
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-1 leading-none">
                <div className="text-[11px] font-bold truncate w-full px-1" style={{color: boxStyle.text}} title={boxLabel}>{boxLabel}</div>
                {boxSub && <div className="text-[9px] font-mono mt-0.5" style={{color: boxStyle.text}}>{boxSub}</div>}
            </div>
         </foreignObject>
         <foreignObject x={renderX + NODE_WIDTH/2 - 20} y={y - NODE_HEIGHT/2 - 10} width={20} height={20}>
            <div className="hidden group-hover:flex bg-blue-600 text-white rounded-full w-5 h-5 items-center justify-center shadow"><Edit3 size={10} /></div>
         </foreignObject>
      </g>
    );

    if (node.children && node.children.length > 0) {
        const startX = renderX + NODE_WIDTH/2;
        const splitX = (depth + 1) * COLUMN_WIDTH;

        node.children.forEach((child, index) => {
            const childNode = child.node;
            const childPos = layout.nodePositions.get(childNode);
            if (!childPos) return;

            const isTop = index === 0;
            const lineColor = isTop ? COLOR_LINE_TRUE : COLOR_LINE_FALSE;
            const isChildLeaf = !childNode.children || childNode.children.length === 0;
            const childRenderX = isChildLeaf ? (treeData.pivotalEvents.length + 1) * COLUMN_WIDTH + (COLUMN_WIDTH/2) : (depth + 1) * COLUMN_WIDTH + (COLUMN_WIDTH/2);
            const targetX = childRenderX - NODE_WIDTH/2;

            const d = `M ${startX} ${y} L ${splitX} ${y} L ${splitX} ${childPos.y} L ${targetX} ${childPos.y}`;

            elements.push(<path key={`link-${depth}-${index}-${y}`} d={d} stroke={lineColor} strokeWidth="1.5" fill="none" />);
            const midX = (startX + splitX) / 2;
            elements.push(
              <text key={`txt-${depth}-${index}-${y}`} x={splitX + 5} y={(y + childPos.y)/2} fontSize="9" fill={lineColor} fontWeight="bold">
                 {child.path} ({child.probability})
              </text>
            );
            elements.push(...renderNodeRecursively(childNode, depth + 1, child.path, child.probability));
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
        link.download = `ETA_${scenario.substring(0,10)}.png`;
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
    const newPanX = (wrapperRect.width - contentW * newZoom) / 2;
    const newPanY = (wrapperRect.height - contentH * newZoom) / 2;
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleResetZoom = () => { setZoom(1); };

  const canvasWidth = treeData ? (treeData.pivotalEvents.length + 2) * COLUMN_WIDTH : 1000;
  const canvasHeight = layout ? Math.max(600, layout.totalLeaves * ROW_HEIGHT + 150) : 600;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 bg-grid-pattern">
       <div className="sticky top-4 z-40 bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-slate-200 p-2 flex gap-3 mb-8">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-600 text-white hover:bg-slate-700 transition-colors" title="Back"><ArrowLeft size={16}/></button>
        <div className="w-px h-6 bg-slate-300 self-center" />
        <button onClick={() => handleGenerate('normal')} disabled={loading} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-md">
          {loading ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>} Generate ETA
        </button>
        <button onClick={() => handleGenerate('rigorous')} disabled={loading} className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-md">
          {loading ? <Loader2 className="animate-spin" size={16}/> : <BrainCircuit size={16}/>} Detailed AI
        </button>
        <div className="w-px h-6 bg-slate-300 self-center" />
        <button onClick={loadExample} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg flex items-center gap-2 hover:bg-slate-200 border border-slate-300 transition-colors">
          <FileText size={16}/> Load Example
        </button>
        <button onClick={() => setShowGuide(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors" title="Guide">
          <BookOpen size={16}/>
        </button>
        <div className="w-px h-6 bg-slate-300 self-center" />
        <button onClick={handleSnapshot} className="w-10 h-10 flex items-center justify-center rounded-full bg-sky-500 text-white hover:bg-sky-600 shadow-md" title="Snapshot"><Camera size={16}/></button>
        <div className="flex items-center gap-2 px-2">
           <div className="cursor-pointer" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}><ZoomOut size={16} className="text-slate-500 hover:text-emerald-600" /></div>
           <span className="text-xs font-bold text-slate-600 w-8 text-center">{Math.round(zoom * 100)}%</span>
           <div className="cursor-pointer" onClick={() => setZoom(z => Math.min(2, z + 0.1))}><ZoomIn size={16} className="text-slate-500 hover:text-emerald-600" /></div>
           <div className="w-px h-4 bg-slate-300 mx-1"></div>
           <div className="cursor-pointer" onClick={handleResetZoom} title="Reset Zoom"><RotateCcw size={14} className="text-slate-400 hover:text-slate-600" /></div>
           <div className="cursor-pointer" onClick={handleFitScreen} title="Fit to Screen"><Maximize size={14} className="text-slate-400 hover:text-slate-600" /></div>
        </div>
      </div>

      {!treeData && (
        <div className="w-full max-w-2xl mb-12 animate-fade-in-up">
           <div className="bg-white p-8 rounded-2xl shadow-xl border border-blue-100 text-center">
             <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
               <Activity size={32} />
             </div>
             <h2 className="text-2xl font-bold text-slate-800 mb-2">Event Tree Analysis</h2>
             <p className="text-slate-500 mb-6">Map out accident sequences from an initiating event to consequences.</p>
             <input 
                className="w-full p-4 text-lg bg-white text-black border border-slate-300 rounded-xl shadow-inner focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all" 
                placeholder="e.g. Loss of Cooling Water" 
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
                width: canvasWidth + 200, 
                height: canvasHeight + 200
             }}
          >
             <div className="absolute top-10 left-0 flex pointer-events-none">
                <div style={{width: COLUMN_WIDTH}} className="flex justify-center px-4">
                    <div className="bg-slate-800 text-white px-4 py-2 rounded-lg shadow-md font-bold text-sm">Initiating Event</div>
                </div>
                {treeData.pivotalEvents.map((evt, i) => (
                   <div key={i} style={{width: COLUMN_WIDTH}} className="flex justify-center px-4 relative group pointer-events-auto">
                      <div className="bg-white border-2 border-slate-600 text-slate-800 px-4 py-2 rounded-lg shadow-md font-bold text-sm text-center w-full relative z-10">
                         {evt}
                         <div className="absolute -top-3 -right-3 hidden group-hover:flex gap-1">
                            <button onClick={() => removePivotalEvent(i)} className="p-1 bg-red-500 text-white rounded-full"><X size={10}/></button>
                         </div>
                      </div>
                      <div className="absolute top-10 bottom-[-1000px] left-1/2 w-px border-l border-dashed border-slate-300 -z-0 h-[2000px]" />
                   </div>
                ))}
                <div style={{width: COLUMN_WIDTH}} className="flex justify-center px-4">
                    <button onClick={addPivotalEvent} className="bg-slate-200 text-slate-500 hover:bg-slate-300 px-4 py-2 rounded-lg shadow-sm font-bold text-sm pointer-events-auto flex items-center gap-1">
                       <Plus size={14}/> Add Function
                    </button>
                </div>
                <div style={{width: COLUMN_WIDTH}} className="flex justify-center px-4">
                    <div className="bg-slate-800 text-white px-4 py-2 rounded-lg shadow-md font-bold text-sm">Consequences</div>
                </div>
             </div>
             <svg width={canvasWidth} height={canvasHeight} className="overflow-visible absolute top-[100px] left-0 pointer-events-none">
                {renderNodeRecursively(treeData.root, 0, "", 0)}
             </svg>
          </div>
        </div>
      )}

      {editingNode && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
             <div className="bg-white rounded-xl shadow-2xl p-6 w-[400px] animate-fade-in-up border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Settings size={18}/> Edit Node</h3>
                   <button onClick={() => setEditingNode(null)} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
                </div>
                <div className="space-y-4">
                   {(!editingNode.node.children || editingNode.node.children.length === 0) && (
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Outcome</label>
                         <input className="w-full p-2 border border-slate-300 rounded text-slate-800" value={editingNode.node.outcome || ""} onChange={e => saveNodeChanges({ outcome: e.target.value })} />
                      </div>
                   )}
                   {editingNode.depth > 0 && (
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Branch Probability</label>
                         <input type="number" step="0.01" max="1" min="0" className="w-full p-2 border border-slate-300 rounded text-slate-800" value={editingNode.probability} onChange={e => saveNodeChanges({ probability: e.target.value })} />
                      </div>
                   )}
                   {editingNode.depth > 0 && (
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Path Label</label>
                         <input className="w-full p-2 border border-slate-300 rounded text-slate-800" value={editingNode.pathLabel || ""} onChange={e => saveNodeChanges({ pathLabel: e.target.value })} />
                      </div>
                   )}
                </div>
                <div className="mt-6 flex flex-col gap-2">
                   {(!editingNode.node.children || editingNode.node.children.length === 0) ? (
                      <button onClick={extendNode} className="w-full py-2 bg-blue-50 text-blue-700 font-bold rounded hover:bg-blue-100 flex items-center justify-center gap-2 border border-blue-200"><GitMerge size={16}/> Extend Branch</button>
                   ) : (
                      <button onClick={deleteNodeBranch} className="w-full py-2 bg-red-50 text-red-700 font-bold rounded hover:bg-red-100 flex items-center justify-center gap-2 border border-red-200"><Trash2 size={16}/> Remove Children (Make Leaf)</button>
                   )}
                   <button onClick={() => setEditingNode(null)} className="w-full py-2 bg-slate-200 text-slate-700 font-bold rounded hover:bg-slate-300">Close</button>
                </div>
             </div>
         </div>
      )}

      {showGuide && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
             <div className="bg-white rounded-xl shadow-2xl p-6 w-[600px] animate-fade-in-up border border-slate-200">
                 <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                    <h3 className="text-xl font-bold text-slate-800">Event Tree Analysis Guide</h3>
                    <button onClick={() => setShowGuide(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                 </div>
                 <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                    <p><strong>Initiating Event:</strong> The breakdown or failure that starts the chain (e.g., Pipe Leak).</p>
                    <p><strong>Pivotal Events:</strong> Safety systems or conditions that can either Succeed or Fail (e.g., Sprinkler System).</p>
                    <p><strong>Branches:</strong> The top path typically represents "Success" (True), and the bottom path "Failure" (False).</p>
                    <p><strong>Outcomes:</strong> The final result of each path (e.g., Safe, Fire, Explosion). Color coded automatically.</p>
                    <div className="bg-slate-50 p-4 rounded border border-slate-200 mt-4">
                       <strong>Tips:</strong>
                       <ul className="list-disc pl-5 mt-2 space-y-1">
                          <li>Click on any node to edit its probability or outcome.</li>
                          <li>Leaf nodes can be extended to add more levels.</li>
                          <li>Use "Detailed AI" for a more comprehensive tree generation.</li>
                       </ul>
                    </div>
                 </div>
             </div>
         </div>
      )}
    </div>
  );
};

export default EventTreeEditor;