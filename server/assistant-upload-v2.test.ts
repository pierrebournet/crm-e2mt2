import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const chatBoxContent = readFileSync(
  join(__dirname, "../client/src/components/AIChatBox.tsx"),
  "utf-8"
);

const assistantPageContent = readFileSync(
  join(__dirname, "../client/src/pages/AssistantPage.tsx"),
  "utf-8"
);

const routersContent = readFileSync(
  join(__dirname, "./routers.ts"),
  "utf-8"
);

describe("Assistant IA — Améliorations Upload V2", () => {
  describe("Drag & Drop", () => {
    it("should have drag enter handler", () => {
      expect(chatBoxContent).toContain("handleDragEnter");
      expect(chatBoxContent).toContain("onDragEnter");
    });

    it("should have drag leave handler", () => {
      expect(chatBoxContent).toContain("handleDragLeave");
      expect(chatBoxContent).toContain("onDragLeave");
    });

    it("should have drag over handler", () => {
      expect(chatBoxContent).toContain("handleDragOver");
      expect(chatBoxContent).toContain("onDragOver");
    });

    it("should have drop handler", () => {
      expect(chatBoxContent).toContain("handleDrop");
      expect(chatBoxContent).toContain("onDrop");
    });

    it("should track drag over state", () => {
      expect(chatBoxContent).toContain("isDragOver");
      expect(chatBoxContent).toContain("setIsDragOver");
    });

    it("should show drag overlay when dragging files", () => {
      expect(chatBoxContent).toContain("Déposez vos fichiers ici");
    });

    it("should use drag counter to prevent flickering", () => {
      expect(chatBoxContent).toContain("dragCounterRef");
    });
  });

  describe("Paste (Ctrl+V) support", () => {
    it("should have paste handler on textarea", () => {
      expect(chatBoxContent).toContain("handlePaste");
      expect(chatBoxContent).toContain("onPaste");
    });

    it("should detect clipboard items", () => {
      expect(chatBoxContent).toContain("clipboardData");
    });

    it("should name pasted screenshots with timestamp", () => {
      expect(chatBoxContent).toContain("screenshot-");
    });

    it("should handle file kind items from clipboard", () => {
      expect(chatBoxContent).toContain("item.kind === \"file\"");
      expect(chatBoxContent).toContain("getAsFile");
    });
  });

  describe("Image Lightbox (zoom preview)", () => {
    it("should have ImageLightbox component", () => {
      expect(chatBoxContent).toContain("function ImageLightbox");
    });

    it("should have ImageThumbnail component", () => {
      expect(chatBoxContent).toContain("function ImageThumbnail");
    });

    it("should close lightbox on Escape key", () => {
      expect(chatBoxContent).toContain("Escape");
    });

    it("should have zoom icon on hover", () => {
      expect(chatBoxContent).toContain("ZoomIn");
    });

    it("should have download button in lightbox", () => {
      expect(chatBoxContent).toContain("Download");
    });

    it("should close lightbox on backdrop click", () => {
      expect(chatBoxContent).toContain("onClick={onClose}");
    });
  });

  describe("File format support", () => {
    it("should support PDF files", () => {
      expect(chatBoxContent).toContain("application/pdf");
    });

    it("should support image files", () => {
      expect(chatBoxContent).toContain("image/jpeg");
      expect(chatBoxContent).toContain("image/png");
      expect(chatBoxContent).toContain("image/webp");
    });

    it("should support Excel files", () => {
      expect(chatBoxContent).toContain(".xlsx");
      expect(chatBoxContent).toContain(".xls");
    });

    it("should support Word files", () => {
      expect(chatBoxContent).toContain(".docx");
      expect(chatBoxContent).toContain(".doc");
    });

    it("should have 16MB file size limit", () => {
      expect(chatBoxContent).toContain("16 * 1024 * 1024");
    });

    it("should have file type icons for different formats", () => {
      expect(chatBoxContent).toContain("FileText");
      expect(chatBoxContent).toContain("FileSpreadsheet");
      expect(chatBoxContent).toContain("ImageIcon");
    });
  });

  describe("Document history (AssistantPage)", () => {
    it("should track all uploaded documents across conversation", () => {
      expect(assistantPageContent).toContain("allUploadedDocs");
    });

    it("should use useMemo for document tracking", () => {
      expect(assistantPageContent).toContain("useMemo");
    });

    it("should display uploaded documents panel", () => {
      expect(assistantPageContent).toContain("Documents dans cette conversation");
    });

    it("should deduplicate documents by URL", () => {
      expect(assistantPageContent).toContain("docs.some((d) => d.url === att.url)");
    });

    it("should send all context attachments to backend", () => {
      expect(assistantPageContent).toContain("allContextAttachments");
    });

    it("should include previously uploaded docs in context", () => {
      expect(assistantPageContent).toContain("allUploadedDocs");
    });
  });

  describe("Analyze Devis button", () => {
    it("should have handleAnalyzeDevis function", () => {
      expect(assistantPageContent).toContain("handleAnalyzeDevis");
    });

    it("should show Analyser devis button for PDF files", () => {
      expect(assistantPageContent).toContain("Analyser devis");
    });

    it("should only show analyze button for PDF mime type", () => {
      expect(assistantPageContent).toContain('doc.mimeType === "application/pdf"');
    });

    it("should send BPU comparison prompt when analyzing devis", () => {
      expect(assistantPageContent).toContain("Compare les prix avec le BPU contractuel");
    });
  });

  describe("Clear conversation", () => {
    it("should have clear conversation button", () => {
      expect(assistantPageContent).toContain("handleClearConversation");
    });

    it("should show Effacer button", () => {
      expect(assistantPageContent).toContain("Effacer");
    });

    it("should use Trash2 icon", () => {
      expect(assistantPageContent).toContain("Trash2");
    });
  });

  describe("Backend: file type handling", () => {
    it("should handle image attachments with image_url", () => {
      expect(routersContent).toContain('type: "image_url"');
    });

    it("should handle PDF attachments with file_url", () => {
      expect(routersContent).toContain('type: "file_url"');
    });

    it("should handle other file types as text references", () => {
      expect(routersContent).toContain("[Document joint :");
    });
  });
});
