import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import * as CryptoJS from 'crypto-js';
import toast from 'react-hot-toast';
import { Plus, Lock, Trash2, Save, ShieldOff, Search, Bold, Italic, Underline, Heading, PaintBucket, X } from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import BoldExt from '@tiptap/extension-bold';
import ItalicExt from '@tiptap/extension-italic';
import UnderlineExt from '@tiptap/extension-underline';
import HeadingExt from '@tiptap/extension-heading';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import './Dashboard.css';

// Define the structure of a Note
interface Note {
  id: string;
  title: string;
  content: string;
  isLocked: boolean;
  passwordHint?: string;
  encryptedContent?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

const PasswordModal = ({ note, onUnlock, onCancel }: { note: Note | null; onUnlock: (password: string) => void; onCancel: () => void; }) => {
    const [password, setPassword] = useState('');
    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <button onClick={onCancel} className="modal-close-btn"><X size={20} /></button>
                <h2>Enter Password</h2>
                <p>This note is locked. Please enter the password to view it.</p>
                {note?.passwordHint && <p className="password-hint">Hint: {note.passwordHint}</p>}
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="modal-input"
                    placeholder="Password"
                    autoFocus
                />
                <div className="modal-actions">
                    <button onClick={onCancel} className="modal-button secondary">Cancel</button>
                    <button onClick={() => onUnlock(password)} className="modal-button primary">Unlock</button>
                </div>
            </div>
        </div>
    );
};

const SetPasswordModal = ({ onSetPassword, onCancel }: { onSetPassword: (password: string, hint: string) => void; onCancel: () => void; }) => {
    const [password, setPassword] = useState('');
    const [hint, setHint] = useState('');
    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <button onClick={onCancel} className="modal-close-btn"><X size={20} /></button>
                <h2>Set a Password</h2>
                <p>Secure your note with a password. You can also add an optional hint.</p>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="modal-input"
                    placeholder="Enter new password"
                    autoFocus
                />
                <input
                    type="text"
                    value={hint}
                    onChange={(e) => setHint(e.target.value)}
                    className="modal-input"
                    placeholder="Password hint (optional)"
                />
                <div className="modal-actions">
                    <button onClick={onCancel} className="modal-button secondary">Cancel</button>
                    <button onClick={() => onSetPassword(password, hint)} className="modal-button primary">Set Password & Lock</button>
                </div>
            </div>
        </div>
    );
};

export default function Dashboard() {
    const { user } = useUser();
    const [notes, setNotes] = useState<Note[]>([]);
    const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [wordCount, setWordCount] = useState(0);
    const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
    const [isSetPasswordModalOpen, setIsSetPasswordModalOpen] = useState(false);
    const [noteToProcess, setNoteToProcess] = useState<Note | null>(null);
    const [unlockMode, setUnlockMode] = useState<'view' | 'permanent' | 'delete'>('view');
    const [tempUnlockedContent, setTempUnlockedContent] = useState<string | null>(null);
    const prevNoteIdRef = useRef<string | null>(null);
    const autoSaveTimeoutRef = useRef<number | null>(null);
    const [passwordAttempts, setPasswordAttempts] = useState<{[id: string]: number}>({});
    const [tagInput, setTagInput] = useState('');

    const currentNote = notes.find(note => note.id === currentNoteId);
    const isTemporarilyUnlocked = currentNote?.isLocked && tempUnlockedContent !== null;
    const canEdit = currentNote && (!currentNote.isLocked || isTemporarilyUnlocked);

    // TipTap Editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            BoldExt,
            ItalicExt,
            UnderlineExt,
            HeadingExt.configure({ levels: [1, 2, 3] }),
            TextStyle,
            Color,
            Highlight,
        ],
        content: canEdit ? (isTemporarilyUnlocked ? tempUnlockedContent : currentNote?.content) : '',
        editable: !!canEdit,
        onUpdate: ({ editor }) => {
            if (canEdit) {
                setWordCount(editor.getText().trim().split(/\s+/).length);
                if (isTemporarilyUnlocked) setTempUnlockedContent(editor.getHTML());
            }
        },
    });

    useEffect(() => {
        if (editor && canEdit) {
            editor.commands.setContent(isTemporarilyUnlocked ? tempUnlockedContent : currentNote?.content || '', false);
            editor.setEditable(true);
        } else if (editor) {
            editor.commands.setContent('');
            editor.setEditable(false);
        }
    }, [currentNoteId, tempUnlockedContent, canEdit]);

    useEffect(() => {
        if (user?.unsafeMetadata.notes) {
            const sortedNotes = (user.unsafeMetadata.notes as Note[]).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            setNotes(sortedNotes);
        }
        setIsLoading(false);
    }, [user]);

    useEffect(() => {
        if (prevNoteIdRef.current && prevNoteIdRef.current !== currentNoteId && tempUnlockedContent !== null) {
            toast('Previous note re-locked for security.');
            setTempUnlockedContent(null);
        }
        prevNoteIdRef.current = currentNoteId;

        if (currentNote) {
            setTitle(currentNote.title);
        } else {
            setTitle('');
        }
    }, [currentNoteId]);

    useEffect(() => {
        setWordCount(editor && editor.getText ? editor.getText().trim().split(/\s+/).length : 0);
        if (currentNote && (!currentNote.isLocked || isTemporarilyUnlocked) && editor) {
            if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
            autoSaveTimeoutRef.current = window.setTimeout(() => handleSaveNote(false), 2000);
        }
        return () => { if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current) };
    }, [title]);

    const saveNotesToClerk = async (updatedNotes: Note[]) => {
        try {
            await user?.update({ unsafeMetadata: { notes: updatedNotes } });
            setNotes(updatedNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
            return true;
        } catch (error) { toast.error('Failed to save notes.'); return false; }
    };

    const handleNewNote = async () => {
        const newNote: Note = {
            id: new Date().toISOString(), title: 'Untitled Note', content: '', isLocked: false,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        const updatedNotes = [newNote, ...notes];
        if (await saveNotesToClerk(updatedNotes)) {
            setCurrentNoteId(newNote.id);
            toast.success('New note created!');
            setTimeout(() => {
                if (editor) editor.commands.focus('end');
            }, 100);
        }
    };

    const handleSaveNote = async (isManualSave = true) => {
        if (!currentNote || !editor) return;
        const noteInState = notes.find(n => n.id === currentNoteId);
        const htmlContent = editor.getHTML();
        if (!noteInState || (noteInState.title === title && (isTemporarilyUnlocked ? tempUnlockedContent === htmlContent : noteInState.content === htmlContent))) return;
        const updatedNotes = notes.map(n =>
            n.id === currentNoteId ? { ...n, title, content: isTemporarilyUnlocked ? n.content : htmlContent, updatedAt: new Date().toISOString() } : n
        );
        if (await saveNotesToClerk(updatedNotes) && isManualSave) {
            toast.success('Note saved!');
        }
    };

    const handleSelectNote = (note: Note) => {
        if (note.id === currentNoteId) return; // Don't prompt if already active
        if (note.isLocked) {
            setUnlockMode('view');
            setNoteToProcess(note);
            setIsUnlockModalOpen(true);
        } else {
            setCurrentNoteId(note.id);
        }
    };

    const handleUnlockSubmit = (password: string) => {
        if (!noteToProcess || !password) return;
        // Brute-force protection
        if (passwordAttempts[noteToProcess.id] && passwordAttempts[noteToProcess.id] >= 5) {
            toast.error('Too many incorrect attempts. Try again later.');
            return;
        }
        try {
            const decrypted = CryptoJS.AES.decrypt(noteToProcess.encryptedContent!, password).toString(CryptoJS.enc.Utf8);
            if (!decrypted) {
                setPasswordAttempts(pa => ({...pa, [noteToProcess.id]: (pa[noteToProcess.id]||0)+1}));
                toast.error('Incorrect password.');
                return;
            }
            if (unlockMode === 'view') {
                setTempUnlockedContent(decrypted);
                setCurrentNoteId(noteToProcess.id);
                toast.success('Note unlocked for editing.');
            } else if (unlockMode === 'permanent') {
                const updatedNotes = notes.map(n => n.id === noteToProcess.id ? { ...n, content: decrypted, isLocked: false, passwordHint: undefined, encryptedContent: undefined } : n);
                saveNotesToClerk(updatedNotes);
                toast.success('Note permanently unlocked!');
            } else if (unlockMode === 'delete') {
                handleDeleteNoteConfirmed(noteToProcess.id);
            }
        } catch {
            setPasswordAttempts(pa => ({...pa, [noteToProcess.id]: (pa[noteToProcess.id]||0)+1}));
            toast.error('Incorrect password.');
        } finally {
            setIsUnlockModalOpen(false);
            setNoteToProcess(null);
        }
    };

    const handleDeleteNote = (noteId: string) => {
        const note = notes.find(n => n.id === noteId);
        if (note?.isLocked) {
            setUnlockMode('delete');
            setNoteToProcess(note);
            setIsUnlockModalOpen(true);
        } else {
            handleDeleteNoteConfirmed(noteId);
        }
    };

    const handleDeleteNoteConfirmed = async (noteIdToDelete: string) => {
        const updatedNotes = notes.filter(n => n.id !== noteIdToDelete);
        if (await saveNotesToClerk(updatedNotes)) {
            if (currentNoteId === noteIdToDelete) setCurrentNoteId(null);
            toast.success('Note deleted.');
        }
    };

    const handleLockNote = () => {
        if (!currentNote) return;
        setIsSetPasswordModalOpen(true);
    };

    const handleSetPassword = async (password: string, hint: string) => {
        if (!currentNote || !password || !editor) { toast.error("Password cannot be empty."); return; }
        if (password.trim().toLowerCase() === hint.trim().toLowerCase() && hint.trim() !== '') {
            toast.error("Password hint should not match the password.");
            return;
        }
        const contentToEncrypt = isTemporarilyUnlocked ? tempUnlockedContent! : editor.getHTML();
        const encryptedContent = CryptoJS.AES.encrypt(contentToEncrypt, password).toString();
        const updatedNotes = notes.map(n =>
            n.id === currentNoteId ? { ...n, isLocked: true, encryptedContent, passwordHint: hint || undefined, content: '', title, updatedAt: new Date().toISOString() } : n
        );
        if (await saveNotesToClerk(updatedNotes)) {
            toast.success('Note locked!');
            setTempUnlockedContent(null);
        }
        setIsSetPasswordModalOpen(false);
    };

    const handlePermanentUnlock = () => {
        if (!currentNote || !currentNote.isLocked) return;
        setUnlockMode('permanent');
        setNoteToProcess(currentNote);
        setIsUnlockModalOpen(true);
    };

    const handleAddTag = () => {
        if (!currentNote || !tagInput.trim()) return;
        const tag = tagInput.trim();
        if (currentNote.tags?.includes(tag)) return;
        const updatedNotes = notes.map(n =>
            n.id === currentNoteId ? { ...n, tags: [...(n.tags || []), tag], updatedAt: new Date().toISOString() } : n
        );
        saveNotesToClerk(updatedNotes);
        setTagInput('');
    };

    const handleRemoveTag = (tagToRemove: string) => {
        if (!currentNote) return;
        const updatedNotes = notes.map(n =>
            n.id === currentNoteId ? { ...n, tags: (n.tags || []).filter(t => t !== tagToRemove), updatedAt: new Date().toISOString() } : n
        );
        saveNotesToClerk(updatedNotes);
    };

    // Search notes by title
    const filteredNotes: Note[] = notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()));

    if (isLoading) return <div className="loading-container"><h2>Loading...</h2></div>;

    return (
        <>
            {isUnlockModalOpen && <PasswordModal note={noteToProcess} onUnlock={handleUnlockSubmit} onCancel={() => setIsUnlockModalOpen(false)} />}
            {isSetPasswordModalOpen && <SetPasswordModal onSetPassword={handleSetPassword} onCancel={() => setIsSetPasswordModalOpen(false)} />}
            <div className="notes-dashboard-container">
                <div className="notes-sidebar">
                    <div className="sidebar-header">
                        <h2>All Notes</h2>
                        <button className="new-note-btn" onClick={handleNewNote}><Plus size={18} /> New Note</button>
                    </div>
                    <div className="search-bar">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search notes by title..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="notes-list">
                        {filteredNotes.map((note: Note) => (
                            <div key={note.id} className={`note-card ${note.id === currentNoteId ? 'active' : ''}`} onClick={() => handleSelectNote(note)}>
                                <h3>{note.isLocked && <Lock size={12} />} {note.title}</h3>
                                <p>{new Date(note.updatedAt).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <main className="editor-main">
                    {currentNote ? (
                        <>
                            <header className="editor-header">
                                <div className="editor-info">
                                    <span className="last-modified">
                                        Last modified: {new Date(currentNote.updatedAt).toLocaleString()}
                                    </span>
                                    <span className="word-count">Words: {wordCount}</span>
                                </div>
                                <div className="editor-actions">
                                    <button onClick={handleLockNote} className="action-btn" disabled={currentNote.isLocked && !isTemporarilyUnlocked}>
                                        <Lock size={14}/> Lock
                                    </button>
                                    <button onClick={handlePermanentUnlock} className="action-btn" disabled={!currentNote.isLocked}>
                                        <ShieldOff size={14}/> Unlock Permanently
                                    </button>
                                    <button onClick={() => handleSaveNote(true)} className="action-btn"><Save size={14}/> Save</button>
                                    <button onClick={() => handleDeleteNote(currentNoteId!)} className="action-btn danger"><Trash2 size={14}/> Delete</button>
                                </div>
                            </header>
                            <div className="editor-content">
                                <input
                                    type="text"
                                    className="note-title-input"
                                    placeholder="Note Title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    disabled={currentNote.isLocked && !isTemporarilyUnlocked}
                                />
                                {currentNote && (
                                    <div className="note-tags-container">
                                        {(currentNote.tags || []).map(tag => (
                                            <span className="note-tag" key={tag}>
                                                {tag}
                                                <button className="remove-tag-btn" onClick={() => handleRemoveTag(tag)} title="Remove tag">×</button>
                                            </span>
                                        ))}
                                        <input
                                            className="tag-input"
                                            type="text"
                                            placeholder="Add tag..."
                                            value={tagInput}
                                            onChange={e => setTagInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleAddTag(); }}
                                            maxLength={24}
                                        />
                                        <button className="add-tag-btn" onClick={handleAddTag} title="Add tag">+</button>
                                    </div>
                                )}
                                {/* Rich Text Editor Toolbar */}
                                {canEdit && editor && (
                                    <div className="tiptap-toolbar">
                                        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'active' : ''}><Bold size={16}/></button>
                                        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'active' : ''}><Italic size={16}/></button>
                                        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'active' : ''}><Underline size={16}/></button>
                                        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}><Heading size={16}/></button>
                                        <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={editor.isActive('highlight') ? 'active' : ''}><PaintBucket size={16}/></button>
                                        <input type="color" onChange={e => editor.chain().focus().setColor(e.target.value).run()} title="Text color" />
                                    </div>
                                )}
                                <EditorContent editor={editor} className="tiptap-editor" />
                            </div>
                        </>
                    ) : (
                        <div className="no-note-view">
                            <Plus size={64} />
                            <h1>Select a note or create a new one</h1>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
} 