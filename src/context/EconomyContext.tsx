import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  EconomyProject,
  Currency,
  ShopItem,
  FlowNode,
  FlowEdge,
  SimulationConfig,
  SimulationResult,
  SingleBotLiveState,
  BotStepRecord,
  BotPersonaType,
} from '../types/economy';
import { HYPER_CASUAL_COMPLETE_LOOP, IDLE_CLICKER_STARTER, TEMPLATES } from '../data/templates';
import { SimulationEngine } from '../engine/simulationEngine';

export type ActiveSection = 'currencies' | 'shop' | 'simulator';

interface EconomyContextType {
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
  project: EconomyProject;
  currencies: Currency[];
  shopItems: ShopItem[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  simConfig: SimulationConfig;
  simResult: SimulationResult | null;
  isSimulating: boolean;
  selectedTemplateKey: string;
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;

  // Single Bot Live Stepping
  singleBotState: SingleBotLiveState | null;
  isSingleBotMode: boolean;
  setIsSingleBotMode: (active: boolean) => void;
  selectedPersona: BotPersonaType;
  setSelectedPersona: (persona: BotPersonaType) => void;
  startSingleBotSimulation: (persona?: BotPersonaType) => void;
  stepSingleBotForward: () => void;
  togglePlaySingleBot: () => void;
  resetSingleBot: () => void;
  setSingleBotSpeed: (speed: number) => void;

  // Currency Actions
  addCurrency: (currency: Currency) => void;
  updateCurrency: (id: string, updated: Partial<Currency>) => void;
  duplicateCurrency: (id: string) => void;
  deleteCurrency: (id: string) => void;

  // Shop Actions
  addShopItem: (item: ShopItem) => void;
  updateShopItem: (id: string, updated: Partial<ShopItem>) => void;
  duplicateShopItem: (id: string) => void;
  deleteShopItem: (id: string) => void;
  bulkUpdateShopItems: (ids: string[], updates: Partial<ShopItem>) => void;
  reorderShopItems: (newItems: ShopItem[]) => void;

  // Node & Edge Flow Actions
  setNodes: React.Dispatch<React.SetStateAction<FlowNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<FlowEdge[]>>;
  addNode: (node: FlowNode) => void;
  updateNodeData: (id: string, data: Partial<FlowNode['data']>) => void;
  deleteNode: (id: string) => void;

  // Sim Actions
  updateSimConfig: (config: Partial<SimulationConfig>) => void;
  runSimulation: () => void;
  resetSimulation: () => void;

  // Template & Project Actions
  loadTemplate: (key: string) => void;
  exportProjectJson: () => void;
  importProjectJson: (jsonString: string) => { success: boolean; error?: string };
  resetProjectToDefault: () => void;
}

const LOCAL_STORAGE_KEY = 'hypereconomy_studio_project_v2';

const EconomyContext = createContext<EconomyContextType | null>(null);

export const EconomyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('currencies');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('hyper_casual_loop');
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);

  // Initialize Project State from localStorage or Starter Template
  const [project, setProject] = useState<EconomyProject>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currencies && parsed.shopItems && parsed.nodes) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load project from localStorage', e);
    }
    return HYPER_CASUAL_COMPLETE_LOOP;
  });

  // Persist project changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(project));
    } catch (e) {
      console.warn('Failed to save project to localStorage', e);
    }
  }, [project]);

  // Convenience getters
  const currencies = useMemo(() => project.currencies, [project.currencies]);
  const shopItems = useMemo(() => project.shopItems, [project.shopItems]);
  const nodes = useMemo(() => project.nodes, [project.nodes]);
  const edges = useMemo(() => project.edges, [project.edges]);
  const simConfig = useMemo(() => project.simConfig, [project.simConfig]);

  // Currency Handlers
  const addCurrency = useCallback((currency: Currency) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      currencies: [...prev.currencies, currency],
    }));
  }, []);

  const updateCurrency = useCallback((id: string, updated: Partial<Currency>) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      currencies: prev.currencies.map((c) => (c.id === id ? { ...c, ...updated } : c)),
    }));
  }, []);

  const duplicateCurrency = useCallback((id: string) => {
    setProject((prev) => {
      const existing = prev.currencies.find((c) => c.id === id);
      if (!existing) return prev;
      const clone: Currency = {
        ...JSON.parse(JSON.stringify(existing)),
        id: `curr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: `${existing.name} (Copy)`,
      };
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        currencies: [...prev.currencies, clone],
      };
    });
  }, []);

  const deleteCurrency = useCallback((id: string) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      currencies: prev.currencies.filter((c) => c.id !== id),
      // Clean up references in shop items and nodes
      shopItems: prev.shopItems.map((item) => ({
        ...item,
        priceOptions: item.priceOptions.filter((p) => p.currencyId !== id),
      })),
    }));
  }, []);

  // Shop Item Handlers
  const addShopItem = useCallback((item: ShopItem) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      shopItems: [...prev.shopItems, item],
    }));
  }, []);

  const updateShopItem = useCallback((id: string, updated: Partial<ShopItem>) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      shopItems: prev.shopItems.map((item) => (item.id === id ? { ...item, ...updated } : item)),
    }));
  }, []);

  const duplicateShopItem = useCallback((id: string) => {
    setProject((prev) => {
      const existing = prev.shopItems.find((it) => it.id === id);
      if (!existing) return prev;
      const clone: ShopItem = {
        ...JSON.parse(JSON.stringify(existing)),
        id: `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: `${existing.name} (Copy)`,
      };
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        shopItems: [...prev.shopItems, clone],
      };
    });
  }, []);

  const deleteShopItem = useCallback((id: string) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      shopItems: prev.shopItems.filter((it) => it.id !== id),
    }));
  }, []);

  const bulkUpdateShopItems = useCallback((ids: string[], updates: Partial<ShopItem>) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      shopItems: prev.shopItems.map((item) => (ids.includes(item.id) ? { ...item, ...updates } : item)),
    }));
  }, []);

  const reorderShopItems = useCallback((newItems: ShopItem[]) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      shopItems: newItems,
    }));
  }, []);

  // Node & Edge Handlers
  const setNodes = useCallback((action: React.SetStateAction<FlowNode[]>) => {
    setProject((prev) => {
      const nextNodes = typeof action === 'function' ? action(prev.nodes) : action;
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        nodes: nextNodes,
      };
    });
  }, []);

  const setEdges = useCallback((action: React.SetStateAction<FlowEdge[]>) => {
    setProject((prev) => {
      const nextEdges = typeof action === 'function' ? action(prev.edges) : action;
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        edges: nextEdges,
      };
    });
  }, []);

  const addNode = useCallback((node: FlowNode) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      nodes: [...prev.nodes, node],
    }));
  }, []);

  const updateNodeData = useCallback((id: string, data: Partial<FlowNode['data']>) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)),
    }));
  }, []);

  const deleteNode = useCallback((id: string) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      nodes: prev.nodes.filter((n) => n.id !== id),
      edges: prev.edges.filter((e) => e.source !== id && e.target !== id),
    }));
  }, []);

  // Sim Config
  const updateSimConfig = useCallback((cfg: Partial<SimulationConfig>) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      simConfig: { ...prev.simConfig, ...cfg },
    }));
  }, []);

  // Run Simulation
  const runSimulation = useCallback(() => {
    setIsSimulating(true);
    // Give browser a microtask to display loading/simulating spinner
    setTimeout(() => {
      try {
        const engine = new SimulationEngine(project, project.simConfig);
        const results = engine.runFullSimulation();
        setSimResult(results);
      } catch (err) {
        console.error('Simulation execution failed:', err);
      } finally {
        setIsSimulating(false);
      }
    }, 50);
  }, [project]);

  // Reset Simulation
  const resetSimulation = useCallback(() => {
    setSimResult(null);
    setIsSimulating(false);
  }, []);

  // Single Bot Mode State
  const [selectedPersona, setSelectedPersona] = useState<BotPersonaType>('casual');
  const [isSingleBotMode, setIsSingleBotMode] = useState<boolean>(false);
  const [singleBotState, setSingleBotState] = useState<SingleBotLiveState | null>(null);
  const singleBotEngineRef = useRef<SimulationEngine | null>(null);
  const autoPlayTimerRef = useRef<any>(null);

  // Start / Init Single Bot
  const startSingleBotSimulation = useCallback((personaParam?: BotPersonaType) => {
    const personaToUse = personaParam || selectedPersona;
    if (personaParam && personaParam !== selectedPersona) {
      setSelectedPersona(personaParam);
    }
    const engine = new SimulationEngine(project, project.simConfig);
    singleBotEngineRef.current = engine;
    const initialBot = engine.createInitialBot(personaToUse);
    const startNode = project.nodes.find((n) => n.data.type === 'START') || project.nodes[0];

    const initialLiveState: SingleBotLiveState = {
      bot: initialBot,
      currentStepIndex: 0,
      steps: [
        {
          stepNumber: 0,
          tick: 0,
          timeSec: 0,
          nodeId: startNode ? startNode.id : '',
          nodeType: startNode ? startNode.data.type : 'START',
          nodeLabel: startNode ? startNode.data.label : 'Start',
          actionTaken: `Initialize Bot Session (${personaToUse.toUpperCase()} Persona)`,
          deltaWallet: {},
          walletAfter: { ...initialBot.currentWallet },
          levelAfter: initialBot.level || 1,
          walletSnapshot: { ...initialBot.currentWallet },
          persona: personaToUse,
          decisionMade: `Session started with ${personaToUse.toUpperCase()} bot persona and initial wallet balance.`,
        },
      ],
      activeNodeId: startNode ? startNode.id : '',
      isPlaying: false,
      playbackSpeed: 1,
      isFinished: false,
      finishReason: undefined,
      lastDecision: `Bot initialized as ${personaToUse.toUpperCase()} gamer. Ready to step forward.`,
      totalTicks: 0,
    };

    setSingleBotState(initialLiveState);
    setIsSingleBotMode(true);
  }, [project, selectedPersona]);

  // Step Single Bot Forward by 1 Node
  const stepSingleBotForward = useCallback(() => {
    if (!singleBotEngineRef.current || !singleBotState || singleBotState.isFinished) return;

    const engine = singleBotEngineRef.current;
    const currentTick = singleBotState.totalTicks + 1;
    const res = engine.stepSingleBot(singleBotState.bot, currentTick);

    const newStepIndex = singleBotState.currentStepIndex + 1;
    const newSteps = [...singleBotState.steps];
    if (res.stepRecord) {
      newSteps.push({
        ...res.stepRecord,
        stepNumber: newStepIndex,
      });
    }

    setSingleBotState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        bot: res.updatedBot,
        currentStepIndex: newStepIndex,
        steps: newSteps,
        activeNodeId: res.updatedBot.currentNodeId,
        isFinished: res.isFinished,
        finishReason: res.updatedBot.finishReason,
        lastDecision: res.stepRecord?.decisionMade || (res.isFinished ? `Bot session concluded: ${res.updatedBot.finishReason || 'Finished'}` : undefined),
        totalTicks: currentTick,
      };
    });
  }, [singleBotState]);

  // Toggle Play / Pause
  const togglePlaySingleBot = useCallback(() => {
    setSingleBotState((prev) => {
      if (!prev) return null;
      return { ...prev, isPlaying: !prev.isPlaying };
    });
  }, []);

  // Reset Single Bot
  const resetSingleBot = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    startSingleBotSimulation(selectedPersona);
  }, [startSingleBotSimulation, selectedPersona]);

  // Set Speed
  const setSingleBotSpeed = useCallback((speed: number) => {
    setSingleBotState((prev) => {
      if (!prev) return null;
      return { ...prev, playbackSpeed: speed };
    });
  }, []);

  // Interval Autoplay Runner
  useEffect(() => {
    if (singleBotState?.isPlaying && !singleBotState.isFinished) {
      const intervalMs = Math.max(200, 1000 / (singleBotState.playbackSpeed || 1));
      autoPlayTimerRef.current = setInterval(() => {
        stepSingleBotForward();
      }, intervalMs);
    } else {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    }

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    };
  }, [singleBotState?.isPlaying, singleBotState?.isFinished, singleBotState?.playbackSpeed, stepSingleBotForward]);

  // Templates
  const loadTemplate = useCallback((key: string) => {
    const template = TEMPLATES[key];
    if (template) {
      const cloned = JSON.parse(JSON.stringify(template));
      cloned.updatedAt = new Date().toISOString();
      setProject(cloned);
      setSelectedTemplateKey(key);
      setSimResult(null);
    }
  }, []);

  const resetProjectToDefault = useCallback(() => {
    const defaultProj = JSON.parse(JSON.stringify(IDLE_CLICKER_STARTER));
    setProject(defaultProj);
    setSelectedTemplateKey('idle_clicker');
    setSimResult(null);
  }, []);

  // Project Import/Export
  const exportProjectJson = useCallback(() => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${project.name.toLowerCase().replace(/\s+/g, '_')}_economy.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [project]);

  const importProjectJson = useCallback((jsonString: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.currencies || !Array.isArray(parsed.currencies)) {
        return { success: false, error: 'Invalid file format: Missing currencies array.' };
      }
      if (!parsed.shopItems || !Array.isArray(parsed.shopItems)) {
        return { success: false, error: 'Invalid file format: Missing shopItems array.' };
      }
      if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
        return { success: false, error: 'Invalid file format: Missing nodes array.' };
      }

      setProject({
        version: parsed.version || '1.0.0',
        name: parsed.name || 'Imported Economy Project',
        updatedAt: new Date().toISOString(),
        currencies: parsed.currencies,
        shopItems: parsed.shopItems,
        nodes: parsed.nodes,
        edges: parsed.edges || [],
        simConfig: parsed.simConfig || IDLE_CLICKER_STARTER.simConfig,
      });
      setSimResult(null);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to parse JSON file.' };
    }
  }, []);

  return (
    <EconomyContext.Provider
      value={{
        activeSection,
        setActiveSection,
        project,
        currencies,
        shopItems,
        nodes,
        edges,
        simConfig,
        simResult,
        isSimulating,
        selectedTemplateKey,
        isHelpOpen,
        setIsHelpOpen,
        singleBotState,
        isSingleBotMode,
        setIsSingleBotMode,
        selectedPersona,
        setSelectedPersona,
        startSingleBotSimulation,
        stepSingleBotForward,
        togglePlaySingleBot,
        resetSingleBot,
        setSingleBotSpeed,
        addCurrency,
        updateCurrency,
        duplicateCurrency,
        deleteCurrency,
        addShopItem,
        updateShopItem,
        duplicateShopItem,
        deleteShopItem,
        bulkUpdateShopItems,
        reorderShopItems,
        setNodes,
        setEdges,
        addNode,
        updateNodeData,
        deleteNode,
        updateSimConfig,
        runSimulation,
        resetSimulation,
        loadTemplate,
        exportProjectJson,
        importProjectJson,
        resetProjectToDefault,
      }}
    >
      {children}
    </EconomyContext.Provider>
  );
};

export const useEconomy = () => {
  const context = useContext(EconomyContext);
  if (!context) {
    throw new Error('useEconomy must be used within an EconomyProvider');
  }
  return context;
};
