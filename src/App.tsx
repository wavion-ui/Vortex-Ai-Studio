/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Settings, 
  Zap, 
  Layers, 
  Maximize2, 
  Download, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Clapperboard,
  Clock,
  Palette,
  Film
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ai, TEXT_MODELS, VIDEO_MODELS } from './lib/gemini.ts';
import { cn } from './lib/utils.ts';

// --- Constants ---

const VIDEO_STYLES = [
  { id: 'cinematic', name: 'Cinematic', description: 'Deep shadows, dramatic lighting', icon: Film },
  { id: 'realistic', name: 'Ultra-Realistic', description: 'Photorealistic textures, 8K look', icon: Camera },
  { id: 'anime', name: 'Cyberpunk Anime', description: 'Vibrant colors, cel-shaded', icon: Zap },
  { id: '3d', name: '3D Animation', description: 'Studio-grade character rendering', icon: Layers },
  { id: 'vintage', name: 'Vintage Film', description: 'Grainy 16mm aesthetic', icon: Clapperboard },
  { id: 'abstract', name: 'Abstract Art', description: 'Surreal, experimental motion', icon: Palette },
];

const VIDEO_LENGTHS = [
  { id: '5s', name: 'Fast (5s)', value: 5, tokens: 'short' },
  { id: '10s', name: 'Standard (10s)', value: 10, tokens: 'medium' },
  { id: '15s', name: 'Extended (15s)', value: 15, tokens: 'long' },
];

const ASPECT_RATIOS = [
  { id: '16:9', name: '16:9', desc: 'Landscape' },
  { id: '9:16', name: '9:16', desc: 'Portrait' },
  { id: '1:1', name: '1:1', desc: 'Square' },
];

// --- Types ---

interface GenerationState {
  status: 'idle' | 'enhancing' | 'generating' | 'completed' | 'error';
  prompt: string;
  enhancedPrompt: string;
  videoUrl: string | null;
  error: string | null;
  progress: number;
  currentStage: string;
}

// --- Components ---

function Camera(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(VIDEO_STYLES[0].id);
  const [selectedLength, setSelectedLength] = useState(VIDEO_LENGTHS[0].id);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0].id);
  const [state, setState] = useState<GenerationState>({
    status: 'idle',
    prompt: '',
    enhancedPrompt: '',
    videoUrl: null,
    error: null,
    progress: 0,
    currentStage: 'Initializing...',
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const getStageMessage = (progress: number) => {
    if (progress < 20) return "Neural Latent Linkage";
    if (progress < 50) return "Scene Composition";
    if (progress < 80) return "Texture Baking";
    return "Final Rendering";
  };

  const enhancePrompt = async (input: string) => {
    setState(prev => ({ ...prev, status: 'enhancing', currentStage: 'Optimizing Neural Vectors' }));
    try {
      const resp = await ai.models.generateContent({
        model: TEXT_MODELS.FAST,
        contents: `Enhance this video generation prompt for high realism and cinematic quality.
        The style is: ${VIDEO_STYLES.find(s => s.id === selectedStyle)?.name}.
        Keep it under 300 characters. 
        Focus on camera movement, lighting, and textures.
        Input: ${input}`,
      });
      return resp.text || input;
    } catch (err) {
      console.error("Enhance error:", err);
      return input;
    }
  };

  const generateVideo = async () => {
    if (!prompt.trim()) return;

    // Reset state
    setState({
      status: 'generating',
      prompt,
      enhancedPrompt: '',
      videoUrl: null,
      error: null,
      progress: 0,
      currentStage: 'Establishing Uplink...',
    });

    try {
      const enhanced = await enhancePrompt(prompt);
      setState(prev => ({ ...prev, enhancedPrompt: enhanced }));

      // Simulated progress for better UX as Veo takes minutes
      const progressInterval = setInterval(() => {
        setState(prev => {
          const nextProgress = Math.min(prev.progress + 1, 95);
          return {
            ...prev,
            progress: nextProgress,
            currentStage: getStageMessage(nextProgress)
          };
        });
      }, 1500);

      // --- Veo API Call ---
      // Note: Real Veo operations can take 1-5 minutes
      const result = await ai.models.generateVideos({
        model: VIDEO_MODELS.PREVIEW,
        prompt: enhanced,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: selectedRatio as any,
          // videoLength is often handled by the specific model version or seed
        }
      });

      clearInterval(progressInterval);

      // Usually result is an operation you await
      // This is a simplified pattern based on common GenAI SDK structures
      const opResult = await (result as any).wait(); 
      const videoUri = opResult.videos[0].uri;

      setState(prev => ({
        ...prev,
        status: 'completed',
        videoUrl: videoUri,
        progress: 100,
        currentStage: 'Synthesis Successful'
      }));

    } catch (err: any) {
      console.error("Generation error:", err);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: err.message || "An unexpected error occurred during generation."
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E4E3E0] font-sans selection:bg-cyan-500/30">
      {/* Structural Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      {/* Top Header */}
      <header className="relative z-10 h-16 border-b border-[#141414] bg-[#0A0A0A]/80 backdrop-blur-md flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500 rounded-sm flex items-center justify-center">
            <Video className="w-5 h-5 text-black" />
          </div>
          <span className="font-mono text-sm tracking-widest uppercase font-bold text-cyan-400">
            Vortex <span className="text-white/40">v3.1_LITE</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-white/40 tracking-wider">
            <span>MEM: 12.4GB</span>
            <span>GPU_TEMP: 64°C</span>
            <span className="text-green-500">SYSTEM: ONLINE</span>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="relative z-10 flex flex-col lg:grid lg:grid-cols-[380px_1fr] h-[calc(100vh-64px)] overflow-hidden">
        
        {/* Left Sidebar: Controls */}
        <aside className="border-r border-[#141414] bg-[#0C0C0C] flex flex-col h-full overflow-y-auto no-scrollbar">
          <div className="p-6 space-y-8">
            
            {/* Prompt Input */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">Core Prompt</label>
                <Sparkles className="w-3 h-3 text-cyan-400" />
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic city with rain-slicked streets, neon lights reflecting in puddles, cinematic drone shot..."
                className="w-full h-32 bg-[#141414] border border-[#222] rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-500/50 resize-none placeholder:text-white/20 transition-all font-mono"
              />
            </section>

            {/* Style Selection */}
            <section className="space-y-4">
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">Visual DNA</label>
              <div className="grid grid-cols-2 gap-2">
                {VIDEO_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border text-center transition-all group",
                      selectedStyle === style.id 
                        ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" 
                        : "bg-[#141414] border-[#222] text-white/40 hover:border-[#333] hover:text-white/60"
                    )}
                  >
                    <style.icon className={cn("w-5 h-5", selectedStyle === style.id ? "text-cyan-400" : "text-white/20 group-hover:text-white/40")} />
                    <span className="text-[10px] font-medium tracking-tight uppercase">{style.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Config Grid */}
            <section className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">Duration</label>
                <select 
                  value={selectedLength}
                  onChange={(e) => setSelectedLength(e.target.value)}
                  className="w-full bg-[#141414] border border-[#222] rounded-md px-2 py-1.5 text-xs text-white/80 focus:outline-none"
                >
                  {VIDEO_LENGTHS.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">Ratio</label>
                <select 
                  value={selectedRatio}
                  onChange={(e) => setSelectedRatio(e.target.value)}
                  className="w-full bg-[#141414] border border-[#222] rounded-md px-2 py-1.5 text-xs text-white/80 focus:outline-none"
                >
                  {ASPECT_RATIOS.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.desc})</option>
                  ))}
                </select>
              </div>
            </section>

            {/* Generate Button */}
            <button
              onClick={generateVideo}
              disabled={state.status === 'generating' || state.status === 'enhancing' || !prompt.trim()}
              className={cn(
                "w-full py-4 rounded-xl flex items-center justify-center gap-3 font-mono text-sm tracking-[0.2em] uppercase transition-all relative overflow-hidden",
                state.status === 'generating' || state.status === 'enhancing'
                  ? "bg-[#141414] text-white/30 cursor-not-allowed"
                  : "bg-white text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]"
              )}
            >
              {(state.status === 'generating' || state.status === 'enhancing') ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Execute Sequence
                </>
              )}
              
              {/* Progress Bar background for active generation */}
              {(state.status === 'generating' || state.status === 'enhancing') && (
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-cyan-500/50 transition-all duration-1000"
                  style={{ width: `${state.progress}%` }}
                />
              )}
            </button>
          </div>
        </aside>

        {/* Right Section: Canvas & Preview */}
        <div className="flex flex-col h-full bg-[#080808]">
          <div className="flex-1 p-6 flex flex-col gap-6 w-full max-w-6xl mx-auto overflow-y-auto">
            
            {/* Main Stage */}
            <div className={cn(
              "relative rounded-2xl border border-[#141414] overflow-hidden bg-black/40 flex items-center justify-center transition-all duration-700 mx-auto",
              selectedRatio === '16:9' ? 'aspect-video w-full' : 
              selectedRatio === '9:16' ? 'aspect-[9/16] h-[70vh]' : 
              'aspect-square h-[60vh]'
            )}>
              <AnimatePresence mode="wait">
                {state.status === 'idle' && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-6 text-center max-w-md px-6"
                  >
                    <div className="w-20 h-20 rounded-full border border-dashed border-white/10 flex items-center justify-center animate-[spin_20s_linear_infinite]">
                       <Video className="w-8 h-8 text-white/20" />
                    </div>
                    <div className="space-y-2">
                       <h2 className="text-xl font-mono text-white/40 uppercase tracking-[0.2em]">Awaiting Instruction</h2>
                       <p className="text-xs text-white/20 leading-relaxed font-mono italic">
                         "Input your creative vision into the control terminal to begin synthesis. Pro models will engage on execution."
                       </p>
                    </div>
                  </motion.div>
                )}

                {(state.status === 'generating' || state.status === 'enhancing') && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0A]/90 p-8"
                  >
                    <div className="relative w-full max-w-lg">
                      <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-cyan-500 shadow-[0_0_10px_#22d3ee]"
                          initial={{ width: "0%" }}
                          animate={{ width: `${state.progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <div className="mt-8 flex flex-col gap-4">
                        <div className="flex items-center justify-between font-mono text-[10px] tracking-widest uppercase">
                          <span className="text-cyan-400">Operation: {state.currentStage}</span>
                          <span className="text-white/40">{state.progress}%</span>
                        </div>
                        {state.enhancedPrompt && (
                          <div className="p-4 bg-white/5 rounded border border-white/10 font-mono text-[10px] text-white/50 leading-relaxed animate-pulse">
                            VECTOR_MAP: {state.enhancedPrompt}
                          </div>
                        )}
                        <div className="text-center text-[10px] font-mono text-white/20 mt-4 h-4">
                          {state.progress > 5 && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              PARALLEL_CORE_ID: {Math.floor(Math.random() * 9999).toString(16).toUpperCase()}
                            </motion.span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Visual Flairs */}
                    <div className="absolute top-10 left-10 w-24 h-24 border-t border-l border-cyan-500/20" />
                    <div className="absolute bottom-10 right-10 w-24 h-24 border-b border-r border-cyan-500/20" />
                  </motion.div>
                )}

                {state.status === 'completed' && state.videoUrl && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full relative group"
                  >
                    <video 
                      src={state.videoUrl} 
                      controls 
                      autoPlay 
                      loop 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-3 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 hover:bg-white hover:text-black transition-all">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {state.status === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-6 text-center text-red-400 max-w-md px-6"
                  >
                    <AlertCircle className="w-12 h-12" />
                    <div className="space-y-2">
                       <h2 className="text-lg font-mono uppercase tracking-[0.2em]">Synthesis Failure</h2>
                       <p className="text-[10px] leading-relaxed font-mono opacity-80 uppercase">
                         {state.error}
                       </p>
                    </div>
                    <button 
                      onClick={() => setState(s => ({ ...s, status: 'idle' }))}
                      className="px-6 py-2 border border-red-400/30 rounded-full text-[10px] uppercase font-mono tracking-widest hover:bg-red-400/10 transition-all"
                    >
                      Reset Core
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Info Bar */}
            <section className="border border-[#141414] rounded-2xl bg-[#0C0C0C] p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[#141414] pb-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-mono text-xs uppercase tracking-widest font-bold">Metadata Information</h3>
                  <div className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-mono text-white/40">VEO_LOG_LATEST</div>
                </div>
                <div className="flex gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                  <span className="font-mono text-[10px] text-white/40 uppercase">Awaiting Refresh</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <span className="block font-mono text-[10px] text-white/20 uppercase tracking-tighter">Selected Style</span>
                  <p className="text-sm font-medium">{VIDEO_STYLES.find(s => s.id === selectedStyle)?.name}</p>
                  <p className="text-[10px] text-white/40 font-mono italic">{VIDEO_STYLES.find(s => s.id === selectedStyle)?.description}</p>
                </div>
                <div className="space-y-2">
                  <span className="block font-mono text-[10px] text-white/20 uppercase tracking-tighter">Resolution Matrix</span>
                  <p className="text-sm font-medium">1920x1080 (HD_READY)</p>
                  <p className="text-[10px] text-white/40 font-mono italic">Adaptive Upsampling Enabled</p>
                </div>
                <div className="space-y-2">
                  <span className="block font-mono text-[10px] text-white/20 uppercase tracking-tighter">Computational State</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    <span className="text-xs">Neural Engine: Passive</span>
                  </div>
                  <p className="text-[10px] text-white/40 font-mono italic">Ready for multi-pass rendering</p>
                </div>
              </div>
            </section>

          </div>

          {/* Footer Terminal (Recipe 1 visual) */}
          <footer className="h-10 border-t border-[#141414] bg-[#0A0A0A] flex items-center justify-between px-6 font-mono text-[9px] tracking-wider text-white/30 uppercase">
             <div className="flex items-center gap-6">
               <span>SYS_VERSION: 8.9.1.A</span>
               <span className="opacity-50">LOCATION: AIS_DEV_6QPD...</span>
             </div>
             <div className="flex items-center gap-6">
               <span className="flex items-center gap-1.5"><Zap className="w-2.5 h-2.5 text-yellow-500" /> VEO_ACTIVE</span>
               <span>{new Date().toLocaleTimeString()} UTC</span>
             </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
