import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import * as CryptoJS from 'crypto-js';
import toast from 'react-hot-toast';
import { Plus, Lock, Trash2, Save, ShieldOff, Search, Bold, Italic, Underline, Heading, PaintBucket, X, Folder as FolderIcon, Palette, Tag, Edit3, XCircle, CheckCircle, Star, ChevronDown, ChevronRight, Info } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';


interface Folder {
  id: string;
  name: string;
  color: string; 
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

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
  folderId?: string;
  isFavorite?: boolean;
}

const UnlockNoteModal = ({ note, onUnlock, onCancel, error, loading }: {
  note: Note;
  onUnlock: (password: string) => void;
  onCancel: () => void;
  error?: string;
  loading?: boolean;
}) => {
    const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
    setPassword('');
    setLocalError(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [note]);

  // Prevent pasting for extra security
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setLocalError('Pasting is disabled for security.');
  };

  // Animated lock icon
  const LockAnimated = () => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      animation: 'lockFloat 2.2s ease-in-out infinite',
      filter: 'drop-shadow(0 0 12px #4f8cffcc) drop-shadow(0 0 32px #4f8cff44)'
    }}>
      <Lock size={38} style={{ color: '#4f8cff', filter: 'drop-shadow(0 0 8px #4f8cff)' }} />
    </span>
  );

    return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="fixed inset-0 z-[200] flex items-center justify-center"
        aria-modal="true"
        role="dialog"
        tabIndex={-1}
        style={{
          minHeight: '100vh',
          background: 'rgba(10, 14, 22, 0.82)',
          backdropFilter: 'blur(7px)',
          WebkitBackdropFilter: 'blur(7px)',
          fontFamily: 'Poppins, Inter, Segoe UI, Arial, sans-serif',
        }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30, duration: 0.32 }}
          className="relative"
          style={{
            background: 'rgba(44, 47, 51, 0.92)',
            borderRadius: '.8rem',
            boxShadow: '0 12px 48px #18191c, 0 0 0 3px #4f8cff',
            padding: '3.2rem 2.5rem 2.7rem 2.5rem',
            maxWidth: 680,
            minWidth: 740,
            width: '100%',
            border: '2.5px solid #4f8cff',
            textAlign: 'center',
            color: '#e3e6ea',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-blue-300 hover:bg-blue-500 hover:text-white rounded-full p-2 transition-all duration-200 focus:ring-2 focus:ring-blue-400"
            style={{ fontWeight: 700, fontSize: 22, background: 'rgba(36,39,46,0.7)' }}
          >
            <X size={26} />
          </button>
          <div className="flex flex-col items-center gap-3 mb-4">
            <LockAnimated />
            <h2 className="text-3xl font-extrabold text-blue-400 tracking-tight" style={{ letterSpacing: '-0.01em', marginTop: 8, marginBottom: 0 }}>
              Enter Password
            </h2>
          </div>
          <p className="mb-5 text-blue-200 text-lg font-medium" style={{ fontWeight: 500 }}>
            This note is locked. Please enter the password to view it.
          </p>
          {note.passwordHint && (
            <div style={{
              background: 'rgba(79,140,255,0.13)',
              color: '#4f8cff',
              borderRadius: '.8rem',
              padding: '0.9rem 1.2rem',
              marginBottom: 24,
              fontWeight: 600,
              fontSize: 18,
              border: '1.5px solid #4f8cff',
              boxShadow: '0 2px 12px #4f8cff22',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <span style={{ marginRight: 8, display: 'flex', alignItems: 'center' }}><Info size={20} style={{ color: '#4f8cff', opacity: 0.8 }} /></span>
              <span style={{ fontStyle: 'italic', opacity: 0.92 }}>Hint:</span> <span style={{ marginLeft: 6 }}>{note.passwordHint}</span>
            </div>
          )}
          <div style={{ marginBottom: 18 }}>
                <input
              ref={inputRef}    
                    type="password"
                    value={password}
              onChange={e => { setPassword(e.target.value); setLocalError(null); }}
              onPaste={handlePaste}
              maxLength={64}
              className="w-full border-2 border-blue-400 focus:border-blue-500 outline-none py-4 px-5 mb-2 text-xl rounded-2xl bg-[#23272a] text-blue-100 placeholder:text-blue-400 transition-all duration-200 font-semibold shadow-inner"
                    placeholder="Password"
              disabled={loading}
                    autoFocus
              style={{
                letterSpacing: '0.04em',
                fontSize: 22,
                background: 'rgba(36,39,46,0.98)',
                boxShadow: '0 2px 12px #4f8cff22',
                borderRadius: '.8rem',
                borderWidth: 2,
                borderColor: '#4f8cff',
                outline: 'none',
                fontWeight: 700,
              }}
            />
                </div>
          {(error || localError) && (
            <div className="mb-4 text-pink-500 text-lg font-bold animate-fadeIn" style={{ minHeight: 12 }}>{error || localError}</div>
          )}
          <div className="flex justify-center gap-5 mt-2">
            <button
              onClick={onCancel}
              className="px-7 py-3 rounded-full font-bold bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 text-blue-200 hover:bg-blue-900 hover:text-white shadow transition-all duration-200 border-2 border-blue-900"
              style={{ fontSize: 20, minWidth: 120, borderRadius: '.8rem', boxShadow: '0 2px 12px #23272a', flex: '1' }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                setLocalError(null);
                if (!password) {
                  setLocalError('Password cannot be empty.');
                  return;
                }
                // Add a short delay for brute-force protection
                await new Promise(res => setTimeout(res, 500));
                onUnlock(password);
              }}
              className={`px-7 py-3 rounded-full font-bold bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 text-white shadow-lg border-2 border-blue-400 hover:scale-105 active:scale-95 transition-all duration-200 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
              style={{ fontSize: 20, minWidth: 120, borderRadius: '.8rem', boxShadow: '0 2px 16px #4f8cff44',  flex: '1'  }}
              disabled={loading || !password}
            >
              {loading ? 'Unlocking...' : 'Unlock'}
            </button>
            </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
    );
};

const SetPasswordModal = ({ onSetPassword, onCancel }: { onSetPassword: (password: string, hint: string) => void; onCancel: () => void; }) => {
    const [password, setPassword] = useState('');
    const [hint, setHint] = useState('');
    const [touched, setTouched] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
    const minLength = 5;
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const tooShort = password.length > 0 && password.length < minLength;
  const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
    setPassword('');
    setHint('');
    setTouched(false);
    setLocalError(null);
    setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

  // Animated lock icon
  const LockAnimated = () => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      animation: 'lockFloat 2.2s ease-in-out infinite',
      filter: 'drop-shadow(0 0 12px #4f8cffcc) drop-shadow(0 0 32px #4f8cff44)'
    }}>
      <Lock size={38} style={{ color: '#4f8cff', filter: 'drop-shadow(0 0 8px #4f8cff)' }} />
    </span>
  );

    return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="fixed inset-0 z-[200] flex items-center justify-center"
        aria-modal="true"
        role="dialog"
        tabIndex={-1}
        style={{
          minHeight: '100vh',
          background: 'rgba(10, 14, 22, 0.82)',
          backdropFilter: 'blur(7px)',
          WebkitBackdropFilter: 'blur(7px)',
          fontFamily: 'Poppins, Inter, Segoe UI, Arial, sans-serif',
        }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30, duration: 0.32 }}
          className="relative"
          style={{
            background: 'rgba(44, 47, 51, 0.92)',
            borderRadius: '.8rem',
            boxShadow: '0 12px 48px #18191c, 0 0 0 3px #4f8cff',
            padding: '3.2rem 2.5rem 2.7rem 2.5rem',
            maxWidth: 780,
            minWidth: 840,
            width: '100%',
            border: '2.5px solid #4f8cff',
            textAlign: 'center',
            color: '#e3e6ea',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-blue-300 hover:bg-blue-500 hover:text-white rounded-full p-2 transition-all duration-200 focus:ring-2 focus:ring-blue-400"
            style={{ fontWeight: 700, fontSize: 22, background: 'rgba(36,39,46,0.7)' }}
          >
            <X size={26} />
          </button>
          <div className="flex flex-col items-center gap-3 mb-4">
            <LockAnimated />
            <h2 className="text-3xl font-extrabold text-blue-400 tracking-tight" style={{ letterSpacing: '-0.01em', marginTop: 8, marginBottom: 0 }}>
              Set a Password
            </h2>
          </div>
          <p className="mb-5 text-blue-200 text-lg font-medium" style={{ fontWeight: 500 }}>
            Secure your note with a password. You can also add an optional hint.
          </p>
          <div style={{ marginBottom: 8 }}>    
                <input
              ref={inputRef}
                    type="password"
                    value={password}
              onChange={e => { setPassword(e.target.value); setTouched(true); setLocalError(null); }}
              maxLength={64}
              className="w-full border-2 border-blue-400 focus:border-blue-500 outline-none py-4 px-5 mb-2 text-xl rounded-2xl bg-[#23272a] text-blue-100 placeholder:text-blue-400 transition-all duration-200 font-semibold shadow-inner"
                    placeholder="Enter new password"
                    autoFocus
              style={{
                letterSpacing: '0.04em',
                fontSize: 22,
                background: 'rgba(36,39,46,0.98)',
                boxShadow: '0 2px 12px #4f8cff22',
                borderRadius: '.8rem',
                borderWidth: 2,
                borderColor: '#4f8cff',
                outline: 'none',
                fontWeight: 700,
              }}
            />

          </div>
          <div style={{ marginBottom: 24 }}>
            <input
              type="text"
              value={hint}
              onChange={e => setHint(e.target.value)}
              maxLength={64}
              className="w-full border-2 border-blue-200 focus:border-blue-400 outline-none py-3 px-5 text-lg rounded-2xl bg-[#23272a] text-blue-200 placeholder:text-blue-400 transition-all duration-200 font-semibold shadow-inner"
              placeholder="Password hint (optional)"
              style={{
                fontSize: 18,
                background: 'rgba(36,39,46,0.92)',
                boxShadow: '0 2px 8px #4f8cff11',
                borderRadius: '.8rem',
                borderWidth: 2,
                borderColor: '#4f8cff',
                outline: 'none',
                fontWeight: 600,
              }}
            />
          </div>

                {/* Password validation feedback */}
            <div style={{ minHeight: 32, marginBottom: 28, marginTop: 0 }}>
                  {touched && password.length > 0 && (
                    <>
                  {tooShort && <span style={{ color: '#ff4f4f', fontWeight: 600, fontSize: 16 }}>Password must be at least {minLength} characters.</span>}
                  {!tooShort && <span style={{ color: '#22d3ee', fontWeight: 600, fontSize: 16 }}>Password length is good.</span>}
                      <br />
                      {hasSpecial ? (
                    <span style={{ color: '#22d3ee', fontWeight: 600, fontSize: 15 }}>Contains special character ✓</span>
                      ) : (
                    <span style={{ color: '#bfcfff', fontWeight: 500, fontSize: 15 }}>Add a special character for better security.</span>
                      )}
                    </>
                  )}
                </div>
          {localError && (
            <div className="mb-1 text-pink-500 text-lg font-bold animate-fadeIn" style={{ minHeight: 1 }}>{localError}</div>
          )}
          <div className="flex justify-center gap-5 mt-2">
            <button
              onClick={onCancel}
              className="px-7 py-3 rounded-full font-500 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 text-blue-200 hover:bg-blue-900 hover:text-white shadow transition-all duration-200 border-2 border-blue-900"
              style={{ fontSize: 20, minWidth: 120, borderRadius: '.8rem', boxShadow: '0 2px 12px #23272a', flex: '1' }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setLocalError(null);
                if (!password) {
                  setLocalError('Password cannot be empty.');
                  return;
                }
                if (password.trim().toLowerCase() === hint.trim().toLowerCase() && hint.trim() !== '') {
                  setLocalError('Password hint should not match the password.');
                  return;
                }
                if (tooShort) {
                  setLocalError('Password is too short.');
                  return;
                }
                onSetPassword(password, hint);
              }}
              className={`px-7 py-3 rounded-full font-[500] bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 text-white shadow-lg border-2 border-blue-400 hover:scale-105 active:scale-95 transition-all duration-200`}
              style={{ fontSize: 20, minWidth: 120, borderRadius: '.8rem', boxShadow: '0 2px 16px #4f8cff44', flex: '1'  }}
              disabled={tooShort}
            >
              Set Password & Lock
            </button>
                </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
    );
};

// FolderModal: add same modal enhancements
const CreateFolderModal = ({ onCreate, onCancel, existingFolders }: { onCreate: (name: string, color: string) => void; onCancel: () => void; existingFolders: Folder[] }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#4f8cff');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
    setName('');
    setColor('#4f8cff');
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

  // Animated folder icon
  const FolderAnimated = () => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      animation: 'lockFloat 2.2s ease-in-out infinite',
      filter: `drop-shadow(0 0 12px ${color}cc) drop-shadow(0 0 32px ${color}44)`
    }}>
      <FolderIcon size={38} style={{ color, filter: `drop-shadow(0 0 8px ${color})` }} />
    </span>
  );

  const handleCreate = () => {
    if (!name.trim()) {
      setError('Folder name cannot be empty.');
      return;
    }
    if (existingFolders.some(f => f.name.trim().toLowerCase() === name.trim().toLowerCase())) {
      setError('A folder with this name already exists.');
      return;
    }
    onCreate(name.trim(), color);
  };

    return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="fixed inset-0 z-[200] flex items-center justify-center"
        aria-modal="true"
        role="dialog"
        tabIndex={-1}
        style={{
          minHeight: '100vh',
          background: 'rgba(10, 14, 22, 0.82)',
          backdropFilter: 'blur(7px)',
          WebkitBackdropFilter: 'blur(7px)',
          fontFamily: 'Poppins, Inter, Segoe UI, Arial, sans-serif',
        }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30, duration: 0.32 }}
          className="relative"
          style={{
            background: 'rgba(44, 47, 51, 0.92)',
            borderRadius: '.8rem',
            boxShadow: `0 12px 48px #18191c, 0 0 0 3px ${color}`,
            padding: '3.2rem 2.5rem 2.7rem 2.5rem',
            maxWidth: 720,
            minWidth: 620,
            width: '100%',
            border: `2.5px solid ${color}`,
            textAlign: 'center',
            color: '#e3e6ea',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-blue-300 hover:bg-blue-500 hover:text-white rounded-full p-2 transition-all duration-200 focus:ring-2 focus:ring-blue-400"
            style={{ fontWeight: 700, fontSize: 22, background: 'rgba(36,39,46,0.7)' }}
          >
            <X size={26} />
          </button>
          <div className="flex flex-col items-center gap-3 mb-4">
            <FolderAnimated />
            <h2 className="text-3xl font-400 tracking-tight" style={{ color, letterSpacing: '-0.01em', marginTop: 8, marginBottom: 0 }}>
              Create Folder
            </h2>
          </div>
          <p className="mb-5 text-blue-200 text-lg font-medium" style={{ fontWeight: 500 }}>
            Organize your notes by creating a new folder.
          </p>
          <div style={{ marginBottom: 18 }}>
                <input
              ref={inputRef}
                    type="text"
                    value={name}
              onChange={e => { setName(e.target.value); setError(null); }}
              maxLength={32}
              className="w-full border-2 border-blue-400 focus:border-blue-500 outline-none py-4 px-5 mb-2 text-xl rounded-2xl bg-[#23272a] text-blue-100 placeholder:text-blue-400 transition-all duration-200 font-semibold shadow-inner"
                    placeholder="Folder name"
                    autoFocus
              style={{
                letterSpacing: '0.04em',
                fontSize: 22,
                background: 'rgba(36,39,46,0.98)',
                boxShadow: `0 2px 12px ${color}22`,
                borderRadius: '.8rem',
                borderWidth: 2,
                borderColor: color,
                outline: 'none',
                fontWeight: 400,
              }}
            />
          </div>
          <div className="flex items-center gap-4 mb-6">
           
                    <input
                        type="color"
                        value={color}
                        onChange={e => setColor(e.target.value)}
              className="w-12 h-12 color-picker-circle cursor-pointer"
                        title="Pick folder color"
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                border: `3px solid ${color}`,
                borderRadius: '10%',
                boxShadow: `0 0 0 4px ${color}33, 0 2px 12px ${color}22`,
                background: color,
                outline: 'none',
                padding: 0,
                margin: 0,
                width: '48px',
                height: '48px',
                display: 'inline-block',
                transition: 'box-shadow 0.2s',
              }}
              
              // Remove default color input styles for Webkit/Blink
              /* Add this to your CSS file:
              .color-picker-circle::-webkit-color-swatch-wrapper { padding: 0; border-radius: 50%; }
              .color-picker-circle::-webkit-color-swatch { border: none; border-radius: 50%; }
              .color-picker-circle { border-radius: 50%; overflow: hidden; }
              */
                    />
                     <Palette size={22} style={{ color, opacity: 0.8 }} />
            <span className="text-base text-blue-200 font-semibold">Choose color</span>
                </div>
          {error && (
            <div className="mb-4 text-pink-500 text-lg font-bold animate-fadeIn" style={{ minHeight: 12 }}>{error}</div>
          )}
          <div className="flex justify-center gap-5 mt-2">
            <button
              onClick={onCancel}
              className="px-7 py-3 rounded-full font-500 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 text-blue-200 hover:bg-blue-900 hover:text-white shadow transition-all duration-200 border-2 border-blue-900"
              style={{ fontSize: 20, minWidth: 120, borderRadius: '.8rem', boxShadow: '0 2px 12px #23272a', flex: '1' }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className={`px-7 py-3 rounded-full font-[500] bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 text-white shadow-lg border-2 border-blue-400 hover:scale-105 active:scale-95 transition-all duration-200`}
              style={{ fontSize: 20, minWidth: 120, borderRadius: '.8rem', boxShadow: `0 2px 16px ${color}44`, flex: '1' }}
              disabled={!name.trim()}
            >
              Create Folder
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Custom Alert Modal
const CustomAlertModal = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" aria-modal="true" role="alert" tabIndex={-1}>
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-popIn">
      <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:bg-blue-500 hover:text-white rounded-full p-2 transition-all duration-200 focus:ring-2 focus:ring-blue-400"><X size={20} /></button>
      <h2 className="text-2xl font-bold mb-4 text-pink-600">Warning</h2>
      <p className="mb-6 text-lg text-gray-700 text-center">{message}</p>
      <div className="flex justify-center">
        <button onClick={onClose} className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all duration-200">OK</button>
                </div>
            </div>
        </div>
    );

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
    const [folderOpen, setFolderOpen] = useState<{ [id: string]: boolean }>({});
    const [showDropdown, setShowDropdown] = useState(false);
    const [newNoteSpamCount, setNewNoteSpamCount] = useState(0);
    const [newNoteBlockedUntil, setNewNoteBlockedUntil] = useState<number | null>(null);
    const [showSpamAlert, setShowSpamAlert] = useState(false);
    const [newNoteCountdown, setNewNoteCountdown] = useState<number | null>(null);
    const didLoadRef = useRef(false);
    const [unlockError, setUnlockError] = useState<string | null>(null);
    const [unlockLoading, setUnlockLoading] = useState(false);
    const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
    // Add state for sort dropdown visibility
    const [showSortDropdown, setShowSortDropdown] = useState(false);

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
        if (!didLoadRef.current && (user?.unsafeMetadata.notes || user?.unsafeMetadata.folders)) {
            const loadedNotes = (user.unsafeMetadata.notes as Note[]) || [];
            const loadedFolders = (user.unsafeMetadata.folders as Folder[]) || [];
            const sortedNotes = loadedNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            const sortedFolders = loadedFolders.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            setNotes(sortedNotes);
            setFolders(sortedFolders);
            didLoadRef.current = true;
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
        setWordCount(editor && editor.getText ? editor.getText().length : 0);
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
        // Block if user is spamming
        if (newNoteBlockedUntil && Date.now() < newNoteBlockedUntil) {
            setShowSpamAlert(true);
            return;
        }
        // Check for unsaved empty notes
        const emptyNotes = notes.filter(n => n.title === 'Untitled Note' && (!n.content || n.content.trim() === ''));
        if (emptyNotes.length >= 3) {
            setNewNoteSpamCount(c => c + 1);
            if (newNoteSpamCount + 1 >= 3) {
                setNewNoteBlockedUntil(Date.now() + 5000); // 5 seconds
                setNewNoteCountdown(5);
                setShowSpamAlert(true);
                return;
            }
        }
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

    const handleUnlockSubmit = async (password: string) => {
        if (!noteToProcess) return;
        setUnlockError(null);
        setUnlockLoading(true);
        // Brute-force protection
        if (passwordAttempts[noteToProcess.id] && passwordAttempts[noteToProcess.id] >= 5) {
            setUnlockError('Too many incorrect attempts. Try again later.');
            setUnlockLoading(false);
            return;
        }
        if (!password) {
            setUnlockError('Password cannot be empty.');
            setUnlockLoading(false);
            return;
        }
        try {
            const decrypted = CryptoJS.AES.decrypt(noteToProcess.encryptedContent!, password).toString(CryptoJS.enc.Utf8);
            if (!decrypted) {
                setPasswordAttempts(pa => ({...pa, [noteToProcess.id]: (pa[noteToProcess.id]||0)+1}));
                setUnlockError('Incorrect password.');
                setUnlockLoading(false);
                return;
            }
            if (unlockMode === 'view') {
                setTempUnlockedContent(decrypted);
                setCurrentNoteId(noteToProcess.id);
                toast.success('Note unlocked for editing.');
                setIsUnlockModalOpen(false);
                setNoteToProcess(null);
            } else if (unlockMode === 'permanent') {
                const updatedNotes = notes.map(n => n.id === noteToProcess.id ? { ...n, content: decrypted, isLocked: false, passwordHint: undefined, encryptedContent: undefined } : n);
                saveDataToClerk(updatedNotes, folders);
                toast.success('Note permanently unlocked!');
                setIsUnlockModalOpen(false);
                setNoteToProcess(null);
            } else if (unlockMode === 'delete') {
                handleDeleteNoteConfirmed(noteToProcess.id);
                setIsUnlockModalOpen(false);
                setNoteToProcess(null);
            }
        } catch {
            setPasswordAttempts(pa => ({...pa, [noteToProcess.id]: (pa[noteToProcess.id]||0)+1}));
            setUnlockError('Incorrect password.');
        } finally {
            setUnlockLoading(false);
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

    // Search notes by title and apply filter
    let filteredNotes: Note[] = notes.filter(note => {
        // Folder filter
        if (currentFolderId === null) {
            if (note.folderId) return false; // Only notes NOT in a folder
        } else {
            if (note.folderId !== currentFolderId) return false; // Only notes in the selected folder
        }
        // Note filter
        if (noteFilter === 'favorite') return note.isFavorite;
        if (noteFilter === 'locked') return note.isLocked;
        if (noteFilter === 'unlocked') return !note.isLocked;
        // Default: search by title
        return note.title.toLowerCase().includes(search.toLowerCase());
    });
    // Apply sort order
    filteredNotes = filteredNotes.sort((a, b) => {
        if (sortOrder === 'latest') {
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        } else {
            return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        }
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

    // Helper to toggle folder open/close
    const toggleFolder = (id: string) => setFolderOpen(prev => ({ ...prev, [id]: !prev[id] }));

    // Countdown effect for New Note button
    useEffect(() => {
        if (newNoteCountdown === null) return;
        if (newNoteCountdown <= 0) {
            setNewNoteBlockedUntil(null);
            setNewNoteCountdown(null);
            setNewNoteSpamCount(0);
            return;
        }
        const timer = setTimeout(() => setNewNoteCountdown((c) => (c ? c - 1 : null)), 1000);
        return () => clearTimeout(timer);
    }, [newNoteCountdown]);

    useEffect(() => {
        if (isUnlockModalOpen || isSetPasswordModalOpen || isFolderModalOpen) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }
        return () => document.body.classList.remove('overflow-hidden');
    }, [isUnlockModalOpen, isSetPasswordModalOpen, isFolderModalOpen]);

    if (isLoading) return <div className="loading-container"><h2>Loading...</h2></div>;

    return (
        <>
            <AnimatePresence>
                {isUnlockModalOpen && noteToProcess && (
                    <UnlockNoteModal
                        note={noteToProcess}
                        onUnlock={handleUnlockSubmit}
                        onCancel={() => { setIsUnlockModalOpen(false); setNoteToProcess(null); setUnlockError(null); setUnlockLoading(false); }}
                        error={unlockError || undefined}
                        loading={unlockLoading}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isSetPasswordModalOpen && (
                    <SetPasswordModal
                        onSetPassword={handleSetPassword}
                        onCancel={() => setIsSetPasswordModalOpen(false)}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
              {isFolderModalOpen && (
                <CreateFolderModal
                  onCreate={handleCreateFolderSubmit}
                  onCancel={() => setIsFolderModalOpen(false)}
                  existingFolders={folders}
                />
              )}
            </AnimatePresence>
            {showSpamAlert && <CustomAlertModal message={"DON'T SPAM NEW NOTE IF U DON'T WISH TO SAVE ANYTHING, THIS ISN'T A GAME"} onClose={() => setShowSpamAlert(false)} />}
            <div className="notes-dashboard-container flex flex-col lg:flex-row w-full h-full min-h-screen gap-0 lg:gap-6 xl:gap-10 overflow-x-hidden">
                {/* SIDEBAR START */}
                <aside className="w-full bg-[#36373e] lg:w-[370px] xl:w-[400px] flex-shrink-0 border-0 shadow-2xl rounded-b-3xl lg:rounded-3xl p-4 sm:p-6 flex flex-col gap-6 relative z-10 overflow-y-auto max-h-[90vh] lg:max-h-[calc(100vh-40px)] min-h-[0] mt-[90px]">
                    {/* Search */}
                    <div className="flex items-center gap-3 sidebar-search bg-white/70 rounded-xl shadow-inner px-4 py-3 mb-2 border border-blue-100/60">
                        <Search size={22} className="text-blue-400 sidebar-search-icon " />
                    <input
                        type="text"
                        placeholder="Search notes by title..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                            className="flex-1 bg-transparent sidebar-search-input outline-none text-lg text-blue-900 placeholder:text-blue-300 font-medium"
                    />
                </div>
                    {/* Folders Header */}
                    <div className="flex items-center justify-between mb-1 separate-part">
                        <h2 className="text-2xl font-[300] text-[#9b9ca3] flex items-center gap-2 tracking-tight"><FolderIcon size={26} className="text-blue-400 " />Folders</h2>
                        <button onClick={handleCreateFolder} className="action-btn px-5 py-2 flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all "><Plus size={20}/> New Folder</button>
                    </div>
                    {/* Folders List */}
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFolderDragEnd}>
                        <SortableContext items={folders.map(f => f.id)} strategy={verticalListSortingStrategy}>
                            <div className="flex flex-col gap-3 ">
                                {/* Other Notes */}
                        <div
                                    className={`group relative flex items-center gap-3 min-h-[60px] rounded-[10px] px-5 py-3 cursor-pointer shadow-md border-2 transition-all duration-200 ${currentFolderId === null ? 'bg-gradient-to-r from-blue-900 to-blue-300 text-white border-blue-500 scale-[1.03]' : 'border-blue-100 hover:scale-105 sidebar-folder'}`}
                            onClick={() => setCurrentFolderId(null)}
                                >
                                    <FolderIcon size={24} className={`mr-2 ${currentFolderId === null ? 'text-white' : 'text-blue-400'}`} />
                                    <span className="flex-1 font-500 text-lg">Other Notes</span>
                                    <span className={`rounded-full px-4 py-1 font-600 text-base shadow ${currentFolderId === null ? 'bg-white text-blue-500' : 'bg-pink-500 text-white'}`}>N: {notes.filter(n => !n.folderId).length}</span>  
                        </div>
                                {/* User Folders */}
                        {folders.map(folder => (
                            <div
                                key={folder.id}
                                        className={`group relative flex items-center gap-3 min-h-[60px] rounded-[10px] px-5 py-3 cursor-pointer shadow-md border-2 transition-all duration-200 ${currentFolderId === folder.id ? 'bg-gradient-to-r from-[#3b9ac4] to-blue-900 text-blue-900 border-blue-900 scale-[1.02]' : 'bg-white/80  border-blue-100 hover:scale-105 sidebar-folder'}`}
                                onClick={() => setCurrentFolderId(folder.id)}
                                        style={{ borderLeft: `8px solid ${folder.color}` }}
                                    >
                                        <span onClick={() => toggleFolder(folder.id)} style={{ cursor: 'pointer', marginRight: 8 }}>
                                            {folderOpen[folder.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        </span>
                                        <FolderIcon size={22} style={{ color: folder.color }} />
                                        <span className="flex-1 font-500 text-lg" style={{ color: folder.color }}>{folder.name}</span>
                           <div className="flex  folder-side-icons">
                                       <span className="rounded-full px-4 py-1 font-300 text-base bg-[transparent] border-2 border-gray-500 p-[0] w-[0] flex justify-center text-white shadow  h-fit p-0 m-0">{notes.filter(n => n.folderId === folder.id).length}</span>
                                <button className="ml-2 sidebar-folder border border-pink-200 rounded-full p-2 flex items-center justify-center transition "
                                    title="Rename Folder" onClick={e => { e.stopPropagation(); handleRenameFolder(folder.id); }}>
                                            <Palette size={16} style={{ color: folder.color }} />
                                 </button>
                                <button className="ml-2 sidebar-folder border border-pink-200 rounded-full p-2 flex items-center justify-center transition"
                                    title="Delete Folder" onClick={e => { e.stopPropagation(); handleDeleteFolder(folder.id); }}>
                                            <Trash2 size={16} className="text-pink-500" />
                                </button>
                                </div>
                            </div>
                        ))}
                    </div>
                        </SortableContext>
                    </DndContext>
                    {/* Notes Header */}
                    <div className="flex items-center justify-between mb-1 separate-part">
                        <h2 className="text-2xl font-[400] text-[#9b9ca3] flex items-center gap-2"><Edit3 size={24} className="text-blue-400" />Notes</h2>
                        <button
                            onClick={handleNewNote}
                            className={`action-btn px-5 py-2 flex items-center gap-2 shadow-lg transition-all ${newNoteBlockedUntil && Date.now() < newNoteBlockedUntil ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                            disabled={!!(newNoteBlockedUntil && Date.now() < newNoteBlockedUntil)}
                        >
                            <Plus size={20}/>
                            {newNoteCountdown && newNoteBlockedUntil && Date.now() < newNoteBlockedUntil ? `New Note (${newNoteCountdown})` : 'New Note'}
                        </button>
                    </div>
                    {/* Note Filters + Sort Dropdown */}
                    <div className="filter-sort-row  mb-3 w-full">
                        {/* Note Filter Dropdown */}
                        <div className="custom-dropdown flex-1 min-w-0 flex items-center justify-between px-4 py-2 rounded-full font-400 text-lg shadow cursor-pointer bg-[#23272a] border-2 border-blue-400 text-blue-400 hover:bg-[#36393f] transition-all duration-200 select-none"
                            onClick={() => setShowDropdown(prev => !prev)}
                            tabIndex={0}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 120)}
                            style={{ flex: 1, minWidth: 0 }}
                        >
                            <span className="flex items-center gap-2">
                                {noteFilter === 'all' && <><span className="dropdown-icon"><Edit3 size={16}/></span><span className='font-normal'>All Notes</span></>}
                                {noteFilter === 'locked' && <><span className="dropdown-icon"><Lock size={16}/></span><span  className='font-normal'>Locked</span></>}
                                {noteFilter === 'unlocked' && <><span className="dropdown-icon"><ShieldOff size={16}/></span><span  className='font-normal'>No Lock</span></>}
                                {noteFilter === 'favorite' && <><span className="dropdown-icon"><Star size={16}/></span><span className='font-normal'>Fav</span></>}
                            </span>
                            <span className={`dropdown-arrow ml-auto transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}><ChevronDown size={20} /></span>
                        </div>
                        {showDropdown && (
                            <div className="mt-2 z-30 w-full bg-[#23272a] border-2 border-blue-400 rounded-2xl shadow-xl animate-popIn overflow-hidden">
                                <div
                                    className={`dropdown-item flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-blue-500 hover:text-white transition-all  ${noteFilter === 'all' ? 'bg-blue-500 text-white' : 'text-blue-400'}`}
                                    onClick={() => { setNoteFilter('all'); setShowDropdown(false); }}
                                >
                                    <span className="dropdown-icon" style={{width: 22}}><Edit3 size={16}/></span>
                                    <span className='font-normal'>All Notes</span>
                                </div>
                                <div
                                    className={`dropdown-item flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-blue-500 hover:text-white transition-all ${noteFilter === 'locked' ? 'bg-blue-500 text-white' : 'text-blue-400'}`}
                                    onClick={() => { setNoteFilter('locked'); setShowDropdown(false); }}
                                >
                                    <span className="dropdown-icon" style={{width: 22}}><Lock size={16}/></span>
                                    <span className='font-normal'>Locked</span>
                                </div>
                                <div
                                    className={`dropdown-item flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-blue-500 hover:text-white transition-all ${noteFilter === 'unlocked' ? 'bg-blue-500 text-white' : 'text-blue-400'}`}
                                    onClick={() => { setNoteFilter('unlocked'); setShowDropdown(false); }}
                                >
                                    <span className="dropdown-icon" style={{width: 22}}><ShieldOff size={16}/></span>
                                    <span className='font-normal'>No Lock</span>
                                </div>
                                <div
                                    className={`dropdown-item flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-yellow-400 hover:text-white transition-all ${noteFilter === 'favorite' ? 'bg-yellow-400 text-white' : 'text-yellow-500'}`}
                                    onClick={() => { setNoteFilter('favorite'); setShowDropdown(false); }}
                                >
                                    <span className="dropdown-icon" style={{width: 22}}><Star size={16}/></span>
                                    <span className='font-normal'>Fav</span>
                                </div>
                            </div>
                        )}
                        {/* Sort Dropdown */}
                        <div className="custom-dropdown flex-1 min-w-0 flex items-center justify-between px-4 py-2 rounded-full font-400 text-lg shadow cursor-pointer bg-[#23272a] border-2 border-blue-400 text-blue-400 hover:bg-[#36393f] transition-all duration-200 select-none mt-2 relative"
                            tabIndex={0}
                            style={{ flex: 1, minWidth: 0 }}
                            onClick={() => setShowSortDropdown(prev => !prev)}
                            onBlur={() => setTimeout(() => setShowSortDropdown(false), 120)}
                        >
                            <span className='font-normal'>{sortOrder === 'latest' ? 'Latest Notes' : 'Old notes'}</span>
                            <span className={`dropdown-arrow ml-auto transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`}><ChevronDown size={20} /></span>
                            {showSortDropdown && (
                                <div className="flex flex-col absolute left-0 top-full mt-2 z-40 w-full bg-[#23272a] border-2 border-blue-400 rounded-2xl shadow-xl animate-popIn overflow-hidden">
                                    <div
                                        className={`dropdown-item flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-blue-500 hover:text-white transition-all ${sortOrder === 'latest' ? 'bg-blue-500 text-white' : 'text-blue-400'}`}
                                        onClick={e => { e.stopPropagation(); setSortOrder('latest'); setShowSortDropdown(false); }}
                                    >
                                        <span className='font-normal'>Latest Notes</span>
                                    </div>
                                    <div
                                        className={`dropdown-item flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-blue-500 hover:text-white transition-all ${sortOrder === 'oldest' ? 'bg-blue-500 text-white' : 'text-blue-400'}`}
                                        onClick={e => { e.stopPropagation(); setSortOrder('oldest'); setShowSortDropdown(false); }}
                                    >
                                        <span className='font-normal'>Old notes</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Notes List */}
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleNoteDragEnd}>
                        <SortableContext items={filteredNotes.map(n => n.id)} strategy={verticalListSortingStrategy}>
                            <div className="flex flex-col gap-3">
                            {filteredNotes
                                .map((note: Note, idx) => {
                                    const isLocked = note.isLocked;
                                    return (
                                        <div
                                            key={note.id}
                                                className={`group flex items-center gap-3 min-h-[60px] rounded-2xl px-5 py-3 cursor-pointer shadow-md transition-all duration-200 ${note.id === currentNoteId ? 'bg-gradient-to-r from-blue-900 to-blue-200 text-white border-blue-500 scale-[1.03]' : 'bg-[#2c2f33] border border-[#23272a] hover:scale-105'}`}
                                            onClick={() => handleSelectNote(note)}  
                                            data-id={note.id}
                                        >
                                                 <span
                                                    className="text-[17px] font-medium flex items-center justify-center"
                                                    style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    border: '2px solid #3b82f6',
                                                    padding: '4px',
                                                    color: note.id === currentNoteId ? '#fff' : '#3b82f6',
                                                    backgroundColor: note.id === currentNoteId ? '#3b82f6' : 'transparent',
                                                    transition: 'all 0.3s ease',
                                                    }}
                                                >
                                                    {idx + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <h3 className={`flex items-center gap-1 font-400 text-lg ${note.id === currentNoteId ? 'text-white' : 'text-gray-400'}`}>{note.title}</h3>
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(note.updatedAt).toLocaleString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true, 
                                                        })}
                                                        </p>


                                            </div>
                                            <div className="lock-button-note">
                                            {isLocked && <Lock size={22} className="lock-animated" />} 
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
                <main className="editor-main flex-1 w-full min-w-0 bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-t-3xl lg:rounded-3xl shadow-2xl p-2 sm:p-4 md:p-6 xl:p-8 flex flex-col gap-6 animate-fadeIn overflow-x-auto ">
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
                                className="w-full text-4xl font-400 bg-white/70 rounded-2xl px-6 py-4 shadow-lg border-2 border-blue-100 focus:border-blue-400 outline-none transition-all duration-200 mb-2 animate-popIn placeholder:italic placeholder:text-blue-200 sidebar-search "
                                    placeholder="Note Title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    disabled={currentNote.isLocked && !isTemporarilyUnlocked}
                                style={{ letterSpacing: '-0.01em' }}
                                />
                            {/* Tags */}
                            <div className="flex flex-wrap items-center gap-2 mb-2 animate-fadeIn">
                                        {(currentNote.tags || []).map(tag => (
                                    <span key={tag} className="flex items-center gap-1 px-4 py-2 rounded-full font-semibold text-white shadow bg-gradient-to-r from-blue-400 to-blue-600 animate-popIn ">
                                        <Tag size={16} className="opacity-80" />
                                        <span>{tag}</span>
                                        <button onClick={() => handleRemoveTag(tag)} className="ml-1 bg-white/30 hover:bg-pink-500 hover:text-white rounded-full p-1 transition-all"><XCircle size={15}/></button>
                                            </span>
                                        ))}
                                {/* Tag input */}
                                <div className="relative ">
                                    <div className="flex items-center gap-2 bg-[#23272a] rounded-full px-4 py-2 shadow-inner  ">
                                        <Tag size={16} className="opacity-70" />
                                            <input
                                            className={`bg-transparent outline-none text-blue-700 font-semibold w-28 placeholder:text-blue-300  ${tagError ? 'text-pink-500' : ''}`}
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
                                        <div className="absolute left-0 mt-2 z-20 bg-[#] rounded-xl shadow-lg border border-blue-100 w-48 animate-popIn">
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
                                <div className="flex items-center gap-3 bg-[#23272a] rounded-2xl px-6 py-3 shadow-lg mb-2 animate-popIn sticky top-0 z-20">
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
                            <div className="relative flex-1 flex flex-col animate-fadeIn bg-[#23272a] rounded-[10px]">
                                {/* Markdown Preview */}
                                {showMarkdown ? (
                                    <div className="w-full min-h-[300px] bg-white/80 border-2 border-blue-100 rounded-2xl p-6 shadow-inner text-lg font-mono border text-blue-900 overflow-auto animate-popIn prose max-w-none">
                                        {/* Use a markdown parser if available, else fallback to raw HTML */}
                                        <div dangerouslySetInnerHTML={{ __html: editor ? editor.getHTML() : '' }} />
                                    </div>
                                ) : (
                                    <EditorContent editor={editor} className="tiptap-editor w-full min-h-[300px] flex-1 bg-[#23272a] rounded-2xl p-6 shadow-inner text-lg text-blue-900 outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-200 animate-popIn" />
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