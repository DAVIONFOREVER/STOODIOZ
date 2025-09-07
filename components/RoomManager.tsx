import React, { useState } from 'react';
import type { Stoodio, Room } from '../types';
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
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalRoom: Room = {
            id: room?.id || `room-${Date.now()}`,
            name,
            description,
            hourlyRate,
            photos: room?.photos || [],
        };
        onSave(finalRoom);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">{room?.id ? 'Edit Room' : 'Add New Room'}</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-slate-500 hover:text-slate-800" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="room-name" className="block text-sm font-medium text-slate-700 mb-1">Room Name</label>
                            <input type="text" id="room-name" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 bg-slate-100 border-slate-300 rounded-md"/>
                        </div>
                        <div>
                            <label htmlFor="room-desc" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea id="room-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-2 bg-slate-100 border-slate-300 rounded-md"></textarea>
                        </div>
                        <div>
                            <label htmlFor="room-rate" className="block text-sm font-medium text-slate-700 mb-1">Hourly Rate ($)</label>
                            <input type="number" id="room-rate" value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value))} required className="w-full p-2 bg-slate-100 border-slate-300 rounded-md"/>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded bg-slate-200 text-slate-700 hover:bg-slate-300">Cancel</button>
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
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
             <div className="flex justify-between items-center mb-6">
                 <h1 className="text-2xl font-bold text-slate-900">Manage Rooms</h1>
                 <button onClick={() => handleOpenModal({})} className="flex items-center gap-2 bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors text-sm">
                    <PlusCircleIcon className="w-5 h-5"/>
                    Add Room
                </button>
            </div>
            
            <div className="space-y-4">
                {stoodio.rooms.length > 0 ? stoodio.rooms.map(room => (
                    <div key={room.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-grow">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><HouseIcon className="w-5 h-5 text-orange-500"/> {room.name}</h3>
                            <p className="text-sm text-slate-600 mt-1 mb-2">{room.description}</p>
                            <div className="text-sm font-semibold text-green-600 flex items-center gap-1">
                                <DollarSignIcon className="w-4 h-4" /> ${room.hourlyRate}/hr
                            </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2">
                             <button onClick={() => handleOpenModal(room)} className="p-2 text-slate-500 hover:text-orange-500 rounded-full bg-slate-200 hover:bg-orange-100"><EditIcon className="w-5 h-5"/></button>
                             <button onClick={() => handleDeleteRoom(room.id)} className="p-2 text-slate-500 hover:text-red-500 rounded-full bg-slate-200 hover:bg-red-100"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                )) : (
                    <p className="text-center py-8 text-slate-500">You haven't added any rooms yet. Add your first room to get started!</p>
                )}
            </div>
            
            {isModalOpen && <RoomFormModal room={editingRoom} onSave={handleSaveRoom} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default RoomManager;