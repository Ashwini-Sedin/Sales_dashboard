import React from 'react';
import { MdOutlineDescription, MdLockOutline } from 'react-icons/md';

const docTypes = [
  { name: 'Quick Sales', desc: 'Generate a brief sales pitch document' },
  { name: 'Detailed Proposal', desc: 'Comprehensive proposal with pricing' },
  { name: 'Presales', desc: 'Technical presales documentation' },
  { name: 'NDA', desc: 'Non-disclosure agreement template' },
  { name: 'SOW', desc: 'Statement of Work generator' },
];

const LeadDocumentsPanel = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Document Generation</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docTypes.map((doc, index) => (
          <div key={index} className="border border-slate-200 rounded-lg p-5 flex flex-col items-start bg-slate-50/50 relative overflow-hidden group min-h-[160px]">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-full flex items-center font-medium shadow-lg">
                <MdLockOutline className="mr-1.5 w-4 h-4" /> Enabled in Phase 3
              </span>
            </div>
            <div className="w-10 h-10 bg-white shadow-sm border border-slate-100 text-slate-600 rounded-lg flex items-center justify-center mb-3">
              <MdOutlineDescription className="w-5 h-5" />
            </div>
            <h4 className="font-medium text-slate-700 mb-1">{doc.name}</h4>
            <p className="text-xs text-slate-500 mb-4">{doc.desc}</p>
            <button disabled className="mt-auto w-full py-2 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-400 cursor-not-allowed">
              Generate
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeadDocumentsPanel;
