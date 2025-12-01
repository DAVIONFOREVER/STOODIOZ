
import React, { useState } from 'react';
import { useAuth as useSupabaseAuth } from '../providers/AuthProvider';
import { createLabel } from '../services/apiService';
import { useNavigation } from '../hooks/useNavigation';
import { AppView, UserRole } from '../types';

const LabelSetup: React.FC = () => {
    const { user } = useSupabaseAuth();
    const { navigate } = useNavigation();
    const [labelName, setLabelName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [website, setWebsite] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        setIsSubmitting(true);
        try {
            const labelData = await createLabel({
                labelName,
                companyName,
                contactEmail,
                contactPhone,
                website,
                notes
            }, user.id);

            if (labelData.beta_override) {
                navigate(AppView.LABEL_DASHBOARD);
            } else {
                navigate(AppView.LABEL_CONTACT_REQUIRED);
            }
        } catch (error) {
            console.error("Label setup failed:", error);
            alert("Failed to create label profile. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto p-8 animate-fade-in cardSurface mt-10">
            <h1 className="text-4xl font-extrabold text-center mb-2 text-zinc-100">
                Set Up Your <span className="text-blue-400">Label Profile</span>
            </h1>
            <p className="text-center text-zinc-400 mb-8">
                Enter your organization details to get started with Enterprise Label Mode.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Label / Management Name *</label>
                    <input
                        type="text"
                        value={labelName}
                        onChange={(e) => setLabelName(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Vertex Records"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Legal Company Name (Optional)</label>
                    <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Vertex Entertainment LLC"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Contact Email *</label>
                        <input
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="admin@vertexrecords.com"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Contact Phone *</label>
                        <input
                            type="tel"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="+1 (555) 123-4567"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Website (Optional)</label>
                    <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://vertexrecords.com"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Additional Notes / Roster Overview (Optional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Tell us a bit about your roster size and what you're looking for."
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:bg-zinc-600 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Creating Profile...' : 'Create Label Profile'}
                </button>
            </form>
        </div>
    );
};

export default LabelSetup;
