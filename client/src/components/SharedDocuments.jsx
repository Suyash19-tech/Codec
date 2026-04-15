
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { FileText, Image as ImageIcon, BookOpen, Clock, User, Sparkles, ChevronDown, ChevronUp, Download, Search, X, MessageSquare, Send } from 'lucide-react'

const IMAGE_TYPES = ['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'SVG']
const PDF_TYPES = ['PDF']
const DOWNLOAD_ONLY_TYPES = ['ZIP', 'RAR', '7Z', 'TAR', 'GZ']

// ─── File Type Detection Helper ───────────────────────────────────────────

function getFileType(filename) {
    if (!filename) return 'unsupported';

    const ext = filename.split('.').pop()?.toLowerCase() || '';

    // Image formats
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
        return 'image';
    }

    // Video formats
    if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'].includes(ext)) {
        return 'video';
    }

    // Audio formats
    if (['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac', 'wma'].includes(ext)) {
        return 'audio';
    }

    // PDF
    if (ext === 'pdf') {
        return 'pdf';
    }

    // Everything else is unsupported
    return 'unsupported';
}

// ─── Private Chat Modal ──────────────────────────────────────────────────

function PrivateChatModal({ doc, onClose }) {
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const currentUserId = localStorage.getItem('codec_user_id')
    const scrollRef = useRef(null)
    const peerId = doc.uploader?._id || doc.uploader

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const token = localStorage.getItem('codec_token')
                const res = await fetch(`/api/messages/${doc._id || doc.id}/${peerId}`, {
                    headers: { Authorization: 'Bearer ' + token }
                })
                if (res.ok) {
                    const data = await res.json()
                    setMessages(data)
                }
            } catch (err) {
                console.error("Failed to fetch messages", err)
            } finally {
                setLoading(false)
            }
        }
        fetchMessages()
    }, [doc.id, peerId])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return

        setSending(true)
        try {
            const token = localStorage.getItem('codec_token')
            const res = await fetch(`/api/messages/${doc._id || doc.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token
                },
                body: JSON.stringify({ receiverId: peerId, text: newMessage })
            })
            if (res.ok) {
                const data = await res.json()
                // Fetch again or append locally. Append is better for UX.
                // We need sender details for the UI, so maybe fetch is safer or mock it.
                setMessages(prev => [...prev, { ...data, senderId: { _id: currentUserId, name: 'You' } }])
                setNewMessage('')
            }
        } catch (err) {
            console.error("Failed to send message", err)
        } finally {
            setSending(false)
        }
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 120,
            background: 'rgba(3,3,3,0.85)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fade-in 0.15s ease',
        }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                width: '92%', maxWidth: 460, height: '80vh',
                background: 'rgba(14,14,18,0.98)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                animation: 'slide-up 0.2s cubic-bezier(0.16,1,0.3,1)',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <MessageSquare size={16} color="#818cf8" />
                        <div>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f3f4f6' }}>Chat with {doc.uploader?.name}</h3>
                            <p style={{ fontSize: 10, color: '#4b5563', fontFamily: "'DM Mono',monospace" }}>{doc.originalName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563' }}><X size={18} /></button>
                </div>

                {/* Chat Area */}
                <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#374151', fontSize: 12 }}>Loading messages...</div>
                    ) : messages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <p style={{ fontSize: 12, color: '#4b5563' }}>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map(m => {
                            const isMe = (m.senderId?._id || m.senderId) === currentUserId
                            return (
                                <div key={m._id} style={{
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    display: 'flex', flexDirection: 'column',
                                    gap: 4, alignItems: isMe ? 'flex-end' : 'flex-start'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {!isMe && <span style={{ fontSize: 11, fontWeight: 600, color: '#818cf8' }}>{m.senderId?.name}</span>}
                                        <span style={{ fontSize: 9, color: '#374151' }}>{m.senderId?.designation}</span>
                                    </div>
                                    <div style={{
                                        padding: '10px 14px', borderRadius: 14,
                                        borderTopRightRadius: isMe ? 2 : 14,
                                        borderTopLeftRadius: isMe ? 14 : 2,
                                        background: isMe ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${isMe ? 'rgba(129,140,248,0.2)' : 'rgba(255,255,255,0.08)'}`,
                                        color: '#e5e7eb', fontSize: 13, lineHeight: 1.5,
                                        wordBreak: 'break-word'
                                    }}>
                                        {m.text}
                                    </div>
                                    <span style={{ fontSize: 8, color: '#374151', marginTop: 2 }}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.01)', display: 'flex', gap: 10 }}>
                    <input
                        type="text"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        style={{
                            flex: 1, padding: '12px 16px', borderRadius: 12,
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                            color: '#f3f4f6', fontSize: 13, outline: 'none'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: newMessage.trim() ? '#818cf8' : 'rgba(255,255,255,0.03)',
                            border: 'none', color: newMessage.trim() ? 'white' : '#374151',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: newMessage.trim() ? 'pointer' : 'default',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    )
}

// ─── Document View Modal ───────────────────────────────────────────────────

function DocumentViewModal({ doc, onClose, onOpenChat }) {
    const fileType = getFileType(doc.fileUrl || doc.title);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(3,3,3,0.9)', backdropFilter: 'blur(14px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fade-in 0.15s ease',
        }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                width: '95%', maxWidth: 1000, height: '90vh',
                background: 'rgba(14,14,18,0.98)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20,
                boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                animation: 'slide-up 0.2s cubic-bezier(0.16,1,0.3,1)',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText size={18} color="#818cf8" />
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f3f4f6' }}>{doc.title}</h3>
                            <p style={{ fontSize: 10, color: '#4b5563', fontFamily: "'DM Mono',monospace" }}>{doc.type} · {doc.size}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: 4 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#9ca3af'}
                        onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}
                    ><X size={20} /></button>
                </div>

                {/* Body Split View */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                    {/* Left: Document Preview */}
                    <div style={{ flex: 1.2, borderRight: '1px solid rgba(255,255,255,0.07)', background: '#0a0a0c', display: 'flex', flexDirection: 'column' }}>
                        {fileType === 'image' ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                                <img
                                    src={doc.fileUrl}
                                    alt={doc.title}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        maxHeight: '70vh',
                                        objectFit: 'contain',
                                        borderRadius: 8,
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                                    }}
                                />
                            </div>
                        ) : fileType === 'video' ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                                <video
                                    src={doc.fileUrl}
                                    controls
                                    style={{
                                        width: '100%',
                                        maxHeight: '70vh',
                                        borderRadius: 8,
                                        outline: 'none',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                                    }}
                                >
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        ) : fileType === 'audio' ? (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 24 }}>
                                <div style={{
                                    width: 80, height: 80, borderRadius: 20,
                                    background: 'rgba(129,140,248,0.1)',
                                    border: '1px solid rgba(129,140,248,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <FileText size={36} color="#818cf8" />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <h4 style={{ fontSize: 16, fontWeight: 600, color: '#f3f4f6', marginBottom: 6 }}>Audio File</h4>
                                    <p style={{ fontSize: 13, color: '#6b7280' }}>{doc.title}</p>
                                </div>
                                <audio
                                    src={doc.fileUrl}
                                    controls
                                    style={{
                                        width: '100%',
                                        maxWidth: 500,
                                        marginTop: 10,
                                        outline: 'none'
                                    }}
                                >
                                    Your browser does not support the audio tag.
                                </audio>
                            </div>
                        ) : fileType === 'pdf' ? (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: '600px' }}>
                                <iframe
                                    src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(doc.fileUrl)}`}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        minHeight: '600px',
                                        border: 'none',
                                        background: '#1f2937'
                                    }}
                                    title={doc.title}
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: 20,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    zIndex: 10
                                }}>
                                    <button
                                        onClick={() => window.open(doc.fileUrl, '_blank')}
                                        style={{
                                            padding: '8px 20px',
                                            borderRadius: 8,
                                            background: 'rgba(129,140,248,0.95)',
                                            color: 'white',
                                            border: '1px solid rgba(129,140,248,0.3)',
                                            fontSize: 13,
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.95)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(129,140,248,0.95)'}
                                    >
                                        Open PDF in New Tab
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 24 }}>
                                <div style={{
                                    width: 80, height: 80, borderRadius: 20,
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <FileText size={36} color="#6b7280" />
                                </div>
                                <div style={{ textAlign: 'center', maxWidth: 320 }}>
                                    <h4 style={{ fontSize: 16, fontWeight: 600, color: '#f3f4f6', marginBottom: 8 }}>Preview not available</h4>
                                    <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>This file type cannot be previewed in the browser. Download or open it in a new tab to view.</p>
                                </div>
                                <button
                                    onClick={() => window.open(doc.fileUrl, '_blank')}
                                    style={{
                                        padding: '10px 24px',
                                        borderRadius: 8,
                                        background: 'rgba(129,140,248,0.15)',
                                        color: '#818cf8',
                                        border: '1px solid rgba(129,140,248,0.3)',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(129,140,248,0.25)'; e.currentTarget.style.borderColor = 'rgba(129,140,248,0.4)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(129,140,248,0.15)'; e.currentTarget.style.borderColor = 'rgba(129,140,248,0.3)' }}
                                >
                                    <BookOpen size={16} />
                                    Open / Download File
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right: Chat Only */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)' }}>

                        {/* Private Chat Integration */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: '50%', background: 'rgba(129,140,248,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20
                            }}>
                                <MessageSquare size={24} color="#818cf8" />
                            </div>
                            <h4 style={{ fontSize: 16, fontWeight: 600, color: '#f3f4f6', marginBottom: 8 }}>Have questions?</h4>
                            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24, maxWidth: 240 }}>
                                Start a private 1-on-1 conversation with the uploader of this document.
                            </p>
                            <button
                                onClick={() => { onClose(); onOpenChat(doc); }}
                                style={{
                                    padding: '12px 24px', borderRadius: 12,
                                    background: '#818cf8', color: 'white', fontWeight: 600,
                                    fontSize: 14, cursor: 'pointer', border: 'none',
                                    transition: 'all 0.2s', boxShadow: '0 8px 16px rgba(129,140,248,0.2)'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#6366f1' }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#818cf8' }}
                            >
                                Send Message
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes fade-in  { from { opacity:0 } to { opacity:1 } }
        @keyframes slide-up { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
        </div >
    )
}

// ─── Shared Card ──────────────────────────────────────────────────────────────

function SharedDocCard({ doc, onSummarize, isSummarizing, activeSummaryId, onToggleSummary, isSummaryVisible, onAskQuestion, chatQuestion, onQuestionChange, chatAnswers, isAsking, onView, onOpenChat }) {
    const [hovered, setHovered] = useState(false)

    const getIcon = (mimeType, fileName) => {
        if (mimeType?.includes('pdf') || fileName?.endsWith('.pdf')) return FileText;
        if (mimeType?.startsWith('image/') || fileName?.match(/\.(jpg|jpeg|png|gif)$/i)) return ImageIcon;
        return BookOpen;
    }

    const Icon = getIcon(doc.mimeType, doc.fileName)
    const docId = doc._id || doc.id;

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1.5rem',
                borderRadius: 16,
                background: hovered ? '#1f1f23' : '#1a1a1d',
                border: hovered ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease',
                boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.2)',
            }}
        >
            {/* Header Row: Icon + File Name + Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                {/* Left: Icon + File Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        flexShrink: 0,
                        background: 'rgba(129,140,248,0.1)',
                        border: '1px solid rgba(129,140,248,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Icon size={20} color="#a5b4fc" />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: '#f3f4f6',
                            marginBottom: 4,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.3
                        }}>
                            {doc.originalName}
                        </h3>
                        {/* Metadata Row: File Type + Date */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{
                                fontSize: 10,
                                fontFamily: "'DM Mono',monospace",
                                letterSpacing: '0.08em',
                                padding: '3px 8px',
                                borderRadius: 5,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: '#9ca3af',
                                textTransform: 'uppercase'
                            }}>
                                {doc.mimeType?.split('/')[1] || 'FILE'}
                            </span>
                            <span style={{
                                fontSize: 11,
                                color: '#6b7280',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                            }}>
                                <Clock size={11} />
                                {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button
                        onClick={(e) => { e.preventDefault(); onView(doc) }}
                        style={{
                            padding: '8px 14px',
                            borderRadius: 8,
                            background: 'rgba(129,140,248,0.12)',
                            border: '1px solid rgba(129,140,248,0.25)',
                            color: '#a5b4fc',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(129,140,248,0.2)'
                            e.currentTarget.style.transform = 'translateY(-1px)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(129,140,248,0.12)'
                            e.currentTarget.style.transform = 'translateY(0)'
                        }}
                    >
                        <BookOpen size={14} />
                        View
                    </button>
                    <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: '#9ca3af',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                            transition: 'all 0.15s',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                            e.currentTarget.style.color = '#d1d5db'
                            e.currentTarget.style.transform = 'translateY(-1px)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                            e.currentTarget.style.color = '#9ca3af'
                            e.currentTarget.style.transform = 'translateY(0)'
                        }}
                        title="Download"
                    >
                        <Download size={16} />
                    </a>
                </div>
            </div>

            {/* Separator Line */}
            <div style={{
                height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                margin: '0.25rem 0'
            }} />

            {/* Footer: Shared By Section */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                paddingTop: 4
            }}>
                <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(129,140,248,0.1)',
                    border: '1px solid rgba(129,140,248,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#a5b4fc',
                    flexShrink: 0
                }}>
                    {doc.uploader?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                        fontSize: 12,
                        color: '#9ca3af',
                        marginBottom: 2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        Shared by <span style={{ color: '#d1d5db', fontWeight: 600 }}>{doc.uploader?.name || 'Unknown'}</span>
                    </p>
                    <p style={{
                        fontSize: 10,
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                    }}>
                        <User size={9} />
                        {doc.uploader?.designation || 'Faculty'} · {doc.uploader?.department || 'N/A'}
                    </p>
                </div>
            </div>
        </div>
    )
}

// ─── SharedDocuments Page ─────────────────────────────────────────────────────

export default function SharedDocuments() {
    const [docs, setDocs] = useState([])
    const [loading, setLoading] = useState(true)
    const [isSummarizing, setIsSummarizing] = useState(false)
    const [activeSummaryId, setActiveSummaryId] = useState(null)
    const [visibleSummaries, setVisibleSummaries] = useState({})
    const [chatQuestion, setChatQuestion] = useState({})
    const [chatAnswers, setChatAnswers] = useState({})
    const [isAsking, setIsAsking] = useState(false)
    const [viewDoc, setViewDoc] = useState(null)
    const [chatDoc, setChatDoc] = useState(null)

    // Filter states
    const [timeFilter, setTimeFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [uploaderFilter, setUploaderFilter] = useState('')

    useEffect(() => {
        const fetchShared = async () => {
            try {
                const token = localStorage.getItem('codec_token')
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'
                const url = `${API_URL}/api/documents/shared?time=${timeFilter}&type=${typeFilter}&uploaderId=${uploaderFilter}`
                console.log('📡 [SharedDocuments] Fetching from:', url)
                const res = await fetch(url, {
                    headers: { Authorization: 'Bearer ' + token }
                })
                if (res.ok) {
                    const data = await res.json()
                    console.log('✅ [SharedDocuments] Received', data.length, 'documents')
                    console.log('📄 [SharedDocuments] First doc:', data[0])
                    setDocs(data)
                } else {
                    console.error('❌ [SharedDocuments] Fetch failed:', res.status, res.statusText)
                }
            } catch (err) {
                console.error("❌ [SharedDocuments] Fetch shared error", err)
            } finally {
                setLoading(false)
            }
        }
        fetchShared()
    }, [timeFilter, typeFilter, uploaderFilter])

    const handleViewDoc = (doc) => {
        const baseName = (doc.originalName || doc.fileName || '').toString()
        const ext = (baseName.split('.').pop() || '').toUpperCase()
        const type = ['PDF', 'DOCX', 'PNG', 'JPG'].includes(ext)
            ? ext
            : (doc.mimeType?.includes('pdf') ? 'PDF' : (doc.mimeType?.includes('presentation') ? 'PPTX' : 'DOCX'))
        const sizeMB = doc.size ? `${(doc.size / 1024 / 1024).toFixed(1)} MB` : ''

        setViewDoc({
            id: doc._id || doc.id,
            title: baseName.replace(/\.[^/.]+$/, ''),
            type,
            size: sizeMB,
            fileUrl: doc.fileUrl,
            aiSummary: doc.aiSummary || ''
        })
    }

    const handleSummarize = async (docId) => {
        setIsSummarizing(true);
        setActiveSummaryId(docId);
        try {
            const token = localStorage.getItem('codec_token');
            const res = await fetch(`/api/documents/${docId}/summarize`, {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + token },
            });
            const data = await res.json();
            if (res.ok) {
                setDocs(prev => prev.map(doc => {
                    const id = doc._id || doc.id;
                    return id === docId ? { ...doc, aiSummary: data.summary } : doc;
                }));
                setVisibleSummaries(prev => ({ ...prev, [docId]: true }));
            }
        } catch (err) {
            console.error('Summary error:', err);
        } finally {
            setIsSummarizing(false);
            setActiveSummaryId(null);
        }
    };

    const handleAskQuestion = async (docId) => {
        const question = chatQuestion[docId];
        if (!question || !question.trim()) return;

        setIsAsking(true);
        setActiveSummaryId(docId);
        try {
            const token = localStorage.getItem('codec_token');
            const res = await fetch(`/api/documents/${docId}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token,
                },
                body: JSON.stringify({ question }),
            });
            const data = await res.json();
            if (res.ok) {
                setChatAnswers(prev => ({ ...prev, [docId]: data.answer }));
                setChatQuestion(prev => ({ ...prev, [docId]: '' }));
            }
        } catch (err) {
            console.error('Chat error:', err);
        } finally {
            setIsAsking(false);
            setActiveSummaryId(null);
        }
    };

    if (loading) return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontSize: 13 }}>
            Loading shared files...
        </div>
    )

    return (
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px 48px' }}>
            <div style={{ marginBottom: 36 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f9fafb', letterSpacing: '-0.4px', marginBottom: 6 }}>Shared with Me</h1>
                <p style={{ fontSize: 13, color: '#4b5563' }}>Private materials shared with you by other professors.</p>
            </div>

            {/* Filters UI */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                    <select
                        value={timeFilter}
                        onChange={e => setTimeFilter(e.target.value)}
                        style={{
                            padding: '10px 14px', borderRadius: 10,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                            color: '#e5e7eb', fontSize: 13, outline: 'none', cursor: 'pointer', appearance: 'none', minWidth: 140
                        }}
                    >
                        <option value="all">All Time</option>
                        <option value="15">Last 15 Days</option>
                        <option value="30">Last 30 Days</option>
                    </select>
                    <ChevronDown size={14} color="#374151" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>

                <div style={{ position: 'relative' }}>
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        style={{
                            padding: '10px 14px', borderRadius: 10,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                            color: '#e5e7eb', fontSize: 13, outline: 'none', cursor: 'pointer', appearance: 'none', minWidth: 140
                        }}
                    >
                        <option value="all">All Types</option>
                        <option value="pdf">PDF Documents</option>
                        <option value="image">Images</option>
                        <option value="doc">Word/Docs</option>
                    </select>
                    <ChevronDown size={14} color="#374151" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>

                <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
                    <Search size={14} color="#374151" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                        type="text"
                        placeholder="Filter by Sharer ID..."
                        value={uploaderFilter}
                        onChange={e => setUploaderFilter(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                            color: '#e5e7eb', fontSize: 13, outline: 'none'
                        }}
                    />
                </div>
            </div>

            {docs.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {docs.map(doc => (
                        <SharedDocCard
                            key={doc._id}
                            doc={doc}
                            onSummarize={handleSummarize}
                            isSummarizing={isSummarizing}
                            activeSummaryId={activeSummaryId}
                            onToggleSummary={(id) => setVisibleSummaries(prev => ({ ...prev, [id]: !prev[id] }))}
                            isSummaryVisible={visibleSummaries[doc._id]}
                            onAskQuestion={handleAskQuestion}
                            chatQuestion={chatQuestion}
                            onQuestionChange={(id, val) => setChatQuestion(prev => ({ ...prev, [id]: val }))}
                            chatAnswers={chatAnswers}
                            isAsking={isAsking}
                            onView={handleViewDoc}
                            onOpenChat={(doc) => setChatDoc(doc)}
                        />
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.05)' }}>
                    <p style={{ color: '#4b5563', fontSize: 13 }}>No documents shared with you yet.</p>
                </div>
            )}

            {viewDoc && <DocumentViewModal doc={viewDoc} onClose={() => setViewDoc(null)} onOpenChat={(doc) => setChatDoc(doc)} />}
            {chatDoc && <PrivateChatModal doc={chatDoc} onClose={() => setChatDoc(null)} />}
        </div>
    )
}
