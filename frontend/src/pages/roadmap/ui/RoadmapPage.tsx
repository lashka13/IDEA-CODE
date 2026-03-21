import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  //useReactFlow,
  ReactFlowProvider,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Lock,
  BookOpen,
  Clock,
  ArrowRight,
  Play,
  CircleDot,
  X,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageTransition, GlassCard, Button, Badge } from '../../../shared/ui';
import { cn } from '../../../shared/lib';
import { mockRoadmapTracks, type RoadmapNode as RoadmapNodeType, type RoadmapTrack } from '../../../shared/api/mocks/roadmap';

// ---- Custom Node Component ----
function RoadmapGraphNode({ data }: NodeProps) {
  const node = data.node as RoadmapNodeType;
  //const trackColor = data.trackColor as string;
  const onSelect = data.onSelect as (n: RoadmapNodeType) => void;

  const statusIcon = {
    completed: <Check size={14} className="text-accent-green" />,
    in_progress: <Play size={12} className="text-accent-cyan" />,
    available: <CircleDot size={12} className="text-white/50" />,
    locked: <Lock size={12} className="text-white/20" />,
  };

  const borderColor = {
    completed: 'border-accent-green/50 shadow-[0_0_20px_rgba(57,255,20,0.15)]',
    in_progress: 'border-accent-cyan/50 shadow-[0_0_20px_rgba(0,240,255,0.15)]',
    available: 'border-white/15 hover:border-white/30',
    locked: 'border-white/[0.06] opacity-50',
  };

  const diffColor = node.difficulty === 'junior' ? 'green' : node.difficulty === 'middle' ? 'cyan' : 'orange';

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-3 !h-3" />
      <div
        onClick={() => node.status !== 'locked' && onSelect(node)}
        className={cn(
          'w-[220px] rounded-2xl border-2 bg-surface-900/95 backdrop-blur-sm p-4 transition-all cursor-pointer',
          borderColor[node.status],
          node.status !== 'locked' && 'hover:scale-[1.02]',
        )}
      >
        {/* Status + difficulty */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center',
              node.status === 'completed' && 'bg-accent-green/15',
              node.status === 'in_progress' && 'bg-accent-cyan/15',
              node.status === 'available' && 'bg-white/[0.06]',
              node.status === 'locked' && 'bg-white/[0.03]',
            )}>
              {statusIcon[node.status]}
            </div>
            <Badge variant={diffColor as 'green' | 'cyan' | 'orange'} size="sm">{node.difficulty}</Badge>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/25">
            <Clock size={8} />
            {node.estimatedHours}ч
          </div>
        </div>

        {/* Title */}
        <h4 className="text-xs font-bold leading-tight mb-1">{node.title}</h4>
        <p className="text-[10px] text-white/30 leading-snug line-clamp-2">{node.description}</p>

        {/* Progress bar */}
        {node.status === 'in_progress' && (
          <div className="mt-2">
            <div className="flex justify-between text-[9px] text-white/25 mb-0.5">
              <span>Прогресс</span>
              <span className="text-accent-cyan">{node.progress}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full bg-accent-cyan" style={{ width: `${node.progress}%` }} />
            </div>
          </div>
        )}

        {/* Skills preview */}
        <div className="flex flex-wrap gap-1 mt-2">
          {node.skills.slice(0, 3).map((s) => (
            <span key={s} className="px-1.5 py-0.5 rounded text-[8px] bg-white/[0.04] text-white/30">{s}</span>
          ))}
          {node.skills.length > 3 && (
            <span className="px-1.5 py-0.5 rounded text-[8px] bg-white/[0.04] text-white/20">+{node.skills.length - 3}</span>
          )}
        </div>

        {/* Completed check */}
        {node.status === 'completed' && (
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent-green flex items-center justify-center shadow-lg">
            <Check size={12} className="text-surface-900" />
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-3 !h-3" />
    </>
  );
}

const nodeTypes = { roadmapNode: RoadmapGraphNode };

// ---- Layout helper: auto-position nodes in a tree layout ----
function buildFlowData(
  tracks: RoadmapTrack[],
  onSelect: (node: RoadmapNodeType) => void,
  activeTrackId: string | null,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const filteredTracks = activeTrackId
    ? tracks.filter((t) => t.id === activeTrackId)
    : tracks;

  const TRACK_GAP = 320;
  const NODE_WIDTH = 220;
  const NODE_HEIGHT_GAP = 160;

  filteredTracks.forEach((track, trackIndex) => {
    const xOffset = activeTrackId
      ? 400
      : trackIndex * TRACK_GAP + 100;

    // Build a level map based on dependencies
    const levels: Map<string, number> = new Map();

    function getLevel(nodeId: string, visited = new Set<string>()): number {
      if (levels.has(nodeId)) return levels.get(nodeId)!;
      if (visited.has(nodeId)) return 0;
      visited.add(nodeId);

      const node = track.nodes.find((n) => n.id === nodeId);
      if (!node || node.dependencies.length === 0) {
        levels.set(nodeId, 0);
        return 0;
      }

      const maxDepLevel = Math.max(
        ...node.dependencies
          .filter((depId) => track.nodes.some((n) => n.id === depId))
          .map((depId) => getLevel(depId, visited) + 1)
      );
      levels.set(nodeId, maxDepLevel);
      return maxDepLevel;
    }

    track.nodes.forEach((n) => getLevel(n.id));

    // Group by level
    const levelGroups: Map<number, RoadmapNodeType[]> = new Map();
    track.nodes.forEach((n) => {
      const lvl = levels.get(n.id) || 0;
      if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
      levelGroups.get(lvl)!.push(n);
    });

    levelGroups.forEach((groupNodes, level) => {
      groupNodes.forEach((node, indexInLevel) => {
        const groupWidth = groupNodes.length * (NODE_WIDTH + 40);
        const startX = xOffset - groupWidth / 2 + (NODE_WIDTH + 40) / 2;

        nodes.push({
          id: node.id,
          type: 'roadmapNode',
          position: {
            x: startX + indexInLevel * (NODE_WIDTH + 40),
            y: level * NODE_HEIGHT_GAP + 80,
          },
          data: { node, trackColor: track.color, onSelect },
        });

        // Edges from dependencies
        node.dependencies.forEach((depId) => {
          if (track.nodes.some((n) => n.id === depId)) {
            const depNode = track.nodes.find((n) => n.id === depId);
            const isCompleted = depNode?.status === 'completed';

            edges.push({
              id: `${depId}-${node.id}`,
              source: depId,
              target: node.id,
              type: 'smoothstep',
              animated: node.status === 'in_progress',
              style: {
                stroke: isCompleted ? '#39FF14' : node.status === 'in_progress' ? '#00F0FF' : 'rgba(255,255,255,0.08)',
                strokeWidth: isCompleted ? 2 : 1.5,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: isCompleted ? '#39FF14' : node.status === 'in_progress' ? '#00F0FF' : 'rgba(255,255,255,0.15)',
                width: 16,
                height: 16,
              },
            });
          }
        });
      });
    });
  });

  return { nodes, edges };
}

// ---- Detail Panel ----
function NodeDetailPanel({ node, onClose }: { node: RoadmapNodeType; onClose: () => void }) {
  const diffColor = node.difficulty === 'junior' ? 'green' : node.difficulty === 'middle' ? 'cyan' : 'orange';

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="absolute right-4 top-4 bottom-4 w-[320px] z-20 overflow-y-auto custom-scrollbar"
    >
      <GlassCard className="h-fit">
        <div className="flex items-start justify-between mb-4">
          <Badge variant={diffColor as 'green' | 'cyan' | 'orange'}>{node.difficulty}</Badge>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.06] text-white/30">
            <X size={14} />
          </button>
        </div>

        <h3 className="text-lg font-bold mb-2">{node.title}</h3>
        <p className="text-sm text-white/40 leading-relaxed mb-4">{node.description}</p>

        {/* Status */}
        <div className={cn(
          'px-3 py-2 rounded-xl text-xs font-medium mb-4',
          node.status === 'completed' && 'bg-accent-green/10 text-accent-green',
          node.status === 'in_progress' && 'bg-accent-cyan/10 text-accent-cyan',
          node.status === 'available' && 'bg-white/[0.04] text-white/50',
        )}>
          {node.status === 'completed' && '✓ Пройдено'}
          {node.status === 'in_progress' && `▶ В процессе — ${node.progress}%`}
          {node.status === 'available' && '○ Доступно для изучения'}
        </div>

        {/* Progress */}
        {node.status === 'in_progress' && (
          <div className="mb-4">
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-green" style={{ width: `${node.progress}%` }} />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-3 rounded-xl bg-white/[0.02] text-center">
            <p className="text-lg font-bold">{node.estimatedHours}ч</p>
            <p className="text-[10px] text-white/25">Оценка времени</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] text-center">
            <p className="text-lg font-bold">{node.skills.length}</p>
            <p className="text-[10px] text-white/25">Навыков</p>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-4">
          <p className="text-xs text-white/30 mb-2">Навыки</p>
          <div className="flex flex-wrap gap-1.5">
            {node.skills.map((skill) => (
              <span key={skill} className="px-2.5 py-1 rounded-lg text-xs bg-white/[0.04] text-white/50">{skill}</span>
            ))}
          </div>
        </div>

        {/* Materials */}
        {node.materialIds.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-white/30 mb-2">Материалы</p>
            {node.materialIds.map((matId) => (
              <Link
                key={matId}
                to={`/catalog/${matId.replace('mat-', '')}`}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-xs text-accent-cyan"
              >
                <BookOpen size={12} />
                <span className="flex-1">Перейти к курсу</span>
                <ArrowRight size={10} />
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        {node.status === 'available' && (
          <Button className="w-full" icon={<Play size={12} />}>Начать изучение</Button>
        )}
        {node.status === 'in_progress' && (
          <Button className="w-full" variant="secondary" icon={<Zap size={12} />}>
            Продолжить · {node.progress}%
          </Button>
        )}
      </GlassCard>
    </motion.div>
  );
}

// ---- Main Graph Component ----
function RoadmapGraph() {
  const [selectedNode, setSelectedNode] = useState<RoadmapNodeType | null>(null);
  const [activeTrack, setActiveTrack] = useState<string | null>(null);

  const handleSelect = useCallback((node: RoadmapNodeType) => {
    setSelectedNode(node);
  }, []);

  const { nodes, edges } = useMemo(
    () => buildFlowData(mockRoadmapTracks, handleSelect, activeTrack),
    [handleSelect, activeTrack]
  );

  const totalNodes = mockRoadmapTracks.reduce((s, t) => s + t.nodes.length, 0);
  const completedNodes = mockRoadmapTracks.reduce((s, t) => s + t.nodes.filter((n) => n.status === 'completed').length, 0);
  const inProgressNodes = mockRoadmapTracks.reduce((s, t) => s + t.nodes.filter((n) => n.status === 'in_progress').length, 0);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 sm:px-6 pt-24 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Роадмап</h1>
              <p className="text-sm text-white/40">Интерактивный граф развития — кликай на узлы для деталей</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-green" />
                <span className="text-white/40">{completedNodes} пройдено</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-cyan" />
                <span className="text-white/40">{inProgressNodes} в процессе</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="text-white/40">{totalNodes - completedNodes - inProgressNodes} осталось</span>
              </div>
            </div>
          </div>

          {/* Track selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTrack(null)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-medium transition-all border',
                !activeTrack
                  ? 'bg-white/[0.08] text-white border-white/10'
                  : 'text-white/30 border-transparent hover:text-white/50'
              )}
            >
              Все треки
            </button>
            {mockRoadmapTracks.map((track) => {
              const completed = track.nodes.filter((n) => n.status === 'completed').length;
              return (
                <button
                  key={track.id}
                  onClick={() => setActiveTrack(activeTrack === track.id ? null : track.id)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-medium transition-all border flex items-center gap-2',
                    activeTrack === track.id
                      ? 'bg-white/[0.08] text-white border-white/10'
                      : 'text-white/30 border-transparent hover:text-white/50'
                  )}
                >
                  <span>{track.emoji}</span>
                  {track.title}
                  <span className="text-[10px] text-white/20">{completed}/{track.nodes.length}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          className="roadmap-flow"
          onPaneClick={() => setSelectedNode(null)}
        >
          <Background color="rgba(255,255,255,0.03)" gap={30} />
          <Controls
            showInteractive={false}
            className="!bg-surface-900/80 !border-white/[0.06] !rounded-xl !shadow-xl [&>button]:!bg-transparent [&>button]:!border-white/[0.06] [&>button]:!text-white/40 [&>button:hover]:!bg-white/[0.06]"
          />
          <MiniMap
            nodeColor={(n) => {
              const node = (n.data?.node as RoadmapNodeType);
              if (!node) return 'rgba(255,255,255,0.1)';
              if (node.status === 'completed') return '#39FF14';
              if (node.status === 'in_progress') return '#00F0FF';
              if (node.status === 'available') return 'rgba(255,255,255,0.2)';
              return 'rgba(255,255,255,0.05)';
            }}
            maskColor="rgba(10,10,11,0.85)"
            className="!bg-surface-900/80 !border-white/[0.06] !rounded-xl"
            pannable
            zoomable
          />
        </ReactFlow>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedNode && (
            <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---- Page wrapper with ReactFlowProvider ----
export default function RoadmapPage() {
  return (
    <PageTransition>
      <ReactFlowProvider>
        <RoadmapGraph />
      </ReactFlowProvider>
    </PageTransition>
  );
}
