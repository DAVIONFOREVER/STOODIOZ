import React, { useMemo, useState } from 'react';
import { useAppDispatch, useAppState, ActionTypes } from '../contexts/AppContext';
import { AppView, UserRole } from '../types';
import MixDoctor from './MixDoctor';
import ReleaseEngine from './ReleaseEngine';
import HookEnhancer from './HookEnhancer';
import SessionConcierge from './SessionConcierge';

type Tab = 'HOOK' | 'MIX' | 'RELEASE' | 'CONCIERGE';

const Card: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 backdrop-blur p-5 shadow-xl">
    <div className="mb-4">
      <h3 className="text-lg font-bold text-slate-100">{title}</h3>
      <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
    </div>
    {children}
  </div>
);

export default function AriaStudioBrain() {
  const dispatch = useAppDispatch();
  const { userRole } = useAppState();

  const [tab, setTab] = useState<Tab>('HOOK');
  const [input, setInput] = useState('');

  const isLabel = userRole === UserRole.LABEL;

  const openAriaWithPrompt = (prompt: string) => {
    dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt } });
    dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } });
  };

  const spec = useMemo(() => {
    const base = {
      HOOK: {
        title: 'Instant Hook Enhancer',
        subtitle: '3 hook options + cadence map + performance notes. Built for 2026 attention spans.',
        placeholder: 'Paste lyrics or describe the hook idea + vibe + topic…',
        prompt: (t: string) =>
          `HOOK ENHANCER:\nInput:\n${t}\n\nDeliver:\n1) 3 hook options (anthem/intimate/aggressive)\n2) bar-by-bar cadence map (pause/double/adlib pockets)\n3) 2 bridge options\n4) performance notes (melody lift + stacks).`,
      },
      MIX: {
        title: 'Mix Doctor',
        subtitle: 'Describe the problem. Get surgical fixes (EQ/comp/stereo) + master targets + checklist.',
        placeholder: 'Example: “Vocal harsh 3–5k, kick disappears on phones, mix is narrow…”',
        prompt: (t: string) =>
          `MIX DOCTOR:\nProblem:\n${t}\n\nDeliver:\n- likely root causes\n- exact starting moves (freq ranges + ratios + gain)\n- stereo plan\n- LUFS/TP export targets\n- 10-minute engineer checklist.`,
      },
      RELEASE: {
        title: 'Release Engine',
        subtitle: '7/14/30-day rollout plan + short-form concepts + captions + distribution checklist.',
        placeholder: 'Song title, genre, vibe, audience, goal (streams/fans/bookings)…',
        prompt: (t: string) =>
          `RELEASE ENGINE:\nInput:\n${t}\n\nDeliver:\n- 7/14/30-day plan\n- 12 short-form concepts\n- captions + CTA + hashtags\n- metadata/distribution checklist\n- independent vs label plan differences.`,
      },
      CONCIERGE: {
        title: 'Session Concierge',
        subtitle: 'Tell Aria what you need. She recommends matches + drafts pro messages + next click.',
        placeholder: 'Example: “Need engineer for dark trap vocals tomorrow 6pm, budget $250…”',
        prompt: (t: string) =>
          `SESSION CONCIERGE:\nObjective:\n${t}\n\nDeliver:\n- clarify top constraints\n- recommend top 3 matches (with why)\n- draft message to each\n- tell me the next in-app action (book or chat).`,
      },
    } as const;

    return base[tab];
  }, [tab]);

  const onGenerate = () => {
    const t = input.trim();
    if (!t) return;
    openAriaWithPrompt(spec.prompt(t));
    setInput('');
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur p-4">
        <div className="flex flex-wrap gap-2">
          {(['HOOK', 'MIX', 'RELEASE', 'CONCIERGE'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                tab === t
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-zinc-900 text-slate-200 border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              {t === 'HOOK' ? 'Hook Enhancer' : t === 'MIX' ? 'Mix Doctor' : t === 'RELEASE' ? 'Release Engine' : 'Concierge'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'MIX' ? (
        <MixDoctor />
      ) : tab === 'RELEASE' ? (
        <ReleaseEngine />
      ) : tab === 'HOOK' ? (
        <HookEnhancer />
      ) : tab === 'CONCIERGE' ? (
        <SessionConcierge />
      ) : (
        <Card title={spec.title} subtitle={spec.subtitle}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={spec.placeholder}
            className="w-full min-h-[120px] rounded-xl bg-zinc-950 border border-zinc-800 text-slate-100 p-4 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onGenerate}
              disabled={!input.trim()}
              className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-bold disabled:opacity-50"
            >
              Generate
            </button>

            <button
              type="button"
              onClick={() => dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } })}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-slate-200 font-semibold hover:bg-zinc-800"
            >
              Open Aria
            </button>

            {isLabel && (
              <button
                type="button"
                onClick={() => dispatch({ type: ActionTypes.NAVIGATE, payload: { view: AppView.LABEL_SCOUTING } })}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-slate-200 font-semibold hover:bg-zinc-800"
              >
                A&R Scouting
              </button>
            )}
          </div>

          <p className="mt-3 text-xs text-slate-500">Aria outputs actionable steps, numbers, and checklists — not generic advice.</p>
        </Card>
      )}
    </div>
  );
}
