
import React, { useState } from 'react';
import type { Stoodio, Room } from '../types';
import { SmokingPolicy } from '../types';
import { HouseIcon, DollarSignIcon, EditIcon, TrashIcon, PlusCircleIcon, CloseIcon } from './icons';

interface RoomManagerProps {
    stoodio: Stoodio;
    onUpdateStoodio: (updatedProfile: Partial<Stoodio>) => void;
}

const RoomFormModal: React.FC<{
    room: Partial<Room> | null;
    onSave: (room: Room) => void;
    onClose: () => void;
}> = ({ room, onSave, onClose }) => {
    const [name, setName] = useState(room?.name || '');
    const [description, setDescription] = useState(room?.description || '');
    const [hourlyRate, setHourlyRate] = useState(room?.hourlyRate || 0);
    const [smokingPolicy, setSmokingPolicy] = useState<SmokingPolicy>(room?.smokingPolicy || SmokingPolicy.NON_SMOKING);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalRoom: Room = {
            id: room?.id || `room-${Date.now()}`,
            name,
            description,
            hourlyRate,
            photos: room?.photos || [],
            smokingPolicy,
        };
        onSave(finalRoom);
    };
    
    const inputClasses = "w-full p-2 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500";

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-lg cardSurface">
                <div className="p-6 border-b border-zinc-700/50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-zinc-100">{room?.id ? 'Edit Room' : 'Add New Room'}</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-zinc-400 hover:text-zinc-100" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="room-name" className="block text-sm font-medium text-zinc-300 mb-1">Room Name</label>
                            <input type="text" id="room-name" value={name} onChange={e => setName(e.target.value)} required className={inputClasses}/>
                        </div>
                        <div>
                            <label htmlFor="room-desc" className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
                            <textarea id="room-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClasses}></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="room-rate" className="block text-sm font-medium text-zinc-300 mb-1">Hourly Rate ($)</label>
                                <input type="number" id="room-rate" value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value))} required className={inputClasses}/>
                            </div>
                             <div>
                                <label htmlFor="smoking-policy" className="block text-sm font-medium text-zinc-300 mb-1">Smoking Policy</label>
                                <select id="smoking-policy" value={smokingPolicy} onChange={e => setSmokingPolicy(e.target.value as SmokingPolicy)} className={inputClasses}>
                                    <option value={SmokingPolicy.NON_SMOKING}>Non-Smoking</option>
                                    <option value={SmokingPolicy.SMOKING_ALLOWED}>Smoking Allowed</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-zinc-900/50 border-t border-zinc-700/50 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded bg-zinc-700 text-zinc-200 hover:bg-zinc-600">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm rounded bg-orange-500 text-white hover:bg-orange-600">Save Room</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const RoomManager: React.FC<RoomManagerProps> = ({ stoodio, onUpdateStoodio }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null);

    const handleOpenModal = (room: Partial<Room> | null = null) => {
        setEditingRoom(room);
        setIsModalOpen(true);
    };

    const handleSaveRoom = (roomToSave: Room) => {
        let updatedRooms: Room[];
        const existingRoomIndex = stoodio.rooms.findIndex(r => r.id === roomToSave.id);

        if (existingRoomIndex > -1) {
            updatedRooms = stoodio.rooms.map(r => r.id === roomToSave.id ? roomToSave : r);
        } else {
            updatedRooms = [...stoodio.rooms, roomToSave];
        }
        
        onUpdateStoodio({ rooms: updatedRooms });
        setIsModalOpen(false);
        setEditingRoom(null);
    };

    const handleDeleteRoom = (roomId: string) => {
        if (window.confirm('Are you sure you want to delete this room? This cannot be undone.')) {
            const updatedRooms = stoodio.rooms.filter(r => r.id !== roomId);
            onUpdateStoodio({ rooms: updatedRooms });
        }
    };

    return (
        <div className="p-6 cardSurface">
             <div className="flex justify-between items-center mb-6">
                 <h1 className="text-2xl font-bold text-zinc-100">Manage Rooms</h1>
                 <button onClick={() => handleOpenModal({})} className="flex items-center gap-2 bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors text-sm">
                    <PlusCircleIcon className="w-5 h-5"/>
                    Add Room
                </button>
            </div>
            
            <div className="space-y-4">
                {stoodio.rooms.length > 0 ? stoodio.rooms.map(room => (
                    <div key={room.id} className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-grow">
                            <h3 className="font-bold text-lg text-zinc-200 flex items-center gap-2"><HouseIcon className="w-5 h-5 text-orange-400"/> {room.name}</h3>
                            <p className="text-sm text-zinc-400 mt-1 mb-2">{room.description}</p>
                            <div className="flex items-center gap-4">
                                <div className="text-sm font-semibold text-green-400 flex items-center gap-1">
                                    <DollarSignIcon className="w-4 h-4" /> ${room.hourlyRate}/hr
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${room.smokingPolicy === SmokingPolicy.SMOKING_ALLOWED ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
                                    {room.smokingPolicy === SmokingPolicy.SMOKING_ALLOWED ? 'Smoking Allowed' : 'Non-Smoking'}
                                </span>
                            </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2">
                             <button onClick={() => handleOpenModal(room)} className="p-2 text-zinc-400 hover:text-orange-400 rounded-full bg-zinc-800 hover:bg-orange-500/10"><EditIcon className="w-5 h-5"/></button>
                             <button onClick={() => handleDeleteRoom(room.id)} className="p-2 text-zinc-400 hover:text-red-400 rounded-full bg-zinc-800 hover:bg-red-500/10"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                )) : (
                    <p className="text-center py-8 text-zinc-500">You haven't added any rooms yet. Add your first room to get started!</p>
                )}
            </div>
            
            {isModalOpen && <RoomFormModal room={editingRoom} onSave={handleSaveRoom} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default RoomManager;
      