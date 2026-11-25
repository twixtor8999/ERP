import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, MessageCircle, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { PLANS, PlanDef } from './SubscriptionPlansPage';

export function PlanUpgradeCheckoutPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const planParam = searchParams.get('plan') || 'PRO';

  const [activationCode, setActivationCode] = useState('');
  const accountId = 'SIDDESHWAR-9739396236';
  const upiId = '9739396236@ybl';

  // Find selected plan or fallback to PRO
  const currentPlan: PlanDef = useMemo(() => {
    const found = PLANS.find(
      (p) => p.name.toUpperCase() === planParam.toUpperCase() && p.price > 0
    );
    return found || PLANS[1]!; // default to PRO
  }, [planParam]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationCode.trim()) {
      toast.error('Please enter your activation code');
      return;
    }
    if (activationCode.trim().toUpperCase().startsWith('PK')) {
      try {
        localStorage.setItem(
          'pk_subscription_plan',
          JSON.stringify({
            name: currentPlan.name,
            price: currentPlan.price,
            activatedAt: new Date().toISOString(),
          })
        );
      } catch {}
      toast.success(
        `Congratulations! ${currentPlan.name} Plan activated successfully. Full access unlocked.`
      );
      setActivationCode('');
      setTimeout(() => {
        navigate('/plans-billing');
      }, 1200);
    } else {
      toast.error('Invalid activation code format. Codes start with PK...');
    }
  };

  const whatsAppUrl = `https://wa.me/919739396236?text=${encodeURIComponent(
    `Hi, I want to upgrade to ${currentPlan.name} Plan (₹${currentPlan.price}) for Account ID: ${accountId}`
  )}`;

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-16 text-slate-800">
      {/* Top action row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <button
          onClick={() => navigate('/plans-billing')}
          className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition shadow-2xs cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Plans & Billing
        </button>

        <div className="flex items-center gap-1.5">
          <span className="text-2xs text-slate-500 font-medium">Switch Plan:</span>
          {PLANS.filter((p) => p.price > 0).map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setSearchParams({ plan: p.name })}
              className={`px-2.5 py-1 rounded text-2xs font-black transition cursor-pointer ${
                currentPlan.name === p.name
                  ? 'bg-[#0f2d59] text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {p.name} · ₹{p.price}
            </button>
          ))}
        </div>
      </div>

      {/* Breadcrumb & Heading */}
      <div className="text-xs text-slate-500 font-medium">
        <span className="text-slate-400">Management</span> /{' '}
        <span
          className="text-slate-600 hover:text-slate-900 cursor-pointer"
          onClick={() => navigate('/plans-billing')}
        >
          Plans & Billing
        </span>{' '}
        / <span className="text-slate-900 font-bold">Upgrade to {currentPlan.name} Plan</span>
      </div>

      {/* Header Banner */}
      <div className="bg-[#0f2d59] text-white p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 text-[10px] font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3 text-amber-300" /> Subscription Checkout
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white font-serif">
            Upgrade to {currentPlan.name} Plan
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Complete payment via UPI to receive your instant activation code.
          </p>
        </div>

        <div className="text-right bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 backdrop-blur-xs">
          <div className="text-2xs uppercase tracking-wider text-slate-300 font-semibold">
            Amount Payable
          </div>
          <div className="text-2xl font-black text-amber-300 tracking-tight">
            ₹{currentPlan.price}
            <span className="text-xs font-normal text-slate-300"> / month</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Plan Summary Left, Payment & Activation Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Plan Benefits & Summary (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-500">
                  Selected Package
                </span>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  {currentPlan.name} Plan
                  {currentPlan.isPopular && (
                    <span className="bg-[#f59e0b] text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      Most Popular
                    </span>
                  )}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-slate-900">₹{currentPlan.price}</span>
                <div className="text-[10px] text-slate-400">per month</div>
              </div>
            </div>

            {/* Staff Access badge */}
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Staff Access Tier:</span>
              <span className="font-extrabold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                {currentPlan.users}
              </span>
            </div>

            {/* Included Features */}
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">Included In This Plan:</div>
              <ul className="space-y-2">
                {currentPlan.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span className="font-medium">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cost breakdown */}
            <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Plan Base Price</span>
                <span>₹{currentPlan.price}.00</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Setup & Activation Fee</span>
                <span className="text-emerald-600 font-bold">FREE (₹0)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Taxes & GST</span>
                <span className="text-slate-500">Included</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Due Now:</span>
                <span className="text-blue-700">₹{currentPlan.price}.00</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 text-2xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% Genuine Karnataka FMCG Distribution ERP License</span>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Details & Activation (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card 1: UPI Payment Details */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Scan & Pay with Any UPI Application
                </h3>
                <p className="text-2xs text-slate-500">
                  Google Pay · PhonePe · Paytm · BHIM · Cred · Any Bank UPI
                </p>
              </div>
            </div>

            {/* UPI ID Box matching reference */}
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-2xs font-extrabold uppercase tracking-wider text-amber-900">
                    Official Merchant UPI ID:
                  </div>
                  <div className="text-base font-black font-mono text-amber-950 mt-0.5">
                    {upiId}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(upiId, 'UPI ID')}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                >
                  <Copy className="w-3 h-3" /> Copy UPI ID
                </button>
              </div>
            </div>

            {/* Account ID Box matching reference */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-2xs font-extrabold uppercase tracking-wider text-slate-600">
                    Your Unique Account ID:
                  </div>
                  <div className="text-sm font-black font-mono text-slate-900 mt-0.5">
                    {accountId}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(accountId, 'Account ID')}
                  className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                >
                  <Copy className="w-3 h-3" /> Copy Account ID
                </button>
              </div>
            </div>

            <div className="text-2xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              Scan or send <b className="text-slate-800">₹{currentPlan.price}</b> to{' '}
              <b className="font-mono text-slate-800">{upiId}</b>. After payment, share your payment
              screenshot on WhatsApp (+91 9739396236) with your Account ID to receive your instant
              activation code.
            </div>
          </div>

          {/* Card 2: WhatsApp Share Screenshot */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Share Payment Screenshot on WhatsApp
                </h3>
                <p className="text-2xs text-slate-500">
                  Dedicated customer support: +91 9739396236
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="text-xs text-slate-600 max-w-sm">
                Click below to immediately open WhatsApp with pre-filled details for Account ID{' '}
                <span className="font-mono font-bold text-slate-800">{accountId}</span>:
              </div>

              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#15803d] hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm cursor-pointer active:scale-95"
              >
                <MessageCircle className="w-4 h-4 fill-white text-[#15803d]" /> Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Card 3: Instant Activation Code Form */}
          <form
            onSubmit={handleActivate}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Enter Received Activation Code
                </h3>
                <p className="text-2xs text-slate-500">
                  Received via WhatsApp or SMS (Format: PK...)
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-700 block">
                Activation Code:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="PK1-PRO-..."
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="bg-[#0f2d59] hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Activate
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PlanUpgradeCheckoutPage;
