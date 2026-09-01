import React, { useState, useEffect } from 'react';
import { 
  Car, Calendar, Plus, Trash2, Download, Calculator, Settings, 
  MapPin, Check, FileText, AlertCircle, Sparkles, ChevronRight, Info
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { jsPDF } from 'jspdf';

// Official French barème kilométrique for passenger cars (current scale)
interface BaremeFormula {
  under5k: (d: number) => number;
  under20k: (d: number) => number;
  over20k: (d: number) => number;
  labelUnder5k: string;
  labelUnder20k: string;
  labelOver20k: string;
}

const BAREME_IK: { [key: string]: BaremeFormula } = {
  '3 CV': {
    under5k: (d) => d * 0.529,
    under20k: (d) => (d * 0.316) + 1065,
    over20k: (d) => d * 0.370,
    labelUnder5k: "d x 0,529",
    labelUnder20k: "(d x 0,316) + 1 065",
    labelOver20k: "d x 0,370"
  },
  '4 CV': {
    under5k: (d) => d * 0.606,
    under20k: (d) => (d * 0.340) + 1330,
    over20k: (d) => d * 0.407,
    labelUnder5k: "d x 0,606",
    labelUnder20k: "(d x 0,34) + 1 330",
    labelOver20k: "d x 0,407"
  },
  '5 CV': {
    under5k: (d) => d * 0.636,
    under20k: (d) => (d * 0.357) + 1395,
    over20k: (d) => d * 0.427,
    labelUnder5k: "d x 0,636",
    labelUnder20k: "(d x 0,357) + 1 395",
    labelOver20k: "d x 0,427"
  },
  '6 CV': {
    under5k: (d) => d * 0.665,
    under20k: (d) => (d * 0.374) + 1457,
    over20k: (d) => d * 0.447,
    labelUnder5k: "d x 0,665",
    labelUnder20k: "(d x 0,374) + 1 457",
    labelOver20k: "d x 0,447"
  },
  '7 CV et +': {
    under5k: (d) => d * 0.697,
    under20k: (d) => (d * 0.394) + 1515,
    over20k: (d) => d * 0.470,
    labelUnder5k: "d x 0,697",
    labelUnder20k: "(d x 0,394) + 1 515",
    labelOver20k: "d x 0,470"
  }
};

interface Trip {
  id: string;
  date: string;
  purpose: string;
  departure: string;
  arrival: string;
  kilometers: number;
  vehiclePower: string;
  vehicleType: string;
  allowance: number;
  createdAt: string;
}

// Preset options for quick mobile entry (saving time for tradesmen)
const PURPOSE_PRESETS = [
  "Chantier Plâtrerie / Placo",
  "Achat Matériaux / Leroy Merlin",
  "Rendez-vous Client / Devis",
  "Rendez-vous Cabinet Comptable",
  "Dépôt Déchetterie",
  "Achat outillage pro"
];

const LOCATION_PRESETS = [
  "Le Teich",
  "Gujan-Mestras",
  "La Teste-de-Buch",
  "Arcachon",
  "Lège-Cap-Ferret",
  "Biganos",
  "Mios",
  "Bordeaux"
];

// Quick standard distances preset (from Le Teich to surrounding cities on the Bassin)
const DISTANCE_PRESETS: { [key: string]: number } = {
  "Le Teich ➔ Gujan-Mestras": 8,
  "Gujan-Mestras ➔ Le Teich": 8,
  "Le Teich ➔ La Teste-de-Buch": 15,
  "La Teste-de-Buch ➔ Le Teich": 15,
  "Le Teich ➔ Arcachon": 19,
  "Arcachon ➔ Le Teich": 19,
  "Le Teich ➔ Biganos": 6,
  "Biganos ➔ Le Teich": 6,
  "Le Teich ➔ Lège-Cap-Ferret": 45,
  "Lège-Cap-Ferret ➔ Le Teich": 45,
  "Le Teich ➔ Bordeaux": 55,
  "Bordeaux ➔ Le Teich": 55,
  "Le Teich ➔ Mios": 12,
  "Mios ➔ Le Teich": 12
};

export default function MileageTracker() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState('');
  const [departure, setDeparture] = useState('Le Teich');
  const [arrival, setArrival] = useState('');
  const [kilometers, setKilometers] = useState<number | ''>('');
  const [isRoundTrip, setIsRoundTrip] = useState(true); // default to A/R since most trips are round trips

  // Vehicle configuration (saved in LocalStorage)
  const [vehiclePower, setVehiclePower] = useState(() => localStorage.getItem('pb_vehicle_power') || '5 CV');
  const [vehicleType, setVehicleType] = useState(() => localStorage.getItem('pb_vehicle_type') || 'thermique');
  const [vehicleDesc, setVehicleDesc] = useState(() => localStorage.getItem('pb_vehicle_desc') || 'Véhicule Perso - SASU Parat & Bouey');
  
  // Show settings state
  const [showSettings, setShowSettings] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter state for report download
  const [exportMode, setExportMode] = useState<'mensuel' | 'personnalise'>('mensuel');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  
  // Custom period dates (defaults to last 3 months)
  const [exportStartDate, setExportStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  const [exportEndDate, setExportEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Save vehicle settings to local storage
  useEffect(() => {
    localStorage.setItem('pb_vehicle_power', vehiclePower);
    localStorage.setItem('pb_vehicle_type', vehicleType);
    localStorage.setItem('pb_vehicle_desc', vehicleDesc);
  }, [vehiclePower, vehicleType, vehicleDesc]);

  // Listen to trips in Firestore
  useEffect(() => {
    const q = query(collection(db, 'mileage_trips'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tripsData: Trip[] = [];
      snapshot.forEach((doc) => {
        tripsData.push({ id: doc.id, ...doc.data() } as Trip);
      });
      setTrips(tripsData);
      setLoading(false);
    }, (error) => {
      console.error("Error loading mileage trips:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper to compute annual mileage & refund based on the official scale
  const getYearSummary = (year: string) => {
    const yearTrips = trips.filter(t => t.date.startsWith(year));
    const totalKm = yearTrips.reduce((acc, t) => acc + t.kilometers, 0);
    
    // Choose the formula according to selected vehicle fiscal power
    const formula = BAREME_IK[vehiclePower] || BAREME_IK['5 CV'];
    
    let baseAllowance = 0;
    let rateLabel = "";
    
    if (totalKm <= 5000) {
      baseAllowance = formula.under5k(totalKm);
      rateLabel = formula.labelUnder5k;
    } else if (totalKm <= 20000) {
      baseAllowance = formula.under20k(totalKm);
      rateLabel = formula.labelUnder20k;
    } else {
      baseAllowance = formula.over20k(totalKm);
      rateLabel = formula.labelOver20k;
    }

    // Electric vehicle gets a 20% bonus
    const multiplier = vehicleType === 'electrique' ? 1.2 : 1;
    const finalAllowance = baseAllowance * multiplier;

    return {
      totalKm,
      totalAllowance: Number(finalAllowance.toFixed(2)),
      rateLabel: vehicleType === 'electrique' ? `${rateLabel} (+20% Élec)` : rateLabel
    };
  };

  // Live calculation of allowance for the single input trip
  // Based on current cumulative annual distance to be dynamic
  const calculateSingleTripAllowance = (km: number) => {
    if (!km) return 0;
    const currentYear = date.split('-')[0];
    const yearTrips = trips.filter(t => t.date.startsWith(currentYear));
    const cumulativeKm = yearTrips.reduce((acc, t) => acc + t.kilometers, 0) + km;

    const formula = BAREME_IK[vehiclePower] || BAREME_IK['5 CV'];
    let baseRate = 0;

    // We estimate using the tier the cumulative distance falls into
    if (cumulativeKm <= 5000) {
      baseRate = formula.under5k(km) / km;
    } else if (cumulativeKm <= 20000) {
      // Approximate marginal rate for middle tier to give immediate visual value
      baseRate = formula.under20k(cumulativeKm) / cumulativeKm;
    } else {
      baseRate = formula.over20k(km) / km;
    }

    const multiplier = vehicleType === 'electrique' ? 1.2 : 1;
    return Number((km * baseRate * multiplier).toFixed(2));
  };

  // Add trip
  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim() || !departure.trim() || !arrival.trim() || !kilometers) {
      setFeedback({ message: "Veuillez remplir tous les champs du trajet.", type: 'error' });
      return;
    }

    const oneWayKm = Number(kilometers);
    if (isNaN(oneWayKm) || oneWayKm <= 0) {
      setFeedback({ message: "La distance doit être supérieure à 0.", type: 'error' });
      return;
    }

    const totalKm = isRoundTrip ? oneWayKm * 2 : oneWayKm;
    const calculatedAllowance = calculateSingleTripAllowance(totalKm);

    // Format purpose to include A/R if relevant so the accounting PDF is pristine and compliant
    let finalPurpose = purpose.trim();
    if (isRoundTrip && !finalPurpose.toUpperCase().includes('(A/R)') && !finalPurpose.toUpperCase().includes('ALLER-RETOUR')) {
      finalPurpose = `${finalPurpose} (A/R)`;
    }

    try {
      await addDoc(collection(db, 'mileage_trips'), {
        date,
        purpose: finalPurpose,
        departure: departure.trim(),
        arrival: arrival.trim(),
        kilometers: totalKm,
        vehiclePower,
        vehicleType,
        allowance: calculatedAllowance,
        createdAt: new Date().toISOString(),
        adminCode: '0107' // aligned with app's security code
      });

      // Clear non-presets
      setPurpose('');
      setArrival('');
      setKilometers('');
      setFeedback({ message: "Trajet enregistré avec succès !", type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error saving trip:", err);
      setFeedback({ message: "Erreur de sauvegarde. Vérifiez votre connexion.", type: 'error' });
    }
  };

  // Delete trip
  const handleDeleteTrip = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'mileage_trips', id));
      setDeleteConfirmId(null);
      setFeedback({ message: "Trajet supprimé avec succès.", type: 'success' });
      setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      console.error("Error deleting trip:", err);
      setFeedback({ message: "Impossible de supprimer ce trajet.", type: 'error' });
    }
  };

  // Fast filling of standard trip presets
  const applyDistancePreset = (dep: string, arr: string) => {
    const key1 = `${dep} ➔ ${arr}`;
    const key2 = `${arr} ➔ ${dep}`;
    let baseKm = 0;
    if (DISTANCE_PRESETS[key1]) {
      baseKm = DISTANCE_PRESETS[key1];
    } else if (DISTANCE_PRESETS[key2]) {
      baseKm = DISTANCE_PRESETS[key2];
    }

    if (baseKm > 0) {
      setKilometers(baseKm);
    } else {
      setKilometers('');
    }
  };

  // Generate Professional PDF
  const handleDownloadPDF = () => {
    let periodTrips: Trip[] = [];
    let periodLabel = "";
    let filename = "";

    if (exportMode === 'mensuel') {
      const targetPeriod = `${selectedYear}-${selectedMonth}`;
      periodTrips = trips
        .filter(t => t.date.startsWith(targetPeriod))
        .sort((a, b) => a.date.localeCompare(b.date));
      periodLabel = `Mois de ${selectedMonth}/${selectedYear}`;
      filename = `Indemnites_Kilometriques_${selectedMonth}_${selectedYear}.pdf`;
    } else {
      periodTrips = trips
        .filter(t => t.date >= exportStartDate && t.date <= exportEndDate)
        .sort((a, b) => a.date.localeCompare(b.date));
      
      const formatFr = (dStr: string) => {
        try {
          const parts = dStr.split('-');
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        } catch (e) {
          return dStr;
        }
      };
      periodLabel = `Du ${formatFr(exportStartDate)} au ${formatFr(exportEndDate)}`;
      filename = `Indemnites_Kilometriques_du_${exportStartDate}_au_${exportEndDate}.pdf`;
    }

    if (periodTrips.length === 0) {
      if (exportMode === 'mensuel') {
        alert(`Aucun trajet enregistré pour la période : ${selectedMonth}/${selectedYear}`);
      } else {
        alert(`Aucun trajet enregistré pour la période sélectionnée.`);
      }
      return;
    }

    const docPdf = new jsPDF();
    const primaryColor = "#c29d38"; // Amber accent from Parat & Bouey branding

    // Header Title
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(22);
    docPdf.setTextColor(30, 30, 30);
    docPdf.text("SASU PARAT & BOUEY", 14, 20);
    
    docPdf.setFontSize(10);
    docPdf.setFont("helvetica", "normal");
    docPdf.setTextColor(100, 100, 100);
    docPdf.text("Plâtrerie - Cloisons - Isolation - Rénovation", 14, 25);
    docPdf.text("Adresse : Le Teich, Bassin d'Arcachon", 14, 29);

    // Document Meta
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(14);
    docPdf.setTextColor(30, 30, 30);
    docPdf.text(`ÉTAT DES INDEMNITÉS KILOMÉTRIQUES`, 120, 20);
    docPdf.setFontSize(10);
    docPdf.setFont("helvetica", "normal");
    docPdf.text(`Période : ${periodLabel}`, 120, 26);
    docPdf.text(`Date d'export : ${new Date().toLocaleDateString('fr-FR')}`, 120, 31);

    // Decorative Line
    docPdf.setDrawColor(194, 157, 56);
    docPdf.setLineWidth(1);
    docPdf.line(14, 36, 196, 36);

    // Vehicle Summary Card in PDF
    docPdf.setFillColor(248, 248, 246);
    docPdf.rect(14, 42, 182, 24, "F");
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(10);
    docPdf.setTextColor(50, 50, 50);
    docPdf.text("Véhicule utilisé :", 18, 48);
    docPdf.setFont("helvetica", "normal");
    docPdf.text(`${vehicleDesc}`, 50, 48);
    
    docPdf.setFont("helvetica", "bold");
    docPdf.text("Puissance Fiscale :", 18, 54);
    docPdf.setFont("helvetica", "normal");
    docPdf.text(`${vehiclePower}`, 50, 54);
    
    docPdf.setFont("helvetica", "bold");
    docPdf.text("Motorisation :", 18, 60);
    docPdf.setFont("helvetica", "normal");
    docPdf.text(`${vehicleType === 'electrique' ? 'Électrique (+20% bonus)' : 'Thermique / Hybride'}`, 50, 60);

    // Table Header
    const tableTop = 75;
    docPdf.setFillColor(30, 30, 30);
    docPdf.rect(14, tableTop, 182, 8, "F");
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(9);
    docPdf.setTextColor(255, 255, 255);
    docPdf.text("Date", 16, tableTop + 5);
    docPdf.text("Motif / Objet du déplacement", 38, tableTop + 5);
    docPdf.text("Départ", 100, tableTop + 5);
    docPdf.text("Arrivée", 132, tableTop + 5);
    docPdf.text("Km", 168, tableTop + 5);
    docPdf.text("Montant", 182, tableTop + 5);

    // Table Rows
    let y = tableTop + 8;
    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(8);
    docPdf.setTextColor(50, 50, 50);

    let totalKmPeriod = 0;
    let totalAllowancePeriod = 0;

    periodTrips.forEach((trip, index) => {
      // Split text into lines to support clean wrapping
      const purposeLines = docPdf.splitTextToSize(trip.purpose, 58) as string[];
      const departureLines = docPdf.splitTextToSize(trip.departure, 28) as string[];
      const arrivalLines = docPdf.splitTextToSize(trip.arrival, 32) as string[];
      
      const maxLines = Math.max(purposeLines.length, departureLines.length, arrivalLines.length, 1);
      const rowHeight = 4 + (maxLines * 4.5);

      // Check page overflow before drawing
      if (y + rowHeight > 275) {
        docPdf.addPage();
        y = 20;
        
        // Redraw Table Header on new page
        docPdf.setFillColor(30, 30, 30);
        docPdf.rect(14, y, 182, 8, "F");
        docPdf.setFont("helvetica", "bold");
        docPdf.setFontSize(9);
        docPdf.setTextColor(255, 255, 255);
        docPdf.text("Date", 16, y + 5);
        docPdf.text("Motif / Objet du déplacement", 38, y + 5);
        docPdf.text("Départ", 100, y + 5);
        docPdf.text("Arrivée", 132, y + 5);
        docPdf.text("Km", 168, y + 5);
        docPdf.text("Montant", 182, y + 5);
        
        y += 8;
        docPdf.setFont("helvetica", "normal");
        docPdf.setFontSize(8);
        docPdf.setTextColor(50, 50, 50);
      }

      // Zebra background strip with dynamic height
      if (index % 2 === 0) {
        docPdf.setFillColor(242, 242, 240);
        docPdf.rect(14, y, 182, rowHeight, "F");
      }
      
      const formattedDate = new Date(trip.date).toLocaleDateString('fr-FR');
      docPdf.text(formattedDate, 16, y + 5.5);
      
      // Draw wrapped multi-line text for Motif
      purposeLines.forEach((line, lineIdx) => {
        docPdf.text(line, 38, y + 5.5 + (lineIdx * 4.5));
      });
      
      // Draw wrapped multi-line text for Departure
      departureLines.forEach((line, lineIdx) => {
        docPdf.text(line, 100, y + 5.5 + (lineIdx * 4.5));
      });
      
      // Draw wrapped multi-line text for Arrival
      arrivalLines.forEach((line, lineIdx) => {
        docPdf.text(line, 132, y + 5.5 + (lineIdx * 4.5));
      });
      
      docPdf.text(`${trip.kilometers}`, 168, y + 5.5);
      
      // Calculate allowance for PDF using the annual progressive calculation proportionally
      const singleAllowance = trip.allowance || 0;
      docPdf.text(`${singleAllowance.toFixed(2)} €`, 182, y + 5.5);

      totalKmPeriod += trip.kilometers;
      totalAllowancePeriod += singleAllowance;
      
      y += rowHeight;
    });

    // Totals Box
    docPdf.setDrawColor(200, 200, 200);
    docPdf.setLineWidth(0.5);
    docPdf.line(14, y + 2, 196, y + 2);

    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(10);
    docPdf.setTextColor(30, 30, 30);
    docPdf.text("TOTAL DE LA PÉRIODE :", 100, y + 8);
    docPdf.text(`${totalKmPeriod} km`, 168, y + 8);
    docPdf.setTextColor(194, 157, 56);
    docPdf.text(`${totalAllowancePeriod.toFixed(2)} €`, 182, y + 8);

    // Note / Signature section
    const sigTop = y + 22;
    docPdf.setFont("helvetica", "italic");
    docPdf.setFontSize(8);
    docPdf.setTextColor(100, 100, 100);
    docPdf.text("Je certifie l'exactitude des déplacements professionnels mentionnés ci-dessus.", 14, sigTop);
    
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(9);
    docPdf.setTextColor(50, 50, 50);
    docPdf.text("Signature du Gérant / Bénéficiaire", 14, sigTop + 10);

    docPdf.setDrawColor(200, 200, 200);
    docPdf.rect(14, sigTop + 14, 70, 20);

    // Save
    docPdf.save(filename);
  };

  const currentYear = date.split('-')[0];
  const yearStats = getYearSummary(currentYear);
  const selectedPeriodTrips = exportMode === 'mensuel'
    ? trips.filter(t => t.date.startsWith(`${selectedYear}-${selectedMonth}`))
    : trips.filter(t => t.date >= exportStartDate && t.date <= exportEndDate);

  return (
    <div className="bg-[#111111]/90 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-md overflow-hidden" id="mileage-tracker-root">
      
      {/* Header section with cumulative analytics */}
      <div className="p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-amber-500/5 to-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300">
                <Car className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-xl font-serif tracking-wide text-[#d1d1c4] uppercase">
                Suivi des Indemnités Kilométriques
              </h2>
            </div>
            <p className="text-xs text-white/50">
              Notez vos trajets quotidiens et générez des rapports PDF conformes pour votre comptabilité.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                showSettings 
                  ? 'bg-amber-500 text-black border-amber-500' 
                  : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>{showSettings ? 'Fermer Config' : 'Configurer Véhicule'}</span>
            </button>
          </div>
        </div>

        {/* Live Tax Tracker (Barème Officiel Card) */}
        <div className="mt-4 grid grid-cols-1 xs:grid-cols-3 gap-3 bg-white/5 border border-white/5 rounded-2xl p-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Distance Annuelle ({currentYear})</span>
            <p className="text-lg font-bold text-white font-mono">{yearStats.totalKm} <span className="text-xs text-white/50 font-normal">km</span></p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Montant Déductible ({currentYear})</span>
            <p className="text-lg font-bold text-amber-400 font-mono">{yearStats.totalAllowance.toFixed(2)} €</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono flex items-center gap-1">
              Barème Impôts
              <Info className="w-3 h-3 text-white/30" title="Selon le barème légal progressif de l'administration" />
            </span>
            <p className="text-xs text-white/70 font-mono bg-white/5 px-2 py-1 rounded-lg border border-white/5 inline-block">
              {vehiclePower} : {yearStats.rateLabel}
            </p>
          </div>
        </div>
      </div>

      {/* 1. VEHICLE SETTINGS EXPANDER */}
      {showSettings && (
        <div className="p-4 sm:p-6 bg-amber-500/5 border-b border-white/10 space-y-4 animate-fade-in">
          <h3 className="text-xs uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Paramètres fiscaux du véhicule
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1.5 font-mono">Puissance Fiscale (CV)</label>
              <select
                value={vehiclePower}
                onChange={(e) => setVehiclePower(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-400 transition-all"
              >
                <option value="3 CV">3 CV</option>
                <option value="4 CV">4 CV</option>
                <option value="5 CV">5 CV</option>
                <option value="6 CV">6 CV</option>
                <option value="7 CV et +">7 CV et plus</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1.5 font-mono">Motorisation</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-400 transition-all"
              >
                <option value="thermique">Thermique / Hybride</option>
                <option value="electrique">Électrique (+20% bonus Impôts)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1.5 font-mono">Description du Véhicule / Plaque</label>
              <input
                type="text"
                value={vehicleDesc}
                onChange={(e) => setVehicleDesc(e.target.value)}
                placeholder="Ex: Peugeot 208 - AB-123-CD"
                className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-400 transition-all"
              />
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl text-[11px] text-white/50 leading-relaxed">
            💡 <strong>Règle fiscale SASU :</strong> Les remboursements forfaitaires de frais kilométriques sont totalement exonérés de cotisations sociales et d'impôt sur le revenu pour le gérant. Le barème progressif ci-dessus est automatiquement appliqué selon la puissance du véhicule et le cumul de kilomètres annuel.
          </div>
        </div>
      )}

      {/* Main Grid: Form + List */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
        
        {/* 2. RAPID ENTRY TRIP FORM (Left side) */}
        <div className="lg:col-span-2 p-4 sm:p-6 border-r border-white/10 space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-white/70 font-mono font-bold flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-amber-400" />
            Saisie rapide d'un trajet
          </h3>

          {feedback && (
            <div className={`p-3 rounded-xl border text-xs text-center ${
              feedback.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
            }`}>
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleAddTrip} className="space-y-4">
            {/* Date Picker */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1 font-mono">Date du trajet</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 transition-all"
                  required
                />
              </div>
              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={() => setDate(new Date().toISOString().split('T')[0])}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-xl text-[10px] text-center font-semibold active:scale-95 transition-all"
                >
                  Aujourd'hui
                </button>
              </div>
            </div>

            {/* Motif & Presets */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[9px] uppercase tracking-wider text-white/40 font-mono">Motif / Objet professionnel</label>
                <span className="text-[8px] text-white/30 font-mono">{purpose.length}/120</span>
              </div>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                maxLength={120}
                placeholder="Ex: Chantier Plâtrerie, Devis client..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 transition-all mb-2"
                required
              />
              <div className="flex flex-wrap gap-1.5">
                {PURPOSE_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPurpose(p)}
                    className="px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] text-white/60 hover:text-white hover:border-white/20 transition-all"
                  >
                    {p.replace("Chantier ", "").replace("Rendez-vous ", "")}
                  </button>
                ))}
              </div>
            </div>

            {/* Departure / Arrival & Presets */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1 font-mono">Lieu de Départ</label>
                <input
                  type="text"
                  value={departure}
                  onChange={(e) => {
                    setDeparture(e.target.value);
                    applyDistancePreset(e.target.value, arrival);
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1 font-mono">Lieu d'Arrivée</label>
                <input
                  type="text"
                  value={arrival}
                  onChange={(e) => {
                    setArrival(e.target.value);
                    applyDistancePreset(departure, e.target.value);
                  }}
                  placeholder="Ville"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 transition-all"
                  required
                />
              </div>
            </div>

            {/* Quick Location Presets for Destination */}
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-white/40 mb-1 font-mono">Raccourcis Destination</span>
              <div className="flex flex-wrap gap-1.5">
                {LOCATION_PRESETS.map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setArrival(loc);
                      applyDistancePreset(departure, loc);
                    }}
                    className="px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] text-white/60 hover:text-white hover:border-white/20 transition-all"
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Type de Trajet (Aller Simple / Aller-Retour) */}
            <div>
              <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1.5 font-mono">Type de Trajet</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 border border-white/10 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsRoundTrip(false)}
                  className={`py-1.5 text-[10px] uppercase tracking-wider font-semibold rounded-lg transition-all cursor-pointer ${
                    !isRoundTrip 
                      ? 'bg-white/10 text-white border border-white/10' 
                      : 'text-white/40 hover:text-white/70 border border-transparent'
                  }`}
                >
                  Aller Simple
                </button>
                <button
                  type="button"
                  onClick={() => setIsRoundTrip(true)}
                  className={`py-1.5 text-[10px] uppercase tracking-wider font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    isRoundTrip 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : 'text-white/40 hover:text-white/70 border border-transparent'
                  }`}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Aller-Retour (A/R)
                </button>
              </div>
            </div>

            {/* Distance (Km) & Estimate */}
            <div className="grid grid-cols-2 gap-3 items-start">
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1 font-mono">Distance (Aller)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={kilometers}
                    onChange={(e) => setKilometers(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-3 pr-8 py-2 text-xs text-white outline-none focus:border-amber-400 transition-all font-mono"
                    placeholder="km"
                    min="1"
                    required
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-white/40 font-mono">km</span>
                </div>
                {kilometers !== '' && (
                  <span className="block mt-1 text-[9px] text-amber-300 font-medium">
                    Total : {isRoundTrip ? Number(kilometers) * 2 : kilometers} km {isRoundTrip ? '(A/R)' : '(Aller simple)'}
                  </span>
                )}
              </div>

              <div className="p-2.5 bg-amber-500/5 rounded-xl border border-amber-500/10 text-center min-h-[52px] flex flex-col justify-center">
                <span className="block text-[8px] uppercase text-white/40 tracking-wider">Remboursement</span>
                <span className="text-xs font-bold text-amber-400 font-mono font-semibold">
                  {kilometers ? `${calculateSingleTripAllowance(Number(kilometers) * (isRoundTrip ? 2 : 1))} €` : '--'}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-amber-500 text-black font-semibold rounded-xl py-3 text-xs uppercase tracking-wider hover:bg-amber-400 transition-all active:scale-98 shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5 cursor-pointer mt-4"
            >
              <Plus className="w-4 h-4" />
              <span>Enregistrer le trajet</span>
            </button>
          </form>
        </div>

        {/* 3. REPORT EXPORT & TRIP LISTING (Right side) */}
        <div className="lg:col-span-3 p-4 sm:p-6 flex flex-col justify-between space-y-4">
          
          {/* Export tools */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs uppercase tracking-widest text-white/70 font-mono font-bold">
                  Export Comptable PDF
                </h3>
              </div>
              
              {/* Export Mode Toggle */}
              <div className="flex p-0.5 bg-black/40 border border-white/10 rounded-lg">
                <button
                  type="button"
                  onClick={() => setExportMode('mensuel')}
                  className={`px-2 py-1 text-[9px] uppercase tracking-wider font-semibold rounded-md transition-all cursor-pointer ${
                    exportMode === 'mensuel'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  Mensuel
                </button>
                <button
                  type="button"
                  onClick={() => setExportMode('personnalise')}
                  className={`px-2 py-1 text-[9px] uppercase tracking-wider font-semibold rounded-md transition-all cursor-pointer ${
                    exportMode === 'personnalise'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  Période
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-end gap-3">
              {exportMode === 'mensuel' ? (
                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto shrink-0">
                  <div>
                    <label className="block text-[8px] uppercase tracking-wider text-white/40 mb-1 font-mono">Mois</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 transition-all"
                    >
                      <option value="01">Janvier</option>
                      <option value="02">Février</option>
                      <option value="03">Mars</option>
                      <option value="04">Avril</option>
                      <option value="05">Mai</option>
                      <option value="06">Juin</option>
                      <option value="07">Juillet</option>
                      <option value="08">Août</option>
                      <option value="09">Septembre</option>
                      <option value="10">Octobre</option>
                      <option value="11">Novembre</option>
                      <option value="12">Décembre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase tracking-wider text-white/40 mb-1 font-mono">Année</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 transition-all"
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto shrink-0">
                  <div>
                    <label className="block text-[8px] uppercase tracking-wider text-white/40 mb-1 font-mono">Date Début</label>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-2 py-1.5 text-[11px] text-white outline-none focus:border-amber-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase tracking-wider text-white/40 mb-1 font-mono">Date Fin</label>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-2 py-1.5 text-[11px] text-white outline-none focus:border-amber-400 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="w-full sm:flex-1">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold rounded-xl py-2.5 text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Télécharger le PDF ({selectedPeriodTrips.length} trajets)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable list of recent trips */}
          <div className="space-y-3 flex-1 min-h-[250px] flex flex-col">
            <h4 className="text-xs font-semibold text-white/60 flex items-center justify-between pb-1 border-b border-white/5">
              <span>Récemment enregistrés</span>
              <span className="text-[10px] font-mono text-amber-400">Total : {trips.length} trajets</span>
            </h4>

            {loading ? (
              <div className="flex-1 flex items-center justify-center text-xs text-white/40">
                Chargement des trajets...
              </div>
            ) : trips.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-2xl">
                <AlertCircle className="w-8 h-8 text-white/20 mb-2" />
                <p className="text-xs text-white/40">Aucun trajet enregistré pour l'instant.</p>
                <p className="text-[10px] text-white/30 mt-1 max-w-xs">Commencez par ajouter votre premier déplacement professionnel ci-contre.</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[320px] pr-1 flex-1">
                {trips.slice(0, 15).map((trip) => {
                  const formattedDate = new Date(trip.date).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'short'
                  });
                  return (
                    <div 
                      key={trip.id}
                      className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        {/* Compact Date Box */}
                        <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-center font-mono shrink-0 font-bold tracking-tight text-[10px]">
                          {formattedDate}
                        </div>

                        {/* Trip Info */}
                        <div className="min-w-0">
                          <h5 className="font-semibold text-white truncate text-xs">{trip.purpose}</h5>
                          <p className="text-[10px] text-white/40 flex items-center gap-1 truncate mt-0.5">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            <span>{trip.departure}</span>
                            <ChevronRight className="w-2 h-2 shrink-0" />
                            <span>{trip.arrival}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right Section: Km / Value / Delete */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="block font-bold text-white font-mono text-[11px]">{trip.kilometers} km</span>
                          <span className="block text-[10px] text-amber-400 font-mono font-semibold">+{trip.allowance?.toFixed(2) || '0.00'} €</span>
                        </div>
                        {deleteConfirmId === trip.id ? (
                          <div className="flex items-center gap-1 shrink-0 animate-fade-in">
                            <button
                              onClick={() => handleDeleteTrip(trip.id)}
                              className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[9px] transition-all cursor-pointer"
                              title="Confirmer la suppression"
                            >
                              OUI
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/70 font-semibold text-[9px] transition-all cursor-pointer"
                              title="Annuler"
                            >
                              NON
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(trip.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/25 transition-all cursor-pointer shrink-0"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
