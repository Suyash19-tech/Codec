import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import axios from 'axios'
import {
    Upload, FileText, Image as ImageIcon, BookOpen,
    Trash2, Sparkles, Eye, EyeOff, X, Cpu,
    Clock, ChevronDown, ChevronUp, Share2, Users, MessageSquare, Send,
    Folder, ChevronRight, MoreVertical, Plus, Edit2, Ghost
} from 'lucide-react'

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

// ─── Document View Modal ───────────────────────────────────────────────────

function DocumentViewModal({ doc, onClose }) {
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
                            <p style={{ fontSize: 10, color: '#9ca3af', fontFamily: "'DM Mono',monospace" }}>{doc.type} · {doc.size}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#d1d5db'}
                        onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
                    ><X size={20} /></button>
                </div>

                {/* Body */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Full Width Preview */}
                    <div style={{ flex: 1, background: '#0a0a0c', display: 'flex', flexDirection: 'column' }}>
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
                </div>
            </div>

            <style>{`
        @keyframes fade-in  { from { opacity:0 } to { opacity:1 } }
        @keyframes slide-up { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
        </div>
    )
}

const toCard = (d) => {
    const baseName = (d.originalName || d.fileName || '').toString()
    const ext = (baseName.split('.').pop() || '').toUpperCase()
    const IMAGE_TYPES = ['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'SVG']
    const DOC_TYPES = ['PDF', 'DOCX', 'DOC', 'PPTX', 'PPT', 'XLSX', 'XLS', 'CSV', 'TXT', 'HTML']
    let type = ext
    if (!IMAGE_TYPES.includes(ext) && !DOC_TYPES.includes(ext)) {
        // fallback via mimeType
        if (d.mimeType?.includes('pdf')) type = 'PDF'
        else if (d.mimeType?.includes('image')) type = 'PNG'
        else type = 'DOCX'
    }
    const icon = IMAGE_TYPES.includes(type) ? ImageIcon : (type === 'PDF' ? FileText : BookOpen)
    const sizeMB = d.size ? `${(d.size / 1024 / 1024).toFixed(1)} MB` : ''
    const created = d.createdAt ? new Date(d.createdAt) : new Date()
    const date = created.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    return {
        id: d._id || d.id,
        title: baseName.replace(/\.[^/.]+$/, ''),
        type,
        date,
        size: sizeMB,
        isPublic: !!d.isPublic,
        icon,
        fileUrl: d.fileUrl || '',
    }
}

// ─── Share Modal ──────────────────────────────────────────────────────────────

function ShareModal({ doc, onClose }) {
    const [users, setUsers] = useState([])
    const [groups, setGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const [sharing, setSharing] = useState(false)
    const [message, setMessage] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('codec_token')
                const [usersRes, groupsRes] = await Promise.all([
                    fetch('/api/users', { headers: { Authorization: 'Bearer ' + token } }),
                    fetch('/api/groups', { headers: { Authorization: 'Bearer ' + token } })
                ])

                if (usersRes.ok) {
                    const data = await usersRes.json()
                    setUsers(data.filter(u => u._id !== localStorage.getItem('codec_user_id')))
                }
                if (groupsRes.ok) {
                    setGroups(await groupsRes.json())
                }
            } catch (err) {
                console.error("Failed to fetch sharing data", err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleShare = async (targetUserId, shareWithDepartment = false, targetGroupId = null) => {
        setSharing(true)
        setMessage(null)
        try {
            const token = localStorage.getItem('codec_token')
            const res = await fetch(`/api/documents/${doc.id}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token
                },
                body: JSON.stringify({ targetUserId, shareWithDepartment, targetGroupId })
            })
            if (res.ok) {
                let successMsg = 'Document shared!'
                if (shareWithDepartment) successMsg = 'Shared with department!'
                else if (targetGroupId) successMsg = 'Shared with group!'

                setMessage({ type: 'success', text: successMsg })
                if (targetUserId) {
                    setUsers(prev => prev.filter(u => u._id !== targetUserId))
                }
            } else {
                setMessage({ type: 'error', text: 'Sharing failed.' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Network error.' })
        } finally {
            setSharing(false)
        }
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 110,
            background: 'rgba(3,3,3,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fade-in 0.15s ease',
        }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                width: '90%', maxWidth: 420,
                background: 'rgba(14,14,18,0.98)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: '24px',
                display: 'flex', flexDirection: 'column', gap: 20,
                maxHeight: '85vh', overflow: 'hidden',
                animation: 'slide-up 0.2s cubic-bezier(0.16,1,0.3,1)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f3f4f6' }}>Share Document</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={18} /></button>
                </div>

                {message && (
                    <div style={{
                        padding: '10px 14px', borderRadius: 8,
                        background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        color: message.type === 'success' ? '#4ade80' : '#f87171',
                        fontSize: 12, textAlign: 'center'
                    }}>
                        {message.text}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button
                        disabled={sharing}
                        onClick={() => handleShare(null, true)}
                        style={{
                            width: '100%', padding: '12px', borderRadius: 10,
                            background: 'rgba(129,140,248,0.1)',
                            border: '1px solid rgba(129,140,248,0.2)',
                            color: '#a5b4fc', fontSize: 13, fontWeight: 500,
                            cursor: sharing ? 'default' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => !sharing && (e.currentTarget.style.background = 'rgba(129,140,248,0.15)')}
                        onMouseLeave={e => !sharing && (e.currentTarget.style.background = 'rgba(129,140,248,0.1)')}
                    >
                        <Users size={16} /> Share with my Department
                    </button>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, overflowY: 'auto' }}>
                    {/* Groups Section */}
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 12, fontFamily: "'DM Mono',monospace" }}>SHARE WITH GROUPS</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {loading ? <p style={{ color: '#6b7280', fontSize: 12 }}>Loading groups...</p> :
                                groups.length === 0 ? <p style={{ color: '#6b7280', fontSize: 11 }}>No groups joined.</p> :
                                    groups.map(g => (
                                        <div key={g._id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ fontSize: 13, color: '#e5e7eb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</p>
                                                <p style={{ fontSize: 10, color: '#6b7280' }}>{g.members.length} members</p>
                                            </div>
                                            <button
                                                disabled={sharing}
                                                onClick={() => handleShare(null, false, g._id)}
                                                style={{
                                                    padding: '4px 10px', borderRadius: 6,
                                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                                    color: '#9ca3af', fontSize: 10, cursor: 'pointer'
                                                }}
                                            >Share</button>
                                        </div>
                                    ))}
                        </div>
                    </div>

                    {/* Professors Section */}
                    <div>
                        <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 12, fontFamily: "'DM Mono',monospace" }}>SHARE WITH PROFESSORS</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {loading ? null :
                                users.length === 0 ? <p style={{ color: '#6b7280', fontSize: 11 }}>No other professors found.</p> :
                                    users.map(u => (
                                        <div key={u._id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ fontSize: 13, color: '#e5e7eb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</p>
                                                <p style={{ fontSize: 10, color: '#6b7280' }}>{u.department || 'No Dept'}</p>
                                            </div>
                                            <button
                                                disabled={sharing}
                                                onClick={() => handleShare(u._id)}
                                                style={{
                                                    padding: '4px 10px', borderRadius: 6,
                                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                                    color: '#9ca3af', fontSize: 10, cursor: 'pointer'
                                                }}
                                            >Share</button>
                                        </div>
                                    ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── AI Summary Panel ─────────────────────────────────────────────────────────

function SummaryPanel({ doc, onClose }) {
    const [summary, setSummary] = useState('')
    const [loading, setLoading] = useState(false)
    const [generated, setGenerated] = useState(false)

    const generate = useCallback(async () => {
        setSummary(''); setLoading(true); setGenerated(false)
        try {
            const token = localStorage.getItem('codec_token')
            const res = await fetch(`/api/documents/${doc.id}/summarize`, {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + token }
            });
            const data = await res.json()
            if (res.ok) {
                setSummary(data.summary)
            } else {
                setSummary(data.message || 'Failed to generate summary.')
            }
        } catch {
            setSummary('Connection error. Please try again.')
        } finally {
            setLoading(false); setGenerated(true)
        }
    }, [doc])

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(3,3,3,0.9)', backdropFilter: 'blur(14px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fade-in 0.15s ease',
        }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                width: '92%', maxWidth: 540,
                background: 'rgba(14,14,18,0.98)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
                display: 'flex', flexDirection: 'column',
                maxHeight: '82vh', overflow: 'hidden',
                animation: 'slide-up 0.2s cubic-bezier(0.16,1,0.3,1)',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 22px',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Cpu size={13} color="#9ca3af" />
                        <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: '#6b7280', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                            AI Summary · {doc.title}
                        </span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 2 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#d1d5db'}
                        onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
                    ><X size={14} /></button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px 22px', overflowY: 'auto', flex: 1 }}>
                    {!generated && !loading && (
                        <div style={{ textAlign: 'center', padding: '24px 0' }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 12, margin: '0 auto 16px',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Sparkles size={18} color="#6b7280" />
                            </div>
                            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>
                                Generate an intelligent summary for this document.
                            </p>
                            <button onClick={generate} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 7,
                                padding: '10px 22px', borderRadius: 8,
                                background: 'rgba(255,255,255,0.07)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                color: '#e5e7eb', fontSize: 12,
                                fontFamily: "'DM Mono',monospace",
                                letterSpacing: '0.1em', cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.11)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
                            >
                                <Sparkles size={11} /> Generate Summary
                            </button>
                        </div>
                    )}
                    {loading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px 0' }}>
                            <div style={{ display: 'flex', gap: 3 }}>
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} style={{
                                        width: 2, height: 16, borderRadius: 2, background: '#6b7280',
                                        animation: `bar-bounce 1s ease-in-out ${i * 0.15}s infinite`,
                                    }} />
                                ))}
                            </div>
                            <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: '#6b7280', letterSpacing: '0.12em' }}>ANALYSING DOCUMENT...</span>
                        </div>
                    )}
                    {generated && summary && (
                        <div>
                            <p style={{ fontSize: 13.5, color: '#d1d5db', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{summary}</p>
                            <button onClick={generate} style={{
                                marginTop: 18, fontSize: 11, fontFamily: "'DM Mono',monospace",
                                color: '#6b7280', background: 'none',
                                border: '1px solid rgba(255,255,255,0.08)',
                                padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)' }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                            >↺ Regenerate</button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        @keyframes fade-in  { from { opacity:0 } to { opacity:1 } }
        @keyframes slide-up { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes bar-bounce { 0%,100%{transform:scaleY(0.3);opacity:0.25} 50%{transform:scaleY(1);opacity:1} }
      `}</style>
        </div>
    )
}

// ─── Doc Card ─────────────────────────────────────────────────────────────────

function DocCard({ doc, onDelete, onTogglePublic, onShare, onView }) {
    const [hovered, setHovered] = useState(false)
    const Icon = doc.icon

    const isProcessing = doc.ocrStatus === 'pending' || doc.ocrStatus === 'processing';

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
                border: hovered ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                padding: '18px',
                display: 'flex', flexDirection: 'column', gap: 14,
                transition: 'all 0.2s',
                backdropFilter: 'blur(12px)',
            }}
        >
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon size={16} color="#9ca3af" />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* Public/Private toggle */}
                    <button onClick={() => onTogglePublic(doc)} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '4px 9px', borderRadius: 6,
                        background: doc.isPublic ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        color: doc.isPublic ? '#d1d5db' : '#6b7280',
                        fontSize: 10, fontFamily: "'DM Mono',monospace",
                        letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = '#9ca3af' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = doc.isPublic ? '#d1d5db' : '#6b7280' }}
                    >
                        {doc.isPublic ? <Eye size={10} /> : <EyeOff size={10} />}
                        {doc.isPublic ? 'Public 🌍' : 'Private 🔒'}
                    </button>

                    {/* Share */}
                    <button onClick={() => onShare(doc)} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '4px 9px', borderRadius: 6,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        color: '#6b7280',
                        fontSize: 10, fontFamily: "'DM Mono',monospace",
                        letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = '#d1d5db' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#6b7280' }}
                    >
                        <Share2 size={10} />
                        Share
                    </button>

                    {/* Delete */}
                    <button onClick={() => onDelete(doc.id)} style={{
                        width: 28, height: 28, borderRadius: 6, border: 'none',
                        background: 'transparent', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#6b7280', transition: 'all 0.15s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.08)'; e.currentTarget.style.color = '#f87171' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' }}
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {/* Title & View Button */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: '#f3f4f6', marginBottom: 4, lineHeight: 1.35 }}>{doc.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                            fontSize: 9, fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em',
                            padding: '2px 7px', borderRadius: 4,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.09)',
                            color: '#6b7280',
                        }}>{doc.type}</span>
                        <span style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={9} /> {doc.date}
                        </span>
                    </div>
                </div>
                {isProcessing ? (
                    <button disabled style={{
                        padding: '6px 12px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        color: '#6b7280', fontSize: 11, fontWeight: 500,
                        cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: 6
                    }}>
                        <Cpu size={11} /> Processing...
                    </button>
                ) : (
                    <button
                        onClick={() => onView(doc)}
                        style={{
                            padding: '6px 12px', borderRadius: 8,
                            background: 'rgba(129,140,248,0.1)',
                            border: '1px solid rgba(129,140,248,0.2)',
                            color: '#a5b4fc', fontSize: 11, fontWeight: 500,
                            cursor: 'pointer', transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(129,140,248,0.15)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(129,140,248,0.1)'}
                    >View</button>
                )}
            </div>
        </div>
    )
}

// ─── Folder Card ──────────────────────────────────────────────────────────────

function FolderCard({ folder, onOpen, onRename, onToggleHidden, onDelete }) {
    const [showMenu, setShowMenu] = useState(false);
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { setHovered(false); setShowMenu(false); }}
            onClick={() => onOpen(folder)}
            style={{
                background: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                border: hovered ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                padding: '16px',
                display: 'flex', alignItems: 'center', gap: 14,
                transition: 'all 0.15s',
                backdropFilter: 'blur(12px)',
                cursor: 'pointer',
                position: 'relative',
                zIndex: hovered ? 10 : 1 // Ensure hovered card is slightly above others but below menu
            }}
        >
            <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(129,140,248,0.1)',
                border: '1px solid rgba(129,140,248,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Folder size={20} color="#818cf8" fill="#818cf820" />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    fontSize: 14, fontWeight: 600, color: '#f3f4f6',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>{folder.name}</p>
                {folder.isHidden && <span style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase' }}>Hidden</span>}
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation(); // CRITICAL: Stop propagation to prevent folder navigation
                    setShowMenu(!showMenu);
                }}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: 4,
                    position: 'relative',
                    zIndex: 60 // Ensure button is above everything
                }}
            >
                <MoreVertical size={16} />
            </button>

            {showMenu && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 8,
                    zIndex: 100, // Very high z-index to avoid clipping
                    background: '#16161a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: '4px',
                    minWidth: 120,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    marginTop: 4
                }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onRename(folder); setShowMenu(false); }}
                        style={{
                            width: '100%', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8,
                            background: 'none', border: 'none', color: '#d1d5db', fontSize: 12, cursor: 'pointer',
                            borderRadius: 4
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                        <Edit2 size={12} /> Rename
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleHidden(folder); setShowMenu(false); }}
                        style={{
                            width: '100%', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8,
                            background: 'none', border: 'none', color: '#d1d5db', fontSize: 12, cursor: 'pointer',
                            borderRadius: 4
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                        {folder.isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
                        {folder.isHidden ? 'Unhide' : 'Hide'}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(folder); setShowMenu(false); }}
                        style={{
                            width: '100%', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8,
                            background: 'none', border: 'none', color: '#f87171', fontSize: 12, cursor: 'pointer',
                            borderRadius: 4
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                        <Trash2 size={12} /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── MyUploadsView ────────────────────────────────────────────────────────────

export default function MyUploadsView({ userRole, initialFolderId = null }) {
    const [searchParams, setSearchParams] = useSearchParams()
    const folderIdFromUrl = searchParams.get('folderId') || null

    const [docs, setDocs] = useState([])
    const [folders, setFolders] = useState([])
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Home' }])
    const [showNewFolderModal, setShowNewFolderModal] = useState(false)
    const [folderToDelete, setFolderToDelete] = useState(null)
    const [newFolderName, setNewFolderName] = useState('')
    const [loading, setLoading] = useState(false)

    // Sync currentFolder with URL param
    const currentFolder = folderIdFromUrl

    // Update breadcrumbs based on folders list and URL
    useEffect(() => {
        if (!currentFolder) {
            setBreadcrumbs([{ id: null, name: 'Home' }]);
        } else {
            // If we're deep, we try to maintain breadcrumbs. 
            // A more robust way would be to fetch the path from the server.
            // For now, if current folder isn't in breadcrumbs, we add it.
            setBreadcrumbs(prev => {
                const exists = prev.find(b => b.id === currentFolder);
                if (exists) {
                    const idx = prev.findIndex(b => b.id === currentFolder);
                    return prev.slice(0, idx + 1);
                }
                return prev;
            });
        }
    }, [currentFolder]);

    const [dragOver, setDragOver] = useState(false)
    const [viewDoc, setViewDoc] = useState(null)
    const [shareDoc, setShareDoc] = useState(null)
    const [uploading, setUploading] = useState(false)

    // Folder upload state
    const [isUploadingFolder, setIsUploadingFolder] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadStatusText, setUploadStatusText] = useState('')

    const [uploadError, setUploadError] = useState(null)
    const [uploadTags, setUploadTags] = useState('')
    const fileRef = useRef(null)
    const folderInputRef = useRef(null)
    const abortUploadRef = useRef(false)
    const activeRequestController = useRef(null)

    const fetchDirectory = useCallback(async (fId = null) => {
        setLoading(true)
        const token = localStorage.getItem('codec_token')
        if (!token) return

        try {
            const url = `/api/folders${fId ? `?folderId=${fId}` : ''}`
            const res = await fetch(url, {
                headers: { Authorization: 'Bearer ' + token },
            })
            const data = await res.json()
            console.log('--- DIRECTORY DATA RECEIVED ---', data);
            if (res.ok) {
                setFolders(data.folders || [])
                setDocs((data.documents || []).map(toCard))
            }
        } catch (err) {
            console.error('Fetch directory error:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchDirectory(currentFolder)
    }, [currentFolder, fetchDirectory])

    const handleFiles = useCallback(async (files) => {
        setUploadError(null)
        const token = localStorage.getItem('codec_token')
        if (!token) {
            localStorage.removeItem('codec_user')
            localStorage.removeItem('codec_token')
            window.location.href = '/login'
            return
        }

        setUploading(true)
        setUploadProgress(0)
        setUploadStatusText('Preparing upload...')

        try {
            const uploadedDocs = []
            const totalFiles = Array.from(files).length

            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                setUploadStatusText(`Uploading ${i + 1} of ${totalFiles}: ${file.name}`)

                // 1. Upload to Cloudinary
                const isImage = file.type.startsWith('image/')
                const resourceType = isImage ? 'image' : 'raw'
                const cloudinaryData = new FormData()
                cloudinaryData.append('file', file)
                cloudinaryData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)

                const cloudRes = await axios.post(
                    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
                    cloudinaryData,
                    {
                        onUploadProgress: (progressEvent) => {
                            const perFilePercent = 100 / totalFiles
                            const currentFilePercent = (progressEvent.loaded / (progressEvent.total || 1)) * perFilePercent
                            const totalProgress = (i * perFilePercent) + currentFilePercent
                            setUploadProgress(Math.round(totalProgress))
                        }
                    }
                )

                const { secure_url, public_id, bytes } = cloudRes.data
                const cleanSecureUrl = secure_url.replace(/[`']/g, "").trim();

                // 2. Save metadata to Backend
                setUploadStatusText(`Processing ${i + 1} of ${totalFiles}: ${file.name}`)
                const res = await fetch('/api/documents/upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        originalName: file.name,
                        fileUrl: cleanSecureUrl,
                        cloudinaryId: public_id,
                        size: bytes,
                        tags: uploadTags,
                        folderId: currentFolder
                    }),
                })

                if (res.ok) {
                    const data = await res.json()
                    uploadedDocs.push(toCard(data))
                } else {
                    console.error('Failed to save metadata to backend');
                }
            }

            if (uploadedDocs.length > 0) {
                setDocs(prev => [...uploadedDocs, ...prev])
            }
            setUploadTags('')
            setUploadStatusText(`Successfully uploaded ${uploadedDocs.length} file(s)!`)

            // Clear success message after 2 seconds
            setTimeout(() => {
                setUploadStatusText('')
                setUploadProgress(0)
            }, 2000)
        } catch (err) {
            console.error('Upload error:', err)
            setUploadError('Upload failed. Please try again.')
            setUploadStatusText('Upload failed')
        } finally {
            setUploading(false)
        }
    }, [uploadTags, currentFolder])

    const handleDrop = useCallback(e => {
        e.preventDefault(); setDragOver(false)
        if (!uploading && !isUploadingFolder) handleFiles(e.dataTransfer.files)
    }, [handleFiles, uploading, isUploadingFolder])

    const handleFolderUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setIsUploadingFolder(true);
        setUploadProgress(0);
        abortUploadRef.current = false;
        let successCount = 0;

        const token = localStorage.getItem('codec_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        for (let i = 0; i < files.length; i++) {
            if (abortUploadRef.current) break;

            const file = files[i];
            setUploadStatusText(`Uploading ${i + 1} of ${files.length} files...`);

            try {
                // 1. Upload to Cloudinary
                const cloudinaryData = new FormData()
                cloudinaryData.append('file', file)
                cloudinaryData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)

                activeRequestController.current = new AbortController()
                const cloudRes = await axios.post(
                    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`,
                    cloudinaryData,
                    {
                        signal: activeRequestController.current.signal,
                        onUploadProgress: (progressEvent) => {
                            const totalFiles = files.length
                            const perFilePercent = 100 / totalFiles
                            const currentFilePercent = (progressEvent.loaded / (progressEvent.total || 1)) * perFilePercent
                            const totalProgress = (i * perFilePercent) + currentFilePercent
                            setUploadProgress(Math.round(totalProgress))
                        }
                    }
                )

                const { secure_url, public_id, bytes } = cloudRes.data
                const cleanSecureUrl = secure_url.replace(/[`']/g, "").trim();

                // 2. Save metadata to Backend
                const res = await fetch('/api/documents/upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        originalName: file.name,
                        fileUrl: cleanSecureUrl,
                        cloudinaryId: public_id,
                        size: bytes,
                        tags: uploadTags,
                        folderId: currentFolder,
                        webkitRelativePath: file.webkitRelativePath
                    }),
                })

                if (res.ok) {
                    successCount++;
                }
            } catch (err) {
                if (err.name === 'AbortError' || axios.isCancel(err)) {
                    console.log('Upload aborted by user');
                } else {
                    console.error('Folder upload error for file:', file.name, err);
                }
            }
        }

        if (abortUploadRef.current) {
            setUploadStatusText('Upload Cancelled.');
        } else {
            setUploadStatusText(`Finished uploading ${successCount} of ${files.length} files.`);
        }

        // Allow user to see the completed state for a moment
        setTimeout(() => {
            setIsUploadingFolder(false);
            setUploadStatusText('');
            setUploadProgress(0);
            fetchDirectory(currentFolder); // Refresh current directory
        }, 2000);
    };

    const cancelUpload = () => {
        abortUploadRef.current = true;
        if (activeRequestController.current) {
            activeRequestController.current.abort();
        }
        setUploadStatusText('Upload Cancelled.');
        setTimeout(() => {
            setIsUploadingFolder(false);
            setUploadProgress(0);
        }, 1500);
    };

    const handleDelete = useCallback(async (id) => {
        const isConfirmed = window.confirm("Are you sure you want to delete this file? Once deleted, it cannot be recovered from the platform.");
        if (!isConfirmed) return;

        const token = localStorage.getItem('codec_token');
        if (!token) return;

        try {
            const res = await fetch(`/api/documents/${id}`, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
            });

            if (res.ok) {
                setDocs(p => p.filter(d => d.id !== id));
            } else {
                const data = await res.json().catch(() => ({}));
                console.error('Delete failed:', data.message || res.status);
                alert(`Delete failed: ${data.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    }, [])

    const handleTogglePrivacy = useCallback(async (doc) => {
        if (!doc.isPublic) {
            const isConfirmed = window.confirm("Are you sure you want to make this document public? It will be viewable to everyone on the platform.");
            if (!isConfirmed) return;
        }

        const token = localStorage.getItem('codec_token');
        if (!token) return;

        try {
            const res = await fetch(`/api/documents/${doc.id}/privacy`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token
                },
                body: JSON.stringify({ isPublic: !doc.isPublic })
            });

            if (res.ok) {
                setDocs(p => p.map(d => d.id === doc.id ? { ...d, isPublic: !doc.isPublic } : d));
            } else {
                const data = await res.json().catch(() => ({}));
                alert(`Toggle failed: ${data.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Privacy toggle error:', err);
        }
    }, [])

    const toggleSummary = (docId, forceState) => {
        setVisibleSummaries(prev => ({
            ...prev,
            [docId]: forceState !== undefined ? forceState : !prev[docId]
        }));
    };

    const handleAskQuestion = async (docId) => {
        const question = chatQuestion[docId];
        if (!question || !question.trim()) return;

        setIsAsking(true);
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
            } else {
                alert(data.message || 'Failed to get answer');
            }
        } catch (err) {
            console.error('Chat error:', err);
            alert('Network error during chat');
        } finally {
            setIsAsking(false);
        }
    };

    const handleQuestionChange = (docId, value) => {
        setChatQuestion(prev => ({ ...prev, [docId]: value }));
    };

    const handleCreateFolder = async () => {
        console.log('--- HANDLE CREATE FOLDER CALLED ---');
        console.log('New Folder Name:', newFolderName);
        console.log('Current Folder ID:', currentFolder);
        if (!newFolderName.trim()) return;
        const token = localStorage.getItem('codec_token');
        try {
            const res = await fetch('/api/folders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token
                },
                body: JSON.stringify({
                    name: newFolderName,
                    parentFolder: currentFolder
                })
            });
            if (res.ok) {
                const newFolder = await res.json();
                setFolders(prev => [newFolder, ...prev]);
                setNewFolderName('');
                setShowNewFolderModal(false);
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to create folder');
            }
        } catch (err) {
            console.error('Create folder error:', err);
        }
    };

    const handleOpenFolder = (folder) => {
        setSearchParams({ folderId: folder._id });
        setBreadcrumbs(prev => [...prev, { id: folder._id, name: folder.name }]);
    };

    const handleGoToBreadcrumb = (id, index) => {
        if (id) {
            setSearchParams({ folderId: id });
        } else {
            setSearchParams({});
        }
        setBreadcrumbs(prev => prev.slice(0, index + 1));
    };

    const handleRenameFolder = async (folder) => {
        const newName = window.prompt('Enter new folder name:', folder.name);
        if (!newName || newName === folder.name) return;

        const token = localStorage.getItem('codec_token');
        try {
            const res = await fetch(`/api/folders/${folder._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token
                },
                body: JSON.stringify({ name: newName })
            });
            if (res.ok) {
                setFolders(prev => prev.map(f => f._id === folder._id ? { ...f, name: newName } : f));
            }
        } catch (err) {
            console.error('Rename folder error:', err);
        }
    };

    const handleToggleFolderHidden = async (folder) => {
        const token = localStorage.getItem('codec_token');
        try {
            const res = await fetch(`/api/folders/${folder._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token
                },
                body: JSON.stringify({ isHidden: !folder.isHidden })
            });
            if (res.ok) {
                setFolders(prev => prev.filter(f => f._id !== folder._id));
            }
        } catch (err) {
            console.error('Toggle folder hidden error:', err);
        }
    };

    const confirmDeleteFolder = async () => {
        if (!folderToDelete) return;
        const token = localStorage.getItem('codec_token');
        try {
            const res = await fetch(`/api/folders/${folderToDelete._id}`, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token }
            });
            if (res.ok) {
                setFolders(prev => prev.filter(f => f._id !== folderToDelete._id));
                setFolderToDelete(null);
                // Optional: Show success toast/alert
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to delete folder');
            }
        } catch (err) {
            console.error('Delete folder error:', err);
            alert('Network error while deleting folder');
        }
    };

    return (
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px 48px', position: 'relative' }}>

            {/* Page header */}
            <div style={{ marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f9fafb', letterSpacing: '-0.4px', marginBottom: 6 }}>My Files</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        {breadcrumbs.map((crumb, idx) => (
                            <React.Fragment key={crumb.id || 'root'}>
                                <button
                                    onClick={() => handleGoToBreadcrumb(crumb.id, idx)}
                                    style={{
                                        background: 'none', border: 'none', color: idx === breadcrumbs.length - 1 ? '#f9fafb' : '#6b7280',
                                        fontSize: 13, fontWeight: idx === breadcrumbs.length - 1 ? 600 : 400,
                                        cursor: 'pointer', padding: '2px 4px', borderRadius: 4, transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={e => idx !== breadcrumbs.length - 1 && (e.currentTarget.style.color = '#d1d5db')}
                                    onMouseLeave={e => idx !== breadcrumbs.length - 1 && (e.currentTarget.style.color = '#6b7280')}
                                >
                                    {crumb.name}
                                </button>
                                {idx < breadcrumbs.length - 1 && <ChevronRight size={14} color="#374151" />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={() => { if (!isUploadingFolder) folderInputRef.current?.click() }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 18px', borderRadius: 12,
                            background: 'rgba(129,140,248,0.1)',
                            border: '1px solid rgba(129,140,248,0.2)',
                            color: '#a5b4fc', fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.15s',
                            backdropFilter: 'blur(10px)'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(129,140,248,0.15)'; e.currentTarget.style.borderColor = 'rgba(129,140,248,0.3)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(129,140,248,0.1)'; e.currentTarget.style.borderColor = 'rgba(129,140,248,0.2)' }}
                    >
                        <Upload size={16} /> Upload Folder
                    </button>
                    <input
                        ref={folderInputRef}
                        type="file"
                        webkitdirectory="true"
                        directory="true"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFolderUpload}
                    />
                    <button
                        onClick={() => { console.log('Opening New Folder Modal'); setShowNewFolderModal(true); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 18px', borderRadius: 12,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#f9fafb', fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.15s',
                            backdropFilter: 'blur(10px)'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                    >
                        <Plus size={16} /> New Folder
                    </button>
                </div>
            </div>

            {/* Drop zone */}
            <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => { if (!uploading) fileRef.current?.click() }}
                style={{
                    borderRadius: 14,
                    border: dragOver ? '1.5px solid rgba(255,255,255,0.3)' : '1.5px dashed rgba(255,255,255,0.1)',
                    background: dragOver ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                    padding: '52px 32px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    marginBottom: 40,
                    transition: 'all 0.2s',
                    boxShadow: dragOver ? '0 0 32px rgba(255,255,255,0.03)' : 'none',
                }}
            >
                <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={e => { if (!uploading) handleFiles(e.target.files) }} />
                <div style={{
                    width: 48, height: 48, borderRadius: 12, margin: '0 auto 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {uploading ? <span style={{ fontSize: 12, color: '#9ca3af' }}>Uploading…</span> : <Upload size={20} color="#9ca3af" />}
                </div>
                <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 4 }}>
                    <span style={{ color: '#e5e7eb', fontWeight: 500 }}>{uploading ? 'Uploading files…' : 'Click to upload'}</span> or drag & drop
                </p>
                <p style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: '#374151', letterSpacing: '0.1em' }}>
                    PDF · DOCX · PNG · JPG — UP TO 50MB PER FILE
                </p>
                {uploadError && <p style={{ marginTop: 8, fontSize: 13, color: '#f87171' }}>{uploadError}</p>}
            </div>

            {/* Tags Input - Clearly visible above list */}
            <div style={{
                marginBottom: 32,
                maxWidth: 400,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                padding: '20px',
                borderRadius: 12
            }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 12 }}>
                    Add tags to your upload
                </label>
                <input
                    type="text"
                    placeholder="Enter tags (comma separated) - e.g. physics, exam"
                    value={uploadTags}
                    onChange={e => setUploadTags(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#f3f4f6',
                        fontSize: 14,
                        outline: 'none',
                        transition: 'all 0.15s'
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.04)' }}
                />
            </div>

            {/* Section label */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#6b7280', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                    Directory Contents ({folders.length + docs.length})
                </p>
                <p style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#9ca3af', letterSpacing: '0.12em' }}>
                    {docs.filter(d => d.isPublic).length} PUBLIC · {docs.filter(d => !d.isPublic).length} PRIVATE
                </p>
            </div>

            {/* Folders Section */}
            <div>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: '#9ca3af', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Folder size={16} /> Folders
                </h2>
                {folders.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 40 }}>
                        {folders.map(folder => (
                            <FolderCard
                                key={folder._id}
                                folder={folder}
                                onOpen={handleOpenFolder}
                                onRename={handleRenameFolder}
                                onToggleHidden={handleToggleFolderHidden}
                                onDelete={(f) => setFolderToDelete(f)}
                            />
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 40, italic: 'true' }}>No folders in this directory.</p>
                )}
            </div>

            {/* Documents Section */}
            <div style={{ marginTop: 32 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: '#9ca3af', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={16} /> Documents
                </h2>
                {docs.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                        {docs.map(doc => (
                            <DocCard
                                key={doc.id} doc={doc}
                                onDelete={handleDelete}
                                onTogglePublic={handleTogglePrivacy}
                                onShare={setShareDoc}
                                onView={setViewDoc}
                            />
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b7280', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <Ghost size={32} />
                        No documents in this directory.
                    </div>
                )}
            </div>

            {/* New Folder Modal */}
            {showNewFolderModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={() => setShowNewFolderModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        width: '90%', maxWidth: 400, background: '#16161a',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
                        padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f9fafb', marginBottom: 16 }}>New Folder</h3>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Folder Name"
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                            style={{
                                width: '100%', padding: '12px 16px', borderRadius: 10,
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#f3f4f6', fontSize: 14, outline: 'none', marginBottom: 20
                            }}
                        />
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowNewFolderModal(false)}
                                style={{
                                    padding: '10px 18px', borderRadius: 10,
                                    background: 'none', border: 'none', color: '#6b7280',
                                    fontSize: 13, fontWeight: 600, cursor: 'pointer'
                                }}
                            >Cancel</button>
                            <button
                                onClick={handleCreateFolder}
                                style={{
                                    padding: '10px 18px', borderRadius: 10,
                                    background: '#f9fafb', border: 'none', color: '#000',
                                    fontSize: 13, fontWeight: 600, cursor: 'pointer'
                                }}
                            >Create Folder</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Folder Confirmation Modal */}
            {folderToDelete && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 300,
                    background: 'rgba(3,3,3,0.85)', backdropFilter: 'blur(12px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fade-in 0.2s ease',
                }} onClick={() => setFolderToDelete(null)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        width: '90%', maxWidth: 400,
                        background: 'rgba(18,18,22,0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 20,
                        padding: '32px 28px',
                        boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
                        textAlign: 'center',
                        animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 16,
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px'
                        }}>
                            <Trash2 size={24} color="#f87171" />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f3f4f6', marginBottom: 10 }}>Delete Folder?</h3>
                        <p style={{ fontSize: 13.5, color: '#9ca3af', lineHeight: 1.6, marginBottom: 28 }}>
                            This will permanently delete <span style={{ color: '#e5e7eb', fontWeight: 600 }}>"{folderToDelete.name}"</span> and all files inside it. This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setFolderToDelete(null)}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: 12,
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#d1d5db', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            >Cancel</button>
                            <button
                                onClick={confirmDeleteFolder}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: 12,
                                    background: '#ef4444', border: 'none',
                                    color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    boxShadow: '0 8px 20px rgba(239,68,68,0.2)'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                                onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
                            >Delete Permanently</button>
                        </div>
                    </div>
                </div>
            )}

            {viewDoc && <DocumentViewModal doc={viewDoc} onClose={() => setViewDoc(null)} />}
            {shareDoc && <ShareModal doc={shareDoc} onClose={() => setShareDoc(null)} />}

            {/* Universal Progress Overlay - Shows for both single and folder uploads */}
            {(uploading || isUploadingFolder) && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 999,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column'
                }}>
                    <div style={{
                        width: '90%', maxWidth: 400, background: 'rgba(20,20,25,0.9)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
                        padding: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        textAlign: 'center'
                    }}>
                        <Upload size={32} color="#818cf8" style={{ marginBottom: 16 }} />
                        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#f3f4f6', marginBottom: 8 }}>
                            {isUploadingFolder ? 'Uploading Folder' : 'Uploading Files'}
                        </h3>
                        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>{uploadStatusText}</p>

                        <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                                width: `${uploadProgress}%`, height: '100%', background: '#818cf8',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                        <p style={{ fontSize: 11, color: '#6b7280', marginTop: 12, fontFamily: "'DM Mono',monospace", marginBottom: 24 }}>
                            {uploadProgress}% COMPLETED
                        </p>

                        {isUploadingFolder && !abortUploadRef.current && (
                            <button
                                onClick={cancelUpload}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: 10,
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#f87171',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    margin: '0 auto'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                            >
                                <X size={14} /> Cancel Upload
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

