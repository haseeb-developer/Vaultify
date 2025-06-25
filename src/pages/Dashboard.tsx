import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import * as CryptoJS from 'crypto-js';
import toast from 'react-hot-toast';
import { Plus, Lock, Trash2, Save, ShieldOff, Search, Bold, Italic, Underline, Heading, PaintBucket, X, Folder as FolderIcon, Palette, Tag, Edit3, XCircle, CheckCircle, Star } from 'lucide-react';
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

// Update Note interface to include folderId and isFavorite
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
  isFavorite?: boolean; // new
}

// Password Modal (Tailwind, animated, secure)
const PasswordModal = ({ note, onUnlock, onCancel }: { note: Note | null; onUnlock: (password: string) => void; onCancel: () => void; }) => {
    const [password, setPassword] = useState('');
    useEffect(() => {
        document.body.classList.add('overflow-hidden');
        return () => document.body.classList.remove('overflow-hidden');
    }, []);
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" aria-modal="true" role="dialog" tabIndex={-1}>
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-popIn scale-95 opacity-0 animate-fadeInModal">
                <button onClick={onCancel} className="absolute top-3 right-3 text-gray-400 hover:bg-blue-500 hover:text-white rounded-full p-2 transition-all duration-200 focus:ring-2 focus:ring-blue-400"><X size={20} /></button>
                <h2 className="text-2xl font-bold mb-2 text-blue-600">Enter Password</h2>
                <p className="mb-4 text-gray-500">This note is locked. Please enter the password to view it.</p>
                {note?.passwordHint && <p className="mb-4 text-sm italic bg-gray-100 rounded px-3 py-2 text-gray-500">Hint: {note.passwordHint}</p>}
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-b-2 border-gray-200 focus:border-blue-500 outline-none py-2 mb-6 text-lg transition-all duration-200 rounded-lg focus:bg-blue-50"
                    placeholder="Password"
                    autoFocus
                />
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="px-5 py-2 rounded-full bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 hover:scale-105 transition-all duration-200">Cancel</button>
                    <button onClick={() => onUnlock(password)} className="px-5 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:scale-105 transition-all duration-200">Unlock</button>
                </div>
            </div>
        </div>
    );
};

// Set Password Modal (Tailwind, animated, secure)
const SetPasswordModal = ({ onSetPassword, onCancel }: { onSetPassword: (password: string, hint: string) => void; onCancel: () => void; }) => {
    const [password, setPassword] = useState('');
    const [hint, setHint] = useState('');
    const [touched, setTouched] = useState(false);
    const minLength = 5;
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const tooShort = password.length > 0 && password.length < minLength;
    useEffect(() => {
        document.body.classList.add('overflow-hidden');
        return () => document.body.classList.remove('overflow-hidden');
    }, []);
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" aria-modal="true" role="dialog" tabIndex={-1}>
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-popIn scale-95 opacity-0 animate-fadeInModal">
                <button onClick={onCancel} className="absolute top-3 right-3 text-gray-400 hover:bg-blue-500 hover:text-white rounded-full p-2 transition-all duration-200 focus:ring-2 focus:ring-blue-400"><X size={20} /></button>
                <h2 className="text-2xl font-bold mb-2 text-blue-600">Set a Password</h2>
                <p className="mb-4 text-gray-500">Secure your note with a password. You can also add an optional hint.</p>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setTouched(true); }}
                    className="w-full border-b-2 border-gray-200 focus:border-blue-500 outline-none py-2 mb-1 text-lg transition-all duration-200 rounded-lg focus:bg-blue-50"
                    placeholder="Enter new password"
                    autoFocus
                />
                {/* Password validation feedback */}
                <div className="min-h-[1.5rem] mb-2">
                  {touched && password.length > 0 && (
                    <>
                      {tooShort && <span className="text-red-500 text-sm">Password must be at least {minLength} characters.</span>}
                      {!tooShort && <span className="text-green-600 text-sm">Password length is good.</span>}
                      <br />
                      {hasSpecial ? (
                        <span className="text-green-600 text-sm">Contains special character ✓</span>
                      ) : (
                        <span className="text-gray-500 text-sm">Add a special character for better security.</span>
                      )}
                    </>
                  )}
                </div>
                <input
                    type="text"
                    value={hint}
                    onChange={e => setHint(e.target.value)}
                    className="w-full border-b-2 border-gray-200 focus:border-blue-500 outline-none py-2 mb-6 text-lg transition-all duration-200 rounded-lg focus:bg-blue-50"
                    placeholder="Password hint (optional)"
                />
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="px-5 py-2 rounded-full bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 hover:scale-105 transition-all duration-200">Cancel</button>
                    <button onClick={() => onSetPassword(password, hint)} className="px-5 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:scale-105 transition-all duration-200" disabled={tooShort}>Set Password & Lock</button>
                </div>
            </div>
        </div>
    );
};

// FolderModal: add same modal enhancements
const FolderModal = ({ onCreate, onCancel }: { onCreate: (name: string, color: string) => void; onCancel: () => void; }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#4f8cff');
    useEffect(() => {
        document.body.classList.add('overflow-hidden');
        return () => document.body.classList.remove('overflow-hidden');
    }, []);
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" aria-modal="true" role="dialog" tabIndex={-1}>
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-popIn scale-95 opacity-0 animate-fadeInModal">
                <button onClick={onCancel} className="absolute top-3 right-3 text-gray-400 hover:bg-blue-500 hover:text-white rounded-full p-2 transition-all duration-200 focus:ring-2 focus:ring-blue-400"><X size={20} /></button>
                <h2 className="text-xl font-bold mb-2 text-blue-600 flex items-center"><FolderIcon size={20} className="mr-2" /> Create Folder</h2>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full border-b-2 border-gray-200 focus:border-blue-500 outline-none py-2 mb-4 text-lg transition-all duration-200 rounded-lg focus:bg-blue-50"
                    placeholder="Folder name"
                    autoFocus
                />
                <div className="flex items-center gap-4 my-4">
                    <Palette size={18} className="opacity-70" />
                    <input
                        type="color"
                        value={color}
                        onChange={e => setColor(e.target.value)}
                        className="w-10 h-10 rounded-full border-2 border-blue-200 shadow cursor-pointer"
                        title="Pick folder color"
                    />
                    <span className="text-base text-gray-500">Choose color</span>
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="px-5 py-2 rounded-full bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 hover:scale-105 transition-all duration-200">Cancel</button>
                    <button onClick={() => onCreate(name, color)} className="px-5 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:scale-105 transition-all duration-200" disabled={!name.trim()}>Create Folder</button>
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
    const [noteFilter, setNoteFilter] = useState<'all' | 'locked' | 'unlocked' | 'favorite'>('all');
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [showMarkdown, setShowMarkdown] = useState(false);

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

    // Add favorite filter to noteFilter state
    const handleToggleFavorite = async (noteId: string) => {
        const updatedNotes = notes.map(n => n.id === noteId ? { ...n, isFavorite: !n.isFavorite } : n);
        await saveDataToClerk(updatedNotes, folders);
    };

    // Search notes by title
    const filteredNotes: Note[] = notes.filter(note => {
        if (noteFilter === 'favorite') return note.isFavorite;
        if (noteFilter === 'locked') return note.isLocked;
        if (noteFilter === 'unlocked') return !note.isLocked;
        return note.title.toLowerCase().includes(search.toLowerCase());
    });

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
            <div className="notes-dashboard-container flex flex-col lg:flex-row w-full h-full min-h-screen gap-0 lg:gap-6 xl:gap-10 overflow-x-hidden">
                {/* SIDEBAR START */}
                <aside className="w-full lg:w-[370px] xl:w-[400px] flex-shrink-0 bg-gradient-to-br from-blue-100/80 via-white/80 to-blue-200/80 backdrop-blur-2xl shadow-2xl rounded-b-3xl lg:rounded-3xl p-4 sm:p-6 flex flex-col gap-6 border border-blue-200/60 relative z-10 overflow-y-auto max-h-[90vh] lg:max-h-[calc(100vh-40px)] min-h-[0]">
                    {/* Search */}
                    <div className="flex items-center gap-3 bg-white/70 rounded-xl shadow-inner px-4 py-3 mb-2 border border-blue-100/60">
                        <Search size={22} className="text-blue-400" />
                    <input
                        type="text"
                        placeholder="Search notes by title..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-lg text-blue-900 placeholder:text-blue-300 font-medium"
                    />
                </div>
                    {/* Folders Header */}
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-2xl font-extrabold text-blue-700 flex items-center gap-2 tracking-tight"><FolderIcon size={26} className="text-blue-400" />Folders</h2>
                        <button onClick={handleCreateFolder} className="bg-gradient-to-r from-blue-500 to-blue-400 text-white font-bold rounded-full px-5 py-2 flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"><Plus size={20}/> New Folder</button>
                    </div>
                    {/* Folders List */}
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFolderDragEnd}>
                        <SortableContext items={folders.map(f => f.id)} strategy={verticalListSortingStrategy}>
                            <div className="flex flex-col gap-3">
                                {/* Other Notes */}
                        <div
                                    className={`group relative flex items-center gap-3 min-h-[60px] rounded-2xl px-5 py-3 cursor-pointer shadow-md border-2 transition-all duration-200 ${currentFolderId === null ? 'bg-gradient-to-r from-blue-400 to-blue-300 text-white border-blue-500 scale-[1.03]' : 'bg-white/80 border-blue-100 hover:scale-105'}`}
                            onClick={() => setCurrentFolderId(null)}
                                >
                                    <FolderIcon size={24} className={`mr-2 ${currentFolderId === null ? 'text-white' : 'text-blue-400'}`} />
                                    <span className="flex-1 font-bold text-lg">Other Notes</span>
                                    <span className={`rounded-full px-4 py-1 font-extrabold text-base shadow ${currentFolderId === null ? 'bg-white text-blue-500' : 'bg-pink-500 text-white'}`}>N: {notes.filter(n => !n.folderId).length}</span>
                        </div>
                                {/* User Folders */}
                        {folders.map(folder => (
                            <div
                                key={folder.id}
                                        className={`group relative flex items-center gap-3 min-h-[60px] rounded-2xl px-5 py-3 cursor-pointer shadow-md border-2 transition-all duration-200 ${currentFolderId === folder.id ? 'bg-gradient-to-r from-white via-blue-200 to-blue-400 text-blue-900 border-blue-400 scale-[1.03]' : 'bg-white/80 border-blue-100 hover:scale-105'}`}
                                onClick={() => setCurrentFolderId(folder.id)}
                                        style={{ borderLeft: `8px solid ${folder.color}` }}
                                    >
                                        <FolderIcon size={22} className="mr-2" style={{ color: folder.color }} />
                                        <span className="flex-1 font-bold text-lg" style={{ color: folder.color }}>{folder.name}</span>
                                        <span className="rounded-full px-4 py-1 font-extrabold text-base bg-pink-500 text-white shadow">{notes.filter(n => n.folderId === folder.id).length}</span>
                                <button
                                            className="ml-2 bg-pink-100 hover:bg-pink-200 border border-pink-200 rounded-full p-2 flex items-center justify-center transition"
                                    title="Rename Folder"
                                    onClick={e => { e.stopPropagation(); handleRenameFolder(folder.id); }}
                                        >
                                            <Palette size={16} style={{ color: folder.color }} />
                                        </button>
                                <button
                                            className="ml-2 bg-pink-100 hover:bg-pink-200 border border-pink-200 rounded-full p-2 flex items-center justify-center transition"
                                    title="Delete Folder"
                                    onClick={e => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                                        >
                                            <Trash2 size={16} className="text-pink-500" />
                                        </button>
                            </div>
                        ))}
                    </div>
                        </SortableContext>
                    </DndContext>
                    {/* Notes Header */}
                    <div className="flex items-center justify-between mt-6 mb-1">
                        <h2 className="text-2xl font-extrabold text-blue-700 flex items-center gap-2 tracking-tight"><Edit3 size={24} className="text-blue-400" />Notes</h2>
                        <button onClick={handleNewNote} className="bg-gradient-to-r from-blue-500 to-blue-400 text-white font-bold rounded-full px-5 py-2 flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"><Plus size={20}/> New Note</button>
                    </div>
                    {/* Note Filters */}
                    <div className="flex flex-wrap gap-3 mb-3">
                        <button
                            className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold text-lg shadow transition-all duration-150 ${noteFilter === 'all' ? 'bg-blue-500 text-white scale-105' : 'bg-white/80 text-blue-500 border border-blue-200 hover:bg-blue-100 hover:scale-105'}`}
                            onClick={() => setNoteFilter('all')}
                        ><span>All</span></button>
                        <button
                            className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold text-lg shadow transition-all duration-150 ${noteFilter === 'locked' ? 'bg-blue-500 text-white scale-105' : 'bg-white/80 text-blue-500 border border-blue-200 hover:bg-blue-100 hover:scale-105'}`}
                            onClick={() => setNoteFilter('locked')}
                        ><Lock size={18}/> Locked</button>
                        <button
                            className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold text-lg shadow transition-all duration-150 ${noteFilter === 'unlocked' ? 'bg-blue-500 text-white scale-105' : 'bg-white/80 text-blue-500 border border-blue-200 hover:bg-blue-100 hover:scale-105'}`}
                            onClick={() => setNoteFilter('unlocked')}
                        >No Lock</button>
                        <button
                            className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold text-lg shadow transition-all duration-150 ${noteFilter === 'favorite' ? 'bg-yellow-400 text-white scale-105' : 'bg-white/80 text-yellow-500 border border-yellow-200 hover:bg-yellow-100 hover:scale-105'}`}
                            onClick={() => setNoteFilter('favorite')}
                        ><Star size={18}/> Fav</button>
                    </div>
                    {/* Notes List */}
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleNoteDragEnd}>
                        <SortableContext items={filteredNotes.filter(note => (currentFolderId === null ? !note.folderId : note.folderId === currentFolderId)).map(n => n.id)} strategy={verticalListSortingStrategy}>
                            <div className="flex flex-col gap-3">
                            {filteredNotes
                                .filter(note => (currentFolderId === null ? !note.folderId : note.folderId === currentFolderId))
                                .map((note: Note, idx) => {
                                    const folder = folders.find(f => f.id === note.folderId);
                                    const borderColor = currentFolderId === null && folder ? folder.color : 'transparent';
                                    const isLocked = note.isLocked;
                                    return (
                                        <div
                                            key={note.id}
                                                className={`group flex items-center gap-3 min-h-[60px] rounded-2xl px-5 py-3 cursor-pointer shadow-md transition-all duration-200 ${note.id === currentNoteId ? 'bg-gradient-to-l from-blue-400 to-blue-200 text-white border-blue-500 scale-[1.03]' : 'bg-white/80 border-blue-100 hover:scale-105'}`}
                                            onClick={() => handleSelectNote(note)}
                                                style={{ borderLeft: `8px solid ${borderColor}` }}
                                            data-id={note.id}
                                        >
                                                <span className="font-extrabold text-2xl mr-2" style={{ color: note.id === currentNoteId ? '#fff' : '#3b82f6' }}>{idx + 1}.</span>
                                                <div className="flex-1">
                                                    <h3 className={`flex items-center gap-1 font-bold text-lg ${note.id === currentNoteId ? 'text-white' : 'text-blue-900'}`}>{isLocked && <Lock size={16} className="lock-animated" />} {note.title}</h3>
                                                    <p className="text-xs text-gray-400">{new Date(note.updatedAt).toLocaleDateString()}</p>
                                            </div>
                                                <button
                                                    className={`ml-2 rounded-xl p-2 shadow transition-all duration-150 ${note.isFavorite ? 'bg-yellow-400' : 'bg-gray-900'} hover:scale-110`}
                                                    onClick={e => { e.stopPropagation(); handleToggleFavorite(note.id); }}
                                                    title={note.isFavorite ? 'Unfavorite' : 'Favorite'}
                                                >
                                                    <Star size={22} fill={note.isFavorite ? '#fff' : 'none'} stroke="#fff" />
                                                </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                </aside>
                {/* SIDEBAR END */}
                <main className="editor-main flex-1 w-full min-w-0 bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-t-3xl lg:rounded-3xl shadow-2xl p-2 sm:p-4 md:p-6 xl:p-8 flex flex-col gap-6 animate-fadeIn overflow-x-auto">
                    {currentNote ? (
                        <>
                            {/* Header Info and Actions */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-2 px-2">
                                <div className="flex flex-col gap-1">
                                    <span className="text-gray-400 text-sm font-semibold">Last modified: <span className="text-blue-500">{new Date(currentNote.updatedAt).toLocaleString()}</span></span>
                                    <span className="text-gray-400 text-sm font-semibold">Words: <span className="text-blue-500">{wordCount}</span></span>
                                </div>
                                <div className="flex items-center gap-2 editor-actions">
                                    <button onClick={handleLockNote} className="action-btn" disabled={currentNote.isLocked && !isTemporarilyUnlocked}>
                                        <Lock size={14}/> Lock
                                    </button>
                                    <button onClick={handlePermanentUnlock} className="action-btn" disabled={!currentNote.isLocked}>
                                        <ShieldOff size={14}/> Unlock Permanently
                                    </button>
                                    <button onClick={() => handleSaveNote(true)} className="action-btn"><Save size={14}/> Save</button>
                                    <button onClick={() => handleDeleteNote(currentNoteId!)} className="action-btn danger"><Trash2 size={14}/> Delete</button>
                                </div>
                                {/* Auto-save indicator */}
                                <span className="text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-green-400 to-blue-400 text-white shadow animate-pulse">Saved</span>
                            </div>
                            {/* Title Input */}
                                <input
                                    type="text"
                                className="w-full text-4xl font-extrabold bg-white/70 rounded-2xl px-6 py-4 shadow-lg border-2 border-blue-100 focus:border-blue-400 outline-none transition-all duration-200 mb-2 animate-popIn placeholder:italic placeholder:text-blue-200"
                                    placeholder="Note Title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    disabled={currentNote.isLocked && !isTemporarilyUnlocked}
                                style={{ letterSpacing: '-0.01em' }}
                                />
                            {/* Tags */}
                            <div className="flex flex-wrap items-center gap-2 mb-2 animate-fadeIn">
                                        {(currentNote.tags || []).map(tag => (
                                    <span key={tag} className="flex items-center gap-1 px-4 py-2 rounded-full font-semibold text-white shadow bg-gradient-to-r from-blue-400 to-blue-600 animate-popIn">
                                        <Tag size={16} className="opacity-80" />
                                        <span>{tag}</span>
                                        <button onClick={() => handleRemoveTag(tag)} className="ml-1 bg-white/30 hover:bg-pink-500 hover:text-white rounded-full p-1 transition-all"><XCircle size={15}/></button>
                                            </span>
                                        ))}
                                {/* Tag input */}
                                <div className="relative">
                                    <div className="flex items-center gap-2 bg-white/70 border-2 border-blue-100 rounded-full px-4 py-2 shadow-inner">
                                        <Tag size={16} className="opacity-70" />
                                            <input
                                            className={`bg-transparent outline-none text-blue-700 font-semibold w-28 placeholder:text-blue-300 ${tagError ? 'text-pink-500' : ''}`}
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
                                        <button className="ml-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 transition-all" onClick={handleAddTag} title="Add tag"><CheckCircle size={16}/></button>
                                    </div>
                                    {/* Tag suggestions dropdown */}
                                            {showSuggestions && tagSuggestions.length > 0 && (
                                        <div className="absolute left-0 mt-2 z-20 bg-white rounded-xl shadow-lg border border-blue-100 w-48 animate-popIn">
                                                    {tagSuggestions.map((sugg, idx) => (
                                                        <div
                                                            key={sugg}
                                                    className={`flex items-center gap-2 px-4 py-2 cursor-pointer rounded-xl transition-all ${selectedSuggestion === idx ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50'}`}
                                                            onMouseDown={() => { setTagInput(sugg); setShowSuggestions(false); setTimeout(handleAddTag, 0); }}
                                                        >
                                                    <Tag size={13} className="opacity-70" /> {sugg}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                    {tagError && <span className="absolute left-0 mt-2 text-pink-500 text-xs animate-fadeIn">{tagError}</span>}
                                        </div>
                            </div>
                            {/* Toolbar */}
                            {canEdit && editor && (
                                <div className="flex items-center gap-3 bg-white/70 border-2 border-blue-100 rounded-2xl px-6 py-3 shadow-lg mb-2 animate-popIn sticky top-0 z-20">
                                    <button onClick={() => editor.chain().focus().toggleBold().run()} className={`text-xl p-2 rounded-full transition-all ${editor.isActive('bold') ? 'bg-blue-500 text-white scale-110' : 'hover:bg-blue-700 text-white'}`} title="Bold (Ctrl+B)"><Bold size={20}/></button>
                                    <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`text-xl p-2 rounded-full transition-all ${editor.isActive('italic') ? 'bg-blue-500 text-white scale-110' : 'hover:bg-blue-700 text-white'}`} title="Italic (Ctrl+I)"><Italic size={20}/></button>
                                    <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`text-xl p-2 rounded-full transition-all ${editor.isActive('underline') ? 'bg-blue-500 text-white scale-110' : 'hover:bg-blue-700 text-white'}`} title="Underline (Ctrl+U)"><Underline size={20}/></button>
                                    <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`text-xl p-2 rounded-full transition-all ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white scale-110' : 'hover:bg-blue-700 text-white'}`} title="Heading (Ctrl+H)"><Heading size={20}/></button>
                                    <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={`text-xl p-2 rounded-full transition-all ${editor.isActive('highlight') ? 'bg-blue-500 text-white scale-110' : 'hover:bg-blue-700 text-white'}`} title="Highlight"><PaintBucket size={20}/></button>
                                    <input type="color" onChange={e => editor.chain().focus().setColor(e.target.value).run()} title="Text color" className="w-8 h-8 rounded-full border-2 border-blue-200 cursor-pointer ml-2" />
                                    {/* Markdown preview toggle */}
                                    <button className="ml-auto px-4 py-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 text-white font-bold shadow hover:scale-105 transition-all" onClick={() => setShowMarkdown(prev => !prev)}>{showMarkdown ? 'Editor' : 'Preview'}</button>
                                    </div>
                                )}
                            {/* Editor Area */}
                            <div className="relative flex-1 flex flex-col animate-fadeIn">
                                {/* Markdown Preview */}
                                {showMarkdown ? (
                                    <div className="w-full min-h-[300px] bg-white/80 border-2 border-blue-100 rounded-2xl p-6 shadow-inner text-lg font-mono text-blue-900 overflow-auto animate-popIn prose max-w-none">
                                        {/* Use a markdown parser if available, else fallback to raw HTML */}
                                        <div dangerouslySetInnerHTML={{ __html: editor ? editor.getHTML() : '' }} />
                                    </div>
                                ) : (
                                    <EditorContent editor={editor} className="tiptap-editor w-full min-h-[300px] flex-1 bg-white/80 border-2 border-blue-100 rounded-2xl p-6 shadow-inner text-lg text-blue-900 outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-200 animate-popIn" />
                                )}
                                {/* Word/char counter */}
                                <div className="flex items-center justify-end gap-4 mt-2 text-xs text-gray-400 font-semibold animate-fadeIn">
                                    <span>Words: {wordCount}</span>
                                    <span>Chars: {editor ? editor.getText().length : 0}</span>
                                </div>
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