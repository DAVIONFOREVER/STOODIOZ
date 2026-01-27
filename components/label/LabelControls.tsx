
import React, { useEffect, useMemo, useState } from 'react';
import { DollarSignIcon, BellIcon, CheckCircleIcon } from '../icons';
import { useAppState } from '../../contexts/AppContext';
import { useProfile } from '../../hooks/useProfile';

// Local icon definitions to strictly adhere to "DO NOT modify icons.tsx" rule
const LockClosedIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);

const CalculatorIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const SwitchToggle: React.FC<{ label: string; checked: boolean; onChange: (val: boolean) => void }> = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
        <span className="text-zinc-300 font-medium">{label}</span>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-orange-500 transition-colors ${checked ? 'bg-orange-500' : 'bg-zinc-700'}`}></div>
            <div className={`absolute top-0.5 left-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-transform ${checked ? 'translate-x-full border-white' : ''}`}></div>
        </label>
    </div>
);

const InputField: React.FC<{ label: string; value: string | number; onChange: (val: string) => void; prefix?: string }> = ({ label, value, onChange, prefix }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-400 mb-1">{label}</label>
        <div className="relative">
            {prefix && <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">{prefix}</span>}
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none ${prefix ? 'pl-8' : ''}`}
            />
        </div>
    </div>
);

const LabelControls: React.FC = () => {
    const { currentUser } = useAppState();
    const { updateProfile, refreshCurrentUser } = useProfile();
    const [isSaving, setIsSaving] = useState(false);
    const initialControls = useMemo(() => {
        const raw = (currentUser as any)?.label_controls;
        return raw && typeof raw === 'object' ? raw : null;
    }, [currentUser]);
    // --- State ---
    const [maxSpendPerArtist, setMaxSpendPerArtist] = useState<number>(5000);
    const [maxSpendPerSession, setMaxSpendPerSession] = useState<number>(1000);
    const [monthlyCap, setMonthlyCap] = useState<number>(20000);

    const [requireApprovalHighValue, setRequireApprovalHighValue] = useState(true);
    const [approvalThreshold, setApprovalThreshold] = useState<number>(500);
    const [requireRosterApproval, setRequireRosterApproval] = useState(false);
    const [allowRemoteSessions, setAllowRemoteSessions] = useState(true);

    const [alertOverBudget, setAlertOverBudget] = useState(true);
    const [alertAllocation, setAlertAllocation] = useState(true);
    const [alertMonthlySummary, setAlertMonthlySummary] = useState(true);

    // Calculator State
    const [calcSessions, setCalcSessions] = useState<number>(5);
    const [calcCost, setCalcCost] = useState<number>(400);

    const projectedTotal = calcSessions * calcCost;
    const projectedRemaining = monthlyCap - projectedTotal;

    useEffect(() => {
        if (!initialControls) return;
        setMaxSpendPerArtist(Number(initialControls.maxSpendPerArtist ?? 5000));
        setMaxSpendPerSession(Number(initialControls.maxSpendPerSession ?? 1000));
        setMonthlyCap(Number(initialControls.monthlyCap ?? 20000));
        setRequireApprovalHighValue(Boolean(initialControls.requireApprovalHighValue ?? true));
        setApprovalThreshold(Number(initialControls.approvalThreshold ?? 500));
        setRequireRosterApproval(Boolean(initialControls.requireRosterApproval ?? false));
        setAllowRemoteSessions(Boolean(initialControls.allowRemoteSessions ?? true));
        setAlertOverBudget(Boolean(initialControls.alertOverBudget ?? true));
        setAlertAllocation(Boolean(initialControls.alertAllocation ?? true));
        setAlertMonthlySummary(Boolean(initialControls.alertMonthlySummary ?? true));
    }, [initialControls]);

    const handleSave = async () => {
        if (!currentUser) return;
        setIsSaving(true);
        try {
            await updateProfile({
                label_controls: {
                    maxSpendPerArtist,
                    maxSpendPerSession,
                    monthlyCap,
                    requireApprovalHighValue,
                    approvalThreshold,
                    requireRosterApproval,
                    allowRemoteSessions,
                    alertOverBudget,
                    alertAllocation,
                    alertMonthlySummary,
                },
            } as any);
            await refreshCurrentUser();
        } catch (e) {
            console.error('Failed to save label controls', e);
            alert('Failed to save label controls. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 animate-fade-in pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-zinc-100">Label Controls</h1>
                    <p className="text-zinc-400 mt-1">Configure spending limits, approval workflows, and alerts.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                    <CheckCircleIcon className="w-5 h-5" /> {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* A) Spending Rules */}
                <div className="cardSurface p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-400"><DollarSignIcon className="w-6 h-6" /></div>
                        <h2 className="text-xl font-bold text-zinc-100">Spending Rules</h2>
                    </div>
                    <InputField label="Max Spend Per Artist (Monthly)" value={maxSpendPerArtist} onChange={(v) => setMaxSpendPerArtist(Number(v))} prefix="$" />
                    <InputField label="Max Spend Per Session" value={maxSpendPerSession} onChange={(v) => setMaxSpendPerSession(Number(v))} prefix="$" />
                    <InputField label="Total Monthly Spending Cap" value={monthlyCap} onChange={(v) => setMonthlyCap(Number(v))} prefix="$" />
                </div>

                {/* B) Approval Rules */}
                <div className="cardSurface p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><LockClosedIcon className="w-6 h-6" /></div>
                        <h2 className="text-xl font-bold text-zinc-100">Approval Workflows</h2>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                            <SwitchToggle label="Require approval for high-value bookings" checked={requireApprovalHighValue} onChange={setRequireApprovalHighValue} />
                            {requireApprovalHighValue && (
                                <div className="mt-3 pl-4 border-l-2 border-zinc-700">
                                    <InputField label="Approval Threshold Amount" value={approvalThreshold} onChange={(v) => setApprovalThreshold(Number(v))} prefix="$" />
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                            <SwitchToggle label="Require approval for new roster additions" checked={requireRosterApproval} onChange={setRequireRosterApproval} />
                        </div>
                         <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                            <SwitchToggle label="Allow remote sessions" checked={allowRemoteSessions} onChange={setAllowRemoteSessions} />
                        </div>
                    </div>
                </div>

                {/* C) Notifications */}
                <div className="cardSurface p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><BellIcon className="w-6 h-6" /></div>
                        <h2 className="text-xl font-bold text-zinc-100">Alerts & Notifications</h2>
                    </div>
                    <div className="space-y-2">
                        <SwitchToggle label="Alert when total budget exceeds 80%" checked={alertOverBudget} onChange={setAlertOverBudget} />
                        <SwitchToggle label="Warn when artist allocation is low" checked={alertAllocation} onChange={setAlertAllocation} />
                        <SwitchToggle label="Send monthly spending summary via email" checked={alertMonthlySummary} onChange={setAlertMonthlySummary} />
                    </div>
                </div>

                 {/* D) Spending Preview */}
                 <div className="cardSurface p-6 border-2 border-zinc-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400"><CalculatorIcon className="w-6 h-6" /></div>
                        <h2 className="text-xl font-bold text-zinc-100">Spending Calculator</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <InputField label="Sessions/Month" value={calcSessions} onChange={(v) => setCalcSessions(Number(v))} />
                        <InputField label="Avg. Cost ($)" value={calcCost} onChange={(v) => setCalcCost(Number(v))} />
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-700">
                        <div className="flex justify-between mb-2">
                            <span className="text-zinc-400">Projected Spend:</span>
                            <span className="font-bold text-zinc-200">${projectedTotal.toLocaleString()}</span>
                        </div>
                         <div className="flex justify-between border-t border-zinc-700 pt-2">
                            <span className="text-zinc-400">Projected Remaining:</span>
                            <span className={`font-bold ${projectedRemaining < 0 ? 'text-red-500' : 'text-green-500'}`}>${projectedRemaining.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabelControls;
