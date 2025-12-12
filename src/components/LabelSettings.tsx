
import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../contexts/AppContext';
import { useProfile } from '../hooks/useProfile';
import { PhotoIcon, EditIcon, CheckCircleIcon, LinkIcon, UsersIcon, ChartBarIcon, MapIcon, HouseIcon, SoundWaveIcon, MusicNoteIcon } from './icons';
import type { Label, RosterMember, LabelRosterMetadata, LabelOpportunities } from '../types';
import * as apiService from '../services/apiService';

const SectionHeader: React.FC<{ title: string; subtitle: string; icon: React.ReactNode }> = ({ title, subtitle, icon }) => (
    <div className="flex items-start gap-3 mb-6 pb-4 border-b border-zinc-700">
        <div className="p-2 bg-zinc-800 rounded-lg text-orange-400">
            {icon}
        </div>
        <div>
            <h2 className="text-xl font-bold text-zinc-100">{title}</h2>
            <p className="text-sm text-zinc-400">{subtitle}</p>
        </div>
    </div>
);

const InputField: React.FC<{ label: string; value: string; onChange: (val: string) => void; type?: string; placeholder?: string; help?: string }> = ({ label, value, onChange, type = "text", placeholder, help }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-400 mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            placeholder={placeholder}
        />
        {help && <p className="text-xs text-zinc-500 mt-1">{help}</p>}
    </div>
);

const ToggleSwitch: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between py-3">
        <span className="text-zinc-300 text-sm font-medium">{label}</span>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-orange-500 transition-colors ${checked ? 'bg-orange-500' : 'bg-zinc-700'}`}></div>
            <div className={`absolute top-0.5 left-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-transform ${checked ? 'translate-x-full border-white' : ''}`}></div>
        </label>
    </div>
);

const TagInput: React.FC<{ label: string; tags: string[]; onChange: (tags: string[]) => void; placeholder?: string }> = ({ label, tags, onChange, placeholder }) => {
    const [input, setInput] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && input.trim()) {
            e.preventDefault();
            if (!tags.includes(input.trim()) && tags.length < 5) {
                onChange([...tags, input.trim()]);
            }
            setInput('');
        }
    };

    const removeTag = (tag: string) => {
        onChange(tags.filter(t => t !== tag));
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-400 mb-2">{label} {tags.length >= 5 && <span className="text-red-400 text-xs">(Max 5)</span>}</label>
            <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                    <span key={tag} className="bg-zinc-700 text-zinc-200 text-sm px-3 py-1 rounded-full flex items-center gap-2">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-red-400"><span className="text-xs">✕</span></button>
                    </span>
                ))}
            </div>
            {tags.length < 5 && (
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                    placeholder={placeholder || "Type and press Enter"}
                />
            )}
        </div>
    );
};

const LabelSettings: React.FC = () => {
    const { currentUser } = useAppState();
    const { updateProfile } = useProfile();
    const label = currentUser as Label;

    // --- State ---
    // Identity
    const [name, setName] = useState(label?.name || '');
    const [companyName, setCompanyName] = useState(label?.company_name || '');
    const [parentCompany, setParentCompany] = useState(label?.parent_company || '');
    const [website, setWebsite] = useState(label?.website || '');
    const [contactPhone, setContactPhone] = useState(label?.contact_phone || '');
    const [yearsActive, setYearsActive] = useState<string>(label?.years_active?.toString() || '');
    
    // Taxonomy
    const [primaryGenres, setPrimaryGenres] = useState<string[]>(label?.primary_genres || []);
    const [primaryRegions, setPrimaryRegions] = useState<string[]>(label?.primary_regions || []);

    // Mission
    const [missionStatement, setMissionStatement] = useState(label?.mission_statement || '');
    const [bio, setBio] = useState(label?.bio || '');

    // Metrics
    const [totalStreams, setTotalStreams] = useState<string>(label?.public_metrics?.total_streams?.toString() || '');
    const [chartedRecords, setChartedRecords] = useState<string>(label?.public_metrics?.charted_records?.toString() || '');
    const [countries, setCountries] = useState<string>(label?.public_metrics?.countries_distributed?.toString() || '');
    const [certifications, setCertifications] = useState<string>(label?.public_metrics?.certifications?.toString() || '');

    // Services & Affiliations
    const [servicesOffered, setServicesOffered] = useState<string[]>(label?.services_offered || []);
    const [affiliations, setAffiliations] = useState<string[]>(label?.affiliations || []);

    // Opportunities
    const [opportunities, setOpportunities] = useState<LabelOpportunities>(label?.opportunities || {
        accepting_demos: false,
        hiring_producers: false,
        hiring_engineers: false,
        booking_studios: false,
        scouting: false
    });

    // Roster Display
    const [roster, setRoster] = useState<RosterMember[]>([]);
    const [rosterSettings, setRosterSettings] = useState<LabelRosterMetadata>(label?.roster_display_settings || {});

    // Visibility
    const [isPublic, setIsPublic] = useState(label?.is_public_profile_enabled ?? true);
    const [sectionVisibility, setSectionVisibility] = useState(label?.section_visibility || {
        mission: true, roster: true, metrics: true, services: true, partnerships: true, opportunities: true
    });

    const [imagePreview, setImagePreview] = useState<string | null>(label?.image_url || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (label) {
            // Load roster to populate selection list
            apiService.fetchLabelRoster(label.id).then(setRoster);
        }
    }, [label?.id]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                updateProfile({ image_url: result }); 
            };
            reader.readAsDataURL(file);
        }
    };

    const handleServiceToggle = (service: string) => {
        setServicesOffered(prev => prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]);
    };

    const handleRosterChange = (artistId: string, field: 'display' | 'status' | 'highlight', value: any) => {
        setRosterSettings(prev => ({
            ...prev,
            [artistId]: {
                display: prev[artistId]?.display ?? true,
                status: prev[artistId]?.status || 'Established',
                highlight_metric: prev[artistId]?.highlight_metric || '',
                ...{ [field === 'highlight' ? 'highlight_metric' : field]: value }
            }
        }));
    };

    const handleSectionToggle = (section: keyof typeof sectionVisibility) => {
        setSectionVisibility(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile({
                name,
                company_name: companyName,
                parent_company: parentCompany,
                website,
                contact_phone: contactPhone,
                years_active: parseInt(yearsActive) || undefined,
                primary_genres: primaryGenres,
                primary_regions: primaryRegions,
                bio,
                mission_statement: missionStatement,
                public_metrics: {
                    total_streams: parseInt(totalStreams) || 0,
                    charted_records: parseInt(chartedRecords) || 0,
                    countries_distributed: parseInt(countries) || 0,
                    certifications: parseInt(certifications) || 0
                },
                services_offered: servicesOffered,
                affiliations: affiliations,
                opportunities,
                roster_display_settings: rosterSettings,
                is_public_profile_enabled: isPublic,
                section_visibility: sectionVisibility
            });
            await new Promise(resolve => setTimeout(resolve, 800));
            alert("Profile settings saved successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!label) return null;

    const availableServices = [
        "Artist Development", "Distribution", "Marketing & Radio", "Brand Partnerships", "Touring Support", "Sync & Licensing"
    ];

    return (
        <div className="max-w-4xl mx-auto p-6 animate-fade-in pb-24">
             <div className="flex justify-between items-center mb-8 bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <div>
                    <h1 className="text-3xl font-extrabold text-zinc-100">Public Profile Settings</h1>
                    <p className="text-zinc-400 mt-1">Configure how your label appears on the Stoodioz network.</p>
                </div>
                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isPublic ? 'text-green-400' : 'text-zinc-500'}`}>{isPublic ? 'PUBLIC' : 'PRIVATE'}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                            <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-orange-500 transition-colors ${isPublic ? 'bg-green-500' : 'bg-zinc-700'}`}></div>
                            <div className={`absolute top-0.5 left-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-transform ${isPublic ? 'translate-x-full border-white' : ''}`}></div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="space-y-8">

                {/* 1. Identity */}
                <div className="cardSurface p-8">
                    <SectionHeader title="Identity & Credibility" subtitle="Basic label information and brand identity." icon={<UsersIcon className="w-6 h-6"/>} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <div className="md:col-span-1 text-center">
                            <div className="relative inline-block group mb-4">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-800 bg-zinc-900 mx-auto">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt={name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                            <PhotoIcon className="w-12 h-12" />
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 p-2 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600">
                                    <EditIcon className="w-4 h-4" />
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                            </div>
                            <p className="text-zinc-500 text-xs">Recommended: 400x400px</p>
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField label="Label Display Name" value={name} onChange={setName} />
                                <InputField label="Parent Company" value={parentCompany} onChange={setParentCompany} placeholder="e.g. Universal Music Group" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField label="Website" value={website} onChange={setWebsite} prefix="https://" />
                                <InputField label="Years Active" value={yearsActive} onChange={setYearsActive} type="number" />
                            </div>
                            <TagInput label="Primary Genres" tags={primaryGenres} onChange={setPrimaryGenres} placeholder="e.g. Hip-Hop, Pop" />
                            <TagInput label="Key Markets / Regions" tags={primaryRegions} onChange={setPrimaryRegions} placeholder="e.g. North America, UK" />
                        </div>
                    </div>
                </div>

                {/* 2. Mission & Bio */}
                <div className="cardSurface p-8">
                     <div className="flex justify-between">
                        <SectionHeader title="Mission & Bio" subtitle="Tell your story and vision." icon={<ChartBarIcon className="w-6 h-6"/>} />
                        <ToggleSwitch label="Show on Profile" checked={sectionVisibility.mission} onChange={() => handleSectionToggle('mission')} />
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Mission Statement <span className="text-xs ml-1">(Max 240 chars)</span></label>
                            <textarea
                                value={missionStatement}
                                onChange={(e) => setMissionStatement(e.target.value)}
                                maxLength={240}
                                rows={2}
                                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-3 outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="e.g. Empowering the next generation of global superstars."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Full Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={4}
                                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-3 outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Metrics */}
                <div className="cardSurface p-8">
                    <div className="flex justify-between">
                        <SectionHeader title="Key Results" subtitle="Showcase your success metrics (Self-reported)." icon={<ChartBarIcon className="w-6 h-6"/>} />
                        <ToggleSwitch label="Show on Profile" checked={sectionVisibility.metrics} onChange={() => handleSectionToggle('metrics')} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <InputField label="Total Streams" value={totalStreams} onChange={setTotalStreams} type="number" />
                        <InputField label="Charted Records" value={chartedRecords} onChange={setChartedRecords} type="number" />
                        <InputField label="Countries Dist." value={countries} onChange={setCountries} type="number" />
                        <InputField label="Certifications" value={certifications} onChange={setCertifications} type="number" help="Gold/Platinum awards" />
                    </div>
                </div>

                {/* 4. Services */}
                <div className="cardSurface p-8">
                    <div className="flex justify-between">
                        <SectionHeader title="Services Offered" subtitle="What do you provide to your artists?" icon={<LinkIcon className="w-6 h-6"/>} />
                        <ToggleSwitch label="Show on Profile" checked={sectionVisibility.services} onChange={() => handleSectionToggle('services')} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {availableServices.map(service => (
                            <label key={service} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${servicesOffered.includes(service) ? 'bg-orange-500/10 border-orange-500' : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'}`}>
                                <input type="checkbox" className="sr-only" checked={servicesOffered.includes(service)} onChange={() => handleServiceToggle(service)} />
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${servicesOffered.includes(service) ? 'bg-orange-500 border-orange-500' : 'border-zinc-500'}`}>
                                    {servicesOffered.includes(service) && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <span className="text-sm text-zinc-200">{service}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* 5. Partnerships */}
                <div className="cardSurface p-8">
                    <div className="flex justify-between">
                        <SectionHeader title="Partnerships & Affiliations" subtitle="Brands or networks you work with." icon={<LinkIcon className="w-6 h-6"/>} />
                        <ToggleSwitch label="Show on Profile" checked={sectionVisibility.partnerships} onChange={() => handleSectionToggle('partnerships')} />
                    </div>
                    <TagInput label="Partners (Text)" tags={affiliations} onChange={setAffiliations} placeholder="e.g. Spotify, Live Nation" />
                </div>

                 {/* 6. Opportunities */}
                 <div className="cardSurface p-8">
                    <div className="flex justify-between">
                        <SectionHeader title="Opportunities & Access" subtitle="How can people engage with your label?" icon={<MapIcon className="w-6 h-6"/>} />
                        <ToggleSwitch label="Show on Profile" checked={sectionVisibility.opportunities} onChange={() => handleSectionToggle('opportunities')} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ToggleSwitch label="Accepting Demos" checked={opportunities.accepting_demos} onChange={(v) => setOpportunities({...opportunities, accepting_demos: v})} />
                        <ToggleSwitch label="Hiring Producers" checked={opportunities.hiring_producers} onChange={(v) => setOpportunities({...opportunities, hiring_producers: v})} />
                        <ToggleSwitch label="Hiring Engineers" checked={opportunities.hiring_engineers} onChange={(v) => setOpportunities({...opportunities, hiring_engineers: v})} />
                        <ToggleSwitch label="Scouting Artists" checked={opportunities.scouting} onChange={(v) => setOpportunities({...opportunities, scouting: v})} />
                    </div>
                </div>

                {/* 7. Roster Metadata */}
                <div className="cardSurface p-8">
                    <div className="flex justify-between">
                        <SectionHeader title="Roster Showcase" subtitle="Select which artists to feature publicly." icon={<UsersIcon className="w-6 h-6"/>} />
                        <ToggleSwitch label="Show on Profile" checked={sectionVisibility.roster} onChange={() => handleSectionToggle('roster')} />
                    </div>
                    
                    {roster.length === 0 ? (
                        <p className="text-zinc-500 italic">No artists in roster. Add artists from the Dashboard to configure display.</p>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {roster.map(artist => {
                                const settings = rosterSettings[artist.id] || { display: true, status: 'Established', highlight_metric: '' };
                                return (
                                    <div key={artist.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center">
                                        <div className="flex items-center gap-3 flex-grow w-full md:w-auto">
                                            <input 
                                                type="checkbox" 
                                                checked={settings.display} 
                                                onChange={(e) => handleRosterChange(artist.id, 'display', e.target.checked)} 
                                                className="w-5 h-5 rounded border-zinc-600 text-orange-500 bg-zinc-800 focus:ring-orange-500"
                                            />
                                            <img src={artist.image_url} className="w-10 h-10 rounded-full object-cover" alt={artist.name} />
                                            <span className="font-bold text-zinc-200">{artist.name}</span>
                                        </div>
                                        
                                        <div className="flex gap-2 w-full md:w-auto">
                                            <select 
                                                value={settings.status} 
                                                onChange={(e) => handleRosterChange(artist.id, 'status', e.target.value)}
                                                className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg p-2 focus:ring-orange-500 outline-none"
                                            >
                                                <option value="Developing">Developing</option>
                                                <option value="Breakout">Breakout</option>
                                                <option value="Established">Established</option>
                                            </select>
                                            <input 
                                                type="text" 
                                                placeholder="Highlight (e.g. '1M+ Streams')" 
                                                value={settings.highlight_metric} 
                                                onChange={(e) => handleRosterChange(artist.id, 'highlight', e.target.value)}
                                                className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg p-2 focus:ring-orange-500 outline-none flex-grow"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Save Button */}
                <div className="sticky bottom-4 flex justify-end">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-xl shadow-orange-500/20 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Saving Profile...' : (
                            <>
                                <CheckCircleIcon className="w-6 h-6" />
                                Save Public Profile
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default LabelSettings;
