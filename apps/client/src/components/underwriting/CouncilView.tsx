import React from 'react';
import { Bot, ThumbsDown, ThumbsUp, Gavel, CheckCircle } from 'lucide-react';

interface CouncilOpinion {
    persona: "Skeptic" | "Deal Maker" | "Chairman";
    recommendation: "Approve" | "Decline" | "Review";
    score: number;
    reasoning: string;
    keyPoints: string[];
}

interface CouncilResult {
    skeptic: CouncilOpinion;
    dealMaker: CouncilOpinion;
    chairman: CouncilOpinion;
}

interface CouncilViewProps {
    result: CouncilResult;
    onApprove: (finalScore: number) => void;
}

export const CouncilView: React.FC<CouncilViewProps> = ({ result, onApprove }) => (
    <div className="council-chamber p-6 bg-[#0f1115] text-white rounded-xl border border-gray-800">
        <div className="mb-6 text-center">
            <h2 className="text-2xl font-light text-cyan-400 flex items-center justify-center gap-2">
                <Gavel className="w-6 h-6" /> The Underwriting Council
            </h2>
            <p className="text-gray-400 text-sm">Review the debate and cast the final vote.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* SKEPTIC */}
            <div className="persona-card border border-red-900/30 bg-red-950/10 rounded-lg p-4 relative">
                <div className="absolute top-0 right-0 p-2 opacity-10"><ThumbsDown size={64} /></div>
                <div className="flex items-center gap-2 mb-3 text-red-400">
                    <Bot size={20} />
                    <span className="font-bold uppercase tracking-wider">The Skeptic</span>
                </div>
                <p className="text-2xl font-bold mb-1 text-red-500">{result.skeptic.score}/5</p>
                <div className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded inline-block mb-4">
                    {result.skeptic.recommendation}
                </div>
                <p className="text-sm text-gray-300 italic mb-4">"{result.skeptic.reasoning}"</p>
                <ul className="text-xs text-gray-400 list-disc pl-4 space-y-1">
                    {result.skeptic.keyPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                </ul>
            </div>

            {/* CHAIRMAN (Center) */}
            <div className="persona-card border border-cyan-500/30 bg-cyan-950/10 rounded-lg p-6 relative transform md:-translate-y-4 shadow-2xl shadow-cyan-900/20 z-10">
                <div className="flex items-center gap-2 mb-3 text-cyan-400 justify-center">
                    <Gavel size={24} />
                    <span className="font-bold uppercase tracking-wider">The Chairman</span>
                </div>
                <div className="text-center mb-6">
                    <p className="text-5xl font-thin text-white mb-2">{result.chairman.score}</p>
                    <p className="text-sm text-cyan-500 uppercase tracking-widest">{result.chairman.recommendation}</p>
                </div>
                <p className="text-sm text-gray-200 mb-6 text-center leading-relaxed">
                    {result.chairman.reasoning}
                </p>
                <button
                    onClick={() => onApprove(result.chairman.score)}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-900/50"
                >
                    <CheckCircle size={18} /> Adopt Verdict
                </button>
            </div>

            {/* DEAL MAKER */}
            <div className="persona-card border border-green-900/30 bg-green-950/10 rounded-lg p-4 relative">
                <div className="absolute top-0 right-0 p-2 opacity-10"><ThumbsUp size={64} /></div>
                <div className="flex items-center gap-2 mb-3 text-green-400">
                    <Bot size={20} />
                    <span className="font-bold uppercase tracking-wider">The Deal Maker</span>
                </div>
                <p className="text-2xl font-bold mb-1 text-green-500">{result.dealMaker.score}/5</p>
                <div className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded inline-block mb-4">
                    {result.dealMaker.recommendation}
                </div>
                <p className="text-sm text-gray-300 italic mb-4">"{result.dealMaker.reasoning}"</p>
                <ul className="text-xs text-gray-400 list-disc pl-4 space-y-1">
                    {result.dealMaker.keyPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                </ul>
            </div>
        </div>
    </div>
);
