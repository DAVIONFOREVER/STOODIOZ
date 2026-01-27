import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppState, ActionTypes } from '../contexts/AppContext';
import { UserRole, AriaCantataMessage } from '../types';
import { 
  CalendarIcon, 
  MusicNoteIcon, 
  PhotoIcon, 
  PaperAirplaneIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  PlayIcon,
  UploadIcon,
  CloseIcon,
  SoundWaveIcon
} from './icons';
import * as apiService from '../services/apiService';
import { createPdfBytes } from '../lib/pdf';
import { transcribeAudio as transcribeAudioService } from '../services/transcriptionService';
import appIcon from '../assets/stoodioz-app-icon.png';

interface ReleasePlan {
  songTitle: string;
  artistName: string;
  genre: string;
  vibe: string;
  targetAudience: string;
  goal: 'streams' | 'fans' | 'bookings' | 'exposure';
  releaseDate: string;
  timeline: {
    phase: string;
    weeksOut: number;
    tasks: {
      title: string;
      description: string;
      dueDate: string;
      status: 'pending' | 'in_progress' | 'completed';
      category: 'visuals' | 'metadata' | 'distribution' | 'marketing' | 'social';
    }[];
  }[];
  shortFormConcepts: {
    title: string;
    description: string;
    platform: 'TikTok' | 'Instagram Reels' | 'YouTube Shorts';
    hook: string;
    caption: string;
    hashtags: string[];
  }[];
  metadata: {
    isrc?: string;
    upc?: string;
    writers: string[];
    producers: string[];
    label?: string;
    distributor?: string;
  };
  distribution: {
    platforms: string[];
    preSaveLink?: string;
    releaseDate: string;
  };
  marketing: {
    playlistPitches: { platform: string; playlist: string; contact?: string }[];
    pressReleases: { outlet: string; contact?: string; sent: boolean }[];
    influencerOutreach: { influencer: string; platform: string; contact?: string }[];
  };
  assets: {
    coverArt: boolean;
    pressImages: boolean;
    bannerSets: boolean;
    socialMediaAssets: boolean;
  };
}

interface AudioAnalysis {
  duration: number;
  sampleRate: number;
  tempo?: number; // BPM estimate
  key?: string; // Musical key estimate
  energy?: number; // 0-1 energy level
  genre?: string; // Genre estimate
  mood?: string; // Mood/vibe estimate
}

interface TranscriptionResult {
  lyrics: string;
  language?: string;
  confidence?: number;
}

const ReleaseEngine: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentUser, userRole } = useAppState();
  const [isPlanning, setIsPlanning] = useState(false);
  const [releasePlan, setReleasePlan] = useState<ReleasePlan | null>(null);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [activePhase, setActivePhase] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  
  // Audio file handling
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysis | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load per-user Release Engine conversation history (separate from global Aria history)
  useEffect(() => {
    if (currentUser?.id) {
      const stored = localStorage.getItem(`aria_release_history_${currentUser.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setConversationHistory(parsed);
          // Try to extract plan from last Aria response
          const lastAriaResponse = parsed.filter((m: any) => m.role === 'model' || m.role === 'assistant').pop();
          if (lastAriaResponse) {
            const text = lastAriaResponse.parts?.[0]?.text || lastAriaResponse.text || '';
            tryParsePlanFromResponse(text);
          }
        } catch (e) {
          console.error('Failed to load release engine history', e);
        }
      }
    }
  }, [currentUser?.id]);

  // Listen to Aria responses and save Release Engine conversations separately
  // This ensures each user has their own conversation thread
  useEffect(() => {
    if (!currentUser?.id) return;
    
    // Check localStorage periodically for new Aria responses related to Release Engine
    const checkInterval = setInterval(() => {
      // We'll update this when Aria responds - for now, this is a placeholder
      // The actual update happens when user interacts with Aria
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [currentUser?.id]);

  // Parse plan from Aria's text response
  const tryParsePlanFromResponse = useCallback((text: string) => {
    // This is a simplified parser - in production, Aria should return structured JSON
    // For now, we'll create a basic plan structure from key phrases
    if (!text || text.length < 100) return; // Too short to be a plan

    // Extract song title if mentioned
    const titleMatch = text.match(/(?:song|track|single|release)[\s:]+["']?([^"'\n]+)["']?/i);
    const songTitle = titleMatch ? titleMatch[1] : 'Untitled Release';

    // Create a basic plan structure (Aria will provide full details)
    const basicPlan: ReleasePlan = {
      songTitle,
      artistName: currentUser?.name || 'Artist',
      genre: 'Unknown',
      vibe: 'Unknown',
      targetAudience: 'Unknown',
      goal: 'streams',
      releaseDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 weeks default
      timeline: [
        {
          phase: '120-90 Days Out',
          weeksOut: 120,
          tasks: [
            { title: 'Finalize song concept', description: 'Lock in final version', dueDate: 'T-120', status: 'pending', category: 'metadata' },
            { title: 'Design cover art', description: 'Create 3000x3000px cover', dueDate: 'T-90', status: 'pending', category: 'visuals' },
          ],
        },
        {
          phase: '60-30 Days Out',
          weeksOut: 60,
          tasks: [
            { title: 'Submit to distributor', description: 'Upload to DistroKid/CD Baby', dueDate: 'T-30', status: 'pending', category: 'distribution' },
            { title: 'Create pre-save campaign', description: 'Set up Spotify/Apple Music pre-save', dueDate: 'T-30', status: 'pending', category: 'marketing' },
          ],
        },
        {
          phase: '30-14 Days Out',
          weeksOut: 30,
          tasks: [
            { title: 'Start playlist pitching', description: 'Research and pitch to playlists', dueDate: 'T-14', status: 'pending', category: 'marketing' },
            { title: 'Create short-form content', description: 'Film TikTok/Reels content', dueDate: 'T-14', status: 'pending', category: 'social' },
          ],
        },
        {
          phase: 'Release Week',
          weeksOut: 0,
          tasks: [
            { title: 'Verify stores', description: 'Check all platforms for release', dueDate: 'Release Day', status: 'pending', category: 'distribution' },
            { title: 'Post release content', description: 'Share on all social platforms', dueDate: 'Release Day', status: 'pending', category: 'social' },
          ],
        },
      ],
      shortFormConcepts: [
        { title: 'Behind the Scenes', description: 'Show recording process', platform: 'TikTok', hook: 'Making this song was...', caption: 'The making of...', hashtags: ['music', 'behindthescenes'] },
        { title: 'Lyric Reveal', description: 'Show lyrics with visuals', platform: 'Instagram Reels', hook: 'These lyrics hit different...', caption: 'When you hear it...', hashtags: ['lyrics', 'newmusic'] },
      ],
      metadata: { writers: [], producers: [] },
      distribution: { platforms: ['Spotify', 'Apple Music', 'YouTube'], releaseDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      marketing: { playlistPitches: [], pressReleases: [], influencerOutreach: [] },
      assets: { coverArt: false, pressImages: false, bannerSets: false, socialMediaAssets: false },
    };

    // Only set if we don't already have a plan
    if (!releasePlan) {
      setReleasePlan(basicPlan);
    }
  }, [currentUser, releasePlan]);

  // Analyze audio file for tempo, key, energy, genre, mood
  const analyzeAudio = useCallback(async (file: File): Promise<AudioAnalysis> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          const channelData = audioBuffer.getChannelData(0);
          const sampleRate = audioBuffer.sampleRate;
          const duration = audioBuffer.duration;
          const length = channelData.length;

          // Calculate RMS for energy estimation
          let sumSquares = 0;
          for (let i = 0; i < length; i++) {
            sumSquares += channelData[i] * channelData[i];
          }
          const rms = Math.sqrt(sumSquares / length);
          const energy = Math.min(1, Math.max(0, rms * 2)); // Normalize to 0-1

          // Simple tempo estimation (autocorrelation-based, simplified)
          // This is a basic implementation - in production, use a proper tempo detection library
          let tempo = 120; // Default
          try {
            // Sample a portion of the audio for tempo detection
            const sampleStart = Math.floor(length * 0.2);
            const sampleEnd = Math.min(sampleStart + sampleRate * 10, length); // 10 seconds
            const sample = channelData.slice(sampleStart, sampleEnd);
            
            // Simple peak detection for tempo
            let peaks = 0;
            let lastPeak = 0;
            const threshold = 0.3;
            for (let i = 1; i < sample.length - 1; i++) {
              if (sample[i] > sample[i - 1] && sample[i] > sample[i + 1] && sample[i] > threshold) {
                if (i - lastPeak > sampleRate * 0.1) { // At least 0.1s between peaks
                  peaks++;
                  lastPeak = i;
                }
              }
            }
            if (peaks > 0) {
              const avgInterval = (sampleEnd - sampleStart) / peaks;
              tempo = Math.round(60 / (avgInterval / sampleRate));
              tempo = Math.max(60, Math.min(180, tempo)); // Clamp to reasonable range
            }
          } catch (e) {
            console.warn('Tempo detection failed, using default', e);
          }

          // Frequency analysis for key and genre estimation
          const sampleStart = Math.floor(length * 0.4);
          const sampleEnd = Math.min(sampleStart + 4096, length);
          const sample = channelData.slice(sampleStart, sampleEnd);
          
          // Simple frequency band analysis
          const nyquist = sampleRate / 2;
          const lowFreq = sample.filter((_, i) => {
            const freq = (i / sample.length) * nyquist;
            return freq >= 20 && freq < 250;
          });
          const midFreq = sample.filter((_, i) => {
            const freq = (i / sample.length) * nyquist;
            return freq >= 250 && freq < 4000;
          });
          const highFreq = sample.filter((_, i) => {
            const freq = (i / sample.length) * nyquist;
            return freq >= 4000 && freq <= 20000;
          });

          const lowEnergy = lowFreq.reduce((sum, v) => sum + Math.abs(v), 0) / lowFreq.length;
          const midEnergy = midFreq.reduce((sum, v) => sum + Math.abs(v), 0) / midFreq.length;
          const highEnergy = highFreq.reduce((sum, v) => sum + Math.abs(v), 0) / highFreq.length;

          // Genre estimation based on frequency distribution
          let genre = 'Unknown';
          let mood = 'Neutral';
          if (lowEnergy > 0.3) {
            genre = midEnergy > highEnergy ? 'Hip-Hop/R&B' : 'Electronic';
            mood = energy > 0.6 ? 'Energetic' : 'Deep';
          } else if (midEnergy > 0.4) {
            genre = 'Pop/Rock';
            mood = energy > 0.6 ? 'Upbeat' : 'Melancholic';
          } else if (highEnergy > 0.3) {
            genre = 'Acoustic/Folk';
            mood = energy > 0.5 ? 'Bright' : 'Intimate';
          }

          // Key estimation (simplified - would need proper pitch detection in production)
          const key = 'C Major'; // Placeholder - would use FFT and pitch detection

          resolve({
            duration,
            sampleRate,
            tempo,
            key,
            energy,
            genre,
            mood,
          });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }, []);

  // Transcribe audio to lyrics using transcription service
  const transcribeAudio = useCallback(async (file: File): Promise<TranscriptionResult> => {
    return await transcribeAudioService(file);
  }, []);

  // Handle file selection
  const handleFileSelect = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      setError('Please select an audio file (MP3, WAV, etc.)');
      return;
    }

    setError(null);
    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    // Analyze audio
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeAudio(file);
      setAudioAnalysis(analysis);
    } catch (err) {
      setError('Failed to analyze audio. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }

    // Transcribe lyrics
    setIsTranscribing(true);
    try {
      const transcriptionResult = await transcribeAudio(file);
      setTranscription(transcriptionResult);
    } catch (err) {
      console.error('Transcription error:', err);
      setTranscription({ lyrics: '[Transcription failed]', language: 'en', confidence: 0 });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(null);
    setAudioUrl(null);
    setAudioAnalysis(null);
    setTranscription(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generateReleasePlan = async () => {
    if (!currentUser) return;
    
    // If we have audio, use it; otherwise use text input
    const hasAudio = audioFile && audioAnalysis;
    const hasText = input.trim().length > 0;
    
    if (!hasAudio && !hasText) {
      setError('Please either upload an audio file or provide song information in the text field.');
      return;
    }

    setIsPlanning(true);
    const userInput = input.trim();

    // Extract song info from input
    const titleMatch = userInput.match(/(?:song|track|single|title)[\s:]+["']?([^"'\n]+)["']?/i) || userInput.match(/^["']?([^"'\n]+)["']?/i);
    const songTitle = titleMatch ? titleMatch[1] : (hasAudio ? 'Untitled Release' : 'My New Release');
    
    const genreMatch = userInput.match(/(?:genre|style)[\s:]+([^\n]+)/i);
    const genre = genreMatch ? genreMatch[1].trim() : (audioAnalysis?.genre || 'Hip-Hop');
    
    const vibeMatch = userInput.match(/(?:vibe|mood|feeling)[\s:]+([^\n]+)/i);
    const vibe = vibeMatch ? vibeMatch[1].trim() : (audioAnalysis?.mood || 'Energetic');
    
    const audienceMatch = userInput.match(/(?:audience|target|fans)[\s:]+([^\n]+)/i);
    const targetAudience = audienceMatch ? audienceMatch[1].trim() : '18-35, Music Lovers';
    
    const goalMatch = userInput.match(/(?:goal|want|need)[\s:]+(streams|fans|bookings|exposure)/i);
    const goal = goalMatch ? (goalMatch[1] as 'streams' | 'fans' | 'bookings' | 'exposure') : 'streams';
    
    const dateMatch = userInput.match(/(?:release|drop)[\s:]+([^\n]+)/i);
    const releaseDate = dateMatch ? new Date(dateMatch[1]).toISOString().split('T')[0] : new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate comprehensive release plan
      const plan: ReleasePlan = {
        songTitle,
        artistName: currentUser.name || 'Artist',
        genre,
        vibe,
        targetAudience,
        goal,
        releaseDate,
        timeline: [
          {
            phase: '120-90 Days Out',
            weeksOut: 120,
            tasks: [
              { title: 'Finalize song concept', description: 'Lock in final version and get feedback', dueDate: 'T-120', status: 'pending', category: 'metadata' },
              { title: 'Design cover art', description: 'Create 3000x3000px cover art', dueDate: 'T-90', status: 'pending', category: 'visuals' },
              { title: 'Secure ISRC/UPC codes', description: 'Register with distributor', dueDate: 'T-90', status: 'pending', category: 'metadata' },
            ],
          },
          {
            phase: '60-30 Days Out',
            weeksOut: 60,
            tasks: [
              { title: 'Submit to distributor', description: 'Upload to DistroKid/CD Baby/Tunecore', dueDate: 'T-30', status: 'pending', category: 'distribution' },
              { title: 'Create pre-save campaign', description: 'Set up Spotify/Apple Music pre-save links', dueDate: 'T-30', status: 'pending', category: 'marketing' },
              { title: 'Film behind-the-scenes content', description: 'Record studio sessions, writing process', dueDate: 'T-45', status: 'pending', category: 'social' },
            ],
          },
          {
            phase: '30-14 Days Out',
            weeksOut: 30,
            tasks: [
              { title: 'Start playlist pitching', description: 'Research and pitch to Spotify/Apple Music playlists', dueDate: 'T-14', status: 'pending', category: 'marketing' },
              { title: 'Create short-form content', description: 'Film TikTok/Reels/YouTube Shorts content', dueDate: 'T-14', status: 'pending', category: 'social' },
              { title: 'Press release outreach', description: 'Contact music blogs and press outlets', dueDate: 'T-21', status: 'pending', category: 'marketing' },
            ],
          },
          {
            phase: 'Release Week',
            weeksOut: 0,
            tasks: [
              { title: 'Verify all stores', description: 'Check all platforms for release', dueDate: 'Release Day', status: 'pending', category: 'distribution' },
              { title: 'Post release content', description: 'Share on all social platforms', dueDate: 'Release Day', status: 'pending', category: 'social' },
              { title: 'Engage with early listeners', description: 'Respond to comments and shares', dueDate: 'Release Day +1', status: 'pending', category: 'social' },
            ],
          },
        ],
        shortFormConcepts: [
          { title: 'Behind the Scenes', description: 'Show recording process and studio vibes', platform: 'TikTok', hook: 'Making this song was...', caption: 'The making of my new track 🎵', hashtags: ['music', 'behindthescenes', 'studio', 'newmusic'] },
          { title: 'Lyric Reveal', description: 'Show lyrics with visuals and captions', platform: 'Instagram Reels', hook: 'These lyrics hit different...', caption: 'When you hear it, you\'ll understand 💯', hashtags: ['lyrics', 'newmusic', 'songwriter'] },
          { title: 'Dance Challenge', description: 'Create a simple dance to the hook', platform: 'TikTok', hook: 'Try this move...', caption: 'Show me your version! 👇', hashtags: ['dance', 'challenge', 'viral'] },
          { title: 'Story Time', description: 'Tell the story behind the song', platform: 'YouTube Shorts', hook: 'This song is about...', caption: 'The real story behind the lyrics', hashtags: ['storytime', 'songwriting', 'music'] },
        ],
        metadata: {
          writers: [currentUser.name || 'Artist'],
          producers: [],
        },
        distribution: {
          platforms: ['Spotify', 'Apple Music', 'YouTube Music', 'Amazon Music', 'Tidal', 'Deezer'],
          releaseDate,
        },
        marketing: {
          playlistPitches: [
            { platform: 'Spotify', playlist: 'New Music Friday', contact: 'playlists@spotify.com' },
            { platform: 'Apple Music', playlist: 'Today\'s Hits', contact: 'playlists@apple.com' },
          ],
          pressReleases: [
            { outlet: 'Pitchfork', contact: 'tips@pitchfork.com', sent: false },
            { outlet: 'Complex', contact: 'news@complex.com', sent: false },
          ],
          influencerOutreach: [
            { influencer: 'Music Influencer 1', platform: 'TikTok', contact: 'contact@influencer.com' },
          ],
        },
        assets: {
          coverArt: false,
          pressImages: false,
          bannerSets: false,
          socialMediaAssets: false,
        },
      };

      setReleasePlan(plan);
      setInput('');
    } catch (err) {
      console.error('Generation failed:', err);
      setError('Failed to generate release plan. Please try again.');
    } finally {
      setIsPlanning(false);
    }
  };

  const savePlanAsDocument = async (plan: ReleasePlan) => {
    if (!currentUser) return;

    try {
      const documentContent = `RELEASE PLAN: ${plan.songTitle}
Artist: ${plan.artistName}
Genre: ${plan.genre}
Vibe: ${plan.vibe}
Target Audience: ${plan.targetAudience}
Goal: ${plan.goal}
Release Date: ${plan.releaseDate}

TIMELINE:
${plan.timeline.map(phase => `
${phase.phase} (${phase.weeksOut} weeks out):
${phase.tasks.map(task => `- [${task.status === 'completed' ? '✓' : ' '}] ${task.title}: ${task.description} (Due: ${task.dueDate})`).join('\n')}
`).join('\n')}

SHORT-FORM CONTENT CONCEPTS:
${plan.shortFormConcepts.map((concept, i) => `
${i + 1}. ${concept.title} (${concept.platform})
   Hook: ${concept.hook}
   Description: ${concept.description}
   Caption: ${concept.caption}
   Hashtags: ${concept.hashtags.join(' ')}
`).join('\n')}

METADATA:
ISRC: ${plan.metadata.isrc || 'Pending'}
UPC: ${plan.metadata.upc || 'Pending'}
Writers: ${plan.metadata.writers.join(', ')}
Producers: ${plan.metadata.producers.join(', ')}
${plan.metadata.label ? `Label: ${plan.metadata.label}` : ''}
${plan.metadata.distributor ? `Distributor: ${plan.metadata.distributor}` : ''}

DISTRIBUTION PLATFORMS:
${plan.distribution.platforms.join(', ')}

MARKETING:
Playlist Pitches: ${plan.marketing.playlistPitches.length}
Press Releases: ${plan.marketing.pressReleases.length}
Influencer Outreach: ${plan.marketing.influencerOutreach.length}

ASSETS:
Cover Art: ${plan.assets.coverArt ? '✓' : 'Pending'}
Press Images: ${plan.assets.pressImages ? '✓' : 'Pending'}
Banner Sets: ${plan.assets.bannerSets ? '✓' : 'Pending'}
Social Media Assets: ${plan.assets.socialMediaAssets ? '✓' : 'Pending'}

Generated by Aria Cantata - Stoodioz Release Engine
${new Date().toLocaleDateString()}`;

      const pdfBytes = await createPdfBytes(documentContent);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const file = new File([blob], `Release_Plan_${plan.songTitle.replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' });
      
      await apiService.uploadDocument(currentUser.id, file, {
        name: `Release Plan: ${plan.songTitle}`,
        type: 'RELEASE_PLAN',
        category: 'RELEASE',
      });

      alert(`Release plan saved to your Documents folder!`);
    } catch (err) {
      console.error('Failed to save release plan', err);
      alert('Failed to save release plan. Please try again.');
    }
  };

  const calculateDaysUntilRelease = (releaseDate: string): number => {
    const release = new Date(releaseDate);
    const today = new Date();
    const diff = release.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="relative rounded-3xl border-2 border-purple-500/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 backdrop-blur-xl p-8 shadow-2xl shadow-purple-500/10 overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-purple-500/5 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <PaperAirplaneIcon className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Release Engine</h3>
              <p className="text-sm text-zinc-400 mt-1">
                Complete release planning • Timeline • Content • Distribution • Marketing
              </p>
            </div>
          </div>

          {!releasePlan ? (
            <div className="space-y-4">
              {/* Drag and Drop Audio Upload */}
              {!audioFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed border-purple-500/40 rounded-2xl p-12 text-center cursor-pointer group hover:border-purple-500/70 transition-all bg-gradient-to-br from-zinc-950/80 to-zinc-900/80 backdrop-blur-sm overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-pink-500/0 group-hover:from-purple-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 transition-all"></div>
                  <div className="relative z-10">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UploadIcon className="w-10 h-10 text-purple-400" />
                    </div>
                    <p className="text-xl font-bold text-slate-100 mb-2 group-hover:text-purple-400 transition-colors">Drop your music here</p>
                    <p className="text-sm text-zinc-400 mb-4">or click to browse</p>
                    <p className="text-xs text-zinc-500 mb-2">Aria will analyze your song, extract lyrics, and create a personalized release plan</p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700 text-xs text-zinc-400">
                      <MusicNoteIcon className="w-4 h-4" />
                      <span>MP3, WAV, M4A, FLAC</span>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Audio File Info */}
                  <div className="p-5 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-2xl border border-purple-500/20 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                          <MusicNoteIcon className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-bold text-lg text-slate-100">{audioFile.name}</p>
                          <p className="text-xs text-zinc-400 mt-1">
                            {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                            {audioAnalysis && ` • ${audioAnalysis.duration.toFixed(2)}s`}
                          </p>
                        </div>
                      </div>
                      <button onClick={clearAudio} className="p-2.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <CloseIcon className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Analysis Status */}
                    {(isAnalyzing || isTranscribing) && (
                      <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-3 h-3 rounded-full bg-purple-400 animate-pulse"></div>
                          <p className="text-purple-300 font-bold text-sm">
                            {isAnalyzing && 'Analyzing audio...'}
                            {isTranscribing && !isAnalyzing && 'Extracting lyrics...'}
                          </p>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" style={{ width: '70%' }}></div>
                        </div>
                      </div>
                    )}

                    {/* Audio Analysis Results */}
                    {audioAnalysis && !isAnalyzing && (
                      <div className="mt-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                        <h5 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                          <SoundWaveIcon className="w-4 h-4" />
                          Audio Analysis
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                          {audioAnalysis.tempo && (
                            <div>
                              <p className="text-zinc-500 mb-1">Tempo</p>
                              <p className="text-slate-200 font-bold">{audioAnalysis.tempo} BPM</p>
                            </div>
                          )}
                          {audioAnalysis.key && (
                            <div>
                              <p className="text-zinc-500 mb-1">Key</p>
                              <p className="text-slate-200 font-bold">{audioAnalysis.key}</p>
                            </div>
                          )}
                          {audioAnalysis.energy !== undefined && (
                            <div>
                              <p className="text-zinc-500 mb-1">Energy</p>
                              <p className="text-slate-200 font-bold">{(audioAnalysis.energy * 100).toFixed(0)}%</p>
                            </div>
                          )}
                          {audioAnalysis.genre && (
                            <div>
                              <p className="text-zinc-500 mb-1">Genre</p>
                              <p className="text-slate-200 font-bold">{audioAnalysis.genre}</p>
                            </div>
                          )}
                          {audioAnalysis.mood && (
                            <div>
                              <p className="text-zinc-500 mb-1">Mood</p>
                              <p className="text-slate-200 font-bold">{audioAnalysis.mood}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Lyrics Transcription */}
                    {transcription && !isTranscribing && (
                      <div className="mt-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                        <h5 className="text-sm font-bold text-pink-400 mb-3 flex items-center gap-2">
                          <MusicNoteIcon className="w-4 h-4" />
                          Lyrics
                        </h5>
                        {transcription.lyrics && !transcription.lyrics.includes('[Transcription') ? (
                          <p className="text-xs text-slate-200 whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {transcription.lyrics}
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-500 italic">
                            {transcription.lyrics}
                          </p>
                        )}
                      </div>
                    )}

                    {error && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-2 border-red-500/30 rounded-xl">
                        <p className="text-red-400 font-semibold text-sm">{error}</p>
                      </div>
                    )}
                  </div>

                  {/* Audio Player */}
                  {audioUrl && (
                    <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
                      <audio src={audioUrl} controls className="w-full rounded-lg" />
                    </div>
                  )}
                </div>
              )}

              {/* Text Input Section */}
              <div className="p-6 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-2xl border border-purple-500/20 backdrop-blur-sm">
                <h4 className="text-lg font-bold text-purple-400 mb-4">
                  {audioFile ? 'Additional Information (Optional)' : 'Tell Aria About Your Release'}
                </h4>
                <p className="text-sm text-zinc-400 mb-4">
                  {audioFile 
                    ? 'Add any additional details: target audience, goals, release date preferences, etc.'
                    : 'Include: Song title, genre, vibe, target audience, goal (streams/fans/bookings), and your ideal release date. Or drag and drop your audio file above for automatic analysis.'}
                </p>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={audioFile 
                    ? "Example: 'Targeting 25-35 year olds who love The Weeknd and SZA. Goal is to hit 100k streams in first month. Want to release in 6 weeks.'"
                    : "Example: 'New single called 'Midnight Drive' - dark R&B, moody vibes, targeting 25-35 year olds who love The Weeknd and SZA. Goal is to hit 100k streams in first month. Want to release in 6 weeks.'"}
                  className="w-full min-h-[150px] rounded-xl bg-zinc-950 border border-zinc-800 text-slate-100 p-4 focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none"
                />
                <button
                  onClick={generateReleasePlan}
                  disabled={(!input.trim() && !audioFile) || isPlanning || isAnalyzing || isTranscribing}
                  className="mt-4 w-full px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-black text-lg hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isPlanning ? (
                    <>
                      <img src={appIcon} alt="Loading" className="w-5 h-5 animate-spin" />
                      <span>Creating Plan...</span>
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-6 h-6" />
                      <span>Generate Release Plan</span>
                    </>
                  )}
                </button>
              </div>

              {/* Conversation History */}
              {conversationHistory.length > 0 && (
                <div className="p-6 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-2xl border border-zinc-800 backdrop-blur-sm">
                  <h4 className="text-sm font-bold text-zinc-300 mb-3">Previous Conversations</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {conversationHistory.slice(-5).map((msg, i) => (
                      <div key={i} className="p-3 bg-zinc-900/50 rounded-lg text-xs">
                        <p className="text-zinc-400 mb-1">{msg.role === 'user' ? 'You' : 'Aria'}</p>
                        <p className="text-zinc-200">{msg.text.substring(0, 100)}...</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Release Plan Header */}
              <div className="p-6 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-2xl border border-purple-500/20 backdrop-blur-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                      {releasePlan.songTitle}
                    </h4>
                    <p className="text-sm text-zinc-400">
                      {releasePlan.artistName} • {releasePlan.genre} • {releasePlan.vibe}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Release Date: {releasePlan.releaseDate} ({calculateDaysUntilRelease(releasePlan.releaseDate)} days away)
                    </p>
                  </div>
                  <button
                    onClick={() => setReleasePlan(null)}
                    className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <CloseIcon className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => savePlanAsDocument(releasePlan)}
                  className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-colors text-sm font-semibold"
                >
                  Save Plan as Document
                </button>
              </div>

              {/* Timeline Visualization */}
              <div className="p-6 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-2xl border border-purple-500/20 backdrop-blur-sm">
                <h4 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-purple-400" />
                  Release Timeline
                </h4>
                <div className="space-y-4">
                  {releasePlan.timeline.map((phase, phaseIndex) => (
                    <div
                      key={phaseIndex}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        activePhase === phaseIndex
                          ? 'border-purple-500/50 bg-purple-500/10'
                          : 'border-zinc-800 bg-zinc-900/50'
                      }`}
                      onClick={() => setActivePhase(activePhase === phaseIndex ? null : phaseIndex)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            phase.weeksOut <= 2 ? 'bg-red-500' : phase.weeksOut <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          <h5 className="font-bold text-slate-200">{phase.phase}</h5>
                          <span className="text-xs text-zinc-500">({phase.weeksOut} weeks out)</span>
                        </div>
                        <span className="text-xs text-zinc-500">
                          {phase.tasks.filter(t => t.status === 'completed').length} / {phase.tasks.length} completed
                        </span>
                      </div>
                      {activePhase === phaseIndex && (
                        <div className="mt-3 space-y-2">
                          {phase.tasks.map((task, taskIndex) => (
                            <div
                              key={taskIndex}
                              className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-800"
                            >
                              <div className="flex items-start gap-3">
                                <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  task.status === 'completed'
                                    ? 'bg-green-500 border-green-500'
                                    : task.status === 'in_progress'
                                    ? 'bg-yellow-500 border-yellow-500'
                                    : 'border-zinc-600'
                                }`}>
                                  {task.status === 'completed' && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-slate-200">{task.title}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      task.category === 'visuals' ? 'bg-purple-500/20 text-purple-400' :
                                      task.category === 'metadata' ? 'bg-blue-500/20 text-blue-400' :
                                      task.category === 'distribution' ? 'bg-green-500/20 text-green-400' :
                                      task.category === 'marketing' ? 'bg-orange-500/20 text-orange-400' :
                                      'bg-pink-500/20 text-pink-400'
                                    }`}>
                                      {task.category}
                                    </span>
                                  </div>
                                  <p className="text-xs text-zinc-400 mb-2">{task.description}</p>
                                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                                    <span className="flex items-center gap-1">
                                      <ClockIcon className="w-3 h-3" />
                                      Due: {task.dueDate}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Short-Form Content Concepts */}
              <div className="p-6 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-2xl border border-purple-500/20 backdrop-blur-sm">
                <h4 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4 flex items-center gap-2">
                  <PlayIcon className="w-5 h-5 text-purple-400" />
                  Short-Form Content Concepts ({releasePlan.shortFormConcepts.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {releasePlan.shortFormConcepts.map((concept, i) => (
                    <div key={i} className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-purple-400">#{i + 1}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">
                          {concept.platform}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-200 mb-2">{concept.title}</h5>
                      <p className="text-xs text-zinc-400 mb-2">{concept.description}</p>
                      <div className="p-2 bg-zinc-950 rounded-lg mb-2">
                        <p className="text-xs text-zinc-500 mb-1">Hook:</p>
                        <p className="text-xs text-slate-200 font-semibold">{concept.hook}</p>
                      </div>
                      <div className="p-2 bg-zinc-950 rounded-lg mb-2">
                        <p className="text-xs text-zinc-500 mb-1">Caption:</p>
                        <p className="text-xs text-slate-200">{concept.caption}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {concept.hashtags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="text-xs text-purple-400">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metadata & Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
                  <h4 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
                    <MusicNoteIcon className="w-5 h-5" />
                    Metadata
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-zinc-500 mb-1">ISRC</p>
                      <p className="text-slate-200">{releasePlan.metadata.isrc || 'Pending'}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">UPC</p>
                      <p className="text-slate-200">{releasePlan.metadata.upc || 'Pending'}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">Writers</p>
                      <p className="text-slate-200">{releasePlan.metadata.writers.join(', ') || 'Pending'}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">Producers</p>
                      <p className="text-slate-200">{releasePlan.metadata.producers.join(', ') || 'Pending'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-2xl border border-green-500/20 backdrop-blur-sm">
                  <h4 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                    <ChartBarIcon className="w-5 h-5" />
                    Distribution
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-zinc-500 mb-2">Platforms ({releasePlan.distribution.platforms.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {releasePlan.distribution.platforms.map((platform, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                    {releasePlan.distribution.preSaveLink && (
                      <div>
                        <p className="text-sm text-zinc-500 mb-1">Pre-Save Link</p>
                        <a href={releasePlan.distribution.preSaveLink} target="_blank" rel="noopener noreferrer" className="text-sm text-green-400 hover:underline">
                          {releasePlan.distribution.preSaveLink}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Marketing Strategy */}
              <div className="p-6 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-2xl border border-orange-500/20 backdrop-blur-sm">
                <h4 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2">
                  <PaperAirplaneIcon className="w-5 h-5" />
                  Marketing Strategy
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-300 mb-2">Playlist Pitches ({releasePlan.marketing.playlistPitches.length})</p>
                    <div className="space-y-2">
                      {releasePlan.marketing.playlistPitches.slice(0, 3).map((pitch, i) => (
                        <div key={i} className="p-2 bg-zinc-900/50 rounded text-xs">
                          <p className="text-slate-200">{pitch.playlist}</p>
                          <p className="text-zinc-500">{pitch.platform}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-300 mb-2">Press Releases ({releasePlan.marketing.pressReleases.length})</p>
                    <div className="space-y-2">
                      {releasePlan.marketing.pressReleases.slice(0, 3).map((press, i) => (
                        <div key={i} className="p-2 bg-zinc-900/50 rounded text-xs">
                          <p className="text-slate-200">{press.outlet}</p>
                          <p className="text-zinc-500">{press.sent ? 'Sent ✓' : 'Pending'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-300 mb-2">Influencer Outreach ({releasePlan.marketing.influencerOutreach.length})</p>
                    <div className="space-y-2">
                      {releasePlan.marketing.influencerOutreach.slice(0, 3).map((inf, i) => (
                        <div key={i} className="p-2 bg-zinc-900/50 rounded text-xs">
                          <p className="text-slate-200">{inf.influencer}</p>
                          <p className="text-zinc-500">{inf.platform}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assets Checklist */}
              <div className="p-6 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-2xl border border-pink-500/20 backdrop-blur-sm">
                <h4 className="text-lg font-bold text-pink-400 mb-4 flex items-center gap-2">
                  <PhotoIcon className="w-5 h-5" />
                  Assets Checklist
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-xl border ${releasePlan.assets.coverArt ? 'border-green-500/50 bg-green-500/10' : 'border-zinc-800 bg-zinc-900/50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {releasePlan.assets.coverArt ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-zinc-600 rounded-full"></div>
                      )}
                      <p className="font-semibold text-slate-200">Cover Art</p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border ${releasePlan.assets.pressImages ? 'border-green-500/50 bg-green-500/10' : 'border-zinc-800 bg-zinc-900/50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {releasePlan.assets.pressImages ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-zinc-600 rounded-full"></div>
                      )}
                      <p className="font-semibold text-slate-200">Press Images</p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border ${releasePlan.assets.bannerSets ? 'border-green-500/50 bg-green-500/10' : 'border-zinc-800 bg-zinc-900/50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {releasePlan.assets.bannerSets ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-zinc-600 rounded-full"></div>
                      )}
                      <p className="font-semibold text-slate-200">Banner Sets</p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border ${releasePlan.assets.socialMediaAssets ? 'border-green-500/50 bg-green-500/10' : 'border-zinc-800 bg-zinc-900/50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {releasePlan.assets.socialMediaAssets ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-zinc-600 rounded-full"></div>
                      )}
                      <p className="font-semibold text-slate-200">Social Assets</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt: `Continue working on the release plan for "${releasePlan.songTitle}". The user wants to discuss or modify the plan.` } });
                  dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } });
                }}
                className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-black text-lg hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 flex items-center justify-center gap-3"
              >
                <PaperAirplaneIcon className="w-6 h-6" />
                Continue Conversation with Aria
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReleaseEngine;
