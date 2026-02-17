import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Layers, Route, Plug, Database, Wrench, BookOpen, Key } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ── Data ──────────────────────────────────────────────

interface InventoryItem {
  name: string;
  category: string;
  purpose: string;
  status: string;
  agenticStatus: string;
  integration: string;
  route?: string;
  location?: string;
}

const PAGES: InventoryItem[] = [
  { name: 'Index', category: 'Core', purpose: 'Landing page', status: '✅ Live', agenticStatus: 'N/A', integration: 'Stripe', route: '/' },
  { name: 'Auth', category: 'Core', purpose: 'Authentication', status: '✅ Live', agenticStatus: 'N/A', integration: 'Supabase Auth', route: '/auth' },
  { name: 'Profile', category: 'Core', purpose: 'User profile', status: '✅ Live', agenticStatus: 'N/A', integration: 'Supabase', route: '/profile' },
  { name: 'Studio', category: 'Create', purpose: 'Unified AI Studio', status: '✅ Live', agenticStatus: 'L5 Agent', integration: 'Multi-API', route: '/studio' },
  { name: 'Generate', category: 'Create', purpose: 'Multi-mode music generation', status: '✅ Live', agenticStatus: 'L5 Agent', integration: 'AIML API', route: '/generate' },
  { name: 'SunoGenerator', category: 'Create', purpose: 'Suno API generation', status: '✅ Live', agenticStatus: 'Tool', integration: 'Suno API', route: '/generate-song-suno' },
  { name: 'ElevenLabsSinging', category: 'Create', purpose: 'ElevenLabs singing', status: '✅ Live', agenticStatus: 'Tool', integration: 'ElevenLabs', route: '/generate-song-elevenlabs-singing' },
  { name: 'InstrumentalGenerator', category: 'Create', purpose: 'Instrumental generation', status: '✅ Live', agenticStatus: 'Tool', integration: 'AIML API', route: '/generate-instrumental' },
  { name: 'BackingWithIntro', category: 'Create', purpose: 'Backing + intro generation', status: '✅ Live', agenticStatus: 'Tool', integration: 'AIML API', route: '/generate-backing-with-intro' },
  { name: 'AILyricsGeneratorPage', category: 'Create', purpose: 'AI lyrics in SA languages', status: '✅ Live', agenticStatus: 'Tool', integration: 'AIML API', route: '/ai-lyrics-generator' },
  { name: 'SoundEffectPage', category: 'Create', purpose: 'Sound effect generation', status: '✅ Live', agenticStatus: 'Tool', integration: 'AIML API', route: '/sound-effect' },
  { name: 'SunoStudioPage', category: 'Create', purpose: 'Full Suno workflow', status: '✅ Live', agenticStatus: 'Tool', integration: 'Suno API', route: '/suno-studio' },
  { name: 'TextToProduction', category: 'Create', purpose: 'Text → finished track', status: '✅ Live', agenticStatus: 'L5 Pipeline', integration: 'Multi-API', route: '/aura-x/text-to-production' },
  { name: 'DAW', category: 'Produce', purpose: 'Digital audio workstation', status: '✅ Live', agenticStatus: 'L5 Agent', integration: 'Tone.js + Web Audio', route: '/daw' },
  { name: 'AudioEditor', category: 'Produce', purpose: 'Waveform editor', status: '✅ Live', agenticStatus: 'Passive', integration: 'Web Audio API', route: '/audio-editor' },
  { name: 'AudioLab', category: 'Produce', purpose: 'Audio experiments', status: '✅ Live', agenticStatus: 'Passive', integration: 'Web Audio API', route: '/audio-lab' },
  { name: 'StemSplitterPage', category: 'Produce', purpose: 'AI stem separation', status: '✅ Live', agenticStatus: 'Tool', integration: 'Modal.com', route: '/stem-splitter' },
  { name: 'VocalRemoverPage', category: 'Produce', purpose: 'Vocal isolation', status: '✅ Live', agenticStatus: 'Tool', integration: 'Modal.com', route: '/vocal-remover' },
  { name: 'Amapianorize', category: 'Produce', purpose: 'Convert → Amapiano', status: '✅ Live', agenticStatus: 'Tool', integration: 'Multi-API', route: '/amapianorize' },
  { name: 'AmapianoPro', category: 'Produce', purpose: 'Pro Amapiano toolkit', status: '✅ Live', agenticStatus: 'L5 Agent', integration: 'Multi-API', route: '/amapiano-pro' },
  { name: 'MasteringStudio', category: 'Produce', purpose: 'AI mastering', status: '✅ Live', agenticStatus: 'Tool', integration: 'AIML API', route: '/master' },
  { name: 'Patterns', category: 'Produce', purpose: 'Pattern library', status: '✅ Live', agenticStatus: 'Passive', integration: 'Internal', route: '/patterns' },
  { name: 'Samples', category: 'Produce', purpose: 'Sample browser', status: '✅ Live', agenticStatus: 'Tool', integration: 'Supabase Storage', route: '/samples' },
  { name: 'VoiceLab', category: 'Produce', purpose: 'Voice cloning', status: '✅ Live', agenticStatus: 'Tool', integration: 'ElevenLabs', route: '/voice-lab' },
  { name: 'DJAgent', category: 'Produce', purpose: 'Autonomous DJ', status: '✅ Live', agenticStatus: 'L5 Agent', integration: 'Multi-API', route: '/dj-agent' },
  { name: 'Analyze', category: 'AI Tools', purpose: 'Audio analysis', status: '✅ Live', agenticStatus: 'Tool', integration: 'Essentia.js', route: '/analyze' },
  { name: 'AIHub', category: 'AI Tools', purpose: 'AI tools hub', status: '✅ Live', agenticStatus: 'Router', integration: 'N/A', route: '/ai-hub' },
  { name: 'AuraPlatform', category: 'AI Tools', purpose: 'Aura AI platform', status: '✅ Live', agenticStatus: 'L5 Agent', integration: 'Multi-API', route: '/aura' },
  { name: 'Level5Dashboard', category: 'AI Tools', purpose: 'Agent monitoring', status: '✅ Live', agenticStatus: 'L5 Monitor', integration: 'Internal', route: '/level5-dashboard' },
  { name: 'MLQuantize', category: 'AI Tools', purpose: 'Model quantization', status: '✅ Live', agenticStatus: 'Tool', integration: 'Modal.com', route: '/ml/quantize' },
  { name: 'SocialFeed', category: 'Distribute', purpose: 'Music social feed', status: '✅ Live', agenticStatus: 'Passive', integration: 'Supabase', route: '/social' },
  { name: 'CreatorHub', category: 'Distribute', purpose: 'Creator monetization', status: '✅ Live', agenticStatus: 'Passive', integration: 'Stripe', route: '/creator-hub' },
  { name: 'ReleaseManager', category: 'Distribute', purpose: 'Distribution', status: '✅ Live', agenticStatus: 'Tool', integration: 'Supabase', route: '/release' },
  { name: 'PromotionHub', category: 'Distribute', purpose: 'AI promotion', status: '✅ Live', agenticStatus: 'Tool', integration: 'AIML API', route: '/promote' },
  { name: 'Research', category: 'Research', purpose: 'Thesis research', status: '✅ Live', agenticStatus: 'Passive', integration: 'Supabase', route: '/research' },
  { name: 'TrainingDataCollection', category: 'Research', purpose: 'Training pipeline', status: '✅ Live', agenticStatus: 'Tool', integration: 'Supabase', route: '/training' },
  { name: 'UserStudy', category: 'Research', purpose: 'User study', status: '✅ Live', agenticStatus: 'Passive', integration: 'Supabase', route: '/user-study' },
  { name: 'Admin', category: 'Admin', purpose: 'Administration', status: '✅ Live', agenticStatus: 'N/A', integration: 'Supabase', route: '/admin' },
  { name: 'PluginDev', category: 'Admin', purpose: 'Plugin development', status: '✅ Live', agenticStatus: 'Tool', integration: 'WASM', route: '/plugin-dev' },
];

const EDGE_FUNCTIONS: InventoryItem[] = [
  { name: 'generate-music', category: 'Generation', purpose: 'Full music generation', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'AIML API' },
  { name: 'generate-instrumental', category: 'Generation', purpose: 'Instrumental tracks', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'AIML API' },
  { name: 'generate-lyrics', category: 'Generation', purpose: 'AI lyrics', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'AIML API' },
  { name: 'generate-song-suno', category: 'Generation', purpose: 'Suno generation', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'Suno API' },
  { name: 'generate-song-elevenlabs-singing', category: 'Generation', purpose: 'Singing voice', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'ElevenLabs' },
  { name: 'generate-song-with-vocals', category: 'Generation', purpose: 'Full vocal track', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'Multi-API' },
  { name: 'generate-sample', category: 'Generation', purpose: 'Sample generation', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'AIML API' },
  { name: 'generate-layer', category: 'Generation', purpose: 'Layer generation', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'AIML API' },
  { name: 'generate-backing-with-intro', category: 'Generation', purpose: 'Backing + intro', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'AIML API' },
  { name: 'neural-music-generation', category: 'Generation', purpose: 'Neural generation', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'AIML API' },
  { name: 'sound-effect-generator', category: 'Generation', purpose: 'Sound effects', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'AIML API' },
  { name: 'ai-music-generation', category: 'Generation', purpose: 'AI generation', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'AIML API' },
  { name: 'build-beat-around-loop', category: 'Generation', purpose: 'Beat building', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'AIML API' },
  { name: 'amapiano-subgenre-ai', category: 'Generation', purpose: 'Subgenre AI', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'AIML API' },
  { name: 'stem-separation', category: 'Processing', purpose: 'Stem separation', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'Modal.com' },
  { name: 'stem-splitter', category: 'Processing', purpose: 'Stem splitting', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'Modal.com' },
  { name: 'vocal-remover', category: 'Processing', purpose: 'Vocal removal', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'Modal.com' },
  { name: 'amapianorize-audio', category: 'Processing', purpose: 'Amapianorization', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'Multi-API' },
  { name: 'ai-mastering', category: 'Processing', purpose: 'AI mastering', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'AIML API' },
  { name: 'audio-format-converter', category: 'Processing', purpose: 'Format conversion', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'Internal' },
  { name: 'audio-to-midi', category: 'Processing', purpose: 'Audio → MIDI', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'Modal.com' },
  { name: 'analyze-audio', category: 'Analysis', purpose: 'Audio analysis', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'Internal' },
  { name: 'music-analysis', category: 'Analysis', purpose: 'Music features', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'Internal' },
  { name: 'essentia-deep-analysis', category: 'Analysis', purpose: 'Deep analysis', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'Essentia' },
  { name: 'pattern-analyzer', category: 'Analysis', purpose: 'Pattern detection', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'Internal' },
  { name: 'ai-chat', category: 'AI', purpose: 'AI chat', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'AIML API' },
  { name: 'aura-conductor-orchestration', category: 'AI', purpose: 'Workflow orchestration', status: '✅ Deployed', agenticStatus: 'L5 Agent', integration: 'Multi-API' },
  { name: 'dj-agent-brain', category: 'Agent', purpose: 'DJ agent reasoning', status: '✅ Deployed', agenticStatus: 'L5 Agent', integration: 'AIML API' },
  { name: 'modal-agent', category: 'Agent', purpose: 'Modal GPU agent', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'Modal.com' },
  { name: 'elevenlabs-tts', category: 'Voice', purpose: 'Text-to-speech', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'ElevenLabs' },
  { name: 'text-to-speech', category: 'Voice', purpose: 'TTS fallback', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'AIML API' },
  { name: 'voice-to-text', category: 'Voice', purpose: 'Speech recognition', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'AIML API' },
  { name: 'create-checkout', category: 'Billing', purpose: 'Stripe checkout', status: '✅ Deployed', agenticStatus: 'N/A', integration: 'Stripe' },
  { name: 'create-subscription', category: 'Billing', purpose: 'Subscription', status: '✅ Deployed', agenticStatus: 'N/A', integration: 'Stripe' },
  { name: 'check-subscription', category: 'Billing', purpose: 'Sub status check', status: '✅ Deployed', agenticStatus: 'N/A', integration: 'Stripe' },
  { name: 'get-personalized-feed', category: 'Social', purpose: 'Personalized feed', status: '✅ Deployed', agenticStatus: 'N/A', integration: 'DB function' },
  { name: 'rag-knowledge-search', category: 'AI', purpose: 'Vector search', status: '✅ Deployed', agenticStatus: 'Tool', integration: 'pgvector' },
  { name: 'send-performance-alert', category: 'Notify', purpose: 'Perf alerts', status: '✅ Deployed', agenticStatus: 'N/A', integration: 'Resend' },
];

const DB_TABLES: InventoryItem[] = [
  { name: 'profiles', category: 'Core', purpose: 'User profiles', status: '✅ RLS', agenticStatus: 'N/A', integration: 'Supabase Auth' },
  { name: 'subscribers', category: 'Core', purpose: 'Subscription state', status: '✅ RLS', agenticStatus: 'N/A', integration: 'Stripe' },
  { name: 'user_roles', category: 'Core', purpose: 'Role-based access', status: '✅ RLS', agenticStatus: 'N/A', integration: 'Internal' },
  { name: 'daw_projects', category: 'Produce', purpose: 'DAW projects', status: '✅ RLS', agenticStatus: 'N/A', integration: 'Internal' },
  { name: 'generated_samples', category: 'Create', purpose: 'Generated samples', status: '✅ RLS', agenticStatus: 'N/A', integration: 'Storage' },
  { name: 'social_posts', category: 'Social', purpose: 'Music posts', status: '✅ RLS', agenticStatus: 'N/A', integration: 'Internal' },
  { name: 'agent_executions', category: 'Agent', purpose: 'Agent runs', status: '✅ RLS', agenticStatus: 'L5', integration: 'Agent system' },
  { name: 'agent_memory', category: 'Agent', purpose: 'Agent memory', status: '✅ RLS', agenticStatus: 'L5', integration: 'Agent system' },
  { name: 'musical_vectors', category: 'Research', purpose: 'Embeddings (pgvector)', status: '✅ RLS', agenticStatus: 'N/A', integration: 'pgvector' },
  { name: 'sparse_inference_cache', category: 'Research', purpose: 'SIGE cache', status: '✅ RLS', agenticStatus: 'N/A', integration: 'Internal' },
  { name: 'distributed_inference_jobs', category: 'Research', purpose: 'DistriFusion jobs', status: '✅ RLS', agenticStatus: 'N/A', integration: 'Internal' },
  { name: 'test_history', category: 'Research', purpose: 'Test results', status: '✅ RLS', agenticStatus: 'N/A', integration: 'Internal' },
  { name: 'dj_library_tracks', category: 'DJ', purpose: 'DJ track library', status: '✅ RLS', agenticStatus: 'N/A', integration: 'Storage' },
  { name: 'dj_performance_plans', category: 'DJ', purpose: 'DJ set plans', status: '✅ RLS', agenticStatus: 'L5', integration: 'Agent' },
  { name: 'distribution_releases', category: 'Distribute', purpose: 'Release management', status: '✅ RLS', agenticStatus: 'N/A', integration: 'Internal' },
  { name: 'orders', category: 'Billing', purpose: 'Purchase orders', status: '✅ RLS', agenticStatus: 'N/A', integration: 'Stripe' },
  { name: 'ai_model_usage', category: 'Analytics', purpose: 'AI usage tracking', status: '✅ RLS', agenticStatus: 'N/A', integration: 'Internal' },
  { name: 'analytics_events', category: 'Analytics', purpose: 'Event tracking', status: '✅ RLS', agenticStatus: 'N/A', integration: 'Internal' },
];

const SECRETS: { name: string; service: string; usedBy: string }[] = [
  { name: 'AIML_API_KEY', service: 'AI/ML API', usedBy: 'Generation, analysis, chat functions' },
  { name: 'ELEVENLABS_API_KEY', service: 'ElevenLabs', usedBy: 'TTS, singing voice' },
  { name: 'SUNO_API_KEY', service: 'Suno', usedBy: 'Music generation' },
  { name: 'STRIPE_SECRET_KEY', service: 'Stripe', usedBy: 'Billing edge functions' },
  { name: 'OPENAI_API_KEY', service: 'OpenAI', usedBy: 'Fallback AI' },
  { name: 'REPLICATE_API_KEY', service: 'Replicate', usedBy: 'ML models' },
  { name: 'RESEND_API_KEY', service: 'Resend', usedBy: 'Email notifications' },
  { name: 'LOVABLE_API_KEY', service: 'Lovable', usedBy: 'Platform API' },
];

// ── Helpers ──────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Core: 'bg-muted text-muted-foreground',
  Create: 'bg-primary/10 text-primary',
  Produce: 'bg-accent/20 text-accent-foreground',
  'AI Tools': 'bg-secondary text-secondary-foreground',
  Distribute: 'bg-primary/20 text-primary',
  Research: 'bg-muted text-muted-foreground',
  Admin: 'bg-destructive/10 text-destructive',
  Generation: 'bg-primary/10 text-primary',
  Processing: 'bg-accent/20 text-accent-foreground',
  Analysis: 'bg-secondary text-secondary-foreground',
  AI: 'bg-primary/20 text-primary',
  Agent: 'bg-primary/30 text-primary',
  Voice: 'bg-accent/10 text-accent-foreground',
  Billing: 'bg-muted text-muted-foreground',
  Social: 'bg-secondary/50 text-secondary-foreground',
  Notify: 'bg-muted text-muted-foreground',
  DJ: 'bg-primary/10 text-primary',
  Analytics: 'bg-secondary text-secondary-foreground',
};

const agenticBadge = (status: string) => {
  if (status === 'L5 Agent' || status === 'L5 Pipeline' || status === 'L5 Monitor' || status === 'L5')
    return <Badge className="bg-primary text-primary-foreground text-xs">{status}</Badge>;
  if (status === 'Tool')
    return <Badge variant="secondary" className="text-xs">{status}</Badge>;
  return <Badge variant="outline" className="text-xs">{status}</Badge>;
};

function filterItems<T extends InventoryItem>(items: T[], search: string, categoryFilter: string) {
  return items.filter(item => {
    const matchesSearch = !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.purpose.toLowerCase().includes(search.toLowerCase()) ||
      item.integration.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
}

// ── Component ────────────────────────────────────────

export default function AdminInventory() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredPages = useMemo(() => filterItems(PAGES, search, categoryFilter), [search, categoryFilter]);
  const filteredFunctions = useMemo(() => filterItems(EDGE_FUNCTIONS, search, categoryFilter), [search, categoryFilter]);
  const filteredTables = useMemo(() => filterItems(DB_TABLES, search, categoryFilter), [search, categoryFilter]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    [...PAGES, ...EDGE_FUNCTIONS, ...DB_TABLES].forEach(i => cats.add(i.category));
    return Array.from(cats).sort();
  }, []);

  const stats = {
    pages: PAGES.length,
    functions: EDGE_FUNCTIONS.length,
    tables: DB_TABLES.length,
    l5: [...PAGES, ...EDGE_FUNCTIONS].filter(i => i.agenticStatus.startsWith('L5')).length,
    tools: [...PAGES, ...EDGE_FUNCTIONS].filter(i => i.agenticStatus === 'Tool').length,
    secrets: SECRETS.length,
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Platform Inventory</h1>
        <p className="text-muted-foreground text-sm">Complete audit of all pages, functions, tables, and integrations</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Pages', value: stats.pages, icon: Route },
          { label: 'Edge Functions', value: stats.functions, icon: Plug },
          { label: 'DB Tables', value: stats.tables, icon: Database },
          { label: 'L5 Agents', value: stats.l5, icon: Layers },
          { label: 'Agent Tools', value: stats.tools, icon: Wrench },
          { label: 'API Secrets', value: stats.secrets, icon: Key },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-3 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pages, functions, tables…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {allCategories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pages">Pages ({filteredPages.length})</TabsTrigger>
          <TabsTrigger value="functions">Edge Functions ({filteredFunctions.length})</TabsTrigger>
          <TabsTrigger value="tables">DB Tables ({filteredTables.length})</TabsTrigger>
          <TabsTrigger value="secrets">Secrets ({SECRETS.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pages">
          <ScrollArea className="h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Component</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Agent Status</TableHead>
                  <TableHead>Integration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPages.map(p => (
                  <TableRow key={p.name}>
                    <TableCell className="font-mono text-xs">{p.route}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge className={CATEGORY_COLORS[p.category] || ''} variant="outline">{p.category}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.purpose}</TableCell>
                    <TableCell>{agenticBadge(p.agenticStatus)}</TableCell>
                    <TableCell className="text-sm">{p.integration}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{p.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="functions">
          <ScrollArea className="h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Function</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Agent Status</TableHead>
                  <TableHead>Integration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFunctions.map(f => (
                  <TableRow key={f.name}>
                    <TableCell className="font-mono text-xs">{f.name}</TableCell>
                    <TableCell><Badge className={CATEGORY_COLORS[f.category] || ''} variant="outline">{f.category}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{f.purpose}</TableCell>
                    <TableCell>{agenticBadge(f.agenticStatus)}</TableCell>
                    <TableCell className="text-sm">{f.integration}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{f.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="tables">
          <ScrollArea className="h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Agent Status</TableHead>
                  <TableHead>Integration</TableHead>
                  <TableHead>RLS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTables.map(t => (
                  <TableRow key={t.name}>
                    <TableCell className="font-mono text-xs">{t.name}</TableCell>
                    <TableCell><Badge className={CATEGORY_COLORS[t.category] || ''} variant="outline">{t.category}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{t.purpose}</TableCell>
                    <TableCell>{agenticBadge(t.agenticStatus)}</TableCell>
                    <TableCell className="text-sm">{t.integration}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{t.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="secrets">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Secret Name</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Used By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SECRETS.map(s => (
                <TableRow key={s.name}>
                  <TableCell className="font-mono text-xs">{s.name}</TableCell>
                  <TableCell className="font-medium">{s.service}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{s.usedBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
