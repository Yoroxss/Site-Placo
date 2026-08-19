import React, { useState, useEffect } from 'react';
import { 
  Mail, Send, Trash2, Folder, ChevronLeft, ChevronRight, 
  Loader2, RefreshCw, CornerUpLeft, CheckCircle2, AlertCircle, Eye, EyeOff,
  Sparkles, Settings, Bot, Cpu, Check, X, Shield, Clock, FileText, Reply, CornerUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, doc, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface MailMessage {
  uid: number;
  seq: number;
  seen: boolean;
  subject: string;
  date: string;
  from: string;
  to: string;
}

interface MailDetail {
  uid: number;
  subject: string;
  date: string;
  from: string;
  to: string;
  cc?: string;
  html?: string;
  text?: string;
  attachments?: Array<{ filename: string; contentType: string; size: number }>;
}

export default function MailAdminSection() {
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('INBOX');
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedMail, setSelectedMail] = useState<MailDetail | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Compose / Reply state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingMail, setSendingMail] = useState(false);

  // AI Assistance state
  const [aiInstruction, setAiInstruction] = useState('');
  const [generatingAiResponse, setGeneratingAiResponse] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(true);

  // Auto-responder config state
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(() => {
    return localStorage.getItem('pb_auto_reply_enabled') === 'true';
  });
  const [autoReplySubject, setAutoReplySubject] = useState(() => {
    return localStorage.getItem('pb_auto_reply_subject') || 'Accusé de réception - Parat & Bouey Plâtrerie';
  });
  const [autoReplyBody, setAutoReplyBody] = useState(() => {
    return localStorage.getItem('pb_auto_reply_body') || 
      "Bonjour,\n\nNous avons bien reçu votre message et nous vous remercions de l'intérêt que vous portez à notre entreprise de plâtrerie.\n\nNous étudions votre demande avec le plus grand soin et nous reviendrons vers vous dans les meilleurs délais pour convenir d'un rendez-vous ou étudier votre projet sur le Bassin d'Arcachon.\n\nBien cordialement,\nL'équipe Parat & Bouey Plâtrerie\nhttps://plaquiste-arcachon.fr";
  });
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // AI Classification states (persisted securely in Firestore - metadata only, 100% free and synced across all devices)
  const [classifications, setClassifications] = useState<Record<string, { priority: 'prioritaire' | 'autre'; reason: string }>>({});
  const [loadingClassifications, setLoadingClassifications] = useState(false);

  // Load lightweight metadata classifications from Firestore on mount
  useEffect(() => {
    const fetchFirestoreClassifications = async () => {
      setLoadingClassifications(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'mail_classifications'));
        const mapping: Record<string, { priority: 'prioritaire' | 'autre'; reason: string }> = {};
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          mapping[docSnapshot.id] = {
            priority: data.priority,
            reason: data.reason
          };
        });
        setClassifications(mapping);
      } catch (err) {
        console.error("Error loading classifications from Firestore:", err);
      } finally {
        setLoadingClassifications(false);
      }
    };
    fetchFirestoreClassifications();
  }, []);

  const [classifying, setClassifying] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'priority' | 'other'>('all');

  // Filter classifications that correspond to the current folder
  const folderClassList = Object.entries(classifications)
    .filter(([key]) => key.startsWith(`${selectedFolder}_`))
    .map(([_, val]) => val) as { priority: 'prioritaire' | 'autre'; reason: string }[];

  const filteredMessages = messages.filter(msg => {
    if (activeFilter === 'all') return true;
    const classification = classifications[`${selectedFolder}_${msg.uid}`];
    if (activeFilter === 'priority') {
      return classification?.priority === 'prioritaire';
    }
    if (activeFilter === 'other') {
      return classification?.priority === 'autre';
    }
    return true;
  });

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    fetchMessages();
    setSelectedMail(null);
  }, [selectedFolder, currentPage]);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchFolders = async () => {
    setLoadingFolders(true);
    try {
      const res = await fetch('/api/mail/folders');
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
      } else {
        throw new Error('Impossible de charger les dossiers');
      }
    } catch (err: any) {
      console.error(err);
      showFeedback('Échec du chargement des dossiers IMAP.', 'error');
    } finally {
      setLoadingFolders(false);
    }
  };

  const fetchMessages = async () => {
    setLoadingMessages(true);
    const offset = (currentPage - 1) * limit;
    try {
      const res = await fetch(`/api/mail/messages?folder=${encodeURIComponent(selectedFolder)}&limit=${limit}&offset=${offset}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setTotalMessages(data.total || 0);
      } else {
        throw new Error('Impossible de charger les e-mails');
      }
    } catch (err: any) {
      console.error(err);
      showFeedback('Échec du chargement des e-mails.', 'error');
    } finally {
      setLoadingMessages(false);
    }
  };

  const openMail = async (uid: number) => {
    setLoadingDetail(true);
    setSelectedMail(null);
    setIsDetailModalOpen(true);
    try {
      const res = await fetch(`/api/mail/message/${uid}?folder=${encodeURIComponent(selectedFolder)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedMail(data);
        
        // Mark as seen locally in state list
        setMessages(prev => prev.map(m => m.uid === uid ? { ...m, seen: true } : m));
      } else {
        throw new Error('Impossible de lire l\'e-mail');
      }
    } catch (err: any) {
      console.error(err);
      showFeedback('Échec du chargement du contenu du message.', 'error');
      setIsDetailModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const toggleReadStatus = async (uid: number, currentlyRead: boolean) => {
    try {
      const res = await fetch('/api/mail/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: selectedFolder, uid, read: !currentlyRead })
      });
      if (res.ok) {
        setMessages(prev => prev.map(m => m.uid === uid ? { ...m, seen: !currentlyRead } : m));
        if (selectedMail && selectedMail.uid === uid) {
          showFeedback(currentlyRead ? 'Marqué comme non lu' : 'Marqué comme lu', 'success');
        }
      } else {
        throw new Error();
      }
    } catch {
      showFeedback('Erreur lors du changement de statut Lu/Non-lu.', 'error');
    }
  };

  const deleteMail = async (uid: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cet e-mail ?')) return;
    try {
      const res = await fetch('/api/mail/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: selectedFolder, uid })
      });
      if (res.ok) {
        showFeedback('E-mail supprimé avec succès !', 'success');
        setMessages(prev => prev.filter(m => m.uid !== uid));
        setSelectedMail(null);
      } else {
        throw new Error();
      }
    } catch {
      showFeedback('Échec de la suppression de l\'e-mail.', 'error');
    }
  };

  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSubject || !composeBody) return;

    setSendingMail(true);
    try {
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: composeTo,
          subject: composeSubject,
          text: composeBody,
          html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111111; max-width: 600px; padding: 25px; background-color: #ffffff; border-radius: 12px; border: 1px solid #eaeaea;">
            <div style="font-size: 15px; color: #222222; font-family: system-ui, -apple-system, sans-serif;">
              ${composeBody.replace(/\n/g, '<br>')}
            </div>
            <br><br>
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 25px 0;" />
            <table border="0" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #555555; font-family: sans-serif;">
              <tr>
                <td style="font-weight: bold; font-size: 15px; color: #d97706; padding-bottom: 3px;">Parat & Bouey Plâtrerie</td>
              </tr>
              <tr>
                <td style="font-style: italic; color: #333333; padding-bottom: 5px;">Artisan d'Excellence — Bassin d'Arcachon</td>
              </tr>
              <tr>
                <td style="color: #666666;">Cloisons • Doublages • Faux-plafonds • Jointement de plaques</td>
              </tr>
              <tr>
                <td style="padding-top: 10px;">
                  <a href="https://plaquiste-arcachon.fr" style="color: #d97706; text-decoration: none; font-weight: bold;">www.plaquiste-arcachon.fr</a>
                </td>
              </tr>
            </table>
          </div>`
        })
      });

      if (res.ok) {
        showFeedback('E-mail envoyé avec succès !', 'success');
        setIsComposerOpen(false);
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        if (selectedFolder.toLowerCase().includes('sent') || selectedFolder.toLowerCase().includes('envoi')) {
          fetchMessages();
        }
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }
    } catch (err: any) {
      showFeedback(err.message || 'Échec de l\'envoi de l\'e-mail.', 'error');
    } finally {
      setSendingMail(false);
    }
  };

  const startReply = (mail: MailDetail) => {
    let replyEmail = mail.from;
    const match = mail.from.match(/<([^>]+)>/);
    if (match && match[1]) {
      replyEmail = match[1];
    }

    setComposeTo(replyEmail);
    setComposeSubject(mail.subject.startsWith('Re:') ? mail.subject : `Re: ${mail.subject}`);
    setComposeBody(`\n\nLe ${new Date(mail.date).toLocaleString('fr-FR')}, ${mail.from} a écrit :\n> ${mail.text?.split('\n').join('\n> ') || ''}`);
    setIsComposerOpen(true);
  };

  const runAiClassification = async () => {
    if (messages.length === 0) {
      showFeedback('Aucun e-mail à analyser.', 'error');
      return;
    }

    // Filtrer les messages pour ne garder que ceux qui n'ont pas encore été triés/scannés par l'IA
    const unclassifiedMails = messages.filter(m => !classifications[`${selectedFolder}_${m.uid}`]);
    if (unclassifiedMails.length === 0) {
      showFeedback('Tous les e-mails de cette page ont déjà été analysés et triés !', 'success');
      // On bascule automatiquement sur l'onglet prioritaire s'il y en a pour le confort d'utilisation
      const hasPriorities = folderClassList.some(c => c.priority === 'prioritaire');
      if (hasPriorities) {
        setActiveFilter('priority');
      }
      return;
    }

    setClassifying(true);
    try {
      const res = await fetch('/api/mail/ai-classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: unclassifiedMails.map(m => ({
            uid: m.uid,
            from: m.from,
            subject: m.subject,
            date: m.date
          }))
        })
      });
      if (res.ok) {
        const data = await res.json();
        const mapping: Record<string, { priority: 'prioritaire' | 'autre'; reason: string }> = {};
        if (data.classifications && Array.isArray(data.classifications)) {
          const batch = writeBatch(db);
          data.classifications.forEach((item: any) => {
            const key = `${selectedFolder}_${item.uid}`;
            mapping[key] = {
              priority: item.priority || 'autre',
              reason: item.reason || 'Analyse IA'
            };
            
            // Enregistrer uniquement les métadonnées ultra-légères dans Firestore
            const docRef = doc(db, 'mail_classifications', key);
            batch.set(docRef, {
              priority: item.priority || 'autre',
              reason: item.reason || 'Analyse IA',
              createdAt: serverTimestamp()
            });
          });
          await batch.commit();
        }
        
        // On fusionne les nouvelles classifications avec les anciennes pour garder l'historique
        setClassifications(prev => ({
          ...prev,
          ...mapping
        }));

        showFeedback(`${unclassifiedMails.length} nouveau(x) courriel(s) analysé(s) et trié(s) par l'IA !`, 'success');
        
        // On active l'onglet priorité si de nouveaux prioritaires sont trouvés
        const newPrioritiesFound = Object.values(mapping).some(c => c.priority === 'prioritaire');
        if (newPrioritiesFound) {
          setActiveFilter('priority');
        }
      } else {
        throw new Error('Échec du tri de la boîte');
      }
    } catch (err: any) {
      console.error(err);
      showFeedback('Erreur lors de l\'analyse intelligente : ' + (err.message || err), 'error');
    } finally {
      setClassifying(false);
    }
  };

  // AI Response Generator Core
  const handleGenerateAiResponse = async (instruction: string) => {
    if (!selectedMail) return;
    setGeneratingAiResponse(true);
    try {
      const res = await fetch('/api/mail/ai-reply-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalSender: selectedMail.from,
          originalSubject: selectedMail.subject,
          originalBody: selectedMail.text || selectedMail.html || '',
          instruction: instruction || aiInstruction
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        let replyEmail = selectedMail.from;
        const match = selectedMail.from.match(/<([^>]+)>/);
        if (match && match[1]) {
          replyEmail = match[1];
        }

        setComposeTo(replyEmail);
        setComposeSubject(selectedMail.subject.startsWith('Re:') ? selectedMail.subject : `Re: ${selectedMail.subject}`);
        setComposeBody(data.text);
        setIsComposerOpen(true);
        setAiInstruction('');
        showFeedback('Réponse rédigée par l\'IA avec succès !', 'success');
      } else {
        throw new Error();
      }
    } catch {
      showFeedback('Échec de la génération de réponse par l\'IA.', 'error');
    } finally {
      setGeneratingAiResponse(false);
    }
  };

  // Quick Action Auto-Reply 1-clic
  const handleQuickAutoReply = async (mail: MailDetail) => {
    setSendingMail(true);
    let replyEmail = mail.from;
    const match = mail.from.match(/<([^>]+)>/);
    if (match && match[1]) {
      replyEmail = match[1];
    }

    try {
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: replyEmail,
          subject: autoReplySubject,
          text: autoReplyBody,
          html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111111; max-width: 600px; padding: 25px; background-color: #ffffff; border-radius: 12px; border: 1px solid #eaeaea;">
            <div style="font-size: 15px; color: #222222; font-family: system-ui, -apple-system, sans-serif;">
              ${autoReplyBody.replace(/\n/g, '<br>')}
            </div>
            <br><br>
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 25px 0;" />
            <p style="font-size: 13px; color: #666666;">
              <strong>Parat & Bouey Plâtrerie</strong><br>
              Artisan d'Excellence — Bassin d'Arcachon<br>
              <a href="https://plaquiste-arcachon.fr" style="color: #d97706; text-decoration: none; font-weight: bold;">www.plaquiste-arcachon.fr</a>
            </p>
          </div>`
        })
      });

      if (res.ok) {
        showFeedback('Accusé de réception envoyé instantanément !', 'success');
        try {
          await fetch('/api/mail/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folderPath: selectedFolder, uid: mail.uid, read: true })
          });
          setMessages(prev => prev.map(m => m.uid === mail.uid ? { ...m, seen: true } : m));
        } catch {}
      } else {
        throw new Error();
      }
    } catch {
      showFeedback('Échec de l\'envoi automatique.', 'error');
    } finally {
      setSendingMail(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('pb_auto_reply_enabled', String(autoReplyEnabled));
    localStorage.setItem('pb_auto_reply_subject', autoReplySubject);
    localStorage.setItem('pb_auto_reply_body', autoReplyBody);
    showFeedback('Réponse automatique enregistrée avec succès !', 'success');
    setShowConfigPanel(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  return (
    <div className="bg-[#080808] border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden w-full">
      
      {/* Soft contemporary glowing ambient lights */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-amber-500/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-slate-500/[0.03] blur-[120px] pointer-events-none" />

      {/* Main Mail Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8 pb-6 border-b border-white/10 relative z-10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <Mail className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide font-sans">
                Espace Messagerie Professionnelle
              </h2>
              {autoReplyEnabled && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  RÉPONDEUR ACTIF
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-white/50 mt-1 font-light">
              Gérez vos e-mails de <strong className="text-amber-400 font-medium">contact@plaquiste-arcachon.fr</strong> avec l'assistant de rédaction intelligent Gemini 3.7.
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button 
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border transition-all cursor-pointer active:scale-95 ${
              showConfigPanel 
                ? 'bg-white text-black border-white' 
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Répondeur Auto</span>
          </button>

          <button 
            onClick={() => { setSelectedMail(null); setIsComposerOpen(true); setComposeTo(''); setComposeSubject(''); setComposeBody(''); setIsDetailModalOpen(true); }}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-black text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-amber-400 transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/15 cursor-pointer active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Nouveau Message</span>
          </button>
          
          <button 
            onClick={() => { fetchFolders(); fetchMessages(); }}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer active:scale-95"
            title="Rafraîchir"
            disabled={loadingMessages}
          >
            <RefreshCw className={`w-4 h-4 ${loadingMessages ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Auto-Responder Settings Modal/Panel Panel */}
      <AnimatePresence>
        {showConfigPanel && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8 p-5 sm:p-6 rounded-2xl border border-white/10 bg-white/[0.02] relative z-10"
          >
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-4.5 h-4.5 text-amber-400" />
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-wider uppercase">Paramétrage du Répondeur de Courriels</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowConfigPanel(false)}
                  className="text-white/40 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 py-1">
                <input
                  type="checkbox"
                  id="autoReplyToggle"
                  checked={autoReplyEnabled}
                  onChange={(e) => setAutoReplyEnabled(e.target.checked)}
                  className="w-5 h-5 rounded border-white/15 bg-black text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="autoReplyToggle" className="text-xs sm:text-sm font-semibold text-white cursor-pointer select-none">
                  Activer l'envoi d'un accusé de réception automatique (Auto-Réponse)
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Objet de l'Accusé</label>
                  <input
                    type="text"
                    value={autoReplySubject}
                    onChange={(e) => setAutoReplySubject(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-white outline-none focus:border-amber-400"
                    placeholder="Sujet..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Message de l'Accusé</label>
                  <textarea
                    value={autoReplyBody}
                    onChange={(e) => setAutoReplyBody(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-white outline-none focus:border-amber-400 h-32 resize-none leading-relaxed font-sans"
                    placeholder="Contenu..."
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigPanel(false)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-white/5 border border-white/10 text-white/70 hover:text-white cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm bg-amber-500 text-black font-semibold hover:bg-amber-400 cursor-pointer"
                >
                  Enregistrer les paramètres
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-2.5 text-xs sm:text-sm relative z-10 animate-fade-in ${
          feedback.type === 'error' ? 'bg-red-500/15 border-red-500/25 text-red-300' : 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300'
        }`}>
          {feedback.type === 'error' ? <AlertCircle className="w-4.5 h-4.5 shrink-0" /> : <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* WIDESCREEN DESKTOP-FIRST 2-COLUMN WORKSPACE GRID */}
      <div className="flex flex-col xl:flex-row gap-6 min-h-[750px] relative z-10 w-full">
        
        {/* COLUMN 1 (FOLDERS BAR): Left vertical panel on desktop, Horizontal wraps on mobile */}
        <div className="xl:w-[240px] w-full shrink-0 flex xl:flex-col flex-wrap gap-2">
          {loadingFolders && folders.length === 0 ? (
            <span className="text-xs text-white/40 flex items-center gap-2 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> Connexion IMAP...
            </span>
          ) : (
            folders.map((f) => {
              const isSelected = selectedFolder === f.path;
              let displayName = f.name;
              let FolderIcon = Folder;

              if (f.name.toUpperCase() === 'INBOX') {
                displayName = 'Boîte de réception';
                FolderIcon = Mail;
              } else if (f.name.toUpperCase().includes('SENT') || f.name.toUpperCase().includes('ENVOI')) {
                displayName = 'Messages envoyés';
                FolderIcon = Send;
              } else if (f.name.toUpperCase().includes('TRASH') || f.name.toUpperCase().includes('CORBEILLE')) {
                displayName = 'Corbeille';
                FolderIcon = Trash2;
              } else if (f.name.toUpperCase().includes('SPAM') || f.name.toUpperCase().includes('INDESIRABLE')) {
                displayName = 'Spams / Indésirables';
                FolderIcon = Shield;
              }

              return (
                <button
                  key={f.path}
                  onClick={() => { setSelectedFolder(f.path); setCurrentPage(1); }}
                  className={`xl:w-full px-4 py-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer border ${
                    isSelected 
                      ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/10' 
                      : 'bg-white/5 text-white/70 border-white/10 hover:border-white/20 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <FolderIcon className={`w-4.5 h-4.5 shrink-0 ${isSelected ? 'text-black' : 'text-amber-400'}`} />
                  <span className="truncate">{displayName}</span>
                </button>
              );
            })
          )}
        </div>

        {/* COLUMN 2 (MAILS LIST): Full width widescreen list of received messages */}
        <div className="flex-1 w-full flex flex-col border border-white/10 bg-black/35 rounded-2xl overflow-hidden shadow-lg min-h-[600px]">
          {/* Header of listing with manual IA Sorting filter */}
          <div className="p-4 border-b border-white/10 bg-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold tracking-wide uppercase text-[10px] border transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-amber-500 text-black border-amber-500 shadow-md'
                    : 'bg-white/5 border-white/5 text-white/60 hover:text-white'
                }`}
              >
                Tous ({totalMessages})
              </button>
              <button
                onClick={() => setActiveFilter('priority')}
                className={`px-3 py-1.5 rounded-lg font-bold tracking-wide uppercase text-[10px] border transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === 'priority'
                    ? 'bg-emerald-500 text-black border-emerald-500 shadow-md'
                    : 'bg-white/5 border-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>Prioritaires ✨</span>
                {folderClassList.length > 0 && (
                  <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                    activeFilter === 'priority' ? 'bg-black text-emerald-400' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {folderClassList.filter(c => c.priority === 'prioritaire').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveFilter('other')}
                className={`px-3 py-1.5 rounded-lg font-bold tracking-wide uppercase text-[10px] border transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === 'other'
                    ? 'bg-white/20 border-white/30 text-white shadow-md'
                    : 'bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>Autres / Pubs 🚫</span>
                {folderClassList.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/10 text-white/70 text-[9px]">
                    {folderClassList.filter(c => c.priority === 'autre').length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2.5 ml-auto sm:ml-0">
              <button
                onClick={runAiClassification}
                disabled={classifying || messages.length === 0}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-[11px] uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
                title="Analyser et trier manuellement les messages de cette page avec l'IA"
              >
                {classifying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{classifying ? 'Tri intelligent...' : 'Trier la boîte (IA)'}</span>
              </button>
            </div>
          </div>

          {/* Mail message rows container (Beautiful wide rows) */}
          <div className="flex-1 divide-y divide-white/5 overflow-y-auto scrollbar-thin">
            {loadingMessages ? (
              <div className="h-96 flex flex-col items-center justify-center text-white/50 text-xs">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-3" />
                <span className="font-mono tracking-widest uppercase text-[10px]">Chargement des courriels...</span>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center text-white/40 text-xs text-center p-6 space-y-2">
                <Mail className="w-10 h-10 text-white/10 mb-2" />
                {activeFilter === 'priority' ? (
                  <div className="max-w-md">
                    <p className="font-bold text-white/70">Aucun e-mail prioritaire identifié.</p>
                    <p className="text-[11px] text-white/40 mt-1">Cliquez sur le bouton "Trier la boîte (IA)" ci-dessus pour analyser les e-mails de la page en cours !</p>
                  </div>
                ) : activeFilter === 'other' ? (
                  <div className="max-w-md">
                    <p className="font-bold text-white/70">Aucun e-mail publicitaire identifié.</p>
                  </div>
                ) : (
                  <span>Aucun e-mail trouvé dans ce dossier.</span>
                )}
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedMail?.uid === msg.uid;
                const classification = classifications[`${selectedFolder}_${msg.uid}`];
                return (
                  <div
                    key={msg.uid}
                    onClick={() => openMail(msg.uid)}
                    className={`p-4 sm:p-5 transition-all hover:bg-white/[0.03] cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-2 ${
                      isSelected 
                        ? 'bg-amber-500/5 border-amber-500' 
                        : 'border-transparent'
                    } ${!msg.seen ? 'bg-white/[0.01]' : ''}`}
                  >
                    {/* Left: Sender block */}
                    <div className="flex items-center gap-3 md:w-1/4 shrink-0 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-amber-400 font-serif text-sm">
                          {msg.from.charAt(0).toUpperCase()}
                        </div>
                        {!msg.seen && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 shadow shadow-amber-400/50" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs sm:text-sm font-bold truncate ${!msg.seen ? 'text-white' : 'text-white/80'}`}>
                          {msg.from.split('<')[0].trim() || msg.from}
                        </div>
                        <div className="text-[10px] text-white/40 font-mono truncate">
                          {msg.from.includes('<') ? msg.from.match(/<([^>]+)>/)?.[1] || msg.from : msg.from}
                        </div>
                      </div>
                    </div>

                    {/* Center: Subject & description preview with IA Badges */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className={`text-xs sm:text-sm truncate leading-relaxed ${!msg.seen ? 'text-amber-300 font-bold' : 'text-white/70'}`}>
                          {msg.subject}
                        </h4>
                        {classification && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider shrink-0 ${
                            classification.priority === 'prioritaire'
                              ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-400'
                              : 'bg-white/5 border border-white/10 text-white/40'
                          }`}>
                            {classification.priority === 'prioritaire' ? '★ Prioritaire' : '🚫 Autre / Pub'}
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] truncate ${classification ? 'text-white/60 italic font-sans' : 'text-white/40'}`}>
                        {classification ? classification.reason : `Séquence #${msg.seq} • Cliquez pour lire l'e-mail en grand...`}
                      </p>
                    </div>

                    {/* Right: Date, status and action tags */}
                    <div className="flex items-center gap-3.5 shrink-0 justify-between md:justify-end">
                      {!msg.seen && (
                        <span className="text-[9px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Nouveau</span>
                      )}
                      <span className="text-xs text-white/40 font-mono">
                        {formatDate(msg.date)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* List Pagination Footer */}
          {totalMessages > limit && (
            <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between gap-3 text-xs sm:text-sm shrink-0">
              <span className="text-white/50 text-xs font-mono">
                {Math.min(totalMessages, (currentPage - 1) * limit + 1)}-{Math.min(totalMessages, currentPage * limit)} sur {totalMessages}
              </span>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage * limit >= totalMessages}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 cursor-pointer active:scale-95"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN IMMERSIVE READER & COMPOSER OVERLAY DIALOG */}
      <AnimatePresence>
        {isDetailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
            {/* Click backdrop to close */}
            <div className="absolute inset-0" onClick={() => { setIsDetailModalOpen(false); setIsComposerOpen(false); }} />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative z-10 w-full max-w-6xl h-[90vh] max-h-[850px] bg-[#121212] border border-white/15 rounded-3xl flex flex-col shadow-2xl overflow-hidden"
            >
              
              {/* MODAL FIX BRANDED HEADER BAR */}
              <div className="px-6 py-4.5 border-b border-white/10 bg-black/40 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-serif font-bold text-amber-400 text-xs">
                    PB
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">Parat & Bouey Plâtrerie</span>
                    <h3 className="text-xs sm:text-sm text-white/50 -mt-0.5">Messagerie professionnelle sécurisée</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setIsDetailModalOpen(false); setIsComposerOpen(false); }}
                    className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                    title="Fermer la fenêtre (Echap)"
                  >
                    <X className="w-5.5 h-5.5" />
                  </button>
                </div>
              </div>

              {/* MODAL SCROLLABLE CORE VIEWPORT */}
              <div className="flex-1 overflow-y-auto divide-y divide-white/10 scrollbar-thin">
                
                {isComposerOpen ? (
                  /* EXTREMELY SPACIOUS COMPOSER VIEW */
                  <form onSubmit={handleSendMail} className="p-6 sm:p-8 flex flex-col space-y-5 text-left">
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Send className="w-5 h-5 text-amber-400" />
                        <h3 className="text-base sm:text-lg font-bold tracking-wide text-white">Rédiger ou Répondre au Message</h3>
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={() => {
                          if (selectedMail) {
                            setIsComposerOpen(false);
                          } else {
                            setIsDetailModalOpen(false);
                          }
                        }}
                        className="text-xs text-white/50 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 cursor-pointer"
                      >
                        Annuler la rédaction
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1.5 font-bold">Destinataire (À)</label>
                        <input
                          type="email"
                          value={composeTo}
                          onChange={(e) => setComposeTo(e.target.value)}
                          placeholder="client@domaine.com"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-white outline-none focus:border-amber-400"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1.5 font-bold">Objet de l'e-mail</label>
                        <input
                          type="text"
                          value={composeSubject}
                          onChange={(e) => setComposeSubject(e.target.value)}
                          placeholder="Objet de la réponse..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-white outline-none focus:border-amber-400"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1.5 font-bold">Corps du Message</label>
                      <textarea
                        value={composeBody}
                        onChange={(e) => setComposeBody(e.target.value)}
                        placeholder="Saisissez votre réponse..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-xs sm:text-sm text-white outline-none focus:border-amber-400 resize-none font-sans leading-relaxed h-[340px]"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sendingMail}
                      className="w-full py-4 rounded-xl bg-amber-500 text-black text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98"
                    >
                      {sendingMail ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Envoi en cours sur le serveur SMTP...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4.5 h-4.5" />
                          <span>Envoyer le Message Final</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : loadingDetail ? (
                  /* LOADING SKELETON PANEL */
                  <div className="h-full flex flex-col items-center justify-center text-white/50 text-xs p-12 min-h-[500px]">
                    <Loader2 className="w-10 h-10 animate-spin text-amber-400 mb-4" />
                    <span className="font-mono text-xs text-white/40 tracking-widest uppercase">Téléchargement sécurisé du courriel...</span>
                  </div>
                ) : selectedMail ? (
                  /* BEAUTIFULLY SPACIOUS EMAIL READER */
                  <div className="flex flex-col text-left">
                    
                    {/* Header Metadata Container */}
                    <div className="p-6 sm:p-8 bg-black/20 relative">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                        <span className="text-xs font-mono text-white/40 flex items-center gap-2 bg-white/5 border border-white/15 px-3.5 py-1.5 rounded-full">
                          <Clock className="w-4 h-4 text-white/30" />
                          {new Date(selectedMail.date).toLocaleString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {/* Meta actions (Mark read, delete) */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleReadStatus(selectedMail.uid, true)}
                            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors cursor-pointer hover:bg-white/15"
                            title="Marquer comme non lu"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => deleteMail(selectedMail.uid)}
                            className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer hover:bg-red-500/20"
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-lg sm:text-2xl font-extrabold text-white leading-snug font-serif tracking-normal">
                        {selectedMail.subject}
                      </h3>

                      <div className="text-xs sm:text-sm text-white/70 space-y-2 bg-black/40 p-5 rounded-xl border border-white/5 font-light mt-5">
                        <div>
                          <span className="text-white/40 font-semibold w-12 inline-block">De :</span> <span className="font-mono text-white/95">{selectedMail.from}</span>
                        </div>
                        <div>
                          <span className="text-white/40 font-semibold w-12 inline-block">À :</span> <span className="font-mono text-white/85">{selectedMail.to}</span>
                        </div>
                        {selectedMail.cc && (
                          <div>
                            <span className="text-white/40 font-semibold w-12 inline-block">Cc :</span> <span className="font-mono text-white/80">{selectedMail.cc}</span>
                          </div>
                        )}
                      </div>

                      {/* AI Classification banner overlay inside reader */}
                      {classifications[selectedMail.uid] && (
                        <div className={`mt-5 p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                          classifications[selectedMail.uid].priority === 'prioritaire'
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                            : 'bg-white/5 border border-white/10 text-white/60'
                        }`}>
                          <Sparkles className="w-4 h-4 shrink-0 text-amber-400 mt-0.5 animate-pulse" />
                          <div>
                            <span className="font-bold uppercase tracking-wider text-[9px] block mb-1">
                              {classifications[selectedMail.uid].priority === 'prioritaire' ? '★ Dossier Prioritaire' : '🚫 Dossier Secondaire / Démarche Commerciale'}
                            </span>
                            <span>{classifications[selectedMail.uid].reason}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Attachments panel */}
                    {selectedMail.attachments && selectedMail.attachments.length > 0 && (
                      <div className="p-6 bg-white/[0.01] border-t border-b border-white/5">
                        <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold block mb-3">
                          Pièces jointes reçues ({selectedMail.attachments.length})
                        </span>
                        <div className="flex flex-wrap gap-2.5">
                          {selectedMail.attachments.map((att, idx) => (
                            <div key={idx} className="bg-black/55 border border-white/10 rounded-xl px-4 py-2 text-xs text-white/80 flex items-center gap-2.5 shadow-sm">
                              <FileText className="w-4.5 h-4.5 text-white/40" />
                              <span className="truncate max-w-[200px] font-mono">{att.filename}</span>
                              <span className="text-white/40 font-mono">({Math.round(att.size / 1024)} KB)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Message body container (Comfortable reading width with beautiful styles) */}
                    <div className="p-6 sm:p-8 bg-black/45">
                      {selectedMail.html ? (
                        <div 
                          className="email-html-render bg-white text-black p-6 sm:p-8 rounded-2xl overflow-x-auto text-sm sm:text-base leading-relaxed max-w-full"
                          dangerouslySetInnerHTML={{ __html: selectedMail.html }}
                        />
                      ) : (
                        <pre className="text-sm sm:text-base text-white/90 whitespace-pre-wrap font-sans leading-relaxed bg-white/5 border border-white/5 p-6 rounded-2xl">
                          {selectedMail.text}
                        </pre>
                      )}
                    </div>

                    {/* INTEGRATED REVOLUTIONARY AI ASSISTANCE SPACIOUS TOOLBOX */}
                    <div className="p-6 sm:p-8 bg-[#171717]/90 border-t border-b border-white/10 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-amber-500/[0.02] blur-3xl pointer-events-none" />
                      
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                          <span className="text-xs sm:text-sm font-bold text-white tracking-widest uppercase">Assistant Intelligent de Rédaction (Gemini 3.7)</span>
                        </div>
                        
                        <button 
                          onClick={() => setShowAiPanel(!showAiPanel)}
                          className="text-xs font-mono text-white/40 hover:text-white"
                        >
                          {showAiPanel ? "[ Masquer l'assistant ]" : "[ Développer l'assistant ]"}
                        </button>
                      </div>

                      {showAiPanel && (
                        <div className="space-y-5">
                          {/* Presets Grid - BIGGER BUTTONS with descriptive labels */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                            <button
                              onClick={() => handleGenerateAiResponse("Confirmer le rendez-vous chez le client pour établir le devis, de manière très enthousiaste, chaleureuse et réactive")}
                              disabled={generatingAiResponse || sendingMail}
                              className="px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 text-xs text-white hover:text-amber-300 transition-all text-left flex items-start gap-2.5 cursor-pointer"
                            >
                              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-bold">Confirmer RDV</div>
                                <div className="text-[10px] text-white/40 mt-0.5">Demande de devis acceptée</div>
                              </div>
                            </button>

                            <button
                              onClick={() => handleGenerateAiResponse("Demander poliment plus d'informations techniques sur le chantier (dimensions, épaisseur d'enduit des bandes, besoin de placo BA13 classique ou hydrofuge, photos si possible)")}
                              disabled={generatingAiResponse || sendingMail}
                              className="px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 text-xs text-white hover:text-amber-300 transition-all text-left flex items-start gap-2.5 cursor-pointer"
                            >
                              <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-bold">Détails requis</div>
                                <div className="text-[10px] text-white/40 mt-0.5">Demander des photos/infos</div>
                              </div>
                            </button>

                            <button
                              onClick={() => handleGenerateAiResponse("Refuser poliment car notre carnet de commandes de plâtrerie est complet sur le Bassin d'Arcachon pour les 3 prochains mois")}
                              disabled={generatingAiResponse || sendingMail}
                              className="px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 text-xs text-white hover:text-amber-300 transition-all text-left flex items-start gap-2.5 cursor-pointer"
                            >
                              <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-bold">Planning plein</div>
                                <div className="text-[10px] text-white/40 mt-0.5">Refuser poliment</div>
                              </div>
                            </button>

                            <button
                              onClick={() => handleQuickAutoReply(selectedMail)}
                              disabled={generatingAiResponse || sendingMail}
                              className="px-4 py-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 hover:border-amber-500 text-xs text-amber-400 hover:bg-amber-500/20 transition-all text-left flex items-start gap-2.5 cursor-pointer"
                              title="Envoie immédiatement l'accusé de réception pré-configuré"
                            >
                              <Reply className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-bold text-amber-300">Auto-Réponse</div>
                                <div className="text-[10px] text-amber-400/50 mt-0.5">Accuser réception (1-clic)</div>
                              </div>
                            </button>
                          </div>

                          {/* Custom input box */}
                          <div className="flex gap-2.5 pt-1">
                            <input
                              type="text"
                              value={aiInstruction}
                              onChange={(e) => setAiInstruction(e.target.value)}
                              placeholder="Écrivez une consigne en français (ex : Dis-lui que j'envoie le devis complet en fin de semaine)..."
                              className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-xs sm:text-sm text-white outline-none focus:border-amber-500/60"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && aiInstruction.trim()) {
                                  handleGenerateAiResponse(aiInstruction);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleGenerateAiResponse(aiInstruction)}
                              disabled={generatingAiResponse || !aiInstruction.trim()}
                              className="px-5 rounded-xl bg-amber-500 text-black text-xs sm:text-sm font-bold hover:bg-amber-400 disabled:opacity-30 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                            >
                              {generatingAiResponse ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Sparkles className="w-4 h-4" />
                              )}
                              <span>Rédiger avec Gemini</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer core reply actions - COMFORTABLE AND PROMINENT */}
                    <div className="p-6 bg-black/30 flex justify-between items-center gap-4">
                      <span className="text-[11px] text-white/30 font-mono hidden sm:inline">Entreprise Parat & Bouey</span>
                      
                      <div className="flex gap-3 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => handleQuickAutoReply(selectedMail)}
                          disabled={sendingMail}
                          className="px-5 py-3.5 rounded-xl border border-white/10 hover:border-white/25 text-white/70 hover:text-white bg-white/5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Reply className="w-4 h-4" />
                          <span>Accusé rapide</span>
                        </button>

                        <button
                          onClick={() => startReply(selectedMail)}
                          className="px-6 py-3.5 rounded-xl border border-amber-500/30 hover:border-amber-500/50 text-amber-400 bg-amber-500/5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer hover:shadow-lg active:scale-95"
                        >
                          <CornerUpLeft className="w-4 h-4" />
                          <span>Répondre manuellement</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
