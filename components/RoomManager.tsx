import React, { useState } from 'react';
import type { Stoodio, Room } from '../types';
import { SmokingPolicy } from '../types';
import { PlusCircleIcon, TrashIcon, EditIcon } from './icons';

interface RoomManagerProps {
    stoodio: Stoodio;
    onUpdateStoodio: (updates: Partial<Stoodio>) => void;
}

const RoomForm: React.FC<{ room?: Room, onSave: (room: Room) => void, onCancel: () => void }> = ({ room, onSave, onCancel }) => {
    const [name, setName] = useState(room?.name || '');
    const [description, setDescription] = useState(room?.description || '');
    const [hourlyRate, setHourlyRate] = useState(room?.hourlyRate || 100);
    const [smokingPolicy, setSmokingPolicy] = useState(room?.smokingPolicy || SmokingPolicy.NON_SMOKING);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: room?.id || `room-${Date.now()}`,
            name,
            description,
            hourlyRate,
            smokingPolicy,
            photos: room?.photos || [],
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-700 space-y-4">
            <h3 className="font-semibold text-lg">{room ? 'Edit Room' : 'Add New Room'}</h3>
            <div>
                <label className="text-sm">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 bg-zinc-800 rounded-md" required />
            </div>
            <div>
                <label className="text-sm">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 bg-zinc-800 rounded-md" rows={3}></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm">Hourly Rate ($)</label>
                    <input type="number" value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value))} className="w-full p-2 bg-zinc-800 rounded-md" required min="0" />
                </div>
                 <div>
                    <label className="text-sm">Smoking Policy</label>
                    <select value={smokingPolicy} onChange={e => setSmokingPolicy(e.target.value as SmokingPolicy)} className="w-full p-2 bg-zinc-800 rounded-md">
                        <option value={SmokingPolicy.NON_SMOKING}>Non-Smoking</option>
                        <option value={SmokingPolicy.SMOKING_ALLOWED}>Smoking Allowed</option>
                    </select>
                </div>
            </div>
             <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="bg-zinc-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="submit" className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg">Save Room</button>
            </div>
        </form>
    );
};

const RoomManager: React.FC<RoomManagerProps> = ({ stoodio, onUpdateStoodio }) => {
    const [editingRoom, setEditingRoom] = useState<Room | null | 'new'>(null);

    const handleSaveRoom = (roomToSave: Room) => {
        const existingRoom = stoodio.rooms.find(r => r.id === roomToSave.id);
        let updatedRooms;
        if (existingRoom) {
            updatedRooms = stoodio.rooms.map(r => r.id === roomToSave.id ? roomToSave : r);
        } else {
            updatedRooms = [...stoodio.rooms, roomToSave];
        }
        onUpdateStoodio({ rooms: updatedRooms });
        setEditingRoom(null);
    };

    const handleDeleteRoom = (roomId: string) => {
        if (window.confirm("Are you sure you want to delete this room?")) {
            const updatedRooms = stoodio.rooms.filter(r => r.id !== roomId);
            onUpdateStoodio({ rooms: updatedRooms });
        }
    };
    
    return (
        <div className="bg-zinc-800/50 p-6 rounded-lg shadow-md border border-zinc-700/50">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-zinc-100">Manage Rooms</h1>
                <button onClick={() => setEditingRoom('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                    <PlusCircleIcon className="w-5 h-5"/> Add Room
                </button>
            </div>

            {editingRoom && <RoomForm room={editingRoom === 'new' ? undefined : editingRoom} onSave={handleSaveRoom} onCancel={() => setEditingRoom(null)} />}
            
            <div className="space-y-4 mt-4">
                {stoodio.rooms.map(room => (
                    <div key={room.id} className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h3 className="font-bold text-lg text-orange-400">{room.name}</h3>
                            <p className="text-sm text-zinc-300">{room.description}</p>
                            <div className="flex items-center gap-4 text-sm mt-2">
                                <span className="font-semibold text-green-400">${room.hourlyRate}/hr</span>
                                <span className="text-zinc-400">{room.smokingPolicy === SmokingPolicy.SMOKING_ALLOWED ? "Smoking" : "Non-Smoking"}</span>
                            </div>
                        </div>
                         <div className="flex gap-2 self-end md:self-center">
                            <button onClick={() => setEditingRoom(room)} className="p-2 bg-zinc-700 rounded-md"><EditIcon className="w-5 h-5"/></button>
                            <button onClick={() => handleDeleteRoom(room.id)} className="p-2 bg-red-500/20 text-red-400 rounded-md"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoomManager;
