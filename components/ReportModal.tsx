
import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, FileText, CheckCircle, Activity, Building, Calendar, User, Download } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  moduleName: string; // 'BowTie', 'HAZOP', 'LOPA', etc.
  diagramRef: React.RefObject<HTMLElement>; // The element to capture as the "Diagram"
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, data, moduleName, diagramRef }) => {
  const [diagramImage, setDiagramImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const reportContentRef = useRef<HTMLDivElement>(null);

  // Metadata State
  const [docInfo, setDocInfo] = useState({
    docNo: `RA-${moduleName.toUpperCase()}-${new Date().getFullYear()}-001`,
    rev: 'A',
    date: new Date().toISOString().split('T')[0],
    preparedBy: 'Safety Engineer',
    approvedBy: 'HSE Manager',
    site: 'Main Processing Facility',
    dept: 'Operations'
  });

  useEffect(() => {
    if (isOpen && diagramRef.current && (window as any).html2canvas) {
      setIsCapturing(true);
      // Small delay to ensure render is complete
      setTimeout(() => {
        (window as any).html2canvas(diagramRef.current, {
          scale: 1.5, // Good quality for print, not too heavy
          backgroundColor: '#ffffff',
          ignoreElements: (element: Element) => element.classList.contains('no-print') // Ignore UI buttons in diagram
        }).then((canvas: HTMLCanvasElement) => {
          setDiagramImage(canvas.toDataURL('image/png'));
          setIsCapturing(false);
        }).catch((err: any) => {
          console.error("Screenshot failed", err);
          setIsCapturing(false);
        });
      }, 500);
    }
  }, [isOpen, diagramRef]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!reportContentRef.current || !(window as any).jspdf) {
        // Fallback if jspdf not available
        window.print();
        return;
    }
    
    setIsCapturing(true);
    try {
        const { jsPDF } = (window as any).jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = 210;
        const pdfHeight = 297;
        
        // Capture the report content
        const canvas = await (window as any).html2canvas(reportContentRef.current, {
            scale: 2, // High res
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            doc.addPage();
            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }
        
        doc.save(`${docInfo.docNo}.pdf`);
    } catch (error) {
        console.error("PDF generation failed:", error);
        alert("Failed to generate PDF. Please try printing to PDF instead.");
    } finally {
        setIsCapturing(false);
    }
  };

  if (!isOpen) return null;

  // --- DYNAMIC CONTENT HELPERS ---
  const getHazardsDetailed = () => {
    if (!data) return [];
    if (moduleName === 'BowTie') {
        return data.threats?.map((t: any) => ({
            name: t.name,
            cause: "Various operational or equipment failures",
            consequence: data.consequences?.[0]?.name || "Loss of Containment"
        })) || [];
    }
    if (moduleName === 'HAZOP') {
        return data.rows?.map((r: any) => ({
            name: `${r.deviation} on ${data.name || 'Process Node'}`,
            cause: r.cause,
            consequence: r.consequence
        })) || [];
    }
    if (moduleName === 'LOPA') {
        return [{
            name: data.initiatingEvent,
            cause: "Initiating Event occurrence",
            consequence: data.consequenceDescription
        }];
    }
    if (moduleName === 'FMEA') {
        return data.rows?.map((r: any) => ({
            name: r.failureMode,
            cause: r.cause,
            consequence: r.failureEffect
        })) || [];
    }
    if (moduleName === 'Fault Tree') {
        return data.children?.map((c: any) => ({
            name: c.label,
            cause: "Basic event failure",
            consequence: "Contributes to Top Event"
        })) || [];
    }
    if (moduleName === 'QRA') {
        return data.scenarios?.map((s: any) => ({
            name: s.name,
            cause: `Frequency: ${s.frequency}/yr`,
            consequence: `${s.fatalities} Potential Fatalities`
        })) || [];
    }
    return [];
  };

  const getDetailedControls = () => {
    if (!data) return { engineering: [], admin: [] };
    
    let eng: string[] = [], admin: string[] = [];
    
    const processBarrier = (b: any) => {
        const text = `${b.label}${b.owner ? ` (Owner: ${b.owner})` : ''}${b.performanceStandard ? ` [Criteria: ${b.performanceStandard}]` : ''}`;
        const cat = (b.category || '').toLowerCase();
        
        if (cat.includes('equipment') || cat.includes('design') || cat.includes('integrity') || cat.includes('hardware') || cat.includes('alarm') || cat.includes('trip')) {
            eng.push(text);
        } else {
            admin.push(text); // Procedural, task, training, etc.
        }
    };

    if (moduleName === 'BowTie') {
        data.threats?.forEach((t: any) => t.barriers?.forEach(processBarrier));
        data.consequences?.forEach((c: any) => c.barriers?.forEach(processBarrier));
    } else if (moduleName === 'HAZOP') {
        data.rows?.forEach((r: any) => {
            if(r.safeguardsInstrumental) eng.push(r.safeguardsInstrumental);
            if(r.safeguardsOther) admin.push(r.safeguardsOther);
        });
    } else if (moduleName === 'LOPA') {
        data.ipls?.forEach((i: any) => eng.push(`${i.name} (PFD: ${i.pfd})`));
    } else if (moduleName === 'FMEA') {
        data.rows?.forEach((r: any) => admin.push(r.controls));
    }

    return { eng, admin };
  };

  const hazards = getHazardsDetailed();
  const { eng, admin } = getDetailedControls();

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[5000] flex justify-center items-start overflow-y-auto pt-10 pb-10">
      {/* Print Styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { visibility: hidden; }
          #root { display: none; }
          .printable-report-wrapper {
             display: block !important;
             position: absolute !important;
             top: 0;
             left: 0;
             width: 100%;
             visibility: visible !important;
             z-index: 9999;
          }
          .printable-report-wrapper * {
             visibility: visible !important;
          }
          .no-print { display: none !important; }
          /* Ensure backgrounds print */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="printable-report-wrapper bg-white w-[210mm] min-h-[297mm] shadow-2xl relative text-slate-900 font-serif">
        
        {/* --- ACTIONS BAR (No Print) --- */}
        <div className="no-print absolute -top-12 left-0 w-full flex justify-between items-center px-4 text-white">
           <h2 className="text-xl font-bold flex items-center gap-2"><FileText /> Report Preview</h2>
           <div className="flex gap-3">
             <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 font-bold transition-colors">
               <Printer size={18} /> Print / Save PDF
             </button>
             <button onClick={onClose} className="p-2 bg-slate-700 rounded hover:bg-slate-600 transition-colors">
               <X size={20} />
             </button>
           </div>
        </div>

        {/* --- REPORT CONTENT --- */}
        <div ref={reportContentRef} className="p-10 space-y-8 bg-white min-h-[297mm]">
          
          {/* HEADER */}
          <div className="border-b-4 border-slate-900 pb-4 mb-8 flex justify-between items-end">
             <div>
                <div className="flex items-center gap-2 text-slate-900 mb-2">
                   <Activity size={32} className="text-emerald-600" />
                   <span className="text-2xl font-black tracking-tighter">Safety for All</span>
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-widest font-sans">Enterprise Risk Management System</div>
             </div>
             <div className="text-right">
                <h1 className="text-2xl font-bold uppercase text-slate-800 mb-1">{moduleName} Report</h1>
                <div className="text-sm font-sans text-slate-500">Generated: {new Date().toLocaleDateString()}</div>
             </div>
          </div>

          {/* 1. DOCUMENT CONTROL & GOVERNANCE */}
          <section className="mb-6">
             <h2 className="text-sm font-bold uppercase border-b border-slate-300 mb-3 text-blue-900">1. Document Control & Governance</h2>
             <div className="grid grid-cols-4 gap-0 border border-slate-300 text-xs font-sans">
                <div className="p-2 bg-slate-100 font-bold border-r border-b border-slate-300">Document No</div>
                <div className="p-2 border-r border-b border-slate-300" contentEditable>{docInfo.docNo}</div>
                <div className="p-2 bg-slate-100 font-bold border-r border-b border-slate-300">Revision</div>
                <div className="p-2 border-b border-slate-300" contentEditable>{docInfo.rev}</div>

                <div className="p-2 bg-slate-100 font-bold border-r border-b border-slate-300">Date of Issue</div>
                <div className="p-2 border-r border-b border-slate-300" contentEditable>{docInfo.date}</div>
                <div className="p-2 bg-slate-100 font-bold border-r border-b border-slate-300">Review Date</div>
                <div className="p-2 border-b border-slate-300" contentEditable>+1 Year</div>

                <div className="p-2 bg-slate-100 font-bold border-r border-b border-slate-300">Site / Asset</div>
                <div className="p-2 border-r border-b border-slate-300" contentEditable>{docInfo.site}</div>
                <div className="p-2 bg-slate-100 font-bold border-r border-b border-slate-300">Department</div>
                <div className="p-2 border-b border-slate-300" contentEditable>{docInfo.dept}</div>

                <div className="p-2 bg-slate-100 font-bold border-r border-slate-300">Prepared By</div>
                <div className="p-2 border-r border-slate-300" contentEditable>{docInfo.preparedBy}</div>
                <div className="p-2 bg-slate-100 font-bold border-r border-slate-300">Approved By</div>
                <div className="p-2" contentEditable>{docInfo.approvedBy}</div>
             </div>
          </section>

          {/* DIAGRAM SECTION */}
          <section className="mb-8 break-inside-avoid">
             <h2 className="text-sm font-bold uppercase border-b border-slate-300 mb-3 text-blue-900 flex justify-between">
                <span>Visual Analysis Model ({moduleName})</span>
                <span className="text-[10px] font-normal text-slate-500 normal-case">Snapshot of analysis workspace</span>
             </h2>
             <div className="w-full border-2 border-slate-200 rounded p-2 bg-slate-50 flex justify-center items-center min-h-[200px]">
                {isCapturing && !diagramImage ? (
                   <div className="text-slate-400 italic flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin"></div> Generating High-Res Image...</div>
                ) : diagramImage ? (
                   <img src={diagramImage} alt="Risk Diagram" className="max-w-full h-auto object-contain max-h-[140mm]" />
                ) : (
                   <div className="text-red-400 italic">Diagram capture failed. Please try again.</div>
                )}
             </div>
          </section>

          <div className="grid grid-cols-2 gap-8">
            {/* 2. PURPOSE & SCOPE */}
            <section>
              <h2 className="text-sm font-bold uppercase border-b border-slate-300 mb-2 text-blue-900">2. Purpose & Scope</h2>
              <div className="text-xs text-slate-700 space-y-2 leading-relaxed" contentEditable>
                <p><strong>Objective:</strong> The primary objective of this Risk Assessment is to systematically identify, analyze, and evaluate potential hazards associated with <strong>{data?.hazard?.title || data?.name || data?.systemName || data?.initiatingEvent || 'the critical process node'}</strong> utilizing the {moduleName} methodology. It aims to determine if existing control measures are adequate to manage risks to a level that is As Low As Reasonably Practicable (ALARP).</p>
                <p><strong>Scope:</strong> The assessment boundaries encompass normal operations, potential process deviations, start-up, and shut-down phases. It specifically includes the equipment and tasks listed in the diagram above. External environmental impacts and security threats are excluded unless explicitly stated in the analysis.</p>
              </div>
            </section>

            {/* 3. LEGAL & STANDARDS */}
            <section>
              <h2 className="text-sm font-bold uppercase border-b border-slate-300 mb-2 text-blue-900">3. Legal & Standards</h2>
              <ul className="text-xs text-slate-700 list-disc pl-4 space-y-1" contentEditable>
                <li><strong>ISO 45001:2018:</strong> Occupational Health and Safety Management Systems.</li>
                <li><strong>OSHA 1910.119:</strong> Process Safety Management of Highly Hazardous Chemicals.</li>
                <li><strong>IEC 61511:</strong> Functional Safety - Safety Instrumented Systems for the Process Industry Sector.</li>
                <li><strong>Local Regulations:</strong> Factories Act compliance for pressure vessel integrity and hazardous substance handling.</li>
                <li><strong>Corporate Standard:</strong> HSE-STD-04 (Risk Assessment & Management).</li>
              </ul>
            </section>
          </div>

          {/* 4. METHODOLOGY */}
          <section className="mb-4">
             <h2 className="text-sm font-bold uppercase border-b border-slate-300 mb-2 text-blue-900">4. Methodology: {moduleName}</h2>
             <div className="text-xs text-slate-700 mb-2 space-y-2">
                <p>This assessment utilizes the <strong>{moduleName}</strong> technique, a structured method recognized globally for robust risk identification.</p>
                {moduleName === 'BowTie' && <p>The BowTie method visualizes the relationship between causes (threats), the top event (loss of control), and consequences. It explicitly focuses on the barriers (controls) preventing the event or mitigating its impact, assigning accountability to specific roles.</p>}
                {moduleName === 'HAZOP' && <p>The HAZOP study systematically examines the process using guidewords (e.g., MORE, LESS, NO) applied to parameters (Pressure, Flow) to identify deviations from design intent and their safety implications.</p>}
                {moduleName === 'LOPA' && <p>Layer of Protection Analysis (LOPA) is a semi-quantitative tool used to verify that the independent protection layers (IPLs) reduce the risk of a specific scenario to a tolerably low frequency (TMEL).</p>}
                {moduleName === 'QRA' && <p>Quantitative Risk Assessment (QRA) provides numerical estimates of risk (e.g., Potential Loss of Life) by combining failure frequency data with consequence modeling.</p>}
                <div className="flex gap-4 text-[10px] text-slate-500 bg-slate-50 p-2 rounded mt-2 border border-slate-200">
                   <span><strong>Risk Criteria:</strong> 5x5 Risk Matrix (Likelihood x Severity)</span>
                   <span><strong>Acceptance:</strong> Risks in the Red zone are Intolerable; Yellow zone requires ALARP demonstration.</span>
                </div>
             </div>
          </section>

          {/* 5. PROCESS DESCRIPTION */}
          <section className="mb-4">
             <h2 className="text-sm font-bold uppercase border-b border-slate-300 mb-2 text-blue-900">5. Task / Process Description</h2>
             <div className="text-xs text-slate-700 min-h-[40px] border border-dashed border-slate-300 p-2 rounded leading-relaxed" contentEditable>
                {data?.designIntent || data?.consequenceDescription 
                  ? <span>{data.designIntent || data.consequenceDescription}</span> 
                  : "The system under review involves the storage/handling/processing of hazardous materials within the facility. The process flow typically involves receipt, storage, transfer via pumps/compressors, and reaction/separation stages. Key process parameters include Pressure (BarG), Temperature (°C), and Flow Rate (kg/hr). The operational context includes manual intervention for start-up and automated control for steady-state operations."}
             </div>
          </section>

          {/* 6. HAZARD IDENTIFICATION */}
          <section className="mb-4">
             <h2 className="text-sm font-bold uppercase border-b border-slate-300 mb-2 text-blue-900">6. Hazard Identification & 7. Risk Evaluation</h2>
             <div className="overflow-x-auto">
               <table className="w-full text-xs text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-100 border-b border-slate-300">
                     <th className="p-2 font-bold w-8 text-slate-500">#</th>
                     <th className="p-2 font-bold w-1/3">Hazard / Deviation</th>
                     <th className="p-2 font-bold w-1/3">Potential Causes</th>
                     <th className="p-2 font-bold w-1/3">Consequences</th>
                   </tr>
                 </thead>
                 <tbody>
                   {hazards.slice(0, 10).map((h: any, i: number) => (
                     <tr key={i} className="border-b border-slate-200">
                       <td className="p-2 text-slate-500">{i+1}</td>
                       <td className="p-2 font-semibold text-slate-900">{h.name}</td>
                       <td className="p-2 text-slate-600">{h.cause || "Multiple potential root causes"}</td>
                       <td className="p-2 text-slate-600">{h.consequence || "Potential Safety/Asset Incident"}</td>
                     </tr>
                   ))}
                   {hazards.length === 0 && <tr><td colSpan={4} className="p-2 text-center text-slate-400">No specific hazards extracted from model data.</td></tr>}
                 </tbody>
               </table>
             </div>
          </section>

          {/* 8. CONTROLS */}
          <section className="mb-4">
             <h2 className="text-sm font-bold uppercase border-b border-slate-300 mb-2 text-blue-900">8. Control Measures (Hierarchy of Controls)</h2>
             <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                   <h3 className="text-xs font-bold text-slate-700 mb-2 border-b border-slate-300 pb-1">Engineering Controls (Hardware/Design)</h3>
                   <ul className="text-xs list-disc pl-4 text-slate-600 space-y-1">
                      {eng.length > 0 ? eng.slice(0, 8).map((c: string, i: number) => <li key={i}>{c}</li>) : <li className="text-slate-400 italic">No specific engineering controls listed. Standard relief systems assumed.</li>}
                   </ul>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                   <h3 className="text-xs font-bold text-slate-700 mb-2 border-b border-slate-300 pb-1">Administrative & Procedural Controls</h3>
                   <ul className="text-xs list-disc pl-4 text-slate-600 space-y-1">
                      {admin.length > 0 ? admin.slice(0, 8).map((c: string, i: number) => <li key={i}>{c}</li>) : <li className="text-slate-400 italic">Standard SOPs and Permit to Work apply.</li>}
                      <li>Permit to Work (PTW) System compliance.</li>
                      <li>Competency verification for all operators.</li>
                   </ul>
                </div>
             </div>
          </section>

          <div className="grid grid-cols-2 gap-8">
             {/* 9. RESIDUAL RISK */}
             <section>
                <h2 className="text-sm font-bold uppercase border-b border-slate-300 mb-2 text-blue-900">9. Residual Risk Assessment</h2>
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                   <div className="flex items-center gap-2 text-green-800 font-bold text-xs mb-2">
                      <CheckCircle size={14} /> Risk Reduced to ALARP
                   </div>
                   <p className="text-[10px] text-green-800 leading-relaxed text-justify">
                      With the rigorous implementation of the engineering and administrative controls detailed in Section 8, the residual risk is assessed to be within the 'Acceptable' or 'ALARP' region of the corporate risk matrix. No intolerable risks remain. Continued monitoring is required to maintain this status.
                   </p>
                </div>
             </section>

             {/* 10. ROLES */}
             <section>
                <h2 className="text-sm font-bold uppercase border-b border-slate-300 mb-2 text-blue-900">10. Roles & Competency</h2>
                <ul className="text-xs text-slate-700 space-y-1" contentEditable>
                   <li><strong>Operations Manager:</strong> Overall accountability for safety barrier integrity.</li>
                   <li><strong>Maintenance Supervisor:</strong> Execution of PM routines for all critical equipment (e.g., PSVs, pumps).</li>
                   <li><strong>Area Operator:</strong> Daily visual checks, readings logging, and immediate reporting of deviations.</li>
                   <li><strong>HSE Officer:</strong> Independent audit of permit compliance and toolbox talk quality.</li>
                </ul>
             </section>
          </div>

          <div className="grid grid-cols-2 gap-8">
             {/* 11. EMERGENCY */}
             <section>
                <h2 className="text-sm font-bold uppercase border-b border-slate-300 mb-2 text-blue-900">11. Emergency Situations</h2>
                <div className="text-xs text-slate-700 leading-relaxed" contentEditable>
                   <p className="mb-1">In the event of a failure of prevention barriers, the following emergency measures are activated:</p>
                   <ol className="list-decimal pl-4 space-y-1">
                      <li><strong>Activation:</strong> Trigger site siren upon confirmed Loss of Containment (LOC).</li>
                      <li><strong>Response:</strong> Emergency Response Team (ERT) to deploy to scene with SCBA and spill kits.</li>
                      <li><strong>Evacuation:</strong> Non-essential personnel to proceed to Assembly Point B via cross-wind route.</li>
                      <li><strong>Reference:</strong> See Site Emergency Response Plan (ERP-001) Section 4.2 "Chemical Release".</li>
                   </ol>
                </div>
             </section>

             {/* 12. MONITORING */}
             <section>
                <h2 className="text-sm font-bold uppercase border-b border-slate-300 mb-2 text-blue-900">12. Monitoring & Review</h2>
                <div className="text-xs text-slate-700 leading-relaxed" contentEditable>
                   <p className="mb-1">To ensure the ongoing effectiveness of the identified controls:</p>
                   <ul className="list-disc pl-4 space-y-1">
                      <li><strong>Daily:</strong> Operator rounds and visual inspections of safety-critical equipment.</li>
                      <li><strong>Monthly:</strong> Testing of alarms and interlocks as per the maintenance schedule (PM).</li>
                      <li><strong>Annual:</strong> Full review of this Risk Assessment or upon any significant Management of Change (MOC) or incident.</li>
                   </ul>
                </div>
             </section>
          </div>

          <div className="grid grid-cols-2 gap-8">
             {/* 13. COMMUNICATION */}
             <section>
                <h2 className="text-sm font-bold uppercase border-b border-slate-300 mb-2 text-blue-900">13. Communication</h2>
                <div className="text-xs text-slate-700" contentEditable>
                   Findings of this RA must be communicated to all affected personnel via Tool Box Talks (TBT) prior to task commencement. Sign-off sheets must be retained for audit purposes. Hazards must be communicated in local language where applicable.
                </div>
             </section>

             {/* 14. ENVIRONMENTAL */}
             <section>
                <h2 className="text-sm font-bold uppercase border-b border-slate-300 mb-2 text-blue-900">14. Environmental</h2>
                <div className="text-xs text-slate-700" contentEditable>
                   Zero discharge policy is in effect. All spills must be contained using secondary containment (bunds/drip trays). Hazardous waste generated (e.g., contaminated rags) must be disposed of via authorized contractors.
                </div>
             </section>
          </div>

          {/* 15. ATTACHMENTS */}
          <section className="mb-4">
             <h2 className="text-sm font-bold uppercase border-b border-slate-300 mb-2 text-blue-900">15. Attachments & Evidence</h2>
             <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 border rounded"><CheckCircle size={12} className="text-emerald-500"/> Risk Matrix (5x5)</span>
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 border rounded"><CheckCircle size={12} className="text-emerald-500"/> P&ID Markups (Rev 3)</span>
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 border rounded"><CheckCircle size={12} className="text-emerald-500"/> Material Safety Data Sheets (MSDS)</span>
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 border rounded"><CheckCircle size={12} className="text-emerald-500"/> TBT Attendance Sheet</span>
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 border rounded"><CheckCircle size={12} className="text-emerald-500"/> Equipment Inspection Certs</span>
             </div>
          </section>

          {/* 16. SIGN OFF */}
          <section className="mt-8 break-inside-avoid relative">
             <h2 className="text-sm font-bold uppercase border-b border-slate-300 mb-4 text-blue-900">16. Sign-off & Authorization</h2>
             <div className="grid grid-cols-3 gap-8">
                <div className="border-t border-slate-400 pt-2">
                   <div className="text-xs font-bold text-slate-700 mb-8">Lead Assessor</div>
                   <div className="text-[10px] text-slate-400">Signature / Date</div>
                </div>
                <div className="border-t border-slate-400 pt-2">
                   <div className="text-xs font-bold text-slate-700 mb-8">Area Authority / Supervisor</div>
                   <div className="text-[10px] text-slate-400">Signature / Date</div>
                </div>
                <div className="border-t border-slate-400 pt-2">
                   <div className="text-xs font-bold text-slate-700 mb-8">HSE Manager</div>
                   <div className="text-[10px] text-slate-400">Signature / Date</div>
                </div>
             </div>

             {/* SfL SEAL */}
             <div className="absolute -bottom-6 right-10 opacity-80 pointer-events-none mix-blend-multiply transform -rotate-12">
                <svg width="140" height="140" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <path id="sealPath" d="M 100, 100 m -70, 0 a 70,70 0 1,1 140,0 a 70,70 0 1,1 -140,0" />
                    </defs>
                    <circle cx="100" cy="100" r="90" fill="none" stroke="#b91c1c" strokeWidth="3" />
                    <circle cx="100" cy="100" r="84" fill="none" stroke="#b91c1c" strokeWidth="1" />
                    <text fill="#b91c1c" fontSize="16" fontWeight="bold" letterSpacing="1.5">
                        <textPath href="#sealPath" startOffset="50%" textAnchor="middle">
                            SAFETY FOR ALL • OFFICIAL SEAL •
                        </textPath>
                    </text>
                    <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" fill="#b91c1c" fontSize="22" fontWeight="900">APPROVED</text>
                    <text x="100" y="120" textAnchor="middle" fill="#b91c1c" fontSize="10" fontFamily="monospace">{new Date().toLocaleDateString()}</text>
                </svg>
             </div>
          </section>

          {/* FOOTER */}
          <div className="border-t-2 border-slate-800 pt-2 mt-10 flex justify-between text-[10px] text-slate-400">
             <div>Safety for All | World-Class Risk Management System</div>
             <div>Confidential | Page 1 of 1</div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReportModal;
