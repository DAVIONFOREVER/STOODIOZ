import React, { useState, useEffect } from 'react';
import type { Project, ProjectTask } from '../types';
import { BriefcaseIcon, CheckCircleIcon, ClockIcon, PlusCircleIcon, UsersIcon, CloseIcon } from './icons';
import { fetchLabelProjects, updateProjectTask, createProjectTask } from '../services/apiService';
import { useAppState } from '../contexts/AppContext';
import appIcon from '../assets/stoodioz-app-icon.png';

const ProjectManager: React.FC = () => {
    const { currentUser, artists } = useAppState();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const refreshProjects = async () => {
        if (currentUser) {
            const data = await fetchLabelProjects(currentUser.id);
            setProjects(data);
            if (selectedProject) {
                const updated = data.find(p => p.id === selectedProject.id);
                if (updated) setSelectedProject(updated);
            } else if (data.length > 0) {
                setSelectedProject(data[0]);
            }
        }
    };

    useEffect(() => {
        if (currentUser) {
            refreshProjects().then(() => setLoading(false));
        }
    }, [currentUser]);

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject || !newTaskTitle.trim()) return;
        
        try {
            await createProjectTask(selectedProject.id, {
                title: newTaskTitle.trim(),
                status: 'TODO',
                priority: 'NORMAL',
                created_at: new Date().toISOString()
            });
            setNewTaskTitle('');
            setIsAddingTask(false);
            await refreshProjects();
        } catch (e) { 
            alert("Failed to add task."); 
        }
    };

    const handleToggleTask = async (task: ProjectTask) => {
        const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
        await updateProjectTask(task.id, { status: newStatus as any });
        await refreshProjects();
    };

    if (loading) return (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <img src={appIcon} alt="Loading" className="h-8 w-8 animate-spin" />
            <p className="text-zinc-500 font-medium">Syncing roadmap...</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <div>
                    <h1 className="text-3xl font-extrabold text-zinc-100">Project Management</h1>
                    <p className="text-zinc-400 mt-1">Track rollouts, album cycles, and asset deadlines.</p>
                </div>
                <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-lg">
                    <PlusCircleIcon className="w-5 h-5" />
                    New Project
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-3">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2">Active Projects</h3>
                    {projects.map(p => (
                        <button 
                            key={p.id}
                            onClick={() => setSelectedProject(p)}
                            className={`w-full p-4 rounded-xl text-left border transition-all ${selectedProject?.id === p.id ? 'bg-orange-500/10 border-orange-500' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'}`}
                        >
                            <p className={`font-bold ${selectedProject?.id === p.id ? 'text-orange-400' : 'text-zinc-200'}`}>{p.name}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`w-2 h-2 rounded-full ${p.status === 'COMPLETED' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">{p.status}</p>
                            </div>
                        </button>
                    ))}
                    {projects.length === 0 && (
                        <div className="p-8 text-center bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                             <BriefcaseIcon className="w-8 h-8 mx-auto text-zinc-700 mb-2" />
                             <p className="text-xs text-zinc-500">No active projects.</p>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-3 cardSurface p-6">
                    {selectedProject ? (
                        <div className="space-y-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-100">{selectedProject.name}</h2>
                                    <div className="flex items-center gap-2 mt-2">
                                        <UsersIcon className="w-4 h-4 text-orange-400" />
                                        <span className="text-sm text-zinc-400">Lead Artist: {artists.find(a => a.id === selectedProject.artist_id)?.name || 'Unknown Artist'}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Rollout Progress</p>
                                    <div className="w-48 h-2 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: '45%' }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-zinc-300 text-sm uppercase tracking-widest flex items-center gap-2">
                                    <ClockIcon className="w-4 h-4" />
                                    Active Milestones
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {selectedProject.tasks?.map(task => (
                                        <div key={task.id} className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 flex items-center justify-between group hover:border-orange-500/30 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => handleToggleTask(task)} className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${task.status === 'DONE' ? 'bg-green-500 border-green-500' : 'border-zinc-600 hover:border-orange-500'}`}>
                                                    {task.status === 'DONE' && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                                </button>
                                                <div>
                                                    <p className={`font-semibold ${task.status === 'DONE' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>{task.title}</p>
                                                    <p className="text-[10px] text-zinc-500 mt-0.5 uppercase font-bold tracking-wider">Priority: {task.priority} • Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'TBD'}</p>
                                                </div>
                                            </div>
                                            <button className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300 text-xs font-bold uppercase transition-opacity">Assign Staff</button>
                                        </div>
                                    ))}

                                    {isAddingTask ? (
                                        <form onSubmit={handleAddTask} className="bg-zinc-800 p-4 rounded-xl border border-orange-500/50 flex items-center gap-4 animate-fade-in">
                                            <input 
                                                autoFocus
                                                type="text"
                                                value={newTaskTitle}
                                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                                placeholder="What needs to be done?"
                                                className="bg-transparent flex-grow text-zinc-100 outline-none font-semibold"
                                            />
                                            <div className="flex items-center gap-2">
                                                <button type="submit" className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                </button>
                                                <button type="button" onClick={() => setIsAddingTask(false)} className="p-2 bg-zinc-700 text-zinc-400 rounded-lg hover:bg-zinc-600">
                                                    <CloseIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <button 
                                            onClick={() => setIsAddingTask(true)}
                                            className="p-4 rounded-xl border-2 border-dashed border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400 transition-all text-sm font-bold flex items-center justify-center gap-2"
                                        >
                                            <PlusCircleIcon className="w-5 h-5" />
                                            Add Milestone
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center py-24 opacity-30">
                            <BriefcaseIcon className="w-20 h-20 mb-4" />
                            <h3 className="text-xl font-bold">Project Desk Empty</h3>
                            <p className="text-sm mt-2">Select a project to manage the rollout roadmap.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectManager;