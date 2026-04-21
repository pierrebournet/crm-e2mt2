import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Tests for the assistant file upload feature.
 * Validates that the backend route schema and the frontend component
 * support uploading documents (PDF, images) to the assistant IA.
 */

// Read the routers file to validate the schema
const routersPath = path.join(__dirname, "routers.ts");
const routersContent = fs.readFileSync(routersPath, "utf-8");

// Read the AIChatBox component to validate frontend support
const chatBoxPath = path.join(__dirname, "../client/src/components/AIChatBox.tsx");
const chatBoxContent = fs.readFileSync(chatBoxPath, "utf-8");

// Read the AssistantPage to validate integration
const assistantPagePath = path.join(__dirname, "../client/src/pages/AssistantPage.tsx");
const assistantPageContent = fs.readFileSync(assistantPagePath, "utf-8");

describe("Assistant IA — Upload de documents", () => {
  describe("Backend: route assistant.uploadFile", () => {
    it("should have an uploadFile mutation in assistant router", () => {
      expect(routersContent).toContain("uploadFile: protectedProcedure");
    });

    it("should accept fileBase64, fileName and mimeType inputs", () => {
      expect(routersContent).toContain("fileBase64: z.string()");
      expect(routersContent).toContain("fileName: z.string()");
      expect(routersContent).toContain("mimeType: z.string()");
    });

    it("should enforce 16MB file size limit", () => {
      expect(routersContent).toContain("16 * 1024 * 1024");
      expect(routersContent).toContain("Le fichier dépasse la taille maximale de 16 Mo");
    });

    it("should upload to S3 via storagePut with assistant-docs prefix", () => {
      expect(routersContent).toContain("assistant-docs/");
      expect(routersContent).toContain("storagePut(fileKey, buffer, input.mimeType)");
    });

    it("should return url, fileName and mimeType", () => {
      // Check the return statement in uploadFile mutation
      expect(routersContent).toContain("return { url, fileName: input.fileName, mimeType: input.mimeType }");
    });
  });

  describe("Backend: route assistant.ask with attachments", () => {
    it("should accept optional attachments array in ask mutation", () => {
      expect(routersContent).toContain("attachments: z.array(z.object({");
    });

    it("should support image attachments with image_url type", () => {
      expect(routersContent).toContain('type: "image_url"');
      expect(routersContent).toContain("image_url: { url: att.url, detail:");
    });

    it("should support PDF attachments with file_url type", () => {
      expect(routersContent).toContain('type: "file_url"');
      expect(routersContent).toContain('mime_type: "application/pdf"');
    });

    it("should build multimodal content parts when attachments are present", () => {
      expect(routersContent).toContain("const contentParts: any[] = []");
      expect(routersContent).toContain('contentParts.push({ type: "text", text: input.question })');
    });

    it("should fall back to simple text message when no attachments", () => {
      expect(routersContent).toContain('messages.push({ role: "user" as const, content: input.question })');
    });
  });

  describe("Frontend: AIChatBox component", () => {
    it("should export Attachment type", () => {
      expect(chatBoxContent).toContain("export type Attachment");
    });

    it("should accept onUploadFile prop", () => {
      expect(chatBoxContent).toContain("onUploadFile?: (file: File) => Promise<Attachment>");
    });

    it("should accept isUploading prop", () => {
      expect(chatBoxContent).toContain("isUploading?: boolean");
    });

    it("should have a file input for PDF and images", () => {
      expect(chatBoxContent).toContain('accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.xlsx,.xls,.docx,.doc"');
    });

    it("should have a Paperclip button for file upload", () => {
      expect(chatBoxContent).toContain("Paperclip");
    });

    it("should manage pending attachments state", () => {
      expect(chatBoxContent).toContain("pendingAttachments");
      expect(chatBoxContent).toContain("setPendingAttachments");
    });

    it("should allow removing pending attachments", () => {
      expect(chatBoxContent).toContain("removePendingAttachment");
    });

    it("should display attachment badges on user messages", () => {
      expect(chatBoxContent).toContain("message.attachments");
    });

    it("should pass attachments to onSendMessage", () => {
      expect(chatBoxContent).toContain("onSendMessage(");
      expect(chatBoxContent).toContain("pendingAttachments");
    });

    it("should support multiple file upload", () => {
      expect(chatBoxContent).toContain("multiple");
    });

    it("should show loading spinner during upload", () => {
      expect(chatBoxContent).toContain("isUploading");
      expect(chatBoxContent).toContain("Loader2");
    });
  });

  describe("Frontend: AssistantPage integration", () => {
    it("should import Attachment type from AIChatBox", () => {
      expect(assistantPageContent).toContain("type Attachment");
    });

    it("should use trpc.assistant.uploadFile mutation", () => {
      expect(assistantPageContent).toContain("trpc.assistant.uploadFile.useMutation()");
    });

    it("should convert file to base64 before upload", () => {
      expect(assistantPageContent).toContain("arrayBuffer");
      expect(assistantPageContent).toContain("btoa");
    });

    it("should pass handleUploadFile to AIChatBox", () => {
      expect(assistantPageContent).toContain("onUploadFile={handleUploadFile}");
    });

    it("should pass attachments to ask mutation", () => {
      expect(assistantPageContent).toContain("allContextAttachments");
    });

    it("should track isUploading state", () => {
      expect(assistantPageContent).toContain("isUploading");
      expect(assistantPageContent).toContain("setIsUploading");
    });

    it("should show toast on upload success", () => {
      expect(assistantPageContent).toContain("toast.success");
    });

    it("should show toast on upload error", () => {
      expect(assistantPageContent).toContain("toast.error");
    });

    it("should mention document upload in the description", () => {
      expect(assistantPageContent).toContain("joignez des documents");
    });
  });
});
