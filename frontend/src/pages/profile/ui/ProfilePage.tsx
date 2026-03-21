import { useParams, Link } from 'react-router-dom';
import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Calendar, Upload, ShoppingBag, Award, Check, Lock as LockIcon, Play, CircleDot, Clock, BookOpen, ArrowRight, Zap, X, ChevronDown } from 'lucide-react';
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
  ReactFlowProvider,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAppSelector } from '../../../app/store/hooks';
import { selectAllUsers } from '../../../entities/user';
import { selectAllMaterials } from '../../../entities/material';
import { selectCurrentUser, selectIsAuthenticated } from '../../../features/auth';
import { selectPurchasedIds } from '../../../features/buy-material';
import { selectAllAchievements } from '../../../entities/achievement';
import { MaterialCard } from '../../../entities/material/ui/MaterialCard';
import { PageTransition, GlassCard, Tabs, Badge, CodeCoinIcon, StaggerContainer, staggerItemVariants, Button } from '../../../shared/ui';
import { formatDate, cn } from '../../../shared/lib';
import { mockRoadmapTracks, type RoadmapNode as RoadmapNodeType, type RoadmapTrack } from '../../../shared/api/mocks/roadmap';

const SKILL_COLORS: Record<string, string> = {
  Frontend: '#61DAFB',
  Backend: '#00ADD8',
  DevOps: '#2496ED',
  'Data Science': '#FF6F00',
  Mobile: '#A855F7',
  Security: '#FF1744',
};

function SkillRadar({ skills }: { skills: Record<string, number> }) {
  const entries = Object.entries(skills);
  const cx = 120, cy = 120, r = 90;
  const angleStep = (2 * Math.PI) / entries.length;

  const points = entries.map(([, val], i) => {
    const angle = i * angleStep - Math.PI / 2;
    const dist = (val / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  });

  const labelPoints = entries.map(([name], i) => {
    const angle = i * angleStep - Math.PI / 2;
    const dist = r + 20;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle), name };
  });

  const polygon = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[280px] mx-auto">
      {/* Grid circles */}
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={entries.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const dist = scale * r;
            return `${cx + dist * Math.cos(angle)},${cy + dist * Math.sin(angle)}`;
          }).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
      ))}
      {/* Axes */}
      {entries.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return (
          <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        );
      })}
      {/* Data polygon */}
      <motion.polygon
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        points={polygon}
        fill="url(#radar-gradient)"
        fillOpacity="0.15"
        stroke="url(#radar-gradient)"
        strokeWidth="2"
      />
      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={SKILL_COLORS[entries[i][0]] || '#39FF14'} />
      ))}
      {/* Labels */}
      {labelPoints.map((p, i) => (
        <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
          className="text-[9px] fill-white/40">{p.name}</text>
      ))}
      <defs>
        <linearGradient id="radar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#39FF14" />
          <stop offset="100%" stopColor="#00F0FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ---- Roadmap Graph Components ----
function RoadmapGraphNode({ data }: NodeProps) {
  const node = data.node as RoadmapNodeType;
  const onSelect = data.onSelect as (n: RoadmapNodeType) => void;

  const statusIcon = {
    completed: <Check size={14} className="text-accent-green" />,
    in_progress: <Play size={12} className="text-accent-cyan" />,
    available: <CircleDot size={12} className="text-white/50" />,
    locked: <LockIcon size={12} className="text-white/20" />,
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
          'w-[200px] rounded-2xl border-2 bg-surface-900/95 backdrop-blur-sm p-3 transition-all cursor-pointer',
          borderColor[node.status],
          node.status !== 'locked' && 'hover:scale-[1.02]',
        )}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <div className={cn(
              'w-6 h-6 rounded-md flex items-center justify-center',
              node.status === 'completed' && 'bg-accent-green/15',
              node.status === 'in_progress' && 'bg-accent-cyan/15',
              node.status === 'available' && 'bg-white/[0.06]',
              node.status === 'locked' && 'bg-white/[0.03]',
            )}>
              {statusIcon[node.status]}
            </div>
            <Badge variant={diffColor as 'green' | 'cyan' | 'orange'} size="sm">{node.difficulty}</Badge>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-white/25">
            <Clock size={8} />
            {node.estimatedHours}ч
          </div>
        </div>
        <h4 className="text-[11px] font-bold leading-tight mb-0.5">{node.title}</h4>
        <p className="text-[9px] text-white/30 leading-snug line-clamp-2">{node.description}</p>
        {node.status === 'in_progress' && (
          <div className="mt-1.5">
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full bg-accent-cyan" style={{ width: `${node.progress}%` }} />
            </div>
          </div>
        )}
        {node.status === 'completed' && (
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-accent-green flex items-center justify-center shadow-lg">
            <Check size={10} className="text-surface-900" />
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-3 !h-3" />
    </>
  );
}

const roadmapNodeTypes = { roadmapNode: RoadmapGraphNode };

function buildProfileFlowData(
  track: RoadmapTrack,
  onSelect: (node: RoadmapNodeType) => void,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const NODE_WIDTH = 200;
  const NODE_HEIGHT_GAP = 150;

  const levels: Map<string, number> = new Map();

  function getLevel(nodeId: string, visited = new Set<string>()): number {
    if (levels.has(nodeId)) return levels.get(nodeId)!;
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);
    const node = track.nodes.find((n) => n.id === nodeId);
    if (!node || node.dependencies.length === 0) { levels.set(nodeId, 0); return 0; }
    const maxDepLevel = Math.max(
      ...node.dependencies
        .filter((depId) => track.nodes.some((n) => n.id === depId))
        .map((depId) => getLevel(depId, visited) + 1)
    );
    levels.set(nodeId, maxDepLevel);
    return maxDepLevel;
  }

  track.nodes.forEach((n) => getLevel(n.id));

  const levelGroups: Map<number, RoadmapNodeType[]> = new Map();
  track.nodes.forEach((n) => {
    const lvl = levels.get(n.id) || 0;
    if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
    levelGroups.get(lvl)!.push(n);
  });

  levelGroups.forEach((groupNodes, level) => {
    groupNodes.forEach((node, indexInLevel) => {
      const groupWidth = groupNodes.length * (NODE_WIDTH + 40);
      const startX = 400 - groupWidth / 2 + (NODE_WIDTH + 40) / 2;

      nodes.push({
        id: node.id,
        type: 'roadmapNode',
        position: { x: startX + indexInLevel * (NODE_WIDTH + 40), y: level * NODE_HEIGHT_GAP + 20 },
        data: { node, trackColor: track.color, onSelect },
      });

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
              width: 14,
              height: 14,
            },
          });
        }
      });
    });
  });

  return { nodes, edges };
}

function RoadmapNodeDetail({ node, onClose }: { node: RoadmapNodeType; onClose: () => void }) {
  const diffColor = node.difficulty === 'junior' ? 'green' : node.difficulty === 'middle' ? 'cyan' : 'orange';
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute right-3 top-3 bottom-3 w-[280px] z-20 overflow-y-auto custom-scrollbar"
    >
      <GlassCard className="h-fit">
        <div className="flex items-start justify-between mb-3">
          <Badge variant={diffColor as 'green' | 'cyan' | 'orange'}>{node.difficulty}</Badge>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.06] text-white/30"><X size={12} /></button>
        </div>
        <h3 className="text-sm font-bold mb-1.5">{node.title}</h3>
        <p className="text-xs text-white/40 leading-relaxed mb-3">{node.description}</p>
        <div className={cn(
          'px-2.5 py-1.5 rounded-lg text-[11px] font-medium mb-3',
          node.status === 'completed' && 'bg-accent-green/10 text-accent-green',
          node.status === 'in_progress' && 'bg-accent-cyan/10 text-accent-cyan',
          node.status === 'available' && 'bg-white/[0.04] text-white/50',
        )}>
          {node.status === 'completed' && '✓ Пройдено'}
          {node.status === 'in_progress' && `▶ В процессе — ${node.progress}%`}
          {node.status === 'available' && '○ Доступно'}
        </div>
        {node.status === 'in_progress' && (
          <div className="mb-3">
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-green" style={{ width: `${node.progress}%` }} />
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2 rounded-lg bg-white/[0.02] text-center">
            <p className="text-sm font-bold">{node.estimatedHours}ч</p>
            <p className="text-[9px] text-white/25">Время</p>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.02] text-center">
            <p className="text-sm font-bold">{node.skills.length}</p>
            <p className="text-[9px] text-white/25">Навыков</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {node.skills.map((s) => (
            <span key={s} className="px-2 py-0.5 rounded-md text-[10px] bg-white/[0.04] text-white/50">{s}</span>
          ))}
        </div>
        {node.materialIds.length > 0 && (
          <div className="mb-3">
            {node.materialIds.map((matId) => (
              <Link key={matId} to={`/catalog/${matId.replace('mat-', '')}`} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-xs text-accent-cyan">
                <BookOpen size={10} /><span className="flex-1">Перейти к курсу</span><ArrowRight size={10} />
              </Link>
            ))}
          </div>
        )}
        {node.status === 'available' && <Button className="w-full" size="sm" icon={<Play size={10} />}>Начать</Button>}
        {node.status === 'in_progress' && <Button className="w-full" size="sm" variant="secondary" icon={<Zap size={10} />}>Продолжить · {node.progress}%</Button>}
      </GlassCard>
    </motion.div>
  );
}

function ProfileRoadmapGraph() {
  const [activeTrackId, setActiveTrackId] = useState(mockRoadmapTracks[0].id);
  const [selectedNode, setSelectedNode] = useState<RoadmapNodeType | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const activeTrack = mockRoadmapTracks.find((t) => t.id === activeTrackId) || mockRoadmapTracks[0];
  const completed = activeTrack.nodes.filter((n) => n.status === 'completed').length;
  const total = activeTrack.nodes.length;

  const handleSelect = useCallback((node: RoadmapNodeType) => {
    setSelectedNode(node);
  }, []);

  const { nodes, edges } = useMemo(
    () => buildProfileFlowData(activeTrack, handleSelect),
    [activeTrack, handleSelect]
  );

  return (
    <div>
      {/* Track selector dropdown */}
      <div className="flex items-center justify-between mb-3">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] transition-all text-sm"
          >
            <span>{activeTrack.emoji}</span>
            <span className="font-medium">{activeTrack.title}</span>
            <Badge variant="cyan" size="sm">{completed}/{total}</Badge>
            <ChevronDown size={14} className={cn('text-white/30 transition-transform', dropdownOpen && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                className="absolute left-0 top-full mt-1 w-72 rounded-xl border border-white/[0.08] bg-surface-900/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
              >
                {mockRoadmapTracks.map((track) => {
                  const tc = track.nodes.filter((n) => n.status === 'completed').length;
                  const tt = track.nodes.length;
                  const pct = Math.round((tc / tt) * 100);
                  return (
                    <button
                      key={track.id}
                      onClick={() => { setActiveTrackId(track.id); setDropdownOpen(false); setSelectedNode(null); }}
                      className={cn(
                        'w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-white/[0.04] transition-colors',
                        track.id === activeTrackId && 'bg-white/[0.06]'
                      )}
                    >
                      <span className="text-lg">{track.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold">{track.title}</p>
                        <p className="text-[10px] text-white/25 truncate">{track.description}</p>
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: track.color }}>{pct}%</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-green" /> Пройдено</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-cyan" /> В процессе</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/20" /> Осталось</span>
        </div>
      </div>

      {/* Graph */}
      <div className="h-[500px] rounded-2xl border border-white/[0.06] overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={roadmapNodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          onPaneClick={() => setSelectedNode(null)}
        >
          <Background color="rgba(255,255,255,0.03)" gap={30} />
          <Controls
            showInteractive={false}
            className="!bg-surface-900/80 !border-white/[0.06] !rounded-xl !shadow-xl [&>button]:!bg-transparent [&>button]:!border-white/[0.06] [&>button]:!text-white/40 [&>button:hover]:!bg-white/[0.06]"
          />
          <MiniMap
            nodeColor={(n) => {
              const nd = (n.data?.node as RoadmapNodeType);
              if (!nd) return 'rgba(255,255,255,0.1)';
              if (nd.status === 'completed') return '#39FF14';
              if (nd.status === 'in_progress') return '#00F0FF';
              if (nd.status === 'available') return 'rgba(255,255,255,0.2)';
              return 'rgba(255,255,255,0.05)';
            }}
            maskColor="rgba(10,10,11,0.85)"
            className="!bg-surface-900/80 !border-white/[0.06] !rounded-xl"
            pannable
            zoomable
          />
        </ReactFlow>
        <AnimatePresence>
          {selectedNode && <RoadmapNodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const users = useAppSelector(selectAllUsers);
  const materials = useAppSelector(selectAllMaterials);
  const currentUser = useAppSelector(selectCurrentUser);
  const isAuth = useAppSelector(selectIsAuthenticated);
  const purchasedIds = useAppSelector(selectPurchasedIds);
  const achievements = useAppSelector(selectAllAchievements);
  const [activeTab, setActiveTab] = useState('uploads');

  const profileUser = id ? users.find((u) => u.id === id) : currentUser;

  if (!profileUser) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 pt-24 text-center py-32">
          <h1 className="text-2xl font-bold">Пользователь не найден</h1>
          {!isAuth && <Link to="/login" className="text-accent-cyan text-sm mt-4 inline-block">Войти</Link>}
        </div>
      </PageTransition>
    );
  }

  const userMaterials = materials.filter((m) => m.authorId === profileUser.id);
  const purchasedMaterials = materials.filter((m) => purchasedIds.includes(m.id));
  const userAchievements = achievements.filter((a) => profileUser.achievementIds.includes(a.id));

  const RARITY_COLORS = {
    common: 'border-white/10 bg-white/[0.02]',
    rare: 'border-blue-500/20 bg-blue-500/5',
    epic: 'border-purple-500/20 bg-purple-500/5',
    legendary: 'border-yellow-500/20 bg-yellow-500/5 glow-green',
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Profile header */}
        <GlassCard className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
          <motion.img
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={profileUser.avatarUrl}
            alt=""
            className="w-24 h-24 rounded-2xl"
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{profileUser.name}</h1>
              <Badge variant="cyan" size="md">{profileUser.levelTitle}</Badge>
            </div>
            <p className="text-sm text-white/30 mb-3">@{profileUser.username}</p>
            <p className="text-sm text-white/50 mb-4">{profileUser.bio}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm">
              <span className="flex items-center gap-1"><Star size={14} className="text-yellow-400" /> {profileUser.rating}</span>
              <span className="flex items-center gap-1"><CodeCoinIcon size={14} /> <span className="text-accent-green font-semibold">{profileUser.codeCoins}</span></span>
              <span className="flex items-center gap-1 text-white/30"><Upload size={14} /> {profileUser.uploadsCount}</span>
              <span className="flex items-center gap-1 text-white/30"><ShoppingBag size={14} /> {profileUser.purchasesCount}</span>
              <span className="flex items-center gap-1 text-white/30"><Calendar size={14} /> {formatDate(profileUser.joinedAt)}</span>
            </div>
          </div>
        </GlassCard>

        {/* Skills + Achievements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <GlassCard>
            <h3 className="text-sm font-semibold mb-4">Карта навыков</h3>
            <SkillRadar skills={profileUser.skills} />
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {profileUser.techStack.map((tech) => (
                <Badge key={tech} variant="cyan" size="sm">{tech}</Badge>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Award size={14} className="text-accent-green" /> Достижения ({userAchievements.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {userAchievements.map((ach) => (
                <div key={ach.id} className={cn('p-3 rounded-xl border text-center', RARITY_COLORS[ach.rarity])}>
                  <span className="text-2xl block mb-1">{ach.icon}</span>
                  <p className="text-xs font-medium">{ach.name}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{ach.description}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'uploads', label: `Загрузки (${userMaterials.length})` },
            ...(profileUser.id === currentUser?.id ? [
              { id: 'purchases', label: `Покупки (${purchasedMaterials.length})` },
              { id: 'roadmap', label: 'Роадмапы' },
            ] : []),
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="mb-6"
        />

        {activeTab === 'uploads' && (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userMaterials.map((mat) => (
              <motion.div key={mat.id} variants={staggerItemVariants}>
                <MaterialCard material={mat} author={profileUser} />
              </motion.div>
            ))}
            {userMaterials.length === 0 && <p className="text-white/30 text-center py-12 col-span-full">Нет загруженных материалов</p>}
          </StaggerContainer>
        )}

        {activeTab === 'purchases' && (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchasedMaterials.map((mat) => (
              <motion.div key={mat.id} variants={staggerItemVariants}>
                <MaterialCard material={mat} author={users.find((u) => u.id === mat.authorId)} />
              </motion.div>
            ))}
            {purchasedMaterials.length === 0 && <p className="text-white/30 text-center py-12 col-span-full">Нет покупок</p>}
          </StaggerContainer>
        )}

        {activeTab === 'roadmap' && (
          <ReactFlowProvider>
            <ProfileRoadmapGraph />
          </ReactFlowProvider>
        )}
      </div>
    </PageTransition>
  );
}
