import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, x, Send, User, ChevronDown, Bot } from 'lucide-react';

export default function AdminChatButton() {
    const { profile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [adminProfile, setAdminProfile] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (profile?.id) {
            fetchAdmin();
            fetchMessages();
            const sub = subscribeToMessages();
            return () => supabase.removeChannel(sub);
        }
    }, [profile]);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setUnreadCount(0);
            markAsRead();
        }
    }, [isOpen, messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    async function fetchAdmin() {
        const { data } = await supabase.from('profiles').select('id, name, avatar_url').eq('role', 'owner').single();
        if (data) setAdminProfile(data);
    }

    async function fetchMessages() {
        if (!profile?.id || !adminProfile?.id) return;
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${adminProfile.id}),and(sender_id.eq.${adminProfile.id},receiver_id.eq.${profile.id})`)
            .order('created_at', { ascending: true });

        if (data) {
            setMessages(data);
            const unread = data.filter(m => m.receiver_id === profile.id && !m.is_read).length;
            if (!isOpen) setUnreadCount(unread);
        }
    }

    function subscribeToMessages() {
        return supabase
            .channel(`admin-chat-${profile?.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                const newMsg = payload.new;
                if (newMsg.sender_id === adminProfile?.id || newMsg.sender_id === profile?.id) {
                    setMessages(curr => [...curr, newMsg]);
                    if (!isOpen && newMsg.receiver_id === profile?.id) {
                        setUnreadCount(prev => prev + 1);
                    }
                }
            })
            .subscribe();
    }

    async function markAsRead() {
        if (!profile?.id || !adminProfile?.id) return;
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('receiver_id', profile.id)
            .eq('sender_id', adminProfile.id)
            .eq('is_read', false);
    }

    async function handleSendMessage(e) {
        e.preventDefault();
        if (!newMessage.trim() || !adminProfile) return;

        const content = newMessage;
        setNewMessage('');

        try {
            const { error } = await supabase.from('messages').insert([{
                sender_id: profile.id,
                receiver_id: adminProfile.id,
                content: content
            }]);

            if (error) throw error;

            // Simple Bot Logic
            processBotReply(content);

        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    const processBotReply = (userMsg) => {
        const input = userMsg.toLowerCase();
        let reply = '';

        if (input.includes('hello') || input.includes('hi')) {
            reply = "Hello! I'm the RoomRent Assistant. How can I help you today?";
        } else if (input.includes('price') || input.includes('cost')) {
            reply = "Room prices vary by location and category. You can browse our listings to see the exact rates!";
        } else if (input.includes('commission') || input.includes('fee')) {
            reply = "We charge a small platform fee for every successful booking to keep the service running smoothly.";
        } else if (input.includes('contact') || input.includes('phone')) {
            reply = "For security reasons, we recommend keeping all communication within the platform.";
        } else if (input.includes('verify') || input.includes('security')) {
            reply = "Security is our priority! We use real-time location tracking and verified profiles to ensure safety.";
        }

        if (reply) {
            // Delay for "typing" effect
            setTimeout(async () => {
                await supabase.from('messages').insert([{
                    sender_id: adminProfile.id,
                    receiver_id: profile.id,
                    content: `[🤖 Bot]: ${reply}`
                }]);
            }, 1500);
        }
    };

    if (!profile || profile.role === 'owner') return null;

    return (
        <div className="admin-chat-wrapper" style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
            {/* Chat Window */}
            {isOpen && (
                <div className="admin-chat-window" style={{
                    width: '350px',
                    height: '500px',
                    background: 'var(--dash-surface)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(0,0,10,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: '1px solid var(--dash-border)',
                    marginBottom: '1rem'
                }}>
                    {/* Header */}
                    <div style={{ padding: '1rem', background: 'var(--accent)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Bot size={18} />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Support Chat</h4>
                                <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.8 }}>We usually reply instantly</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <ChevronDown size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--dash-text-muted)', background: 'rgba(15, 23, 42, 0.5)', padding: '4px 10px', borderRadius: '10px' }}>
                                Chat with RoomRent Support
                            </span>
                        </div>

                        {messages.length === 0 && (
                            <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--dash-text-muted)' }}>
                                <MessageSquare size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                                <p style={{ fontSize: '0.85rem' }}>How can we help you today?</p>
                            </div>
                        )}

                        {messages.map(msg => {
                            const isMe = msg.sender_id === profile.id;
                            const isBot = msg.content.startsWith('[🤖 Bot]:');
                            return (
                                <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                    <div style={{
                                        padding: '0.6rem 0.8rem',
                                        borderRadius: '12px',
                                        background: isMe ? 'var(--accent)' : 'var(--dash-bg)',
                                        color: isMe ? 'white' : 'var(--dash-text)',
                                        borderBottomRightRadius: isMe ? 0 : '12px',
                                        borderBottomLeftRadius: isMe ? '12px' : 0,
                                        fontSize: '0.85rem',
                                        border: isMe ? 'none' : '1px solid var(--dash-border)'
                                    }}>
                                        {isBot ? msg.content.replace('[🤖 Bot]: ', '') : msg.content}
                                    </div>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: 'var(--dash-text-muted)', textAlign: isMe ? 'right' : 'left' }}>
                                        {isBot ? 'Bot Assistant' : new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} style={{ padding: '0.75rem', borderTop: '1px solid var(--dash-border)', display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            style={{ flex: 1, background: 'var(--dash-bg)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}
                        />
                        <button type="submit" disabled={!newMessage.trim()} style={{ background: 'var(--accent)', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: newMessage.trim() ? 1 : 0.5 }}>
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '30px',
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'transform 0.2s'
                }}
                className="hover:scale-110"
            >
                {isOpen ? <ChevronDown size={28} /> : <MessageSquare size={28} />}
                {unreadCount > 0 && !isOpen && (
                    <span style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: 'white', fontSize: '0.7rem', width: '20px', height: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '2px solid var(--dash-bg)' }}>
                        {unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
}
