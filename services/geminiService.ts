
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { BowTieData, FaultTreeNode, EventTreeData, LopaScenario, QraData, Barrier, HazopNode, FmeaSystem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-3-flash-preview';

// Retry Helper
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.warn(`API request failed. Retrying in ${delay}ms...`, error);
      await new Promise(res => setTimeout(res, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Helper to clean and parse JSON from AI response
const parseAIResponse = (text: string): any => {
  if (!text) throw new Error("Empty response from AI");
  try {
    // Remove markdown code blocks if present
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    console.error("Raw Text:", text);
    throw new Error("Failed to parse AI response");
  }
};

// Helper to infer owner if missing based on category
const inferOwner = (category: string): string => {
  const cat = (category || "").toLowerCase();
  if (cat.includes('design') || cat.includes('engineering')) return "Engineering Team";
  if (cat.includes('construction') || cat.includes('structural')) return "Construction Team";
  if (cat.includes('maintenance') || cat.includes('integrity') || cat.includes('equipment')) return "Maintenance Dept";
  if (cat.includes('training')) return "Training Dept";
  if (cat.includes('operations') || cat.includes('procedural') || cat.includes('task')) return "Operations";
  return "Area Authority";
};

// Helper to add IDs to generated data
const enrichWithIds = (data: any): any => {
  if (!data) return data;
  const generateId = () => Math.random().toString(36).substr(2, 9);
  
  if (data.threats) {
    data.threats = data.threats.map((t: any) => ({
      ...t,
      id: t.id || generateId(),
      barriers: t.barriers.map((b: any) => ({
        ...b,
        id: b.id || generateId(),
        // Infer appropriate department if AI didn't provide it
        owner: b.owner || inferOwner(b.category),
        performanceStandard: b.performanceStandard || "Per SOP",
        category: b.category || "Safety Critical Equipment",
        effectiveness: b.effectiveness || "High"
      }))
    }));
  }
  if (data.consequences) {
    data.consequences = data.consequences.map((c: any) => ({
      ...c,
      id: c.id || generateId(),
      barriers: c.barriers.map((b: any) => ({
        ...b,
        id: b.id || generateId(),
        owner: b.owner || inferOwner(b.category),
        performanceStandard: b.performanceStandard || "Per SOP",
        category: b.category || "Procedural",
        effectiveness: b.effectiveness || "High"
      }))
    }));
  }
  return data;
};

export const generateBowTieData = async (
  context: string,
  topEvent: string,
  mode: 'normal' | 'rigorous'
): Promise<Partial<BowTieData>> => {
  const instruction = mode === 'rigorous'
    ? "Generate a comprehensive analysis with about 6-8 distinct threats and 6-8 distinct consequences. For each threat/consequence, provide 3-5 specific barriers. IMPORTANT: Ensure a diverse mix of barrier categories (hardware, human, organizational) is used across the diagram, not just procedural."
    : "Generate about 3-4 threats and 3-4 consequences. For each, provide 1-3 realistic barriers. Ensure a mix of barrier types (Equipment, Task, Design, etc.).";

  const prompt = `
    I am building a Bowtie Diagram for safety analysis.
    Hazard Context: ${context}
    Top Event: ${topEvent}

    Please generate a JSON object containing realistic 'threats' (causes) and 'consequences' (outcomes).
    
    CRITICAL INSTRUCTIONS FOR BARRIERS:
    1. You MUST vary the 'category' for barriers. Do not default to 'Procedural' or 'Operations'. Actively use 'Safety Critical Equipment' (alarms, trips, relief), 'Design' (layout, materials), 'Asset Integrity' (inspection), 'Training' (competency), and 'Maintenance' (PMs).
    2. Categories allowed: 'Safety Critical Equipment', 'Safety Critical Task', 'Procedural', 'Design', 'Asset Integrity', 'Training', 'Operations', 'Maintenance', 'Others'.
    3. Assign specific 'owner' roles (e.g., 'Instrument Tech', 'Process Engineer', 'Operations Supervisor', 'Inspection Dept') rather than generic 'Admin'.
    4. Assign an 'effectiveness' rating: 'High', 'Medium', 'Low', or 'Poor'.
    
    ${instruction}
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      threats: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            barriers: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING, description: "Name of the barrier" },
                  category: { type: Type.STRING, description: "Category from the list provided" },
                  owner: { type: Type.STRING, description: "Responsible Department" },
                  effectiveness: { type: Type.STRING, description: "High, Medium, Low, or Poor" }
                },
                required: ['label', 'category', 'owner', 'effectiveness']
              } 
            }
          },
          required: ['name', 'barriers']
        }
      },
      consequences: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            barriers: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  category: { type: Type.STRING },
                  owner: { type: Type.STRING },
                  effectiveness: { type: Type.STRING }
                },
                required: ['label', 'category', 'owner', 'effectiveness']
              } 
            }
          },
          required: ['name', 'barriers']
        }
      }
    },
    required: ['threats', 'consequences']
  };

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    }));

    const parsed = parseAIResponse(response.text || "");
    return enrichWithIds(parsed);
  } catch (error) {
    console.error("BowTie Generation Error:", error);
    throw error;
  }
};

export const parseHazopToBowTie = async (hazopText: string): Promise<BowTieData> => {
  const prompt = `
    Analyze the following text from a HAZOP report and extract a Bowtie Diagram structure.
    
    HAZOP TEXT:
    "${hazopText}"

    INSTRUCTIONS:
    1. Identify the central Hazard.
    2. Identify the Top Event.
    3. Map Causes to 'threats'.
    4. Map Consequences to 'consequences'.
    5. Map Safeguards/Controls to 'barriers'. Assign a category (Safety Critical Equipment, Procedural, etc.) and a responsible owner.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      hazard: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING },
          title: { type: Type.STRING }
        },
        required: ['code', 'title']
      },
      topEvent: { type: Type.STRING },
      threats: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            barriers: { 
              type: Type.ARRAY, 
              items: { 
                 type: Type.OBJECT,
                 properties: {
                   label: { type: Type.STRING },
                   category: { type: Type.STRING },
                   owner: { type: Type.STRING }
                 },
                 required: ['label', 'category', 'owner']
              } 
            }
          },
          required: ['name', 'barriers']
        }
      },
      consequences: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            barriers: { 
              type: Type.ARRAY, 
              items: { 
                 type: Type.OBJECT,
                 properties: {
                   label: { type: Type.STRING },
                   category: { type: Type.STRING },
                   owner: { type: Type.STRING }
                 },
                 required: ['label', 'category', 'owner']
              } 
            }
          },
          required: ['name', 'barriers']
        }
      }
    },
    required: ['hazard', 'topEvent', 'threats', 'consequences']
  };

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    }));

    const parsed = parseAIResponse(response.text || "");
    return enrichWithIds(parsed);
  } catch (error) {
    console.error("HAZOP Parse Error:", error);
    throw error;
  }
};

export const generateFaultTreeData = async (
  scenario: string, 
  mode: 'normal' | 'rigorous'
): Promise<FaultTreeNode> => {
  const instruction = mode === 'rigorous' 
    ? "Generate a rigorous Fault Tree with at least 3 levels of depth." 
    : "Generate a standard Fault Tree Analysis.";

  const prompt = `
    Create a Fault Tree Analysis for the top event: '${scenario}'.
    ${instruction}
    
    Structure the response as a valid JSON object matching this TypeScript interface:
    interface FaultTreeNode {
      label: string;
      type: 'top' | 'intermediate' | 'basic';
      gate?: 'and' | 'or'; // 'gate' is required for 'top' and 'intermediate' nodes
      children?: FaultTreeNode[];
    }
  `;
  
  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    }));

    return parseAIResponse(response.text || "");
  } catch (error) {
    console.error("Fault Tree Generation Error:", error);
    throw error;
  }
};

export const generateEventTreeData = async (
  scenario: string,
  mode: 'normal' | 'rigorous'
): Promise<EventTreeData> => {
  const instruction = mode === 'rigorous' 
    ? "Generate a rigorous analysis with 5-7 safety functions and detailed probabilities." 
    : "Generate a standard analysis with 3-4 safety functions.";

  const prompt = `
    Create an Event Tree Analysis for: '${scenario}'.
    ${instruction}
    
    Return a valid JSON object with:
    - initiatingEvent (string): The event that starts the chain.
    - pivotalEvents (array of strings): The safety functions (e.g., "Ignition?", "Sprinkler System?").
    - root (object): A recursive tree structure.
    
    Root Node Structure:
    {
      "type": "branch",
      "children": [
        { "path": "Success/Yes", "probability": 0.9, "node": { ...next_node... } },
        { "path": "Failure/No", "probability": 0.1, "node": { "type": "leaf", "outcome": "Fire" } }
      ]
    }
  `;

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    }));

    return parseAIResponse(response.text || "");
  } catch (error) {
    console.error("Event Tree Generation Error:", error);
    throw error;
  }
};

// --- LOPA GENERATION ---
export const generateLopaData = async (
  scenario: string
): Promise<LopaScenario> => {
  const prompt = `
    Create a Layers of Protection Analysis (LOPA) worksheet for the scenario: '${scenario}'.
    
    Generate 1 specific scenario.
    Include:
    1. Initiating Event (IE) with realistic frequency (e.g., 1e-1 to 1e-5).
    2. Consequence description (Safety/Environmental).
    3. Target Mitigated Event Likelihood (Target Frequency, e.g., 1e-4).
    4. 2 to 4 Independent Protection Layers (IPLs) with realistic Probability of Failure on Demand (PFD) values (e.g., BPCS=0.1, Alarms=0.1, SIS=0.01, Relief Valve=0.01).
    5. IMPORTANT: Assign a 'layerType' to each IPL from this list: 'BPCS', 'Alarm', 'SIS', 'Relief', 'Containment', 'Emergency'.
    
    Return a single JSON object (LopaScenario) with fields:
    - initiatingEvent (string)
    - frequency (number)
    - consequenceDescription (string)
    - targetFrequency (number)
    - ipls (array of { name: string, pfd: number, layerType: string })
  `;

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    }));
    
    const data = parseAIResponse(response.text || "");
    return { ...data, id: Date.now().toString(), mitigatedFrequency: 0, riskGap: 0 };
  } catch (error) {
    console.error("LOPA Generation Error:", error);
    throw error;
  }
};

// --- QRA GENERATION ---
export const generateQraData = async (
  facilityType: string
): Promise<QraData> => {
  const prompt = `
    Perform a Quantitative Risk Assessment (QRA) for a facility of type: '${facilityType}'.
    
    Identify 5 to 8 major hazardous scenarios (e.g., Jet Fire, BLEVE, Toxic Release).
    For each scenario, estimate:
    1. Frequency per year (e.g., 1e-3 to 1e-7).
    2. Estimated Fatality Count (N).
    
    Return a valid JSON object:
    {
      "facilityType": "${facilityType}",
      "scenarios": [
        { "name": "...", "frequency": number, "fatalities": number }
      ]
    }
  `;

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    }));

    const data = parseAIResponse(response.text || "");
    data.scenarios = data.scenarios.map((s: any, i: number) => ({...s, id: i.toString()}));
    return { ...data, totalPLL: 0 };
  } catch (error) {
    console.error("QRA Generation Error:", error);
    throw error;
  }
};

// --- HAZOP GENERATION ---
export const generateHazopData = async (
  nodeDescription: string,
  mode: 'normal' | 'rigorous'
): Promise<HazopNode> => {
  const instruction = mode === 'rigorous'
    ? "Perform a rigorous HAZOP. Analyze Flow, Pressure, Temperature, Level, and Composition guidewords. For each, identify at least 2 causes. Be highly specific about instrumentation tags (e.g., PIC-101) and relief scenarios."
    : "Perform a standard HAZOP analysis for major guidewords like Flow and Pressure. Identify realistic causes and safeguards.";

  const prompt = `
    Perform a HAZOP Study for the Process Node: '${nodeDescription}'.
    ${instruction}
    
    Return a single JSON object (HazopNode) matching this structure. 
    IMPORTANT: Provide realistic integer values for Risk Severity (s) and Likelihood (f) from 1 to 5.
    
    Interface:
    {
      "name": "${nodeDescription}",
      "designIntent": "Describe intent...",
      "rows": [
        {
          "deviation": "e.g. High Pressure",
          "cause": "e.g. PCV fail closed",
          "consequence": "e.g. Vessel rupture",
          "riskBefore": { "s": 4, "f": 3 },
          "safeguardsInstrumental": "e.g. PSHH-101",
          "safeguardsOther": "e.g. Relief Valve",
          "riskAfter": { "s": 4, "f": 1 },
          "recommendations": "e.g. Verify sizing",
          "responsibility": "Process Eng"
        }
      ]
    }
  `;

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    }));

    const data = parseAIResponse(response.text || "");
    
    // Enrich with IDs and default values
    const enrichedRows = data.rows.map((row: any) => ({
      ...row,
      id: Math.random().toString(36).substr(2, 9),
      riskBefore: { 
        s: row.riskBefore?.s || 3, 
        f: row.riskBefore?.f || 3, 
        rr: "", color: "" // will be calculated by UI
      },
      riskAfter: { 
        s: row.riskAfter?.s || 3, 
        f: row.riskAfter?.f || 1, 
        rr: "", color: "" // will be calculated by UI
      },
      status: 'Open'
    }));

    return { ...data, id: Date.now().toString(), rows: enrichedRows };
  } catch (error) {
    console.error("HAZOP Generation Error:", error);
    throw error;
  }
};

// --- FMEA GENERATION ---
export const generateFMEAData = async (
  systemName: string,
  mode: 'normal' | 'rigorous'
): Promise<FmeaSystem> => {
  const instruction = mode === 'rigorous'
    ? "Perform a detailed FMEA. For each component, identify multiple failure modes and effects. Use realistic Severity (1-10), Occurrence (1-10), and Detection (1-10) ratings."
    : "Perform a standard FMEA analysis for key process steps.";

  const prompt = `
    Perform a Failure Mode and Effects Analysis (FMEA) for: '${systemName}'.
    ${instruction}
    
    Return a single JSON object matching this structure:
    {
      "systemName": "${systemName}",
      "rows": [
        {
          "processStep": "e.g. Pump Operation",
          "failureMode": "e.g. Seal Failure",
          "failureEffect": "e.g. Leak to atmosphere",
          "severity": 8, // 1-10
          "cause": "e.g. Vibration fatigue",
          "occurrence": 4, // 1-10
          "controls": "e.g. Vibration monitoring",
          "detection": 3, // 1-10
          "actions": "e.g. Upgrade seal type",
          "responsibility": "Maint. Manager"
        }
      ]
    }
  `;

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    }));

    const data = parseAIResponse(response.text || "");
    
    // Enrich rows
    const enrichedRows = data.rows.map((row: any) => ({
      ...row,
      id: Math.random().toString(36).substr(2, 9),
      rpn: (row.severity || 1) * (row.occurrence || 1) * (row.detection || 1),
      severity: row.severity || 5,
      occurrence: row.occurrence || 5,
      detection: row.detection || 5,
    }));

    return { ...data, id: Date.now().toString(), rows: enrichedRows };
  } catch (error) {
    console.error("FMEA Generation Error:", error);
    throw error;
  }
};

export const getChatResponse = async (
  message: string, 
  history: {role: 'user' | 'model', parts: {text: string}[]}[]
): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-flash-lite-latest',
      history: history,
      config: {
        systemInstruction: "You are a Safety for All assistant. Answer questions about industrial safety, risk analysis (BowTie, LOPA, HAZOP), and help users navigate the app. Keep answers concise.",
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I'm not sure how to answer that.";
  } catch (e) {
    console.error("Chat Error:", e);
    return "I'm having trouble connecting to the server.";
  }
};
