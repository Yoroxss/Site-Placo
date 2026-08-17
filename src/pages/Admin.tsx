import React, { useState, useRef, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Lock, LogOut, ImagePlus, Loader2, Trash2, Star, Plus, 
  QrCode, BarChart3, MessageSquareText, FileText, Sparkles, Activity,
  PanelLeftClose, PanelLeftOpen, ExternalLink, Pencil, Edit3, Check, 
  Download, RefreshCw, X, Phone, MessageCircle, Mail, Smartphone,
  Share2, LayoutGrid, SlidersHorizontal, CheckCircle2, ChevronRight,
  ShieldCheck, ArrowUpRight
} from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_REVIEWS, ReviewItem } from '../data/defaultReviews';
import AiSeoDashboard from '../components/AiSeoDashboard';
import BlogAdminSection from '../components/BlogAdminSection';
import CaddieAnalyticsWidget from '../components/CaddieAnalyticsWidget';
import TrafficAnalyticsDashboard from '../components/TrafficAnalyticsDashboard';
import LaserQrGenerator from '../components/LaserQrGenerator';

type AdminTab = 'all' | 'traffic' | 'jetons' | 'qr_laser' | 'quotes' | 'reviews' | 'gallery' | 'ba' | 'seo';

export default function Admin() {
  const { adminCode, isAdmin, login, logout } = useAdmin();
  const [codeInput, setCodeInput] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [beforeAfterItems, setBeforeAfterItems] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // States for Before/After upload
  const [baTitle, setBaTitle] = useState('');
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [baUploading, setBaUploading] = useState(false);

  // States for manual Review creation
  const [revAuthor, setRevAuthor] = useState('');
  const [revCity, setRevCity] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revType, setRevType] = useState('');
  const [revComment, setRevComment] = useState('');
  const [revAdding, setRevAdding] = useState(false);

  // States for Review editing
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [revEditSaving, setRevEditSaving] = useState(false);

  // States for Photo Gallery editing & live AI re-analysis
  const [editingPhoto, setEditingPhoto] = useState<{ id: string; url: string; title: string; description: string; alt: string } | null>(null);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoReanalyzing, setPhotoReanalyzing] = useState(false);
  const [uploadDirectives, setUploadDirectives] = useState("");
  const [reanalyzeDirectives, setReanalyzeDirectives] = useState("");

  const [activeTab, setActiveTab] = useState<AdminTab>('traffic');

  // Mobile & PWA specific states
  const [showToolsSheet, setShowToolsSheet] = useState(false);
  const [showIosInstallModal, setShowIosInstallModal] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [isStandalonePwa, setIsStandalonePwa] = useState(false);

  // Landscape Mode support for mobile
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'gallery' | 'beforeAfter' | 'quote' | 'review' } | null>(null);
  const [feedback, setFeedback] = useState<{ message: string, type: 'error' | 'success' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Detect iOS, Standalone PWA and Orientation
  useEffect(() => {
    const checkPlatformAndOrientation = () => {
      // Check iOS user agent
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIosDevice(isIos);

      // Check if installed/running as standalone PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true;
      setIsStandalonePwa(isStandalone);

      // Check landscape on phones
      const isLand = window.matchMedia('(orientation: landscape) and (max-height: 650px)').matches;
      setIsLandscapeMobile(isLand);
    };

    checkPlatformAndOrientation();
    window.addEventListener('resize', checkPlatformAndOrientation);
    window.addEventListener('orientationchange', checkPlatformAndOrientation);
    return () => {
      window.removeEventListener('resize', checkPlatformAndOrientation);
      window.removeEventListener('orientationchange', checkPlatformAndOrientation);
    };
  }, []);

  // Clear feedback after 5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    if (isAdmin) {
      const qGallery = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
      const unsubGallery = onSnapshot(qGallery, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setImages(docs);
        try { localStorage.setItem('pb_gallery_cache', JSON.stringify(docs)); } catch {}
      });

      const qBA = query(collection(db, 'beforeAfter'), orderBy('createdAt', 'desc'));
      const unsubBA = onSnapshot(qBA, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBeforeAfterItems(docs);
        try { localStorage.setItem('pb_ba_cache', JSON.stringify(docs)); } catch {}
      });

      const qQuotes = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
      const unsubQuotes = onSnapshot(qQuotes, (snapshot) => {
        setQuotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const qReviews = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
      const unsubReviews = onSnapshot(qReviews, (snapshot) => {
        setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => {
        unsubGallery();
        unsubBA();
        unsubQuotes();
        unsubReviews();
      };
    }
  }, [isAdmin]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeInput === '0107') {
      login(codeInput);
    } else {
      setFeedback({ message: "Code incorrect.", type: 'error' });
    }
  };

    const getErrorMessage = (error: any): string => {
    if (error instanceof Error) return error.message;
    if (error && typeof error === "object") {
      if (error.isTrusted) {
        return "Le format de l'image n'est pas supporté (ex: les fichiers HEIC d'iPhone doivent être convertis en JPEG/PNG ou pris en mode 'Le plus compatible' avant l'envoi) ou le fichier est corrompu. Veuillez utiliser une image JPEG, PNG ou WebP.";
      }
      return JSON.stringify(error);
    }
    return String(error);
  };

  const resizeImage = (file: File, maxWidth = 1920, maxHeight = 1920, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        
        if (file.size < 400 * 1024) {
          resolve(base64);
          return;
        }
        const img = new Image();
        img.src = base64;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/webp', quality));
        };
        img.onerror = (err) => {
          console.error("Image load error:", err);
          reject(new Error("Le format ou l'encodage de cette image n'est pas supporté par votre navigateur (ex: les fichiers HEIC d'iPhone doivent être convertis en JPEG/PNG ou pris en mode 'Le plus compatible' avant l'envoi)."));
        };
      };
      reader.onerror = (err) => {
        console.error("FileReader error:", err);
        reject(new Error("Erreur de lecture du fichier. Veuillez réessayer avec une autre image."));
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setFeedback({ message: "Analyse visuelle détaillée de la photo par l'IA en cours...", type: 'success' });
      const base64Image = await resizeImage(file, 1920, 1920, 0.85);

      let metadata = {
        title: "Chantier Plâtrerie & Rénovation",
        description: "Réalisation soignée de plâtrerie, cloisons et finitions sur le Bassin d'Arcachon par Parat & Bouey.",
        alt: "Chantier de plâtrerie et aménagement intérieur Bassin d'Arcachon"
      };

      try {
        const response = await fetch('/api/generate-image-metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            imageBase64: base64Image,
            userDirectives: uploadDirectives 
          }),
        });

        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && !contentType.includes("application/json")) {
            throw new Error("Les serveurs sont temporairement indisponibles (503). Veuillez réessayer dans quelques instants.");
          }
          let data = null;
          try {
            data = await response.json();
          } catch (jsonErr) {
            console.warn("Invalid JSON response from server:", jsonErr);
            throw new Error("Réponse invalide du serveur");
          }
          if (data && (data.title || data.alt)) {
            metadata = {
              title: data.title || metadata.title,
              description: data.description || metadata.description,
              alt: data.alt || metadata.alt
            };
          }
        } else {
          const contentType = response.headers.get("content-type");
          let errData = null;
          if (contentType && contentType.includes("application/json")) {
             errData = await response.json().catch(() => null);
          }
          console.warn("AI metadata failed, proceeding with default metadata. Error:", errData);
          // silent fallback
        }
      } catch (metaErr) {
        console.warn("AI metadata warning:", metaErr);
      }

      await addDoc(collection(db, 'gallery'), {
        url: base64Image,
        title: metadata.title,
        description: metadata.description,
        alt: metadata.alt,
        createdAt: serverTimestamp(),
        adminCode
      });
      setFeedback({ 
        message: `Photo analysée par l'IA : « ${metadata.title} »`, 
        type: 'success' 
      });
    } catch (error) {
      console.error("Upload error:", error);
      setFeedback({ message: "Erreur d'upload: " + getErrorMessage(error), type: 'error' });
    } finally {
      setUploading(false);
      setUploadDirectives("");
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleStartEditPhoto = (image: any) => {
    setEditingPhoto({
      id: image.id,
      url: image.url,
      title: image.title || '',
      description: image.description || '',
      alt: image.alt || ''
    });
  };

  const handleReanalyzePhoto = async () => {
    if (!editingPhoto) return;
    setPhotoReanalyzing(true);
    try {
      const res = await fetch('/api/generate-image-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: editingPhoto.url,
          userDirectives: reanalyzeDirectives
        })
      });
      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
           const errorData = await res.json().catch(() => null);
           throw new Error(errorData?.error || "Erreur de réponse du serveur.");
        }
        throw new Error("Erreur de réponse du serveur.");
      }
      const contentType = res.headers.get("content-type");
      if (contentType && !contentType.includes("application/json")) {
        throw new Error("Les serveurs sont temporairement indisponibles (503). Veuillez réessayer dans quelques instants.");
      }
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error("Réponse invalide du serveur");
      }
      setEditingPhoto(prev => prev ? ({
        ...prev,
        title: data.title || prev.title,
        description: data.description || prev.description,
        alt: data.alt || prev.alt
      }) : null);
      setFeedback({ message: `Photo réanalysée par l'IA : « ${data.title} »`, type: 'success' });
    } catch (err: any) {
      console.error("Error reanalyzing photo:", err);
      setFeedback({ message: "Erreur lors de la réanalyse: " + (err.message || err), type: 'error' });
    } finally {
      setPhotoReanalyzing(false);
      setReanalyzeDirectives("");
    }
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;
    setPhotoSaving(true);
    try {
      await updateDoc(doc(db, 'gallery', editingPhoto.id), {
        title: editingPhoto.title.trim(),
        description: editingPhoto.description.trim(),
        alt: editingPhoto.alt.trim()
      });
      setFeedback({ message: "Photo mise à jour avec succès !", type: 'success' });
      setEditingPhoto(null);
    } catch (err: any) {
      console.error("Error updating photo:", err);
      setFeedback({ message: "Erreur lors de la sauvegarde: " + (err.message || err), type: 'error' });
    } finally {
      setPhotoSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setItemToDelete({ id, type: 'gallery' });
  };

  const handleBaUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beforeFile || !afterFile || !baTitle) {
      setFeedback({ message: "Veuillez fournir un titre et les deux images.", type: 'error' });
      return;
    }

    try {
      setBaUploading(true);
      const beforeBase64 = await resizeImage(beforeFile, 1920, 1920, 0.82);
      const afterBase64 = await resizeImage(afterFile, 1920, 1920, 0.82);

      await addDoc(collection(db, 'beforeAfter'), {
        title: baTitle,
        beforeUrl: beforeBase64,
        afterUrl: afterBase64,
        createdAt: serverTimestamp(),
        adminCode
      });

      setBaTitle('');
      setBeforeFile(null);
      setAfterFile(null);
      if (beforeInputRef.current) beforeInputRef.current.value = '';
      if (afterInputRef.current) afterInputRef.current.value = '';
      setFeedback({ message: "Images Avant/Après ajoutées avec succès !", type: 'success' });
    } catch (error) {
      console.error("Upload error:", error);
      setFeedback({ message: "Erreur d'upload: " + getErrorMessage(error), type: 'error' });
    } finally {
      setBaUploading(false);
    }
  };

  const handleDeleteBa = (id: string) => {
    setItemToDelete({ id, type: 'beforeAfter' });
  };

  const handleDeleteQuote = (id: string) => {
    setItemToDelete({ id, type: 'quote' });
  };

  const handleDeleteReview = (id: string) => {
    setItemToDelete({ id, type: 'review' });
  };

  const handleStartEditReview = (rev: ReviewItem) => {
    setEditingReview({
      id: rev.id,
      author: rev.author || '',
      city: rev.city || '',
      rating: rev.rating || 5,
      projectType: rev.projectType || '',
      comment: rev.comment || '',
      date: rev.date || new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    });
  };

  const handleSaveEditReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    setRevEditSaving(true);
    try {
      if (editingReview.id && !editingReview.id.startsWith('def-')) {
        await updateDoc(doc(db, 'reviews', editingReview.id), {
          author: editingReview.author.trim(),
          city: editingReview.city.trim() || 'Bassin d\'Arcachon',
          rating: Number(editingReview.rating),
          projectType: editingReview.projectType.trim() || 'Travaux de Plâtrerie',
          comment: editingReview.comment.trim(),
          date: editingReview.date || new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        });
      } else {
        if (reviews.length === 0) {
          for (const def of DEFAULT_REVIEWS) {
            const itemToSave = def.id === editingReview.id ? editingReview : def;
            await addDoc(collection(db, 'reviews'), {
              author: itemToSave.author,
              city: itemToSave.city,
              rating: Number(itemToSave.rating),
              projectType: itemToSave.projectType,
              comment: itemToSave.comment,
              verified: true,
              createdAt: serverTimestamp(),
              date: itemToSave.date || new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
            });
          }
        } else {
          await addDoc(collection(db, 'reviews'), {
            author: editingReview.author.trim(),
            city: editingReview.city.trim() || 'Bassin d\'Arcachon',
            rating: Number(editingReview.rating),
            projectType: editingReview.projectType.trim() || 'Travaux de Plâtrerie',
            comment: editingReview.comment.trim(),
            verified: true,
            createdAt: serverTimestamp(),
            date: editingReview.date || new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
          });
        }
      }
      setEditingReview(null);
      setFeedback({ message: "Avis client modifié et enregistré avec succès !", type: 'success' });
    } catch (error) {
      console.error("Error saving review edit:", error);
      setFeedback({ message: "Erreur lors de la modification de l'avis: " + getErrorMessage(error), type: 'error' });
    } finally {
      setRevEditSaving(false);
    }
  };

  const handleSeedDefaultReviews = async () => {
    setRevAdding(true);
    try {
      for (const def of DEFAULT_REVIEWS) {
        await addDoc(collection(db, 'reviews'), {
          author: def.author,
          city: def.city,
          rating: Number(def.rating),
          projectType: def.projectType,
          comment: def.comment,
          verified: true,
          createdAt: serverTimestamp(),
          date: def.date || new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        });
      }
      setFeedback({ message: "Les 3 avis exemples ont été enregistrés dans votre base ! Vous pouvez maintenant les modifier ou supprimer individuellement.", type: 'success' });
    } catch (error) {
      console.error("Error seeding reviews:", error);
      setFeedback({ message: "Erreur lors de l'import des avis: " + getErrorMessage(error), type: 'error' });
    } finally {
      setRevAdding(false);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revAuthor.trim() || !revComment.trim()) return;

    setRevAdding(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        author: revAuthor.trim(),
        city: revCity.trim() || 'Bassin d\'Arcachon',
        rating: Number(revRating),
        projectType: revType.trim() || 'Travaux de Plâtrerie',
        comment: revComment.trim(),
        verified: true,
        createdAt: serverTimestamp(),
        date: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      });

      setRevAuthor('');
      setRevCity('');
      setRevComment('');
      setRevType('');
      setFeedback({ message: "Avis client ajouté avec succès !", type: 'success' });
    } catch (error) {
      console.error("Error creating review:", error);
      setFeedback({ message: "Erreur lors de l'ajout de l'avis: " + getErrorMessage(error), type: 'error' });
    } finally {
      setRevAdding(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'gallery') {
        await deleteDoc(doc(db, 'gallery', itemToDelete.id));
      } else if (itemToDelete.type === 'beforeAfter') {
        await deleteDoc(doc(db, 'beforeAfter', itemToDelete.id));
      } else if (itemToDelete.type === 'quote') {
        await deleteDoc(doc(db, 'quotes', itemToDelete.id));
      } else if (itemToDelete.type === 'review') {
        if (itemToDelete.id.startsWith('def-') && reviews.length === 0) {
          const remaining = DEFAULT_REVIEWS.filter(r => r.id !== itemToDelete.id);
          for (const item of remaining) {
            await addDoc(collection(db, 'reviews'), {
              author: item.author,
              city: item.city,
              rating: Number(item.rating),
              projectType: item.projectType,
              comment: item.comment,
              verified: true,
              createdAt: serverTimestamp(),
              date: item.date || new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
            });
          }
        } else {
          await deleteDoc(doc(db, 'reviews', itemToDelete.id));
        }
      }
      setFeedback({ message: "Élément supprimé avec succès.", type: 'success' });
    } catch (error) {
      console.error("Delete error:", error);
      setFeedback({ message: "Erreur de suppression: " + getErrorMessage(error), type: 'error' });
    } finally {
      setItemToDelete(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#0a0a0a] text-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/10 max-w-sm w-full backdrop-blur-xl max-h-[95vh] overflow-y-auto"
        >
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/30 text-amber-400 shadow-lg">
              <Lock className="w-6 h-6" />
            </div>
          </div>
          
          <div className="text-center mb-6">
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-300/80 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              PWA • Espace Mobile Sécurisé
            </span>
            <h1 className="text-2xl mt-3 font-light text-white" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Administration
            </h1>
            <p className="text-xs text-white/50 mt-1">Parat & Bouey Plâtrerie</p>
          </div>
          
          {feedback && (
            <div className={`mb-4 p-3 rounded-xl border text-xs text-center ${feedback.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1.5 font-mono">Code d'accès</label>
              <input 
                type="password"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-amber-400 transition-all text-base text-white font-mono tracking-widest text-center"
                placeholder="••••"
                autoFocus
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-amber-500 text-black rounded-xl px-4 py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-amber-400 transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-98"
            >
              Déverrouiller le Tableau de bord
            </button>
          </form>
          
          <div className="mt-6 pt-4 border-t border-white/10 text-center">
             <Link to="/" className="text-[11px] uppercase tracking-widest text-white/50 hover:text-white transition-colors flex items-center justify-center gap-1.5">
               <ArrowLeft className="w-3.5 h-3.5" />
               <span>Retourner au site public</span>
             </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // All tabs definitions
  const navTabs = [
    { id: 'traffic' as AdminTab, label: 'Trafic & Circulation', shortLabel: 'Trafic', icon: Activity },
    { id: 'jetons' as AdminTab, label: 'Scans Jetons Caddie', shortLabel: 'Jetons', icon: BarChart3 },
    { id: 'quotes' as AdminTab, label: `Devis (${quotes.length})`, shortLabel: `Devis`, icon: FileText, count: quotes.length },
    { id: 'reviews' as AdminTab, label: `Avis (${reviews.length})`, shortLabel: `Avis`, icon: Star, count: reviews.length },
    { id: 'qr_laser' as AdminTab, label: 'Générateur Laser QR', shortLabel: 'Laser QR', icon: QrCode },
    { id: 'gallery' as AdminTab, label: 'Galerie Photos', shortLabel: 'Galerie', icon: ImagePlus },
    { id: 'ba' as AdminTab, label: 'Avant / Après', shortLabel: 'Av/Ap', icon: Sparkles },
    { id: 'seo' as AdminTab, label: 'SEO & Blog', shortLabel: 'SEO', icon: MessageSquareText },
    { id: 'all' as AdminTab, label: 'Tout voir (Vue Globale)', shortLabel: 'Tout', icon: LayoutGrid },
  ];

  const currentTabObj = navTabs.find(t => t.id === activeTab) || navTabs[0];

  return (
    <div className={`text-white ${isLandscapeMobile ? 'admin-landscape-shell' : 'min-h-screen bg-[#0a0a0a] pb-28 sm:pb-24 pt-safe'}`}>
      
      {/* =========================================================================
          PWA MOBILE TOP APP BAR (iOS Style Header)
          ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-2.5 sm:py-3 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          
          {/* Brand & Live status */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-serif font-bold text-amber-300 text-xs shadow-inner shrink-0">
              PB
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-semibold text-white tracking-wide truncate">
                  Admin Parat & Bouey
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-[10px] text-white/50 truncate hidden sm:block">
                Tableau de bord & Gestion mobile iOS / PWA
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* iPhone PWA Install Guide trigger */}
            {!isStandalonePwa && (
              <button
                onClick={() => setShowIosInstallModal(true)}
                className="hidden xs:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[11px] font-medium text-amber-300 transition-all active:scale-95 cursor-pointer"
                title="Installer sur l'écran d'accueil iPhone"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Installer l'App</span>
                <span className="sm:hidden">App iOS</span>
              </button>
            )}

            <Link
              to="/"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/70 hover:text-white transition-all active:scale-95"
              title="Voir le site public"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Site Public</span>
            </Link>

            <button 
              onClick={logout} 
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs text-red-300 transition-all active:scale-95 cursor-pointer"
              title="Déconnexion"
            >
              <LogOut className="w-3.5 h-3.5" /> 
              <span className="hidden sm:inline">Quitter</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          LANDSCAPE MOBILE SIDEBAR / NAVIGATION RAIL (When turned horizontally)
          ========================================================================= */}
      {isLandscapeMobile && (
        <aside className={`admin-landscape-sidebar ${isSidebarCollapsed ? 'collapsed' : 'expanded'} flex flex-col justify-between py-2 px-1.5 border-r border-white/10 bg-[#0c0c0c]/95 backdrop-blur-md shrink-0`}>
          <div>
            <div className="flex items-center justify-between px-1.5 py-1 mb-2 border-b border-white/10">
              {!isSidebarCollapsed && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 truncate">
                  Admin PB
                </span>
              )}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors mx-auto cursor-pointer"
                title={isSidebarCollapsed ? "Développer le menu" : "Réduire le menu"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4 text-amber-400" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            </div>

            <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-110px)] scrollbar-none">
              {navTabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    title={tab.label}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs transition-all relative cursor-pointer ${
                      isActive 
                        ? 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20' 
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 shrink-0 mx-auto" />
                    {!isSidebarCollapsed && (
                      <span className="truncate flex-1 text-left">{tab.shortLabel}</span>
                    )}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono shrink-0 ${
                        isActive ? 'bg-black text-amber-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-2 border-t border-white/10 space-y-1">
            <Link
              to="/"
              title="Voir le site"
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 mx-auto shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Site public</span>}
            </Link>

            <button
              onClick={logout}
              title="Déconnexion"
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 mx-auto shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Quitter</span>}
            </button>
          </div>
        </aside>
      )}

      {/* =========================================================================
          MAIN WORKSPACE CONTENT (Responsive for Mobile & Desktop)
          ========================================================================= */}
      <main className={`max-w-6xl mx-auto px-3 sm:px-6 md:px-12 pt-4 sm:pt-6 ${isLandscapeMobile ? 'admin-landscape-content' : 'w-full'}`}>
        
        {/* QUICK METRICS WIDGET RIBBON (Fast touch summary on Mobile) */}
        {!isLandscapeMobile && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-5 sm:mb-6">
            
            {/* Metric 1: Trafic */}
            <button
              onClick={() => setActiveTab('traffic')}
              className={`p-3 sm:p-4 rounded-2xl border text-left transition-all active:scale-98 cursor-pointer ${
                activeTab === 'traffic'
                  ? 'bg-amber-500/15 border-amber-500/40 shadow-lg shadow-amber-500/5'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider font-mono text-white/60">Trafic Live</span>
                <Activity className={`w-4 h-4 ${activeTab === 'traffic' ? 'text-amber-400' : 'text-white/40'}`} />
              </div>
              <div className="text-base sm:text-lg font-bold text-white font-mono flex items-baseline gap-1.5">
                <span>Temps réel</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
            </button>

            {/* Metric 2: Scans Jetons */}
            <button
              onClick={() => setActiveTab('jetons')}
              className={`p-3 sm:p-4 rounded-2xl border text-left transition-all active:scale-98 cursor-pointer ${
                activeTab === 'jetons'
                  ? 'bg-amber-500/15 border-amber-500/40 shadow-lg shadow-amber-500/5'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider font-mono text-white/60">Jetons Caddie</span>
                <BarChart3 className={`w-4 h-4 ${activeTab === 'jetons' ? 'text-amber-400' : 'text-white/40'}`} />
              </div>
              <div className="text-base sm:text-lg font-bold text-amber-300 font-mono">
                Scans & Villes
              </div>
            </button>

            {/* Metric 3: Devis */}
            <button
              onClick={() => setActiveTab('quotes')}
              className={`p-3 sm:p-4 rounded-2xl border text-left transition-all active:scale-98 cursor-pointer relative overflow-hidden ${
                activeTab === 'quotes'
                  ? 'bg-amber-500/15 border-amber-500/40 shadow-lg shadow-amber-500/5'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider font-mono text-white/60">Demandes Devis</span>
                <FileText className={`w-4 h-4 ${activeTab === 'quotes' ? 'text-amber-400' : 'text-white/40'}`} />
              </div>
              <div className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
                <span>{quotes.length}</span>
                {quotes.length > 0 && (
                  <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-bold">
                    Reçus
                  </span>
                )}
              </div>
            </button>

            {/* Metric 4: Avis */}
            <button
              onClick={() => setActiveTab('reviews')}
              className={`p-3 sm:p-4 rounded-2xl border text-left transition-all active:scale-98 cursor-pointer ${
                activeTab === 'reviews'
                  ? 'bg-amber-500/15 border-amber-500/40 shadow-lg shadow-amber-500/5'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider font-mono text-white/60">Avis Clients</span>
                <Star className={`w-4 h-4 ${activeTab === 'reviews' ? 'text-amber-400' : 'text-white/40'}`} />
              </div>
              <div className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-1.5">
                <span className="text-amber-400">5.0 ★</span>
                <span className="text-xs text-white/50 font-normal">({reviews.length > 0 ? reviews.length : DEFAULT_REVIEWS.length})</span>
              </div>
            </button>
          </div>
        )}

        {/* Feedback Toast */}
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs shadow-xl backdrop-blur-md ${
              feedback.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-300' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="opacity-60 hover:opacity-100 p-1 cursor-pointer">×</button>
          </motion.div>
        )}

        {/* Desktop / Tablet Horizontal Navigation Tabs (Hidden in pure mobile portrait mode) */}
        {!isLandscapeMobile && (
          <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
            {navTabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? tab.id === 'all' 
                        ? 'bg-white text-black font-bold' 
                        : 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                      : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* =========================================================================
            0. TABLEAU DE BORD TRAFIC ET CIRCULATION GLOBALE DU SITE
            ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'traffic') && (
          <div className="mb-6 sm:mb-8">
            <TrafficAnalyticsDashboard />
          </div>
        )}

        {/* =========================================================================
            1. SUIVI ANALYTICS JETONS CADDIE
            ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'jetons') && (
          <div className="mb-6 sm:mb-8">
            <CaddieAnalyticsWidget />
          </div>
        )}

        {/* =========================================================================
            2. GENERATEUR QR CODE GRAVURE LASER (LIGHTBURN / VECTORIEL)
            ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'qr_laser') && (
          <div className="mb-6 sm:mb-8">
            <LaserQrGenerator 
              onScanSimulate={async (url) => {
                try {
                  const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
                  const source = urlObj.searchParams.get('r') || urlObj.searchParams.get('ref') || urlObj.searchParams.get('source') || urlObj.searchParams.get('s') || urlObj.searchParams.get('j') || 'jeton';
                  
                  let geoInfo = {
                    city: 'Arcachon',
                    region: 'Nouvelle-Aquitaine',
                    department: 'Gironde (33)',
                    postalCode: '33120',
                    country: 'France',
                    countryCode: 'FR',
                    latitude: 44.6586,
                    longitude: -1.1648,
                    isp: 'Test Gravure Laser'
                  };

                  try {
                    const geoRes = await fetch('/api/geolocate-ip');
                    if (geoRes.ok) {
                      const data = await geoRes.json();
                      if (data && data.city) {
                        geoInfo = { ...geoInfo, ...data };
                      }
                    }
                  } catch {}

                  await addDoc(collection(db, 'caddie_scans'), {
                    source: source,
                    rawUrl: url,
                    path: '/',
                    device: 'Mobile',
                    browser: 'Simulateur Laser',
                    os: 'Mobile QR Scanner',
                    screen: '1080x2400',
                    city: geoInfo.city,
                    region: geoInfo.region,
                    department: geoInfo.department,
                    postalCode: geoInfo.postalCode,
                    country: geoInfo.country,
                    countryCode: geoInfo.countryCode,
                    latitude: geoInfo.latitude || null,
                    longitude: geoInfo.longitude || null,
                    isp: geoInfo.isp || 'Orange / SFR 4G',
                    referrer: 'Scan Jeton Gravé Laser',
                    createdAt: serverTimestamp()
                  });
                  setFeedback({ 
                    message: `Scan de test pour "?r=${source}" à ${geoInfo.city} (${geoInfo.postalCode}) enregistré avec succès !`, 
                    type: 'success' 
                  });
                } catch (err) {
                  console.error(err);
                  setFeedback({ message: "Erreur lors de l'enregistrement du scan.", type: 'error' });
                }
              }}
            />
          </div>
        )}

        {/* =========================================================================
            3. DEMANDES DE DEVIS (Optimisé Mobile avec boutons direct Appel / SMS / Mail)
            ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'quotes') && (
          <div className="bg-white/5 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-md mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-white/10">
              <div>
                <h2 className="text-base sm:text-xl tracking-widest uppercase text-[#d1d1c4] font-light flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Demandes de devis reçues
                </h2>
                <p className="text-xs text-white/50 mt-0.5">
                  {quotes.length} demande{quotes.length > 1 ? 's' : ''} de devis enregistrée{quotes.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {quotes.length === 0 ? (
              <div className="text-center py-12 text-white/40 text-xs sm:text-sm bg-black/20 rounded-2xl border border-white/5">
                Aucune demande de devis pour le moment.
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {quotes.map((quote) => {
                  const smsBody = encodeURIComponent(`Bonjour ${quote.name}, j'ai bien reçu votre demande de devis sur notre site Parat & Bouey Plâtrerie. À quel moment seriez-vous disponible pour que nous en discutions ?`);
                  const mailSubject = encodeURIComponent(`Votre demande de devis - Entreprise Parat & Bouey Plâtrerie`);
                  const mailBody = encodeURIComponent(`Bonjour ${quote.name},\n\nNous avons bien pris connaissance de votre projet de ${quote.projectType || 'plâtrerie'}.\n\nNous restons à votre entière disposition.`);

                  return (
                    <div key={quote.id} className="bg-black/50 border border-white/10 rounded-2xl p-4 sm:p-5 relative group hover:border-amber-500/30 transition-all shadow-md">
                      
                      {/* Top Header Card */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-bold text-white">
                              {quote.name || 'Client sans nom'}
                            </h3>
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              {quote.projectType || 'Projet Plâtrerie'}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-white/40 mt-0.5 block">
                            {quote.createdAt?.toDate ? quote.createdAt.toDate().toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Date récente'}
                          </span>
                        </div>

                        {/* Delete Button */}
                        <button 
                          onClick={() => handleDeleteQuote(quote.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="Supprimer la demande"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Message Content */}
                      <div className="bg-white/5 p-3 sm:p-3.5 rounded-xl border border-white/5 mb-4 text-xs sm:text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                        {quote.message || 'Aucun message particulier précisé.'}
                      </div>

                      {/* TACTILE 1-TAP CONTACT ACTIONS (FOR IPHONE & MOBILE) */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                        {/* Call */}
                        {quote.phone ? (
                          <a
                            href={`tel:${quote.phone}`}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all active:scale-95"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span className="truncate">Appeler</span>
                          </a>
                        ) : (
                          <span className="flex items-center justify-center py-2.5 px-2 rounded-xl bg-white/5 text-white/30 text-xs cursor-not-allowed">
                            Pas de tél
                          </span>
                        )}

                        {/* SMS Direct */}
                        {quote.phone ? (
                          <a
                            href={`sms:${quote.phone}?&body=${smsBody}`}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-all active:scale-95"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="truncate">SMS</span>
                          </a>
                        ) : (
                          <span className="flex items-center justify-center py-2.5 px-2 rounded-xl bg-white/5 text-white/30 text-xs cursor-not-allowed">
                            Pas de SMS
                          </span>
                        )}

                        {/* Email Direct */}
                        {quote.email ? (
                          <a
                            href={`mailto:${quote.email}?subject=${mailSubject}&body=${mailBody}`}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all active:scale-95"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span className="truncate">Email</span>
                          </a>
                        ) : (
                          <span className="flex items-center justify-center py-2.5 px-2 rounded-xl bg-white/5 text-white/30 text-xs cursor-not-allowed">
                            Pas d'email
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {/* =========================================================================
            4. GESTION DES AVIS CLIENTS
            ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'reviews') && (
          <div className="bg-white/5 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-md mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base sm:text-xl tracking-widest uppercase text-[#d1d1c4] font-light flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  Gestion des Avis Clients
                </h2>
                <p className="text-xs text-white/50 mt-1">Ajoutez, modifiez ou supprimez les avis et témoignages affichés sur votre site.</p>
              </div>

              {reviews.length === 0 && (
                <button
                  onClick={handleSeedDefaultReviews}
                  disabled={revAdding}
                  className="bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-[10px] uppercase tracking-wider font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                  title="Enregistre les 3 avis de démonstration dans votre base Firestore pour pouvoir les personnaliser librement"
                >
                  {revAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>Importer les 3 avis d'exemples dans la base</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form to add new review */}
              <div className="lg:col-span-5 bg-black/40 border border-white/10 p-4 sm:p-6 rounded-2xl">
                <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-amber-300 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Ajouter un nouvel avis client
                </h3>
                
                <form onSubmit={handleCreateReview} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Nom du client *</label>
                    <input
                      type="text"
                      required
                      value={revAuthor}
                      onChange={(e) => setRevAuthor(e.target.value)}
                      placeholder="Ex: Marc L."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Ville</label>
                      <input
                        type="text"
                        value={revCity}
                        onChange={(e) => setRevCity(e.target.value)}
                        placeholder="Ex: Le Teich"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Note (1-5)</label>
                      <select
                        value={revRating}
                        onChange={(e) => setRevRating(Number(e.target.value))}
                        className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                        <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                        <option value={3}>⭐⭐⭐ (3/5)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Type de travaux</label>
                    <input
                      type="text"
                      value={revType}
                      onChange={(e) => setRevType(e.target.value)}
                      placeholder="Ex: Rénovation séjour, Faux-plafond..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Commentaire *</label>
                    <textarea
                      required
                      rows={3}
                      value={revComment}
                      onChange={(e) => setRevComment(e.target.value)}
                      placeholder="Contenu du témoignage..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={revAdding}
                    className="w-full bg-amber-500 text-black text-[10px] uppercase tracking-widest font-bold py-3 rounded-xl hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md active:scale-98"
                  >
                    {revAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer l\'avis'}
                  </button>
                </form>
              </div>

              {/* List of existing reviews */}
              <div className="lg:col-span-7">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white/70">
                    Avis affichés sur le site ({reviews.length > 0 ? reviews.length : DEFAULT_REVIEWS.length})
                  </h3>
                  {reviews.length === 0 && (
                    <span className="text-[9px] font-mono text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Mode exemple actif
                    </span>
                  )}
                </div>

                {reviews.length === 0 ? (
                  <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-xs">
                      💡 <strong>3 avis d'exemples</strong> sont actuellement visibles sur votre site. Vous pouvez cliquer sur <strong>Modifier</strong> pour changer leurs textes ou <strong>Supprimer</strong> pour en retirer un.
                    </div>
                    {DEFAULT_REVIEWS.map((rev) => (
                      <div key={rev.id} className="p-3.5 sm:p-4 bg-black/40 border border-white/10 rounded-xl relative group flex items-start justify-between gap-3 hover:border-amber-500/30 transition-colors">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="font-semibold text-white text-xs">{rev.author}</span>
                            <span className="text-[10px] text-white/40">({rev.city})</span>
                            <div className="flex items-center text-amber-400">
                              {[...Array(rev.rating || 5)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400" />
                              ))}
                            </div>
                            <span className="text-[9px] font-mono bg-white/5 text-white/50 px-1.5 py-0.5 rounded border border-white/5">
                              Exemple
                            </span>
                          </div>
                          <p className="text-xs text-white/70 italic leading-relaxed line-clamp-3">"{rev.comment}"</p>
                          <span className="text-[10px] font-mono text-amber-300/80 block">{rev.projectType} • {rev.date}</span>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => handleStartEditReview(rev)}
                            className="p-2 text-amber-300 hover:text-white hover:bg-amber-500/20 rounded-lg transition-colors cursor-pointer"
                            title="Modifier cet avis"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(rev.id!)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer cet avis"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="p-3.5 sm:p-4 bg-black/40 border border-white/10 rounded-xl relative group flex items-start justify-between gap-3 hover:border-amber-500/30 transition-colors">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="font-semibold text-white text-xs">{rev.author}</span>
                            <span className="text-[10px] text-white/40">({rev.city})</span>
                            <div className="flex items-center text-amber-400">
                              {[...Array(rev.rating || 5)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-white/70 italic leading-relaxed">"{rev.comment}"</p>
                          <span className="text-[10px] font-mono text-amber-300/80 block">{rev.projectType} • {rev.date}</span>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => handleStartEditReview(rev)}
                            className="p-2 text-amber-300 hover:text-white hover:bg-amber-500/20 rounded-lg transition-colors cursor-pointer"
                            title="Modifier cet avis"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer cet avis"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            5. GALERIE PHOTOS
            ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'gallery') && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6 sm:mb-8">
            <div className="md:col-span-4 space-y-6">
              <div className="bg-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-md">
                <h2 className="text-base sm:text-lg tracking-widest uppercase text-[#d1d1c4] mb-3 font-light">Édition du site</h2>
                <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-5">
                  L'édition des textes se fait directement sur le site public une fois connecté à l'administration.
                </p>
                <Link to="/" className="inline-flex w-full justify-center bg-white text-black rounded-xl px-4 py-3 text-xs uppercase tracking-widest font-bold hover:bg-[#d1d1c4] transition-colors">
                  Retourner sur le site
                </Link>
              </div>
            </div>

            <div className="md:col-span-8 bg-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base sm:text-lg tracking-widest uppercase text-[#d1d1c4] font-light">Gestion de la Galerie</h2>
                  <p className="text-xs text-white/50 mt-0.5">{images.length} photo{images.length > 1 ? 's' : ''} publiées</p>
                </div>
                
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-amber-500/15 border border-amber-500/30 text-amber-300 px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 hover:bg-amber-500/25 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Analyse IA...</>
                  ) : (
                    <><ImagePlus className="w-4 h-4" /> Ajouter une photo</>
                  )}
                </button>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 space-y-2.5">
                <label className="block text-xs uppercase tracking-wider text-amber-300 font-mono">
                  Instructions IA supplémentaires pour la photo (Optionnel)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={uploadDirectives}
                    onChange={(e) => setUploadDirectives(e.target.value)}
                    placeholder="Ex: Ne mentionne pas de verrière, c'est un salon avec un caisson de plafond..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-500 font-sans"
                  />
                  {uploadDirectives && (
                    <button 
                      type="button"
                      onClick={() => setUploadDirectives("")}
                      className="px-2 text-xs text-white/50 hover:text-white cursor-pointer"
                    >
                      Effacer
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-white/40 leading-relaxed">
                  Renseignez ces consignes <strong>avant</strong> de cliquer sur le bouton "Ajouter une photo" ci-dessus pour orienter l'analyse de l'IA (ex: précisions sur les matériaux, absence de certains éléments, etc.).
                </p>
              </div>

              {images.length === 0 ? (
                <div className="text-center py-10 text-white/40 text-xs sm:text-sm bg-black/20 rounded-xl border border-white/5">
                  Aucune photo dans la galerie.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {images.map(image => (
                    <div key={image.id} className="group relative bg-black/40 rounded-xl overflow-hidden border border-white/10 flex flex-col justify-between hover:border-amber-500/30 transition-all">
                      <div>
                        <div className="aspect-video relative overflow-hidden bg-black/60">
                          <img src={image.url} alt={image.alt} className="w-full h-full object-cover" />
                          <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleStartEditPhoto(image)}
                              className="p-2 bg-black/70 hover:bg-amber-500 hover:text-black text-amber-300 rounded-lg transition-colors backdrop-blur-md shadow-lg cursor-pointer"
                              title="Modifier / Analyse IA"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(image.id)}
                              className="p-2 bg-black/70 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors backdrop-blur-md shadow-lg cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="p-3.5">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-xs sm:text-sm font-semibold text-white truncate">{image.title || 'Chantier sans titre'}</h3>
                          </div>
                          <p className="text-[11px] text-white/70 leading-relaxed mb-2.5 line-clamp-2">{image.description || 'Aucune description'}</p>
                          <div className="text-[9px] text-amber-300/70 border-t border-white/10 pt-2 truncate font-mono">
                            Alt: {image.alt || 'Non renseigné'}
                          </div>
                        </div>
                      </div>
                      <div className="px-3.5 pb-3 pt-1 border-t border-white/5 flex items-center justify-between">
                        <button
                          onClick={() => handleStartEditPhoto(image)}
                          className="text-[10px] font-mono uppercase tracking-wider text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer py-1"
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          Modifier & IA
                        </button>
                        <span className="text-[9px] text-white/40 font-mono">
                          {image.createdAt?.toDate ? image.createdAt.toDate().toLocaleDateString('fr-FR') : 'Galerie'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            6. AVANT / APRÈS
            ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'ba') && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6 sm:mb-8">
            <div className="md:col-span-5 bg-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-md">
              <h2 className="text-base sm:text-lg tracking-widest uppercase text-[#d1d1c4] mb-4 font-light">Ajouter un Avant / Après</h2>
              
              <form onSubmit={handleBaUpload} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1.5">Titre de la réalisation</label>
                  <input 
                    type="text" 
                    value={baTitle}
                    onChange={(e) => setBaTitle(e.target.value)}
                    placeholder="Ex: Rénovation Faux-Plafond Led"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1.5">Photo Avant</label>
                    <input 
                      type="file" 
                      ref={beforeInputRef}
                      onChange={(e) => setBeforeFile(e.target.files?.[0] || null)}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => beforeInputRef.current?.click()}
                      className={`w-full py-3 px-3 rounded-xl border text-xs flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${beforeFile ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-black/30 border-white/10 text-white/70 hover:bg-white/5'}`}
                    >
                      <ImagePlus className="w-4 h-4" />
                      <span className="truncate max-w-full text-[10px]">
                        {beforeFile ? beforeFile.name : 'Choisir Avant'}
                      </span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1.5">Photo Après</label>
                    <input 
                      type="file" 
                      ref={afterInputRef}
                      onChange={(e) => setAfterFile(e.target.files?.[0] || null)}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => afterInputRef.current?.click()}
                      className={`w-full py-3 px-3 rounded-xl border text-xs flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${afterFile ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-black/30 border-white/10 text-white/70 hover:bg-white/5'}`}
                    >
                      <ImagePlus className="w-4 h-4" />
                      <span className="truncate max-w-full text-[10px]">
                        {afterFile ? afterFile.name : 'Choisir Après'}
                      </span>
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={baUploading || !beforeFile || !afterFile || !baTitle}
                  className="w-full bg-amber-500 text-black py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
                >
                  {baUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publier la comparaison'}
                </button>
              </form>
            </div>

            <div className="md:col-span-7 bg-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-md">
              <h2 className="text-base sm:text-lg tracking-widest uppercase text-[#d1d1c4] mb-4 font-light">
                Comparaisons Avant / Après ({beforeAfterItems.length})
              </h2>

              {beforeAfterItems.length === 0 ? (
                <div className="text-center py-10 text-white/40 text-xs sm:text-sm bg-black/20 rounded-xl border border-white/5">
                  Aucun avant/après enregistré.
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {beforeAfterItems.map(item => (
                    <div key={item.id} className="bg-black/40 border border-white/10 rounded-2xl p-4 relative group">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs sm:text-sm font-semibold text-white truncate">{item.title}</h3>
                        <button 
                          onClick={() => handleDeleteBa(item.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative rounded-xl overflow-hidden aspect-video border border-white/10">
                          <img src={item.beforeUrl} alt="Avant" className="w-full h-full object-cover" />
                          <span className="absolute bottom-1.5 left-1.5 bg-black/70 px-2 py-0.5 rounded text-[9px] uppercase font-mono tracking-wider">Avant</span>
                        </div>
                        <div className="relative rounded-xl overflow-hidden aspect-video border border-white/10">
                          <img src={item.afterUrl} alt="Après" className="w-full h-full object-cover" />
                          <span className="absolute bottom-1.5 left-1.5 bg-amber-500 text-black px-2 py-0.5 rounded text-[9px] uppercase font-mono tracking-wider font-bold">Après</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            7. SEO IA & BLOG
            ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'seo') && (
          <div className="space-y-6 mb-6 sm:mb-8">
            <AiSeoDashboard />
            <BlogAdminSection />
          </div>
        )}

      </main>

      {/* =========================================================================
          MOBILE BOTTOM NAVIGATION TAB BAR (iOS App Style)
          ========================================================================= */}
      {!isLandscapeMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0c0c0c]/95 backdrop-blur-xl border-t border-white/10 bottom-bar-safe md:hidden px-3 pt-2">
          <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
            
            {/* Tab 1: Trafic */}
            <button
              onClick={() => setActiveTab('traffic')}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
                activeTab === 'traffic' ? 'text-amber-400 font-bold scale-105' : 'text-white/50 hover:text-white'
              }`}
            >
              <Activity className="w-5 h-5 mb-1" />
              <span className="text-[10px] tracking-tight">Trafic</span>
            </button>

            {/* Tab 2: Jetons */}
            <button
              onClick={() => setActiveTab('jetons')}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
                activeTab === 'jetons' ? 'text-amber-400 font-bold scale-105' : 'text-white/50 hover:text-white'
              }`}
            >
              <BarChart3 className="w-5 h-5 mb-1" />
              <span className="text-[10px] tracking-tight">Jetons</span>
            </button>

            {/* Tab 3: Devis (with badge) */}
            <button
              onClick={() => setActiveTab('quotes')}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer relative ${
                activeTab === 'quotes' ? 'text-amber-400 font-bold scale-105' : 'text-white/50 hover:text-white'
              }`}
            >
              <div className="relative">
                <FileText className="w-5 h-5 mb-1" />
                {quotes.length > 0 && (
                  <span className="absolute -top-1 -right-2.5 bg-amber-500 text-black font-mono font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                    {quotes.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">Devis</span>
            </button>

            {/* Tab 4: Avis */}
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
                activeTab === 'reviews' ? 'text-amber-400 font-bold scale-105' : 'text-white/50 hover:text-white'
              }`}
            >
              <Star className="w-5 h-5 mb-1" />
              <span className="text-[10px] tracking-tight">Avis</span>
            </button>

            {/* Tab 5: Outils / Menu Sheet */}
            <button
              onClick={() => setShowToolsSheet(true)}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
                ['qr_laser', 'gallery', 'ba', 'seo', 'all'].includes(activeTab) ? 'text-amber-400 font-bold scale-105' : 'text-white/50 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-5 h-5 mb-1" />
              <span className="text-[10px] tracking-tight">Outils</span>
            </button>

          </div>
        </nav>
      )}

      {/* =========================================================================
          MOBILE TOOLS DRAWER / ACTION SHEET (iOS Style Bottom Sheet)
          ========================================================================= */}
      <AnimatePresence>
        {showToolsSheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={() => setShowToolsSheet(false)} />
            
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-lg bg-[#141414] border-t border-white/15 rounded-t-3xl p-5 pb-safe shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              {/* Drag Handle */}
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-2" />

              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div>
                  <h3 className="text-base font-semibold text-white font-serif">Outils & Administration</h3>
                  <p className="text-xs text-white/50">Sélectionnez une fonctionnalité</p>
                </div>
                <button
                  onClick={() => setShowToolsSheet(false)}
                  className="p-1.5 rounded-full bg-white/10 text-white/70 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of Tools */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => { setActiveTab('qr_laser'); setShowToolsSheet(false); }}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/40 text-left flex items-start gap-3 transition-all active:scale-95 cursor-pointer"
                >
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Laser QR</h4>
                    <p className="text-[10px] text-white/50">LightBurn & Jetons</p>
                  </div>
                </button>

                <button
                  onClick={() => { setActiveTab('gallery'); setShowToolsSheet(false); }}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/40 text-left flex items-start gap-3 transition-all active:scale-95 cursor-pointer"
                >
                  <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 shrink-0">
                    <ImagePlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Galerie</h4>
                    <p className="text-[10px] text-white/50">Photos de chantiers</p>
                  </div>
                </button>

                <button
                  onClick={() => { setActiveTab('ba'); setShowToolsSheet(false); }}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/40 text-left flex items-start gap-3 transition-all active:scale-95 cursor-pointer"
                >
                  <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Avant / Après</h4>
                    <p className="text-[10px] text-white/50">Comparaisons visuelles</p>
                  </div>
                </button>

                <button
                  onClick={() => { setActiveTab('seo'); setShowToolsSheet(false); }}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/40 text-left flex items-start gap-3 transition-all active:scale-95 cursor-pointer"
                >
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                    <MessageSquareText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">SEO & Blog IA</h4>
                    <p className="text-[10px] text-white/50">Référencement Google</p>
                  </div>
                </button>

                <button
                  onClick={() => { setActiveTab('all'); setShowToolsSheet(false); }}
                  className="col-span-2 p-3.5 rounded-2xl bg-white/10 border border-white/15 hover:border-amber-500/40 text-left flex items-center justify-between transition-all active:scale-95 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/15 text-white shrink-0">
                      <LayoutGrid className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">Tout afficher (Vue globale)</h4>
                      <p className="text-[10px] text-white/50">Toutes les sections en une seule page</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </button>
              </div>

              {/* Install PWA helper option */}
              <div className="pt-2 border-t border-white/10">
                <button
                  onClick={() => { setShowIosInstallModal(true); setShowToolsSheet(false); }}
                  className="w-full p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    <span>Installer sur l'écran d'accueil iPhone</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          IOS / PWA INSTALLATION WALKTHROUGH MODAL
          ========================================================================= */}
      <AnimatePresence>
        {showIosInstallModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141414] border border-white/15 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-300">
                    PB
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Installer sur iPhone</h3>
                    <p className="text-xs text-white/50">Ajouter à l'écran d'accueil</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowIosInstallModal(false)}
                  className="p-1.5 text-white/50 hover:text-white rounded-full bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-white/80">
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <strong className="text-white block mb-0.5">Dans Safari</strong>
                    <span>Appuyez sur le bouton <strong>Partager</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-amber-400" /> (le carré avec la flèche vers le haut en bas de votre écran).</span>
                  </div>
                </div>

                <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <strong className="text-white block mb-0.5">Faites défiler vers le bas</strong>
                    <span>Appuyez sur la ligne <strong>« Sur l'écran d'accueil »</strong> (avec l'icône ➕).</span>
                  </div>
                </div>

                <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <strong className="text-white block mb-0.5">Validez</strong>
                    <span>Appuyez sur <strong>« Ajouter »</strong> en haut à droite.</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[11px] text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Votre panneau d'administration s'ouvrira comme une vraie application en plein écran sans aucune barre Safari !</span>
              </div>

              <button
                onClick={() => setShowIosInstallModal(false)}
                className="w-full bg-amber-500 text-black font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer shadow-lg active:scale-98"
              >
                J'ai compris
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111] border border-white/10 p-5 sm:p-6 rounded-2xl max-w-sm w-full shadow-2xl"
          >
            <h3 className="text-base sm:text-lg text-white mb-2 font-medium">Confirmer la suppression</h3>
            <p className="text-xs sm:text-sm text-white/60 mb-6 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-2 text-xs text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-red-500/30 cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#141414] border border-white/15 p-5 sm:p-7 rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Modifier l'avis client</h3>
                <p className="text-xs text-white/50">Modifiez le contenu, la note ou les détails du client.</p>
              </div>
              <button 
                onClick={() => setEditingReview(null)}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditReview} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1">Nom du client *</label>
                <input 
                  type="text" 
                  required
                  value={editingReview.author} 
                  onChange={(e) => setEditingReview({ ...editingReview, author: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1">Ville</label>
                  <input 
                    type="text" 
                    value={editingReview.city} 
                    onChange={(e) => setEditingReview({ ...editingReview, city: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1">Note (sur 5)</label>
                  <select 
                    value={editingReview.rating} 
                    onChange={(e) => setEditingReview({ ...editingReview, rating: Number(e.target.value) })}
                    className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                    <option value={3}>⭐⭐⭐ (3/5)</option>
                    <option value={2}>⭐⭐ (2/5)</option>
                    <option value={1}>⭐ (1/5)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1">Type de travaux</label>
                  <input 
                    type="text" 
                    value={editingReview.projectType} 
                    onChange={(e) => setEditingReview({ ...editingReview, projectType: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                    placeholder="Ex: Faux-plafond, Isolation"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1">Date affichée</label>
                  <input 
                    type="text" 
                    value={editingReview.date || ''} 
                    onChange={(e) => setEditingReview({ ...editingReview, date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                    placeholder="Ex: Juillet 2026"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1">Commentaire / Témoignage *</label>
                <textarea 
                  required
                  rows={4}
                  value={editingReview.comment} 
                  onChange={(e) => setEditingReview({ ...editingReview, comment: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2.5 text-xs text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={revEditSaving}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg"
                >
                  {revEditSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Enregistrer les modifications</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Photo / AI Re-analysis Modal */}
      {editingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#141414] border border-white/15 p-5 sm:p-7 rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Détails & Analyse IA de la photo
                </h3>
                <p className="text-xs text-white/50">Modifiez le titre, la description ou relancez l'analyse IA visuelle.</p>
              </div>
              <button 
                onClick={() => setEditingPhoto(null)}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 mb-5">
              <div className="sm:col-span-5">
                <div className="rounded-xl overflow-hidden border border-white/10 aspect-video sm:aspect-square bg-black">
                  <img src={editingPhoto.url} alt={editingPhoto.alt} className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={handleReanalyzePhoto}
                  disabled={photoReanalyzing}
                  className="mt-3 w-full py-2.5 px-3 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {photoReanalyzing ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyse visuelle IA...</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5 text-amber-400" /> Réanalyser cette photo</>
                  )}
                </button>

                <div className="mt-4 p-3 bg-white/5 border border-white/5 rounded-xl space-y-1.5">
                  <label className="block text-[9px] uppercase tracking-wider text-amber-300 font-mono">Consignes IA de réanalyse (Optionnel)</label>
                  <input
                    type="text"
                    value={reanalyzeDirectives}
                    onChange={(e) => setReanalyzeDirectives(e.target.value)}
                    placeholder="Ex: Précise qu'il n'y a pas de verrière"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-white/30 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <form onSubmit={handleSavePhoto} className="sm:col-span-7 space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1">Titre de la photo (SEO) *</label>
                  <input 
                    type="text" 
                    required
                    value={editingPhoto.title} 
                    onChange={(e) => setEditingPhoto({ ...editingPhoto, title: e.target.value })}
                    placeholder="Ex: Faux-plafond suspendu avec spots LED - Arcachon"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1">Description détaillée *</label>
                  <textarea 
                    required
                    rows={4}
                    value={editingPhoto.description} 
                    onChange={(e) => setEditingPhoto({ ...editingPhoto, description: e.target.value })}
                    placeholder="Description précise des travaux visibles sur la photo..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1">Texte alternatif Alt (Accessibilité & Google Images)</label>
                  <input 
                    type="text" 
                    value={editingPhoto.alt} 
                    onChange={(e) => setEditingPhoto({ ...editingPhoto, alt: e.target.value })}
                    placeholder="Ex: Chantier de pose de cloisons BA13 et bandes à joint à Arcachon"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button 
                    type="button"
                    onClick={() => setEditingPhoto(null)}
                    className="px-3.5 py-2 text-xs text-white/70 hover:text-white transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    disabled={photoSaving || photoReanalyzing}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {photoSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Enregistrer</span>
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
