import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Send,
  User,
  Sparkles,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  ZoomIn,
  Download,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Streamdown } from "streamdown";

/**
 * Attachment type for files uploaded in chat
 */
export type Attachment = {
  url: string;
  fileName: string;
  mimeType: string;
};

/**
 * Message type matching server-side LLM Message interface
 */
export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
  attachments?: Attachment[];
};

export type AIChatBoxProps = {
  messages: Message[];
  onSendMessage: (content: string, attachments?: Attachment[]) => void;
  onUploadFile?: (file: File) => Promise<Attachment>;
  isLoading?: boolean;
  isUploading?: boolean;
  placeholder?: string;
  className?: string;
  height?: string | number;
  emptyStateMessage?: string;
  suggestedPrompts?: string[];
};

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".gif", ".xlsx", ".xls", ".docx", ".doc"];

const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16 MB

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="size-4" />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return <FileSpreadsheet className="size-4" />;
  return <FileText className="size-4" />;
}

function getFileIconSmall(mimeType: string) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="size-3" />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return <FileSpreadsheet className="size-3" />;
  return <FileText className="size-3" />;
}

function isImageType(mimeType: string) {
  return mimeType.startsWith("image/");
}

/**
 * Image lightbox component for full-screen preview
 */
function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain shadow-2xl"
        />
        <div className="absolute -top-3 -right-3 flex gap-1">
          <a
            href={src}
            download={alt}
            className="rounded-full bg-background p-1.5 shadow-md hover:bg-accent transition-colors"
            title="Télécharger"
          >
            <Download className="size-4" />
          </a>
          <button
            onClick={onClose}
            className="rounded-full bg-background p-1.5 shadow-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
            title="Fermer"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-sm text-white/70">{alt}</p>
      </div>
    </div>
  );
}

/**
 * Image thumbnail component with click-to-zoom
 */
function ImageThumbnail({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [showLightbox, setShowLightbox] = useState(false);

  return (
    <>
      <div
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-md border",
          className
        )}
        onClick={() => setShowLightbox(true)}
      >
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
          <ZoomIn className="size-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
      </div>
      {showLightbox && (
        <ImageLightbox src={src} alt={alt} onClose={() => setShowLightbox(false)} />
      )}
    </>
  );
}

export function AIChatBox({
  messages,
  onSendMessage,
  onUploadFile,
  isLoading = false,
  isUploading = false,
  placeholder = "Type your message...",
  className,
  height = "600px",
  emptyStateMessage = "Start a conversation with AI",
  suggestedPrompts,
}: AIChatBoxProps) {
  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const displayMessages = messages.filter((msg) => msg.role !== "system");

  const [minHeightForLastMessage, setMinHeightForLastMessage] = useState(0);

  useEffect(() => {
    if (containerRef.current && inputAreaRef.current) {
      const containerHeight = containerRef.current.offsetHeight;
      const inputHeight = inputAreaRef.current.offsetHeight;
      const scrollAreaHeight = containerHeight - inputHeight;
      const userMessageReservedHeight = 56;
      const calculatedHeight = scrollAreaHeight - 32 - userMessageReservedHeight;
      setMinHeightForLastMessage(Math.max(0, calculatedHeight));
    }
  }, []);

  const scrollToBottom = () => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement;
    if (viewport) {
      requestAnimationFrame(() => {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
      });
    }
  };

  // Upload a single file
  const uploadFile = useCallback(
    async (file: File) => {
      if (!onUploadFile) return;

      // Check type by MIME or extension
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        return;
      }
      try {
        const attachment = await onUploadFile(file);
        setPendingAttachments((prev) => [...prev, attachment]);
      } catch (err) {
        console.error("Upload failed:", err);
      }
    },
    [onUploadFile]
  );

  // Handle file input change
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      await uploadFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;

      for (const file of Array.from(files)) {
        await uploadFile(file);
      }
    },
    [uploadFile]
  );

  // Paste handler (Ctrl+V / Cmd+V for images from clipboard)
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items || !onUploadFile) return;

      for (const item of Array.from(items)) {
        if (item.kind === "file") {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            // Give a meaningful name to pasted screenshots
            const ext = file.type.split("/")[1] || "png";
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
            const namedFile = new File([file], `screenshot-${timestamp}.${ext}`, {
              type: file.type,
            });
            await uploadFile(namedFile);
          }
        }
      }
    },
    [onUploadFile, uploadFile]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if ((!trimmedInput && pendingAttachments.length === 0) || isLoading || isUploading) return;

    const messageText =
      trimmedInput ||
      (pendingAttachments.length > 0
        ? `Analyse ce(s) document(s) : ${pendingAttachments.map((a) => a.fileName).join(", ")}`
        : "");
    onSendMessage(
      messageText,
      pendingAttachments.length > 0 ? [...pendingAttachments] : undefined
    );
    setInput("");
    setPendingAttachments([]);
    scrollToBottom();
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col bg-card text-card-foreground rounded-lg border shadow-sm relative",
        className
      )}
      style={{ height }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-40 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/5 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3 text-primary">
            <div className="rounded-full bg-primary/10 p-4">
              <Paperclip className="size-8" />
            </div>
            <p className="text-lg font-medium">Déposez vos fichiers ici</p>
            <p className="text-sm text-muted-foreground">
              PDF, images, Excel, Word (max 16 Mo)
            </p>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div ref={scrollAreaRef} className="flex-1 overflow-hidden">
        {displayMessages.length === 0 ? (
          <div className="flex h-full flex-col p-4">
            <div className="flex flex-1 flex-col items-center justify-center gap-6 text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <Sparkles className="size-12 opacity-20" />
                <p className="text-sm">{emptyStateMessage}</p>
              </div>

              {/* Drop zone hint */}
              {onUploadFile && (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-xs text-muted-foreground">
                  <Paperclip className="size-3.5" />
                  <span>
                    Glissez-déposez un fichier, collez une capture (Ctrl+V) ou utilisez le bouton trombone
                  </span>
                </div>
              )}

              {suggestedPrompts && suggestedPrompts.length > 0 && (
                <div className="flex max-w-2xl flex-wrap justify-center gap-2">
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => onSendMessage(prompt)}
                      disabled={isLoading}
                      className="rounded-lg border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="flex flex-col space-y-4 p-4">
              {displayMessages.map((message, index) => {
                const isLastMessage = index === displayMessages.length - 1;
                const shouldApplyMinHeight =
                  isLastMessage && !isLoading && minHeightForLastMessage > 0;

                const imageAttachments = message.attachments?.filter((a) =>
                  isImageType(a.mimeType)
                );
                const fileAttachments = message.attachments?.filter(
                  (a) => !isImageType(a.mimeType)
                );

                return (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-3",
                      message.role === "user"
                        ? "justify-end items-start"
                        : "justify-start items-start"
                    )}
                    style={
                      shouldApplyMinHeight
                        ? { minHeight: `${minHeightForLastMessage}px` }
                        : undefined
                    }
                  >
                    {message.role === "assistant" && (
                      <div className="size-8 shrink-0 mt-1 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="size-4 text-primary" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2.5",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {/* Image thumbnails */}
                      {imageAttachments && imageAttachments.length > 0 && (
                        <div
                          className={cn(
                            "grid gap-2 mb-2",
                            imageAttachments.length === 1
                              ? "grid-cols-1"
                              : imageAttachments.length === 2
                              ? "grid-cols-2"
                              : "grid-cols-2 sm:grid-cols-3"
                          )}
                        >
                          {imageAttachments.map((att, attIdx) => (
                            <ImageThumbnail
                              key={attIdx}
                              src={att.url}
                              alt={att.fileName}
                              className={cn(
                                "h-32 w-full",
                                message.role === "user"
                                  ? "border-primary-foreground/20"
                                  : "border-border"
                              )}
                            />
                          ))}
                        </div>
                      )}

                      {/* File attachments (non-image) */}
                      {fileAttachments && fileAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {fileAttachments.map((att, attIdx) => (
                            <a
                              key={attIdx}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors",
                                message.role === "user"
                                  ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
                                  : "bg-background/50 text-foreground hover:bg-background/80 border"
                              )}
                            >
                              {getFileIconSmall(att.mimeType)}
                              <span className="max-w-[180px] truncate">{att.fileName}</span>
                              <Download className="size-3 ml-1 opacity-60" />
                            </a>
                          ))}
                        </div>
                      )}

                      {message.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <Streamdown>{message.content}</Streamdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      )}
                    </div>

                    {message.role === "user" && (
                      <div className="size-8 shrink-0 mt-1 rounded-full bg-secondary flex items-center justify-center">
                        <User className="size-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div
                  className="flex items-start gap-3"
                  style={
                    minHeightForLastMessage > 0
                      ? { minHeight: `${minHeightForLastMessage}px` }
                      : undefined
                  }
                >
                  <div className="size-8 shrink-0 mt-1 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="size-4 text-primary" />
                  </div>
                  <div className="rounded-lg bg-muted px-4 py-2.5">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Pending Attachments Preview */}
      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-2 pb-1 border-t bg-background/30">
          {pendingAttachments.map((att, idx) => (
            <div key={idx} className="relative group">
              {isImageType(att.mimeType) ? (
                <div className="relative h-16 w-20 overflow-hidden rounded-md border bg-muted">
                  <img
                    src={att.url}
                    alt={att.fileName}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePendingAttachment(idx)}
                    className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive p-0.5 text-destructive-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-md border bg-muted px-2 py-1 text-xs text-foreground">
                  {getFileIcon(att.mimeType)}
                  <span className="max-w-[150px] truncate">{att.fileName}</span>
                  <button
                    type="button"
                    onClick={() => removePendingAttachment(idx)}
                    className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <form
        ref={inputAreaRef}
        onSubmit={handleSubmit}
        className="flex gap-2 p-4 border-t bg-background/50 items-end"
      >
        {/* File upload button */}
        {onUploadFile && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.xlsx,.xls,.docx,.doc"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              className="shrink-0 h-[38px] w-[38px]"
              title="Joindre un document (PDF, image, Excel, Word) — ou glissez-déposez / collez (Ctrl+V)"
            >
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Paperclip className="size-4" />
              )}
            </Button>
          </>
        )}

        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          className="flex-1 max-h-32 resize-none min-h-9"
          rows={1}
        />
        <Button
          type="submit"
          size="icon"
          disabled={
            (!input.trim() && pendingAttachments.length === 0) || isLoading || isUploading
          }
          className="shrink-0 h-[38px] w-[38px]"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
