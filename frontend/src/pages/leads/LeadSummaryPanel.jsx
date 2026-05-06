import React from 'react';
import TurnaroundBadge from '../../components/TurnaroundBadge';
import { formatDistanceToNow } from 'date-fns';
import { 
  MdBusinessCenter, 
  MdPerson, 
  MdPhone, 
  MdEmail, 
  MdEdit,
  MdOutlineLanguage,
  MdOutlineMonetizationOn
} from 'react-icons/md';

const LeadSummaryPanel = ({ lead }) => {
  if (!lead) return null;

  const pipelineStages = ['Lead', 'Contacted', 'Qualified', 'Proposal', 'Won'];
  const currentStageIndex = pipelineStages.indexOf(lead.status || 'Lead');
  const progressPercent = Math.max(10, ((currentStageIndex + 1) / pipelineStages.length) * 100);

  const getSourceIcon = (source) => {
    switch (source?.toLowerCase()) {
      case 'website': return <MdOutlineLanguage className="w-4 h-4" />;
      case 'referral': return <MdPerson className="w-4 h-4" />;
      default: return <MdBusinessCenter className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-900">{lead.company_name}</h2>
              <TurnaroundBadge createdAt={lead.created_at || new Date().toISOString()} />
            </div>
            <p className="text-slate-500 flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-slate-600">
                {getSourceIcon(lead.source)} {lead.source || 'Direct'}
              </span>
              <span>•</span>
              <span>Created {lead.created_at ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true }) : 'Recently'}</span>
            </p>
          </div>
          
          <div className="w-full md:w-64">
            <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
              <span>Pipeline Progress</span>
              <span className="text-blue-600">{lead.status || 'Lead'}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group relative p-4 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer">
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-400">
              <MdEdit className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-1">
              <MdPerson className="w-4 h-4" /> Contact Name
            </div>
            <div className="font-semibold text-slate-800">{lead.contact_name || 'N/A'}</div>
          </div>

          <div className="group relative p-4 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer">
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-400">
              <MdEdit className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-1">
              <MdEmail className="w-4 h-4" /> Email
            </div>
            <div className="font-semibold text-slate-800 break-all">{lead.email || 'N/A'}</div>
          </div>

          <div className="group relative p-4 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer">
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-400">
              <MdEdit className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-1">
              <MdPhone className="w-4 h-4" /> Phone
            </div>
            <div className="font-semibold text-slate-800">{lead.phone || 'N/A'}</div>
          </div>

          <div className="group relative p-4 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer">
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-400">
              <MdEdit className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-1">
              <MdOutlineMonetizationOn className="w-4 h-4" /> Estimated Value
            </div>
            <div className="font-semibold text-slate-800">
              {lead.value ? `$${lead.value.toLocaleString()}` : 'TBD'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadSummaryPanel;
