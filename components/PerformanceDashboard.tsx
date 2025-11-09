import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BarChartIcon } from './icons';

const qc = new QueryClient();

type Overview = {
  totals: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
    ctr: number;
    cvr: number;
    cpa: number;
    roas: number;
  };
};

type CreativePerf = {
  creativeId: string;
  name: string;
  platform: string;
  campaign: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cvr: number;
  cpa: number;
  roas: number;
};

type TimeseriesPoint = { ts: number; value: number };

const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

const fetchJSON = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}: ${url}`);
  return res.json() as Promise<T>;
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

function TableHeaderCell({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300 bg-gray-800/70">{children}</th>;
}

function CreativeRow({ c }: { c: CreativePerf }) {
  return (
    <tr className="border-b border-gray-800/70 hover:bg-gray-800/40">
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
  );
}

function Chart({ data, label }: { data: TimeseriesPoint[]; label: string }) {
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

function InnerPerformanceDashboard() {
  const [days, setDays] = useState<7 | 14 | 30>(7);
  const [metric, setMetric] = useState<'impressions' | 'clicks' | 'conversions' | 'spend' | 'revenue'>('revenue');
  const [selectedCreative, setSelectedCreative] = useState<string | null>(null);
  const to = useMemo(() => Date.now(), []);
  const from = useMemo(() => to - days * 24 * 60 * 60 * 1000, [to, days]);

  const overviewQ = useQuery({
    queryKey: ['overview', from, to],
    queryFn: () => fetchJSON<Overview>(`${API_BASE}/overview?from=${from}&to=${to}`)
  });

  const creativesQ = useQuery({
    queryKey: ['creatives', from, to],
    queryFn: () => fetchJSON<CreativePerf[]>(`${API_BASE}/creatives?from=${from}&to=${to}&sort=roas&order=desc&limit=50`)
  });

  const tsQ = useQuery({
    enabled: !!selectedCreative,
    queryKey: ['timeseries', selectedCreative, metric, from, to],
    queryFn: () =>
      fetchJSON<TimeseriesPoint[]>(
        `${API_BASE}/timeseries?creativeId=${selectedCreative}&metric=${metric}&granularity=day&from=${from}&to=${to}`
      )
  });

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/stream`);
    es.onmessage = () => {
      overviewQ.refetch();
      creativesQ.refetch();
      if (selectedCreative) tsQ.refetch();
    };
    es.onerror = () => {
      // network hiccups auto-retry
    };
    return () => es.close();
  }, [selectedCreative]); // eslint-disable-line

  const totals = overviewQ.data?.totals;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChartIcon className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold">Performance Dashboard</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDays(7)} className={`px-3 py-1 rounded text-sm ${days === 7 ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>7d</button>
          <button onClick={() => setDays(14)} className={`px-3 py-1 rounded text-sm ${days === 14 ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>14d</button>
          <button onClick={() => setDays(30)} className={`px-3 py-1 rounded text-sm ${days === 30 ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>30d</button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <KpiCard label="Impressions" value={totals ? number(totals.impressions) : '—'} />
        <KpiCard label="Clicks" value={totals ? number(totals.clicks) : '—'} help={totals ? `CTR ${pct(totals.ctr)}` : undefined}/>
        <KpiCard label="Conversions" value={totals ? number(totals.conversions) : '—'} help={totals ? `CVR ${pct(totals.cvr)}` : undefined}/>
        <KpiCard label="Spend" value={totals ? money(totals.spend) : '—'} />
        <KpiCard label="Revenue" value={totals ? money(totals.revenue) : '—'} />
        <KpiCard label="ROAS" value={totals ? pct(totals.roas) : '—'} help={totals ? `CPA ${money(totals.cpa)}` : undefined}/>
      </div>
      <div className="bg-gray-800/60 border border-gray-700/60 rounded-lg overflow-hidden">
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="text-sm font-semibold">Top Creatives</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Chart Metric</span>
            <select
              value={metric}
              onChange={e => setMetric(e.target.value as any)}
              className="bg-gray-900 border border-gray-700 rounded px-2 py-1"
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
                <TableHeaderCell>Creative</TableHeaderCell>
                <TableHeaderCell>Platform</TableHeaderCell>
                <TableHeaderCell>Campaign</TableHeaderCell>
                <TableHeaderCell>Impr.</TableHeaderCell>
                <TableHeaderCell>Clicks</TableHeaderCell>
                <TableHeaderCell>Conv.</TableHeaderCell>
                <TableHeaderCell>CTR</TableHeaderCell>
                <TableHeaderCell>CVR</TableHeaderCell>
                <TableHeaderCell>CPA</TableHeaderCell>
                <TableHeaderCell>ROAS</TableHeaderCell>
                <TableHeaderCell>Spend</TableHeaderCell>
                <TableHeaderCell>Revenue</TableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {(creativesQ.data || []).map(c => (
                <tr key={c.creativeId} onClick={() => setSelectedCreative(c.creativeId)} className={`cursor-pointer ${selectedCreative === c.creativeId ? 'bg-indigo-600/10' : ''}`}>
                  <CreativeRow c={c} />
                </tr>
              ))}
              {creativesQ.isLoading && (
                <tr><td colSpan={12} className="px-3 py-3 text-center text-gray-400">Loading creatives…</td></tr>
              )}
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
            data={(tsQ.data || []).map(p => ({ ts: p.ts, value: p.value }))}
            label={`Daily ${metric}`}
          />
        </div>
      )}
    </div>
  );
}

export function PerformanceDashboard() {
  return (
    <QueryClientProvider client={qc}>
      <InnerPerformanceDashboard />
    </QueryClientProvider>
  );
}

export default PerformanceDashboard;
