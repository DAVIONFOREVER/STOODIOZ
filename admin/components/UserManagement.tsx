

import React, { useState, useMemo } from 'react';
import type { PlatformUser } from '../types';
import { UserRole } from '../../types';
import { SearchIcon, EditIcon, DeactivateIcon } from './icons';

interface UserManagementProps {
    users: PlatformUser[];
}

const UserManagement: React.FC<UserManagementProps> = ({ users }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
            if (!matchesRole) return false;

            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                user.name.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower) ||
                user.id.toLowerCase().includes(searchLower);
            
            return matchesSearch;
        });
    }, [users, searchTerm, roleFilter]);

    const roleStyles: Record<UserRole, string> = {
        [UserRole.ARTIST]: 'bg-green-500/20 text-green-300',
        [UserRole.ENGINEER]: 'bg-orange-500/20 text-orange-300',
        [UserRole.STOODIO]: 'bg-red-500/20 text-red-300',
        [UserRole.PRODUCER]: 'bg-purple-500/20 text-purple-300',
    };
    
    const handleAction = (action: string, userId: string) => {
        alert(`${action} action for user ${userId} is not implemented.`);
    };

    return (
        <div>
            <h1 className="text-4xl font-bold text-slate-100 mb-2">User Management</h1>
            <p className="text-slate-400 mb-8">View, edit, or deactivate user accounts.</p>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <SearchIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name, email, or ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    />
                </div>
                 <select 
                    value={roleFilter} 
                    onChange={e => setRoleFilter(e.target.value as UserRole | 'ALL')}
                    className="w-full md:w-48 bg-zinc-800 border border-zinc-700 rounded-lg py-3 px-4 focus:ring-orange-500 focus:border-orange-500"
                >
                    <option value="ALL">All Roles</option>
                    <option value={UserRole.ARTIST}>Artist</option>
                    <option value={UserRole.ENGINEER}>Engineer</option>
                    <option value={UserRole.STOODIO}>Stoodio</option>
                    <option value={UserRole.PRODUCER}>Producer</option>
                </select>
            </div>


             <div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-x-auto">
                <table className="w-full min-w-[768px] text-sm text-left text-slate-300">
                    <thead className="bg-zinc-700/50 text-xs text-slate-400 uppercase tracking-wider">
                        <tr>
                            <th scope="col" className="px-6 py-3">User</th>
                            <th scope="col" className="px-6 py-3">Role</th>
                            <th scope="col" className="px-6 py-3">Joined Date</th>
                            <th scope="col" className="px-6 py-3">Wallet Balance</th>
                            <th scope="col" className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                       {filteredUsers.map(user => (
                            <tr key={user.id} className="border-b border-zinc-700 hover:bg-zinc-800/50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img className="w-10 h-10 rounded-xl object-cover" src={user.imageUrl} alt={user.name} />
                                        <div>
                                            <div className="font-semibold text-slate-100">{user.name}</div>
                                            <div className="text-slate-400">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${roleStyles[user.role]}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{new Date(user.joinedDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-semibold text-green-400">${user.walletBalance.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleAction('Edit', user.id)} className="p-2 text-slate-400 hover:text-orange-400" title="Edit User">
                                        <EditIcon className="w-5 h-5" />
                                    </button>
                                     <button onClick={() => handleAction('Deactivate', user.id)} className="p-2 text-slate-400 hover:text-red-400" title="Deactivate User">
                                        <DeactivateIcon className="w-5 h-5" />
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
