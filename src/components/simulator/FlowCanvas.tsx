import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Play,
  Activity,
  CreditCard,
  ShoppingBag,
  GitBranch,
  Percent,
  AlertOctagon,
  Maximize2,
  ZoomIn,
  Sparkles,
} from 'lucide-react';
import { useEconomy } from '../../context/EconomyContext';
import { FlowNode, FlowEdge, FlowNodeData, FlowNodeType } from '../../types/economy';
import { nodeTypes } from './CustomNodes';
import { NodeConfigDrawer } from './NodeConfigDrawer';

// Helper to convert internal type to registered node component key
function toComponentNodeType(type: FlowNodeType | string): string {
  switch (type) {
    case 'START':
    case 'startNode':
    case 'start':
      return 'startNode';
    case 'ACTION':
    case 'actionNode':
    case 'action':
      return 'actionNode';
    case 'CONDITION':
    case 'conditionNode':
    case 'condition':
      return 'conditionNode';
    case 'EARN':
    case 'earnNode':
    case 'earn':
      return 'earnNode';
    case 'SPEND':
    case 'spendNode':
    case 'spend':
      return 'spendNode';
    case 'SHOP_VISIT':
    case 'shopVisitNode':
    case 'shopvisitNode':
    case 'shop_visit':
      return 'shopVisitNode';
    case 'CHANCE':
    case 'chanceNode':
    case 'chance':
      return 'chanceNode';
    case 'END':
    case 'endNode':
    case 'end':
      return 'endNode';
    default:
      return 'actionNode';
  }
}

export const FlowCanvas: React.FC = () => {
  const {
    nodes: projectNodes,
    edges: projectEdges,
    setNodes: setProjectNodes,
    setEdges: setProjectEdges,
    addNode: addProjectNode,
    updateNodeData: updateProjectNodeData,
    deleteNode: deleteProjectNode,
    currencies,
    shopItems,
    isSingleBotMode,
    singleBotState,
  } = useEconomy();

  const [selectedNode, setSelectedNode] = useState<{
    id: string;
    type: string;
    data: FlowNodeData;
  } | null>(null);

  const activeBotNodeId = isSingleBotMode ? singleBotState?.activeNodeId : null;

  // Map project nodes to React Flow format with active bot indicator
  const mappedInitialNodes: Node[] = useMemo(() => {
    return projectNodes.map((n) => ({
      id: n.id,
      type: toComponentNodeType(n.data.type || n.type),
      position: n.position,
      data: {
        ...n.data,
        isSingleBotActive: activeBotNodeId === n.id,
      } as any,
    }));
  }, [projectNodes, activeBotNodeId]);

  const mappedInitialEdges: Edge[] = useMemo(() => {
    return projectEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      label: e.label,
      animated: e.animated ?? true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
      labelStyle: { fill: '#cbd5e1', fontSize: 10, fontWeight: 600 },
      labelBgStyle: { fill: '#0f172a', stroke: '#334155', strokeWidth: 1, rx: 6, ry: 6 },
      labelBgPadding: [6, 4],
    }));
  }, [projectEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(mappedInitialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(mappedInitialEdges);

  // Sync internal state when external project template or bot active position changes
  useEffect(() => {
    setNodes(
      projectNodes.map((n) => ({
        id: n.id,
        type: toComponentNodeType(n.data.type || n.type),
        position: n.position,
        data: {
          ...n.data,
          isSingleBotActive: isSingleBotMode && singleBotState?.activeNodeId === n.id,
        } as any,
      }))
    );
  }, [projectNodes, isSingleBotMode, singleBotState?.activeNodeId, setNodes]);

  const lastProjectEdgesRef = useRef(projectEdges);
  useEffect(() => {
    if (lastProjectEdgesRef.current !== projectEdges) {
      lastProjectEdgesRef.current = projectEdges;
      setEdges(
        projectEdges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          label: e.label,
          animated: e.animated ?? true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
          labelStyle: { fill: '#cbd5e1', fontSize: 10, fontWeight: 600 },
          labelBgStyle: { fill: '#0f172a', stroke: '#334155', strokeWidth: 1, rx: 6, ry: 6 },
          labelBgPadding: [6, 4],
        }))
      );
    }
  }, [projectEdges, setEdges]);

  // When node drag ends, safely sync coordinates to Project Context
  const onNodeDragStop = useCallback(
    (_event: MouseEvent | TouchEvent, node: Node) => {
      setProjectNodes((prev) =>
        prev.map((pn) =>
          pn.id === node.id ? { ...pn, position: { x: node.position.x, y: node.position.y } } : pn
        )
      );
    },
    [setProjectNodes]
  );

  // On edge connect
  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        ...connection,
        id: `e_${connection.source}_${connection.target}_${Date.now()}`,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        labelStyle: { fill: '#cbd5e1', fontSize: 10, fontWeight: 600 },
        labelBgStyle: { fill: '#0f172a', stroke: '#334155', strokeWidth: 1, rx: 6, ry: 6 },
        labelBgPadding: [6, 4],
      };
      setEdges((eds) => addEdge(newEdge, eds));
      setProjectEdges((prev) => [
        ...prev,
        {
          id: newEdge.id,
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle,
          animated: true,
        },
      ]);
    },
    [setEdges, setProjectEdges]
  );

  // Node Click (Open Config Inspector)
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const pNode = projectNodes.find((n) => n.id === node.id);
      if (pNode) {
        setSelectedNode({
          id: pNode.id,
          type: pNode.data.type || pNode.type,
          data: pNode.data,
        });
      }
    },
    [projectNodes]
  );

  // On Nodes Delete
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      const deletedIds = new Set(deleted.map((d) => d.id));
      setProjectNodes((prev) => prev.filter((n) => !deletedIds.has(n.id)));
      setProjectEdges((prev) =>
        prev.filter((e) => !deletedIds.has(e.source) && !deletedIds.has(e.target))
      );
      if (selectedNode && deletedIds.has(selectedNode.id)) {
        setSelectedNode(null);
      }
    },
    [selectedNode, setProjectNodes, setProjectEdges]
  );

  // On Edges Delete
  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      const deletedIds = new Set(deleted.map((d) => d.id));
      setProjectEdges((prev) => prev.filter((e) => !deletedIds.has(e.id)));
    },
    [setProjectEdges]
  );

  // Palette Add Node Handler
  const handleAddNode = (type: FlowNodeType, label: string) => {
    const id = `node_${type.toLowerCase()}_${Date.now()}`;
    const position = {
      x: 250 + (projectNodes.length % 5) * 60,
      y: 150 + (projectNodes.length % 4) * 60,
    };

    const defaultData: FlowNodeData = {
      label,
      type,
    };

    if (type === 'ACTION') defaultData.actionDurationSec = 30;
    if (type === 'EARN') {
      defaultData.earnCurrencyId = currencies[0]?.id;
      defaultData.earnAmountMin = 20;
      defaultData.earnAmountMax = 40;
    }
    if (type === 'SPEND') {
      defaultData.spendCurrencyId = currencies[0]?.id;
      defaultData.spendAmount = 20;
    }
    if (type === 'CONDITION') {
      defaultData.conditionType = 'currency_gte';
      defaultData.conditionThreshold = 50;
    }
    if (type === 'SHOP_VISIT') defaultData.shopPurchaseProbability = 45;
    if (type === 'CHANCE') {
      defaultData.chanceBranches = [
        { label: 'Win', probability: 60 },
        { label: 'Lose', probability: 40 },
      ];
    }
    if (type === 'END') defaultData.endReason = 'quit';

    const compType = toComponentNodeType(type);
    const newFlowNode: FlowNode = {
      id,
      type: compType,
      position,
      data: defaultData,
    };

    addProjectNode(newFlowNode);
  };

  const handleUpdateNodeData = (nodeId: string, updates: Partial<FlowNodeData>) => {
    updateProjectNodeData(nodeId, updates);
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n))
    );
    if (selectedNode?.id === nodeId) {
      setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, ...updates } } : null));
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    deleteProjectNode(nodeId);
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setSelectedNode(null);
  };

  return (
    <div className="relative w-full h-[600px] bg-[#07090e] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        className="bg-[#07090e]"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#1e293b" />
        <Controls className="!bg-slate-900 !border-slate-800 !rounded-xl !shadow-xl" />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor="#6366f1"
          maskColor="rgba(7, 9, 14, 0.8)"
          className="!bg-slate-900 !border-slate-800 !rounded-2xl !overflow-hidden !shadow-2xl"
        />

        {/* Node Palette Toolbar Panel */}
        <Panel position="top-left" className="m-3">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-2xl shadow-2xl flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 px-2 select-none tracking-wider">
              Add Node:
            </span>

            <button
              type="button"
              onClick={() => handleAddNode('START', 'Game Launch')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Start
            </button>

            <button
              type="button"
              onClick={() => handleAddNode('ACTION', 'Player Activity')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/30 transition-all active:scale-95"
            >
              <Activity className="w-3.5 h-3.5" /> Action
            </button>

            <button
              type="button"
              onClick={() => handleAddNode('EARN', 'Collect Reward')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all active:scale-95"
            >
              🪙 Earn
            </button>

            <button
              type="button"
              onClick={() => handleAddNode('SPEND', 'Upgrade Sink')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl border border-rose-500/30 transition-all active:scale-95"
            >
              <CreditCard className="w-3.5 h-3.5" /> Spend
            </button>

            <button
              type="button"
              onClick={() => handleAddNode('SHOP_VISIT', 'Visit Shop')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 text-xs font-bold rounded-xl border border-pink-500/30 transition-all active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Shop
            </button>

            <button
              type="button"
              onClick={() => handleAddNode('CONDITION', 'Check State')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 transition-all active:scale-95"
            >
              <GitBranch className="w-3.5 h-3.5" /> Condition
            </button>

            <button
              type="button"
              onClick={() => handleAddNode('CHANCE', 'Probability Roll')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold rounded-xl border border-purple-500/30 transition-all active:scale-95"
            >
              <Percent className="w-3.5 h-3.5" /> Chance
            </button>

            <button
              type="button"
              onClick={() => handleAddNode('END', 'Session Terminus')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all active:scale-95"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" /> End
            </button>
          </div>
        </Panel>
      </ReactFlow>

      {/* Selected Node Inspector Drawer */}
      <NodeConfigDrawer
        selectedNode={selectedNode}
        onClose={() => setSelectedNode(null)}
        onUpdateNodeData={handleUpdateNodeData}
        onDeleteNode={handleDeleteNode}
        currencies={currencies}
        shopItems={shopItems}
      />
    </div>
  );
};
