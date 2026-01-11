
export interface Hazard {
  code: string;
  title: string;
}

export type BarrierCategory = 
  | 'Safety Critical Equipment' 
  | 'Safety Critical Task' 
  | 'Procedural' 
  | 'Design' 
  | 'Asset Integrity' 
  | 'Training' 
  | 'Operations' 
  | 'Maintenance' 
  | 'Others';

export type Effectiveness = 'High' | 'Medium' | 'Low' | 'Poor' | 'Unrated';

export interface Barrier {
  id: string;
  label: string; // The main description
  category: BarrierCategory;
  owner?: string;
  performanceStandard?: string; // Criteria
  reliability?: string; // Status or Description of reliability
  verification?: string; // Testing
  escalation?: string; // Backup
  notes?: string;
  
  // New Effectiveness Properties
  effectiveness?: Effectiveness; // Overall rating
  adequacy?: string; // Assessment of adequacy for specific scenario
  reliabilityAssessment?: string; // Assessment of reliability (distinct from status)
}

export interface Threat {
  id?: string;
  name: string;
  barriers: Barrier[];
}

export interface Consequence {
  id?: string;
  name: string;
  barriers: Barrier[];
}

export interface BowTieData {
  hazard: Hazard;
  topEvent: string;
  threats: Threat[];
  consequences: Consequence[];
}

export interface FaultTreeNode {
  label: string;
  type: 'top' | 'intermediate' | 'basic';
  gate?: 'and' | 'or';
  children?: FaultTreeNode[];
}

export interface EventTreeNode {
  type: 'branch' | 'leaf';
  path?: string; // e.g., "Success", "Failure"
  probability?: number;
  outcome?: string; // Only for leaf
  node?: EventTreeNode; // Child node for branch
  children?: Array<{ path: string; probability: number; node: EventTreeNode }>;
}

export interface EventTreeData {
  initiatingEvent: string;
  pivotalEvents: string[];
  root: EventTreeNode;
}

// --- LOPA TYPES ---
export type LopaLayerType = 'BPCS' | 'Alarm' | 'SIS' | 'Relief' | 'Containment' | 'Emergency' | 'Other';

export interface IPL {
  name: string;
  pfd: number; // Probability of Failure on Demand (e.g., 0.1, 0.01)
  layerType?: LopaLayerType; // For Onion Diagram mapping
}

export interface LopaScenario {
  id: string;
  initiatingEvent: string;
  frequency: number; // Events per year
  consequenceDescription: string;
  targetFrequency: number; // TMEL (Target Mitigated Event Likelihood)
  ipls: IPL[];
  mitigatedFrequency: number; // Calculated
  riskGap: number; // Calculated (Mitigated / Target)
}

// --- QRA TYPES ---
export interface QraScenario {
  id: string;
  name: string;
  frequency: number; // per year
  fatalities: number; // N
  assetDamage?: number; // USD
}

export interface QraData {
  facilityType: string;
  scenarios: QraScenario[];
  totalPLL: number; // Potential Loss of Life
}

// --- HAZOP TYPES ---
export interface RiskScore {
  s: number; // Severity 1-5
  f: number; // Frequency 1-5
  rr: string; // Risk Rating (e.g. "High", "Low")
  color: string; // hex code
}

export interface HazopRow {
  id: string;
  deviation: string;
  cause: string;
  consequence: string;
  
  // Risk Before
  riskBefore: RiskScore;
  
  // Safeguards
  safeguardsInstrumental: string; // e.g. "LSH-101 trips pump"
  safeguardsOther: string; // e.g. "SOP for draining"
  
  // Risk After
  riskAfter: RiskScore;
  
  recommendations: string;
  responsibility: string;
  status: 'Open' | 'Closed';
}

export interface HazopNode {
  id: string;
  name: string; // e.g. "Node 1: Feed Tank T-001"
  designIntent: string; // e.g. "Store liquid at ambient temp"
  rows: HazopRow[];
}

// --- FMEA TYPES ---
export interface FmeaRow {
  id: string;
  processStep: string; // Item or Process Step
  failureMode: string; // Potential Failure Mode
  failureEffect: string; // Potential Effect of Failure
  severity: number; // S (1-10)
  cause: string; // Potential Cause
  occurrence: number; // O (1-10)
  controls: string; // Current Process Controls
  detection: number; // D (1-10)
  rpn: number; // Risk Priority Number (S*O*D)
  actions: string; // Recommended Actions
  responsibility: string; // Responsibility & Target Date
}

export interface FmeaSystem {
  id: string;
  systemName: string;
  rows: FmeaRow[];
}

// --- CASE STUDY WRAPPER ---
export interface CaseStudyWrapper<T> {
  title: string;
  summary: string;
  data: T;
  report: string; // Markdown or HTML string
}
