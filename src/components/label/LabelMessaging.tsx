import React, { useState } from 'react';
import { MessageIcon, UsersIcon, PaperAirplaneIcon } from '../icons';

const LabelMessaging: React.FC = () => {
    const [message, setMessage] = useState('');
    const [recipient, setRecipient] = useState('all');

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if(!message.trim()) return;
        alert(`Announcement sent to ${recipient === 'all' ? 'all active roster members' : recipient}`);
        setMessage('');
    };

    return (
        <div className="max-w-4xl mx-auto p-6 animate-fade-in pb-24">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-500/10 rounded-xl">
                    <MessageIcon className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-zinc-100">Roster Announcements</h1>
                    <p className="text-zinc-400 text-sm">Send broadcasts to your entire label or specific groups.</p>
                </div>
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
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20"
                        >
                            <PaperAirplaneIcon className="w-5 h-5" />
                            Send Broadcast
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LabelMessaging;
