
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { CreditCard, RefreshCw, Copy, ShieldCheck, Loader2, Wallet, Globe, Lock, Check } from 'lucide-react';

export const CreditCardGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState<any>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ text: "Generate a realistic mock credit card profile for software testing purposes. Return ONLY a valid JSON object with the following keys: network (Visa, Mastercard, or Amex), number (formatted with spaces, passing Luhn check but mock IIN), expiry (MM/YY, future date), cvv (3 or 4 digits), name (full name), balance (random amount string like '$5,000'), address (short billing address), country. Do not include markdown formatting." }]
      });
      
      const text = response.text?.replace(/```json/g, '').replace(/```/g, '').trim();
      if (text) {
        setCardData(JSON.parse(text));
      }
    } catch (e) {
      console.error(e);
      alert("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleCopyAll = () => {
    if (!cardData) return;
    const text = `Network: ${cardData.network}
Number: ${cardData.number}
Expiry: ${cardData.expiry}
CVV: ${cardData.cvv}
Name: ${cardData.name}
Address: ${cardData.address}
Country: ${cardData.country}
Balance: ${cardData.balance}`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 lg:p-10 pb-32">
      <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
        <header className="flex items-center gap-6 pb-6 border-b border-white/5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-xl animate-scale-in">
            <Wallet className="w-8 h-8 text-emerald-200" />
          </div>
          <div>
            <h1 className="text-4xl font-semibold text-white tracking-tight">Card Architect</h1>
            <p className="text-white/40 mt-1 font-medium">AI-Generated Mock Financial Data</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Visual Card Section */}
            <div className="space-y-8">
                <div className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center bg-black/40 border border-white/10">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

                    {cardData ? (
                        <div className="w-full max-w-sm aspect-[1.586/1] rounded-3xl relative overflow-hidden shadow-2xl animate-scale-in transition-all hover:scale-105 duration-500 group">
                            {/* Card Background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${
                                cardData.network === 'Visa' ? 'from-blue-900 to-blue-600' :
                                cardData.network === 'Mastercard' ? 'from-orange-900 to-red-600' :
                                'from-slate-800 to-slate-600'
                            }`} />
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            
                            {/* Card Content */}
                            <div className="relative h-full p-6 flex flex-col justify-between text-white font-mono">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-8 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-lg shadow-inner opacity-80 flex items-center justify-center">
                                        <div className="w-8 h-5 border border-black/10 rounded opacity-50" />
                                    </div>
                                    <span className="font-bold tracking-widest uppercase opacity-80">{cardData.network}</span>
                                </div>
                                
                                <div className="space-y-1">
                                    <div className="text-2xl tracking-widest drop-shadow-md font-bold text-center">
                                        {cardData.number}
                                    </div>
                                    <div className="flex justify-center gap-2 text-[10px] opacity-60">
                                        <span>VALID FROM 09/24</span>
                                        <span>THRU {cardData.expiry}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div className="uppercase tracking-widest text-sm font-medium opacity-90 truncate max-w-[200px]">
                                        {cardData.name}
                                    </div>
                                    <div className="text-xs opacity-70 flex items-center gap-1">
                                        <Lock size={10} /> CVV {cardData.cvv}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-white/20">
                            <CreditCard className="w-24 h-24 mb-6 opacity-10" />
                            <p className="font-medium tracking-wide">Ready to Generate</p>
                        </div>
                    )}
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={handleGenerate}
                        disabled={loading}
                        className={`flex-1 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 text-lg ${
                            loading 
                            ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                            : 'bg-white text-black hover:bg-white/90 shadow-emerald-900/20'
                        }`}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={20} />}
                        {loading ? 'Generating...' : 'Generate New Card'}
                    </button>

                    <button 
                        onClick={handleCopyAll}
                        disabled={!cardData}
                        className={`px-6 py-5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 text-lg ${
                            !cardData 
                            ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                            : 'bg-[#1a1a1a] text-white hover:bg-[#252525] border border-white/10'
                        }`}
                        title="Copy All Details"
                    >
                        {copiedAll ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                    </button>
                </div>
            </div>

            {/* Data Panel */}
            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-black/40 flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                    <ShieldCheck className="text-emerald-400" size={24} />
                    <div>
                        <h3 className="font-bold text-white">Mock Identity</h3>
                        <p className="text-xs text-emerald-400">Valid Format • Test Data Only</p>
                    </div>
                </div>

                {cardData ? (
                    <div className="space-y-4 flex-1">
                        {[
                            { label: 'Cardholder Name', value: cardData.name },
                            { label: 'Card Number', value: cardData.number },
                            { label: 'Expiry Date', value: cardData.expiry },
                            { label: 'Security Code (CVV)', value: cardData.cvv },
                            { label: 'Billing Address', value: cardData.address },
                            { label: 'Country', value: cardData.country },
                            { label: 'Mock Balance', value: cardData.balance }
                        ].map((item, i) => (
                            <div key={i} className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">{item.label}</label>
                                    <span className="text-sm text-white/90 font-mono font-medium">{item.value}</span>
                                </div>
                                <button 
                                    onClick={() => copyToClipboard(item.value)}
                                    className="p-2 text-white/20 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-white/20 text-center p-8">
                         <Globe className="w-16 h-16 mb-4 opacity-10" />
                         <p className="text-sm max-w-xs">
                             Use this tool to generate mock payment profiles for software testing, QA, and development environments.
                         </p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
