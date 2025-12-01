
import React from 'react';
import { BriefcaseIcon, UserPlusIcon } from '../icons';

const TeamManager: React.FC = () => {
    // Mock Team Data
    const team = [
        { id: 1, name: 'Sarah Jenkins', role: 'Owner', email: 'sarah@label.com' },
        { id: 2, name: 'Marcus Cole', role: 'A&R', email: 'marcus@label.com' },
        { id: 3, name: 'Elena Rodriguez', role: 'Finance', email: 'elena@label.com' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-zinc-100">Team Management</h1>
                <button className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors flex items-center gap-2">
                    <UserPlusIcon className="w-5 h-5"/> Invite Member
                </button>
            </div>

            <div className="cardSurface overflow-hidden">
                <table className="w-full text-left text-zinc-400">
                    <thead className="bg-zinc-800/50 text-xs uppercase font-semibold">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Email</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {team.map(member => (
                            <tr key={member.id} className="hover:bg-zinc-800/30 transition-colors">
                                <td className="p-4 font-medium text-zinc-200 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                                        {member.name.charAt(0)}
                                    </div>
                                    {member.name}
                                </td>
                                <td className="p-4"><span className="bg-zinc-800 px-2 py-1 rounded text-xs border border-zinc-700">{member.role}</span></td>
                                <td className="p-4">{member.email}</td>
                                <td className="p-4 text-right text-sm text-orange-400 hover:underline cursor-pointer">Edit</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeamManager;
