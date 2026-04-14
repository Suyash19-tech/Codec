import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, Image as ImageIcon, BookOpen, Clock, User, ScanSearch, X, Loader, Sparkles, Eye, MessageSquare, Send, ChevronRight, Trash2 } from 'lucide-react'
import apiClient from '../api/axios'

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

function DocumentViewModal({ doc, onClose, searchQuery }) {
    const fileType = getFileType(doc.fileUrl || doc.title);

    // Build PDF viewer URL with search highlighting
    const buildPdfViewerUrl = () => {
        // PDF.js viewer URL with file parameter
        const fileParam = encodeURIComponent(doc.fileUrl);

        // Debug logging
        console.log('[PDF Viewer] Search Query:', searchQuery);
        console.log('[PDF Viewer] File URL:', doc.fileUrl);

        // If we have a search query, add it as a hash parameter
        // PDF.js format: viewer.html?file=URL#search=term
        if (searchQuery && searchQuery.trim()) {
            const searchTerm = encodeURIComponent(searchQuery.trim());
            const finalUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${fileParam}#search=${searchTerm}`;
            console.log('[PDF Viewer] Final URL with search:', finalUrl);
            return finalUrl;
        }

        const baseUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${fileParam}`;
        console.log('[PDF Viewer] Base URL (no search):', baseUrl);
        return baseUrl;
    };

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
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                width: '100%',
                                height: '100%',
                                minHeight: '70vh',
                                background: '#111827',
                                borderRadius: 8,
                                padding: 12
                            }}>
                                {/* Search Badge - Top */}
                                {searchQuery && searchQuery.trim() && (
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                                        <span style={{
                                            background: 'rgba(34, 197, 94, 0.2)',
                                            color: '#4ade80',
                                            border: '1px solid rgba(34, 197, 94, 0.3)',
                                            padding: '6px 16px',
                                            borderRadius: 9999,
                                            fontSize: 13,
                                            fontWeight: 500,
                                            letterSpacing: '0.025em',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8
                                        }}>
                                            <Search size={14} />
                                            Searching for: "{searchQuery.trim()}"
                                        </span>
                                    </div>
                                )}

                                {/* Iframe Wrapper - Middle (flex-1 takes remaining space) */}
                                <div style={{
                                    flex: 1,
                                    width: '100%',
                                    background: 'white',
                                    borderRadius: 6,
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}>
                                    <iframe
                                        src={buildPdfViewerUrl()}
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            width: '100%',
                                            height: '100%',
                                            border: 'none'
                                        }}
                                        title="Document Preview"
                                    />
                                </div>

                                {/* Fallback Button - Bottom */}
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                                    <button
                                        onClick={() => window.open(doc.fileUrl, '_blank')}
                                        style={{
                                            padding: '8px 24px',
                                            borderRadius: 9999,
                                            background: '#4f46e5',
                                            color: 'white',
                                            border: 'none',
                                            fontSize: 14,
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
                                    >
                                        <BookOpen size={16} />
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

// ─── Result row ───────────────────────────────────────────────────────────────

function ResultRow({ doc, onSummarize, isSummarizing, activeSummaryId, onToggleSummary, isSummaryVisible, onAskQuestion, chatQuestion, onQuestionChange, chatAnswers, isAsking, onView, onDelete }) {
    const [hovered, setHovered] = useState(false)
    const navigate = useNavigate();

    // Determine icon based on mimeType/extension
    const getIcon = (mimeType, fileName) => {
        if (mimeType?.includes('pdf') || fileName?.endsWith('.pdf')) return FileText;
        if (mimeType?.startsWith('image/') || fileName?.match(/\.(jpg|jpeg|png|gif)$/i)) return ImageIcon;
        return BookOpen;
    }

    const Icon = getIcon(doc.mimeType, doc.fileName)

    // Format file size
    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    const docId = doc._id || doc.id;
    const isThisDocSummarizing = isSummarizing && activeSummaryId === docId;

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', flexDirection: 'column', gap: 12,
                padding: '14px 18px', borderRadius: 10,
                background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
                border: hovered ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
                transition: 'all 0.15s',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        textDecoration: 'none'
                    }}
                >
                    <Icon size={15} color="#6b7280" />
                </a>

                <div style={{ flex: 1, minWidth: 0 }}>
                    {doc.folderPath && doc.folderPath.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, color: '#6b7280' }}>📂 In:</span>
                            {doc.folderPath.map((folder, idx) => (
                                <React.Fragment key={folder._id}>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            // Assuming Dashboard is at '/' and uses a query param or state. 
                                            // We'll pass it via state to be handled by Dashboard.
                                            navigate('/', { state: { activeFolderId: folder._id } });
                                        }}
                                        style={{
                                            background: 'none', border: 'none', padding: 0,
                                            fontSize: 11, color: '#9ca3af', fontFamily: "'DM Mono',monospace",
                                            cursor: 'pointer', transition: 'all 0.15s',
                                            textDecoration: 'none'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.color = '#60a5fa'; e.currentTarget.style.textDecoration = 'underline'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.textDecoration = 'none'; }}
                                    >
                                        {folder.name}
                                    </button>
                                    {idx < doc.folderPath.length - 1 && <ChevronRight size={10} color="#4b5563" />}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                    <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 13.5, fontWeight: 500, color: '#f3f4f6', marginBottom: 4, textDecoration: 'none', display: 'block' }}
                    >
                        {doc.originalName}
                    </a>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <User size={9} />You
                        </span>
                        <span style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={9} />{new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                        <span style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                            Size: {formatSize(doc.size)}
                        </span>
                        {doc.tags && doc.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                                {doc.tags.map((tag, idx) => (
                                    <span key={idx} style={{
                                        fontSize: 9, color: '#9ca3af', background: 'rgba(255,255,255,0.04)',
                                        padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.06)'
                                    }}>
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={() => onView(doc)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px', borderRadius: 6,
                            background: 'rgba(129,140,248,0.1)',
                            border: '1px solid rgba(129,140,248,0.2)',
                            color: '#a5b4fc', fontSize: 10,
                            fontFamily: "'DM Mono',monospace", letterSpacing: '0.05em',
                            cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(129,140,248,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(129,140,248,0.1)'}
                    >
                        <Eye size={11} /> View
                    </button>

                    <button
                        onClick={() => onDelete(doc._id || doc.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px', borderRadius: 6,
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: '#f87171', fontSize: 10,
                            fontFamily: "'DM Mono',monospace", letterSpacing: '0.05em',
                            cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)' }}
                    >
                        <Trash2 size={11} /> Delete
                    </button>

                    <span style={{
                        fontSize: 9, fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em',
                        padding: '3px 9px', borderRadius: 4,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#6b7280', flexShrink: 0,
                    }}>
                        {doc.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                    </span>
                </div>
            </div>

            {/* AI Summary Content REMOVED for Privacy */}
        </div>
    )
}

// ─── Filter Button ───────────────────────────────────────────────────────────

function FilterButton({ label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: active ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.08)',
                background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: active ? '#f3f4f6' : '#6b7280',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s'
            }}
        >
            {label}
        </button>
    )
}

// ─── SearchPageView ───────────────────────────────────────────────────────────

export default function SearchPageView() {
    const [searchQuery, setSearchQuery] = useState('')
    const [documents, setDocuments] = useState([])
    const [viewDoc, setViewDoc] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [activeFilter, setActiveFilter] = useState('All')
    const [tagFilter, setTagFilter] = useState('')
    const [timeFilter, setTimeFilter] = useState('all')
    const [privacyFilter, setPrivacyFilter] = useState('all')

    const [isSummarizing, setIsSummarizing] = useState(false);
    const [activeSummaryId, setActiveSummaryId] = useState(null);
    const [visibleSummaries, setVisibleSummaries] = useState({});

    const [chatQuestion, setChatQuestion] = useState({});
    const [chatAnswers, setChatAnswers] = useState({});
    const [isAsking, setIsAsking] = useState(false);

    // Clear search results when component mounts (Bug Fix: Prevent ghost deleted files)
    useEffect(() => {
        // Clear any stale data when navigating to search page
        setDocuments([]);
        setSearchQuery('');
        setError(null);
    }, []); // Empty dependency array means this runs once on mount

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(null, searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, tagFilter, timeFilter, privacyFilter]);

    const handleSearch = async (e, queryOverride) => {
        if (e) e.preventDefault()

        const query = queryOverride !== undefined ? queryOverride : searchQuery
        setIsLoading(true)
        setError(null)

        try {
            const url = `/api/documents/search?q=${encodeURIComponent(query)}&tags=${encodeURIComponent(tagFilter)}&time=${timeFilter}&privacy=${privacyFilter}`
            const { data } = await apiClient.get(url)
            setDocuments(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error('Search error:', err)
            setError(err.response?.data?.message || 'Failed to fetch results')
            setDocuments([])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSummarize = async (docId) => {
        setIsSummarizing(true);
        setActiveSummaryId(docId);
        try {
            const { data } = await apiClient.post(`/api/documents/${docId}/summarize`);
            setDocuments(prev => prev.map(doc => {
                const id = doc._id || doc.id;
                return id === docId ? { ...doc, aiSummary: data.summary } : doc;
            }));
            setVisibleSummaries(prev => ({ ...prev, [docId]: true }));
        } catch (err) {
            alert(err.response?.data?.message || 'Summarization failed');
        }
    } catch (err) {
        console.error('Summary error:', err);
        alert('Network error during summarization');
    } finally {
        setIsSummarizing(false);
        setActiveSummaryId(null);
    }
};

const toggleSummary = (docId) => {
    setVisibleSummaries(prev => ({ ...prev, [docId]: !prev[docId] }));
};

const handleAskQuestion = async (docId) => {
    const question = chatQuestion[docId];
    if (!question || !question.trim()) return;

    setIsAsking(true);
    setActiveSummaryId(docId); // Reuse this to track active doc
    try {
        const { data } = await apiClient.post(`/api/documents/${docId}/chat`, { question });
        setChatAnswers(prev => ({ ...prev, [docId]: data.answer }));
        setChatQuestion(prev => ({ ...prev, [docId]: '' }));
    } catch (err) {
        console.error('Chat error:', err);
        alert(err.response?.data?.message || 'Network error during chat');
    } finally {
        setIsAsking(false);
        setActiveSummaryId(null);
    }
};

const handleQuestionChange = (docId, value) => {
    setChatQuestion(prev => ({ ...prev, [docId]: value }));
};

const handleDelete = async (documentId) => {
    // Confirmation prompt
    const confirmed = window.confirm('Are you sure you want to delete this document? This action cannot be undone.');

    if (!confirmed) return;

    try {
        await apiClient.delete(`/api/documents/${documentId}`);
        // Immediately remove from local state
        setDocuments(prev => prev.filter(doc => (doc._id || doc.id) !== documentId));

        // Show success message
        alert('Document deleted successfully!');
    } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete document');
    }
} catch (err) {
    console.error('Delete error:', err);
    alert('Network error during deletion');
}
};

const handleViewDoc = (doc) => {
    const baseName = (doc.originalName || doc.fileName || '').toString()
    const ext = (baseName.split('.').pop() || '').toUpperCase()
    const type = ['PDF', 'DOCX', 'PNG', 'JPG'].includes(ext)
        ? ext
        : (doc.mimeType?.includes('pdf') ? 'PDF' : (doc.mimeType?.includes('presentation') ? 'PPTX' : 'DOCX'))

    // Format file size
    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    setViewDoc({
        id: doc._id || doc.id,
        title: baseName.replace(/\.[^/.]+$/, ''),
        type,
        size: formatSize(doc.size),
        fileUrl: doc.fileUrl,
        aiSummary: doc.aiSummary || ''
    })
}

const filteredDocuments = useMemo(() => {
    if (activeFilter === 'All') return documents

    return documents.filter(doc => {
        const type = doc.mimeType || ''
        if (activeFilter === 'PDF') return type.includes('pdf')
        if (activeFilter === 'Images') return type.startsWith('image/')
        if (activeFilter === 'CSV/Data') return type.includes('csv') || type.includes('spreadsheet') || type.includes('excel')
        return true
    })
}, [documents, activeFilter])

return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
            padding: '24px 32px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(3,3,3,0.2)'
        }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f9fafb', marginBottom: 16 }}>Deep Search</h1>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, maxWidth: 1000 }}>
                <div style={{ position: 'relative', flex: 2 }}>
                    <Search size={16} color="#6b7280" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="Search content, titles..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px 12px 42px',
                            borderRadius: 10,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#f3f4f6',
                            fontSize: 14,
                            outline: 'none',
                            transition: 'all 0.15s',
                        }}
                        onFocus={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
                        onBlur={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                    />
                </div>
                <div style={{ position: 'relative', flex: 1 }}>
                    <input
                        type="text"
                        placeholder="Filter by Tags..."
                        value={tagFilter}
                        onChange={e => setTagFilter(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 10,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#f3f4f6',
                            fontSize: 14,
                            outline: 'none',
                            transition: 'all 0.15s',
                        }}
                        onFocus={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
                        onBlur={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                    />
                </div>
                <div style={{ position: 'relative', flex: 0.8 }}>
                    <select
                        value={timeFilter}
                        onChange={e => setTimeFilter(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 10,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#f3f4f6',
                            fontSize: 14,
                            outline: 'none',
                            appearance: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <option value="all">All Time</option>
                        <option value="15">Last 15 Days</option>
                        <option value="30">Last 30 Days</option>
                    </select>
                    <Clock size={14} color="#6b7280" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
                <div style={{ position: 'relative', flex: 0.8 }}>
                    <select
                        value={privacyFilter}
                        onChange={e => setPrivacyFilter(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 10,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#f3f4f6',
                            fontSize: 14,
                            outline: 'none',
                            appearance: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <option value="all">All Files</option>
                        <option value="public">Public Only</option>
                        <option value="private">Private Only</option>
                    </select>
                    <Eye size={14} color="#6b7280" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
            </form>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {['All', 'PDF', 'Images', 'CSV/Data'].map(filter => (
                    <FilterButton
                        key={filter}
                        label={filter}
                        active={activeFilter === filter}
                        onClick={() => setActiveFilter(filter)}
                    />
                ))}
            </div>
        </div>

        {/* Results Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50%', color: '#6b7280' }}>
                    <Loader size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                    <span style={{ fontSize: 13 }}>Searching your library...</span>
                </div>
            ) : error ? (
                <div style={{ textAlign: 'center', color: '#ef4444', marginTop: 40 }}>{error}</div>
            ) : filteredDocuments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, fontFamily: "'DM Mono',monospace" }}>
                        FOUND {filteredDocuments.length} RESULT{filteredDocuments.length !== 1 ? 'S' : ''}
                    </p>
                    {filteredDocuments.map(doc => (
                        <ResultRow
                            key={doc._id}
                            doc={doc}
                            onSummarize={handleSummarize}
                            isSummarizing={isSummarizing}
                            activeSummaryId={activeSummaryId}
                            onToggleSummary={toggleSummary}
                            isSummaryVisible={visibleSummaries[doc._id || doc.id]}
                            onAskQuestion={handleAskQuestion}
                            chatQuestion={chatQuestion}
                            onQuestionChange={handleQuestionChange}
                            chatAnswers={chatAnswers}
                            isAsking={isAsking}
                            onView={handleViewDoc}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', marginTop: 60, opacity: 0.6 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 20, margin: '0 auto 20px',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <ScanSearch size={28} color="#4b5563" />
                    </div>
                    <h3 style={{ fontSize: 15, color: '#e5e7eb', marginBottom: 6 }}>No matches found</h3>
                    <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 300, margin: '0 auto' }}>
                        Try searching for specific keywords within your document contents or file names.
                    </p>
                </div>
            )}
        </div>

        {viewDoc && <DocumentViewModal doc={viewDoc} onClose={() => setViewDoc(null)} searchQuery={searchQuery} />}

        <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
    </div>
)
}
