import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppState, ActionTypes } from '../contexts/AppContext';
import { UserRole } from '../types';
import { MusicNoteIcon, UploadIcon, CloseIcon, PlayIcon, DownloadIcon, SparklesIcon, ChartBarIcon } from './icons';
import { transcribeAudio as transcribeAudioService } from '../services/transcriptionService';
import { createPdfBytes } from '../lib/pdf';
import appIcon from '../assets/stoodioz-app-icon.png';

interface HookVariation {
  id: string;
  style: 'anthem' | 'intimate' | 'aggressive' | 'melodic' | 'rhythmic';
  lyrics: string;
  melodyNotes: string;
  cadenceMap: {
    bar: number;
    beat: number;
    word: string;
    technique: 'pause' | 'double' | 'adlib' | 'stretch' | 'punch' | 'whisper' | 'belt';
    timing: number;
  }[];
  performanceNotes: {
    section: string;
    technique: string;
    emotion: string;
    stacks: string[];
    adlibs: string[];
  }[];
  energy: number;
  catchiness: number;
  originality: number;
  marketFit: {
    platforms: string[];
    audience: string;
    viralPotential: number;
  };
}

interface HookAnalysis {
  variations: HookVariation[];
  bridges: {
    option1: string;
    option2: string;
    option3: string;
  };
  improvements: {
    area: string;
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  marketAnalysis: {
    trend: string;
    opportunity: string;
    risk: string;
  };
}

const HookEnhancer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentUser, userRole } = useAppState();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState('');
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [analysis, setAnalysis] = useState<HookAnalysis | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'variations' | 'cadence' | 'performance' | 'market'>('variations');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const cadenceCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file');
      return;
    }

    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    setIsTranscribing(true);
    try {
      const transcription = await transcribeAudioService(file);
      if (transcription?.lyrics) {
        setLyrics(transcription.lyrics);
        setInput(transcription.lyrics);
      }
    } catch (err) {
      console.error('Transcription failed:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const generateHooks = async () => {
    if (!input.trim() && !lyrics.trim()) {
      alert('Please provide lyrics or upload audio');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      // Simulate AI generation (in production, this would call Gemini API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock variations with realistic data
      const mockVariations: HookVariation[] = [
        {
          id: 'var1',
          style: 'anthem',
          lyrics: input || lyrics,
          melodyNotes: 'Ascending melody, peak on "now", resolve down',
          cadenceMap: generateCadenceMap(input || lyrics),
          performanceNotes: [{
            section: 'Chorus',
            technique: 'Lay back on beat 2, push beat 4',
            emotion: 'Confident, playful',
            stacks: ['Harmony on "yeah"', 'Octave double on "now"'],
            adlibs: ["'Ayy' after line 2", "'That's right' at end"]
          }],
          energy: 85,
          catchiness: 92,
          originality: 78,
          marketFit: {
            platforms: ['TikTok', 'Instagram Reels'],
            audience: 'Gen Z, 18-24',
            viralPotential: 88
          }
        },
        {
          id: 'var2',
          style: 'intimate',
          lyrics: (input || lyrics).toLowerCase(),
          melodyNotes: 'Smooth, descending, breathy',
          cadenceMap: generateCadenceMap(input || lyrics),
          performanceNotes: [{
            section: 'Verse',
            technique: 'Whisper delivery, subtle vibrato',
            emotion: 'Intimate, vulnerable',
            stacks: ['Soft harmony', 'Light reverb'],
            adlibs: ['Breath sounds']
          }],
          energy: 45,
          catchiness: 75,
          originality: 85,
          marketFit: {
            platforms: ['Spotify', 'Apple Music'],
            audience: '25-35, R&B fans',
            viralPotential: 65
          }
        },
        {
          id: 'var3',
          style: 'aggressive',
          lyrics: (input || lyrics).toUpperCase(),
          melodyNotes: 'Punchy, staccato, high energy',
          cadenceMap: generateCadenceMap(input || lyrics),
          performanceNotes: [{
            section: 'Hook',
            technique: 'Double-time delivery, aggressive tone',
            emotion: 'Powerful, confident',
            stacks: ['Distorted double', 'Adlib layer'],
            adlibs: ["'Yeah!'", "'Let's go!'"]
          }],
          energy: 95,
          catchiness: 88,
          originality: 70,
          marketFit: {
            platforms: ['TikTok', 'YouTube Shorts'],
            audience: '18-24, Hip-Hop fans',
            viralPotential: 92
          }
        }
      ];

      setAnalysis({
        variations: mockVariations,
        bridges: {
          option1: 'Bridge option 1 with emotional lift',
          option2: 'Bridge option 2 with contrast',
          option3: 'Bridge option 3 with resolution'
        },
        improvements: [{
          area: 'Opening line',
          suggestion: 'Start with a question to hook immediately',
          impact: 'high'
        }],
        marketAnalysis: {
          trend: 'Current trend in similar music',
          opportunity: 'Why this could work now',
          risk: 'Potential challenges'
        }
      });

      setGenerationProgress(100);
      setActiveTab('variations');
      setSelectedVariation(mockVariations[0].id);
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setIsGenerating(false);
      clearInterval(progressInterval);
    }
  };

  const generateCadenceMap = (text: string) => {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const cadence: HookVariation['cadenceMap'] = [];
    let bar = 1;
    let beat = 1;
    
    words.forEach((word, idx) => {
      const techniques: Array<HookVariation['cadenceMap'][0]['technique']> = ['pause', 'double', 'adlib', 'stretch', 'punch', 'whisper', 'belt'];
      const technique = techniques[idx % techniques.length];
      
      cadence.push({
        bar,
        beat,
        word: word.replace(/[^\w]/g, ''),
        technique,
        timing: (idx * 50) % 500
      });
      
      beat++;
      if (beat > 4) {
        beat = 1;
        bar++;
      }
    });
    
    return cadence;
  };

  const drawCadenceTimeline = useCallback(() => {
    if (!cadenceCanvasRef.current || !selectedVariation || !analysis) return;
    
    const canvas = cadenceCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const variation = analysis.variations.find(v => v.id === selectedVariation);
    if (!variation || variation.cadenceMap.length === 0) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = canvas.width / Math.max(4, variation.cadenceMap[variation.cadenceMap.length - 1].bar);
    const beatHeight = canvas.height / 4;

    variation.cadenceMap.forEach((item, idx) => {
      const x = (item.bar - 1) * barWidth + (item.beat - 1) * (barWidth / 4);
      const y = (item.beat - 1) * beatHeight;
      
      const colors: Record<string, string> = {
        pause: '#f97316',
        double: '#a855f7',
        adlib: '#10b981',
        stretch: '#3b82f6',
        punch: '#ef4444',
        whisper: '#8b5cf6',
        belt: '#f59e0b'
      };

      ctx.fillStyle = colors[item.technique] || '#6b7280';
      ctx.fillRect(x, y, barWidth / 4 - 2, beatHeight - 2);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(item.word.substring(0, 8), x + (barWidth / 8), y + beatHeight / 2);
    });
  }, [selectedVariation, analysis]);

  useEffect(() => {
    drawCadenceTimeline();
  }, [drawCadenceTimeline, selectedVariation]);

  const exportToPDF = async () => {
    if (!analysis) return;
    
    try {
      // Format analysis as readable text
      let pdfContent = `HOOK ENHANCER ANALYSIS\n`;
      pdfContent += `Generated: ${new Date().toLocaleString()}\n\n`;
      
      pdfContent += `VARIATIONS:\n`;
      analysis.variations.forEach((v, idx) => {
        pdfContent += `\n${idx + 1}. ${v.style.toUpperCase()} VARIATION\n`;
        pdfContent += `   Lyrics: ${v.lyrics}\n`;
        pdfContent += `   Melody Notes: ${v.melodyNotes}\n`;
        pdfContent += `   Energy: ${v.energy}% | Catchiness: ${v.catchiness}% | Originality: ${v.originality}%\n`;
        pdfContent += `   Viral Potential: ${v.marketFit.viralPotential}%\n`;
        pdfContent += `   Target Platforms: ${v.marketFit.platforms.join(', ')}\n`;
        pdfContent += `   Target Audience: ${v.marketFit.audience}\n`;
        pdfContent += `   Performance Notes:\n`;
        v.performanceNotes.forEach(note => {
          pdfContent += `     - ${note.section}: ${note.technique} (${note.emotion})\n`;
          if (note.stacks.length > 0) pdfContent += `       Stacks: ${note.stacks.join(', ')}\n`;
          if (note.adlibs.length > 0) pdfContent += `       Adlibs: ${note.adlibs.join(', ')}\n`;
        });
      });
      
      pdfContent += `\n\nBRIDGE OPTIONS:\n`;
      pdfContent += `1. ${analysis.bridges.option1}\n`;
      pdfContent += `2. ${analysis.bridges.option2}\n`;
      pdfContent += `3. ${analysis.bridges.option3}\n`;
      
      pdfContent += `\n\nIMPROVEMENTS:\n`;
      analysis.improvements.forEach(imp => {
        pdfContent += `- ${imp.area} (${imp.impact} impact): ${imp.suggestion}\n`;
      });
      
      pdfContent += `\n\nMARKET ANALYSIS:\n`;
      pdfContent += `Trend: ${analysis.marketAnalysis.trend}\n`;
      pdfContent += `Opportunity: ${analysis.marketAnalysis.opportunity}\n`;
      pdfContent += `Risk: ${analysis.marketAnalysis.risk}\n`;
      
      const pdfBytes = await createPdfBytes(pdfContent);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hook-enhancer-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const selectedVar = analysis?.variations.find(v => v.id === selectedVariation);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Main Container */}
      <div className="relative rounded-3xl border-2 border-green-500/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 backdrop-blur-xl p-8 shadow-2xl shadow-green-500/10 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-green-500/5 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
              <SparklesIcon className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Hook Enhancer Pro</h3>
              <p className="text-sm text-zinc-400 mt-1">AI-powered hook optimization • Cadence mapping • Viral potential analysis</p>
            </div>
          </div>

          {/* Input Section - Always Visible */}
          {!analysis && (
            <div className="space-y-4">
              {/* Audio Upload */}
              <div
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileSelect(e.dataTransfer.files[0]);
                }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="relative border-2 border-dashed border-green-500/40 rounded-2xl p-12 text-center cursor-pointer group hover:border-green-500/70 transition-all bg-gradient-to-br from-zinc-950/80 to-zinc-900/80 backdrop-blur-sm overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/5 to-emerald-500/0 group-hover:from-green-500/10 group-hover:via-green-500/10 group-hover:to-emerald-500/10 transition-all"></div>
                <div className="relative z-10">
                  {audioUrl ? (
                    <div className="space-y-4">
                      <audio ref={audioRef} src={audioUrl} controls className="w-full rounded-lg" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAudioFile(null);
                          setAudioUrl(null);
                          if (audioRef.current) audioRef.current.src = '';
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove Audio
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UploadIcon className="w-10 h-10 text-green-400" />
                      </div>
                      <p className="text-xl font-bold text-slate-100 mb-2 group-hover:text-green-400 transition-colors">Drop audio file here</p>
                      <p className="text-sm text-zinc-400 mb-4">or click to browse</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  {isTranscribing && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-green-400">
                      <img src={appIcon} alt="Loading" className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Transcribing audio...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lyrics Input */}
              <div className="p-6 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-2xl border border-green-500/20 backdrop-blur-sm">
                <label className="block text-sm font-bold text-green-400 mb-2">Lyrics or Hook Idea</label>
                <textarea
                  value={input || lyrics}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setLyrics(e.target.value);
                  }}
                  placeholder="Paste your hook lyrics, describe the vibe, or let AI transcribe from audio..."
                  className="w-full min-h-[200px] rounded-xl bg-zinc-950 border border-zinc-800 text-slate-100 p-4 focus:outline-none focus:ring-2 focus:ring-green-500/40 font-mono text-sm resize-none"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={generateHooks}
                disabled={isGenerating || (!input.trim() && !lyrics.trim())}
                className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isGenerating ? (
                  <>
                    <img src={appIcon} alt="Loading" className="w-5 h-5 animate-spin" />
                    <span>Analyzing Hook Potential... {generationProgress}%</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-6 h-6" />
                    <span>Generate Hook Variations</span>
                  </>
                )}
              </button>

              {/* Progress Bar */}
              {isGenerating && (
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}

          {/* Results Section */}
          {analysis && (
            <>
              {/* Tabs */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {(['variations', 'cadence', 'performance', 'market'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      activeTab === tab
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Variations Tab */}
              {activeTab === 'variations' && (
            <div className="space-y-6">
              {/* Variation Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysis.variations.map((variation) => (
                  <div
                    key={variation.id}
                    onClick={() => setSelectedVariation(variation.id)}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedVariation === variation.id
                        ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20'
                        : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs font-bold text-zinc-300 uppercase">
                        {variation.style}
                      </span>
                      <div className="flex gap-2">
                        <span className="text-xs text-green-400 font-bold">{variation.catchiness}%</span>
                      </div>
                    </div>
                    
                    <p className="text-white font-medium mb-4 whitespace-pre-line text-sm leading-relaxed">{variation.lyrics}</p>
                    
                    {/* Score Bars */}
                    <div className="space-y-2 mb-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-400">Catchiness</span>
                          <span className="text-white font-bold">{variation.catchiness}%</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                            style={{ width: `${variation.catchiness}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-400">Energy</span>
                          <span className="text-white font-bold">{variation.energy}%</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                            style={{ width: `${variation.energy}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-400">Viral Potential</span>
                          <span className="text-green-400 font-bold">{variation.marketFit.viralPotential}%</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            style={{ width: `${variation.marketFit.viralPotential}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {variation.marketFit.platforms.map(p => (
                        <span key={p} className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300">{p}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Variation Details */}
              {selectedVar && (
                <div className="mt-6 p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  <h3 className="text-lg font-bold text-white mb-4">Selected Variation Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-green-400 mb-2">Melody Notes</h4>
                      <p className="text-white text-sm">{selectedVar.melodyNotes}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-green-400 mb-2">Target Audience</h4>
                      <p className="text-white text-sm">{selectedVar.marketFit.audience}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

              {/* Cadence Tab */}
              {activeTab === 'cadence' && selectedVar && (
            <div className="space-y-4">
              <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <h3 className="text-lg font-bold text-white mb-4">Bar-by-Bar Cadence Map</h3>
                <canvas 
                  ref={cadenceCanvasRef}
                  className="w-full rounded-lg border border-zinc-700"
                  style={{ height: '200px' }}
                />
                <div className="mt-4 flex gap-4 flex-wrap">
                  {['pause', 'double', 'adlib', 'stretch', 'punch', 'whisper', 'belt'].map(tech => {
                    const colors: Record<string, string> = {
                      pause: '#f97316',
                      double: '#a855f7',
                      adlib: '#10b981',
                      stretch: '#3b82f6',
                      punch: '#ef4444',
                      whisper: '#8b5cf6',
                      belt: '#f59e0b'
                    };
                    return (
                      <div key={tech} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: colors[tech] }}></div>
                        <span className="text-xs text-zinc-400 capitalize">{tech}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

              {/* Performance Tab */}
              {activeTab === 'performance' && selectedVar && (
            <div className="space-y-4">
              {selectedVar.performanceNotes.map((note, idx) => (
                <div key={idx} className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  <h4 className="text-lg font-bold text-white mb-4">{note.section}</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-zinc-400">Technique:</span>
                      <p className="text-white">{note.technique}</p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-400">Emotion:</span>
                      <p className="text-white">{note.emotion}</p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-400">Stacks:</span>
                      <ul className="list-disc list-inside text-white text-sm">
                        {note.stacks.map((stack, i) => (
                          <li key={i}>{stack}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-400">Adlibs:</span>
                      <ul className="list-disc list-inside text-white text-sm">
                        {note.adlibs.map((adlib, i) => (
                          <li key={i}>{adlib}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

              {/* Market Tab */}
              {activeTab === 'market' && (
            <div className="space-y-4">
              <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <h3 className="text-lg font-bold text-white mb-4">Market Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-zinc-400">Current Trend:</span>
                    <p className="text-white">{analysis.marketAnalysis.trend}</p>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400">Opportunity:</span>
                    <p className="text-green-400">{analysis.marketAnalysis.opportunity}</p>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400">Risk:</span>
                    <p className="text-yellow-400">{analysis.marketAnalysis.risk}</p>
                  </div>
                </div>
              </div>

              {analysis.improvements.length > 0 && (
                <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  <h3 className="text-lg font-bold text-white mb-4">Improvement Suggestions</h3>
                  <div className="space-y-3">
                    {analysis.improvements.map((imp, idx) => (
                      <div key={idx} className="p-3 bg-zinc-800 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-white">{imp.area}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            imp.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                            imp.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {imp.impact.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-300">{imp.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
            </>
          )}

          {/* Export Button */}
          {analysis && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={exportToPDF}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 flex items-center gap-2"
              >
                <DownloadIcon className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HookEnhancer;
