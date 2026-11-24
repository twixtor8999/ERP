import React, { useState, useMemo } from 'react';
import { Download, Printer, Search, CheckCircle2, AlertTriangle, Truck, Filter } from 'lucide-react';
import { PipelineOrder } from './WholesaleOrdersPipelineView';
import { PNL_SKUS } from '@/features/pnl/data/mockPnlData';
import { toast } from 'sonner';

interface Props {
  orders: PipelineOrder[];
}

interface ConsolidatedPickItem {
  id: string | number;
  name: string;
  category: string;
  unit: string;
  ordersCount: number;
  totalQtyNeeded: number;
  availableStock: number;
  isShortage: boolean;
  shortageQty: number;
  estimatedAmount: number;
  routes: string[];
  vehicles: string[];
}

export const WholesaleItemWisePickingView: React.FC<Props> = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<'all' | 'packing' | 'invoice'>('all');

  // Available vehicle list
  const vehiclesList = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.vehicleNo) set.add(o.vehicleNo);
    });
    return Array.from(set);
  }, [orders]);

  // Aggregate items from relevant orders
  const consolidatedItems: ConsolidatedPickItem[] = useMemo(() => {
    // Filter orders by stage (default: packing & invoice orders which need picking)
    const targetOrders = orders.filter((o) => {
      if (o.status === 'cancelled') return false;
      if (stageFilter === 'packing' && o.stage !== 'packing') return false;
      if (stageFilter === 'invoice' && o.stage !== 'invoice') return false;
      if (selectedVehicle !== 'all' && o.vehicleNo !== selectedVehicle) return false;
      return true;
    });

    // Stock lookup map from PNL_SKUS
    const stockMap = new Map<string, { stock: number; category: string; cost: number }>();
    PNL_SKUS.forEach((s) => {
      stockMap.set(s.name.toLowerCase().trim(), {
        stock: s.stock ?? 25,
        category: s.cat || 'General',
        cost: s.cost ?? 100,
      });
    });

    const map = new Map<string, ConsolidatedPickItem>();

    targetOrders.forEach((o) => {
      o.items.forEach((item) => {
        const key = item.name.trim();
        const lowerKey = key.toLowerCase();
        const stockInfo = stockMap.get(lowerKey) || { stock: 35, category: 'General', cost: item.price };

        if (!map.has(key)) {
          map.set(key, {
            id: key,
            name: item.name,
            category: stockInfo.category,
            unit: item.unit || 'Unit',
            ordersCount: 0,
            totalQtyNeeded: 0,
            availableStock: stockInfo.stock,
            isShortage: false,
            shortageQty: 0,
            estimatedAmount: 0,
            routes: [],
            vehicles: [],
          });
        }

        const entry = map.get(key)!;
        entry.ordersCount += 1;
        entry.totalQtyNeeded += item.qty;
        entry.estimatedAmount += item.amount || item.qty * item.price;

        if (o.route && !entry.routes.includes(o.route)) {
          entry.routes.push(o.route);
        }
        if (o.vehicleNo && !entry.vehicles.includes(o.vehicleNo)) {
          entry.vehicles.push(o.vehicleNo);
        }
      });
    });

    // Check shortage
    map.forEach((entry) => {
      if (entry.availableStock < entry.totalQtyNeeded) {
        entry.isShortage = true;
        entry.shortageQty = entry.totalQtyNeeded - entry.availableStock;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalQtyNeeded - a.totalQtyNeeded);
  }, [orders, stageFilter, selectedVehicle]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return consolidatedItems;
    const q = searchTerm.toLowerCase();
    return consolidatedItems.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q) ||
        it.routes.some((r) => r.toLowerCase().includes(q))
    );
  }, [consolidatedItems, searchTerm]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalLines = filteredItems.length;
    const totalUnits = filteredItems.reduce((acc, i) => acc + i.totalQtyNeeded, 0);
    const totalShortageLines = filteredItems.filter((i) => i.isShortage).length;
    const totalValue = filteredItems.reduce((acc, i) => acc + i.estimatedAmount, 0);
    return { totalLines, totalUnits, totalShortageLines, totalValue };
  }, [filteredItems]);

  const handleExportCSV = () => {
    if (!filteredItems.length) {
      toast.error('No items to export');
      return;
    }
    const headers = ['Sl No', 'Item Name', 'Category', 'Orders Count', 'Total Qty Needed', 'Available Stock', 'Status', 'Shortage', 'Estimated Value', 'Routes'];
    const rows = filteredItems.map((it, idx) => [
      idx + 1,
      `"${it.name}"`,
      `"${it.category}"`,
      it.ordersCount,
      it.totalQtyNeeded,
      it.availableStock,
      it.isShortage ? 'Shortage' : 'Ready',
      it.shortageQty,
      it.estimatedAmount,
      `"${it.routes.join(', ')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Warehouse_Picking_Sheet_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Warehouse picking sheet exported to CSV');
  };

  const handlePrintPickingSheet = () => {
    const win = window.open('', '_blank');
    if (!win) {
      toast.error('Pop-up blocked. Please allow popups to print picking sheet.');
      return;
    }

    const doc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Warehouse_Picking_Manifest_${new Date().toISOString().split('T')[0]}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 20px; font-size: 12px; color: #1e293b; }
    h1 { margin: 0 0 4px 0; font-size: 18px; font-weight: 900; }
    .meta { margin-bottom: 15px; color: #64748b; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
    th { background: #1e40af; color: #fff; font-weight: bold; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .shortage { background-color: #fee2e2; font-weight: bold; color: #991b1b; }
    .checkbox { width: 16px; height: 16px; border: 1.5px solid #64748b; display: inline-block; vertical-align: middle; border-radius: 3px; }
    @media print {
      body { padding: 0; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <h1>WAREHOUSE CONSOLIDATED PICKING MANIFEST</h1>
  <div class="meta">
    <b>SIDDESHWAR ENTERPRISES</b> · Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} ·
    Total Distinct SKUs: ${filteredItems.length} · Total Units to Pick: ${stats.totalUnits} ${selectedVehicle !== 'all' ? `· Vehicle: ${selectedVehicle}` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px;" class="text-center">Pick</th>
        <th style="width: 35px;" class="text-center">#</th>
        <th>Product Description</th>
        <th style="width: 110px;">Category</th>
        <th style="width: 60px;" class="text-center">Orders</th>
        <th style="width: 90px;" class="text-center">Pick Qty</th>
        <th style="width: 90px;" class="text-center">Stock</th>
        <th style="width: 80px;" class="text-center">Status</th>
        <th>Delivery Routes</th>
      </tr>
    </thead>
    <tbody>
      ${filteredItems.map((it, idx) => `
        <tr class="${it.isShortage ? 'shortage' : ''}">
          <td class="text-center"><div class="checkbox"></div></td>
          <td class="text-center font-mono">${idx + 1}</td>
          <td><b>${it.name}</b></td>
          <td>${it.category}</td>
          <td class="text-center font-mono">${it.ordersCount}</td>
          <td class="text-center font-mono font-bold" style="font-size: 13px;">${it.totalQtyNeeded} ${it.unit}</td>
          <td class="text-center font-mono">${it.availableStock}</td>
          <td class="text-center">${it.isShortage ? `Short (-${it.shortageQty})` : 'OK'}</td>
          <td style="font-size: 10px;">${it.routes.join(', ') || 'Direct'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div style="margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px;">
    <div>Picked By: __________________________</div>
    <div>Verified By Supervisor: __________________________</div>
    <div>Date & Time: __________________________</div>
  </div>

  <script>
    setTimeout(function() { window.print(); }, 200);
  </script>
</body>
</html>`;

    win.document.open();
    win.document.write(doc);
    win.document.close();
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Top Banner & KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-medium">Distinct SKUs to Pick</div>
          <div className="text-xl font-black text-slate-900 mt-1">{stats.totalLines}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-medium">Total Units Needed</div>
          <div className="text-xl font-black text-blue-700 mt-1 font-mono">{stats.totalUnits.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-medium">Stock Shortages</div>
          <div className={`text-xl font-black mt-1 ${stats.totalShortageLines > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {stats.totalShortageLines > 0 ? `${stats.totalShortageLines} items` : '✔ None'}
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-medium">Consolidated Value</div>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">
            ₹{stats.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Action and Filter Strip */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search items, category or route..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Filters and Print Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Vehicle selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <Truck className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">All Vehicles</option>
              {vehiclesList.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Stage filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">Packing & Invoicing</option>
              <option value="packing">Packing Only</option>
              <option value="invoice">Invoice Only</option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Excel
          </button>

          <button
            onClick={handlePrintPickingSheet}
            className="px-3.5 py-1.5 bg-[#132038] hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Warehouse Manifest
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1e40af] text-white font-bold text-[11px] tracking-wider uppercase border-b border-blue-900">
                <th className="py-3 px-3.5 text-center w-12">#</th>
                <th className="py-3 px-3.5">Item Name</th>
                <th className="py-3 px-3.5">Category</th>
                <th className="py-3 px-3.5 text-center font-mono">Orders</th>
                <th className="py-3 px-3.5 text-center font-mono">Total Pick Qty</th>
                <th className="py-3 px-3.5 text-center font-mono">Stock Avail</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-right font-mono">Total Amt</th>
                <th className="py-3 px-3.5">Routes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 font-medium">
                    No active packing items found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr
                    key={item.name}
                    className={`hover:bg-blue-50/40 transition ${
                      item.isShortage ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-3.5 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-3.5 font-bold text-slate-900">
                      <div>{item.name}</div>
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 font-medium">{item.category}</td>
                    <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-700">
                      {item.ordersCount}
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono font-black text-blue-900 text-[13px]">
                      {item.totalQtyNeeded} <span className="text-[10px] text-slate-500 font-normal">{item.unit}</span>
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-700">
                      {item.availableStock}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {item.isShortage ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3" /> Short (-{item.shortageQty})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                      ₹{item.estimatedAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 font-medium text-[11px] max-w-xs truncate">
                      {item.routes.join(', ') || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
