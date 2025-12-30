
import React, { useState } from 'react';
import { auditCompliance } from '../services/geminiService';
import { CheckIcon, SparklesIcon } from './icons';

const ComplianceAuditor: React.FC = () => {
    const [copy, setCopy] = useState("Lose 10kg in 10 days! Guaranteed results for executive men in Dubai.");
    const [report, setReport] = useState<{text: string, sources: any[]} | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAudit = async () => {
        setIsLoading(true);
        try {
            const data = await auditCompliance(copy);
            setReport(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <header className="text-center">
                <h2 className="text-3xl font-black text-white">Meta Compliance Auditor</h2>
                <p className="text-gray-400 mt-2">I use Search Grounding to verify your copy against 2025 Meta Ad Policies.</p>
            </header>

            <textarea 
                value={copy} 
                onChange={e => setCopy(e.target.value)}
                rows={5}
                className="w-full bg-gray-800 border border-gray-700 p-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-red-500/50"
                placeholder="Paste your ad copy here..."
            />

            <button 
                onClick={handleAudit} 
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50"
            >
                {isLoading ? 'Auditing Policies...' : 'Check Compliance'}
            </button>

            {report && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-red-950/20 p-6 rounded-2xl border border-red-500/30">
                        <h4 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-4">Policy Audit Results</h4>
                        <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                            {report.text}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplianceAuditor;
