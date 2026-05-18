import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { MdClose, MdAttachFile, MdSend, MdDelete } from 'react-icons/md';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const EmailComposeModal = ({ leadEmail, isOpen, onClose, onSend }) => {
  const { handleSubmit, register, reset, setValue } = useForm({
    defaultValues: {
      to_email: leadEmail || '',
      subject: '',
      cc: '',
      body_html: ''
    }
  });

  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      setValue('body_html', editor.getHTML(), { shouldValidate: true });
    },
  });

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = async (files) => {
    const validFiles = Array.from(files).filter(file => file.size <= MAX_FILE_SIZE);
    
    if (validFiles.length < files.length) {
      alert("Some files exceed the 10MB limit and were not added.");
    }

    const availableSlots = MAX_FILES - attachments.length;
    const filesToAdd = validFiles.slice(0, availableSlots);

    if (validFiles.length > availableSlots) {
      alert(`You can only attach up to ${MAX_FILES} files.`);
    }

    const newAttachments = await Promise.all(
      filesToAdd.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              file,
              filename: file.name,
              content_type: file.type || 'application/octet-stream',
              content_bytes_base64: reader.result
            });
          };
          reader.readAsDataURL(file);
        });
      })
    );

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    setIsSending(true);
    try {
      const ccList = data.cc.split(',').map(email => email.trim()).filter(Boolean);
      
      const payload = {
        to_email: data.to_email,
        subject: data.subject,
        body_html: data.body_html,
        cc: ccList,
        attachments: attachments.map(a => ({
          filename: a.filename,
          content_type: a.content_type,
          content_bytes_base64: a.content_bytes_base64
        }))
      };

      await onSend(payload);
      
      reset();
      editor?.commands.setContent('');
      setAttachments([]);
      onClose();
    } catch (error) {
      console.error("Failed to send email", error);
      alert("Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">Compose Email</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-y-auto">
          {/* Form Fields */}
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center border-b border-slate-100 pb-2">
              <label className="text-slate-500 w-16 text-sm font-medium">To:</label>
              <input
                type="email"
                {...register('to_email', { required: true })}
                readOnly
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 font-medium"
              />
            </div>
            
            <div className="flex items-center border-b border-slate-100 pb-2">
              <label className="text-slate-500 w-16 text-sm font-medium">Cc:</label>
              <input
                type="text"
                {...register('cc')}
                placeholder="Separate emails with commas"
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700"
              />
            </div>

            <div className="flex items-center border-b border-slate-100 pb-2">
              <label className="text-slate-500 w-16 text-sm font-medium">Subject:</label>
              <input
                type="text"
                {...register('subject', { required: true })}
                placeholder="Email subject"
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 font-medium placeholder-slate-300"
              />
            </div>
          </div>

          {/* Tiptap Editor */}
          <div className="px-6 flex-1 min-h-[250px] flex flex-col">
            <div className="border border-slate-200 rounded-xl overflow-hidden flex-1 flex flex-col focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              {editor && (
                <div className="bg-slate-50 border-b border-slate-200 p-2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded-md text-sm font-bold ${editor.isActive('bold') ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded-md text-sm italic ${editor.isActive('italic') ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-1.5 rounded-md text-sm ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    • List
                  </button>
                </div>
              )}
              <div className="p-4 flex-1 prose prose-sm sm:prose max-w-none prose-blue focus:outline-none overflow-y-auto min-h-[150px]">
                <EditorContent editor={editor} />
              </div>
            </div>
            
            <div className="text-right mt-1">
              <span className="text-xs text-slate-400">
                {editor ? editor.getText().length : 0} characters
              </span>
            </div>
          </div>

          {/* Attachments */}
          <div className="px-6 pb-4">
            <div
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <MdAttachFile className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">
                Drag and drop files here, or{' '}
                <label className="text-blue-600 font-medium cursor-pointer hover:underline">
                  browse
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Max {MAX_FILES} files, up to 10MB each.
              </p>
            </div>

            {attachments.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
                    <span className="text-slate-700 truncate max-w-[150px]">{att.filename}</span>
                    <span className="text-slate-400 text-xs">{(att.file.size / 1024 / 1024).toFixed(1)}MB</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-red-500 hover:text-red-700 ml-1"
                    >
                      <MdDelete className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>Sending...</>
              ) : (
                <>
                  <MdSend className="w-4 h-4" />
                  Send Email
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailComposeModal;
