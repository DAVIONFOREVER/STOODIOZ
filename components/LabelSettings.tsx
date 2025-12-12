
import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../contexts/AppContext';
import { useProfile } from '../hooks/useProfile';
import { PhotoIcon, EditIcon, CheckCircleIcon, LinkIcon } from './icons';
import type { Label } from '../types';

const InputField: React.FC<{ label: string; value: string; onChange: (val: string) => void; type?: string; placeholder?: string }> = ({ label, value, onChange, type = "text", placeholder }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-400 mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            placeholder={placeholder}
        />
    </div>
);

const LabelSettings: React.FC = () => {
    const { currentUser } = useAppState();
    const { updateProfile } = useProfile();
    
    // Cast to Label type
    const label = currentUser as Label;

    const [name, setName] = useState(label?.name || '');
    const [companyName, setCompanyName] = useState(label?.company_name || '');
    const [bio, setBio] = useState(label?.bio || '');
    const [website, setWebsite] = useState(label?.website || '');
    const [contactPhone, setContactPhone] = useState(label?.contact_phone || '');
    
    const [imagePreview, setImagePreview] = useState<string | null>(label?.image_url || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (label) {
            setName(label.name || '');
            setCompanyName(label.company_name || '');
            setBio(label.bio || '');
            setWebsite(label.website || '');
            setContactPhone(label.contact_phone || '');
            setImagePreview(label.image_url || null);
        }
    }, [label]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                // In a real app, you'd upload this file immediately or on save
                // For this demo, we update the profile with the data URL or handle upload in useProfile if adapted
                updateProfile({ image_url: result }); 
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile({
                name,
                company_name: companyName,
                bio,
                website,
                contact_phone: contactPhone
            });
            // Simulate delay for UX
            await new Promise(resolve => setTimeout(resolve, 800));
            alert("Profile updated successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!label) return null;

    return (
        <div className="max-w-4xl mx-auto p-6 animate-fade-in pb-24">
             <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-zinc-100">Label Settings</h1>
                    <p className="text-zinc-400 mt-1">Update your public profile and contact information.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Avatar */}
                <div className="lg:col-span-1">
                    <div className="cardSurface p-6 text-center">
                        <div className="relative inline-block group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-800 bg-zinc-900 mx-auto">
                                {imagePreview ? (
                                    <img src={imagePreview} alt={name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                        <PhotoIcon className="w-12 h-12" />
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 p-2 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-transform hover:scale-110"
                            >
                                <EditIcon className="w-5 h-5" />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>
                        <h3 className="mt-4 font-bold text-zinc-200">{name}</h3>
                        <p className="text-sm text-zinc-500">{companyName || "Independent Label"}</p>
                    </div>
                </div>

                {/* Right Col: Form */}
                <div className="lg:col-span-2">
                    <div className="cardSurface p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Label Name" value={name} onChange={setName} placeholder="e.g. Summit Records" />
                            <InputField label="Company Name" value={companyName} onChange={setCompanyName} placeholder="e.g. Summit LLC" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Bio / Manifesto</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={4}
                                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                                placeholder="Tell us about your label's vision..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Contact Phone" value={contactPhone} onChange={setContactPhone} type="tel" placeholder="(555) 123-4567" />
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Website</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                                        <LinkIcon className="w-4 h-4" />
                                    </span>
                                    <input
                                        type="url"
                                        value={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-700 flex justify-end">
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Saving...' : (
                                    <>
                                        <CheckCircleIcon className="w-5 h-5" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabelSettings;
