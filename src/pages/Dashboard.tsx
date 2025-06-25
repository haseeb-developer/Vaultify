import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import * as CryptoJS from 'crypto-js';
import toast from 'react-hot-toast';
import { Plus, Lock, Trash2, Save, ShieldOff, Search, Bold, Italic, Underline, Heading, PaintBucket, X, Folder as FolderIcon, Palette, Tag, XCircle, CheckCircle } from 'lucide-react';
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
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

// Define the structure of a Folder
interface Folder {
  id: string;
  name: string;
  color: string; // HEX or CSS color
  parentId?: string; // for nested folders
  createdAt: string;
  updatedAt: string;
}

// Update Note interface to include folderId
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
  folderId?: string; // reference to the folder/group
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

const FolderModal = ({ onCreate, onCancel }: { onCreate: (name: string, color: string) => void; onCancel: () => void; }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#4f8cff');
    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <button onClick={onCancel} className="modal-close-btn"><X size={20} /></button>
                <h2><FolderIcon size={20} style={{marginRight: 8, verticalAlign: 'middle'}} /> Create Folder</h2>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="modal-input"
                    placeholder="Folder name"
                    autoFocus
                />
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.2rem 0'}}>
                    <Palette size={18} style={{opacity: 0.7}} />
                    <input
                        type="color"
                        value={color}
                        onChange={e => setColor(e.target.value)}
                        style={{width: 36, height: 36, border: 'none', borderRadius: '50%', boxShadow: '0 2px 8px #0001', cursor: 'pointer'}}
                        title="Pick folder color"
                    />
                    <span style={{fontSize: '1.05rem', color: '#888'}}>Choose color</span>
                </div>
                <div className="modal-actions">
                    <button onClick={onCancel} className="modal-button secondary">Cancel</button>
                    <button onClick={() => onCreate(name, color)} className="modal-button primary" disabled={!name.trim()}>Create Folder</button>
                </div>
            </div>
        </div>
    );
};

export default function Dashboard() {
    const { user } = useUser();
    const [notes, setNotes] = useState<Note[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]); // new state for folders
    const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null); // selected folder
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
    const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState<number>(-1);
    const [tagError, setTagError] = useState<string | null>(null);
    const [noteFilter, setNoteFilter] = useState<'all' | 'locked' | 'unlocked'>('all');
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

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
        if (user?.unsafeMetadata.notes || user?.unsafeMetadata.folders) {
            const loadedNotes = (user.unsafeMetadata.notes as Note[]) || [];
            const loadedFolders = (user.unsafeMetadata.folders as Folder[]) || [];
            const sortedNotes = loadedNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            const sortedFolders = loadedFolders.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            setNotes(sortedNotes);
            setFolders(sortedFolders);
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

    const saveDataToClerk = async (updatedNotes: Note[], updatedFolders: Folder[]) => {
        try {
            await user?.update({ unsafeMetadata: { notes: updatedNotes, folders: updatedFolders } });
            setNotes(updatedNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
            setFolders(updatedFolders.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
            return true;
        } catch (error) { toast.error('Failed to save data.'); return false; }
    };

    const handleNewNote = async () => {
        const newNote: Note = {
            id: new Date().toISOString(),
            title: 'Untitled Note',
            content: '',
            isLocked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            folderId: currentFolderId || undefined,
        };
        const updatedNotes = [newNote, ...notes];
        if (await saveDataToClerk(updatedNotes, folders)) {
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
        if (await saveDataToClerk(updatedNotes, folders) && isManualSave) {
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
                saveDataToClerk(updatedNotes, folders);
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
        if (await saveDataToClerk(updatedNotes, folders)) {
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
        if (await saveDataToClerk(updatedNotes, folders)) {
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

    // Gather all unique tags for suggestions and tag cloud
    const allTags = Array.from(new Set(notes.flatMap(n => n.tags || [])));
    const tagUsage: { [tag: string]: number } = {};
    notes.forEach(n => (n.tags || []).forEach(tag => { tagUsage[tag] = (tagUsage[tag] || 0) + 1; }));

    // Color for each tag (hash-based)
    function tagColor(tag: string) {
        // Simple hash to color
        let hash = 0;
        for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
        const color = `hsl(${hash % 360}, 70%, 60%)`;
        return color;
    }

    // Autocomplete suggestions
    function updateTagSuggestions(input: string) {
        if (!input) { setTagSuggestions([]); return; }
        const lower = input.toLowerCase();
        setTagSuggestions(allTags.filter(t => t.toLowerCase().includes(lower) && !(currentNote?.tags || []).includes(t)));
    }

    // Add tag with validation
    const handleAddTag = () => {
        if (!currentNote || !tagInput.trim()) return;
        const tag = tagInput.trim();
        if ((currentNote.tags || []).map(t => t.toLowerCase()).includes(tag.toLowerCase())) {
            setTagError('Tag already added');
            return;
        }
        if (tag.length > 24) {
            setTagError('Tag too long');
            return;
        }
        const updatedNotes = notes.map(n =>
            n.id === currentNoteId ? { ...n, tags: [...(n.tags || []), tag], updatedAt: new Date().toISOString() } : n
        );
        saveDataToClerk(updatedNotes, folders);
        setTagInput('');
        setTagSuggestions([]);
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
        setTagError(null);
    };

    // Remove tag from current note
    const handleRemoveTag = (tagToRemove: string) => {
        if (!currentNote) return;
        const updatedNotes = notes.map(n =>
            n.id === currentNoteId ? { ...n, tags: (n.tags || []).filter(t => t !== tagToRemove), updatedAt: new Date().toISOString() } : n
        );
        saveDataToClerk(updatedNotes, folders);
    };

    // Search notes by title
    const filteredNotes: Note[] = notes.filter(note => note.title.toLowerCase().includes(search.toLowerCase()));

    // Folder creation logic (now uses modal)
    function handleCreateFolder() {
        setIsFolderModalOpen(true);
    }
    async function handleCreateFolderSubmit(name: string, color: string) {
        const newFolder: Folder = {
            id: new Date().toISOString(),
            name,
            color,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const updatedFolders = [newFolder, ...folders];
        await saveDataToClerk(notes, updatedFolders);
        setIsFolderModalOpen(false);
    }

    // Folder rename/delete logic
    function handleRenameFolder(folderId: string) {
        const folder = folders.find(f => f.id === folderId);
        if (!folder) return;
        const name = prompt('Rename folder:', folder.name);
        if (!name || name === folder.name) return;
        const updatedFolders = folders.map(f => f.id === folderId ? { ...f, name, updatedAt: new Date().toISOString() } : f);
        saveDataToClerk(notes, updatedFolders);
    }

    function handleDeleteFolder(folderId: string) {
        if (!window.confirm('Are you sure you want to delete this folder? Notes in this folder will not be deleted.')) return;
        const updatedFolders = folders.filter(f => f.id !== folderId);
        // Optionally, move notes out of the deleted folder
        const updatedNotes = notes.map(n => n.folderId === folderId ? { ...n, folderId: undefined } : n);
        saveDataToClerk(updatedNotes, updatedFolders);
        if (currentFolderId === folderId) setCurrentFolderId(null);
    }

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );
    // DnD handlers (folders)
    function handleFolderDragEnd(event: any) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = folders.findIndex(f => f.id === active.id);
        const newIndex = folders.findIndex(f => f.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        const newFolders = arrayMove(folders, oldIndex, newIndex);
        saveDataToClerk(notes, newFolders);
    }
    // DnD handlers (notes in All Notes)
    function handleNoteDragEnd(event: any) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const visibleNotes = filteredNotes.filter(note => currentFolderId === null || note.folderId === currentFolderId);
        const oldIndex = visibleNotes.findIndex(n => n.id === active.id);
        const newIndex = visibleNotes.findIndex(n => n.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        const reordered = arrayMove(visibleNotes, oldIndex, newIndex);
        // Update notes order in state (persist order by updating updatedAt)
        const reorderedNotes = notes.map(n => {
            const idx = reordered.findIndex(rn => rn.id === n.id);
            return idx !== -1 ? { ...n, updatedAt: new Date(Date.now() + idx).toISOString() } : n;
        });
        saveDataToClerk(reorderedNotes, folders);
    }

    if (isLoading) return <div className="loading-container"><h2>Loading...</h2></div>;

    return (
        <>
            {isUnlockModalOpen && <PasswordModal note={noteToProcess} onUnlock={handleUnlockSubmit} onCancel={() => setIsUnlockModalOpen(false)} />}
            {isSetPasswordModalOpen && <SetPasswordModal onSetPassword={handleSetPassword} onCancel={() => setIsSetPasswordModalOpen(false)} />}
            {isFolderModalOpen && <FolderModal onCreate={handleCreateFolderSubmit} onCancel={() => setIsFolderModalOpen(false)} />}
            <div className="notes-dashboard-container">
                
                <div className="notes-sidebar">
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
                    <div className="sidebar-header">
                        <h2>Folders</h2>
                        <button className="new-note-btn" onClick={handleCreateFolder}><Plus size={18} /> New Folder</button>
                    </div>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFolderDragEnd}>
                        <SortableContext items={folders.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    <div className="folders-list">
                        <div
                                    className={`folder-card all-notes-card ${currentFolderId === null ? 'active' : ''}`}
                            onClick={() => setCurrentFolderId(null)}
                                    style={{
                                        background: currentFolderId === null
                                            ? 'linear-gradient(90deg, #4f8cff 0%, #a5b4fc 100%)'
                                            : 'rgba(245,248,255,0.98)',
                                        color: currentFolderId === null ? '#fff' : 'var(--accent-color)',
                                        borderLeft: currentFolderId === null ? '6px solid #4f8cff' : '6px solid #e3e6ea',
                                        fontWeight: 800,
                                        display: 'flex', alignItems: 'center', minHeight: 56, borderRadius: 18, marginBottom: 8, boxShadow: currentFolderId === null ? '0 2px 16px #4f8cff22' : '0 1px 4px #0001',
                                        padding: '0.7rem 1.2rem',
                                        fontSize: '1.18rem',
                                        letterSpacing: '-0.01em',
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                        >
                                    <FolderIcon size={22} style={{marginRight: 12, color: currentFolderId === null ? '#fff' : '#4f8cff', opacity: 0.95}} />
                                    <span style={{flex: 1}}>Other Notes</span>
                                    <span style={{background: currentFolderId === null ? '#fff' : '#e11d48', color: currentFolderId === null ? '#4f8cff' : '#fff', borderRadius: 16, fontWeight: 900, fontSize: '1.05rem', padding: '0.18rem 1.1rem', marginLeft: 8, boxShadow: '0 2px 8px #0001', letterSpacing: '0.01em', minWidth: 32, textAlign: 'center', display: 'inline-block'}}>
                                        N: {notes.filter(n => !n.folderId).length}
                                    </span>
                        </div>
                        {folders.map(folder => (
                            <div
                                key={folder.id}
                                className={`folder-card ${currentFolderId === folder.id ? 'active' : ''}`}
                                onClick={() => setCurrentFolderId(folder.id)}
                                        style={{
                                            borderLeft: `6px solid ${folder.color}`,
                                            background: currentFolderId === folder.id ? 'linear-gradient(90deg, ' + folder.color + ' 0%, #fff 100%)' : 'rgba(245,248,255,0.98)',
                                            color: currentFolderId === folder.id ? '#fff' : folder.color,
                                            fontWeight: 700,
                                            display: 'flex', alignItems: 'center', minHeight: 56, borderRadius: 18, marginBottom: 8, boxShadow: currentFolderId === folder.id ? '0 2px 16px ' + folder.color + '22' : '0 1px 4px #0001',
                                            padding: '0.7rem 1.2rem',
                                            fontSize: '1.13rem',
                                            letterSpacing: '-0.01em',
                                            position: 'relative',
                                            overflow: 'hidden',
                                        }}
                            >
                                        <FolderIcon size={20} style={{color: folder.color, marginRight: 10, opacity: 0.95}} />
                                        <span style={{flex: 1}}>{folder.name}</span>
                                        <span style={{background: '#e11d48', color: '#fff', borderRadius: 16, fontWeight: 900, fontSize: '1.05rem', padding: '0.18rem 1.1rem', marginLeft: 8, boxShadow: '0 2px 8px #0001', letterSpacing: '0.01em', minWidth: 1, textAlign: 'center', display: 'inline-block'}}>
                                            {notes.filter(n => n.folderId === folder.id).length}
                                        </span> 
                                <button
                                    className="folder-action-btn"
                                    title="Rename Folder"
                                    onClick={e => { e.stopPropagation(); handleRenameFolder(folder.id); }}
                                            style={{marginLeft: 8, background: '#f3f4f6', border: 'none', borderRadius: 12, padding: 4, display: 'flex', alignItems: 'center', boxShadow: '0 1px 4px #0001'}}
                                        >
                                            <Palette size={16} style={{color: folder.color}} />
                                        </button>
                                <button
                                    className="folder-action-btn danger"
                                    title="Delete Folder"
                                    onClick={e => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                                            style={{marginLeft: 8, background: '#f3f4f6', border: 'none', borderRadius: 12, padding: 4, display: 'flex', alignItems: 'center', boxShadow: '0 1px 4px #0001'}}
                                        >
                                            <Trash2 size={16} style={{color: '#e11d48'}} />
                                        </button>
                            </div>
                        ))}
                    </div>
                        </SortableContext>
                    </DndContext>
                    <div className="sidebar-header" style={{marginTop: '2rem'}}>
                        <h2>Notes</h2>
                        <button className="new-note-btn" onClick={handleNewNote}><Plus size={18} /> New Note</button>
                    </div>
                    {/* Note filter buttons */}
                    <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '1.2rem', justifyContent: 'space-between' }}>
                        <button
                            className={noteFilter === 'all' ? 'note-filter-btn active' : 'note-filter-btn'}
                            onClick={() => setNoteFilter('all')}
                        >All</button>
                        <button
                            className={noteFilter === 'locked' ? 'note-filter-btn active' : 'note-filter-btn'}
                            onClick={() => setNoteFilter('locked')}
                        >Locked Notes</button>
                        <button
                            className={noteFilter === 'unlocked' ? 'note-filter-btn active' : 'note-filter-btn'}
                            onClick={() => setNoteFilter('unlocked')}
                        >No Lock Notes</button>
                    </div>
                 
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleNoteDragEnd}>
                        <SortableContext items={filteredNotes.filter(note => (currentFolderId === null ? !note.folderId : note.folderId === currentFolderId)).map(n => n.id)} strategy={verticalListSortingStrategy}>
                            <div className="notes-list-cards">
                            {filteredNotes
                                .filter(note => (currentFolderId === null ? !note.folderId : note.folderId === currentFolderId))
                                .filter(note =>
                                    noteFilter === 'all' ? true :
                                    noteFilter === 'locked' ? note.isLocked :
                                    !note.isLocked
                                )
                                .map((note: Note, idx) => {
                                    const folder = folders.find(f => f.id === note.folderId);
                                    const borderColor = currentFolderId === null && folder ? folder.color : 'transparent';
                                    // Get a plain text preview (first 80 chars or 1 line)
                                    let preview = '';
                                    if (note.content) {
                                        const div = document.createElement('div');
                                        div.innerHTML = note.content;
                                        preview = div.textContent || div.innerText || '';
                                        preview = preview.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
                                        if (preview.length === 80) preview += '...';
                                    }
                                    const isLocked = note.isLocked;
                                    return (
                                        <div
                                            key={note.id}
                                            className={`note-card${isLocked ? ' locked' : ''} ${note.id === currentNoteId ? 'active' : ''}`}
                                            onClick={() => handleSelectNote(note)}
                                            style={{ borderLeftColor: borderColor }}
                                            data-id={note.id}
                                        >
                                            <span>{idx + 1}.</span>
                                            <div className="note-card-content">
                                                <h3>{isLocked && <Lock size={16} className="lock-animated" />} {note.title}</h3>
                                                <div className="note-preview">{preview}</div>
                                                <p>{new Date(note.updatedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
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
                                    <div className="note-tags-container ultra-tags">
                                        {(currentNote.tags || []).map(tag => (
                                            <span className="note-tag ultra-tag" key={tag} style={{ background: tagColor(tag) }}>
                                                <Tag size={15} style={{marginRight: 5, opacity: 0.8}} />
                                                <span className="tag-label">{tag}</span>
                                                <button className="remove-tag-btn" onClick={() => handleRemoveTag(tag)} title="Remove tag"><XCircle size={15}/></button>
                                            </span>
                                        ))}
                                        <div className="tag-input-wrapper">
                                            <Tag size={16} style={{marginRight: 4, opacity: 0.7}} />
                                            <input
                                                className={`tag-input ultra-tag-input${tagError ? ' error' : ''}`}
                                                type="text"
                                                placeholder="Add tag..."
                                                value={tagInput}
                                                onChange={e => { setTagInput(e.target.value); setTagError(null); updateTagSuggestions(e.target.value); setShowSuggestions(true); setSelectedSuggestion(-1); }}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        if (showSuggestions && selectedSuggestion >= 0 && tagSuggestions[selectedSuggestion]) {
                                                            setTagInput(tagSuggestions[selectedSuggestion]);
                                                            setShowSuggestions(false);
                                                            setSelectedSuggestion(-1);
                                                            setTimeout(handleAddTag, 0);
                                                        } else {
                                                            handleAddTag();
                                                        }
                                                    } else if (e.key === 'ArrowDown') {
                                                        setSelectedSuggestion(s => Math.min(s + 1, tagSuggestions.length - 1));
                                                    } else if (e.key === 'ArrowUp') {
                                                        setSelectedSuggestion(s => Math.max(s - 1, 0));
                                                    } else if (e.key === 'Escape') {
                                                        setShowSuggestions(false);
                                                    }
                                                }}
                                                maxLength={24}
                                                onFocus={() => { updateTagSuggestions(tagInput); setShowSuggestions(true); }}
                                                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                                            />
                                            <button className="add-tag-btn" onClick={handleAddTag} title="Add tag"><CheckCircle size={16}/></button>
                                            {tagError && <span className="tag-error">{tagError}</span>}
                                            {showSuggestions && tagSuggestions.length > 0 && (
                                                <div className="tag-suggestions-dropdown">
                                                    {tagSuggestions.map((sugg, idx) => (
                                                        <div
                                                            key={sugg}
                                                            className={`tag-suggestion${selectedSuggestion === idx ? ' selected' : ''}`}
                                                            onMouseDown={() => { setTagInput(sugg); setShowSuggestions(false); setTimeout(handleAddTag, 0); }}
                                                            style={{ background: tagColor(sugg) }}
                                                        >
                                                            <Tag size={13} style={{marginRight: 4, opacity: 0.7}} /> {sugg}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
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
                        <div className="no-note-view advanced-empty-view">
                            <div className="empty-card">
                                <div className="empty-icon-gradient">
                                    <Plus size={64} />
                                </div>
                                <h1>Welcome to Your Notes!</h1>
                                <p className="empty-desc">Select a note from the sidebar or start fresh by creating a new one.<br/>Organize, lock, and tag your notes with ease.</p>
                                <button className="create-note-cta" onClick={handleNewNote}><Plus size={20} style={{marginRight: 8}}/> Create New Note</button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
} 