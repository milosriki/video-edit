
import React, { useEffect, useMemo, useState } from 'react';
import { BarChartIcon } from './icons';

// Local Mock Data Provider
const mockData = {
  getOverview: (from: number, to: number) => ({
    totals: {
      impressions: 145200,
      clicks: 8420,
      conversions: 342,
      spend: 4250.50,
      revenue: 16150.00,
      ctr: 0.058,
      cvr: 0.0406,
      cpa: 12.42,
      roas: 3.8
    }
  }),
  getCreatives: () => [
    { creativeId: 'c1', name: 'Boardroom Edge - Men 40+', platform: 'Instagram', campaign: 'Dubai-Exec-Q3', impressions: 45000, clicks: 3200, conversions: 120, spend: 1200, revenue: 5400, ctr: 0.071, cvr: 0.0375, cpa: 10, roas: 4.5 },
    { creativeId: 'c2', name: 'Strong Jiddo - Longevity', platform: 'Facebook', campaign: 'Health-Dubai-50', impressions: 38000, clicks: 2100, conversions: 85, spend: 950, revenue: 3800, ctr: 0.055, cvr: 0.0404, cpa: 11.17, roas: 4.0 },
    { creativeId: 'c3', name: 'Private Boutique - Women', platform: 'Instagram', campaign: 'Abu-Dhabi-Female', impressions: 22000, clicks: 1200, conversions: 45, spend: 800, revenue: 2900, ctr: 0.054, cvr: 0.0375, cpa: 17.77, roas: 3.6 },
    { creativeId: 'c4', name: 'Executive Protocol Reel', platform: 'Reels', campaign: 'Dubai-Exec-Q3', impressions: 40200, clicks: 1920, conversions: 92, spend: 1300, revenue: 4050, ctr: 0.047, cvr: 0.0479, cpa: 14.13, roas: 3.1 },
  ],
  getTimeseries: (metric: string) => {
    const points = [];
    const now = Date.now();
    for(let i=30; i>=0; i--) {
        points.push({ ts: now - (i * 24 * 60 * 60 * 1000), value: Math.floor(Math.random() * 500) + 200 });
    }
    return points;
  }
};

const number = (n: number) => new Intl.NumberFormat().format(n);
const money = (n: number) => `$${n.toFixed(2)}`;
const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

function KpiCard({ label, value, help }: { label: string; value: string; help?: string }) {
  return (
    <div className="bg-gray-800/60 border border-gray-700/60 rounded-lg p-4">
      <div className="text-gray-400 text-xs uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {help && <div className="text-xs text-gray-500 mt-1">{help}</div>}
    </div>
  );
}

const TableHeaderCell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300 bg-gray-800/70">{children}</th>;
}

function Chart({ data, label }: { data: {ts: number, value: number}[]; label: string }) {
  const width = 600;
  const height = 140;
  const pad = 12;
  if (data.length === 0) {
    return <div className="bg-gray-800/60 border border-gray-700/60 rounded-lg p-4 text-gray-500 text-sm">No data.</div>;
  }
  const xs = data.map(d => d.ts);
  const ys = data.map(d => d.value);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scaleX = (x: number) => pad + ((x - minX) / Math.max(1, maxX - minX)) * (width - pad * 2);
  const scaleY = (y: number) => height - pad - ((y - minY) / Math.max(1, maxY - minY)) * (height - pad * 2);
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.ts)} ${scaleY(d.value)}`).join(' ');

  return (
    <div className="bg-gray-800/60 border border-gray-700/60 rounded-lg p-4">
      <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
        <BarChartIcon className="w-4 h-4" /> {label}
      </div>
      {data.length <= 1 ? (
        <div className="text-gray-500 text-sm">Not enough data for chart.</div>
      ) : (
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
          <defs>
            <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35"/>
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={path} fill="none" stroke="#818cf8" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
          <path d={`${path} L ${scaleX(maxX)} ${height - pad} L ${scaleX(minX)} ${height - pad} Z`} fill="url(#fill)" opacity="0.5"/>
        </svg>
      )}
    </div>
  );
}

export function PerformanceDashboard() {
  const [days, setDays] = useState<7 | 14 | 30>(7);
  const [metric, setMetric] = useState<'impressions' | 'clicks' | 'conversions' | 'spend' | 'revenue'>('revenue');
  const [selectedCreative, setSelectedCreative] = useState<string | null>(null);
  
  const to = useMemo(() => Date.now(), []);
  const from = useMemo(() => to - days * 24 * 60 * 60 * 1000, [to, days]);

  const totals = useMemo(() => mockData.getOverview(from, to).totals, [from, to]);
  const creatives = useMemo(() => mockData.getCreatives(), []);
  const timeseries = useMemo(() => mockData.getTimeseries(metric), [selectedCreative, metric, from, to]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChartIcon className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold">Performance Dashboard</h2>
        </div>
        <div className="flex items-center gap-2">
          {[7, 14, 30].map(d => (
             <button key={d} onClick={() => setDays(d as any)} className={`px-3 py-1 rounded text-sm ${days === d ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>{d}d</button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <KpiCard label="Impressions" value={number(totals.impressions)} />
        <KpiCard label="Clicks" value={number(totals.clicks)} help={`CTR ${pct(totals.ctr)}`} />
        <KpiCard label="Conversions" value={number(totals.conversions)} help={`CVR ${pct(totals.cvr)}`} />
        <KpiCard label="Spend" value={money(totals.spend)} />
        <KpiCard label="Revenue" value={money(totals.revenue)} />
        <KpiCard label="ROAS" value={pct(totals.roas)} help={`CPA ${money(totals.cpa)}`} />
      </div>

      <div className="bg-gray-800/60 border border-gray-700/60 rounded-lg overflow-hidden">
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="text-sm font-semibold">Top Creatives</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Chart Metric</span>
            <select
              value={metric}
              onChange={e => setMetric(e.target.value as any)}
              className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white"
            >
              <option value="revenue">Revenue</option>
              <option value="spend">Spend</option>
              <option value="conversions">Conversions</option>
              <option value="clicks">Clicks</option>
              <option value="impressions">Impressions</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {[
                  'Creative', 'Platform', 'Campaign', 'Impr.', 'Clicks', 'Conv.',
                  'CTR', 'CVR', 'CPA', 'ROAS', 'Spend', 'Revenue'
                ].map(header => <TableHeaderCell key={header}>{header}</TableHeaderCell>)}
              </tr>
            </thead>
            <tbody>
              {creatives.map(c => (
                <tr key={c.creativeId} onClick={() => setSelectedCreative(c.creativeId)} className={`cursor-pointer border-b border-gray-800/70 hover:bg-gray-800/40 ${selectedCreative === c.creativeId ? 'bg-indigo-600/10' : ''}`}>
                  <td className="px-3 py-2 text-sm font-semibold">{c.name}</td>
                  <td className="px-3 py-2 text-sm text-gray-300">{c.platform}</td>
                  <td className="px-3 py-2 text-sm text-gray-300">{c.campaign}</td>
                  <td className="px-3 py-2 text-sm">{number(c.impressions)}</td>
                  <td className="px-3 py-2 text-sm">{number(c.clicks)}</td>
                  <td className="px-3 py-2 text-sm">{number(c.conversions)}</td>
                  <td className="px-3 py-2 text-sm">{pct(c.ctr)}</td>
                  <td className="px-3 py-2 text-sm">{pct(c.cvr)}</td>
                  <td className="px-3 py-2 text-sm">{money(c.cpa)}</td>
                  <td className="px-3 py-2 text-sm">{pct(c.roas)}</td>
                  <td className="px-3 py-2 text-sm">{money(c.spend)}</td>
                  <td className="px-3 py-2 text-sm">{money(c.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {selectedCreative && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300">Timeseries • {metric}</div>
            <button onClick={() => setSelectedCreative(null)} className="text-xs text-gray-400 hover:text-white underline">Clear selection</button>
          </div>
          <Chart
            data={timeseries}
            label={`Daily ${metric}`}
          />
        </div>
      )}
    </div>
  );
}

export default PerformanceDashboard;
