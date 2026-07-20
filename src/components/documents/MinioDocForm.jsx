import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  FiX, FiZap, FiCheck, FiLoader, 
  FiSave, FiDownload, FiArrowLeft, FiAlertCircle,
  FiMail, FiPaperclip, FiLink
} from 'react-icons/fi';
import api from '../../api';
import { toast } from 'react-hot-toast';
import EmailComposeModal from '../lead/EmailComposeModal';

const MinioDocForm = ({ leadId, lead, onClose, onSuccess }) => {
  // Steps: 'input', 'loading', 'review', 'success'
  const [step, setStep] = useState('input'); 
  const [format, setFormat] = useState('pptx');
  const [draftPlaceholders, setDraftPlaceholders] = useState({});
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Email Composition States
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isPreparingEmail, setIsPreparingEmail] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBodyHtml, setComposeBodyHtml] = useState('');
  const [composeAttachments, setComposeAttachments] = useState([]);

  // Handler to fetch file and attach it
  const handleSendWithAttachment = async () => {
    setIsPreparingEmail(true);
    try {
      const response = await api.get(downloadUrl, { responseType: 'blob' });
      const blob = response.data;

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result;
        const isPptx = format === 'pptx';
        const defaultFilename = isPptx ? 'Proposal.pptx' : 'Proposal.docx';
        const filename = downloadUrl.split('?')[0].split('/').pop() || defaultFilename;
        const contentType = isPptx 
          ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        setComposeAttachments([
          {
            filename,
            content_type: contentType,
            content_bytes_base64: base64data,
            file: { size: blob.size }
          }
        ]);
        setComposeSubject(`Sales Proposal - ${lead?.company_name || 'Your Company'}`);
        setComposeBodyHtml(`
          <p>Hello ${lead?.first_name || 'there'},</p>
          <p>Please find attached the sales proposal document for <strong>${draftPlaceholders['{solution_name}'] || 'our custom solution'}</strong>.</p>
          <p>We look forward to partnering with you on this project. Let us know if you have any questions.</p>
          <p>Best regards,<br/>Sales Team</p>
        `);
        setIsComposeOpen(true);
        setIsPreparingEmail(false);
      };
    } catch (error) {
      console.error("Error preparing attachment:", error);
      toast.error("Failed to prepare document attachment. Try using the link option.");
      setIsPreparingEmail(false);
    }
  };

  // Handler to include download link in the body
  const handleSendWithLink = () => {
    const absoluteDownloadUrl = downloadUrl.startsWith('/') 
      ? window.location.origin + downloadUrl 
      : downloadUrl;

    setComposeAttachments([]);
    setComposeSubject(`Sales Proposal - ${lead?.company_name || 'Your Company'}`);
    setComposeBodyHtml(`
      <p>Hello ${lead?.first_name || 'there'},</p>
      <p>Your sales proposal document for <strong>${draftPlaceholders['{solution_name}'] || 'our custom solution'}</strong> is ready.</p>
      <p>You can download it directly using the link below:</p>
      <p><a href="${absoluteDownloadUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:#2563eb;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;">Download Proposal</a></p>
      <p>Let us know if you have any questions or feedback.</p>
      <p>Best regards,<br/>Sales Team</p>
    `);
    setIsComposeOpen(true);
  };

  const handleSendEmail = async (payload) => {
    try {
      await api.post(`/api/leads/${leadId}/emails/send`, payload);
      toast.success("Email sent successfully!");
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  };

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      proposed_solution_name: '',
      pricing_range: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      challenge_1: '',
      challenge_2: '',
      challenge_3: '',
      benefit_1: '',
      benefit_2: '',
      benefit_3: '',
      notes: ''
    }
  });

  // Handle draft generation
  const onGenerateDraft = async (data) => {
    setStep('loading');
    try {
      const client_challenges = [data.challenge_1, data.challenge_2, data.challenge_3].filter(Boolean);
      const key_benefits = [data.benefit_1, data.benefit_2, data.benefit_3].filter(Boolean);

      if (format === 'pptx') {
        const payload = {
          lead_id: leadId,
          format: 'pptx',
          dynamic_inputs: {
            proposed_solution_name: data.proposed_solution_name,
            pricing_range: data.pricing_range,
            start_date: data.start_date,
            end_date: data.end_date,
            client_challenges,
            key_benefits,
            notes: data.notes || ""
          }
        };

        const response = await api.post('/api/documents/generate-ppt', payload);
        setDownloadUrl(response.data.download_url);
        // We set dummy draft placeholders so the email builder doesn't crash on solution name lookup
        setDraftPlaceholders({ '{solution_name}': data.proposed_solution_name });
        setStep('success');
        toast.success('PPTX Presentation generated successfully!');
      } else {
        const payload = {
          lead_id: leadId,
          doc_type: 'quick_sales',
          proposed_solution_name: data.proposed_solution_name,
          pricing_range: data.pricing_range,
          start_date: data.start_date,
          end_date: data.end_date,
          client_challenges,
          key_benefits,
          notes: data.notes || ""
        };

        const response = await api.post('/api/documents/minio/generate-draft', payload);
        setDraftPlaceholders(response.data.placeholders || {});
        setStep('review');
        toast.success('AI Draft generated successfully! Please review.');
      }
    } catch (error) {
      console.error('Error generating draft/document:', error);
      toast.error('Failed to generate document. Please check your inputs and try again.');
      setStep('input');
    }
  };

  // Update dynamic input fields during review
  const handlePlaceholderChange = (key, value) => {
    setDraftPlaceholders(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Save the finalized document to MinIO
  const onSaveFinal = async () => {
    setIsFinalizing(true);
    try {
      const payload = {
        lead_id: leadId,
        doc_type: 'quick_sales',
        placeholders: draftPlaceholders
      };

      const response = await api.post('/api/documents/minio/save-final', payload);
      setDownloadUrl(response.data.download_url);
      setStep('success');
      toast.success('Document finalized and uploaded!');
    } catch (error) {
      console.error('Error saving final document:', error);
      toast.error('Failed to finalize and save the document.');
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#141a21] rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-100 dark:border-df-border animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-df-border flex items-center justify-between bg-gray-50 dark:bg-[#10151b]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FiZap size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick Sales Document Builder</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">AI Draft & Review Flow</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {step === 'input' && (
              <div className="flex items-center space-x-1 bg-gray-200/60 dark:bg-[#1b232e] p-1 rounded-xl border border-gray-300/40 dark:border-[#2a3441]">
                <button
                  type="button"
                  onClick={() => setFormat('pptx')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                    format === 'pptx'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <span>📊 PPTX</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('docx')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                    format === 'docx'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <span>📄 DOCX</span>
                </button>
              </div>
            )}
            
            {step !== 'loading' && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-white transition-colors">
                <FiX size={24} />
              </button>
            )}
          </div>
        </div>

        {/* STEP 1: Input Parameters */}
        {step === 'input' && (
          <form onSubmit={handleSubmit(onGenerateDraft)} className="overflow-y-auto max-h-[75vh]">
            <div className="p-6 space-y-6">
              
              {/* Context Block */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-[#10151b]/50 rounded-xl border border-gray-100 dark:border-df-border text-sm">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Company</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{lead?.company_name || 'TBD'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Contact</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{lead?.first_name} {lead?.last_name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Est. Value</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {lead?.estimated_value ? `$${lead.estimated_value.toLocaleString()}` : "TBD"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Source</p>
                  <p className="font-semibold text-blue-600 dark:text-blue-400">Quick Sales templates</p>
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Proposed Solution Name *</label>
                  <input
                    {...register('proposed_solution_name', { required: true })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. NextGen ERP Platform Migration"
                  />
                  {errors.proposed_solution_name && <span className="text-xs text-red-500 font-medium">This field is required</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Pricing Range *</label>
                    <input
                      {...register('pricing_range', { required: true })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="e.g. $45,000 - $60,000"
                    />
                    {errors.pricing_range && <span className="text-xs text-red-500 font-medium">This field is required</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                      <input
                        type="date"
                        {...register('start_date', { required: true })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                      <input
                        type="date"
                        {...register('end_date', { required: true })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Challenges */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Key Challenges (up to 3)</label>
                    <div className="space-y-2">
                      <input
                        {...register('challenge_1', { required: true })}
                        className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Challenge 1 (Required)"
                      />
                      <input
                        {...register('challenge_2')}
                        className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Challenge 2"
                      />
                      <input
                        {...register('challenge_3')}
                        className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Challenge 3"
                      />
                    </div>
                  </div>

                  {/* Benefits */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Key Benefits (up to 3)</label>
                    <div className="space-y-2">
                      <input
                        {...register('benefit_1', { required: true })}
                        className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Benefit 1 (Required)"
                      />
                      <input
                        {...register('benefit_2')}
                        className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Benefit 2"
                      />
                      <input
                        {...register('benefit_3')}
                        className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Benefit 3"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Additional Context / Notes for LLM</label>
                  <textarea
                    {...register('notes')}
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder="Provide details about legacy tech stacks, special contract stipulations, etc."
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-[#10151b] border-t border-gray-100 dark:border-df-border flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-[#2a3441] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1b232e] font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-colors"
              >
                <FiZap />
                <span>Generate AI Draft</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Loading State */}
        {step === 'loading' && (
          <div className="p-12 flex flex-col items-center justify-center space-y-6">
            <FiLoader className="text-blue-600 animate-spin" size={54} />
            <div className="text-center space-y-2">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">Connecting with Quick Sales & GateLLM...</h4>
              <p className="text-sm text-gray-500 max-w-sm">
                Fetching `.docx` template from Quick Sales templates bucket, reading placeholders, and running GateLLM to structure a draft proposal. Please wait.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: Review / Edit Draft */}
        {step === 'review' && (
          <div className="flex flex-col h-[75vh]">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl text-amber-800 dark:text-amber-300 text-sm flex items-start space-x-3">
                <FiAlertCircle className="mt-0.5 flex-shrink-0" size={18} />
                <div>
                  <p className="font-bold">Review AI-Generated Draft Contents</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    The document has NOT been saved yet. You can edit any field/placeholder below to adjust the final content of the generated proposal.
                  </p>
                </div>
              </div>

              {/* Editable Placeholders */}
              <div className="space-y-5">
                <h4 className="text-md font-bold border-b border-gray-100 dark:border-df-border pb-2 text-gray-800 dark:text-gray-200">
                  Document Placeholders
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(draftPlaceholders).map(([key, val]) => {
                    const isLongText = key.includes('introduction') || key.includes('objective') || key.includes('content_structure') || key.includes('challenges') || key.includes('benefits');

                    if (isLongText) return null; // Render large text blocks below

                    return (
                      <div key={key}>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{key}</label>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => handlePlaceholderChange(key, e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Render Large Text Blocks */}
                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-df-border">
                  {Object.entries(draftPlaceholders).map(([key, val]) => {
                    const isLongText = key.includes('introduction') || key.includes('objective') || key.includes('content_structure') || key.includes('challenges') || key.includes('benefits');

                    if (!isLongText) return null;

                    return (
                      <div key={key} className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{key}</label>
                        <textarea
                          rows={4}
                          value={val}
                          onChange={(e) => handlePlaceholderChange(key, e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all leading-relaxed"
                        />
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

            {/* Review actions */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-[#10151b] border-t border-gray-100 dark:border-df-border flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1b232e] font-semibold text-sm transition-colors"
              >
                <FiArrowLeft />
                <span>Re-draft</span>
              </button>

              <button
                type="button"
                disabled={isFinalizing}
                onClick={onSaveFinal}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm shadow-md transition-colors"
              >
                {isFinalizing ? (
                  <>
                    <FiLoader className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FiSave />
                    <span>Save & Finalize</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Success state & Download Link */}
        {step === 'success' && (
          <div className="p-8 space-y-6 text-center max-h-[75vh] overflow-y-auto">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <FiCheck size={36} />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                {format === 'pptx' ? 'PPTX Presentation Generated Successfully!' : 'DOCX Document Generated Successfully!'}
              </h4>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                {format === 'pptx'
                  ? 'Your finalized PPTX presentation has been generated, AI-enriched via GateLLM, database records updated, and the file synced to the generated-documents bucket.'
                  : 'Your finalized proposal has been compiled from the Quick Sales templates, placeholders replaced, DB records saved, and the file uploaded to the generated-documents bucket.'}
              </p>
            </div>

            {/* Send to Client Section */}
            <div className="bg-slate-50 dark:bg-[#10151b]/50 border border-slate-100 dark:border-[#2a3441] rounded-2xl p-6 mt-6 max-w-xl mx-auto text-left">
              <h5 className="font-bold text-gray-950 dark:text-white mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                <FiMail className="text-blue-500" /> Send to Client
              </h5>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Email this {format === 'pptx' ? 'presentation' : 'proposal'} directly to the client using your integrated Microsoft Graph mailbox.
              </p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={handleSendWithAttachment}
                  disabled={isPreparingEmail}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-white dark:bg-[#1b232e] border border-gray-200 dark:border-[#2a3441] hover:border-blue-500 dark:hover:border-blue-500 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-semibold rounded-xl text-sm transition-all duration-200 shadow-sm disabled:opacity-75"
                >
                  {isPreparingEmail ? (
                    <>
                      <FiLoader className="animate-spin" />
                      <span>Preparing File...</span>
                    </>
                  ) : (
                    <>
                      <FiPaperclip />
                      <span>Attach {format === 'pptx' ? 'PPTX' : 'Document'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all duration-200"
              >
                <FiDownload />
                <span>{format === 'pptx' ? 'Download Presentation' : 'Download Document'}</span>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 border border-gray-300 dark:border-[#2a3441] text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-[#1b232e] transition-colors"
              >
                Close Panel
              </button>
            </div>
          </div>
        )}

      </div>

      <EmailComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        leadEmail={lead?.email}
        initialSubject={composeSubject}
        initialBodyHtml={composeBodyHtml}
        initialAttachments={composeAttachments}
        onSend={handleSendEmail}
      />
    </div>
  );
};

export default MinioDocForm;
