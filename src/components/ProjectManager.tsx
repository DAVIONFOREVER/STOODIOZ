
import React, { useState, useEffect } from 'react';
import type { Project, ProjectTask, Artist } from '../types';
import { BriefcaseIcon, CheckCircleIcon, ClockIcon, PlusCircleIcon, UsersIcon } from './icons';
import { fetchLabelProjects, createProjectTask, updateProjectTask } from '../services/apiService';
import { useAppState } from '../contexts/AppContext';

const ProjectManager: React.FC = () => {
    const { currentUser, artists } = useAppState();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    useEffect(() => {
        if (currentUser) {
            fetchLabelProjects(currentUser.id).then(data => {
                setProjects(data);
                setLoading(false);
                if (data.length > 0) setSelectedProject(data[0]);
            });
        }
    }, [currentUser]);

    const handleToggleTask = async (task: ProjectTask) => {
        const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
        await updateProjectTask(task.id, { status: newStatus as any });
        // Local refresh
        setProjects(prev => prev.map(p => ({
            ...p,
            tasks: p.tasks?.map(t => t.id === task.id ? { ...t, status: newStatus as any } : t)
        })));
        if (selectedProject?.id === task.project_id) {
             setSelectedProject(prev => prev ? ({
                ...prev,
                tasks: prev.tasks?.map(t => t.id === task.id ? { ...t, status: newStatus as any } : t)
             }) : null);
        }
    };

    if (loading) return <div className="py-20 text-center text-zinc-500 animate-pulse">Syncing roadmap...</div>;

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
                {/* Project List Sidebar */}
                <div className="lg:col-span-1 space-y-3">
                    {projects.map(p => (
                        <button 
                            key={p.id}
                            onClick={() => setSelectedProject(p)}
                            className={`w-full p-4 rounded-xl text-left border transition-all ${selectedProject?.id === p.id ? 'bg-orange-500/10 border-orange-500' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'}`}
                        >
                            <p className={`font-bold ${selectedProject?.id === p.id ? 'text-orange-400' : 'text-zinc-200'}`}>{p.name}</p>
                            <p className="text-xs text-zinc-500 mt-1">Status: {p.status}</p>
                        </button>
                    ))}
                    {projects.length === 0 && <p className="text-zinc-600 text-sm italic p-4">No active projects.</p>}
                </div>

                {/* Task Board */}
                <div className="lg:col-span-3 cardSurface p-6">
                    {selectedProject ? (
                        <div className="space-y-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-100">{selectedProject.name}</h2>
                                    <div className="flex items-center gap-2 mt-2">
                                        <UsersIcon className="w-4 h-4 text-orange-400" />
                                        <span className="text-sm text-zinc-400">Lead Artist: {artists.find(a => a.id === selectedProject.artist_id)?.name || 'Unknown'}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Global Progress</p>
                                    <div className="w-48 h-2 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-orange-500 rounded-full" style={{ width: '45%' }}></div>
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
                                        <div key={task.id} className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => handleToggleTask(task)} className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${task.status === 'DONE' ? 'bg-green-500 border-green-500' : 'border-zinc-600 hover:border-orange-500'}`}>
                                                    {task.status === 'DONE' && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                                </button>
                                                <div>
                                                    <p className={`font-semibold ${task.status === 'DONE' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>{task.title}</p>
                                                    <p className="text-[10px] text-zinc-500 mt-0.5">Priority: {task.priority} • Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'ASAP'}</p>
                                                </div>
                                            </div>
                                            <button className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300 text-xs font-bold uppercase">Assign</button>
                                        </div>
                                    ))}
                                    <button className="p-4 rounded-xl border-2 border-dashed border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-500 transition-all text-sm font-bold">
                                        + Add Task
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-20">
                            <BriefcaseIcon className="w-16 h-16 mb-4" />
                            <p>Select a project to view tasks.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectManager;
