
import React, { useState, useRef } from 'react';
import { AppView, SmokingPolicy } from '../types';
import { PhotoIcon } from './icons';

interface StoodioSetupProps {
    onCompleteSetup: (name: string, username: string, description: string, location: string, businessAddress: string, email: string, password: string, imageUrl: string | null, imageFile: File | null) => void;
    onNavigate: (view: AppView) => void;
    isLoading?: boolean;
}

const StoodioSetup: React.FC<StoodioSetupProps> = ({ onCompleteSetup, onNavigate, isLoading = false }) => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [businessAddress, setBusinessAddress] = useState('');
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

    const isFormValid = name.trim() && username.trim() && description.trim() && location.trim() && email.trim() && password.trim() && agreedToTerms;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isFormValid) {
            // Ensure location and description are clean strings
            onCompleteSetup(
                name.trim(), 
                username.trim().replace(/\s+/g,'').toLowerCase(),
                description.trim(), 
                location.trim(), 
                businessAddress.trim(), 
                email.trim(), 
                password, 
                imagePreview, 
                imageFile
            );
        } else {
            alert("Please fill in all required fields and agree to the terms and conditions to continue.");
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-8 animate-fade-in cardSurface">
            <h1 className="text-4xl font-extrabold text-center mb-2 text-zinc-100">Create Your <span className="text-orange-400">Stoodio Profile</span></h1>
            <p className="text-center text-zinc-400 mb-8">List your space for artists to discover and create your account.</p>
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                 <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Stoodio Logo/Photo</label>
                    <div className="mt-2 flex items-center gap-4">
                        <div className="w-24 h-24 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Stoodio preview" className="w-full h-full object-cover" />
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
                            accept="image/*,.heic,.heif"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">Stoodio Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="e.g., Echo Chamber Stoodioz"
                        required
                        autoComplete="off"
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-2">Username (required)</label>
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-bold">@</span>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
                            className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="e.g., atlstudios"
                            required
                            autoComplete="off"
                            disabled={isLoading}
                        />
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">This is your public handle. Letters/numbers/underscore only.</p>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-zinc-300 mb-2">Location (City, State)</label>
                        <input
                            type="text"
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="e.g., Atlanta, GA"
                            required
                            autoComplete="off"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-zinc-300 mb-2">Business Address (Optional)</label>
                        <input
                            type="text"
                            id="address"
                            value={businessAddress}
                            onChange={(e) => setBusinessAddress(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="123 Music Row, Nashville, TN"
                            autoComplete="off"
                            disabled={isLoading}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Describe your stoodio's vibe, main equipment, and what makes it unique."
                        required
                        disabled={isLoading}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">Login Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="you@example.com"
                            required
                            autoComplete="off"
                            disabled={isLoading}
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
                            disabled={isLoading}
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
                        disabled={isLoading}
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
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:bg-zinc-600 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating Profile...
                        </>
                    ) : 'Complete Profile'}
                </button>
            </form>
        </div>
    );
};

export default StoodioSetup;
