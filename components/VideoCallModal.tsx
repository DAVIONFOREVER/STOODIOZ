import React, { useEffect, useRef, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { CloseIcon, MicrophoneIcon, VideoCameraIcon } from './icons';

interface VideoCallModalProps {
    conversationId: string;
    currentUserId: string;
    peerId: string;
    isCaller: boolean;
    onClose: () => void;
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({ conversationId, currentUserId, peerId, isCaller, onClose }) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');

    useEffect(() => {
        const supabase = getSupabase();
        const channel = supabase.channel(`video_call:${conversationId}`);

        const setupPeer = async () => {
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            });
            peerRef.current = pc;

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    channel.send({
                        type: 'broadcast',
                        event: 'signal',
                        payload: { from: currentUserId, type: 'ice', candidate: event.candidate },
                    });
                }
            };

            pc.ontrack = (event) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
                setStatus('connected');
            };

            const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            localStreamRef.current = localStream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream;
            }
            localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

            if (isCaller) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                channel.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: { from: currentUserId, type: 'offer', sdp: offer },
                });
            }
        };

        channel
            .on('broadcast', { event: 'signal' }, async (payload) => {
                const from = payload?.payload?.from;
                if (!from || from === currentUserId || from !== peerId) return;
                const pc = peerRef.current;
                if (!pc) return;
                const data = payload.payload;
                if (data.type === 'offer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    channel.send({
                        type: 'broadcast',
                        event: 'signal',
                        payload: { from: currentUserId, type: 'answer', sdp: answer },
                    });
                } else if (data.type === 'answer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                    setStatus('connected');
                } else if (data.type === 'ice' && data.candidate) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                    } catch (e) {
                        console.warn('ICE candidate error', e);
                    }
                } else if (data.type === 'hangup') {
                    setStatus('ended');
                    onClose();
                }
            })
            .subscribe(async () => {
                try {
                    await setupPeer();
                } catch (e) {
                    console.error('Video call setup failed', e);
                    onClose();
                }
            });

        return () => {
            try {
                supabase.removeChannel(channel);
            } catch (e) {
                console.warn('[VideoCallModal] removeChannel failed:', e);
            }
            peerRef.current?.close();
            peerRef.current = null;
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        };
    }, [conversationId, currentUserId, isCaller, onClose, peerId]);

    const toggleMute = () => {
        const stream = localStreamRef.current;
        if (!stream) return;
        stream.getAudioTracks().forEach((track) => {
            track.enabled = !track.enabled;
            setIsMuted(!track.enabled);
        });
    };

    const toggleCamera = () => {
        const stream = localStreamRef.current;
        if (!stream) return;
        stream.getVideoTracks().forEach((track) => {
            track.enabled = !track.enabled;
            setIsCameraOff(!track.enabled);
        });
    };

    const hangUp = () => {
        const supabase = getSupabase();
        supabase.channel(`video_call:${conversationId}`).send({
            type: 'broadcast',
            event: 'signal',
            payload: { from: currentUserId, type: 'hangup' },
        });
        setStatus('ended');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-orange-400">Video Call</p>
                        <p className="text-sm text-zinc-400">
                            {status === 'connecting' ? 'Connecting...' : status === 'connected' ? 'Live' : 'Ended'}
                        </p>
                    </div>
                    <button onClick={hangUp} className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="aspect-video rounded-2xl overflow-hidden bg-black/80">
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    </div>
                    <div className="aspect-video rounded-2xl overflow-hidden bg-black/80">
                        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={toggleMute}
                        className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-2"
                    >
                        <MicrophoneIcon className="w-4 h-4" />
                        {isMuted ? 'Unmute' : 'Mute'}
                    </button>
                    <button
                        onClick={toggleCamera}
                        className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-2"
                    >
                        <VideoCameraIcon className="w-4 h-4" />
                        {isCameraOff ? 'Camera On' : 'Camera Off'}
                    </button>
                    <button
                        onClick={hangUp}
                        className="px-4 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600"
                    >
                        End Call
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoCallModal;
