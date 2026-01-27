import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppState, ActionTypes } from '../contexts/AppContext';
import { UserRole, BookingRequestType, AppView } from '../types';
import type { Engineer, Producer, Stoodio, BookingRequest } from '../types';
import { CalendarIcon, ClockIcon, DollarSignIcon, MapIcon, MusicNoteIcon, SparklesIcon, CheckCircleIcon, MessageIcon, StarIcon } from './icons';
import { useBookings } from '../hooks/useBookings';
import { useNavigation } from '../hooks/useNavigation';
import { useMessaging } from '../hooks/useMessaging';
import { getProfileImageUrl } from '../constants';
import appIcon from '../assets/stoodioz-app-icon.png';

interface SessionNeed {
  type: 'recording' | 'mixing' | 'mastering' | 'production' | 'pull-up';
  genre: string;
  vibe: string;
  budget: number;
  date: string;
  time: string;
  duration: number;
  location?: string;
  requirements: string[];
  urgency: 'asap' | 'this-week' | 'flexible';
}

interface Match {
  provider: Engineer | Producer | Stoodio;
  type: 'engineer' | 'producer' | 'stoodio';
  matchScore: number;
  reasons: string[];
  availability: {
    date: string;
    time: string;
    available: boolean;
  }[];
  estimatedCost: number;
  valueScore: number;
  responseTime: string;
  draftMessage: string;
  rating?: number;
  sessionsCompleted?: number;
  specialties?: string[];
}

interface ConciergeAnalysis {
  needs: SessionNeed;
  matches: Match[];
  recommendations: {
    topChoice: Match;
    budgetAlternative: Match;
    premiumOption: Match;
  };
  optimization: {
    savings: number;
    suggestions: string[];
  };
}

const SessionConcierge: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentUser, engineers, producers, stoodioz, bookings } = useAppState();
  const { navigate } = useNavigation();
  const { confirmBooking } = useBookings(navigate);
  const { startConversation } = useMessaging(navigate);

  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysis, setAnalysis] = useState<ConciergeAnalysis | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [activeTab, setActiveTab] = useState<'matches' | 'comparison' | 'calendar'>('matches');
  const comparisonCanvasRef = useRef<HTMLCanvasElement>(null);

  const parseNeeds = useCallback((text: string): Partial<SessionNeed> => {
    const needs: Partial<SessionNeed> = {
      requirements: [],
      urgency: 'flexible'
    };

    if (text.match(/mix|mixing/i)) needs.type = 'mixing';
    else if (text.match(/master|mastering/i)) needs.type = 'mastering';
    else if (text.match(/produc|beat|instrumental/i)) needs.type = 'production';
    else if (text.match(/pull.?up|pullup/i)) needs.type = 'pull-up';
    else needs.type = 'recording';

    const genres = ['trap', 'hip-hop', 'r&b', 'pop', 'rock', 'electronic', 'jazz', 'country'];
    const foundGenre = genres.find(g => text.toLowerCase().includes(g));
    if (foundGenre) needs.genre = foundGenre;

    const budgetMatch = text.match(/\$(\d+)|(\d+)\s*dollars?|budget.*?(\d+)/i);
    if (budgetMatch) {
      needs.budget = parseInt(budgetMatch[1] || budgetMatch[2] || budgetMatch[3] || '0');
    }

    const dateMatch = text.match(/(today|tomorrow|(\d{1,2}\/\d{1,2})|(\d{4}-\d{2}-\d{2}))/i);
    if (dateMatch) {
      if (dateMatch[1]?.toLowerCase() === 'today') {
        needs.date = new Date().toISOString().split('T')[0];
      } else if (dateMatch[1]?.toLowerCase() === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        needs.date = tomorrow.toISOString().split('T')[0];
      }
    }

    const timeMatch = text.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minute = parseInt(timeMatch[2] || '0');
      const period = timeMatch[3]?.toLowerCase();
      if (period === 'pm' && hour !== 12) hour += 12;
      if (period === 'am' && hour === 12) hour = 0;
      needs.time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }

    if (text.match(/asap|urgent|immediately|now/i)) needs.urgency = 'asap';
    else if (text.match(/this week|soon/i)) needs.urgency = 'this-week';

    if (text.match(/vocal/i)) needs.requirements?.push('Vocal recording');
    if (text.match(/dark|aggressive/i)) needs.vibe = 'dark/aggressive';
    if (text.match(/smooth|melodic/i)) needs.vibe = 'smooth/melodic';

    return needs;
  }, []);

  const findMatches = useCallback((needs: SessionNeed): Match[] => {
    const matches: Match[] = [];

    if (needs.type === 'recording' || needs.type === 'mixing' || needs.type === 'mastering') {
      engineers.forEach(engineer => {
        let score = 0;
        const reasons: string[] = [];

        if (engineer.specialties?.some(s => needs.genre?.toLowerCase().includes(s.toLowerCase()))) {
          score += 30;
          reasons.push(`Specializes in ${needs.genre}`);
        }

        const hourlyRate = engineer.pull_up_price || 100;
        const estimatedCost = hourlyRate * needs.duration;
        if (estimatedCost <= needs.budget * 1.2) {
          score += 25;
          reasons.push(`Within budget ($${estimatedCost})`);
        }

        if (engineer.rating_overall && engineer.rating_overall >= 4.5) {
          score += 20;
          reasons.push(`High rating (${engineer.rating_overall}/5)`);
        }

        if (engineer.is_online) {
          score += 15;
          reasons.push('Currently online');
        }

        if (engineer.sessions_completed && engineer.sessions_completed > 10) {
          score += 10;
          reasons.push(`${engineer.sessions_completed}+ sessions`);
        }

        const responseTime = engineer.on_time_rate && engineer.on_time_rate > 90 ? 'Under 1 hour' : '2-4 hours';

        matches.push({
          provider: engineer,
          type: 'engineer',
          matchScore: score,
          reasons,
          availability: [{
            date: needs.date,
            time: needs.time,
            available: true
          }],
          estimatedCost,
          valueScore: engineer.rating_overall ? (engineer.rating_overall / (hourlyRate / 100)) : 0,
          responseTime,
          draftMessage: `Hey ${engineer.name || 'there'}! I'm looking to ${needs.type} a ${needs.genre} track${needs.vibe ? ` with a ${needs.vibe} vibe` : ''}. ${needs.requirements.length > 0 ? `Requirements: ${needs.requirements.join(', ')}. ` : ''}Budget: $${needs.budget}. ${needs.urgency === 'asap' ? 'Need this ASAP!' : needs.urgency === 'this-week' ? 'Looking to book this week.' : 'Flexible on timing.'} Are you available?`,
          rating: engineer.rating_overall,
          sessionsCompleted: engineer.sessions_completed,
          specialties: engineer.specialties
        });
      });
    }

    if (needs.type === 'production' || needs.type === 'pull-up') {
      producers.forEach(producer => {
        let score = 0;
        const reasons: string[] = [];

        if (producer.genres?.some(g => needs.genre?.toLowerCase().includes(g.toLowerCase()))) {
          score += 30;
          reasons.push(`Produces ${needs.genre}`);
        }

        const pullUpPrice = producer.pull_up_price || 200;
        if (pullUpPrice <= needs.budget * 1.2) {
          score += 25;
          reasons.push(`Pull-up fee: $${pullUpPrice}`);
        }

        if (producer.rating_overall && producer.rating_overall >= 4.5) {
          score += 20;
          reasons.push(`High rating (${producer.rating_overall}/5)`);
        }

        matches.push({
          provider: producer,
          type: 'producer',
          matchScore: score,
          reasons,
          availability: [{
            date: needs.date,
            time: needs.time,
            available: true
          }],
          estimatedCost: pullUpPrice,
          valueScore: producer.rating_overall ? (producer.rating_overall / (pullUpPrice / 100)) : 0,
          responseTime: '2-4 hours',
          draftMessage: `Hey ${producer.name || 'there'}! I'm looking for a ${needs.genre} ${needs.type === 'pull-up' ? 'pull-up session' : 'beat'}. ${needs.vibe ? `Vibe: ${needs.vibe}. ` : ''}Budget: $${needs.budget}. Are you available?`,
          rating: producer.rating_overall
        });
      });
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
  }, [engineers, producers]);

  const analyzeSession = async () => {
    if (!input.trim()) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 200);

    try {
      const parsedNeeds = parseNeeds(input);
      const fullNeeds: SessionNeed = {
        type: parsedNeeds.type || 'recording',
        genre: parsedNeeds.genre || 'hip-hop',
        vibe: parsedNeeds.vibe || '',
        budget: parsedNeeds.budget || 300,
        date: parsedNeeds.date || new Date().toISOString().split('T')[0],
        time: parsedNeeds.time || '14:00',
        duration: 2,
        requirements: parsedNeeds.requirements || [],
        urgency: parsedNeeds.urgency || 'flexible'
      };

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const matches = findMatches(fullNeeds);
      
      if (matches.length === 0) {
        alert('No matches found. Try adjusting your search criteria (genre, budget, or type of session).');
        setIsAnalyzing(false);
        clearInterval(progressInterval);
        return;
      }
      
      const recommendations = {
        topChoice: matches[0],
        budgetAlternative: matches.find(m => m.estimatedCost <= fullNeeds.budget * 0.8) || matches[0],
        premiumOption: matches.find(m => m.matchScore >= 70) || matches[0]
      };

      const optimization = {
        savings: Math.max(0, fullNeeds.budget - (recommendations.budgetAlternative?.estimatedCost || 0)),
        suggestions: [
          `Consider ${recommendations.budgetAlternative?.provider.name} for $${recommendations.budgetAlternative?.estimatedCost} (save $${Math.max(0, fullNeeds.budget - (recommendations.budgetAlternative?.estimatedCost || 0))})`,
          'Book during off-peak hours for better rates',
          'Bundle services (recording + mixing) for discounts'
        ]
      };

      setAnalysis({
        needs: fullNeeds,
        matches,
        recommendations,
        optimization
      });

      setAnalysisProgress(100);
      setActiveTab('matches');
      if (matches.length > 0) {
        setSelectedMatch(matches[0]);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      alert('Failed to analyze session needs. Please try again.');
    } finally {
      setIsAnalyzing(false);
      clearInterval(progressInterval);
    }
  };

  const drawComparisonChart = useCallback(() => {
    if (!comparisonCanvasRef.current || !analysis) return;
    
    const canvas = comparisonCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const matches = analysis.matches.slice(0, 5);
    const barWidth = canvas.width / (matches.length + 1);
    const maxScore = 100;

    matches.forEach((match, idx) => {
      const x = (idx + 1) * barWidth;
      const barHeight = (match.matchScore / maxScore) * (canvas.height - 40);
      const y = canvas.height - barHeight - 20;

      const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(1, '#1d4ed8');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x - barWidth / 2 + 10, y, barWidth - 20, barHeight);

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`${match.matchScore}%`, x, y - 5);
      
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px Inter';
      const name = match.provider.name.substring(0, 8);
      ctx.fillText(name, x, canvas.height - 5);
    });
  }, [analysis]);

  useEffect(() => {
    if (activeTab === 'comparison') {
      drawComparisonChart();
    }
  }, [activeTab, drawComparisonChart]);

  const handleBook = useCallback((match: Match) => {
    if (!currentUser) {
      navigate(AppView.LOGIN);
      return;
    }

    if (match.type === 'engineer') {
      const engineer = match.provider as Engineer;
      dispatch({
        type: ActionTypes.SET_BOOKING_INTENT,
        payload: {
          intent: {
            engineer,
            date: analysis?.needs.date,
            time: analysis?.needs.time
          }
        }
      });
      navigate(AppView.STOODIO_LIST);
    } else if (match.type === 'producer') {
      const producer = match.provider as Producer;
      dispatch({
        type: ActionTypes.SET_BOOKING_INTENT,
        payload: {
          intent: {
            producer,
            pullUpFee: producer.pull_up_price
          }
        }
      });
      // Open booking modal would happen here
    }
  }, [currentUser, analysis, dispatch, navigate]);

  const handleMessage = useCallback((match: Match) => {
    startConversation(match.provider as any);
  }, [startConversation]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Main Container */}
      <div className="relative rounded-3xl border-2 border-blue-500/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 backdrop-blur-xl p-8 shadow-2xl shadow-blue-500/10 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-blue-500/5 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
              <SparklesIcon className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Session Concierge Pro</h3>
              <p className="text-sm text-zinc-400 mt-1">AI-powered session matching • Real-time availability • Budget optimization</p>
            </div>
          </div>

          {/* Input Section - Always Visible */}
          {!analysis && (
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
                <label className="block text-sm font-bold text-blue-400 mb-2">Describe Your Session Needs</label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Example: 'Need engineer for dark trap vocals tomorrow 6pm, budget $250. Need vocal tuning and adlibs.'"
                  className="w-full min-h-[200px] rounded-xl bg-zinc-950 border border-zinc-800 text-slate-100 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                />
              </div>
              
              <button
                onClick={analyzeSession}
                disabled={isAnalyzing || !input.trim()}
                className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-black text-lg hover:from-blue-600 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isAnalyzing ? (
                  <>
                    <img src={appIcon} alt="Loading" className="w-5 h-5 animate-spin" />
                    <span>Finding Perfect Matches... {analysisProgress}%</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-6 h-6" />
                    <span>Find My Session</span>
                  </>
                )}
              </button>

              {/* Progress Bar */}
              {isAnalyzing && (
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${analysisProgress}%` }}
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
                {(['matches', 'comparison', 'calendar'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      activeTab === tab
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Matches Tab */}
              {activeTab === 'matches' && (
            <div className="space-y-6">
              {/* Top Recommendation */}
              {analysis.recommendations.topChoice && (
                <div className="p-6 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl border-2 border-blue-500">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircleIcon className="w-6 h-6 text-blue-400" />
                    <h3 className="text-xl font-bold text-white">Top Match</h3>
                    <span className="ml-auto px-3 py-1 bg-blue-500/30 text-blue-300 rounded-full text-xs font-bold">
                      {analysis.recommendations.topChoice.matchScore}% Match
                    </span>
                  </div>
                  <div className="flex items-start gap-4">
                    <img
                      src={getProfileImageUrl(analysis.recommendations.topChoice.provider)}
                      alt={analysis.recommendations.topChoice.provider.name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-blue-400"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-white">{analysis.recommendations.topChoice.provider.name}</h4>
                        {analysis.recommendations.topChoice.rating && (
                          <div className="flex items-center gap-1">
                            <StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm text-zinc-300">{analysis.recommendations.topChoice.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-zinc-300 text-sm mb-3">{analysis.recommendations.topChoice.reasons.join(' • ')}</p>
                      <div className="flex items-center gap-4 text-sm mb-4">
                        <span className="text-green-400 font-bold">${analysis.recommendations.topChoice.estimatedCost}</span>
                        <span className="text-zinc-400">{analysis.recommendations.topChoice.responseTime} response</span>
                        {analysis.recommendations.topChoice.sessionsCompleted && (
                          <span className="text-zinc-400">{analysis.recommendations.topChoice.sessionsCompleted}+ sessions</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleBook(analysis.recommendations.topChoice)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-all"
                        >
                          Book Now
                        </button>
                        <button
                          onClick={() => handleMessage(analysis.recommendations.topChoice)}
                          className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg font-semibold hover:bg-zinc-700 flex items-center gap-2"
                        >
                          <MessageIcon className="w-4 h-4" />
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* All Matches Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.matches.map((match, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedMatch(match)}
                    className={`p-5 bg-zinc-900/50 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedMatch?.provider.id === match.provider.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={getProfileImageUrl(match.provider)}
                        alt={match.provider.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-white">{match.provider.name}</h4>
                          <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full font-bold">
                            {match.matchScore}%
                          </span>
                        </div>
                        <p className="text-zinc-400 text-xs mb-2">{match.reasons.slice(0, 2).join(' • ')}</p>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
                          <span>${match.estimatedCost}</span>
                          {match.rating && (
                            <div className="flex items-center gap-1">
                              <StarIcon className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              <span>{match.rating.toFixed(1)}</span>
                            </div>
                          )}
                          <span>{match.responseTime}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBook(match);
                            }}
                            className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-semibold hover:bg-zinc-700"
                          >
                            Book
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMessage(match);
                            }}
                            className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-semibold hover:bg-zinc-700"
                          >
                            Message
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Optimization Tips */}
              {analysis.optimization.savings > 0 && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <h4 className="font-bold text-green-400 mb-2 flex items-center gap-2">
                    <DollarSignIcon className="w-4 h-4" />
                    Budget Optimization
                  </h4>
                  <p className="text-zinc-300 text-sm mb-2">Save ${analysis.optimization.savings} with our recommendations</p>
                  <ul className="space-y-1 text-xs text-zinc-400">
                    {analysis.optimization.suggestions.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

              {/* Comparison Tab */}
              {activeTab === 'comparison' && (
            <div className="space-y-4">
              <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <h3 className="text-lg font-bold text-white mb-4">Match Score Comparison</h3>
                <canvas 
                  ref={comparisonCanvasRef}
                  className="w-full rounded-lg border border-zinc-700"
                  style={{ height: '200px' }}
                />
              </div>

              {/* Value Score Comparison */}
              <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <h3 className="text-lg font-bold text-white mb-4">Value Score (Quality vs. Price)</h3>
                <div className="space-y-3">
                  {analysis.matches.map((match, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-300">{match.provider.name}</span>
                        <span className="text-white font-bold">{match.valueScore.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                          style={{ width: `${Math.min(100, (match.valueScore / 5) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && analysis && selectedMatch && (
            <div className="space-y-4">
              <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <h3 className="text-lg font-bold text-white mb-4">Availability</h3>
                <div className="grid grid-cols-7 gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="text-center text-xs text-zinc-400 font-semibold">{day}</div>
                  ))}
                  {Array.from({ length: 28 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const isAvailable = Math.random() > 0.3; // Simulated
                    return (
                      <div
                        key={i}
                        className={`p-2 rounded-lg text-center text-xs ${
                          isAvailable
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-zinc-800 text-zinc-600'
                        }`}
                      >
                        {date.getDate()}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionConcierge;
