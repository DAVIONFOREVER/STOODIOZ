import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppState, ActionTypes } from '../contexts/AppContext';
import { UserRole } from '../types';
import { MusicNoteIcon, UploadIcon, CloseIcon, SoundWaveIcon, ChartBarIcon, PlayIcon } from './icons';
import appIcon from '../assets/stoodioz-app-icon.png';

interface AudioAnalysis {
  duration: number;
  sampleRate: number;
  peakLevel: number;
  rmsLevel: number;
  frequencySpectrum: { freq: number; magnitude: number }[];
  stereoWidth: number;
  lowEndEnergy: number; // 20-250Hz
  midRangeEnergy: number; // 250-4kHz
  highEndEnergy: number; // 4kHz-20kHz
  dynamicRange: number;
  hasClipping: boolean;
}

interface TargetRanges {
  peakLevel: { min: number; max: number; ideal: number };
  rmsLevel: { min: number; max: number; ideal: number };
  dynamicRange: { min: number; max: number; ideal: number };
  lowEnd: { min: number; max: number; ideal: number };
  midRange: { min: number; max: number; ideal: number };
  highEnd: { min: number; max: number; ideal: number };
  stereoWidth: { min: number; max: number; ideal: number };
  lufs: { min: number; max: number; ideal: number };
}

// Industry-standard target ranges from top engineers
const TARGET_RANGES: TargetRanges = {
  peakLevel: { min: -1.0, max: -0.3, ideal: -0.5 }, // True Peak: -0.3 to -1.0dB
  rmsLevel: { min: -18, max: -12, ideal: -14 }, // RMS: -12 to -18dB (varies by genre)
  dynamicRange: { min: 8, max: 14, ideal: 10 }, // Dynamic Range: 8-14dB is healthy
  lowEnd: { min: 0.25, max: 0.35, ideal: 0.30 }, // Low: 25-35% (bass foundation)
  midRange: { min: 0.40, max: 0.50, ideal: 0.45 }, // Mid: 40-50% (vocals, melody)
  highEnd: { min: 0.20, max: 0.30, ideal: 0.25 }, // High: 20-30% (sparkle, air)
  stereoWidth: { min: 0.60, max: 0.80, ideal: 0.70 }, // Stereo Width: 60-80%
  lufs: { min: -16, max: -14, ideal: -14.5 }, // LUFS: -14 to -16 for streaming
};

const isInRange = (value: number, range: { min: number; max: number }): boolean => {
  return value >= range.min && value <= range.max;
};

const getStatusColor = (value: number, range: { min: number; max: number; ideal: number }): string => {
  if (isInRange(value, range)) return 'text-green-400';
  const distanceFromIdeal = Math.abs(value - range.ideal);
  const rangeSize = range.max - range.min;
  if (distanceFromIdeal > rangeSize * 0.3) return 'text-red-400';
  return 'text-yellow-400';
};

const MixDoctor: React.FC = () => {
  const dispatch = useAppDispatch();
  const { userRole } = useAppState();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [realTimeData, setRealTimeData] = useState<{
    peak: number;
    rms: number;
    stereoWidth: number;
    frequencyData: Uint8Array;
  } | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewParameters, setPreviewParameters] = useState<{
    eqLow: { frequency: number; gain: number; type: string };
    eqMid: { frequency: number; gain: number; q: number; type: string };
    eqHigh: { frequency: number; gain: number; type: string };
    compressor: { threshold: number; ratio: number; attack: number; release: number; knee: number };
    gain: { adjustment: number };
  } | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  const previewContextRef = useRef<AudioContext | null>(null);
  const previewNodesRef = useRef<{
    eqLow?: BiquadFilterNode;
    eqMid?: BiquadFilterNode;
    eqHigh?: BiquadFilterNode;
    compressor?: DynamicsCompressorNode;
    gain?: GainNode;
  }>({});

  const isProducer = userRole === UserRole.PRODUCER;
  const isEngineer = userRole === UserRole.ENGINEER;

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

          // Peak and RMS
          let peak = 0;
          let sumSquares = 0;
          let clippingCount = 0;
          for (let i = 0; i < length; i++) {
            const abs = Math.abs(channelData[i]);
            if (abs > peak) peak = abs;
            sumSquares += channelData[i] * channelData[i];
            if (abs >= 0.99) clippingCount++;
          }
          const rms = Math.sqrt(sumSquares / length);
          const peakDb = 20 * Math.log10(peak || 0.0001);
          const rmsDb = 20 * Math.log10(rms || 0.0001);
          const dynamicRange = peakDb - rmsDb;

          // Frequency analysis: Simple FFT on a sample of the audio
          // Take a representative sample from the middle of the track
          const sampleStart = Math.floor(length * 0.4);
          const sampleEnd = Math.min(sampleStart + 4096, length);
          const sample = channelData.slice(sampleStart, sampleEnd);
          
          // Simple frequency band analysis using power in frequency ranges
          const spectrum: { freq: number; magnitude: number }[] = [];
          const nyquist = sampleRate / 2;
          
          // Analyze frequency bands (simplified approach)
          const bands = 64; // 64 frequency bands
          for (let i = 0; i < bands; i++) {
            const freqStart = (i / bands) * nyquist;
            const freqEnd = ((i + 1) / bands) * nyquist;
            
            // Simple magnitude estimation based on sample rate and frequency
            // This is a simplified approach - real FFT would be more accurate
            let magnitude = 0;
            const samplesPerCycle = sampleRate / ((freqStart + freqEnd) / 2);
            for (let j = 0; j < sample.length; j += Math.max(1, Math.floor(samplesPerCycle / 4))) {
              magnitude += Math.abs(sample[j]);
            }
            magnitude = magnitude / (sample.length / Math.max(1, Math.floor(samplesPerCycle / 4)));
            magnitude = Math.min(1, magnitude * 10); // Normalize
            
            spectrum.push({ freq: (freqStart + freqEnd) / 2, magnitude });
          }

          // Frequency band energy
          const lowEnd = spectrum.filter((s) => s.freq >= 20 && s.freq < 250);
          const midRange = spectrum.filter((s) => s.freq >= 250 && s.freq < 4000);
          const highEnd = spectrum.filter((s) => s.freq >= 4000 && s.freq <= 20000);

          const lowEndEnergy = lowEnd.length > 0 ? lowEnd.reduce((sum, s) => sum + s.magnitude, 0) / lowEnd.length : 0;
          const midRangeEnergy = midRange.length > 0 ? midRange.reduce((sum, s) => sum + s.magnitude, 0) / midRange.length : 0;
          const highEndEnergy = highEnd.length > 0 ? highEnd.reduce((sum, s) => sum + s.magnitude, 0) / highEnd.length : 0;

          // Normalize to percentages
          const totalEnergy = lowEndEnergy + midRangeEnergy + highEndEnergy;
          const normalizedLow = totalEnergy > 0 ? lowEndEnergy / totalEnergy : 0;
          const normalizedMid = totalEnergy > 0 ? midRangeEnergy / totalEnergy : 0;
          const normalizedHigh = totalEnergy > 0 ? highEndEnergy / totalEnergy : 0;

          // Stereo width (if stereo)
          let stereoWidth = 0;
          if (audioBuffer.numberOfChannels > 1) {
            const leftChannel = audioBuffer.getChannelData(0);
            const rightChannel = audioBuffer.getChannelData(1);
            let correlation = 0;
            for (let i = 0; i < Math.min(leftChannel.length, rightChannel.length); i += 100) {
              correlation += leftChannel[i] * rightChannel[i];
            }
            stereoWidth = Math.abs(correlation / (length / 100));
          }

          resolve({
            duration,
            sampleRate,
            peakLevel: peakDb,
            rmsLevel: rmsDb,
            frequencySpectrum: spectrum.slice(0, 100), // First 100 points for prompt
            stereoWidth,
            lowEndEnergy: normalizedLow,
            midRangeEnergy: normalizedMid,
            highEndEnergy: normalizedHigh,
            dynamicRange,
            hasClipping: clippingCount > length * 0.001, // >0.1% samples clipped
          });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }, []);

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

    setIsAnalyzing(true);
    try {
      const result = await analyzeAudio(file);
      setAnalysis(result);
    } catch (err) {
      setError('Failed to analyze audio. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
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

  const openAriaWithAnalysis = () => {
    if (!analysis || !audioFile) return;

    // Calculate deviations from targets
    const peakDeviation = analysis.peakLevel - TARGET_RANGES.peakLevel.ideal;
    const rmsDeviation = analysis.rmsLevel - TARGET_RANGES.rmsLevel.ideal;
    const dynamicRangeDeviation = analysis.dynamicRange - TARGET_RANGES.dynamicRange.ideal;
    const lowEndDeviation = (analysis.lowEndEnergy - TARGET_RANGES.lowEnd.ideal) * 100;
    const midRangeDeviation = (analysis.midRangeEnergy - TARGET_RANGES.midRange.ideal) * 100;
    const highEndDeviation = (analysis.highEndEnergy - TARGET_RANGES.highEnd.ideal) * 100;
    const stereoWidthDeviation = (analysis.stereoWidth - TARGET_RANGES.stereoWidth.ideal) * 100;

    // Simple user-facing prompt - just the data and a request
    // The system instructions in geminiService.ts will handle HOW Aria should respond
    const prompt = `I just analyzed my audio file "${audioFile.name}" with Mix Doctor. Here's what I found:

**Audio Analysis:**
- Duration: ${analysis.duration.toFixed(2)}s | Sample Rate: ${analysis.sampleRate}Hz
- Peak Level: ${analysis.peakLevel.toFixed(1)} dB (Target: ${TARGET_RANGES.peakLevel.min} to ${TARGET_RANGES.peakLevel.max} dB) ${peakDeviation !== 0 ? `[${peakDeviation > 0 ? '+' : ''}${peakDeviation.toFixed(1)} dB from ideal]` : '[Perfect]'}
- RMS Level: ${analysis.rmsLevel.toFixed(1)} dB (Target: ${TARGET_RANGES.rmsLevel.min} to ${TARGET_RANGES.rmsLevel.max} dB) ${rmsDeviation !== 0 ? `[${rmsDeviation > 0 ? '+' : ''}${rmsDeviation.toFixed(1)} dB from ideal]` : '[Perfect]'}
- Dynamic Range: ${analysis.dynamicRange.toFixed(1)} dB (Target: ${TARGET_RANGES.dynamicRange.min} to ${TARGET_RANGES.dynamicRange.max} dB) ${dynamicRangeDeviation !== 0 ? `[${dynamicRangeDeviation > 0 ? '+' : ''}${dynamicRangeDeviation.toFixed(1)} dB from ideal]` : '[Perfect]'}
- Frequency Balance:
  • Low End (20-250Hz): ${(analysis.lowEndEnergy * 100).toFixed(0)}% (Target: ${(TARGET_RANGES.lowEnd.min * 100).toFixed(0)}-${(TARGET_RANGES.lowEnd.max * 100).toFixed(0)}%) ${lowEndDeviation !== 0 ? `[${lowEndDeviation > 0 ? '+' : ''}${lowEndDeviation.toFixed(0)}% from ideal]` : '[Perfect]'}
  • Mid Range (250-4kHz): ${(analysis.midRangeEnergy * 100).toFixed(0)}% (Target: ${(TARGET_RANGES.midRange.min * 100).toFixed(0)}-${(TARGET_RANGES.midRange.max * 100).toFixed(0)}%) ${midRangeDeviation !== 0 ? `[${midRangeDeviation > 0 ? '+' : ''}${midRangeDeviation.toFixed(0)}% from ideal]` : '[Perfect]'}
  • High End (4kHz-20kHz): ${(analysis.highEndEnergy * 100).toFixed(0)}% (Target: ${(TARGET_RANGES.highEnd.min * 100).toFixed(0)}-${(TARGET_RANGES.highEnd.max * 100).toFixed(0)}%) ${highEndDeviation !== 0 ? `[${highEndDeviation > 0 ? '+' : ''}${highEndDeviation.toFixed(0)}% from ideal]` : '[Perfect]'}
- Stereo Width: ${(analysis.stereoWidth * 100).toFixed(0)}% (Target: ${(TARGET_RANGES.stereoWidth.min * 100).toFixed(0)}-${(TARGET_RANGES.stereoWidth.max * 100).toFixed(0)}%) ${stereoWidthDeviation !== 0 ? `[${stereoWidthDeviation > 0 ? '+' : ''}${stereoWidthDeviation.toFixed(0)}% from ideal]` : '[Perfect]'}
- Clipping: ${analysis.hasClipping ? 'YES ⚠️' : 'NO ✓'}

${isProducer ? 'Can you analyze this beat and tell me what needs to be fixed? I want to understand WHY things matter, not just what to do. Please explain it clearly and give me specific recommendations with plugin suggestions.' : 'Can you analyze this mix and tell me what needs to be fixed? I want to understand WHY each fix matters. Please give me specific recommendations with exact settings and plugin suggestions to achieve the target values.'}`;

    dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt } });
    dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } });
  };

  // Setup real-time audio analysis
  const setupRealTimeAnalysis = useCallback(() => {
    if (!audioRef.current || !spectrumCanvasRef.current || !waveformCanvasRef.current) return;

    try {
      // Create audio context if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioContext = audioContextRef.current;

      // Create analyser node
      if (!analyserRef.current) {
        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 2048;
        analyserRef.current.smoothingTimeConstant = 0.8;
      }
      const analyser = analyserRef.current;

      // Connect audio element to analyser
      if (!sourceRef.current) {
        sourceRef.current = audioContext.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(analyser);
        analyser.connect(audioContext.destination);
      }

      const spectrumCanvas = spectrumCanvasRef.current;
      const waveformCanvas = waveformCanvasRef.current;
      const spectrumCtx = spectrumCanvas.getContext('2d');
      const waveformCtx = waveformCanvas.getContext('2d');
      if (!spectrumCtx || !waveformCtx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const waveformArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!audioRef.current || audioRef.current.paused) {
          animationFrameRef.current = requestAnimationFrame(draw);
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        analyser.getByteTimeDomainData(waveformArray);

        // Calculate real-time metrics
        let sum = 0;
        let peak = 0;
        for (let i = 0; i < bufferLength; i++) {
          const value = dataArray[i];
          sum += value;
          if (value > peak) peak = value;
        }
        const rms = Math.sqrt(sum / bufferLength);
        const peakDb = 20 * Math.log10((peak / 255) || 0.001);
        const rmsDb = 20 * Math.log10((rms / 255) || 0.001);

        // Calculate stereo width (if stereo)
        let stereoWidth = 0;
        if (audioRef.current && analyserRef.current) {
          // Simplified stereo width calculation
          const leftRightDiff = Math.abs(dataArray[0] - (dataArray[bufferLength / 2] || 0));
          stereoWidth = Math.max(0, Math.min(1, 1 - (leftRightDiff / 255)));
        }

        setRealTimeData({
          peak: peakDb,
          rms: rmsDb,
          stereoWidth,
          frequencyData: dataArray,
        });

        // Draw frequency spectrum
        spectrumCtx.fillStyle = '#0a0a0a';
        spectrumCtx.fillRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);

        const barWidth = (spectrumCanvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * spectrumCanvas.height;
          
          // Color based on frequency range
          const freq = (i / bufferLength) * (audioContext.sampleRate / 2);
          let gradient;
          if (freq < 250) {
            gradient = spectrumCtx.createLinearGradient(0, 0, 0, spectrumCanvas.height);
            gradient.addColorStop(0, '#f97316'); // Orange
            gradient.addColorStop(1, '#ea580c');
          } else if (freq < 4000) {
            gradient = spectrumCtx.createLinearGradient(0, 0, 0, spectrumCanvas.height);
            gradient.addColorStop(0, '#a855f7'); // Purple
            gradient.addColorStop(1, '#9333ea');
          } else {
            gradient = spectrumCtx.createLinearGradient(0, 0, 0, spectrumCanvas.height);
            gradient.addColorStop(0, '#3b82f6'); // Blue
            gradient.addColorStop(1, '#2563eb');
          }

          spectrumCtx.fillStyle = gradient;
          spectrumCtx.fillRect(x, spectrumCanvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }

        // Draw waveform
        waveformCtx.fillStyle = '#0a0a0a';
        waveformCtx.fillRect(0, 0, waveformCanvas.width, waveformCanvas.height);

        waveformCtx.lineWidth = 2;
        waveformCtx.strokeStyle = '#10b981'; // Green
        waveformCtx.beginPath();

        const sliceWidth = waveformCanvas.width / bufferLength;
        let waveformX = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = waveformArray[i] / 128.0;
          const y = (v * waveformCanvas.height) / 2;

          if (i === 0) {
            waveformCtx.moveTo(waveformX, y);
          } else {
            waveformCtx.lineTo(waveformX, y);
          }

          waveformX += sliceWidth;
        }

        waveformCtx.lineTo(waveformCanvas.width, waveformCanvas.height / 2);
        waveformCtx.stroke();

        animationFrameRef.current = requestAnimationFrame(draw);
      };

      draw();
    } catch (err) {
      console.error('Error setting up real-time analysis:', err);
    }
  }, []);

  // Cleanup on unmount or file change
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [audioUrl]);

  // Setup real-time analysis when audio is ready
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      const handleCanPlay = () => {
        setupRealTimeAnalysis();
      };
      audioRef.current.addEventListener('canplay', handleCanPlay);
      if (audioRef.current.readyState >= 3) {
        setupRealTimeAnalysis();
      }
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('canplay', handleCanPlay);
        }
      };
    }
  }, [audioUrl, setupRealTimeAnalysis]);

  // Generate preview with applied fixes
  const generatePreview = useCallback(async () => {
    if (!analysis || !audioFile || !audioUrl) return;

    setIsGeneratingPreview(true);
    try {
      // Create audio context for processing
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      previewContextRef.current = context;

      // Load audio file
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(arrayBuffer);

      // Calculate adjustments needed
      const lowEndAdjustment = (TARGET_RANGES.lowEnd.ideal - analysis.lowEndEnergy) * 100; // Percentage to adjust
      const midRangeAdjustment = (TARGET_RANGES.midRange.ideal - analysis.midRangeEnergy) * 100;
      const highEndAdjustment = (TARGET_RANGES.highEnd.ideal - analysis.highEndEnergy) * 100;
      const rmsAdjustment = TARGET_RANGES.rmsLevel.ideal - analysis.rmsLevel; // dB adjustment
      const dynamicRangeAdjustment = TARGET_RANGES.dynamicRange.ideal - analysis.dynamicRange;

      // Create offline context for rendering (30 seconds max)
      const sampleRate = audioBuffer.sampleRate;
      const duration = Math.min(30, audioBuffer.duration);
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        sampleRate * duration,
        sampleRate
      );

      // Create source
      const source = offlineContext.createBufferSource();
      const buffer = offlineContext.createBuffer(
        audioBuffer.numberOfChannels,
        sampleRate * duration,
        sampleRate
      );

      // Copy first 30 seconds
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const newChannelData = buffer.getChannelData(channel);
        for (let i = 0; i < newChannelData.length; i++) {
          newChannelData[i] = channelData[i] || 0;
        }
      }

      source.buffer = buffer;

      // Apply EQ adjustments
      const eqLow = offlineContext.createBiquadFilter();
      eqLow.type = 'lowshelf';
      eqLow.frequency.value = 250;
      const eqLowGain = lowEndAdjustment > 0 ? Math.min(6, lowEndAdjustment * 0.1) : Math.max(-6, lowEndAdjustment * 0.1);
      eqLow.gain.value = eqLowGain;

      const eqMid = offlineContext.createBiquadFilter();
      eqMid.type = 'peaking';
      eqMid.frequency.value = 2000;
      eqMid.Q.value = 1;
      const eqMidGain = midRangeAdjustment > 0 ? Math.min(6, midRangeAdjustment * 0.1) : Math.max(-6, midRangeAdjustment * 0.1);
      eqMid.gain.value = eqMidGain;

      const eqHigh = offlineContext.createBiquadFilter();
      eqHigh.type = 'highshelf';
      eqHigh.frequency.value = 4000;
      const eqHighGain = highEndAdjustment > 0 ? Math.min(6, highEndAdjustment * 0.1) : Math.max(-6, highEndAdjustment * 0.1);
      eqHigh.gain.value = eqHighGain;

      // Apply compression if needed
      const compressor = offlineContext.createDynamicsCompressor();
      let compThreshold: number;
      let compRatio: number;
      if (dynamicRangeAdjustment < 0) {
        // Too compressed, reduce compression
        compThreshold = -20;
        compRatio = 2;
        compressor.threshold.value = compThreshold;
        compressor.ratio.value = compRatio;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.1;
      } else {
        // Needs more compression
        compThreshold = -12;
        compRatio = 4;
        compressor.threshold.value = compThreshold;
        compressor.ratio.value = compRatio;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.1;
      }
      compressor.knee.value = 5;

      // Apply gain adjustment for RMS
      const gainNode = offlineContext.createGain();
      const gainValue = Math.pow(10, rmsAdjustment / 20);
      gainNode.gain.value = gainValue;

      // Store preview parameters
      setPreviewParameters({
        eqLow: { frequency: 250, gain: eqLowGain, type: 'Low Shelf' },
        eqMid: { frequency: 2000, gain: eqMidGain, q: 1, type: 'Peaking' },
        eqHigh: { frequency: 4000, gain: eqHighGain, type: 'High Shelf' },
        compressor: {
          threshold: compThreshold,
          ratio: compRatio,
          attack: 0.003,
          release: 0.1,
          knee: 5,
        },
        gain: { adjustment: rmsAdjustment },
      });

      // Connect: source -> EQ -> compressor -> gain -> destination
      source.connect(eqLow);
      eqLow.connect(eqMid);
      eqMid.connect(eqHigh);
      eqHigh.connect(compressor);
      compressor.connect(gainNode);
      gainNode.connect(offlineContext.destination);

      // Store nodes for cleanup
      previewNodesRef.current = { eqLow, eqMid, eqHigh, compressor, gain: gainNode };

      // Start playback and render
      source.start(0);
      const renderedBuffer = await offlineContext.startRendering();

      // Convert to WAV blob
      const wav = audioBufferToWav(renderedBuffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error('Error generating preview:', err);
      setError('Failed to generate preview. Please try again.');
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [analysis, audioFile, audioUrl]);

  // Helper function to convert AudioBuffer to WAV
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);

    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return arrayBuffer;
  };

  const clearFile = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (previewContextRef.current && previewContextRef.current.state !== 'closed') {
      previewContextRef.current.close();
      previewContextRef.current = null;
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPreviewParameters(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(null);
    setAudioUrl(null);
    setAnalysis(null);
    setError(null);
    setRealTimeData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="relative rounded-3xl border-2 border-orange-500/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 backdrop-blur-xl p-8 shadow-2xl shadow-orange-500/10 overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-purple-500/5 to-orange-500/5 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-purple-500/20 border border-orange-500/30">
              <SoundWaveIcon className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-400">Mix Doctor</h3>
              <p className="text-sm text-zinc-400 mt-1">
                {isProducer
                  ? 'Professional beat analysis • Know exactly what to fix'
                  : isEngineer
                  ? 'Surgical mix analysis • Techniques from world-class engineers'
                  : 'Professional audio analysis powered by Aria'}
              </p>
            </div>
          </div>

          {!audioFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-orange-500/40 rounded-2xl p-16 text-center cursor-pointer group hover:border-orange-500/70 transition-all bg-gradient-to-br from-zinc-950/80 to-zinc-900/80 backdrop-blur-sm overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-purple-500/0 group-hover:from-orange-500/10 group-hover:via-orange-500/10 group-hover:to-purple-500/10 transition-all"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-500/20 to-purple-500/20 border-2 border-orange-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadIcon className="w-10 h-10 text-orange-400" />
                </div>
                <p className="text-xl font-bold text-slate-100 mb-2 group-hover:text-orange-400 transition-colors">Drop your audio here</p>
                <p className="text-sm text-zinc-400 mb-4">or click to browse</p>
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
            <div className="space-y-6">
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-zinc-950/90 to-zinc-900/90 rounded-2xl border border-orange-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-purple-500/20 border border-orange-500/30">
                    <MusicNoteIcon className="w-8 h-8 text-orange-400" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-slate-100">{audioFile.name}</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                      {analysis && ` • ${analysis.duration.toFixed(2)}s • ${analysis.sampleRate}Hz`}
                    </p>
                  </div>
                </div>
                <button onClick={clearFile} className="p-2.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              {isAnalyzing && (
                <div className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 rounded-2xl backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse"></div>
                    <p className="text-blue-300 font-bold">Analyzing audio with professional algorithms...</p>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" style={{ width: '70%' }}></div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-5 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-2 border-red-500/30 rounded-2xl">
                  <p className="text-red-400 font-semibold">{error}</p>
                </div>
              )}

              {analysis && !isAnalyzing && (
                <div className="space-y-6">
                  {/* Frequency Spectrum Visualizer */}
                  <div className="p-6 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-2xl border border-orange-500/20 backdrop-blur-sm">
                    <h4 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-400 mb-4 flex items-center gap-2">
                      <ChartBarIcon className="w-5 h-5 text-orange-400" />
                      Frequency Spectrum
                    </h4>
                    <div className="h-32 bg-zinc-950 rounded-xl p-4 border border-zinc-800 flex items-end justify-center gap-1">
                      {analysis.frequencySpectrum.slice(0, 32).map((band, i) => {
                        const height = Math.max(4, band.magnitude * 100);
                        return (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t rounded-t transition-all hover:opacity-80"
                            style={{
                              height: `${height}%`,
                              background: `linear-gradient(to top, ${band.freq < 250 ? '#f97316' : band.freq < 4000 ? '#a855f7' : '#3b82f6'}, ${band.freq < 250 ? '#ea580c' : band.freq < 4000 ? '#9333ea' : '#2563eb'})`,
                              minHeight: '4px'
                            }}
                            title={`${band.freq.toFixed(0)}Hz: ${(band.magnitude * 100).toFixed(1)}%`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-zinc-500">
                      <span>20Hz</span>
                      <span>20kHz</span>
                    </div>
                  </div>

                  {/* Analysis Metrics Grid with Targets */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-400 mb-4">
                      Current vs. Target Values
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Peak Level */}
                      <div className="p-5 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-xl border border-zinc-800 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-zinc-500">Peak Level (True Peak)</p>
                          <span className={`text-xs font-bold ${getStatusColor(analysis.peakLevel, TARGET_RANGES.peakLevel)}`}>
                            {isInRange(analysis.peakLevel, TARGET_RANGES.peakLevel) ? '✓ In Range' : '⚠ Needs Adjustment'}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <p className="text-3xl font-black text-orange-400">{analysis.peakLevel.toFixed(1)}</p>
                          <p className="text-sm text-zinc-500">dB</p>
                        </div>
                        <div className="text-xs text-zinc-400">
                          <span className="text-zinc-500">Target: </span>
                          {TARGET_RANGES.peakLevel.min} to {TARGET_RANGES.peakLevel.max} dB
                          <span className="text-zinc-600 ml-2">(Ideal: {TARGET_RANGES.peakLevel.ideal} dB)</span>
                        </div>
                        <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isInRange(analysis.peakLevel, TARGET_RANGES.peakLevel) ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{
                              width: `${Math.max(0, Math.min(100, ((analysis.peakLevel + 3) / 3) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* RMS Level */}
                      <div className="p-5 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-xl border border-zinc-800 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-zinc-500">RMS Level (Average)</p>
                          <span className={`text-xs font-bold ${getStatusColor(analysis.rmsLevel, TARGET_RANGES.rmsLevel)}`}>
                            {isInRange(analysis.rmsLevel, TARGET_RANGES.rmsLevel) ? '✓ In Range' : '⚠ Needs Adjustment'}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <p className="text-3xl font-black text-purple-400">{analysis.rmsLevel.toFixed(1)}</p>
                          <p className="text-sm text-zinc-500">dB</p>
                        </div>
                        <div className="text-xs text-zinc-400">
                          <span className="text-zinc-500">Target: </span>
                          {TARGET_RANGES.rmsLevel.min} to {TARGET_RANGES.rmsLevel.max} dB
                          <span className="text-zinc-600 ml-2">(Ideal: {TARGET_RANGES.rmsLevel.ideal} dB)</span>
                        </div>
                        <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isInRange(analysis.rmsLevel, TARGET_RANGES.rmsLevel) ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                            style={{
                              width: `${Math.max(0, Math.min(100, ((analysis.rmsLevel + 30) / 30) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Dynamic Range */}
                      <div className="p-5 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-xl border border-zinc-800 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-zinc-500">Dynamic Range</p>
                          <span className={`text-xs font-bold ${getStatusColor(analysis.dynamicRange, TARGET_RANGES.dynamicRange)}`}>
                            {isInRange(analysis.dynamicRange, TARGET_RANGES.dynamicRange) ? '✓ Healthy' : analysis.dynamicRange < TARGET_RANGES.dynamicRange.min ? '⚠ Too Compressed' : '⚠ Too Dynamic'}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <p className="text-3xl font-black text-blue-400">{analysis.dynamicRange.toFixed(1)}</p>
                          <p className="text-sm text-zinc-500">dB</p>
                        </div>
                        <div className="text-xs text-zinc-400">
                          <span className="text-zinc-500">Target: </span>
                          {TARGET_RANGES.dynamicRange.min} to {TARGET_RANGES.dynamicRange.max} dB
                          <span className="text-zinc-600 ml-2">(Ideal: {TARGET_RANGES.dynamicRange.ideal} dB)</span>
                        </div>
                        <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isInRange(analysis.dynamicRange, TARGET_RANGES.dynamicRange) ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{
                              width: `${Math.max(0, Math.min(100, (analysis.dynamicRange / 20) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Stereo Width */}
                      <div className="p-5 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-xl border border-zinc-800 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-zinc-500">Stereo Width</p>
                          <span className={`text-xs font-bold ${getStatusColor(analysis.stereoWidth, TARGET_RANGES.stereoWidth)}`}>
                            {isInRange(analysis.stereoWidth, TARGET_RANGES.stereoWidth) ? '✓ Good' : '⚠ Adjust'}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <p className="text-3xl font-black text-green-400">{(analysis.stereoWidth * 100).toFixed(0)}</p>
                          <p className="text-sm text-zinc-500">%</p>
                        </div>
                        <div className="text-xs text-zinc-400">
                          <span className="text-zinc-500">Target: </span>
                          {(TARGET_RANGES.stereoWidth.min * 100).toFixed(0)} to {(TARGET_RANGES.stereoWidth.max * 100).toFixed(0)}%
                          <span className="text-zinc-600 ml-2">(Ideal: {(TARGET_RANGES.stereoWidth.ideal * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isInRange(analysis.stereoWidth, TARGET_RANGES.stereoWidth) ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                            style={{
                              width: `${analysis.stereoWidth * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Frequency Balance - Low End */}
                      <div className="p-5 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-xl border border-orange-500/20 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-zinc-500">Low End (20-250Hz)</p>
                          <span className={`text-xs font-bold ${getStatusColor(analysis.lowEndEnergy, TARGET_RANGES.lowEnd)}`}>
                            {isInRange(analysis.lowEndEnergy, TARGET_RANGES.lowEnd) ? '✓ Balanced' : analysis.lowEndEnergy > TARGET_RANGES.lowEnd.max ? '⚠ Too Much' : '⚠ Too Little'}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <p className="text-3xl font-black text-orange-400">{(analysis.lowEndEnergy * 100).toFixed(0)}</p>
                          <p className="text-sm text-zinc-500">%</p>
                        </div>
                        <div className="text-xs text-zinc-400">
                          <span className="text-zinc-500">Target: </span>
                          {(TARGET_RANGES.lowEnd.min * 100).toFixed(0)} to {(TARGET_RANGES.lowEnd.max * 100).toFixed(0)}%
                          <span className="text-zinc-600 ml-2">(Ideal: {(TARGET_RANGES.lowEnd.ideal * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isInRange(analysis.lowEndEnergy, TARGET_RANGES.lowEnd) ? 'bg-green-500' : 'bg-orange-500'
                            }`}
                            style={{
                              width: `${analysis.lowEndEnergy * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Frequency Balance - Mid Range */}
                      <div className="p-5 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-xl border border-purple-500/20 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-zinc-500">Mid Range (250-4kHz)</p>
                          <span className={`text-xs font-bold ${getStatusColor(analysis.midRangeEnergy, TARGET_RANGES.midRange)}`}>
                            {isInRange(analysis.midRangeEnergy, TARGET_RANGES.midRange) ? '✓ Balanced' : analysis.midRangeEnergy > TARGET_RANGES.midRange.max ? '⚠ Too Much' : '⚠ Too Little'}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <p className="text-3xl font-black text-purple-400">{(analysis.midRangeEnergy * 100).toFixed(0)}</p>
                          <p className="text-sm text-zinc-500">%</p>
                        </div>
                        <div className="text-xs text-zinc-400">
                          <span className="text-zinc-500">Target: </span>
                          {(TARGET_RANGES.midRange.min * 100).toFixed(0)} to {(TARGET_RANGES.midRange.max * 100).toFixed(0)}%
                          <span className="text-zinc-600 ml-2">(Ideal: {(TARGET_RANGES.midRange.ideal * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isInRange(analysis.midRangeEnergy, TARGET_RANGES.midRange) ? 'bg-green-500' : 'bg-purple-500'
                            }`}
                            style={{
                              width: `${analysis.midRangeEnergy * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Frequency Balance - High End */}
                      <div className="p-5 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-xl border border-blue-500/20 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-zinc-500">High End (4kHz-20kHz)</p>
                          <span className={`text-xs font-bold ${getStatusColor(analysis.highEndEnergy, TARGET_RANGES.highEnd)}`}>
                            {isInRange(analysis.highEndEnergy, TARGET_RANGES.highEnd) ? '✓ Balanced' : analysis.highEndEnergy > TARGET_RANGES.highEnd.max ? '⚠ Too Harsh' : '⚠ Too Dull'}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <p className="text-3xl font-black text-blue-400">{(analysis.highEndEnergy * 100).toFixed(0)}</p>
                          <p className="text-sm text-zinc-500">%</p>
                        </div>
                        <div className="text-xs text-zinc-400">
                          <span className="text-zinc-500">Target: </span>
                          {(TARGET_RANGES.highEnd.min * 100).toFixed(0)} to {(TARGET_RANGES.highEnd.max * 100).toFixed(0)}%
                          <span className="text-zinc-600 ml-2">(Ideal: {(TARGET_RANGES.highEnd.ideal * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isInRange(analysis.highEndEnergy, TARGET_RANGES.highEnd) ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{
                              width: `${analysis.highEndEnergy * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {analysis.hasClipping && (
                    <div className="p-5 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500/40 rounded-2xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <span className="text-2xl">⚠️</span>
                      </div>
                      <div>
                        <p className="font-bold text-red-400">Clipping Detected</p>
                        <p className="text-sm text-red-300">Digital distortion present - reduce levels before processing</p>
                      </div>
                    </div>
                  )}

                  {/* Preview Section */}
                  <div className="space-y-4">
                    <div className="p-5 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-xl border border-purple-500/20 backdrop-blur-sm">
                      <h4 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                        <PlayIcon className="w-4 h-4" />
                        AI-Generated Preview (30 seconds)
                      </h4>
                      <p className="text-xs text-zinc-400 mb-4">
                        Hear what your mix sounds like with recommended fixes applied automatically
                      </p>
                      {!previewUrl ? (
                        <button
                          onClick={generatePreview}
                          disabled={isGeneratingPreview}
                          className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 text-white font-bold hover:from-purple-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isGeneratingPreview ? (
                            <>
                              <img src={appIcon} alt="Loading" className="w-5 h-5 animate-spin" />
                              <span>Generating Preview...</span>
                            </>
                          ) : (
                            <>
                              <PlayIcon className="w-5 h-5" />
                              <span>Generate Preview</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <audio 
                            ref={previewAudioRef} 
                            src={previewUrl} 
                            controls 
                            className="w-full rounded-lg"
                            onPlay={() => {
                              // Pause original audio when preview starts playing
                              if (audioRef.current && !audioRef.current.paused) {
                                audioRef.current.pause();
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              if (previewUrl) {
                                URL.revokeObjectURL(previewUrl);
                                setPreviewUrl(null);
                                setPreviewParameters(null);
                              }
                            }}
                            className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors text-sm"
                          >
                            Clear Preview
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Preview Parameters Display */}
                    {previewParameters && (
                      <div className="p-5 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-xl border border-blue-500/20 backdrop-blur-sm">
                        <h4 className="text-sm font-bold text-blue-400 mb-4 flex items-center gap-2">
                          <ChartBarIcon className="w-4 h-4" />
                          Applied Changes
                        </h4>
                        <div className="space-y-4">
                          {/* EQ Adjustments */}
                          <div>
                            <p className="text-xs font-semibold text-zinc-300 mb-2">EQ Adjustments</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                                <p className="text-xs text-zinc-500 mb-1">Low Shelf (250Hz)</p>
                                <p className={`text-lg font-bold ${previewParameters.eqLow.gain > 0 ? 'text-orange-400' : previewParameters.eqLow.gain < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                                  {previewParameters.eqLow.gain > 0 ? '+' : ''}{previewParameters.eqLow.gain.toFixed(1)} dB
                                </p>
                              </div>
                              <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                                <p className="text-xs text-zinc-500 mb-1">Peaking (2kHz, Q: {previewParameters.eqMid.q})</p>
                                <p className={`text-lg font-bold ${previewParameters.eqMid.gain > 0 ? 'text-purple-400' : previewParameters.eqMid.gain < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                                  {previewParameters.eqMid.gain > 0 ? '+' : ''}{previewParameters.eqMid.gain.toFixed(1)} dB
                                </p>
                              </div>
                              <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                                <p className="text-xs text-zinc-500 mb-1">High Shelf (4kHz)</p>
                                <p className={`text-lg font-bold ${previewParameters.eqHigh.gain > 0 ? 'text-blue-400' : previewParameters.eqHigh.gain < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                                  {previewParameters.eqHigh.gain > 0 ? '+' : ''}{previewParameters.eqHigh.gain.toFixed(1)} dB
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Compression */}
                          <div>
                            <p className="text-xs font-semibold text-zinc-300 mb-2">Compression</p>
                            <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                                <div>
                                  <p className="text-zinc-500 mb-1">Threshold</p>
                                  <p className="text-zinc-200 font-bold">{previewParameters.compressor.threshold.toFixed(1)} dB</p>
                                </div>
                                <div>
                                  <p className="text-zinc-500 mb-1">Ratio</p>
                                  <p className="text-zinc-200 font-bold">{previewParameters.compressor.ratio}:1</p>
                                </div>
                                <div>
                                  <p className="text-zinc-500 mb-1">Attack</p>
                                  <p className="text-zinc-200 font-bold">{(previewParameters.compressor.attack * 1000).toFixed(1)} ms</p>
                                </div>
                                <div>
                                  <p className="text-zinc-500 mb-1">Release</p>
                                  <p className="text-zinc-200 font-bold">{(previewParameters.compressor.release * 1000).toFixed(0)} ms</p>
                                </div>
                                <div>
                                  <p className="text-zinc-500 mb-1">Knee</p>
                                  <p className="text-zinc-200 font-bold">{previewParameters.compressor.knee.toFixed(0)} dB</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Gain Adjustment */}
                          <div>
                            <p className="text-xs font-semibold text-zinc-300 mb-2">Gain Adjustment</p>
                            <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                              <p className="text-xs text-zinc-500 mb-1">RMS Level Correction</p>
                              <p className={`text-lg font-bold ${previewParameters.gain.adjustment > 0 ? 'text-green-400' : previewParameters.gain.adjustment < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                                {previewParameters.gain.adjustment > 0 ? '+' : ''}{previewParameters.gain.adjustment.toFixed(1)} dB
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={openAriaWithAnalysis}
                      className="px-6 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-purple-600 text-white font-black text-lg hover:from-orange-600 hover:to-purple-700 transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 flex items-center justify-center gap-3"
                    >
                      <SoundWaveIcon className="w-6 h-6" />
                      Get Professional Feedback from Aria
                    </button>
                    {previewUrl && (
                      <button
                        onClick={() => {
                          if (previewAudioRef.current) {
                            // Pause original audio before playing preview
                            if (audioRef.current && !audioRef.current.paused) {
                              audioRef.current.pause();
                            }
                            previewAudioRef.current.play();
                          }
                        }}
                        className="px-6 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40 flex items-center justify-center gap-3"
                      >
                        <PlayIcon className="w-6 h-6" />
                        Play Preview
                      </button>
                    )}
                  </div>
                </div>
              )}

              {audioUrl && (
                <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
                  <audio 
                    ref={audioRef} 
                    src={audioUrl} 
                    controls 
                    className="w-full rounded-lg"
                    onPlay={() => {
                      // Pause preview audio when original starts playing
                      if (previewAudioRef.current && !previewAudioRef.current.paused) {
                        previewAudioRef.current.pause();
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MixDoctor;
