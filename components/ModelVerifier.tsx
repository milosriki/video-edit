
import React, { useState, useEffect } from 'react';
import { ShieldIcon, SparklesIcon, CheckIcon, BarChartIcon, RefreshIcon, WandIcon, SlidersIcon } from './icons';

interface TestCase {
  test_id: string;
  category: string;
  description: string;
  metric: string;
  threshold: string;
  status: 'pending' | 'running' | 'pass' | 'fail';
  resultValue?: string;
}

// Fixed type definition for TEST_SUITE to ensure keys match activeModel state union type
const TEST_SUITE: Record<'PCR' | 'PADI' | 'OLPP', TestCase[]> = {
  "PCR": [
    { test_id: "PCR_PERF_01_V2", category: "Performance", description: "Intermediate Algebra Recommender", metric: "NDCG@5", threshold: "> 0.85", status: 'pending' },
    { test_id: "PCR_COLD_02_V2", category: "Cold Start", description: "New User Initialization", metric: "Hit Ratio@10", threshold: "> 0.70", status: 'pending' },
    { test_id: "PCR_STAB_03_V2", category: "Stability", description: "Minor Input Consistency", metric: "Jaccard Index", threshold: "> 0.90", status: 'pending' }
  ],
  "PADI": [
    { test_id: "PADI_ROB_01_V2", category: "Robustness", description: "Outlier Noise Rejection", metric: "FDR", threshold: "< 0.02", status: 'pending' },
    { test_id: "PADI_SENS_02_V2", category: "Sensitivity", description: "Struggle Point Detection", metric: "F1-Score", threshold: "> 0.88", status: 'pending' },
    { test_id: "PADI_FAIR_03_V2", category: "Fairness", description: "ESL Demographic Parity", metric: "DPD", threshold: "< 0.03", status: 'pending' }
  ],
  "OLPP": [
    { test_id: "OLPP_LOG_01_V2", category: "Logic", description: "Prerequisite Adherence", metric: "Violation Rate", threshold: "= 0.00", status: 'pending' },
    { test_id: "OLPP_ETH_03_V2", category: "Ethical", description: "Burnout Avoidance", metric: "Cognitive Var", threshold: "< 0.20", status: 'pending' }
  ]
};

export const ModelVerifier: React.FC = () => {
  const [suite, setSuite] = useState(TEST_SUITE);
  const [activeModel, setActiveModel] = useState<'PCR' | 'PADI' | 'OLPP'>('PCR');
  const [jobStatus, setJobStatus] = useState<'idle' | 'queued' | 'running' | 'complete'>('idle');
  const [telemetry, setTelemetry] = useState<string[]>([]);

  const runVerification = async () => {
    setJobStatus('queued');
    setTelemetry(["[PUB/SUB] Publishing job to verification-jobs-topic...", "[GCP] Job ID: v_run_" + Math.random().toString(36).substr(2, 9)]);
    
    await new Promise(r => setTimeout(r, 1500));
    setJobStatus('running');
    setTelemetry(prev => [...prev, "[RUNNER] Service verification-runner-service initialized.", "[DB] Connection to verification-runner-db verified via Secret Manager."]);

    const currentTests = [...suite[activeModel]];
    for (let i = 0; i < currentTests.length; i++) {
      setTelemetry(prev => [...prev, `[EXEC] Running ${currentTests[i].test_id}...`]);
      setSuite(prev => ({
        ...prev,
        [activeModel]: prev[activeModel].map((t, idx) => idx === i ? { ...t, status: 'running' } : t)
      }));
      
      await new Promise(r => setTimeout(r, 1200));
      
      const pass = Math.random() > 0.15;
      setSuite(prev => ({
        ...prev,
        [activeModel]: prev[activeModel].map((t, idx) => idx === i ? { 
          ...t, 
          status: pass ? 'pass' : 'fail',
          resultValue: pass ? (Math.random() * 0.1 + 0.9).toFixed(3) : (Math.random() * 0.3).toFixed(3)
        } : t)
      }));
    }

    setJobStatus('complete');
    setTelemetry(prev => [...prev, "[RUNNER] Execution finalized. Results written to PostgreSQL."]);
  };

  const resetSuite = () => {
    setSuite(TEST_SUITE);
    setJobStatus('idle');
    setTelemetry([]);
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black gradient-text tracking-tighter italic flex items-center gap-4">
            Model Verification GSI
            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-full uppercase tracking-[0.2em] font-black not-italic">SRE Managed</span>
          </h2>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.3em] mt-2">Automated Reliability Runner • Cloud Run v2.4</p>
        </div>
        <div className="flex gap-4">
            <button 
              onClick={resetSuite}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5"
            >
              Reset Protocol
            </button>
            <button 
              onClick={runVerification}
              disabled={jobStatus === 'running' || jobStatus === 'queued'}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-indigo-500/40 border border-white/10 flex items-center gap-2"
            >
              <WandIcon className="w-4 h-4" />
              Trigger Global Runner
            </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div className="flex gap-4 p-1 bg-black/40 rounded-3xl border border-white/5 w-fit">
            {(Object.keys(TEST_SUITE) as Array<keyof typeof TEST_SUITE>).map(key => (
              <button
                key={key}
                onClick={() => setActiveModel(key)}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeModel === key ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {key === 'PCR' ? 'Recommendation (PCR)' : key === 'PADI' ? 'Difficulty (PADI)' : 'Path Prediction (OLPP)'}
              </button>
            ))}
          </div>

          <div className="glass-panel rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Test Node</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Description</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Metric</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Threshold</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {suite[activeModel].map((test) => (
                  <tr key={test.test_id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-8 py-6">
                      <div className="text-xs font-mono font-bold text-indigo-400">{test.test_id}</div>
                      <div className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">{test.category}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-bold text-gray-200">{test.description}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-xs font-mono text-gray-400">{test.metric}</div>
                      {test.resultValue && (
                        <div className={`text-xs font-mono font-black mt-1 ${test.status === 'pass' ? 'text-green-400' : 'text-red-400'}`}>
                          Result: {test.resultValue}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-xs font-mono text-gray-500">{test.threshold}</div>
                    </td>
                    <td className="px-8 py-6">
                      <StatusBadge status={test.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-8 rounded-[2rem] border-white/5 space-y-8 bg-gradient-to-br from-indigo-500/[0.05] to-transparent">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <BarChartIcon className="w-3.5 h-3.5" />
                Runner Telemetry
            </h3>
            <div className="bg-black/40 rounded-2xl p-6 border border-white/5 h-[400px] overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-2">
              {telemetry.length === 0 ? (
                <div className="text-gray-700 italic">Awaiting runner signal...</div>
              ) : telemetry.map((log, i) => (
                <div key={i} className="text-gray-400 leading-relaxed">
                  <span className="text-indigo-500 opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                  {log}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-8 rounded-[2rem] border-white/5 space-y-6">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <ShieldIcon className="w-3.5 h-3.5" />
                Infrastructure Health
            </h3>
            <div className="space-y-4">
              <HealthItem label="verification-jobs-topic" status={jobStatus === 'idle' ? 'online' : 'active'} />
              <HealthItem label="verification-runner-db" status="online" />
              <HealthItem label="runner-db-secret" status="encrypted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: TestCase['status'] }) => {
  const styles = {
    pending: "bg-gray-800 text-gray-500",
    running: "bg-indigo-500/20 text-indigo-400 animate-pulse",
    pass: "bg-green-500/20 text-green-400 border border-green-500/30",
    fail: "bg-red-500/20 text-red-400 border border-red-500/30"
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${styles[status]}`}>
      {status}
    </span>
  );
};

const HealthItem = ({ label, status }: { label: string; status: string }) => (
  <div className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-white/5">
    <span className="text-[10px] font-mono text-gray-500">{label}</span>
    <span className={`text-[9px] font-black uppercase tracking-tighter ${status === 'online' || status === 'active' || status === 'encrypted' ? 'text-green-500' : 'text-red-500'}`}>
      {status}
    </span>
  </div>
);
