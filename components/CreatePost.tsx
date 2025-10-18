

import React, { useState } from 'react';
import type { Artist, Engineer, Stoodio, LinkAttachment, Producer } from '../types';
import { LinkIcon, CloseCircleIcon } from './icons';
import { fetchLinkMetadata } from '../services/geminiService';

interface CreatePostProps {
    currentUser: Artist | Engineer | Stoodio | Producer;
    onPost: (postData: { text: string; imageUrl?: string; videoUrl?: string; videoThumbnailUrl?: string; link?: LinkAttachment }) => Promise<void>;
}

const CreatePost: React.FC<CreatePostProps> = ({ currentUser, onPost }) => {
    const [text, setText] = useState('');
    const [link, setLink] = useState<LinkAttachment | null>(null);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [isFetchingPreview, setIsFetchingPreview] = useState(false);
    const [linkPreview, setLinkPreview] = useState<LinkAttachment | null>(null);
    const [isPosting, setIsPosting] = useState(false);

    const clearAttachments = () => {
        setLink(null);
        setLinkPreview(null);
        setLinkUrl('');
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((text.trim() || link) && !isPosting) {
            setIsPosting(true);
            await onPost({ 
                text: text.trim(), 
                link: link || undefined 
            });
            setText('');
            clearAttachments();
            setIsPosting(false);
        }
    };

    const handleFetchPreview = async () => {
        if (linkUrl.trim()) {
            setIsFetchingPreview(true);
            const metadata = await fetchLinkMetadata(linkUrl);
            setLinkPreview(metadata);
            setIsFetchingPreview(false);
        }
    };
    
    const handleAddLink = (e: React.FormEvent) => {
        e.preventDefault();
        if (linkPreview) {
            setLink(linkPreview);
            setIsLinkModalOpen(false);
            setLinkPreview(null);
            setLinkUrl('');
        } else if (linkUrl) {
            // If fetching fails or there's no preview, add the raw URL
            setLink({ url: linkUrl, title: linkUrl });
            setIsLinkModalOpen(false);
            setLinkUrl('');
        }
    };

    return (
        <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
            <div className="flex items-start gap-4">
                <img src={currentUser.imageUrl} alt={currentUser.name} className="w-12 h-12 rounded-xl object-cover" />
                <div className="w-full">
                    <form onSubmit={handleSubmit}>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Share an update, a new track, or a session video..."
                            className="w-full bg-zinc-700 border-zinc-600 text-slate-200 placeholder:text-slate-400 rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500"
                            rows={3}
                        />

                        {link && (
                             <div className="relative mt-2 p-3 bg-zinc-700 rounded-lg border border-zinc-600">
                                {link.imageUrl && <img src={link.imageUrl} alt="Link preview" className="rounded-md w-full h-32 object-cover mb-2" />}
                                <p className="font-semibold text-sm text-slate-100">{link.title}</p>
                                <p className="text-xs text-slate-400 truncate">{link.url}</p>
                                 <button type="button" onClick={() => setLink(null)} className="absolute top-1 right-1 bg-black/50 rounded-full text-white">
                                    <CloseCircleIcon className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-3">
                            <div className="flex items-center gap-1 sm:gap-2">
                                <button type="button" onClick={() => setIsLinkModalOpen(!isLinkModalOpen)} className="flex items-center gap-1.5 text-slate-400 hover:text-orange-400 p-2 rounded-lg transition-colors">
                                    <LinkIcon className="w-5 h-5" />
                                    <span className="text-sm font-semibold">Add Link</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="text-xs text-zinc-500 hidden sm:block">Posts are subject to Community Guidelines.</p>
                                <button
                                    type="submit"
                                    disabled={(!text.trim() && !link) || isPosting}
                                    className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 disabled:bg-zinc-600 disabled:cursor-not-allowed"
                                >
                                    {isPosting ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </div>
                    </form>
                    {/* Link Modal */}
                    {isLinkModalOpen && (
                         <form onSubmit={handleAddLink} className="mt-3 pt-3 border-t border-zinc-600">
                            <div className="flex gap-2">
                                <input 
                                    type="url" 
                                    value={linkUrl} 
                                    onChange={e => { setLinkUrl(e.target.value); setLinkPreview(null); }} 
                                    placeholder="https://youtube.com/watch?v=..." 
                                    className="w-full text-sm p-2 rounded bg-zinc-700 border-zinc-600 text-slate-200 focus:ring-orange-500 focus:border-orange-500"
                                />
                                <button type="button" onClick={handleFetchPreview} className="px-3 py-1 text-xs rounded bg-zinc-600 hover:bg-zinc-500 text-slate-200">Preview</button>
                            </div>

                            {isFetchingPreview && <p className="text-xs text-zinc-400 mt-2 text-center">Fetching preview...</p>}

                            {linkPreview && (
                                <div className="mt-2 p-2 bg-zinc-700/50 rounded-lg border border-zinc-600">
                                    {linkPreview.imageUrl && <img src={linkPreview.imageUrl} alt="Link preview" className="rounded-md w-full h-24 object-cover mb-2" />}
                                    <p className="font-semibold text-xs text-slate-100">{linkPreview.title}</p>
                                    <p className="text-xs text-slate-400 truncate">{linkPreview.description}</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 mt-3">
                                <button type="button" onClick={() => setIsLinkModalOpen(false)} className="px-3 py-1 text-xs rounded bg-zinc-600 hover:bg-zinc-500 text-slate-200">Cancel</button>
                                <button type="submit" className="px-3 py-1 text-xs rounded bg-orange-500 hover:bg-orange-600 text-white">Add Link</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreatePost;