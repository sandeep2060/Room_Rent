import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, User as UserIcon, Search, ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OwnerMessages() {
    const { profile } = useAuth();
    const [threads, setThreads] = useState([]);
    const [activeThread, setActiveThread] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchThreads();
        const subscription = subscribeToAllMessages();
        return () => { supabase.removeChannel(subscription); }
    }, []);

    useEffect(() => {
        if (activeThread) {
            fetchMessages(activeThread.user_id);
        }
    }, [activeThread]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function fetchThreads() {
        try {
            setLoading(true);
            // Fetch all messages involving an 'owner' or where receiver_id is the owner
            // Better: Fetch all users who have sent a message to the owner (receiver_id = my_id) 
            // OR where owner is the sender.

            // For the owner dashboard, we want to see a list of users who have messaged us
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    id, 
                    sender_id, 
                    receiver_id, 
                    content, 
                    created_at, 
                    is_read,
                    sender:profiles!messages_sender_id_fkey(id, name, avatar_url, role),
                    receiver:profiles!messages_receiver_id_fkey(id, name, avatar_url, role)
                `)
                .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Group by the "other" user
            const grouped = data.reduce((acc, msg) => {
                const other = msg.sender_id === profile.id ? msg.receiver : msg.sender;
                if (!other || other.id === profile.id) return acc;

                if (!acc[other.id]) {
                    acc[other.id] = {
                        user: other,
                        lastMessage: msg.content,
                        timestamp: msg.created_at,
                        unreadCount: (!msg.is_read && msg.receiver_id === profile.id) ? 1 : 0
                    };
                } else if (!msg.is_read && msg.receiver_id === profile.id) {
                    acc[other.id].unreadCount += 1;
                }
                return acc;
            }, {});

            setThreads(Object.values(grouped));
        } catch (error) {
            console.error('Error fetching threads:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchMessages(userId) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${profile.id})`)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);

            // Mark as read
            const unreadIds = data.filter(m => m.receiver_id === profile.id && !m.is_read).map(m => m.id);
            if (unreadIds.length > 0) {
                await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }

    function subscribeToAllMessages() {
        return supabase
            .channel('owner-messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                const newMsg = payload.new;
                if (newMsg.receiver_id === profile.id || newMsg.sender_id === profile.id) {
                    // Update threads list
                    fetchThreads();
                    // If it's for the active thread, add to messages
                    if (activeThread && (newMsg.sender_id === activeThread.user.id || newMsg.receiver_id === activeThread.user.id)) {
                        setMessages(curr => [...curr, newMsg]);
                    }
                }
            })
            .subscribe();
    }

    async function sendMessage(e) {
        e.preventDefault();
        if (!newMessage.trim() || !activeThread) return;

        const content = newMessage;
        const targetUserId = activeThread.user.id;

        try {
            const { error } = await supabase.from('messages').insert([{
                sender_id: profile.id,
                receiver_id: targetUserId,
                content: content
            }]);

            if (error) throw error;
            setNewMessage('');

            // Apply simple bot logic if needed (though owner is responding here)
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    const filteredThreads = threads.filter(t =>
        t.user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && threads.length === 0) return <div style={{ padding: '2rem' }}>Loading conversations...</div>;

    return (
        <div className="owner-messages dashboard-card" style={{ height: 'calc(100vh - 200px)', padding: 0, display: 'flex', overflow: 'hidden' }}>
            {/* Sidebar */}
            <div style={{ width: '350px', borderRight: '1px solid var(--dash-border)', display: 'flex', flexDirection: 'column', background: 'var(--dash-surface)' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--dash-border)' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>User Inquiries</h2>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--dash-text-muted)' }} size={16} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.5rem', width: '100%', fontSize: '0.85rem', background: 'var(--dash-bg)' }}
                        />
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {filteredThreads.length === 0 ? (
                        <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--dash-text-muted)', fontSize: '0.9rem' }}>No conversations found.</p>
                    ) : (
                        filteredThreads.map(thread => (
                            <div
                                key={thread.user.id}
                                onClick={() => setActiveThread(thread)}
                                style={{
                                    padding: '1rem 1.5rem',
                                    borderBottom: '1px solid var(--dash-border)',
                                    cursor: 'pointer',
                                    background: activeThread?.user.id === thread.user.id ? 'var(--dash-bg)' : 'transparent',
                                    borderLeft: activeThread?.user.id === thread.user.id ? '4px solid var(--accent)' : '4px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--dash-border)', overflow: 'hidden' }}>
                                            {thread.user.avatar_url ? <img src={thread.user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserIcon size={20} style={{ margin: '12px' }} />}
                                        </div>
                                        {thread.unreadCount > 0 && (
                                            <span style={{ position: 'absolute', top: -2, right: -2, background: 'var(--accent)', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                                                {thread.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                            <h4 style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{thread.user.name}</h4>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--dash-text-muted)' }}>{new Date(thread.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--dash-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {thread.lastMessage}
                                        </p>
                                        <span className={`badge ${thread.user.role === 'provider' ? 'badge-accent' : 'badge-primary'}`} style={{ fontSize: '0.6rem', padding: '1px 4px', marginTop: '4px' }}>
                                            {thread.user.role}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--dash-bg)' }}>
                {activeThread ? (
                    <>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--dash-border)', background: 'var(--dash-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--dash-border)', overflow: 'hidden' }}>
                                    {activeThread.user.avatar_url ? <img src={activeThread.user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserIcon size={18} style={{ margin: '11px' }} />}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{activeThread.user.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--dash-text-muted)', textTransform: 'capitalize' }}>{activeThread.user.role}</span>
                                        <Link to={`/dashboard-owner/users/${activeThread.user.id}`} style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                            View Profile <ExternalLink size={10} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {messages.map(msg => {
                                const isMe = msg.sender_id === profile.id;
                                return (
                                    <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                                        <div style={{
                                            padding: '0.75rem 1rem',
                                            borderRadius: '12px',
                                            background: isMe ? 'var(--accent)' : 'var(--dash-surface)',
                                            color: isMe ? 'white' : 'var(--dash-text)',
                                            borderBottomRightRadius: isMe ? 0 : '12px',
                                            borderBottomLeftRadius: isMe ? '12px' : 0,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                            fontSize: '0.9rem'
                                        }}>
                                            {msg.content}
                                        </div>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.65rem', color: 'var(--dash-text-muted)', textAlign: isMe ? 'right' : 'left' }}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={sendMessage} style={{ padding: '1rem 1.5rem', background: 'var(--dash-surface)', borderTop: '1px solid var(--dash-border)', display: 'flex', gap: '1rem' }}>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={`Reply to ${activeThread.user.name}...`}
                                style={{ flex: 1, background: 'var(--dash-bg)', padding: '0.75rem 1rem' }}
                            />
                            <button type="submit" disabled={!newMessage.trim()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Send size={18} /> Send
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--dash-text-muted)' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <Search size={32} />
                        </div>
                        <h3>Select a conversation</h3>
                        <p>Choose a user from the left to view their inquiry.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
