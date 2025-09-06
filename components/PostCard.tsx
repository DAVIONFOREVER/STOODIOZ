import React, { useState } from 'react';
import type { Post, Artist, Engineer, Stoodio, Comment } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { HeartIcon, ChatBubbleIcon, ShareIcon, PaperAirplaneIcon } from './icons';

interface PostCardProps {
    post: Post;
    author: Artist | Engineer | Stoodio;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    currentUser: Artist | Engineer | Stoodio | null;
}

const PostCard: React.FC<PostCardProps> = ({ post, author, onLikePost, onCommentOnPost, currentUser }) => {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');

    if (!currentUser) return null;

    const isLiked = post.likes.includes(currentUser.id);

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (commentText.trim()) {
            onCommentOnPost(post.id, commentText.trim());
            setCommentText('');
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
            <div className="p-6">
                {/* Post Header */}
                <div className="flex items-center gap-4 mb-4">
                    <img src={author.imageUrl} alt={author.name} className="w-12 h-12 rounded-xl object-cover" />
                    <div>
                        <p className="font-bold text-slate-900">{author.name}</p>
                        <p className="text-sm text-slate-500">{formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}</p>
                    </div>
                </div>

                {/* Post Content */}
                {post.text && <p className="text-slate-700 whitespace-pre-wrap mb-4">{post.text}</p>}
                {post.imageUrl && (
                    <img src={post.imageUrl} alt="Post image" className="rounded-xl w-full h-auto max-h-96 object-cover my-4" />
                )}
                 {post.videoUrl && (
                    <div className="my-4 rounded-xl overflow-hidden w-full aspect-video bg-black">
                        <video
                            src={post.videoUrl}
                            poster={post.videoThumbnailUrl}
                            controls
                            muted
                            autoPlay
                            loop
                            playsInline
                            className="w-full h-full object-contain"
                        />
                    </div>
                )}
                {post.link && (
                    <a href={post.link.url} target="_blank" rel="noopener noreferrer" className="block my-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors">
                        <p className="font-semibold text-slate-800">{post.link.title}</p>
                        <p className="text-sm text-slate-500 truncate">{post.link.url}</p>
                    </a>
                )}
            </div>

            {/* Post Actions */}
            <div className="border-t border-slate-200 mx-6 py-2 flex justify-around items-center text-slate-500">
                <button 
                    onClick={() => onLikePost(post.id)}
                    className={`flex items-center gap-2 font-semibold transition-colors p-2 rounded-lg ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
                >
                    <HeartIcon className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span>Like ({post.likes.length})</span>
                </button>
                <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 font-semibold hover:text-orange-500 transition-colors p-2 rounded-lg">
                    <ChatBubbleIcon className="w-5 h-5" />
                    <span>Comment ({post.comments.length})</span>
                </button>
                <button className="flex items-center gap-2 font-semibold hover:text-blue-500 transition-colors p-2 rounded-lg">
                    <ShareIcon className="w-5 h-5" />
                    <span>Share</span>
                </button>
            </div>
            
            {/* Comments Section */}
            {showComments && (
                <div className="border-t border-slate-200 p-6 space-y-4 bg-slate-50/50 rounded-b-2xl">
                    {post.comments.length > 0 ? (
                        post.comments.map(comment => (
                            <div key={comment.id} className="flex items-start gap-3">
                                <img src={comment.authorImageUrl} alt={comment.authorName} className="w-8 h-8 rounded-lg object-cover mt-1"/>
                                <div>
                                    <div className="bg-slate-100 rounded-xl p-3">
                                        <p className="font-semibold text-sm text-slate-800">{comment.authorName}</p>
                                        <p className="text-sm text-slate-600">{comment.text}</p>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 pl-1">{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-center text-slate-500">No comments yet.</p>
                    )}
                     {/* Comment Form */}
                    <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 pt-4">
                        <img src={currentUser.imageUrl} alt="Your profile" className="w-8 h-8 rounded-lg object-cover"/>
                         <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            className="w-full bg-slate-100 border-slate-300 text-slate-800 placeholder:text-slate-400 rounded-full py-2 px-4 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        />
                        <button type="submit" disabled={!commentText.trim()} className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors flex-shrink-0 disabled:bg-slate-400">
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default PostCard;