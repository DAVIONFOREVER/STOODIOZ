import React, { useState, useEffect } from 'react';
import type { Artist, Engineer, Stoodio, Producer, LinkAttachment } from '../types';
import { PhotoIcon, LinkIcon, PaperAirplaneIcon, CloseCircleIcon } from './icons';
import { fetchLinkMetadata } from '../services/geminiService';

interface CreatePostProps {
    currentUser: Artist | Engineer | Stoodio | Producer;
    onPost: (postData: { text: string; imageUrl?: string; link?: LinkAttachment }) => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ currentUser, onPost }) => {
    const [text, setText] = useState('');
    const [isLinkLoading, setIsLinkLoading] = useState(false);
    const [linkAttachment, setLinkAttachment] = useState<LinkAttachment | null>(null);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setText(newText);
    };
    
    // Auto-detect URL
    useEffect(() => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = text.match(urlRegex);
        if (urls && urls[0] && !linkAttachment) {
            const url = urls[0];
            setIsLinkLoading(true);
            fetchLinkMetadata(url).then(metadata => {
                if (metadata) {
                    setLinkAttachment(metadata);
                }
            }).finally(() => setIsLinkLoading(false));
        }
    }, [text, linkAttachment]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim() || linkAttachment) {
            onPost({ text: text.trim(), link: linkAttachment || undefined });
            setText('');
            setLinkAttachment(null);
        }
    };

    const handleAddPhoto = () => {
        // Mock photo addition
        alert("Photo upload feature coming soon!");
    };
    
    const handleAddLink = () => {
        const url = prompt("Enter a URL to attach:");
        if (url) {
             setIsLinkLoading(true);
             fetchLinkMetadata(url).then(metadata => {
                if (metadata) {
                    setLinkAttachment(metadata);
                }
             }).finally(() => setIsLinkLoading(false));
        }
    }

    return (
        <div className="bg-black/50 backdrop-blur-md rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.1)] border border-orange-500/20 p-6">
            <form onSubmit={handleSubmit}>
                <div className="flex items-start gap-4">
                    <img src={currentUser.imageUrl} alt={currentUser.name} className="w-12 h-12 rounded-xl object-cover" />
                    <textarea
                        value={text}
                        onChange={handleTextChange}
                        placeholder={`What's on your mind, ${currentUser.name.split(' ')[0]}?`}
                        className="w-full bg-transparent text-slate-200 placeholder-slate-500 border-none focus:ring-0 resize-none text-lg"
                        rows={3}
                    />
                </div>
                
                {linkAttachment && (
                    <div className="mt-4 ml-16 relative border border-zinc-700 rounded-lg overflow-hidden">
                        {linkAttachment.imageUrl && <img src={linkAttachment.imageUrl} alt="Link preview" className="w-full h-32 object-cover"/>}
                        <div className="p-3 bg-zinc-800">
                             <p className="text-sm font-semibold text-slate-200">{linkAttachment.title}</p>
                             <p className="text-xs text-slate-400">{linkAttachment.description}</p>
                        </div>
                        <button type="button" onClick={() => setLinkAttachment(null)} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white">
                            <CloseCircleIcon className="w-5 h-5"/>
                        </button>
                    </div>
                )}
                {isLinkLoading && <div className="mt-4 ml-16 text-slate-400 text-sm">Fetching link preview...</div>}

                <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={handleAddPhoto} className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-full transition-colors" title="Add Photo">
                            <PhotoIcon className="w-6 h-6" />
                        </button>
                         <button type="button" onClick={handleAddLink} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-colors" title="Add Link">
                            <LinkIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={!text.trim() && !linkAttachment}
                        className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-all disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <PaperAirplaneIcon className="w-5 h-5"/>
                        Post
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePost;
