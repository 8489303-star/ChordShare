import React, { useState, useEffect, useMemo } from 'react';
import { auth, db, googleProvider, OperationType, handleFirestoreError } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, orderBy, limit, onSnapshot, addDoc, Timestamp, where, getDocs, doc, updateDoc, increment, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { Song, SongVersion, UserRating } from './types';
import { parseChordPro } from './lib/chordpro';
import { cn } from './lib/utils';
import { 
  Search, 
  Upload, 
  Download, 
  Star, 
  X, 
  Plus, 
  Trash2, 
  Music, 
  User as UserIcon,
  LogOut,
  LogIn,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileJson
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';

// --- Components ---

const ChordProRenderer = ({ content }: { content: string }) => {
  const lines = useMemo(() => parseChordPro(content), [content]);

  return (
    <div className="font-mono text-sm leading-relaxed whitespace-pre overflow-x-auto text-right" dir="rtl">
      {lines.map((line, i) => (
        <div key={i} className="flex flex-wrap mb-4 min-h-[2.5rem]">
          {line.chunks.map((chunk, j) => (
            <div key={j} className="flex flex-col items-start mx-0.5">
              <span className="text-blue-600 font-bold h-5 text-xs select-none">
                {chunk.chord || ''}
              </span>
              <span className="text-zinc-900">
                {chunk.text || '\u00A0'}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const ProfileModal = ({ user, onClose }: { user: User, onClose: () => void }) => {
  const [name, setName] = useState(user.displayName || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: name.trim()
      });
      toast.success('הפרופיל עודכן בהצלחה');
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
        dir="rtl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-zinc-900">עריכת פרופיל</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">שם תצוגה</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="הכנס את שמך..."
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {isSaving ? 'שומר...' : 'שמור שינויים'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const UserManagement = ({ onBack }: { onBack: () => void }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleAdmin = async (userId: string, currentRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: currentRole === 'admin' ? 'user' : 'admin'
      });
      toast.success('התפקיד עודכן');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
  };

  const toggleBlock = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isBlocked: !currentStatus
      });
      toast.success(currentStatus ? 'המשתמש שוחרר' : 'המשתמש נחסם');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6" dir="rtl">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-8 transition-colors">
        <ChevronRight className="w-5 h-5" />
        <span>חזרה</span>
      </button>

      <h1 className="text-3xl font-bold text-zinc-900 mb-8">ניהול משתמשים</h1>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-bold text-zinc-900">שם</th>
              <th className="px-6 py-4 font-bold text-zinc-900">תפקיד</th>
              <th className="px-6 py-4 font-bold text-zinc-900">סטטוס</th>
              <th className="px-6 py-4 font-bold text-zinc-900">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4 text-zinc-900 font-medium">{u.name}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-bold",
                    u.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-zinc-100 text-zinc-600"
                  )}>
                    {u.role === 'admin' ? 'מנהל' : 'משתמש'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-bold",
                    u.isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  )}>
                    {u.isBlocked ? 'חסום' : 'פעיל'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleAdmin(u.id, u.role)}
                      className="text-xs bg-zinc-900 text-white px-3 py-1 rounded hover:bg-zinc-800 transition-colors"
                    >
                      {u.role === 'admin' ? 'הסר ניהול' : 'הפוך למנהל'}
                    </button>
                    <button 
                      onClick={() => toggleBlock(u.id, u.isBlocked)}
                      className={cn(
                        "text-xs px-3 py-1 rounded transition-colors",
                        u.isBlocked ? "bg-green-600 text-white hover:bg-green-500" : "bg-red-600 text-white hover:bg-red-500"
                      )}
                    >
                      {u.isBlocked ? 'שחרר חסימה' : 'חסום משתמש'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SongViewer = ({ song, isOpen, onClose, isAdminUser, onDelete }: { song: Song | null; isOpen: boolean; onClose: () => void; isAdminUser: boolean; onDelete: (id: string) => void }) => {
  const [activeVersionIndex, setActiveVersionIndex] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);

  useEffect(() => {
    if (song && auth.currentUser) {
      const q = query(collection(db, 'ratings'), where('userId', '==', auth.currentUser.uid), where('songId', '==', song.id));
      getDocs(q).then(snap => {
        if (!snap.empty) {
          setUserRating(snap.docs[0].data().rating);
        } else {
          setUserRating(null);
        }
      });
    }
  }, [song]);

  const handleRate = async (rating: number) => {
    if (!song || !auth.currentUser) {
      toast.error('עליך להתחבר כדי לדרג');
      return;
    }

    try {
      const ratingId = `${auth.currentUser.uid}_${song.id}`;
      await setDoc(doc(db, 'ratings', ratingId), {
        userId: auth.currentUser.uid,
        songId: song.id,
        rating
      });

      // Update song average rating (simplified logic for demo)
      const songRef = doc(db, 'songs', song.id);
      await updateDoc(songRef, {
        ratingCount: increment(1),
        rating: song.rating ? (song.rating * song.ratingCount + rating) / (song.ratingCount + 1) : rating
      });

      setUserRating(rating);
      toast.success('תודה על הדירוג!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'ratings');
    }
  };

  if (!song) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto border-r border-zinc-200"
            dir="rtl"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-8">
                <div className="flex gap-2">
                  <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                    <X className="w-6 h-6 text-zinc-500" />
                  </button>
                  {isAdminUser && (
                    <button 
                      onClick={() => { onDelete(song.id); onClose(); }}
                      className="p-2 hover:bg-red-500/10 text-red-500 rounded-full transition-colors"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  )}
                </div>
                <div className="text-left">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        key={star} 
                        onClick={() => handleRate(star)}
                        className={cn("p-0.5 transition-transform hover:scale-110", star <= (userRating || 0) ? "text-yellow-500" : "text-zinc-300")}
                      >
                        <Star className={cn("w-5 h-5", star <= (userRating || 0) && "fill-current")} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h1 className="text-4xl font-bold text-zinc-900 mb-2">{song.title}</h1>
                <p className="text-xl text-zinc-500">{song.artist}</p>
                <div className="flex items-center gap-2 mt-4 text-sm text-zinc-400">
                  <UserIcon className="w-4 h-4" />
                  <span>הועלה על ידי: {song.uploaderName}</span>
                  <span className="mx-2">•</span>
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span>{song.rating?.toFixed(1) || '0.0'} ({song.ratingCount || 0} דירוגים)</span>
                </div>
              </div>

              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {song.versions.map((v, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveVersionIndex(idx)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                      activeVersionIndex === idx 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    )}
                  >
                    {v.name}
                  </button>
                ))}
              </div>

              <div className="bg-zinc-50 rounded-xl p-6 border border-zinc-200 shadow-inner">
                <ChordProRenderer content={song.versions[activeVersionIndex].content} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const UploadPage = ({ onBack, onUploadSuccess }: { onBack: () => void; onUploadSuccess: () => void }) => {
  const [isManual, setIsManual] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const songsToUpload = Array.isArray(json) ? json : (json.songs || [json]);
        
        setIsUploading(true);
        for (const s of songsToUpload) {
          // Handle both array and object versions
          let versions: SongVersion[] = [];
          if (Array.isArray(s.versions)) {
            versions = s.versions;
          } else if (typeof s.versions === 'object' && s.versions !== null) {
            versions = Object.entries(s.versions).map(([name, content]) => ({
              name,
              content: content as string
            }));
          } else {
            versions = [{ name: 'רגיל', content: s.content || '' }];
          }

          await addDoc(collection(db, 'songs'), {
            title: s.title,
            artist: s.artist,
            uploaderId: auth.currentUser?.uid,
            uploaderName: auth.currentUser?.displayName || 'אנונימי',
            createdAt: Timestamp.now(),
            rating: 0,
            ratingCount: 0,
            versions: versions
          });
        }
        toast.success('השירים הועלו בהצלחה!');
        onUploadSuccess();
      } catch (err) {
        toast.error('קובץ JSON לא תקין');
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !artist || !content) {
      toast.error('נא למלא את כל השדות');
      return;
    }

    setIsUploading(true);
    try {
      await addDoc(collection(db, 'songs'), {
        title,
        artist,
        uploaderId: auth.currentUser?.uid,
        uploaderName: auth.currentUser?.displayName || 'אנונימי',
        createdAt: Timestamp.now(),
        rating: 0,
        ratingCount: 0,
        versions: [{ name: 'רגיל', content }]
      });
      toast.success('השיר הועלה בהצלחה!');
      onUploadSuccess();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'songs');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6" dir="rtl">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-8 transition-colors">
        <ChevronRight className="w-5 h-5" />
        <span>חזרה לספרייה</span>
      </button>

      <h1 className="text-3xl font-bold text-zinc-900 mb-8">העלאת שירים חדשים</h1>

      <div className="grid gap-8">
        <div className={cn(
          "p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer",
          !isManual ? "border-blue-500 bg-blue-500/5" : "border-zinc-200 hover:border-zinc-300"
        )} onClick={() => setIsManual(false)}>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-blue-900/40">
              <FileJson className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">העלאת קובץ JSON</h2>
            <p className="text-zinc-500 mb-6">תומך בהעלאת מספר שירים בו-זמנית</p>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleFileUpload}
              className="hidden" 
              id="json-upload"
            />
            <label 
              htmlFor="json-upload" 
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all cursor-pointer"
            >
              בחר קובץ
            </label>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200"></div>
          </div>
          <div className="relative flex justify-center text-sm uppercase">
            <span className="bg-white px-4 text-zinc-400 font-medium">או</span>
          </div>
        </div>

        <div className={cn(
          "p-8 rounded-2xl border border-zinc-200 transition-all",
          isManual ? "bg-zinc-50 ring-2 ring-blue-500/20" : "opacity-60"
        )} onClick={() => setIsManual(true)}>
          <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
            <Plus className="w-6 h-6 text-blue-500" />
            הוספה ידנית
          </h2>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-500 mb-1">שם השיר</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2 text-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="למשל: שלום עולם"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-500 mb-1">אמן</label>
                <input 
                  type="text" 
                  value={artist}
                  onChange={e => setArtist(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2 text-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="למשל: שלמה ארצי"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-500 mb-1">תוכן (ChordPro)</label>
              <textarea 
                rows={10}
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2 text-zinc-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="[C]שלום [G]עולם..."
              />
            </div>
            <button 
              type="submit" 
              disabled={isUploading}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {isUploading ? 'מעלה...' : 'שמור שיר'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [view, setView] = useState<'home' | 'library' | 'upload' | 'admin'>('home');
  const [selectedSongsForExport, setSelectedSongsForExport] = useState<string[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    // Force light mode
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.documentElement.style.colorScheme = 'light';
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const userRef = doc(db, 'users', u.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.isBlocked) {
            await signOut(auth);
            toast.error('החשבון שלך חסום');
            setUser(null);
            return;
          }
          setUserName(userData.name || u.displayName || '');
        } else {
          setUserName(u.displayName || '');
        }
        setUser(u);
      } else {
        setUser(null);
        setUserName('');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'songs'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Song));
      setSongs(docs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'songs'));
    return () => unsubscribe();
  }, []);

  const filteredSongs = useMemo(() => {
    return songs.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [songs, searchQuery]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setUserName(doc.data().name || user.displayName || '');
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Check if this is the first user
        const usersQuery = query(collection(db, 'users'), limit(1));
        const usersSnap = await getDocs(usersQuery);
        const isFirstUser = usersSnap.empty;

        await setDoc(userRef, {
          name: result.user.displayName,
          email: result.user.email,
          role: isFirstUser ? 'admin' : 'user',
          isBlocked: false,
          createdAt: Timestamp.now()
        });
      } else if (userSnap.data().isBlocked) {
        await signOut(auth);
        toast.error('החשבון שלך חסום');
        return;
      }
      
      toast.success('ברוך הבא!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSong = async (id: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את השיר?')) return;
    
    try {
      await deleteDoc(doc(db, 'songs', id));
      toast.success('השיר נמחק בהצלחה');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'songs');
    }
  };

  const [isAdminUser, setIsAdminUser] = useState(false);
  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (snap) => {
        if (snap.exists() && snap.data().role === 'admin') {
          setIsAdminUser(true);
        } else if (user.email === 'markusef@gmail.com') {
          setIsAdminUser(true); // Fallback for default admin
        } else {
          setIsAdminUser(false);
        }
      });
      return () => unsubscribe();
    } else {
      setIsAdminUser(false);
    }
  }, [user]);
  const handleExport = () => {
    const exportData = {
      songs: songs.filter(s => selectedSongsForExport.includes(s.id))
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chordshare-export.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('הייצוא הושלם!');
  };

  const toggleSelectForExport = (id: string) => {
    setSelectedSongsForExport(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-blue-500/30">
      <Toaster position="top-center" theme="light" />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div 
              className="text-2xl font-black tracking-tighter text-zinc-900 cursor-pointer flex items-center gap-2"
              onClick={() => setView('home')}
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              ChordShare
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <button 
                onClick={() => setView('home')}
                className={cn("transition-colors", view === 'home' ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-900")}
              >
                ראשי
              </button>
              <button 
                onClick={() => setView('library')}
                className={cn("transition-colors", view === 'library' ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-900")}
              >
                ספרייה
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && isAdminUser && (
              <button 
                onClick={() => setView('admin')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  view === 'admin' ? "bg-purple-100 text-purple-700" : "text-zinc-500 hover:bg-zinc-100"
                )}
                title="ניהול משתמשים"
              >
                <UserIcon className="w-5 h-5" />
              </button>
            )}
            {user ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setView('upload')}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  העלה JSON
                </button>
                <div className="flex items-center gap-2 bg-zinc-100 rounded-full pl-4 pr-1 py-1 border border-zinc-200">
                  <img 
                    src={user.photoURL || ''} 
                    alt="" 
                    className="w-7 h-7 rounded-full cursor-pointer hover:opacity-80 transition-opacity" 
                    onClick={() => setIsProfileModalOpen(true)}
                  />
                  <span 
                    className="text-sm font-medium hidden sm:inline text-zinc-900 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => setIsProfileModalOpen(true)}
                  >
                    {userName}
                  </span>
                  <button onClick={() => signOut(auth)} className="p-1 text-zinc-500 hover:text-red-500 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="bg-zinc-900 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all"
              >
                <LogIn className="w-4 h-4" />
                התחברות
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="pb-20">
        {view === 'home' && (
          <div className="max-w-7xl mx-auto px-6">
            {/* Hero */}
            <section className="py-24 text-center" dir="rtl">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl md:text-8xl font-black tracking-tight text-zinc-900 mb-8 leading-tight"
              >
                שתף את המוזיקה שלך <br />
                <span className="text-blue-500">בצורה חכמה.</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-zinc-600 max-w-2xl mx-auto mb-12"
              >
                הקהילה הגדולה ביותר בישראל לשיתוף אקורדים בפורמט ChordPro.
                חפש, דרג, והעלה את האוספים שלך.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap justify-center gap-4"
              >
                <button 
                  onClick={() => user ? setView('upload') : handleLogin()}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-900/20 transition-all"
                >
                  העלה JSON
                </button>
                <button 
                  onClick={() => setView('library')}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-10 py-4 rounded-2xl font-bold text-lg transition-all"
                >
                  עיין בשירים
                </button>
              </motion.div>
            </section>

            {/* Latest Songs */}
            <section className="py-12" dir="rtl">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-zinc-900 mb-2">העלאות אחרונות</h2>
                  <p className="text-zinc-500">השירים החדשים ביותר בקהילה</p>
                </div>
                <button onClick={() => setView('library')} className="text-blue-500 hover:underline font-medium">צפה בהכל</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {songs.slice(0, 6).map((song) => (
                  <motion.div 
                    key={song.id}
                    whileHover={{ y: -4 }}
                    onClick={() => { setSelectedSong(song); setIsSidebarOpen(true); }}
                    className="bg-zinc-50 border border-zinc-200 p-6 rounded-2xl cursor-pointer hover:bg-white hover:border-zinc-300 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <Music className="w-6 h-6 text-zinc-400 group-hover:text-white" />
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-bold">{song.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-1">{song.title}</h3>
                    <p className="text-zinc-500">{song.artist}</p>
                    <div className="mt-6 flex items-center gap-2 text-xs text-zinc-400">
                      <UserIcon className="w-3 h-3" />
                      <span>{song.uploaderName}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        )}

        {view === 'library' && (
          <div className="max-w-7xl mx-auto px-6 py-12" dir="rtl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
              <h1 className="text-4xl font-bold text-zinc-900">ספריית שירים</h1>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="חפש שיר או אמן..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pr-12 pl-4 py-3 text-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                {selectedSongsForExport.length > 0 && (
                  <button 
                    onClick={handleExport}
                    className="bg-zinc-900 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all"
                  >
                    <Download className="w-5 h-5" />
                    ייצא ({selectedSongsForExport.length})
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="px-6 py-4 font-bold text-zinc-500 text-sm">בחירה</th>
                    <th className="px-6 py-4 font-bold text-zinc-500 text-sm">שיר</th>
                    <th className="px-6 py-4 font-bold text-zinc-500 text-sm">אמן</th>
                    <th className="px-6 py-4 font-bold text-zinc-500 text-sm">מעלה</th>
                    <th className="px-6 py-4 font-bold text-zinc-500 text-sm">דירוג</th>
                    {isAdminUser && <th className="px-6 py-4 font-bold text-zinc-500 text-sm">פעולות</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredSongs.map((song) => (
                    <tr 
                      key={song.id} 
                      className="hover:bg-zinc-50 transition-colors cursor-pointer group"
                      onClick={() => { setSelectedSong(song); setIsSidebarOpen(true); }}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedSongsForExport.includes(song.id)}
                          onChange={() => toggleSelectForExport(song.id)}
                          className="w-5 h-5 rounded border-zinc-300 bg-white text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">{song.title}</div>
                      </td>
                      <td className="px-6 py-4 text-zinc-500">{song.artist}</td>
                      <td className="px-6 py-4 text-zinc-400 text-sm">{song.uploaderName}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-bold">{song.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </td>
                      {isAdminUser && (
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => handleDeleteSong(song.id)}
                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSongs.length === 0 && (
                <div className="py-20 text-center text-zinc-400 dark:text-zinc-500">
                  לא נמצאו שירים התואמים את החיפוש
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'upload' && (
          <UploadPage 
            onBack={() => setView('library')} 
            onUploadSuccess={() => setView('library')} 
          />
        )}

        {view === 'admin' && isAdminUser && (
          <UserManagement onBack={() => setView('library')} />
        )}
      </main>

      <SongViewer 
        song={selectedSong} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isAdminUser={isAdminUser}
        onDelete={handleDeleteSong}
      />

      {isProfileModalOpen && user && (
        <ProfileModal user={user} onClose={() => setIsProfileModalOpen(false)} />
      )}
    </div>
  );
}
