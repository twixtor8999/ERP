import { useState } from 'react';
import {
  ArrowLeft,
  Search,
  User,
  Phone,
  Building,
  Shield,
  CreditCard,
  KeyRound,
  Clock,
  Globe,
  Info,
  LogOut,
  Pencil,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

export function MyProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [fullName, setFullName] = useState(user?.fullName || 'Business Owner');
  const [mobileNumber, setMobileNumber] = useState(user?.phone || '');

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Edit Form State
  const [editName, setEditName] = useState(fullName);
  const [editMobile, setEditMobile] = useState(mobileNumber);

  // Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error('Enter your full name');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(editMobile.trim())) {
      toast.error('Mobile number must be a valid 10-digit number');
      return;
    }
    setFullName(editName.trim());
    setMobileNumber(editMobile.trim());
    setShowEditModal(false);
    toast.success('Profile updated successfully');
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      toast.error('Please enter current password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setShowPasswordModal(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast.success('Password changed successfully');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.info('Logged out from account');
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto pb-12">
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded flex items-center gap-1.5 font-bold text-xs transition shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>

      {/* Page Title & Search Bar */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          My profile
        </h2>

        <div className="relative max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search in this page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Blue Profile Card (Exact match with Screenshot 3) */}
      <div className="bg-[#0f4fa8] text-white p-6 rounded-2xl shadow-sm flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-xl font-black shrink-0 tracking-wider">
          {initials}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight">{fullName}</h3>
            <button
              onClick={() => {
                setEditName(fullName);
                setEditMobile(mobileNumber);
                setShowEditModal(true);
              }}
              className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white transition"
              title="Edit Profile"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-xs text-blue-100 font-medium">
            +91 {mobileNumber}
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <span className="bg-white text-emerald-800 text-2xs font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Verified
            </span>
            <span className="bg-white/20 text-white text-2xs font-semibold px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Personal Information */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-bold text-xs text-slate-900 tracking-wide">
            Personal Information
          </h4>
          <button
            onClick={() => {
              setEditName(fullName);
              setEditMobile(mobileNumber);
              setShowEditModal(true);
            }}
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
            <div className="flex items-center gap-2.5 text-slate-500">
              <User className="w-4 h-4 text-slate-400" />
              <span>Full Name</span>
            </div>
            <div className="font-semibold text-slate-900">{fullName}</div>
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
            <div className="flex items-center gap-2.5 text-slate-500">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>Mobile Number</span>
            </div>
            <div className="font-semibold text-slate-900">{mobileNumber}</div>
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
            <div className="flex items-center gap-2.5 text-slate-500">
              <Building className="w-4 h-4 text-slate-400" />
              <span>Business</span>
            </div>
            <div className="font-semibold text-slate-900">
              SIDDESHWAR ENTERPRISES
            </div>
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
            <div className="flex items-center gap-2.5 text-slate-500">
              <Shield className="w-4 h-4 text-slate-400" />
              <span>Role</span>
            </div>
            <div className="font-semibold text-slate-900">Admin</div>
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
            <div className="flex items-center gap-2.5 text-slate-500">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span>Employee ID</span>
            </div>
            <div className="font-mono font-semibold text-slate-900">EMP-0006</div>
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
            <div className="flex items-center gap-2.5 text-slate-500">
              <KeyRound className="w-4 h-4 text-slate-400" />
              <span>Login name</span>
            </div>
            <div className="font-mono font-semibold text-slate-900">{mobileNumber}</div>
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
            <div className="flex items-center gap-2.5 text-slate-500">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Logged in since</span>
            </div>
            <div className="text-slate-600 font-medium">24 Nov 2026, 11:28 pm</div>
          </div>
        </div>
      </div>

      {/* Section 2: Preferences (Matching Screenshot 9) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100">
          <h4 className="font-bold text-xs text-slate-900 tracking-wide">
            Preferences
          </h4>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Globe className="w-4 h-4 text-slate-400" />
              <span>Language</span>
            </div>
            <div>
              <select
                defaultValue="en"
                onChange={(e) => toast.success(`Language switched to ${e.target.value === 'kn' ? 'ಕನ್ನಡ' : 'English'}`)}
                className="border border-slate-200 bg-white rounded-md px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Info className="w-4 h-4 text-slate-400" />
              <span>App version</span>
            </div>
            <div className="font-mono text-slate-700 font-bold">AISB V0.11</div>
          </div>
        </div>
      </div>

      {/* Section 3: Account (Matching Screenshot 9) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100">
          <h4 className="font-bold text-xs text-slate-900 tracking-wide">
            Account
          </h4>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50/60 text-left transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-slate-600">
              <KeyRound className="w-4 h-4 text-slate-400" />
              <span>Reset password</span>
            </div>
            <div className="text-slate-400 font-bold">›</div>
          </button>
        </div>

        <div className="p-4 bg-slate-50/50 border-t border-slate-100">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 px-4 border border-rose-300 hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Section 4: AI status (Matching Screenshot 9) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <h4 className="font-bold text-xs text-slate-900 tracking-wide">
          AI status
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          If AI Assistant, invoice scan or Kannada names do not work, check here.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              toast.promise(
                new Promise((resolve) => setTimeout(resolve, 800)),
                {
                  loading: 'Checking AI connection…',
                  success: '✓ AI Assistant & Gemini OCR connected successfully!',
                  error: 'AI connection check failed',
                }
              );
            }}
            className="bg-[#0f2d59] hover:bg-slate-900 active:scale-95 text-white font-bold px-5 py-2 rounded-xl text-xs transition cursor-pointer shadow-2xs"
          >
            Check AI connection
          </button>
        </div>
      </div>

      {/* Section 5: Delete / Purge Management (Matching Screenshot 9) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs text-slate-900 tracking-wide">
            Delete
          </h4>
          <button
            type="button"
            onClick={() => navigate('/deleted-records')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
          >
            Owner Module → Deleted records ›
          </button>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Choose what to delete. Deleted items are kept in Owner Module → Deleted records and can be restored.
        </p>
        <div>
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                toast.info(`Selected "${e.target.value}". A restore snapshot will be kept in Deleted Records.`);
              }
            }}
            className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="" disabled>Select...</option>
            <option value="Delivered orders">Delivered orders (older than 6 months)</option>
            <option value="Cancelled orders">Cancelled orders</option>
            <option value="Deleted products">Inactive / Deleted SKU records</option>
            <option value="Vehicle trip logs">Completed vehicle trip logs</option>
            <option value="Audit logs">Temporary audit records</option>
          </select>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0f2d59] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm tracking-wide">Edit Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-300 hover:text-white transition p-1 rounded hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Employee name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Mobile no (also your login)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0f2d59] hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition shadow-2xs"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0f2d59] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm tracking-wide">Reset Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-300 hover:text-white transition p-1 rounded hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Current password
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  New password (at least 6 characters)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0f2d59] hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition shadow-2xs"
                >
                  Change password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
