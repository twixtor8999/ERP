import { useState, useMemo } from 'react';
import { ArrowLeft, Search, Check, Copy } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { getInvoiceTemplateConfig } from '@/features/orders/utils/invoiceTemplateConfig';
import { PlanUpgradeCheckoutPage } from './PlanUpgradeCheckoutPage';

export interface PlanDef {
  name: string;
  price: number;
  period: string;
  badge?: string;
  users: string;
  features: string[];
  artColor: string;
  bgGrad: string;
  isPopular?: boolean;
}

export const PLANS: PlanDef[] = [
  {
    name: 'FREE',
    price: 0,
    period: '5-day trial',
    users: '1 user',
    features: ['Place Order', 'Orders', 'Real-time Inventory'],
    artColor: 'from-emerald-300 to-green-600',
    bgGrad: 'bg-emerald-50/50 border-emerald-100',
  },
  {
    name: 'PRO',
    price: 500,
    period: '/ month',
    users: '2 users',
    features: [
      'Place Order',
      'Settlement',
      'Vehicle',
      'Inventory',
      'GST & Reports',
      'Role Management',
    ],
    artColor: 'from-blue-300 to-blue-600',
    bgGrad: 'bg-blue-50/50 border-blue-100',
  },
  {
    name: 'GOLD',
    price: 1000,
    period: '/ month',
    isPopular: true,
    badge: 'Most popular',
    users: '10 users',
    features: [
      'Place Order',
      'Settlement',
      'Vehicle',
      'Inventory',
      'GST & Reports',
      'Role Management',
    ],
    artColor: 'from-amber-200 via-amber-400 to-amber-700',
    bgGrad: 'bg-amber-50/50 border-amber-200',
  },
  {
    name: 'DIAMOND',
    price: 2000,
    period: '/ month',
    users: 'Unlimited users',
    features: [
      'Place Order',
      'Settlement',
      'Vehicle',
      'Inventory',
      'GST & Reports',
      'Role Management',
    ],
    artColor: 'from-cyan-300 via-indigo-400 to-fuchsia-600',
    bgGrad: 'bg-purple-50/50 border-purple-100',
  },
];

const FEATURES_LIST = [
  {
    icon: '🧾',
    title: 'GST billing & invoices',
    desc: 'Place order → pack → invoice → dispatch → delivery, with GST and returns in one flow.',
  },
  {
    icon: '🗺️',
    title: 'Routes & beat days',
    desc: 'Customers grouped by route and beat day; CRMs see and order only for their own routes.',
  },
  {
    icon: '📞',
    title: 'CRM callings',
    desc: 'Daily calling list with one-tap order placing for every customer.',
  },
  {
    icon: '🛒',
    title: 'B2B customer ordering',
    desc: 'Customers log in with their mobile, shop in a quick-commerce style screen and order in their own name.',
  },
  {
    icon: '📦',
    title: 'Stock, purchase & inventory',
    desc: 'Purchase list, SKU margins, real-time stock and auto purchase orders.',
  },
  {
    icon: '🚚',
    title: 'Vehicle trips & settlement',
    desc: 'Trip start/close with km photos, cash/bank/QR settlement and balances.',
  },
  {
    icon: '👥',
    title: 'Roles & strict access',
    desc: 'Owner, Admin, Billing, Sale TL, CRM, Driver, Packers, CA – each sees only what is ticked for them.',
  },
  {
    icon: '📊',
    title: 'Reports & AI checks',
    desc: 'Route-wise sales, GST returns, expenses, aging and AI cross-checks.',
  },
];

export function SubscriptionPlansPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // If URL indicates upgrade checkout view, render dedicated page
  if (
    searchParams.get('tab') === 'upgrade' ||
    searchParams.get('action') === 'buy' ||
    searchParams.get('checkout') === 'true'
  ) {
    return <PlanUpgradeCheckoutPage />;
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [activationCode, setActivationCode] = useState('');

  const { user } = useAuthStore();
  const invoiceConfig = getInvoiceTemplateConfig();
  const orgName = (user?.organizationName || invoiceConfig.companyName || 'STORE')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 14);
  const orgPhone = (user?.phone || invoiceConfig.phone || '9739396236')
    .replace(/\D/g, '')
    .slice(-10);
  const accountId = `${orgName}-${orgPhone}`;

  const handleActivate = () => {
    if (!activationCode.trim()) {
      toast.error('Please enter an activation code');
      return;
    }
    if (activationCode.trim().toUpperCase().startsWith('PK')) {
      toast.success('Activation code applied successfully! Full access unlocked.');
      setActivationCode('');
    } else {
      toast.error('Invalid activation code format. Codes start with PK...');
    }
  };

  const copyAccountId = () => {
    navigator.clipboard.writeText(accountId);
    toast.success('Account ID copied to clipboard');
  };

  const filteredFeatures = useMemo(() => {
    if (!searchQuery.trim()) return FEATURES_LIST;
    const q = searchQuery.toLowerCase();
    return FEATURES_LIST.filter(
      (f) =>
        f.title.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded flex items-center gap-1.5 font-bold text-xs transition shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>

      {/* Green Banner Card: Existing account (Matching Screenshot 1) */}
      <div className="bg-[#15803d] text-white p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Existing account</h2>
          <p className="text-emerald-100 text-xs mt-1 font-medium">
            Full access. No subscription needed.
          </p>
        </div>

        {/* Search Bar inside green banner */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search in this page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-transparent rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>
      </div>

      {/* Choose your plan Section */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Choose your plan
        </h3>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl border ${
                plan.isPopular
                  ? 'border-amber-400 shadow-md ring-1 ring-amber-300'
                  : 'border-slate-200 shadow-2xs'
              } overflow-hidden flex flex-col justify-between transition-all hover:shadow-md`}
            >
              {/* Most Popular Badge */}
              {plan.badge && (
                <div className="absolute top-0 right-0">
                  <span className="bg-[#f59e0b] text-slate-950 text-2xs font-extrabold px-3 py-1 rounded-bl-xl shadow-2xs">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Card Header with Graphic Art */}
              <div>
                <div
                  className={`p-6 text-center border-b border-slate-100 ${
                    plan.name === 'FREE'
                      ? 'bg-gradient-to-b from-emerald-100/70 to-emerald-50/20'
                      : plan.name === 'PRO'
                      ? 'bg-gradient-to-b from-blue-100/70 to-blue-50/20'
                      : plan.name === 'GOLD'
                      ? 'bg-gradient-to-b from-amber-100/80 to-amber-50/20'
                      : 'bg-gradient-to-b from-purple-100/70 to-purple-50/20'
                  }`}
                >
                  {/* SVG Art */}
                  <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center">
                    {plan.name === 'FREE' && (
                      <svg viewBox="0 0 64 64" className="w-full h-full">
                        <defs>
                          <linearGradient id="gf" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor="#86efac" />
                            <stop offset="1" stopColor="#16a34a" />
                          </linearGradient>
                        </defs>
                        <rect x="10" y="28" width="44" height="28" rx="5" fill="url(#gf)" />
                        <rect x="6" y="20" width="52" height="12" rx="4" fill="#bbf7d0" />
                        <rect x="29" y="20" width="6" height="36" fill="#fde047" />
                        <path
                          d="M32 20c-8-12-20-6-14 0 4 4 14 2 14 0zM32 20c8-12 20-6 14 0-4 4-14 2-14 0z"
                          fill="#fde047"
                          stroke="#ca8a04"
                          strokeWidth="1.5"
                        />
                      </svg>
                    )}
                    {plan.name === 'PRO' && (
                      <svg viewBox="0 0 64 64" className="w-full h-full">
                        <defs>
                          <linearGradient id="gp" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor="#93c5fd" />
                            <stop offset="1" stopColor="#2563eb" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M32 4l22 8v18c0 14-9 25-22 30C19 55 10 44 10 30V12z"
                          fill="url(#gp)"
                        />
                        <path
                          d="M32 16l4.6 9.6 10.4 1.4-7.6 7.3 1.9 10.4L32 39.7 22.7 44.7l1.9-10.4L17 27l10.4-1.4z"
                          fill="#fff"
                        />
                      </svg>
                    )}
                    {plan.name === 'GOLD' && (
                      <svg viewBox="0 0 64 64" className="w-full h-full">
                        <defs>
                          <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor="#fde68a" />
                            <stop offset="0.5" stopColor="#fbbf24" />
                            <stop offset="1" stopColor="#b45309" />
                          </linearGradient>
                        </defs>
                        <path d="M20 4h10l4 16H24zM44 4H34l-4 16h10z" fill="#ef4444" />
                        <circle cx="32" cy="40" r="19" fill="url(#gg)" stroke="#92400e" strokeWidth="2" />
                        <circle cx="32" cy="40" r="13" fill="none" stroke="#fff7d6" strokeWidth="2" />
                        <path
                          d="M32 30l3 6.2 6.8.9-5 4.7 1.3 6.7L32 45l-6.1 3.5 1.3-6.7-5-4.7 6.8-.9z"
                          fill="#fff7d6"
                        />
                      </svg>
                    )}
                    {plan.name === 'DIAMOND' && (
                      <svg viewBox="0 0 64 64" className="w-full h-full">
                        <defs>
                          <linearGradient id="gd" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor="#a5f3fc" />
                            <stop offset="0.5" stopColor="#818cf8" />
                            <stop offset="1" stopColor="#c026d3" />
                          </linearGradient>
                        </defs>
                        <path d="M16 8h32l12 16-28 34L4 24z" fill="url(#gd)" />
                        <path
                          d="M4 24h56M22 24l10 34 10-34M16 8l6 16 10-16 10 16 6-16"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="2"
                          strokeLinejoin="round"
                          opacity="0.85"
                        />
                      </svg>
                    )}
                  </div>

                  <h4 className="font-extrabold text-sm tracking-wider text-slate-800 uppercase">
                    {plan.name}
                  </h4>
                </div>

                {/* Price */}
                <div className="p-4 text-center border-b border-slate-100 bg-slate-50/50">
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                  </div>
                  <div className="text-2xs text-slate-500 font-medium mt-0.5">
                    {plan.period}
                  </div>
                </div>

                {/* Feature Bullets */}
                <div className="p-4 space-y-2 text-xs text-slate-600">
                  <div className="font-bold text-slate-800 pb-1 border-b border-slate-100 flex items-center justify-between">
                    <span>Staff Access</span>
                    <span className="text-blue-600 font-semibold">{plan.users}</span>
                  </div>
                  <ul className="space-y-1.5 pt-1">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-2xs text-slate-600">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="p-4 pt-0">
                {plan.name === 'FREE' ? (
                  <button
                    disabled
                    className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  >
                    Trial only
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      navigate(`/plans-billing/upgrade?plan=${encodeURIComponent(plan.name)}`)
                    }
                    className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-[#0f2d59] hover:bg-slate-900 text-white transition shadow-2xs cursor-pointer active:scale-95"
                  >
                    Buy · ₹{plan.price}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Everything in Ai Smart Bazar Comparison Grid */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Everything in Ai Smart Bazar
          </h3>
          <p className="text-xs text-slate-500">
            Features built specifically for FMCG wholesale distribution
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredFeatures.map((feat, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-blue-200 transition"
            >
              <div className="text-2xl">{feat.icon}</div>
              <h4 className="text-xs font-bold text-slate-900">{feat.title}</h4>
              <p className="text-2xs text-slate-500 leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How to Upgrade Steps */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">How to upgrade</h3>
        <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600">
          <li>
            Tap <b className="text-slate-800">Buy</b> on a plan and pay by UPI.
          </li>
          <li>
            Send the payment screenshot and your <b className="text-slate-800">Account ID</b> to us on WhatsApp.
          </li>
          <li>
            You get an <b className="text-slate-800">activation code</b>. Paste it below and tap Activate. Your access opens immediately.
          </li>
        </ol>
      </div>

      {/* Activation Code Box & Account ID */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="text-xs">
            <span className="text-slate-500">Account ID:</span>{' '}
            <span className="font-mono font-bold text-slate-900 ml-1">
              {accountId}
            </span>
          </div>
          <button
            onClick={copyAccountId}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-2xs font-bold rounded flex items-center gap-1 transition"
          >
            <Copy className="w-3 h-3" /> Copy
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Have an activation code?
          </label>
          <textarea
            rows={3}
            placeholder="PK1...."
            value={activationCode}
            onChange={(e) => setActivationCode(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <button
            onClick={handleActivate}
            className="bg-[#0f2d59] hover:bg-slate-900 text-white px-5 py-2 rounded-lg text-xs font-bold transition shadow-2xs"
          >
            Activate
          </button>
        </div>
      </div>

      {/* Footer Tagline */}
      <div className="text-center text-2xs text-slate-400">
        Ai Smart Bazar · Made for Karnataka FMCG distributors · Kannada / English
      </div>
    </div>
  );
}
