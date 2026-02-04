
import React, { useState, useRef, useEffect } from 'react';
import type { Stoodio, Room } from '../types';
import { SmokingPolicy } from '../types';
import { HouseIcon, DollarSignIcon, EditIcon, TrashIcon, PlusCircleIcon, CloseIcon, PhotoIcon } from './icons';
import { upsertRoom, deleteRoom, uploadRoomPhoto, fetchFullStoodio } from '../services/apiService';

interface RoomManagerProps {
    stoodio: Stoodio;
    onRefresh: () => void;
}

const RoomFormModal: React.FC<{
    room: Partial<Room> | null;
    stoodioId: string;
    onSave: (room: Room, newPhotoFiles: File[]) => void;
    onClose: () => void;
    isUploading: boolean;
}> = ({ room, stoodioId, onSave, onClose, isUploading }) => {
    const [name, setName] = useState(room?.name || '');
    const [description, setDescription] = useState(room?.description || '');
    const [hourlyRate, setHourlyRate] = useState(room?.hourly_rate || 0);
    const [smokingPolicy, setSmokingPolicy] = useState<SmokingPolicy>(room?.smoking_policy || SmokingPolicy.NON_SMOKING);
    
    const [existingPhotos, setExistingPhotos] = useState<string[]>(room?.photos || []);
    const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const fileList: File[] = Array.from(files);
            setNewPhotoFiles(prev => [...prev, ...fileList]);
            
            const newPreviews = fileList.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviews]);
        }
    };

    const removeExistingPhoto = (index: number) => {
        setExistingPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const removeNewPhoto = (index: number) => {
        setNewPhotoFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // FIX: Use crypto.randomUUID() to generate a valid UUID for the database
        const finalRoom: Room = {
            id: room?.id || crypto.randomUUID(),
            name,
            description,
            hourly_rate: hourlyRate,
            photos: existingPhotos, 
            smoking_policy: smokingPolicy,
        };
        onSave(finalRoom, newPhotoFiles);
    };
    
    const inputClasses = "w-full p-2 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500";

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="w-full max-w-lg cardSurface max-h-[90dvh] overflow-y-auto">
                <div className="p-6 border-b border-zinc-700/50 flex justify-between items-center sticky top-0 bg-zinc-900 z-10">
                    <h2 className="text-xl font-bold text-zinc-100">{room?.id ? 'Edit Room' : 'Add New Room'}</h2>
                    <button onClick={onClose} disabled={isUploading}><CloseIcon className="w-6 h-6 text-zinc-400 hover:text-zinc-100" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="room-name" className="block text-sm font-medium text-zinc-300 mb-1">Room Name</label>
                            <input type="text" id="room-name" value={name} onChange={e => setName(e.target.value)} required className={inputClasses} placeholder="e.g., Studio A"/>
                        </div>
                        <div>
                            <label htmlFor="room-desc" className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
                            <textarea id="room-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClasses} placeholder="Describe equipment, vibe, and size..."></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="room-rate" className="block text-sm font-medium text-zinc-300 mb-1">Hourly Rate ($)</label>
                                <input type="number" id="room-rate" value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value))} required className={inputClasses} min="0"/>
                            </div>
                             <div>
                                <label htmlFor="smoking-policy" className="block text-sm font-medium text-zinc-300 mb-1">Smoking Policy</label>
                                <select id="smoking-policy" value={smokingPolicy} onChange={e => setSmokingPolicy(e.target.value as SmokingPolicy)} className={inputClasses}>
                                    <option value={SmokingPolicy.NON_SMOKING}>Non-Smoking</option>
                                    <option value={SmokingPolicy.SMOKING_ALLOWED}>Smoking Allowed</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Room Photos</label>
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                {existingPhotos.map((url, i) => (
                                    <div key={`existing-${i}`} className="relative group aspect-square">
                                        <img src={url} alt="Room" className="w-full h-full object-cover rounded-lg border border-zinc-700" />
                                        <button 
                                            type="button" 
                                            onClick={() => removeExistingPhoto(i)}
                                            className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <CloseIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {previewUrls.map((url, i) => (
                                    <div key={`new-${i}`} className="relative group aspect-square">
                                        <img src={url} alt="New Upload" className="w-full h-full object-cover rounded-lg border border-green-500/50" />
                                        <button 
                                            type="button" 
                                            onClick={() => removeNewPhoto(i)}
                                            className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <CloseIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square bg-zinc-800 border-2 border-dashed border-zinc-600 rounded-lg flex flex-col items-center justify-center text-zinc-500 hover:border-orange-500 hover:text-orange-500 transition-colors"
                                >
                                    <PhotoIcon className="w-6 h-6 mb-1" />
                                    <span className="text-xs font-medium">Add Photo</span>
                                </button>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                accept="image/*,.heic,.heif" 
                                multiple 
                                className="hidden" 
                            />
                        </div>
                    </div>
                    <div className="p-4 bg-zinc-900/50 border-t border-zinc-700/50 flex justify-end gap-2 sticky bottom-0">
                        <button type="button" onClick={onClose} disabled={isUploading} className="px-4 py-2 text-sm rounded bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors">Cancel</button>
                        <button type="submit" disabled={isUploading} className="px-4 py-2 text-sm rounded bg-orange-500 text-white hover:bg-orange-600 disabled:bg-zinc-600 flex items-center gap-2 transition-colors">
                            {isUploading && (
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {isUploading ? 'Saving...' : 'Save Room'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const RoomManager: React.FC<RoomManagerProps> = ({ stoodio, onRefresh }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [rooms, setRooms] = useState<Room[]>(stoodio.rooms || []);

    useEffect(() => {
        setRooms(stoodio.rooms || []);
    }, [stoodio.rooms]);

    useEffect(() => {
        let isMounted = true;
        if (rooms.length === 0 && stoodio.id) {
            fetchFullStoodio(stoodio.id)
                .then((full) => {
                    if (!isMounted) return;
                    if (full?.rooms) setRooms(full.rooms);
                })
                .catch((err) => {
                    console.warn('Failed to refresh rooms list:', err);
                });
        }
        return () => {
            isMounted = false;
        };
    }, [rooms.length, stoodio.id]);

    const handleOpenModal = (room: Partial<Room> | null = null) => {
        setEditingRoom(room);
        setIsModalOpen(true);
    };

    const handleSaveRoom = async (roomToSave: Room, newPhotoFiles: File[]) => {
        setIsUploading(true);
        // stoodio_id references profiles.id after unification; prefer profile_id so rooms show on public profile
        const stoodioId = (stoodio as any)?.profile_id ?? stoodio?.id;
        if (!stoodioId) {
            setIsUploading(false);
            alert('Studio profile not found. Please refresh the page and try again.');
            return;
        }
        try {
            // 1) Create/update room first so we have a persisted room_id for uploads
            const saved = await upsertRoom({ ...roomToSave, photos: roomToSave.photos || [] }, stoodioId);
            const roomId = saved?.id ?? roomToSave.id;
            if (!roomId) {
                throw new Error('Room was not created; no room ID returned.');
            }

            const uploadedUrls: string[] = [];
            for (const file of newPhotoFiles) {
                const url = await uploadRoomPhoto(roomId, file);
                uploadedUrls.push(url);
            }

            const combinedPhotos = [...(roomToSave.photos || []), ...uploadedUrls];
            if (uploadedUrls.length > 0) {
                await upsertRoom({ id: roomId, photos: combinedPhotos }, stoodioId);
            }

            onRefresh();
            setIsModalOpen(false);
            setEditingRoom(null);
        } catch (error: any) {
            console.error('Failed to save room:', error);
            const msg = error?.message || 'Please check your connection and that the room-photos storage bucket exists.';
            alert(`Error saving room: ${msg}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteRoom = async (roomId: string) => {
        if (window.confirm('Are you sure you want to delete this room? This cannot be undone.')) {
             try {
                await deleteRoom(roomId);
                onRefresh();
            } catch (error: any) {
                console.error("Failed to delete room:", error);
                alert("Failed to delete room.");
            }
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
                {rooms.length > 0 ? rooms.map(room => (
                    <div key={room.id} className="cardSurface p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-orange-500/30 transition-colors">
                        <div className="flex items-start gap-4 flex-grow">
                            {room.photos && room.photos.length > 0 ? (
                                <img src={room.photos[0]} alt={room.name} className="w-20 h-20 object-cover rounded-lg border border-zinc-700" />
                            ) : (
                                <div className="w-20 h-20 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-600 border border-zinc-700">
                                    <HouseIcon className="w-8 h-8" />
                                </div>
                            )}
                            <div>
                                <h3 className="font-bold text-lg text-zinc-200 flex items-center gap-2">{room.name}</h3>
                                <p className="text-sm text-zinc-400 mt-1 mb-2 line-clamp-2">{room.description}</p>
                                <div className="flex items-center gap-4">
                                    <div className="text-sm font-semibold text-green-400 flex items-center gap-1">
                                        <DollarSignIcon className="w-4 h-4" /> ${room.hourly_rate}/hr
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${room.smoking_policy === SmokingPolicy.SMOKING_ALLOWED ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
                                        {room.smoking_policy === SmokingPolicy.SMOKING_ALLOWED ? 'Smoking Allowed' : 'Non-Smoking'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2">
                             <button onClick={() => handleOpenModal(room)} className="p-2 text-zinc-400 hover:text-orange-400 rounded-full bg-zinc-800 hover:bg-orange-500/10 transition-colors"><EditIcon className="w-5 h-5"/></button>
                             <button onClick={() => handleDeleteRoom(room.id)} className="p-2 text-zinc-400 hover:text-red-400 rounded-full bg-zinc-800 hover:bg-red-500/10 transition-colors"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-12 bg-zinc-800/50 rounded-xl border border-zinc-700 border-dashed">
                        <HouseIcon className="w-12 h-12 mx-auto text-zinc-600 mb-2" />
                        <p className="text-zinc-400">You haven't added any rooms yet.</p>
                        <p className="text-sm text-zinc-500 mt-1">Start by adding a room to accept bookings.</p>
                    </div>
                )}
            </div>
            
            {isModalOpen && <RoomFormModal room={editingRoom} stoodioId={stoodio.id} onSave={handleSaveRoom} onClose={() => setIsModalOpen(false)} isUploading={isUploading} />}
        </div>
    );
};

export default RoomManager;