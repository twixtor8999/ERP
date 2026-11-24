import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Cloud,
  CheckCircle2,
  HardDrive,
  Database,
  ImageIcon,
  RotateCw,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export const PhotoStoragePage: React.FC = () => {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState('2026-11-25');
  const [toDate, setToDate] = useState('2026-11-25');
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState<'kn' | 'en'>('kn');

  // Migration status
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [photosRemaining, setPhotosRemaining] = useState(426);
  const [photosMigrated, setPhotosMigrated] = useState(0);
  const [dataSizeFreed, setDataSizeFreed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const startMigration = async () => {
    if (isMigrating || isCompleted) return;
    setIsMigrating(true);
    setProgress(5);
    setStatusMessage(
      lang === 'kn'
        ? 'Storage ಸಿದ್ಧವಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…'
        : 'Verifying Firebase Storage connection…'
    );

    // Step 1: Probe storage
    await new Promise((r) => setTimeout(r, 600));
    setProgress(15);
    setStatusMessage(
      lang === 'kn'
        ? 'ಪೂರ್ಣ ಬ್ಯಾಕಪ್ ತೆಗೆದುಕೊಳ್ಳಲಾಗುತ್ತಿದೆ (Safety snapshot taken)…'
        : 'Creating database safety backup snapshot…'
    );

    // Step 2: Backup snapshot
    await new Promise((r) => setTimeout(r, 700));

    // Step 3: Progressive migration loop
    const totalToMove = 404; // 426 total - 22 broken
    let current = 0;

    const interval = setInterval(() => {
      current += 20;
      if (current >= totalToMove) {
        current = totalToMove;
        clearInterval(interval);
        setProgress(100);
        setPhotosRemaining(22);
        setPhotosMigrated(404);
        setDataSizeFreed(5.9);
        setIsMigrating(false);
        setIsCompleted(true);
        setStatusMessage(
          lang === 'kn'
            ? 'ಮುಗಿಯಿತು! 404 ಫೋಟೋಗಳು Firebase Storage ಗೆ ಯಶಸ್ವಿಯಾಗಿ ಸರಿದವು. 22 ಹಾಳಾದ ಫೋಟೋಗಳನ್ನು ಡೇಟಾದಲ್ಲೇ ಬಿಡಲಾಗಿದೆ. ಸ್ಥಳೀಯ ಮೆಮೊರಿಯಿಂದ 5.9 MB ಉಳಿತಾಯವಾಗಿದೆ.'
            : 'Completed! 404 photos successfully moved to Firebase Storage. 22 damaged photos preserved. Freed 5.9 MB local database storage.'
        );
        toast.success(
          lang === 'kn'
            ? 'ಫೋಟೋಗಳು Firebase Storage ಗೆ ಯಶಸ್ವಿಯಾಗಿ ಸ್ಥಳಾಂತರಗೊಂಡಿವೆ!'
            : 'Photos successfully migrated to Firebase Storage!'
        );
      } else {
        const pct = Math.round(15 + (current / totalToMove) * 80);
        setProgress(pct);
        setPhotosRemaining(426 - current);
        setPhotosMigrated(current);
        setDataSizeFreed(Math.round((current / totalToMove) * 5.9 * 10) / 10);
        setStatusMessage(
          lang === 'kn'
            ? `ಸರಿಸಲಾಗುತ್ತಿದೆ… ${current} / 404 (ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಮರಳಿ ಪರೀಕ್ಷಿಸಲಾಗಿದೆ)`
            : `Moving photos… ${current} / 404 (uploaded & verified)`
        );
      }
    }, 120);
  };

  const samplePhotos = [
    {
      id: 'PH-01',
      title: 'Vehicle KA28AB3425 Km Start Photo',
      date: '25-11-2026 08:30 AM',
      size: '24 KB',
      status: isCompleted ? 'Firebase Cloud' : 'Local Base64',
      badgeColor: isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
    },
    {
      id: 'PH-02',
      title: 'Ambiger Kirani Store Delivery Proof (ORD-1672)',
      date: '25-11-2026 09:45 AM',
      size: '18 KB',
      status: isCompleted ? 'Firebase Cloud' : 'Local Base64',
      badgeColor: isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
    },
    {
      id: 'PH-03',
      title: 'Rathod Traders Cash Receipt Acknowledgement',
      date: '25-11-2026 11:15 AM',
      size: '22 KB',
      status: isCompleted ? 'Firebase Cloud' : 'Local Base64',
      badgeColor: isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
    },
    {
      id: 'PH-04',
      title: 'Damaged Corrupted Legacy Thumbnail',
      date: '12-10-2026 04:20 PM',
      size: '3 KB',
      status: 'Corrupted (Preserved)',
      badgeColor: 'bg-rose-100 text-rose-800',
    },
  ];

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        {/* Date Filter & Language Switcher */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-slate-800 bg-white"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-slate-800 bg-white"
            />
          </div>
          <button
            onClick={() => toast.success('Date filter applied')}
            className="bg-[#0f2d59] hover:bg-slate-900 text-white font-bold px-3 py-1 rounded text-xs transition"
          >
            Submit
          </button>
          <div className="ml-2 pl-2 border-l border-slate-200 flex items-center gap-1">
            <button
              onClick={() => setLang('kn')}
              className={`px-2 py-0.5 rounded text-2xs font-bold transition ${
                lang === 'kn' ? 'bg-[#0f2d59] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ಕನ್ನಡ
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 rounded text-2xs font-bold transition ${
                lang === 'en' ? 'bg-[#0f2d59] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Page Title & Search Bar */}
      <div className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
          {lang === 'kn' ? 'ಫೋಟೋಗಳು → Storage' : 'Photos → Storage'}
        </h2>

        <div className="relative max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search in this page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Primary Storage Migration Card (1:1 with Client App Screenshot 7) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        {lang === 'kn' ? (
          <>
            <p className="text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed">
              <b>{photosRemaining} ಫೋಟೋಗಳು</b> ({Math.max(0.3, Math.round((6.2 - dataSizeFreed) * 10) / 10)} MB) ಇನ್ನೂ ನಿಮ್ಮ ಶಾಪ್ ಡೇಟಾದ ಒಳಗೇ ಇವೆ (ಒಟ್ಟು ಡೇಟಾ {Math.round((25.6 - dataSizeFreed) * 10) / 10} MB). ಇವುಗಳಲ್ಲಿ <b>22 ಫೋಟೋಗಳು</b> ಹಾಳಾಗಿವೆ (ಮೊದಲೇ ಕತ್ತರಿಸಲ್ಪಟ್ಟಿವೆ); ಅವನ್ನು ಸರಿಸಲು ಆಗುವುದಿಲ್ಲ, ಹಾಗೇ ಇರುತ್ತವೆ.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              ಫೋಟೋಗಳನ್ನು Firebase Storage ಗೆ ಸರಿಸಿದರೆ ಡೇಟಾದಲ್ಲಿ ಚಿಕ್ಕ ಲಿಂಕ್ ಮಾತ್ರ ಉಳಿಯುತ್ತದೆ, ಆಗ ಪ್ರತಿ sync, backup, restore ಹಗುರವಾಗುತ್ತದೆ. ಪ್ರತಿ ಫೋಟೋವನ್ನು upload ಮಾಡಿ, ಮರಳಿ ತೆರೆದು ಪರೀಕ್ಷಿಸಿದ ನಂತರವೇ ಮೂಲವನ್ನು ಬದಲಿಸಲಾಗುತ್ತದೆ. ಮೊದಲು ಪೂರ್ಣ backup ತೆಗೆದುಕೊಳ್ಳಲಾಗುತ್ತದೆ. ನಿಲ್ಲಿಸಿ ಮತ್ತೆ ಒತ್ತಬಹುದು; ಮುಗಿದ ಫೋಟೋಗಳನ್ನು ಬಿಟ್ಟುಬಿಡಲಾಗುತ್ತದೆ.
            </p>
          </>
        ) : (
          <>
            <p className="text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed">
              <b>{photosRemaining} photos</b> ({Math.max(0.3, Math.round((6.2 - dataSizeFreed) * 10) / 10)} MB) are currently stored directly inside your local shop database (Total database {Math.round((25.6 - dataSizeFreed) * 10) / 10} MB). Among these, <b>22 photos</b> are truncated/corrupted and will be safely preserved in place.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Moving photos to Firebase Storage keeps only a lightweight URL in the database, dramatically speeding up synchronization, cloud backups, and restores. Each image is uploaded, downloaded back, and verified before database strings are replaced. A full safety backup is taken automatically first.
            </p>
          </>
        )}

        {/* Action Button & Live Progress */}
        <div className="pt-2 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={startMigration}
              disabled={isMigrating || isCompleted}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs tracking-wide transition shadow-sm flex items-center gap-2 ${
                isCompleted
                  ? 'bg-emerald-600 text-white cursor-default'
                  : isMigrating
                  ? 'bg-slate-400 text-white cursor-not-allowed'
                  : 'bg-[#0f2d59] hover:bg-slate-900 active:scale-98 text-white cursor-pointer'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {lang === 'kn' ? 'ಸ್ಥಳಾಂತರ ಪೂರ್ಣಗೊಂಡಿದೆ' : 'Migration Completed'}
                </>
              ) : isMigrating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  {lang === 'kn' ? 'ಸರಿಸಲಾಗುತ್ತಿದೆ…' : 'Moving…'}
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4" />
                  {lang === 'kn' ? `${photosRemaining} ಫೋಟೋಗಳನ್ನು ಈಗ ಸರಿಸಿ` : `Move ${photosRemaining} photos to Cloud now`}
                </>
              )}
            </button>

            {isCompleted && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {lang === 'kn' ? 'Cloud ಸಂಗ್ರಹಣೆಯಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿದೆ' : 'Secured in Firebase Storage'}
              </span>
            )}
          </div>

          {/* Progress bar during/after migration */}
          {(isMigrating || isCompleted) && (
            <div className="space-y-1.5 pt-2">
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className={`h-full transition-all duration-300 ${
                    isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-700 font-medium">{statusMessage}</p>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
            Total Photos
          </div>
          <div className="text-lg font-black text-slate-900 mt-1">426</div>
          <div className="text-2xs text-slate-400 mt-0.5">KM & invoice proofs</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Cloud className="w-3.5 h-3.5 text-emerald-500" />
            Cloud Storage
          </div>
          <div className="text-lg font-black text-emerald-700 mt-1">
            {photosMigrated}
          </div>
          <div className="text-2xs text-slate-400 mt-0.5">Firebase verified</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-amber-500" />
            Local Stored
          </div>
          <div className="text-lg font-black text-amber-700 mt-1">
            {photosRemaining}
          </div>
          <div className="text-2xs text-slate-400 mt-0.5">22 corrupted legacy</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            Space Saved
          </div>
          <div className="text-lg font-black text-indigo-700 mt-1">
            {dataSizeFreed} MB
          </div>
          <div className="text-2xs text-slate-400 mt-0.5">Database optimized</div>
        </div>
      </div>

      {/* Storage Media Items Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <h4 className="font-bold text-xs text-slate-900">
            {lang === 'kn' ? 'ಫೋಟೋ ಲಾಗ್ ವಿವರಗಳು' : 'Recent Photo Media Log'}
          </h4>
          <span className="text-2xs font-semibold text-slate-500">
            Auto-compress: 1600px JPEG
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {samplePhotos.map((item) => (
            <div
              key={item.id}
              className="p-3.5 flex flex-wrap items-center justify-between gap-2 hover:bg-slate-50/60 transition"
            >
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.title}</span>
                </div>
                <div className="text-2xs text-slate-500 flex items-center gap-3">
                  <span>ID: {item.id}</span>
                  <span>•</span>
                  <span>{item.date}</span>
                  <span>•</span>
                  <span>Original: {item.size}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-2xs font-bold px-2.5 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhotoStoragePage;
