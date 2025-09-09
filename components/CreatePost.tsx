
import React, { useState } from 'react';
import type { Artist, Engineer, Stoodio, LinkAttachment } from '../types';
import { PhotoIcon, LinkIcon, CloseCircleIcon, VideoCameraIcon } from './icons';

interface CreatePostProps {
    currentUser: Artist | Engineer | Stoodio;
    onPost: (postData: { text: string; imageUrl?: string; videoUrl?: string; videoThumbnailUrl?: string; link?: LinkAttachment }) => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ currentUser, onPost }) => {
    const [text, setText] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [videoThumbnailUrl, setVideoThumbnailUrl] = useState<string | null>(null);
    const [link, setLink] = useState<LinkAttachment | null>(null);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [linkTitle, setLinkTitle] = useState('');
    const [linkUrl, setLinkUrl] = useState('');

    const clearAttachments = () => {
        setImageUrl(null);
        setVideoUrl(null);
        setVideoThumbnailUrl(null);
        setLink(null);
        setIsLinkModalOpen(false);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim() || imageUrl || link || videoUrl) {
            onPost({ 
                text: text.trim(), 
                imageUrl: imageUrl || undefined, 
                videoUrl: videoUrl || undefined,
                videoThumbnailUrl: videoThumbnailUrl || undefined,
                link: link || undefined 
            });
            setText('');
            clearAttachments();
        }
    };

    const handleAddPhoto = () => {
        clearAttachments();
        setImageUrl(`https://picsum.photos/seed/post-${Date.now()}/800/600`);
    };

    const handleAddVideo = () => {
        clearAttachments();
        setVideoUrl('https://storage.googleapis.com/studiogena-assets/waves_video.mp4');
        setVideoThumbnailUrl(`https://picsum.photos/seed/video-thumb-${Date.now()}/800/450`);
    };

    const handleAddLink = (e: React.FormEvent) => {
        e.preventDefault();
        if (linkTitle.trim() && linkUrl.trim()) {
            clearAttachments();
            setLink({ title: linkTitle, url: linkUrl });
            setLinkTitle('');
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
                            placeholder="Share an update with your followers..."
                            className="w-full bg-zinc-700 border-zinc-600 text-slate-200 placeholder:text-slate-400 rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500"
                            rows={3}
                        />

                        {/* Previews */}
                        {imageUrl && (
                            <div className="relative mt-2">
                                <img src={imageUrl} alt="Preview" className="rounded-lg max-h-40 w-auto" />
                                <button type="button" onClick={() => setImageUrl(null)} className="absolute top-1 right-1 bg-black/50 rounded-full text-white">
                                    <CloseCircleIcon className="w-6 h-6" />
                                </button>
                            </div>
                        )}
                        {videoUrl && (
                            <div className="relative mt-2">
                                <video src={videoUrl} poster={videoThumbnailUrl || ''} controls className="rounded-lg w-full" />
                                <button type="button" onClick={() => { setVideoUrl(null); setVideoThumbnailUrl(null); }} className="absolute top-1 right-1 bg-black/50 rounded-full text-white">
                                    <CloseCircleIcon className="w-6 h-6" />
                                </button>
                            </div>
                        )}
                        {link && (
                             <div className="relative mt-2 p-3 bg-zinc-700 rounded-lg border border-zinc-600">
                                <p className="font-semibold text-sm text-slate-100">{link.title}</p>
                                <p className="text-xs text-slate-400 truncate">{link.url}</p>
                                 <button type="button" onClick={() => setLink(null)} className="absolute top-1 right-1 bg-black/50 rounded-full text-white">
                                    <CloseCircleIcon className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-3">
                            <div className="flex items-center gap-1 sm:gap-2">
                                <button type="button" onClick={handleAddPhoto} className="flex items-center gap-1.5 text-slate-400 hover:text-orange-400 p-2 rounded-lg transition-colors">
                                    <PhotoIcon className="w-5 h-5" />
                                    <span className="hidden sm:inline text-sm font-semibold">Photo</span>
                                </button>
                                 <button type="button" onClick={handleAddVideo} className="flex items-center gap-1.5 text-slate-400 hover:text-orange-400 p-2 rounded-lg transition-colors">
                                    <VideoCameraIcon className="w-5 h-5" />
                                    <span className="hidden sm:inline text-sm font-semibold">Video</span>
                                </button>
                                 <button type="button" onClick={() => setIsLinkModalOpen(!isLinkModalOpen)} className="flex items-center gap-1.5 text-slate-400 hover:text-orange-400 p-2 rounded-lg transition-colors">
                                    <LinkIcon className="w-5 h-5" />
                                    <span className="hidden sm:inline text-sm font-semibold">Link</span>
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={!text.trim() && !imageUrl && !link && !videoUrl}
                                className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 disabled:bg-slate-600 disabled:cursor-not-allowed"
                            >
                                Post
                            </button>
                        </div>
                    </form>
                    {/* Link Modal */}
                    {isLinkModalOpen && (
                         <form onSubmit={handleAddLink} className="mt-3 pt-3 border-t border-zinc-600">
                            <input type="text" value={linkTitle} onChange={e => setLinkTitle(e.target.value)} placeholder="Link Title" className="w-full text-sm p-2 rounded bg-zinc-700 border-zinc-600 text-slate-200 mb-2 focus:ring-orange-500 focus:border-orange-500"/>
                            <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://example.com" className="w-full text-sm p-2 rounded bg-zinc-700 border-zinc-600 text-slate-200 mb-2 focus:ring-orange-500 focus:border-orange-500"/>
                            <div className="flex justify-end gap-2">
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