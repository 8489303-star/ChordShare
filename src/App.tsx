import React, { useState, useEffect, useMemo } from 'react';
import { auth, db, googleProvider, OperationType, handleFirestoreError } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { collection, query, orderBy, limit, onSnapshot, addDoc, Timestamp, where, getDocs, doc, updateDoc, increment, setDoc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Song, SongVersion, UserRating, ContactMessage } from './types';
import { parseChordPro } from './lib/chordpro';
import { cn } from './lib/utils';
import { ChordBookLanding } from './components/ChordBookLanding';
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
  FileJson,
  Smartphone,
  Edit3,
  Users,
  Eye,
  EyeOff,
  MessageSquare,
  Mail,
  Send,
  CheckCircle,
  Edit
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
      await updateProfile(user, { displayName: name.trim() });
      
      // Update uploaderName in all user's songs
      const songsQuery = query(collection(db, 'songs'), where('uploaderId', '==', user.uid));
      const songsSnap = await getDocs(songsQuery);
      const batch = writeBatch(db);
      songsSnap.docs.forEach(songDoc => {
        batch.update(songDoc.ref, { uploaderName: name.trim() });
      });
      await batch.commit();

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

const SongViewer = ({ song, isOpen, onClose, isAdminUser, onDelete, onAppClick, onToggleVisibility, onEdit }: { song: Song | null; isOpen: boolean; onClose: () => void; isAdminUser: boolean; onDelete: (id: string) => void; onAppClick: () => void; onToggleVisibility: (id: string, visible: boolean) => void; onEdit: (song: Song) => void }) => {
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

  const handleDownloadJson = () => {
    if (!song) return;
    const blob = new Blob([JSON.stringify(song, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.title}-${song.artist}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('השיר הורד בהצלחה!');
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
                  <button 
                    onClick={handleDownloadJson}
                    className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                    title="הורד JSON"
                  >
                    <Download className="w-6 h-6 text-zinc-500" />
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
                <div className="flex items-center gap-2">
                  <button 
                    onClick={onAppClick}
                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    קח להופעה באפליקציה
                  </button>
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

                {(isAdminUser || (auth.currentUser && song.uploaderId === auth.currentUser.uid)) && (
                  <div className="flex items-center gap-3 mt-6">
                    <button
                      onClick={() => onToggleVisibility(song.id, !song.visible)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        song.visible 
                          ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200" 
                          : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                      )}
                    >
                      {song.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      {song.visible ? 'הסתר שיר' : 'הצג שיר'}
                    </button>
                    <button
                      onClick={() => onEdit(song)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                    >
                      <Edit className="w-4 h-4" />
                      ערוך שיר
                    </button>
                    <button
                      onClick={() => onDelete(song.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      מחק שיר
                    </button>
                  </div>
                )}
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

const UploadPage = ({ onBack, onUploadSuccess, userName }: { onBack: () => void; onUploadSuccess: () => void; userName: string }) => {
  const [isManual, setIsManual] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [versionName, setVersionName] = useState('רגיל');
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
            uploaderName: userName || auth.currentUser?.displayName || 'אנונימי',
            createdAt: Timestamp.now(),
            rating: 0,
            ratingCount: 0,
            versions: versions,
            visible: true
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
        uploaderName: userName || auth.currentUser?.displayName || 'אנונימי',
        createdAt: Timestamp.now(),
        rating: 0,
        ratingCount: 0,
        versions: [{ name: versionName || 'רגיל', content }],
        visible: true
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
              <label className="block text-sm text-zinc-500 mb-1">שם הגרסה</label>
              <input 
                type="text" 
                value={versionName}
                onChange={e => setVersionName(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2 text-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="למשל: רגיל, הופעה חיה, פשוט"
              />
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

const EditPage = ({ song, onBack, onUpdateSuccess }: { song: Song; onBack: () => void; onUpdateSuccess: () => void }) => {
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [versions, setVersions] = useState<SongVersion[]>(song.versions);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'songs', song.id), {
        title,
        artist,
        versions
      });
      toast.success('השיר עודכן בהצלחה');
      onUpdateSuccess();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'songs');
    } finally {
      setIsUpdating(false);
    }
  };

  const updateVersion = (index: number, field: keyof SongVersion, value: string) => {
    const newVersions = [...versions];
    newVersions[index] = { ...newVersions[index], [field]: value };
    setVersions(newVersions);
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6" dir="rtl">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-8 transition-colors">
        <ChevronRight className="w-5 h-5" />
        <span>ביטול</span>
      </button>
      <h1 className="text-3xl font-bold text-zinc-900 mb-8">עריכת שיר</h1>
      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-500 mb-1">שם השיר</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2 text-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-1">אמן</label>
            <input 
              type="text" 
              value={artist}
              onChange={e => setArtist(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2 text-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        {versions.map((v, idx) => (
          <div key={idx} className="space-y-4 p-6 bg-zinc-50 rounded-xl border border-zinc-200">
            <div>
              <label className="block text-sm text-zinc-500 mb-1">שם הגרסה</label>
              <input 
                type="text" 
                value={v.name}
                onChange={e => updateVersion(idx, 'name', e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2 text-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-500 mb-1">תוכן (ChordPro)</label>
              <textarea 
                rows={10}
                value={v.content}
                onChange={e => updateVersion(idx, 'content', e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2 text-zinc-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        ))}
        <button 
          type="submit" 
          disabled={isUpdating}
          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
        >
          {isUpdating ? 'מעדכן...' : 'עדכן שיר'}
        </button>
      </form>
    </div>
  );
};

const ContactPage = ({ onBack, user }: { onBack: () => void; user: User | null }) => {
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      toast.error('נא למלא את כל השדות');
      return;
    }
    setIsSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        name,
        email,
        subject,
        message,
        createdAt: Timestamp.now(),
        userId: user?.uid || null
      });
      setIsSent(true);
      toast.success('ההודעה נשלחה בהצלחה!');
    } catch (err) {
      toast.error('שגיאה בשליחת ההודעה');
    } finally {
      setIsSending(false);
    }
  };

  if (isSent) {
    return (
      <div className="max-w-xl mx-auto py-24 px-6 text-center" dir="rtl">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 mb-4">תודה רבה!</h1>
        <p className="text-zinc-500 mb-8 text-lg">ההודעה שלך התקבלה בהצלחה. נחזור אליך בהקדם האפשרי.</p>
        <button onClick={onBack} className="bg-zinc-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all">
          חזרה לספרייה
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6" dir="rtl">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-8 transition-colors">
        <ChevronRight className="w-5 h-5" />
        <span>חזרה</span>
      </button>
      <h1 className="text-3xl font-bold text-zinc-900 mb-2">צור קשר</h1>
      <p className="text-zinc-500 mb-8">יש לך שאלה, הצעה או בעיה? נשמח לשמוע ממך.</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-500 mb-1">שם מלא</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2 text-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="השם שלך"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-1">אימייל</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2 text-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="כתובת האימייל שלך"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-zinc-500 mb-1">נושא</label>
          <input 
            type="text" 
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2 text-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="מה נושא הפנייה?"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-500 mb-1">הודעה</label>
          <textarea 
            rows={6}
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2 text-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="כתוב כאן את ההודעה שלך..."
          />
        </div>
        <button 
          type="submit" 
          disabled={isSending}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSending ? 'שולח...' : (
            <>
              <Send className="w-5 h-5" />
              שלח הודעה
            </>
          )}
        </button>
      </form>
    </div>
  );
};

const AdminMessages = ({ onBack }: { onBack: () => void }) => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ContactMessage)));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('האם למחוק את ההודעה?')) return;
    try {
      await deleteDoc(doc(db, 'messages', id));
      toast.success('ההודעה נמחקה');
    } catch (err) {
      toast.error('שגיאה במחיקה');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6" dir="rtl">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-8 transition-colors">
        <ChevronRight className="w-5 h-5" />
        <span>חזרה</span>
      </button>
      <h1 className="text-3xl font-bold text-zinc-900 mb-8">הודעות צור קשר</h1>
      
      {isLoading ? (
        <div className="py-20 text-center text-zinc-400">טוען הודעות...</div>
      ) : messages.length === 0 ? (
        <div className="py-20 text-center text-zinc-400 bg-zinc-50 rounded-3xl border border-zinc-200">אין הודעות חדשות</div>
      ) : (
        <div className="space-y-6">
          {messages.map(msg => (
            <div key={msg.id} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">{msg.subject}</h3>
                  <div className="flex items-center gap-4 text-sm text-zinc-500 mt-1">
                    <span className="flex items-center gap-1"><UserIcon className="w-4 h-4" /> {msg.name}</span>
                    <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {msg.email}</span>
                    <span>{msg.createdAt?.toDate().toLocaleString('he-IL')}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(msg.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <p className="text-zinc-700 whitespace-pre-wrap bg-zinc-50 p-4 rounded-xl border border-zinc-100">{msg.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [songsMap, setSongsMap] = useState<Record<string, Song[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [view, setView] = useState<'home' | 'library' | 'upload' | 'admin' | 'chordbook' | 'edit' | 'contact' | 'messages'>('home');
  const [selectedSongsForExport, setSelectedSongsForExport] = useState<string[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [isAdminUser, setIsAdminUser] = useState(false);

  const songs = useMemo(() => {
    const allSongs = Object.values(songsMap).flat() as Song[];
    const unique = Array.from(new Map(allSongs.map(s => [s.id, s])).values());
    return unique.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  }, [songsMap]);

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
    const songListeners: (() => void)[] = [];
    
    const handleSnap = (snap: any, key: string) => {
      const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Song));
      setSongsMap(prev => ({ ...prev, [key]: docs }));
    };

    if (isAdminUser) {
      const q = query(collection(db, 'songs'), orderBy('createdAt', 'desc'), limit(100));
      songListeners.push(onSnapshot(q, (snap) => handleSnap(snap, 'all'), (err) => handleFirestoreError(err, OperationType.LIST, 'songs')));
    } else {
      const qPublic = query(collection(db, 'songs'), where('visible', '==', true), orderBy('createdAt', 'desc'), limit(100));
      songListeners.push(onSnapshot(qPublic, (snap) => handleSnap(snap, 'public'), (err) => handleFirestoreError(err, OperationType.LIST, 'songs')));
      
      if (user) {
        const qPrivate = query(collection(db, 'songs'), where('uploaderId', '==', user.uid), where('visible', '==', false));
        songListeners.push(onSnapshot(qPrivate, (snap) => handleSnap(snap, 'private'), (err) => handleFirestoreError(err, OperationType.LIST, 'songs')));
      } else {
        // Clear private songs if logged out
        setSongsMap(prev => {
          const next = { ...prev };
          delete next.private;
          return next;
        });
      }
    }
    
    return () => songListeners.forEach(unsub => unsub());
  }, [user, isAdminUser]);

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
      if (selectedSong?.id === id) {
        setIsSidebarOpen(false);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'songs');
    }
  };

  const handleToggleVisibility = async (id: string, visible: boolean) => {
    try {
      await updateDoc(doc(db, 'songs', id), { visible });
      toast.success(visible ? 'השיר גלוי כעת לכולם' : 'השיר הוסתר');
      if (selectedSong?.id === id) {
        setSelectedSong(prev => prev ? { ...prev, visible } : null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'songs');
    }
  };

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
        <div className="max-w-7xl mx-auto flex justify-between items-center" dir="rtl">
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
              <button 
                onClick={() => setView('chordbook')}
                className={cn("transition-colors", view === 'chordbook' ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-900")}
              >
                אפליקציית ChordBook
              </button>
              <button 
                onClick={() => setView('contact')}
                className={cn("transition-colors", view === 'contact' ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-900")}
              >
                צור קשר
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && isAdminUser && (
              <>
                <button 
                  onClick={() => setView('messages')}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    view === 'messages' ? "bg-blue-100 text-blue-700" : "text-zinc-500 hover:bg-zinc-100"
                  )}
                  title="הודעות צור קשר"
                >
                  <Mail className="w-5 h-5" />
                </button>
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
              </>
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

              {/* Gentle App Promotion */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-16 p-6 bg-blue-50 rounded-3xl border border-blue-100 inline-flex flex-col sm:flex-row items-center gap-6 max-w-2xl mx-auto"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/20">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-zinc-900">רוצה לקחת את האקורדים לבמה?</h4>
                  <p className="text-sm text-zinc-500">אפליקציית ChordBook החדשה ל-Windows ו-Android מאפשרת לך לנגן בביטחון עם גלילה אוטומטית ושינוי סולמות.</p>
                </div>
                <button 
                  onClick={() => setView('chordbook')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-500 transition-all whitespace-nowrap"
                >
                  לפרטים והורדה
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
                {songs.filter(s => s.visible !== false).slice(0, 6).map((song) => (
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

            {/* Why Write Chords Section */}
            <section className="py-24 border-t border-zinc-100" dir="rtl">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="text-4xl font-black text-zinc-900 mb-6 leading-tight">
                    למה כדאי <br />
                    <span className="text-blue-600">לכתוב ולשתף?</span>
                  </h2>
                  <div className="space-y-8">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center shrink-0">
                        <Edit3 className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-zinc-900 mb-2">למתחילים: ללמוד דרך עשייה</h4>
                        <p className="text-zinc-500 leading-relaxed">
                          כתיבת אקורדים לשיר שאתם אוהבים היא הדרך הטובה ביותר להבין את המבנה שלו. 
                          אל תחששו מטעויות - הקהילה כאן כדי לעזור ולתקן. כל שיר פשוט שאתם מעלים עוזר לנגן אחר בתחילת דרכו.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-zinc-900 mb-2">למתקדמים: להוביל את הקהילה</h4>
                        <p className="text-zinc-500 leading-relaxed">
                          שתפו את העיבודים המדויקים שלכם, כולל אקורדים מורכבים וטאבים. 
                          הידע שלכם הוא נכס לקהילה, והוא מאפשר לנגנים אחרים להשתפר ולהגיע לרמות ביצוע גבוהות יותר.
                        </p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => user ? setView('upload') : handleLogin()}
                    className="mt-12 bg-zinc-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/20"
                  >
                    התחל לכתוב עכשיו
                  </button>
                </div>
                <div className="relative">
                  <div className="aspect-square bg-zinc-100 rounded-[3rem] rotate-3 absolute inset-0" />
                  <div className="aspect-square bg-white border border-zinc-200 rounded-[3rem] relative z-10 p-12 flex flex-col justify-center shadow-2xl">
                    <div className="space-y-4 font-mono text-sm">
                      <div className="flex gap-2">
                        <span className="text-blue-600 font-bold">[C]</span>
                        <span className="text-zinc-400">שלום</span>
                        <span className="text-blue-600 font-bold">[G]</span>
                        <span className="text-zinc-400">עולם</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-blue-600 font-bold">[Am]</span>
                        <span className="text-zinc-400">כמה</span>
                        <span className="text-blue-600 font-bold">[F]</span>
                        <span className="text-zinc-400">טוב</span>
                      </div>
                      <div className="pt-8 border-t border-zinc-100">
                        <p className="text-zinc-400 font-sans italic">"השיתוף שלכם בונה את ספריית המוזיקה הגדולה בישראל"</p>
                      </div>
                    </div>
                  </div>
                </div>
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
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">{song.title}</div>
                          {!song.visible && (
                            <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <EyeOff className="w-3 h-3" />
                              מוסתר
                            </span>
                          )}
                        </div>
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

        {view === 'messages' && isAdminUser && (
          <AdminMessages onBack={() => setView('home')} />
        )}

        {view === 'contact' && (
          <ContactPage onBack={() => setView('home')} user={user} />
        )}

        {view === 'edit' && editingSong && (
          <EditPage 
            song={editingSong} 
            onBack={() => setView('library')} 
            onUpdateSuccess={() => {
              setView('library');
              setEditingSong(null);
            }} 
          />
        )}

        {view === 'upload' && (
          <UploadPage 
            onBack={() => setView('library')} 
            onUploadSuccess={() => setView('library')} 
            userName={userName}
          />
        )}

        {view === 'admin' && isAdminUser && (
          <UserManagement onBack={() => setView('library')} />
        )}

        {view === 'chordbook' && (
          <ChordBookLanding onUploadClick={() => setView('upload')} />
        )}
      </main>

      <SongViewer 
        song={selectedSong} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isAdminUser={isAdminUser}
        onDelete={handleDeleteSong}
        onAppClick={() => { setIsSidebarOpen(false); setView('chordbook'); }}
        onToggleVisibility={handleToggleVisibility}
        onEdit={(song) => {
          setEditingSong(song);
          setIsSidebarOpen(false);
          setView('edit');
        }}
      />

      {isProfileModalOpen && user && (
        <ProfileModal user={user} onClose={() => setIsProfileModalOpen(false)} />
      )}
    </div>
  );
}
