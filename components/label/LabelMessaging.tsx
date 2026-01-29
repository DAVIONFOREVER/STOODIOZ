
import React, { useEffect, useMemo, useState } from 'react';
import { PaperAirplaneIcon } from '../icons';
import { useAppState } from '../../contexts/AppContext';
import * as apiService from '../../services/apiService';
import type { RosterMember } from '../../types';

const LabelMessaging: React.FC = () => {
    const { currentUser, userRole } = useAppState();
    const [message, setMessage] = useState('');
    const [recipient, setRecipient] = useState('all');
    const [roster, setRoster] = useState<RosterMember[]>([]);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (!currentUser?.id || userRole !== 'LABEL') return;
        let active = true;
        apiService.fetchLabelRoster(currentUser.id)
            .then((rows) => {
                if (active) setRoster(rows || []);
            })
            .catch((err) => console.error('Failed to load roster for messaging', err));
        return () => { active = false; };
    }, [currentUser?.id, userRole]);

    const activeRoster = useMemo(() => (
        roster.filter((m) => !m.shadow_profile && !m.is_pending)
    ), [roster]);

    const filteredRoster = useMemo(() => {
        if (recipient === 'all') return activeRoster;
        const role = recipient.toLowerCase();
        return activeRoster.filter((m) => String(m.role_in_label || '').toLowerCase().includes(role));
    }, [activeRoster, recipient]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if(!message.trim() || !currentUser?.id) return;
        setIsSending(true);
        apiService
            .sendLabelBroadcast(
                currentUser.id,
                filteredRoster.map((m) => m.id),
                message.trim(),
                { label_id: currentUser.id, audience: recipient }
            )
            .then(({ sent, failed }) => {
                alert(`Announcement sent to ${sent} member(s).${failed ? ` ${failed} failed.` : ''}`);
                setMessage('');
            })
            .catch((err) => {
                console.error('Failed to send broadcast', err);
                alert('Failed to send announcement. Please try again.');
            })
            .finally(() => setIsSending(false));
    };

    return (
        <div className="max-w-4xl mx-auto p-6 animate-fade-in pb-24">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-zinc-100">Roster Announcements</h1>
                <p className="text-zinc-400 text-sm">Send broadcasts to your entire label or specific groups.</p>
            </div>

            <div className="cardSurface p-6">
                <form onSubmit={handleSend} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-zinc-300 mb-2">Recipients</label>
                        <select 
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none"
                        >
                            <option value="all">All Active Roster Members</option>
                            <option value="artists">Artists Only</option>
                            <option value="producers">Producers Only</option>
                            <option value="engineers">Engineers Only</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-zinc-300 mb-2">Message</label>
                        <textarea 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full h-40 bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg p-4 focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                            placeholder="Write your announcement here..."
                        />
                    </div>

                    <div className="flex justify-end">
                        <button 
                            type="submit"
                            disabled={isSending}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <PaperAirplaneIcon className="w-5 h-5" />
                            {isSending ? 'Sending…' : 'Send Broadcast'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LabelMessaging;
