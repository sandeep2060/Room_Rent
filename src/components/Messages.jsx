import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, User as UserIcon } from 'lucide-react';

export default function Messages() {
    const { profile } = useAuth();
    const [threads, setThreads] = useState([]);
    const [activeThread, setActiveThread] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Initial load: fetch all bookings where the user is either seeker or provider
    useEffect(() => {
        if (profile?.id) fetchThreads();
    }, [profile]);

    // When an active thread is selected, fetch messages and subscribe
    useEffect(() => {
        if (activeThread) {
            fetchMessages(activeThread.id);
            const subscription = subscribeToMessages(activeThread.id);
            return () => { supabase.removeChannel(subscription); }
        }
    }, [activeThread]);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const maskPersonalData = (text) => {
        if (!text) return text;

        let masked = text;
        // Regex to catch most email formats: ***@***.***
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
        masked = masked.replace(emailRegex, '[HIDDEN_EMAIL]');

        // Regex to catch phone numbers (10 digits or more, including spaces/dashes)
        // Adjust strictness as needed. This catches patterns like +977 9841234567, 9841-234-567, etc.
        const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        masked = masked.replace(phoneRegex, '[HIDDEN_PHONE]');

        return masked;
    };

    async function fetchThreads() {
        try {
            setLoading(true);
            const isProvider = profile?.role === 'provider';
            const idCol = isProvider ? 'provider_id' : 'seeker_id';

            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    id, start_date, status,
                    rooms ( title ),
                    seeker:profiles!bookings_seeker_id_fkey ( id, name ),
                    provider:profiles!bookings_provider_id_fkey ( id, name )
                `)
                .eq(idCol, profile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setThreads(data || []);
            if (data && data.length > 0) {
                setActiveThread(data[0]);
            }
        } catch (error) {
            console.error('Error fetching threads:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchMessages(bookingId) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('booking_id', bookingId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);

            // Mark unread messages directed to me as read
            const unreadIds = (data || [])
                .filter(msg => msg.receiver_id === profile.id && !msg.is_read)
                .map(msg => msg.id);

            if (unreadIds.length > 0) {
                await supabase
                    .from('messages')
                    .update({ is_read: true })
                    .in('id', unreadIds);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }

    function subscribeToMessages(bookingId) {
        return supabase
            .channel(`public:messages:booking_id=eq.${bookingId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${bookingId}` },
                (payload) => {
                    const newMsg = payload.new;
                    setMessages((current) => [...current, newMsg]);

                    // If we receive a message in the active thread while viewing it, mark it as read immediately
                    if (newMsg.receiver_id === profile.id && !newMsg.is_read) {
                        supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id).then();
                    }
                }
            )
            .subscribe();
    }

    async function sendMessage(e) {
        e.preventDefault();
        if (!newMessage.trim() || !activeThread) return;

        // Apply Regex filter before sending to database
        const safeContent = maskPersonalData(newMessage);

        const isProvider = profile.role === 'provider';
        const receiverId = isProvider ? activeThread.seeker.id : activeThread.provider.id;

        try {
            const { error } = await supabase.from('messages').insert([{
                booking_id: activeThread.id,
                sender_id: profile.id,
                receiver_id: receiverId,
                content: safeContent // Sending the sanitized text
            }]);

            if (error) throw error;
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    // Determine the name of the "other" person in the thread for display
    const getOtherParticipantName = (thread) => {
        if (!thread) return '';
        const isProvider = profile?.role === 'provider';
        const rawName = isProvider ? (thread.seeker?.name || 'Seeker') : (thread.provider?.name || 'Provider');

        // Return First Name and Initial for privacy
        const parts = rawName.split(' ');
        if (parts.length > 1) {
            return `${parts[0]} ${parts[1].charAt(0)}.`;
        }
        return rawName;
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading messages...</div>;

    if (threads.length === 0) {
        return (
            <div className="dashboard-card" style={{ textAlign: 'center', padding: '4rem', marginTop: '2rem' }}>
                <p style={{ color: 'var(--dash-text-muted)' }}>You don't have any active booking threads yet.</p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Messages will appear here once a booking is requested.</p>
            </div>
        );
    }

    return (
        <div className="dashboard-card" style={{ display: 'flex', height: '600px', padding: 0, overflow: 'hidden' }}>
            {/* Sidebar List of Threads */}
            <div style={{ width: '30%', borderRight: '1px solid var(--dash-border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--dash-border)', background: 'var(--dash-surface)' }}>
                    <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Conversations</h2>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {threads.map(thread => (
                        <div
                            key={thread.id}
                            onClick={() => setActiveThread(thread)}
                            style={{
                                padding: '1rem',
                                borderBottom: '1px solid var(--dash-border)',
                                cursor: 'pointer',
                                background: activeThread?.id === thread.id ? 'var(--dash-bg)' : 'transparent',
                                borderLeft: activeThread?.id === thread.id ? '4px solid var(--accent)' : '4px solid transparent'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--dash-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <UserIcon size={20} color="var(--dash-text-muted)" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '0.95rem', margin: '0 0 0.25rem' }}>{getOtherParticipantName(thread)}</h3>
                                    <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--dash-text-muted)' }}>{thread.rooms?.title}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Active Thread Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--dash-bg)' }}>
                {activeThread ? (
                    <>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--dash-border)', background: 'var(--dash-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>{getOtherParticipantName(activeThread)}</h3>
                                <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0', color: 'var(--dash-text-muted)' }}>Inquiry for: {activeThread.rooms?.title}</p>
                            </div>
                            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                {activeThread.status}
                            </span>
                        </div>

                        {/* Messages List */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                            <div style={{ alignSelf: 'center', padding: '0.5rem 1rem', background: 'var(--dash-border)', color: 'var(--dash-text-muted)', fontSize: '0.8rem', borderRadius: '4px', textAlign: 'center', maxWidth: '80%' }}>
                                This chat is secured. For your safety, do not share phone numbers or email addresses. Do not wire money outside the platform.
                            </div>

                            {messages.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--dash-text-muted)', marginTop: '2rem' }}>No messages yet. Say hello!</p>
                            ) : (
                                messages.map(msg => {
                                    const isMe = msg.sender_id === profile.id;
                                    return (
                                        <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                                            <div style={{
                                                background: isMe ? 'var(--accent)' : 'var(--dash-surface)',
                                                color: isMe ? 'white' : 'var(--dash-text)',
                                                padding: '0.75rem 1rem',
                                                borderRadius: '8px',
                                                borderBottomRightRadius: isMe ? '0' : '8px',
                                                borderBottomLeftRadius: !isMe ? '0' : '8px'
                                            }}>
                                                {/* Filter again on display just in case */}
                                                {maskPersonalData(msg.content)}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--dash-text-muted)', marginTop: '0.25rem', textAlign: isMe ? 'right' : 'left' }}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={sendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--dash-border)', background: 'var(--dash-surface)', display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                style={{ flex: 1, padding: '0.75rem 1rem', border: '1px solid var(--dash-border)', borderRadius: '4px', background: 'var(--dash-bg)', color: 'var(--dash-text)' }}
                            />
                            <button type="submit" disabled={!newMessage.trim()} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '0 1.25rem', borderRadius: '4px', cursor: newMessage.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: newMessage.trim() ? 1 : 0.5 }}>
                                <Send size={18} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dash-text-muted)' }}>
                        Select a conversation to start messaging
                    </div>
                )}
            </div>
        </div>
    );
}
