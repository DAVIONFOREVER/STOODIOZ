
import React, { useState, useRef } from 'react';
import { AppView } from '../types';
import { PhotoIcon } from './icons';

interface ArtistSetupProps {
    onCompleteSetup: (name: string, bio: string, email: string, password: string, imageUrl: string | null, imageFile: File | null) => void;
    onNavigate: (view: AppView) => void;
}

const ArtistSetup: React.FC<ArtistSetupProps> = ({ onCompleteSetup, onNavigate }) => {
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => fileInputRef.current?.click();

    const isFormValid = name.trim() && bio.trim() && email.trim() && password.trim() && agreedToTerms;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isFormValid) {
            onCompleteSetup(name, bio, email, password, imagePreview, imageFile);
        } else {
            alert("Please fill in all required fields and agree to the terms and conditions to continue.");
        }
    };
    
    return (
        <div className="max-w-2xl mx-auto p-8 animate-fade-in cardSurface">
            <h1 className="text-4xl font-extrabold text-center mb-2 text-zinc-100">Create Your <span className="text-orange-400">Artist Profile</span></h1>
            <p className="text-center text-zinc-400 mb-8">Tell the community who you are and create your account.</p>
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Profile Picture</label>
                    <div className="mt-2 flex items-center gap-4">
                        <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Profile preview" className="w-full h-full object-cover" />
                            ) : (
                                <PhotoIcon className="w-10 h-10 text-zinc-500" />
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={triggerFileInput}
                            className="px-4 py-2 text-sm font-semibold bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600"
                        >
                            Upload Photo
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">Artist/Band Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="e.g., Luna Vance"
                        required
                        autoComplete="off"
                    />
                </div>
                <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-zinc-300 mb-2">Your Bio</label>
                    <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Describe your sound, your influences, and what you're looking for."
                        required
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="you@example.com"
                            required
                            autoComplete="off"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" aria-label="Password" className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="••••••••"
                            required
                            autoComplete="new-password"
                        />
                    </div>
                </div>
                 <div>
                    <label htmlFor="terms" className="flex items-start">
                        <input
                        type="checkbox"
                        id="terms"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500 mt-1"
                        required
                        />
                        <span className="ml-3 text-sm text-zinc-400">
                        I have read and agree to the{' '}
                        <button type="button" onClick={() => onNavigate(AppView.PRIVACY_POLICY)} className="font-medium text-orange-400 hover:underline">
                            User Agreement &amp; Privacy Policy
                        </button>
                        .
                        </span>
                    </label>
                </div>
                <button type="submit" className="w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20">
                    Complete Profile
                </button>
            </form>
        </div>
    );
};

export default ArtistSetup;
