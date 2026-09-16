import React, { useState, useEffect } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, Plus, Trash2, Edit3, X, Check, 
  Phone, Mail, FileText, CheckCircle2, AlertCircle, Info, Sparkles, Clock,
  Layers, Grid, ZoomIn, ZoomOut
} from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface Appointment {
  id: string;
  title: string;
  clientName: string;
  phone: string;
  email: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  color: 'red' | 'amber' | 'blue' | 'green' | 'purple' | 'indigo';
  status: 'confirmed' | 'option' | 'blocked';
  notes: string;
  createdAt?: any;
}

const COLOR_PRESETS = [
  { 
    id: 'red', 
    name: 'Pris / Chantier', 
    cellBg: 'bg-red-600 hover:bg-red-500 border-red-400 text-white shadow-md shadow-red-950/40',
    listBg: 'bg-red-500/15 border-red-500/30 text-red-400',
    dot: 'bg-red-500',
    badge: 'bg-black/30 text-white',
    border: 'border-red-500/40',
    bg: 'bg-red-500/15',
    text: 'text-red-400'
  },
  { 
    id: 'amber', 
    name: 'Occupation / Autre', 
    cellBg: 'bg-amber-500 hover:bg-amber-400 border-amber-300 text-neutral-950 font-medium shadow-md shadow-amber-950/40',
    listBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    dot: 'bg-amber-500',
    badge: 'bg-black/20 text-neutral-950',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400'
  },
  { 
    id: 'blue', 
    name: 'Option / Devis en cours', 
    cellBg: 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white shadow-md shadow-blue-950/40',
    listBg: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
    dot: 'bg-blue-500',
    badge: 'bg-black/30 text-white',
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/15',
    text: 'text-blue-400'
  },
  { 
    id: 'green', 
    name: 'Rendez-vous Client', 
    cellBg: 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-950/40',
    listBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    dot: 'bg-emerald-500',
    badge: 'bg-black/30 text-white',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400'
  },
  { 
    id: 'purple', 
    name: 'Congés / Perso', 
    cellBg: 'bg-purple-600 hover:bg-purple-500 border-purple-400 text-white shadow-md shadow-purple-950/40',
    listBg: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
    dot: 'bg-purple-500',
    badge: 'bg-black/30 text-white',
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/15',
    text: 'text-purple-400'
  },
  { 
    id: 'indigo', 
    name: 'Préparation Atelier', 
    cellBg: 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400 text-white shadow-md shadow-indigo-950/40',
    listBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400',
    dot: 'bg-indigo-500',
    badge: 'bg-black/30 text-white',
    border: 'border-indigo-500/40',
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-400'
  },
] as const;

export default function CalendarRdvAdmin() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'1m' | '3m' | 'year'>('1m');
  
  // Form states
  const [editingApp, setEditingApp] = useState<Appointment | null>(null);
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [color, setColor] = useState<Appointment['color']>('blue');
  const [status, setStatus] = useState<Appointment['status']>('option');
  const [notes, setNotes] = useState('');
  
  // Selection ranges
  const [selectionStep, setSelectionStep] = useState<'none' | 'start' | 'end'>('none');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColor, setFilterColor] = useState<string>('all');

  // Sync / Realtime database
  useEffect(() => {
    const q = query(collection(db, 'appointments'), orderBy('startDate', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Appointment[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Appointment);
      });
      setAppointments(data);
      setLoading(false);
    }, (error) => {
      console.error("Error loading appointments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Quick feedback timer
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Calendar Math
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayIndex = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    // Adjusting for Monday as first day of the week (0 = Sunday, 1 = Monday...)
    return day === 0 ? 6 : day - 1;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month labels in French
  const MONTH_NAMES = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const handlePrev = () => {
    if (viewMode === 'year') {
      setCurrentDate(new Date(year - 1, month, 1));
    } else if (viewMode === '3m') {
      setCurrentDate(new Date(year, month - 3, 1));
    } else {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'year') {
      setCurrentDate(new Date(year + 1, month, 1));
    } else if (viewMode === '3m') {
      setCurrentDate(new Date(year, month + 3, 1));
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());
  };

  // Convert Date object to YYYY-MM-DD
  const formatDateString = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Click on any calendar day cell across any month
  const handleDayClick = (dayNum: number, targetYear: number = year, targetMonth: number = month) => {
    const clickedDateStr = formatDateString(new Date(targetYear, targetMonth, dayNum));

    if (selectionStep === 'none' || selectionStep === 'start') {
      // First click: set start date
      setStartDate(clickedDateStr);
      setEndDate(clickedDateStr); // temporary
      setSelectionStep('end');
      setFeedback({ message: `Début sélectionné : ${clickedDateStr.split('-').reverse().join('/')}. Cliquez sur une autre date pour définir la fin.`, type: 'success' });
    } else if (selectionStep === 'end') {
      // Second click: set end date (ensure chronological order)
      if (clickedDateStr >= startDate) {
        setEndDate(clickedDateStr);
      } else {
        // Swap if end is earlier than start
        setEndDate(startDate);
        setStartDate(clickedDateStr);
      }
      setSelectionStep('none');
      setFeedback({ message: "Période de rendez-vous sélectionnée avec succès !", type: 'success' });
    }
  };

  // Check if a day falls within an appointment period
  const getAppointmentsForDay = (dayNum: number, targetYear: number = year, targetMonth: number = month) => {
    const dayStr = formatDateString(new Date(targetYear, targetMonth, dayNum));
    return appointments.filter(app => dayStr >= app.startDate && dayStr <= app.endDate);
  };

  const getHeaderTitle = () => {
    if (viewMode === 'year') {
      return `Année ${year}`;
    }
    if (viewMode === '3m') {
      const nextMonth1 = new Date(year, month + 1, 1);
      const nextMonth2 = new Date(year, month + 2, 1);
      return `${MONTH_NAMES[month]} ${year} — ${MONTH_NAMES[nextMonth2.getMonth()]} ${nextMonth2.getFullYear()}`;
    }
    return `${MONTH_NAMES[month]} ${year}`;
  };

  // Submit appointment (Create / Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) {
      setFeedback({ message: "Veuillez remplir au moins le titre, le début et la fin.", type: 'error' });
      return;
    }

    if (endDate < startDate) {
      setFeedback({ message: "La date de fin ne peut pas être antérieure à la date de début.", type: 'error' });
      return;
    }

    const payload = {
      title: title.trim(),
      clientName: clientName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      startDate,
      endDate,
      color,
      status,
      notes: notes.trim(),
      adminCode: '0107'
    };

    try {
      if (editingApp) {
        // Update
        const docRef = doc(db, 'appointments', editingApp.id);
        await updateDoc(docRef, payload);
        setFeedback({ message: "Rendez-vous mis à jour avec succès !", type: 'success' });
      } else {
        // Create
        await addDoc(collection(db, 'appointments'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        setFeedback({ message: "Nouveau rendez-vous enregistré !", type: 'success' });
      }

      // Reset form
      handleCancelEdit();
    } catch (err) {
      console.error("Error saving appointment:", err);
      setFeedback({ message: "Une erreur est survenue lors de l'enregistrement.", type: 'error' });
    }
  };

  const handleStartEdit = (app: Appointment) => {
    setEditingApp(app);
    setTitle(app.title);
    setClientName(app.clientName || '');
    setPhone(app.phone || '');
    setEmail(app.email || '');
    setStartDate(app.startDate);
    setEndDate(app.endDate);
    setColor(app.color);
    setStatus(app.status);
    setNotes(app.notes || '');
    setSelectionStep('none');
  };

  const handleCancelEdit = () => {
    setEditingApp(null);
    setTitle('');
    setClientName('');
    setPhone('');
    setEmail('');
    setStartDate('');
    setEndDate('');
    setColor('blue');
    setStatus('option');
    setNotes('');
    setSelectionStep('none');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'appointments', id));
      setFeedback({ message: "Rendez-vous supprimé.", type: 'success' });
      setDeleteConfirmId(null);
      if (editingApp?.id === id) {
        handleCancelEdit();
      }
    } catch (err) {
      console.error("Error deleting appointment:", err);
      setFeedback({ message: "Erreur lors de la suppression.", type: 'error' });
    }
  };

  // Helpers for custom preset colors
  const getColorClasses = (c: Appointment['color']) => {
    const matched = COLOR_PRESETS.find(p => p.id === c);
    return matched || COLOR_PRESETS[2]; // fallback to blue
  };

  // Filtering list
  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = 
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.notes.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesColor = filterColor === 'all' || app.color === filterColor;
    return matchesSearch && matchesColor;
  });

  // Modular UI Renderers
  const renderLegend = () => (
    <div className="pt-3 border-t border-white/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <h4 className="text-[9px] uppercase font-mono tracking-widest text-white/40 font-bold">Légende des catégories & chantiers</h4>
        <div className="flex items-center gap-2 text-[9px] font-mono text-amber-400/90">
          <span className="w-2 h-2 rounded-xs border border-dashed border-amber-500/40 bg-neutral-900" />
          <span>Week-ends grisés / hachurés (Sam & Dim)</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[10px]">
        {COLOR_PRESETS.map((preset) => (
          <div key={preset.id} className="flex items-center gap-1.5 text-white/70 bg-black/20 p-1.5 rounded-lg border border-white/5">
            <span className={`w-2.5 h-2.5 rounded-full ${preset.dot} shrink-0`} />
            <span className="truncate">{preset.name}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMonthCalendar = (targetDate: Date, isCompact: boolean = false) => {
    const tYear = targetDate.getFullYear();
    const tMonth = targetDate.getMonth();
    const daysInTargetMonth = getDaysInMonth(tYear, tMonth);
    const firstDayTargetIndex = getFirstDayIndex(tYear, tMonth);
    const tMonthName = MONTH_NAMES[tMonth];

    const targetMonthApps = appointments.filter(app => {
      const startStr = formatDateString(new Date(tYear, tMonth, 1));
      const endStr = formatDateString(new Date(tYear, tMonth, daysInTargetMonth));
      return app.startDate <= endStr && app.endDate >= startStr;
    });

    const minCellH = isCompact ? 'min-h-[58px] sm:min-h-[66px]' : 'min-h-[76px] sm:min-h-[90px]';

    return (
      <div key={`${tYear}-${tMonth}`} className="bg-[#121217] border border-white/10 rounded-2xl p-3 sm:p-4 space-y-2 shadow-inner">
        {/* Month Header Banner */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-amber-300 font-mono tracking-wide">
              {tMonthName} {tYear}
            </h3>
            {targetMonthApps.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold font-mono">
                {targetMonthApps.length} événement{targetMonthApps.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {viewMode !== '1m' && (
            <button
              type="button"
              onClick={() => {
                setCurrentDate(new Date(tYear, tMonth, 1));
                setViewMode('1m');
              }}
              className="text-[10px] text-white/50 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer font-mono transition-colors"
              title="Zoomer sur ce mois spécifique"
            >
              <ZoomIn className="w-3 h-3 text-amber-400" />
              <span>Zoom 1 mois</span>
            </button>
          )}
        </div>

        {/* Weekdays Labels: 7 Columns with high-contrast weekend indicators */}
        <div className="grid grid-cols-7 text-center border-b border-white/10 pb-1.5 text-[9px] sm:text-[10px] uppercase font-mono tracking-wider font-bold">
          <span className="text-white/70 py-0.5">Lun</span>
          <span className="text-white/70 py-0.5">Mar</span>
          <span className="text-white/70 py-0.5">Mer</span>
          <span className="text-white/70 py-0.5">Jeu</span>
          <span className="text-white/70 py-0.5 border-r-2 border-r-amber-500/40 pr-0.5">Ven</span>
          <span className="text-amber-300 bg-amber-500/20 border border-amber-500/50 rounded py-0.5 mx-0.5 shadow-xs font-black">Sam</span>
          <span className="text-amber-300 bg-amber-500/20 border border-amber-500/50 rounded py-0.5 mx-0.5 shadow-xs font-black">Dim</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 pt-1">
          {/* Empty offset day cells */}
          {Array.from({ length: firstDayTargetIndex }).map((_, index) => {
            const isWeekendCol = index >= 5;
            const isFridayCol = index === 4;
            return (
              <div 
                key={`empty-${tYear}-${tMonth}-${index}`} 
                style={isWeekendCol ? { backgroundImage: 'repeating-linear-gradient(135deg, #09090c 0px, #09090c 6px, #14141c 6px, #14141c 12px)' } : undefined}
                className={`rounded-xl border ${minCellH} p-1 opacity-25 ${
                  isWeekendCol 
                    ? 'border-dashed border-amber-500/20 bg-neutral-950' 
                    : isFridayCol
                    ? 'border-white/[0.03] border-r-2 border-r-amber-500/30 bg-white/[0.01]'
                    : 'bg-white/[0.01] border-transparent'
                }`}
              />
            );
          })}

          {/* Real day cells of the target month */}
          {Array.from({ length: daysInTargetMonth }).map((_, index) => {
            const dayNum = index + 1;
            const dDate = new Date(tYear, tMonth, dayNum);
            const dayOfWeek = dDate.getDay(); // 0 = Dimanche, 6 = Samedi
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isFriday = dayOfWeek === 5;
            const dStr = formatDateString(dDate);
            const dayApps = getAppointmentsForDay(dayNum, tYear, tMonth);
            
            const isSelectedStart = startDate === dStr;
            const isSelectedEnd = endDate === dStr;
            const isInSelectedRange = startDate && endDate && dStr >= startDate && dStr <= endDate;
            const isToday = formatDateString(new Date()) === dStr;

            const hasApps = dayApps.length > 0;
            const primaryApp = hasApps ? dayApps[0] : null;
            const col = primaryApp ? getColorClasses(primaryApp.color) : null;

            // Compute exact cell background & styling
            let cellStyle = '';
            let inlineBg = '';

            if (hasApps && col) {
              // CASE ENTIÈRE EN COULEUR VIVE
              cellStyle = `${col.cellBg} ring-1 ring-white/20`;
            } else if (isSelectedStart || isSelectedEnd) {
              cellStyle = 'border-amber-400 bg-amber-500 text-black font-semibold ring-2 ring-amber-300 shadow-lg';
            } else if (isInSelectedRange) {
              cellStyle = 'border-amber-400/80 bg-amber-500/25 text-amber-200';
            } else if (isToday) {
              cellStyle = 'border-amber-400 bg-amber-400/15 text-white shadow-inner ring-1 ring-amber-400/60';
            } else if (isWeekend) {
              // WEEK-END HAUTE VISIBILITÉ : Hachures diagonales sombres + bordure ambrée en pointillés
              cellStyle = 'border-dashed border-amber-500/35 hover:border-amber-400 text-neutral-200 hover:shadow-md hover:shadow-amber-500/10';
              inlineBg = 'repeating-linear-gradient(135deg, #09090c 0px, #09090c 7px, #161622 7px, #161622 14px)';
            } else {
              // JOUR DE SEMAINE STANDARD (Gris ardoise lisse et contrasté)
              cellStyle = 'border-white/10 bg-[#1c1c28] text-white/90 hover:bg-[#252534] hover:border-white/20';
            }

            return (
              <div
                key={`day-${tYear}-${tMonth}-${dayNum}`}
                onClick={() => handleDayClick(dayNum, tYear, tMonth)}
                style={inlineBg ? { backgroundImage: inlineBg } : undefined}
                className={`${minCellH} rounded-xl border transition-all p-1 sm:p-1.5 flex flex-col justify-between cursor-pointer group relative overflow-hidden select-none ${cellStyle} ${
                  isFriday && !hasApps ? 'border-r-2 border-r-amber-500/40' : ''
                }`}
              >
                {/* Top Row: Day Number & Indicators */}
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] sm:text-xs font-mono font-black px-1.5 py-0.5 rounded leading-none ${
                    hasApps && col
                      ? col.badge
                      : isToday
                      ? 'bg-amber-400 text-black font-extrabold shadow-xs'
                      : isWeekend
                      ? 'bg-amber-500/25 text-amber-300 font-black border border-amber-500/40'
                      : 'bg-black/40 text-white/80 group-hover:text-white'
                  }`}>
                    {dayNum}
                  </span>
                  
                  {hasApps ? (
                    <div className="flex items-center gap-1">
                      {isWeekend && (
                        <span className="text-[7px] font-mono font-black uppercase px-1 py-0.2 rounded bg-black/60 text-amber-300 border border-amber-400/40">
                          WE
                        </span>
                      )}
                      {dayApps.length > 1 && (
                        <span className="text-[7px] sm:text-[8px] bg-black/50 text-white px-1 py-0.5 rounded-full font-bold">
                          +{dayApps.length - 1}
                        </span>
                      )}
                      <span className={`w-2 h-2 rounded-full ring-1 ring-white/50 ${
                        primaryApp?.status === 'confirmed' ? 'bg-white' : primaryApp?.status === 'blocked' ? 'bg-red-200' : 'bg-amber-200'
                      }`} />
                    </div>
                  ) : isWeekend ? (
                    <span className="text-[7px] sm:text-[8px] font-mono uppercase tracking-tight px-1 py-0.5 rounded bg-black/80 text-amber-300 border border-amber-500/40 font-black shadow-xs">
                      {isCompact ? 'WE' : 'WEEK-END'}
                    </span>
                  ) : null}
                </div>

                {/* Middle/Bottom: Full Box Content */}
                {hasApps && primaryApp ? (
                  <div className="mt-1 space-y-0.5">
                    <div className="text-[9px] sm:text-[10px] font-bold leading-tight line-clamp-2 drop-shadow-xs">
                      {primaryApp.title}
                    </div>
                    {primaryApp.clientName && (
                      <div className="text-[8px] sm:text-[9px] opacity-90 truncate font-medium">
                        {primaryApp.clientName}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[8px] opacity-0 group-hover:opacity-40 font-mono text-center transition-opacity">
                    + planifier
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYearCalendar = () => {
    return (
      <div className="bg-[#121217] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Grid className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
                <span>Vue Annuelle Dézoomée — {year}</span>
              </h3>
              <p className="text-[10px] text-white/50">12 mois complets avec chantiers colorés. Cliquez sur un jour ou un mois pour zoomer.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 12 }).map((_, mIdx) => {
            const dInMonth = getDaysInMonth(year, mIdx);
            const fDay = getFirstDayIndex(year, mIdx);
            const mName = MONTH_NAMES[mIdx];
            const mApps = appointments.filter(app => {
              const startStr = formatDateString(new Date(year, mIdx, 1));
              const endStr = formatDateString(new Date(year, mIdx, dInMonth));
              return app.startDate <= endStr && app.endDate >= startStr;
            });

            return (
              <div 
                key={`year-month-${mIdx}`}
                className="bg-black/40 border border-white/10 hover:border-amber-400/50 rounded-xl p-3 transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentDate(new Date(year, mIdx, 1));
                      setViewMode('1m');
                    }}
                    className="text-xs font-bold text-amber-300 hover:text-white hover:underline font-mono text-left cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <span>{mName}</span>
                    <ZoomIn className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  {mApps.length > 0 && (
                    <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-mono font-bold">
                      {mApps.length}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-7 gap-0.5 text-center text-[8px] font-mono text-white/50 pb-1 font-bold">
                  <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span>
                  <span className="text-amber-400 font-black">S</span>
                  <span className="text-amber-400 font-black">D</span>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: fDay }).map((_, i) => (
                    <div key={`empty-${mIdx}-${i}`} className="aspect-square opacity-0" />
                  ))}
                  {Array.from({ length: dInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dDate = new Date(year, mIdx, dayNum);
                    const dayOfWeek = dDate.getDay();
                    const isWE = dayOfWeek === 0 || dayOfWeek === 6;
                    const dayApps = getAppointmentsForDay(dayNum, year, mIdx);
                    const hasApps = dayApps.length > 0;
                    const col = hasApps ? getColorClasses(dayApps[0].color) : null;
                    const isToday = formatDateString(new Date()) === formatDateString(dDate);

                    return (
                      <button
                        type="button"
                        key={`ym-${mIdx}-${dayNum}`}
                        onClick={() => {
                          setCurrentDate(new Date(year, mIdx, 1));
                          handleDayClick(dayNum, year, mIdx);
                          setViewMode('1m');
                        }}
                        title={hasApps ? `${dayApps[0].title} (${dayApps[0].clientName})` : `${dayNum} ${mName}`}
                        className={`aspect-square rounded-md text-[8px] font-mono flex items-center justify-center transition-all cursor-pointer select-none ${
                          hasApps && col
                            ? `${col.cellBg} font-black ring-1 ring-white/30 text-[9px] shadow-xs`
                            : isToday
                            ? 'bg-amber-400 text-black font-extrabold'
                            : isWE
                            ? 'bg-neutral-900 border border-amber-500/30 text-amber-300/80 font-bold'
                            : 'bg-white/5 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAppointmentForm = () => (
    <div className="p-4 sm:p-5 space-y-4">
      <h3 className="text-xs uppercase tracking-widest font-mono font-bold flex items-center gap-1.5 text-amber-400">
        {editingApp ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        <span>{editingApp ? "Modifier le rendez-vous" : "Planifier une occupation / RDV"}</span>
      </h3>

      {feedback && (
        <div className={`p-2.5 rounded-xl border text-xs text-center animate-fade-in ${
          feedback.type === 'error' ? 'bg-red-500/10 border-red-500/25 text-red-400' : 'bg-green-500/10 border-green-500/25 text-green-400'
        }`}>
          {feedback.type === 'error' ? <AlertCircle className="w-4 h-4 inline mr-1" /> : <CheckCircle2 className="w-4 h-4 inline mr-1" />}
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1 font-mono">Date Début *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 transition-all font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1 font-mono">Date Fin *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 transition-all font-mono"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1 font-mono">Titre de l'occupation *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Chantier Plâtrerie, Indisponible, RDV"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 transition-all"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1 font-mono">Nom du Client</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: M. Martin"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1 font-mono">Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Appointment['status'])}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-2 text-white outline-none focus:border-amber-400 transition-all"
            >
              <option value="option" className="bg-neutral-900 text-white">Option / Demandé</option>
              <option value="confirmed" className="bg-neutral-900 text-white">Confirmé / Pris</option>
              <option value="blocked" className="bg-neutral-900 text-white">Bloqué / Indisponible</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1 font-mono">Téléphone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1 font-mono">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@mail.com"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 transition-all"
            />
          </div>
        </div>

        {/* Color Code Preset selector */}
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1 font-mono">Couleur / Catégorie</label>
          <div className="grid grid-cols-3 gap-1.5">
            {COLOR_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.id}
                onClick={() => setColor(preset.id as Appointment['color'])}
                className={`py-1 px-1.5 rounded-lg border text-[9px] font-medium flex items-center gap-1.5 transition-all cursor-pointer truncate ${
                  color === preset.id
                    ? `bg-white/10 ${preset.border} border-amber-400 text-white scale-102`
                    : 'bg-white/5 border-transparent text-white/50 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${preset.dot} shrink-0`} />
                <span className="truncate">{preset.name.split(' / ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1 font-mono">Notes / Instructions chantiers</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Détails du chantier (placo, joints, accès clés, etc.)"
            rows={2}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 transition-all resize-none text-xs"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {editingApp && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex-1 py-2.5 bg-red-500/15 hover:bg-red-500/20 text-red-400 font-semibold rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Annuler
            </button>
          )}
          <button
            type="submit"
            className="w-full bg-amber-500 text-black font-semibold rounded-xl py-2.5 text-[10px] uppercase tracking-wider hover:bg-amber-400 transition-all flex items-center justify-center gap-1 font-bold cursor-pointer shadow-md shadow-amber-500/20"
          >
            {editingApp ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Enregistrer les modifications
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Planifier l'événement
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  const renderAppointmentList = () => (
    <div className="p-4 sm:p-5 flex-1 space-y-3 flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-white/70 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-amber-400" />
          Liste des chantiers & RDV ({filteredAppointments.length})
        </h3>
        
        <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
          <select
            value={filterColor}
            onChange={(e) => setFilterColor(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white/80 focus:border-amber-400 outline-none"
          >
            <option value="all" className="bg-neutral-900 text-white">Toutes couleurs</option>
            {COLOR_PRESETS.map(p => (
              <option key={p.id} value={p.id} className="bg-neutral-900 text-white">{p.name.split(' / ')[0]}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white/80 focus:border-amber-400 outline-none w-full sm:w-28"
          />
        </div>
      </div>

      {/* Scrollable List Container */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin pr-1 flex-1">
        {loading ? (
          <div className="text-center py-8 text-white/40 text-xs font-mono">
            Chargement du planning...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl text-white/40 text-xs">
            Aucun événement planifié trouvé
          </div>
        ) : (
          filteredAppointments.map((app) => {
            const col = getColorClasses(app.color);
            const isSelected = editingApp?.id === app.id;
            
            return (
              <div 
                key={app.id}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 text-xs relative ${
                  isSelected 
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-inner' 
                    : 'bg-white/5 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`w-2 h-2 rounded-full ${col.dot} shrink-0`} />
                      <h4 className="font-bold text-white text-[12px]">{app.title}</h4>
                      
                      <span className="text-[8px] bg-white/10 px-1.5 py-0.2 rounded uppercase tracking-wider font-mono text-white/60">
                        {app.status === 'confirmed' ? 'Confirmé' : app.status === 'blocked' ? 'Bloqué' : 'Option'}
                      </span>
                    </div>
                    
                    {app.clientName && (
                      <p className="text-[10px] text-amber-300 font-semibold">{app.clientName}</p>
                    )}
                    
                    {/* Period dates */}
                    <p className="text-[10px] text-white/40 font-mono flex items-center gap-1.5">
                      <span>Du {app.startDate.split('-').reverse().join('/')}</span>
                      <span>au {app.endDate.split('-').reverse().join('/')}</span>
                    </p>
                  </div>

                  {/* Edit & Delete Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {deleteConfirmId === app.id ? (
                      <div className="flex items-center gap-1 animate-fade-in text-[8px] font-mono">
                        <button
                          type="button"
                          onClick={() => handleDelete(app.id)}
                          className="px-1.5 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold"
                        >
                          OUI
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/80"
                        >
                          NON
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(app)}
                          className="p-1 rounded bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 cursor-pointer"
                          title="Modifier"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(app.id)}
                          className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Contacts & Notes */}
                {(app.phone || app.email || app.notes) && (
                  <div className="border-t border-white/5 pt-2 mt-1 space-y-1.5 text-[10px] text-white/50">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {app.phone && (
                        <a href={`tel:${app.phone}`} className="flex items-center gap-1 hover:text-amber-300 transition-colors">
                          <Phone className="w-3 h-3" />
                          <span>{app.phone}</span>
                        </a>
                      )}
                      {app.email && (
                        <a href={`mailto:${app.email}`} className="flex items-center gap-1 hover:text-amber-300 transition-colors">
                          <Mail className="w-3 h-3" />
                          <span>{app.email}</span>
                        </a>
                      )}
                    </div>
                    {app.notes && (
                      <div className="bg-black/30 p-1.5 rounded text-white/60 leading-relaxed font-sans text-[9px] flex items-start gap-1">
                        <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{app.notes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-[#121212] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-fade-in text-white">
      {/* Tab Header Banner */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-white/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">Gestion de Planning & RDV</h2>
              <p className="text-[10px] text-white/50">Planification des chantiers et suivi visuel des disponibilités du Bassin d'Arcachon</p>
            </div>
          </div>
        </div>
        
        {/* Controls: View Modes (1M, 3M, Year) & Navigation */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-black/60 border border-white/15 rounded-xl p-1 gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('1m')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === '1m'
                  ? 'bg-amber-500 text-black font-black shadow-md shadow-amber-500/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>1 Mois</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('3m')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === '3m'
                  ? 'bg-amber-500 text-black font-black shadow-md shadow-amber-500/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3 Mois (Trimestre)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('year')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'year'
                  ? 'bg-amber-500 text-black font-black shadow-md shadow-amber-500/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Année (12 Mois)</span>
            </button>
          </div>

          {/* Navigation controls */}
          <div className="flex items-center gap-1.5">
            <button 
              type="button"
              onClick={handleGoToday}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white transition-all cursor-pointer font-medium"
            >
              Aujourd'hui
            </button>
            
            <div className="flex items-center gap-1 bg-black/50 border border-white/10 rounded-xl p-1 shadow-inner">
              <button 
                type="button"
                onClick={handlePrev}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                title={viewMode === 'year' ? "Année précédente" : viewMode === '3m' ? "Trimestre précédent" : "Mois précédent"}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold px-2 sm:px-3 min-w-[130px] sm:min-w-[170px] text-center font-mono text-amber-300 truncate">
                {getHeaderTitle()}
              </span>
              <button 
                type="button"
                onClick={handleNext}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                title={viewMode === 'year' ? "Année suivante" : viewMode === '3m' ? "Trimestre suivant" : "Mois suivant"}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body View based on viewMode */}
      {viewMode === '1m' ? (
        /* 1 MONTH VIEW: 7-COLUMN CALENDAR (LEFT 7 COLS) & FORM/LIST (RIGHT 5 COLS) */
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
          <div className="lg:col-span-7 p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                Cliquez sur un jour de début, puis un jour de fin pour tracer une zone
              </span>
              
              {selectionStep !== 'none' && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30 animate-pulse">
                  Sélection de fin active...
                </span>
              )}
            </div>

            {renderMonthCalendar(currentDate, false)}
            {renderLegend()}
          </div>

          <div className="lg:col-span-5 flex flex-col divide-y divide-white/10 bg-black/20">
            {renderAppointmentForm()}
            {renderAppointmentList()}
          </div>
        </div>
      ) : viewMode === '3m' ? (
        /* 3 MONTHS (TRIMESTRE) VIEW: 3 MONTHS SIDE-BY-SIDE ON TOP, FORM & LIST BELOW */
        <div>
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                Vue Trimestrielle (3 Mois) — Visibilité sur 90 jours de chantiers
              </span>
              
              {selectionStep !== 'none' && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30 animate-pulse">
                  Sélection de fin active...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderMonthCalendar(currentDate, true)}
              {renderMonthCalendar(new Date(year, month + 1, 1), true)}
              {renderMonthCalendar(new Date(year, month + 2, 1), true)}
            </div>

            {renderLegend()}
          </div>

          <div className="border-t border-white/10 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/10 bg-black/20">
            <div className="lg:col-span-5">
              {renderAppointmentForm()}
            </div>
            <div className="lg:col-span-7">
              {renderAppointmentList()}
            </div>
          </div>
        </div>
      ) : (
        /* YEAR (12 MONTHS) BIRD'S EYE VIEW: 12 MINI MONTHS ON TOP, FORM & LIST BELOW */
        <div>
          <div className="p-4 sm:p-6 space-y-4">
            {renderYearCalendar()}
            {renderLegend()}
          </div>

          <div className="border-t border-white/10 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/10 bg-black/20">
            <div className="lg:col-span-5">
              {renderAppointmentForm()}
            </div>
            <div className="lg:col-span-7">
              {renderAppointmentList()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
