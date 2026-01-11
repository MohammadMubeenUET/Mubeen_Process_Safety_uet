
import { BowTieData, FaultTreeNode, EventTreeData, LopaScenario, QraData, HazopNode, CaseStudyWrapper } from "../types";

// --- BOWTIE CASE STUDIES ---
export const BOWTIE_CASES: Record<string, CaseStudyWrapper<BowTieData>> = {
  "Bhopal Gas Tragedy (1984)": {
    title: "Bhopal Gas Tragedy (Detailed Forensic Model)",
    summary: "A comprehensive, high-density forensic reconstruction of the 1984 Union Carbide disaster. This diagram maps 8 distinct threat lines and 8 consequence pathways with over 100 specific barriers, detailing the systemic failure of safety management systems.",
    report: `
### Incident Forensic Overview
On the night of December 2-3, 1984, water entered Tank 610 containing 42 tons of Methyl Isocyanate (MIC) at the Union Carbide India Limited (UCIL) pesticide plant. The resulting exothermic reaction caused a rapid pressure rise, lifting the safety valve and releasing approximately 40 tons of toxic gas into the atmosphere.

### Systemic Failures
This analysis visualizes the "Swiss Cheese Model" in extreme detail. It highlights:
1.  **Cost-Cutting Measures:** Refrigeration units turned off, staffing reduced, and maintenance deferred.
2.  **Design Flaws:** Carbon steel pipes (rust source), undersized scrubbers, and lack of automated safety trips.
3.  **Operational Negligence:** Missing slip-blinds, ignored alarms, and failure to communicate critical plant status (flare disconnected).

### Key Statistics in Model
- **Threats:** 8 unique pathways leading to the runaway reaction.
- **Consequences:** 8 cascading outcomes from equipment failure to mass casualties.
- **Barriers:** Over 90 individual protection layers mapped, with >90% in a failed or degraded state.
    `,
    data: {
      hazard: { code: "UCIL-610", title: "42 Tons of Methyl Isocyanate (MIC)" },
      topEvent: "Runaway Exothermic Reaction (T > 200°C, P > 180psi)",
      threats: [
        // THREAT 1: WATER WASHING
        {
             name: "Water Ingress via RV Vent Header",
             barriers: [
                 { id: "t1_1", label: "Slip-blind Installation (Process Isolation)", category: "Maintenance", owner: "Maintenance Dept", reliability: "Failed (Not Installed)", performanceStandard: "Positive isolation before washing", effectiveness: "Poor" },
                 { id: "t1_2", label: "Master Card / Permit to Work", category: "Procedural", owner: "Production Sup", reliability: "Failed (Not Issued)", effectiveness: "Poor" },
                 { id: "t1_3", label: "Isolation Valve (Gate Valve) Integrity", category: "Asset Integrity", owner: "Maintenance", reliability: "Failed (Leaking)", performanceStandard: "Zero leak rate", effectiveness: "Poor" },
                 { id: "t1_4", label: "Bleeder Valve Open Check", category: "Operations", owner: "Operator", reliability: "Failed (Clogged)", performanceStandard: "Visual verification of flow", effectiveness: "Low" },
                 { id: "t1_5", label: "Supervisor Oversight", category: "Safety Critical Task", owner: "Supervisor", reliability: "Failed (Position cut)", effectiveness: "Poor" },
                 { id: "t1_6", label: "Operator Training on SOPs", category: "Training", owner: "HR", reliability: "Failed (Untrained Staff)", effectiveness: "Low" }
             ]
        },
        // THREAT 2: REFRIGERATION
        {
             name: "Thermal Instability (Refrigeration Shutdown)",
             barriers: [
                 { id: "t2_1", label: "30-Ton Freon Refrigeration Unit", category: "Safety Critical Equipment", owner: "Utilities", reliability: "Failed (Switched Off)", performanceStandard: "Keep MIC < 5°C", effectiveness: "Poor" },
                 { id: "t2_2", label: "High Temperature Alarm (TIC-610)", category: "Safety Critical Equipment", owner: "Control Room", reliability: "Failed (Reset/Ignored)", performanceStandard: "Alarm at 11°C", effectiveness: "Low" },
                 { id: "t2_3", label: "Logbook Monitoring", category: "Safety Critical Task", owner: "Control Room", reliability: "Failed (False entries)", effectiveness: "Low" },
                 { id: "t2_4", label: "Management of Change (MOC)", category: "Procedural", owner: "Plant Manager", reliability: "Failed (Cost cutting decision)", effectiveness: "Poor" },
                 { id: "t2_5", label: "Redundant Cooling Loop", category: "Design", owner: "Engineering", reliability: "Missing", effectiveness: "Poor" },
                 { id: "t2_6", label: "Shift Handover Communication", category: "Operations", owner: "Supervisor", reliability: "Failed", effectiveness: "Low" }
             ]
        },
        // THREAT 3: CONTAMINATION
        {
             name: "Metallic Contamination (Iron/Rust)",
             barriers: [
                 { id: "t3_1", label: "Stainless Steel Piping Spec", category: "Design", owner: "Engineering", reliability: "Failed (Carbon Steel used)", performanceStandard: "Corrosion resistance", effectiveness: "Poor" },
                 { id: "t3_2", label: "Nitrogen Padding (Positive Pressure)", category: "Operations", owner: "Utilities", reliability: "Failed (Leaking/Unable to pressurize)", performanceStandard: "Maintain 1kg/cm2", effectiveness: "Low" },
                 { id: "t3_3", label: "Regular Quality Sampling", category: "Safety Critical Task", owner: "Lab", reliability: "Failed (Frequency reduced)", effectiveness: "Low" },
                 { id: "t3_4", label: "In-line Filters / Strainers", category: "Safety Critical Equipment", owner: "Maintenance", reliability: "Failed (Clogged/Removed)", effectiveness: "Poor" },
                 { id: "t3_5", label: "Corrosion Coupon Monitoring", category: "Asset Integrity", owner: "Inspection", reliability: "Failed", effectiveness: "Low" },
                 { id: "t3_6", label: "Passivation of Lines", category: "Maintenance", owner: "Maintenance", reliability: "Failed", effectiveness: "Low" }
             ]
        },
        // THREAT 4: INVENTORY
        {
             name: "Tank Overfilling / High Inventory",
             barriers: [
                 { id: "t4_1", label: "Maximum Inventory Limit (50%)", category: "Procedural", owner: "Plant Manager", reliability: "Failed (Tank at 87%)", performanceStandard: "Leave void space for reaction", effectiveness: "Poor" },
                 { id: "t4_2", label: "Level Indicator (LIA-610)", category: "Safety Critical Equipment", owner: "Instrumentation", reliability: "Failed (Malfunctioned)", effectiveness: "Low" },
                 { id: "t4_3", label: "High Level Alarm (LACH)", category: "Safety Critical Equipment", owner: "Control Room", reliability: "Failed", effectiveness: "Low" },
                 { id: "t4_4", label: "Inventory Transfer SOP", category: "Operations", owner: "Operator", reliability: "Failed", effectiveness: "Low" },
                 { id: "t4_5", label: "Production Planning Limits", category: "Procedural", owner: "Planning", reliability: "Failed (Excess production)", effectiveness: "Poor" },
                 { id: "t4_6", label: "Emergency Dump Tank (Empty)", category: "Design", owner: "Operations", reliability: "Failed (Tank 619 contained MIC)", effectiveness: "Poor" }
             ]
        },
        // THREAT 5: DESIGN
        {
            name: "Jumper Line Connectivity (Process Design)",
            barriers: [
                { id: "t5_1", label: "Management of Change (MOC)", category: "Procedural", owner: "Engineering", reliability: "Failed (Jumper installed w/o review)", effectiveness: "Poor" },
                { id: "t5_2", label: "HAZOP Review of Mods", category: "Design", owner: "Safety Dept", reliability: "Failed (Risk not identified)", effectiveness: "Poor" },
                { id: "t5_3", label: "Piping & ID Diagrams (P&ID)", category: "Design", owner: "Engineering", reliability: "Outdated", effectiveness: "Low" },
                { id: "t5_4", label: "Physical Segregation", category: "Design", owner: "Engineering", reliability: "Failed", effectiveness: "Low" },
                { id: "t5_5", label: "Valve Lock-Open/Closed Status", category: "Operations", owner: "Operator", reliability: "Failed", effectiveness: "Low" },
                { id: "t5_6", label: "Audit / Safety Review", category: "Safety Critical Task", owner: "Corporate HSE", reliability: "Failed (1982 audit ignored)", effectiveness: "Poor" }
            ]
        },
        // THREAT 6: MAINTENANCE
        {
            name: "Deferred Maintenance & Backlog",
            barriers: [
                { id: "t6_1", label: "Preventive Maintenance Schedule", category: "Maintenance", owner: "Maintenance Mgr", reliability: "Failed (Backlog)", effectiveness: "Poor" },
                { id: "t6_2", label: "Spare Parts Availability", category: "Maintenance", owner: "Procurement", reliability: "Failed (Cost cutting)", effectiveness: "Low" },
                { id: "t6_3", label: "Skilled Workforce Retention", category: "Training", owner: "HR", reliability: "Failed (Staff reductions)", effectiveness: "Poor" },
                { id: "t6_4", label: "Work Order Prioritization", category: "Procedural", owner: "Planning", reliability: "Failed", effectiveness: "Low" },
                { id: "t6_5", label: "Equipment Criticality Assessment", category: "Asset Integrity", owner: "Reliability Eng", reliability: "Failed", effectiveness: "Low" },
                { id: "t6_6", label: "Third Party Inspection", category: "Others", owner: "Govt Inspector", reliability: "Ineffective", effectiveness: "Poor" }
            ]
        },
        // THREAT 7: CHEMICAL IMPURITIES
        {
            name: "Chloroform / Impurity Introduction",
            barriers: [
                { id: "t7_1", label: "Distillation Column Efficiency", category: "Safety Critical Equipment", owner: "Operations", reliability: "Failed (Higher Chloroform)", effectiveness: "Low" },
                { id: "t7_2", label: "Lab Analysis of Feed", category: "Safety Critical Task", owner: "Lab", reliability: "Failed", effectiveness: "Low" },
                { id: "t7_3", label: "Feed Spec Compliance", category: "Procedural", owner: "Process Eng", reliability: "Failed", effectiveness: "Low" },
                { id: "t7_4", label: "Reaction Inhibitor Dosing", category: "Operations", owner: "Production", reliability: "Not Practiced", effectiveness: "Low" },
                { id: "t7_5", label: "Storage Time Limits", category: "Procedural", owner: "Logistics", reliability: "Exceeded", effectiveness: "Low" },
                { id: "t7_6", label: "Tank Cleaning Schedule", category: "Maintenance", owner: "Maintenance", reliability: "Skipped", effectiveness: "Low" }
            ]
        },
        // THREAT 8: HUMAN ERROR
        {
            name: "Operator Error / Misdiagnosis",
            barriers: [
                { id: "t8_1", label: "Competency Assurance", category: "Training", owner: "Training Dept", reliability: "Failed (Reduced training)", effectiveness: "Poor" },
                { id: "t8_2", label: "Manning Levels", category: "Operations", owner: "HR", reliability: "Failed (Understaffed)", effectiveness: "Poor" },
                { id: "t8_3", label: "SOP Clarity / Language", category: "Procedural", owner: "Tech Writer", reliability: "English only (Lang Barrier)", effectiveness: "Low" },
                { id: "t8_4", label: "Fatigue Management", category: "Operations", owner: "Supervisor", reliability: "Unknown", effectiveness: "Unrated" },
                { id: "t8_5", label: "Control Room Ergonomics", category: "Design", owner: "Engineering", reliability: "Poor (Old panels)", effectiveness: "Low" },
                { id: "t8_6", label: "Emergency Drills", category: "Training", owner: "Safety Dept", reliability: "Rarely conducted", effectiveness: "Low" }
            ]
        }
      ],
      consequences: [
        // Cons 1: SCRUBBER
        {
             name: "Release to Vent Gas Scrubber (VGS)",
             barriers: [
                 { id: "c1_1", label: "Safety Relief Valve (SRV) Lift", category: "Safety Critical Equipment", owner: "Design", reliability: "Active", performanceStandard: "Protect tank integrity", effectiveness: "High" },
                 { id: "c1_2", label: "Caustic Circulation Pump", category: "Safety Critical Equipment", owner: "Operations", reliability: "Failed (Standby Mode)", performanceStandard: "Active neutralization", effectiveness: "Poor" },
                 { id: "c1_3", label: "Scrubber Temperature Monitor", category: "Safety Critical Equipment", owner: "Control Room", reliability: "Failed", effectiveness: "Low" },
                 { id: "c1_4", label: "Caustic Concentration Check", category: "Safety Critical Task", owner: "Lab", reliability: "Unknown", effectiveness: "Low" },
                 { id: "c1_5", label: "Scrubber Design Capacity", category: "Design", owner: "Engineering", reliability: "Failed (Undersized)", effectiveness: "Poor" },
                 { id: "c1_6", label: "Auto-Start Logic", category: "Design", owner: "Instrumentation", reliability: "Missing (Manual start only)", effectiveness: "Poor" }
             ]
        },
        // Cons 2: FLARE
        {
             name: "Release to Flare Tower",
             barriers: [
                 { id: "c2_1", label: "Flare Header Continuity", category: "Asset Integrity", owner: "Maintenance", reliability: "Failed (Pipe removed)", performanceStandard: "Path to flare", effectiveness: "Poor" },
                 { id: "c2_2", label: "Pilot Flame Verification", category: "Safety Critical Task", owner: "Utilities", reliability: "Unknown", effectiveness: "Unrated" },
                 { id: "c2_3", label: "Maintenance Planning", category: "Procedural", owner: "Maintenance", reliability: "Failed (Flare down for weeks)", effectiveness: "Poor" },
                 { id: "c2_4", label: "Knock-out Drum Level", category: "Operations", owner: "Operator", reliability: "Unknown", effectiveness: "Unrated" },
                 { id: "c2_5", label: "Flare Capacity / Height", category: "Design", owner: "Engineering", reliability: "Undersized for massive release", effectiveness: "Low" },
                 { id: "c2_6", label: "Isolation Valve Status", category: "Operations", owner: "Operator", reliability: "Closed", effectiveness: "Poor" }
             ]
        },
        // Cons 3: ATMOSPHERE
        {
             name: "Direct Atmospheric Venting",
             barriers: [
                 { id: "c3_1", label: "Stack Height Dispersion", category: "Design", owner: "Engineering", reliability: "Ineffective (33m height)", effectiveness: "Low" },
                 { id: "c3_2", label: "Water Spray / Monitors", category: "Safety Critical Equipment", owner: "Fire Dept", reliability: "Failed (Insufficient Pressure/Height)", performanceStandard: "Knock down gas", effectiveness: "Poor" },
                 { id: "c3_3", label: "Fire Water Pump Availability", category: "Safety Critical Equipment", owner: "Utilities", reliability: "Active", effectiveness: "Medium" },
                 { id: "c3_4", label: "Spray Nozzle Coverage", category: "Design", owner: "Fire Dept", reliability: "Failed (Reach 15m vs 33m stack)", effectiveness: "Poor" },
                 { id: "c3_5", label: "Wind Socks / Indicators", category: "Operations", owner: "Safety", reliability: "Present", effectiveness: "Low" },
                 { id: "c3_6", label: "Gas Detection Alarms (Area)", category: "Safety Critical Equipment", owner: "Control Room", reliability: "Failed/Ignored", effectiveness: "Low" }
             ]
        },
        // Cons 4: DISPERSION
        {
             name: "Dense Gas Cloud Dispersion",
             barriers: [
                 { id: "c4_1", label: "Wind Direction Monitoring", category: "Operations", owner: "Control Room", reliability: "Failed", effectiveness: "Low" },
                 { id: "c4_2", label: "Buffer Zone / Land Use", category: "Design", owner: "Govt Planning", reliability: "Failed (Slums nearby)", effectiveness: "Poor" },
                 { id: "c4_3", label: "Meteorological Conditions", category: "Others", owner: "Nature", reliability: "Adverse (Inversion layer)", effectiveness: "Poor" },
                 { id: "c4_4", label: "Plant Layout", category: "Design", owner: "Engineering", reliability: "Proximity to population", effectiveness: "Poor" },
                 { id: "c4_5", label: "Gas Modeling / Prediction", category: "Procedural", owner: "Safety", reliability: "None", effectiveness: "Poor" },
                 { id: "c4_6", label: "Perimeter Monitoring", category: "Operations", owner: "Security", reliability: "Failed", effectiveness: "Low" }
             ]
        },
        // Cons 5: PUBLIC WARNING
        {
             name: "Community Infiltration & Exposure",
             barriers: [
                 { id: "c5_1", label: "Plant Siren System (Loud)", category: "Safety Critical Equipment", owner: "Plant Mgr", reliability: "Failed (Muted)", performanceStandard: "Warn public", effectiveness: "Poor" },
                 { id: "c5_2", label: "Emergency Communication with Police", category: "Procedural", owner: "Security", reliability: "Delayed", effectiveness: "Low" },
                 { id: "c5_3", label: "Public Awareness Training", category: "Training", owner: "Community Relations", reliability: "None", effectiveness: "Poor" },
                 { id: "c5_4", label: "Evacuation Routes", category: "Design", owner: "Govt", reliability: "Congested/Unknown", effectiveness: "Poor" },
                 { id: "c5_5", label: "Shelter-in-Place Protocol", category: "Procedural", owner: "Public", reliability: "Unknown/Panic", effectiveness: "Poor" },
                 { id: "c5_6", label: "Siren Activation Policy", category: "Procedural", owner: "Plant Manager", reliability: "Failed (Policy to mute)", effectiveness: "Poor" }
             ]
        },
        // Cons 6: ACUTE HEALTH
        {
             name: "Acute Health Effects (Fatalities)",
             barriers: [
                 { id: "c6_1", label: "Disclosure of Chemical Info", category: "Procedural", owner: "UCIL Mgmt", reliability: "Failed (Secret)", performanceStandard: "Inform Hospitals", effectiveness: "Poor" },
                 { id: "c6_2", label: "Medical Antidote (Sodium Thiosulfate)", category: "Others", owner: "Hospitals", reliability: "Unavailable", effectiveness: "Poor" },
                 { id: "c6_3", label: "Hospital Capacity", category: "Others", owner: "Govt Health", reliability: "Overwhelmed", effectiveness: "Poor" },
                 { id: "c6_4", label: "Medical Staff Training (Toxicology)", category: "Training", owner: "Hospitals", reliability: "None", effectiveness: "Poor" },
                 { id: "c6_5", label: "PPE for Responders", category: "Safety Critical Equipment", owner: "Police/Fire", reliability: "None", effectiveness: "Poor" },
                 { id: "c6_6", label: "Triage Protocols", category: "Procedural", owner: "Hospitals", reliability: "Failed", effectiveness: "Low" }
             ]
        },
        // Cons 7: ENVIRONMENT
        {
             name: "Long-term Environmental Damage",
             barriers: [
                 { id: "c7_1", label: "Site Remediation Plan", category: "Procedural", owner: "UCIL/Govt", reliability: "Delayed (Decades)", effectiveness: "Poor" },
                 { id: "c7_2", label: "Groundwater Protection", category: "Design", owner: "Engineering", reliability: "Failed (Leaching)", effectiveness: "Poor" },
                 { id: "c7_3", label: "Soil Containment", category: "Asset Integrity", owner: "Maintenance", reliability: "Failed", effectiveness: "Low" },
                 { id: "c7_4", label: "Waste Disposal Protocols", category: "Procedural", owner: "Operations", reliability: "Failed (On-site dumping)", effectiveness: "Poor" },
                 { id: "c7_5", label: "Environmental Monitoring", category: "Safety Critical Task", owner: "Govt EPA", reliability: "Intermittent", effectiveness: "Low" },
                 { id: "c7_6", label: "Corporate Liability Fund", category: "Others", owner: "Legal", reliability: "Inadequate", effectiveness: "Poor" }
             ]
        },
        // Cons 8: EMERGENCY RESPONSE
        {
             name: "Emergency Response Collapse",
             barriers: [
                 { id: "c8_1", label: "Crisis Management Team", category: "Procedural", owner: "Plant Mgr", reliability: "Fled/Failed", effectiveness: "Poor" },
                 { id: "c8_2", label: "District Emergency Plan", category: "Procedural", owner: "District Collector", reliability: "Not Activated", effectiveness: "Poor" },
                 { id: "c8_3", label: "Communication Hotlines", category: "Safety Critical Equipment", owner: "Admin", reliability: "Cut/Dead", effectiveness: "Poor" },
                 { id: "c8_4", label: "Transport for Evacuation", category: "Others", owner: "Public Transport", reliability: "Unavailable", effectiveness: "Poor" },
                 { id: "c8_5", label: "Mutual Aid Scheme", category: "Procedural", owner: "Industry Assn", reliability: "Failed", effectiveness: "Low" },
                 { id: "c8_6", label: "Press/Media Communication", category: "Procedural", owner: "PR Dept", reliability: "Failed (Misinformation)", effectiveness: "Poor" }
             ]
        }
      ]
    }
  },
  "Piper Alpha (1988)": {
    title: "Piper Alpha Disaster",
    summary: "The world's deadliest offshore oil rig accident caused by a condensate leak and subsequent explosions.",
    report: `
### Incident Overview
On July 6, 1988, the Piper Alpha offshore oil platform in the North Sea was destroyed by a series of massive explosions and fires, resulting in the loss of 167 lives. It remains the deadliest offshore oil disaster in history.

### Root Causes
1. **Permit to Work System Failure:** A safety valve (PSV) on Condensate Pump A was removed for maintenance. The blind flange fitted in its place was not leak-tight. The paperwork was not cross-referenced, leading night shift operators to start the pump.
2. **Design Failures:** The firewalls were designed to withstand fire but not explosions. The control room was destroyed instantly.
3. **Deluge System Failure:** The water deluge system was left in manual mode to prevent saltwater corrosion of pipes, meaning it did not activate when the fire started.

### Key Lessons
- **Permit to Work:** Robust communication between shifts and disciplines is vital.
- **Management of Change:** Modifications to safety systems (like deluge mode) must be risk-assessed.
- **Safety Culture:** Production pressure should never override safety protocols.
    `,
    data: {
      hazard: { code: "CS-001", title: "Hydrocarbon Processing (Condensate)" },
      topEvent: "Loss of Containment (Condensate Leak)",
      threats: [
        {
          name: "Start-up of Pump A (Under Maintenance)",
          barriers: [
            { id: "b1", label: "Permit to Work System", category: "Procedural", owner: "OIM", reliability: "Failed (Paperwork Lost)", performanceStandard: "Cross-referencing of active permits" },
            { id: "b2", label: "Lock-out / Tag-out", category: "Safety Critical Task", owner: "Lead Operator", reliability: "Failed", performanceStandard: "Physical isolation of breaker" },
            { id: "b3", label: "Shift Handover Log", category: "Training", owner: "Supervisor", reliability: "Failed", performanceStandard: "Explicit mention of PSV removal" }
          ]
        },
        {
          name: "Blind Flange Failure (Not Leak Tight)",
          barriers: [
            { id: "b4", label: "Competency of Fitter", category: "Training", owner: "HR", reliability: "Uncertain" },
            { id: "b5", label: "Torque Verification", category: "Maintenance", owner: "Fitter", reliability: "Low", performanceStandard: "Torque wrench calibration" },
            { id: "b6", label: "Leak Testing", category: "Operations", owner: "Supervisor", reliability: "Skipped", performanceStandard: "N2 pressure test" }
          ]
        },
        {
          name: "External Impact (Dropped Object)",
          barriers: [
            { id: "b7", label: "Lifting Plan", category: "Procedural", owner: "Deck Crew" },
            { id: "b8", label: "Crane Operator Competence", category: "Training", owner: "Training Dept" }
          ]
        }
      ],
      consequences: [
        {
          name: "Initial Explosion (Condensate Cloud)",
          barriers: [
            { id: "c1", label: "Gas Detection System", category: "Safety Critical Equipment", owner: "Control Room", reliability: "Active", performanceStandard: "Detect >20% LEL" },
            { id: "c2", label: "ESD Valve Closure", category: "Safety Critical Equipment", owner: "Safety Sys", reliability: "Unknown" }
          ]
        },
        {
          name: "Escalation to Full Fire (Deluge Fail)",
          barriers: [
            { id: "c3", label: "Fire Water Deluge", category: "Safety Critical Equipment", owner: "Safety Sys", reliability: "Failed (In Manual)", performanceStandard: "Auto-activate on confirmed fire" },
            { id: "c4", label: "Firewalls (Explosion Rating)", category: "Design", owner: "Structural Eng", reliability: "Failed", performanceStandard: "Withstand 0.3 bar overpressure" }
          ]
        },
        {
          name: "Riser Rupture (Total Loss)",
          barriers: [
            { id: "c5", label: "Subsea Isolation Valves (SSIV)", category: "Design", owner: "Pipeline Group", reliability: "Not Installed", performanceStandard: "Isolate inventory" },
            { id: "c6", label: "Evacuation (Lifeboats)", category: "Operations", owner: "OIM", reliability: "Failed (Smoke)" }
          ]
        }
      ]
    }
  },
  "Deepwater Horizon (2010)": {
    title: "Deepwater Horizon Blowout",
    summary: "A catastrophic well blowout leading to the largest marine oil spill in history.",
    report: `
### Incident Overview
On April 20, 2010, the Deepwater Horizon drilling rig exploded in the Gulf of Mexico. High-pressure methane gas from the well expanded into the drilling riser and rose into the drilling rig, where it ignited and exploded.

### Root Causes
1. **Cement Barrier Failure:** The cement slurry used to seal the bottom of the well failed to contain formation fluids.
2. **Interpretation of Negative Pressure Test:** The crew misinterpreted the negative pressure test, accepting a "bladder effect" explanation rather than acknowledging the well was flowing.
3. **Blowout Preventer (BOP) Failure:** The BOP's blind shear rams failed to seal the well pipe, preventing emergency isolation.

### Key Lessons
- **Process Safety Metrics:** Focus on leading indicators (test results) rather than just personal safety (slips/trips).
- **Stop Work Authority:** Crews must feel empowered to stop operations when indicators are confusing.
- **Contractor Oversight:** Effective bridging documents and oversight between operator (BP) and contractor (Transocean) are critical.
    `,
    data: {
      hazard: { code: "CS-002", title: "Deepwater Drilling (Macondo Well)" },
      topEvent: "Loss of Well Control (Kick)",
      threats: [
        {
          name: "Cement Slurry Failure (Instability)",
          barriers: [
            { id: "b1", label: "Cement Lab Testing", category: "Design", owner: "Halliburton", reliability: "Failed" },
            { id: "b2", label: "Centralizers usage", category: "Design", owner: "Drilling Eng", reliability: "Compromised (Too few)" },
            { id: "b3", label: "Cement Bond Log", category: "Safety Critical Task", owner: "Drilling Team", reliability: "Skipped (Cost)" }
          ]
        },
        {
          name: "Hydrocarbon Influx (Swabbing)",
          barriers: [
            { id: "b4", label: "Trip Margin / Mud Weight", category: "Procedural", owner: "Mud Engineer" },
            { id: "b5", label: "Trip Tank Monitoring", category: "Operations", owner: "Driller", reliability: "Failed" }
          ]
        },
        {
          name: "Misinterpretation of Negative Test",
          barriers: [
            { id: "b6", label: "Test Acceptance Criteria", category: "Procedural", owner: "Company Man", reliability: "Failed" },
            { id: "b7", label: "Stop Work Authority", category: "Training", owner: "All Crew", reliability: "Not Exercised" }
          ]
        }
      ],
      consequences: [
        {
          name: "Gas in Riser (Unloading)",
          barriers: [
            { id: "c1", label: "Mud Gas Separator", category: "Safety Critical Equipment", owner: "Drilling", reliability: "Overwhelmed" },
            { id: "c2", label: "Diverter System", category: "Safety Critical Equipment", owner: "Drilling", reliability: "Failed (Gas on deck)" }
          ]
        },
        {
          name: "Ignition & Explosion",
          barriers: [
            { id: "c3", label: "Gas Detection / Auto-Shutdown", category: "Safety Critical Equipment", owner: "Marine Crew", reliability: "Failed (Engine Runaway)" },
            { id: "c4", label: "Blast Walls", category: "Design", owner: "Naval Architect" }
          ]
        },
        {
          name: "Uncontrolled Release (Oil Spill)",
          barriers: [
            { id: "c5", label: "Blowout Preventer (BOP)", category: "Safety Critical Equipment", owner: "Subsea Eng", reliability: "Failed (Shear Rams)" },
            { id: "c6", label: "EDP (Emergency Disconnect)", category: "Safety Critical Task", owner: "Captain", reliability: "Failed" }
          ]
        }
      ]
    }
  }
};

// --- FAULT TREE CASE STUDIES ---
export const FTA_CASES: Record<string, CaseStudyWrapper<FaultTreeNode>> = {
  "Bhopal Gas Tragedy (1984)": {
    title: "Bhopal Fault Tree Analysis (Detailed)",
    summary: "Complex deductive logic model of the Bhopal disaster, tracing the failure from the top event down to basic mechanical and human failures.",
    report: `
### Fault Tree Logic
The Top Event (Toxic Release) requires two main branches to occur simultaneously:
1.  **Loss of Containment (LOC):** Driven by the runaway reaction in Tank 610.
2.  **Failure of Protection Layers:** The simultaneous failure of the VGS, Flare, and Water Spray systems allowed the gas to reach the community.

This detailed tree breaks down the "Runaway Reaction" into its root causes: Water Ingress (washing operations) and Contamination (rust). It also details *why* the protection layers failed (e.g., maintenance errors, standby modes).
    `,
    data: {
      label: "Catastrophic Exposure of Population to MIC",
      type: "top",
      gate: "and",
      children: [
        {
           label: "Massive Release of MIC Vapor",
           type: "intermediate",
           gate: "and",
           children: [
              { label: "Large MIC Inventory (42 Tons)", type: "basic" },
              {
                 label: "Runaway Exothermic Reaction",
                 type: "intermediate",
                 gate: "and",
                 children: [
                    {
                       label: "Initiating Contamination",
                       type: "intermediate",
                       gate: "or",
                       children: [
                          {
                             label: "Water Ingress (Line Washing)",
                             type: "intermediate",
                             gate: "and",
                             children: [
                                { label: "Relief Line Washing Ops", type: "basic" },
                                { label: "Slip-Blind Not Installed", type: "basic" },
                                { label: "Isolation Valves Leaking", type: "basic" }
                             ]
                          },
                          { label: "Iron/Rust Contamination", type: "basic" }
                       ]
                    },
                    {
                       label: "Accelerating Factors",
                       type: "intermediate",
                       gate: "or",
                       children: [
                          { label: "Refrigeration Unit OFF", type: "basic" },
                          { label: "High Ambient Temperature", type: "basic" },
                          { label: "Tank Overfilled (>80%)", type: "basic" }
                       ]
                    }
                 ]
              }
           ]
        },
        {
           label: "Failure of Mitigation / Protection Layers",
           type: "intermediate",
           gate: "and",
           children: [
              {
                 label: "Vent Gas Scrubber Failure",
                 type: "intermediate",
                 gate: "or",
                 children: [
                    { label: "Pump in Standby (Not Auto)", type: "basic" },
                    { label: "Caustic Soda Depleted", type: "basic" },
                    { label: "Flow Meter Malfunction", type: "basic" }
                 ]
              },
              {
                 label: "Flare Tower Unavailable",
                 type: "intermediate",
                 gate: "or",
                 children: [
                    { label: "Maintenance in Progress", type: "basic" },
                    { label: "Jumper Line Removed", type: "basic" }
                 ]
              },
              {
                 label: "Water Spray Failure",
                 type: "intermediate",
                 gate: "or",
                 children: [
                    { label: "Insufficient Pressure", type: "basic" },
                    { label: "Spray Height < Release Height", type: "basic" }
                 ]
              }
           ]
        },
        {
           label: "Failure of Emergency Response",
           type: "intermediate",
           gate: "and",
           children: [
              { label: "Public Siren Muted", type: "basic" },
              { label: "Delayed Police Notification", type: "basic" },
              { label: "No Evacuation Plan", type: "basic" }
           ]
        }
      ]
    }
  },
  "Titanic Sinking (Detailed)": {
    title: "Sinking of the RMS Titanic",
    summary: "A deductive analysis of the factors leading to the sinking of the Titanic on April 15, 1912.",
    report: `
### Incident Overview
The RMS Titanic sank in the North Atlantic Ocean after colliding with an iceberg during her maiden voyage. More than 1,500 people died.

### Logic Analysis
The Top Event "Loss of Vessel" required "Excessive Water Ingress" AND "Containment Failure".
1. **Ingress:** Caused by the iceberg collision, which was facilitated by high speed, lack of binoculars for lookouts, and poor maneuverability (small rudder).
2. **Containment Failure:** The bulkheads did not extend all the way to the main deck ("watertight" compartments were open at the top). Once the ship pitched forward, water spilled from one compartment to the next.
    `,
    data: {
      label: "Titanic Sinks (Loss of Vessel)",
      type: "top",
      gate: "and",
      children: [
        {
          label: "Excessive Water Ingress (>4 Compartments)",
          type: "intermediate",
          gate: "and",
          children: [
            {
              label: "Collision with Iceberg",
              type: "intermediate",
              gate: "and",
              children: [
                { label: "Iceberg in path", type: "basic" },
                { 
                  label: "Failure to Detect in Time", 
                  type: "intermediate", 
                  gate: "or",
                  children: [
                    { label: "No Binoculars for Lookouts", type: "basic" },
                    { label: "Calm seas (no breaking waves)", type: "basic" },
                    { label: "Moonless night", type: "basic" }
                  ]
                },
                {
                  label: "Inability to Maneuver",
                  type: "intermediate",
                  gate: "or",
                  children: [
                    { label: "Ship Speed too High (22 kts)", type: "basic" },
                    { label: "Rudder too small for turn", type: "basic" }
                  ]
                }
              ]
            },
            {
              label: "Hull Integrity Breach",
              type: "intermediate",
              gate: "or",
              children: [
                { label: "Rivets Shear (Metallurgy)", type: "basic" },
                { label: "Steel Plates Buckle", type: "basic" }
              ]
            }
          ]
        },
        {
          label: "Containment Failure (Flooding Escalation)",
          type: "intermediate",
          gate: "or",
          children: [
            {
              label: "Bulkheads not sealed at top",
              type: "basic"
            },
            {
              label: "Pumps capacity exceeded",
              type: "basic"
            }
          ]
        }
      ]
    }
  },
  "Apollo 13 Oxygen Tank": {
    title: "Apollo 13 Service Module Failure",
    summary: "Explosion of oxygen tank No. 2 in the Service Module.",
    report: `
### Incident Overview
During the Apollo 13 mission to the moon, an oxygen tank exploded, crippling the Service Module and forcing the crew to use the Lunar Module as a lifeboat.

### Root Causes
- **Voltage Mismatch:** The tank heater switches were rated for 28V DC but subjected to 65V DC during ground testing, welding the contacts shut.
- **Overheating:** During a detanking procedure on the ground, the heaters stayed on, raising the temperature to over 1000°F and damaging the Teflon insulation on the wires.
- **Ignition:** In space, when the fan was turned on to stir the oxygen, a short circuit ignited the Teflon insulation in the high-pressure oxygen environment.
    `,
    data: {
      label: "Oxygen Tank Rupture",
      type: "top",
      gate: "and",
      children: [
        {
          label: "Ignition Source",
          type: "intermediate",
          gate: "and",
          children: [
            { label: "Exposed wiring (Damaged Insulation)", type: "basic" },
            { label: "Current applied (Fan Stir)", type: "basic" }
          ]
        },
        {
          label: "Fuel for Fire",
          type: "intermediate",
          gate: "and",
          children: [
             { label: "Teflon Insulation", type: "basic" },
             { label: "High Pressure Oxygen Environment", type: "basic" }
          ]
        },
        {
          label: "Pre-existing Latent Failure",
          type: "intermediate",
          gate: "and",
          children: [
            { label: "Thermostatic Switch Welded Shut", type: "basic" },
            { label: "Ground Detanking Incident (Overheat)", type: "basic" }
          ]
        }
      ]
    }
  }
};

// --- EVENT TREE CASE STUDIES ---
export const ETA_CASES: Record<string, CaseStudyWrapper<EventTreeData>> = {
  "Fukushima Daiichi (Detailed)": {
    title: "Fukushima Daiichi Meltdown",
    summary: "Sequence of events following the loss of offsite power and tsunami impact.",
    report: `
### Incident Overview
Following the Tōhoku earthquake and tsunami on March 11, 2011, the Fukushima Daiichi nuclear power plant lost all AC power (Station Blackout). This led to the loss of core cooling, hydrogen production, and eventual explosions.

### Event Sequence
1. **Initiating Event:** Tsunami floods site, destroying backup diesel generators (seawalls were too low).
2. **Battery Power:** Batteries lasted for a few hours but eventually depleted (RCIC system failure).
3. **Core Damage:** Without cooling, water level dropped, fuel rods exposed.
4. **Hydrogen Explosion:** Zirconium-water reaction produced hydrogen, which leaked into the reactor building and exploded.
    `,
    data: {
      initiatingEvent: "Tsunami > 14m floods site",
      pivotalEvents: ["Grid Power?", "Emergency Diesels Start?", "DC Batteries Last?", "Steam Venting Successful?", "Hydrogen Containment?"],
      root: {
        type: "branch",
        children: [
          { 
            path: "Yes", probability: 0, node: { type: "leaf", outcome: "Normal Operation (Impossible)" } 
          },
          {
            path: "No", probability: 1.0, node: { // Grid Lost
              type: "branch",
              children: [
                 { path: "Yes", probability: 0, node: { type: "leaf", outcome: "Safe Shutdown (Diesels)" } },
                 { path: "No", probability: 1.0, node: { // Diesels Flooded
                   type: "branch",
                   children: [
                     { path: "Yes", probability: 0.3, node: { // Batteries Hold (RCIC)
                        type: "branch",
                        children: [
                           { path: "Yes", probability: 0.5, node: { type: "leaf", outcome: "Stable Cold Shutdown" } },
                           { path: "No", probability: 0.5, node: { type: "leaf", outcome: "Late Core Damage" } }
                        ]
                     }},
                     { path: "No", probability: 0.7, node: { // Batteries Deplete
                        type: "branch",
                        children: [
                          { path: "Yes", probability: 0.1, node: { type: "leaf", outcome: "Filtered Release (Radiation)" } },
                          { path: "No", probability: 0.9, node: { // Venting Fails
                             type: "branch",
                             children: [
                                { path: "Yes", probability: 0.2, node: { type: "leaf", outcome: "Meltdown (No Explosion)" } },
                                { path: "No", probability: 0.8, node: { type: "leaf", outcome: "Meltdown + H2 Explosion" } }
                             ]
                          }}
                        ]
                     }}
                   ]
                 }}
              ]
            }
          }
        ]
      }
    }
  }
};

// --- LOPA CASE STUDIES ---
export const LOPA_CASES: Record<string, CaseStudyWrapper<LopaScenario>> = {
  "Buncefield Depot (2005)": {
    title: "Buncefield Oil Depot Explosion",
    summary: "Overfilling of a fuel storage tank led to a massive vapour cloud explosion.",
    report: `
### Incident Overview
On December 11, 2005, a petrol storage tank at the Buncefield oil depot in the UK was overfilled. The safety systems failed to stop the flow. A vapour cloud formed and ignited, causing the largest peacetime explosion in Europe.

### Protection Layers Failed
- **BPCS (Basic Process Control System):** The gauge stuck, telling operators the level was static while it was filling.
- **Independent LSHH (High-High Level Switch):** The switch was physically jammed due to lack of maintenance (a padlock was found on the test lever).
- **Bund / Dike:** The secondary containment leaked, allowing pollution of groundwater.
    `,
    data: {
      id: "buncefield-1",
      initiatingEvent: "ATG Gauge Failure (Stuck at level)",
      frequency: 0.1,
      consequenceDescription: "Tank Overfill -> Vapour Cloud Explosion -> Multiple Fatalities / Env Damage",
      targetFrequency: 1e-5,
      ipls: [
        { name: "Control Room Monitoring (Alarms)", pfd: 0.1 }, // Operator trusted the stuck gauge
        { name: "Independent High Level Switch (LSHH)", pfd: 1.0 }, // FAILED: Jammed switch
        { name: "Emergency Shutdown Button (Site)", pfd: 0.1 }, // Too late
        { name: "Site Drainage / Bunding", pfd: 0.5 } // Leaked
      ],
      mitigatedFrequency: 0.0005,
      riskGap: 50 // Risk 50x higher than acceptable
    }
  },
  "Texas City Refinery (2005)": {
    title: "BP Texas City Isomerization Explosion",
    summary: "Overfilling of a raffinate splitter tower during startup.",
    report: `
### Incident Overview
During the startup of the Isomerization unit, liquid filled the splitter tower and flooded the blowdown stack. The stack vented boiling fuel geyser-like, which ignited when a pickup truck backfired nearby.

### LOPA Gaps
- **Instrumentation:** The level transmitter was a displacer type that did not work for the specific gravity of the fluid during startup.
- **Relief System:** The blowdown drum vented directly to atmosphere (an antiquated design) rather than a flare.
- **Siting:** Portable trailers were placed too close to the process unit.
    `,
    data: {
      id: "texas-city-1",
      initiatingEvent: "Operator overfills tower during startup",
      frequency: 1.0, // Startup is a high-risk activity
      consequenceDescription: "Release of flammable liquid from stack -> Explosion -> 15 Fatalities",
      targetFrequency: 1e-5,
      ipls: [
        { name: "High Level Alarm (LSH)", pfd: 0.1 }, // Ignored/Faulty
        { name: "High High Level Trip (LSHH)", pfd: 1.0 }, // Did not exist or failed
        { name: "Relief Valve to Blowdown", pfd: 0.01 }, // Worked, but design was flawed (vent to atm)
        { name: "Operator Intervention", pfd: 0.5 } // Fatigued crew
      ],
      mitigatedFrequency: 0.005,
      riskGap: 500
    }
  }
};

// --- QRA CASE STUDIES ---
export const QRA_CASES: Record<string, CaseStudyWrapper<QraData>> = {
  "Bhopal (1984) Simulation": {
    title: "Bhopal Gas Tragedy Risk Model",
    summary: "A quantitative assessment of Methyl Isocyanate (MIC) release scenarios.",
    report: `
### Incident Overview
In 1984, water entered a tank containing 42 tons of Methyl Isocyanate (MIC) at the Union Carbide plant in Bhopal, India. The resulting exothermic reaction vented toxic gas, killing thousands.

### Scenario Modeling
- **S1: Runaway Reaction:** The worst-case scenario. Frequency is low (requires multiple failures), but N (fatalities) is catastrophic.
- **S2: Scrubber Failure:** The vent gas scrubber was turned off for maintenance.
- **S3: Flare Failure:** The flare tower was disconnected.
- **S4: Refrigeration Failure:** The cooling system was shut down to save money.
    `,
    data: {
      facilityType: "Pesticide Plant (MIC Storage)",
      totalPLL: 0,
      scenarios: [
        { id: "s1", name: "Runaway Reaction (Water Ingress)", frequency: 1e-4, fatalities: 3800 },
        { id: "s2", name: "Valve Leak (Toxic Cloud)", frequency: 1e-3, fatalities: 50 },
        { id: "s3", name: "Loading Hose Rupture", frequency: 1e-3, fatalities: 10 },
        { id: "s4", name: "Pipe Corrosion Failure", frequency: 1e-2, fatalities: 5 },
        { id: "s5", name: "Vent Scrubber Breakthrough", frequency: 5e-4, fatalities: 500 }
      ]
    }
  }
};

// --- HAZOP CASE STUDIES ---
export const HAZOP_CASES: Record<string, CaseStudyWrapper<HazopNode>> = {
  "Seveso (1976) Reactor": {
    title: "Seveso Reactor Runaway",
    summary: "Failure to control temperature in a batch reactor led to dioxin release.",
    report: `
### Incident Overview
At the ICMESA chemical plant in Meda, Italy, a batch reactor producing TCCP overheated after a steam valve was not fully closed during a weekend shutdown. This caused the relief valve to lift, releasing a toxic cloud of Dioxin.

### HAZOP Analysis
The retrospective HAZOP highlights the lack of automatic protection systems and reliance on operator intervention during off-normal hours.
    `,
    data: {
      id: "seveso-1",
      name: "Reactor R-101 (TCCP Production)",
      designIntent: "Maintain batch at 150°C for 6 hours, then cool",
      rows: [
        {
          id: "r1",
          deviation: "Higher Temperature",
          cause: "Steam valve passes (leaks) after shutdown",
          consequence: "Exothermic decomposition -> Pressure Rise -> Relief Lift -> Dioxin Release",
          riskBefore: { s: 5, f: 4, rr: "", color: "" },
          safeguardsInstrumental: "Temperature Recorder (No Trip)",
          safeguardsOther: "Manual observation (None present on weekend)",
          riskAfter: { s: 5, f: 4, rr: "", color: "" }, // UNACCEPTABLE
          recommendations: "1. Install High Temp Trip (SIS). 2. Automate cooling water injection. 3. Route relief to catch tank (dump tank).",
          responsibility: "Instrument Eng",
          status: "Open"
        },
        {
          id: "r2",
          deviation: "Less Flow (Stirrer)",
          cause: "Motor trip / Power failure",
          consequence: "Hot spots in reactor -> Runaway",
          riskBefore: { s: 4, f: 3, rr: "", color: "" },
          safeguardsInstrumental: "Motor Amps Low Alarm",
          safeguardsOther: "",
          riskAfter: { s: 4, f: 2, rr: "", color: "" },
          recommendations: "Interlock steam to stirrer status.",
          responsibility: "Process Eng",
          status: "Open"
        },
        {
           id: "r3",
           deviation: "High Pressure",
           cause: "Runaway reaction",
           consequence: "Vessel Rupture",
           riskBefore: { s: 5, f: 3, rr: "", color: "" },
           safeguardsInstrumental: "Bursting Disc (Vents to Atmosphere)",
           safeguardsOther: "",
           riskAfter: { s: 5, f: 2, rr: "", color: "" },
           recommendations: "Ensure bursting disc vents to scrubber/neutralizer, NOT atmosphere.",
           responsibility: "Process Eng",
           status: "Open"
        }
      ]
    }
  }
};
