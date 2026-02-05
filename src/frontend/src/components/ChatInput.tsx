import React, { useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { AttachedFile } from '../types';
import './styles/ChatInput.css';

export interface ChatInputHandle {
    focus: () => void;
}

interface ChatInputProps {
    onSend: (message: string, files: AttachedFile[]) => void;
    disabled?: boolean;
    placeholder?: string;
    enableFileUpload?: boolean;
}

/**
 * Chat input component with file attachment support
 * Supports drag-and-drop and file picker
 */
export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(
    ({ onSend, disabled = false, placeholder = 'Type a message...', enableFileUpload = true }, ref) => {
        const [message, setMessage] = useState('');
        const [files, setFiles] = useState<AttachedFile[]>([]);
        const [isDragging, setIsDragging] = useState(false);
        const inputRef = useRef<HTMLTextAreaElement>(null);
        const fileInputRef = useRef<HTMLInputElement>(null);

        // Expose focus method to parent
        useImperativeHandle(ref, () => ({
            focus: () => {
                inputRef.current?.focus();
            },
        }));

        const generateId = () => Math.random().toString(36).substring(7);

        const processFile = (file: File): AttachedFile => {
            const attached: AttachedFile = {
                id: generateId(),
                name: file.name,
                type: file.type,
                size: file.size,
                file,
            };

            // Generate preview for images
            if (file.type.startsWith('image/')) {
                attached.preview = URL.createObjectURL(file);
            }

            return attached;
        };

        const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
            if (!selectedFiles) return;

            const newFiles = Array.from(selectedFiles).map(processFile);
            setFiles((prev) => [...prev, ...newFiles]);
        }, []);

        const handleRemoveFile = (fileId: string) => {
            setFiles((prev) => {
                const file = prev.find((f) => f.id === fileId);
                if (file?.preview) {
                    URL.revokeObjectURL(file.preview);
                }
                return prev.filter((f) => f.id !== fileId);
            });
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!message.trim() && files.length === 0) return;
            if (disabled) return;

            onSend(message.trim(), files);
            setMessage('');
            setFiles([]);
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
            }
        };

        const handleDragOver = (e: React.DragEvent) => {
            e.preventDefault();
            if (enableFileUpload) {
                setIsDragging(true);
            }
        };

        const handleDragLeave = (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
        };

        const handleDrop = (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            if (enableFileUpload) {
                handleFileSelect(e.dataTransfer.files);
            }
        };

        const formatFileSize = (bytes: number): string => {
            if (bytes < 1024) return `${bytes} B`;
            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        };

        return (
            <form
                className={`chat-input ${isDragging ? 'chat-input--dragging' : ''}`}
                onSubmit={handleSubmit}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* File previews */}
                {files.length > 0 && (
                    <div className="chat-input-files">
                        {files.map((file) => (
                            <div key={file.id} className="chat-input-file">
                                {file.preview ? (
                                    <img src={file.preview} alt={file.name} className="file-thumbnail" />
                                ) : (
                                    <span className="file-icon-large">📄</span>
                                )}
                                <div className="file-info">
                                    <span className="file-name">{file.name}</span>
                                    <span className="file-size">{formatFileSize(file.size)}</span>
                                </div>
                                <button
                                    type="button"
                                    className="file-remove"
                                    onClick={() => handleRemoveFile(file.id)}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="chat-input-row">
                    {enableFileUpload && (
                        <>
                            <button
                                type="button"
                                className="chat-input-attach"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={disabled}
                                title="Attach file"
                            >
                                📎
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="chat-input-file-input"
                                multiple
                                accept="image/*,.pdf,.doc,.docx,.txt"
                                onChange={(e) => handleFileSelect(e.target.files)}
                            />
                        </>
                    )}

                    <textarea
                        ref={inputRef}
                        className="chat-input-textarea"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={1}
                    />

                    <button
                        type="submit"
                        className="chat-input-send"
                        disabled={disabled || (!message.trim() && files.length === 0)}
                    >
                        <span className="send-icon">➤</span>
                    </button>
                </div>

                {isDragging && (
                    <div className="chat-input-drop-overlay">
                        <span>Drop files here</span>
                    </div>
                )}
            </form>
        );
    });

ChatInput.displayName = 'ChatInput';
