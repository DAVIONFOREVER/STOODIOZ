
import React, { useState, useMemo } from 'react';
import type { PlatformUser } from '../types';
import { UserRole } from '../../types';
import { SearchIcon, SuspendIcon, ViewIcon } from './icons';

interface UserManagementProps {
    users: PlatformUser[];
}

const UserManagement: React.FC<UserManagementProps> = ({ users }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = useMemo(() => {
        if (!searchTerm) {
            return users;
        }
        return users.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);
    
    const roleStyles: Record<UserRole, string> = {
        [UserRole.ARTIST]: 'bg-purple-500/20 text-purple-300',
        [UserRole.ENGINEER]: 'bg-orange-500/20 text-orange-300',
        [UserRole.STOODIO]: 'bg-red-500/20 text-red-300',
    };

    const handleAction = (action: string, userName: string) => {
        alert(`${action} action for ${userName} is not implemented.`);
    };

    return (
        <div>
            <h1 className="text-4xl font-bold text-slate-100 mb-2">User Management</h1>
            <p className="text-slate-400 mb-8">Search, view, and manage all users on the platform.</p>

            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                   <SearchIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
            </div>
            
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm text-left text-slate-300">
                    <thead className="bg-zinc-700/50 text-xs text-slate-400 uppercase tracking-wider">
                        <tr>
                            <th scope="col" className="px-6 py-3">Name</th>
                            <th scope="col" className="px-6 py-3">Email</th>
                            <th scope="col" className="px-6 py-3">Role</th>
                            <th scope="col" className="px-6 py-3">Joined</th>
                            <th scope="col" className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                       {filteredUsers.map(user => (
                            <tr key={user.id} className="border-b border-zinc-700 hover:bg-zinc-800/50">
                                <td className="px-6 py-4 font-semibold text-slate-100 flex items-center gap-3">
                                    <img src={user.imageUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover"/>
                                    {user.name}
                                </td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${roleStyles[user.role]}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{user.joinedDate}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleAction('View', user.name)} className="p-2 text-slate-400 hover:text-orange-400" title="View Profile">
                                        <ViewIcon className="w-5 h-5" />
                                    </button>
                                     <button onClick={() => handleAction('Suspend', user.name)} className="p-2 text-slate-400 hover:text-red-400" title="Suspend User">
                                        <SuspendIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                       ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;