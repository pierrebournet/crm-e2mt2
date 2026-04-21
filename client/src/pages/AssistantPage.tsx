import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message, type Attachment } from "@/components/AIChatBox";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUGGESTED_PROMPTS = [
  "Quels sont les délais contractuels D1 et D2 pour une intervention C1 ?",
  "Quel est le prix BPU pour le remplacement d'un split-system ?",
  "Comment créer une demande d'achat (DA) dans l'ERP ?",
  "Quel groupe d'achat pour un devis de 35 000€ ?",
  "Comment fonctionne Connect'Immo V3 (projets, commandes) ?",
  "Quelles sont les 20 applications métier du pilote DIT ?",
  "Comment préparer un COSUI selon le Guide du Pilote ?",
  "Quelles sont les fiches pratiques FP01 à FP12 du Guide du Pilote ?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = trpc.assistant.uploadFile.useMutation();

  // Track all uploaded documents across the conversation for context persistence
  const allUploadedDocs = useMemo(() => {
    const docs: Attachment[] = [];
    for (const msg of messages) {
      if (msg.attachments) {
        for (const att of msg.attachments) {
          if (!docs.some((d) => d.url === att.url)) {
            docs.push(att);
          }
        }
      }
    }
    return docs;
  }, [messages]);

  const askMutation = trpc.assistant.ask.useMutation({
    onSuccess: (result) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.answer },
      ]);
    },
    onError: (err) => {
      toast.error(`Erreur : ${err.message}`);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Désolé, une erreur s'est produite lors du traitement de votre question. Veuillez réessayer.",
        },
      ]);
    },
  });

  const handleUploadFile = async (file: File): Promise<Attachment> => {
    setIsUploading(true);
    try {
      // Convert file to base64
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      const result = await uploadMutation.mutateAsync({
        fileBase64: base64,
        fileName: file.name,
        mimeType: file.type,
      });

      toast.success(`${file.name} uploadé avec succès`);
      return {
        url: result.url,
        fileName: result.fileName,
        mimeType: result.mimeType,
      };
    } catch (err: any) {
      toast.error(`Erreur upload : ${err.message}`);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = (content: string, attachments?: Attachment[]) => {
    // Add user message to display (with attachments info)
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content, attachments },
    ];
    setMessages(newMessages);

    // Build conversation history (only user/assistant, no system)
    const conversationHistory = newMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // Include all previously uploaded documents as context for the LLM
    // This ensures the AI remembers documents from earlier in the conversation
    const allContextAttachments: { url: string; fileName: string; mimeType: string }[] = [];

    // Add current message attachments first
    if (attachments) {
      for (const att of attachments) {
        allContextAttachments.push({
          url: att.url,
          fileName: att.fileName,
          mimeType: att.mimeType,
        });
      }
    }

    // Add previously uploaded docs that aren't in current attachments
    for (const doc of allUploadedDocs) {
      if (!allContextAttachments.some((a) => a.url === doc.url)) {
        allContextAttachments.push({
          url: doc.url,
          fileName: doc.fileName,
          mimeType: doc.mimeType,
        });
      }
    }

    // Send to backend
    askMutation.mutate({
      question: content,
      conversationHistory: conversationHistory.slice(0, -1),
      attachments:
        allContextAttachments.length > 0 ? allContextAttachments : undefined,
    });
  };

  // Quick action: analyze a previously uploaded document as a devis
  const handleAnalyzeDevis = (doc: Attachment) => {
    const prompt = `Analyse ce devis en détail : ${doc.fileName}. Compare les prix avec le BPU contractuel Equans. Vérifie les taux horaires MO, les coefficients FO/SST, la TVA, et signale tout écart.`;
    handleSendMessage(prompt, [doc]);
  };

  const handleClearConversation = () => {
    setMessages([]);
    toast.success("Conversation effacée");
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Assistant IA — Contrat E2MT²
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Posez vos questions sur le contrat, le BPU, les procédures, Connect'Immo, le Guide du Pilote ou joignez des documents pour analyse. Glissez-déposez ou collez (Ctrl+V) vos fichiers.
          </p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearConversation}
            className="shrink-0 text-muted-foreground"
          >
            <Trash2 className="size-3.5 mr-1.5" />
            Effacer
          </Button>
        )}
      </div>

      {/* Uploaded documents sidebar (shows when docs exist) */}
      {allUploadedDocs.length > 0 && (
        <div className="rounded-lg border bg-muted/30 px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Documents dans cette conversation ({allUploadedDocs.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {allUploadedDocs.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs"
              >
                {doc.mimeType.startsWith("image/") ? (
                  <img
                    src={doc.url}
                    alt={doc.fileName}
                    className="size-5 rounded object-cover"
                  />
                ) : (
                  <FileText className="size-3.5 text-muted-foreground" />
                )}
                <span className="max-w-[120px] truncate">{doc.fileName}</span>
                {doc.mimeType === "application/pdf" && (
                  <button
                    onClick={() => handleAnalyzeDevis(doc)}
                    disabled={askMutation.isPending}
                    className="ml-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                    title="Analyser ce document comme un devis"
                  >
                    Analyser devis
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <AIChatBox
          messages={messages}
          onSendMessage={handleSendMessage}
          onUploadFile={handleUploadFile}
          isLoading={askMutation.isPending}
          isUploading={isUploading}
          placeholder="Posez votre question, glissez un fichier ou collez une capture (Ctrl+V)..."
          height={allUploadedDocs.length > 0 ? "calc(100vh - 290px)" : "calc(100vh - 200px)"}
          emptyStateMessage="Posez une question ou joignez un document pour analyse"
          suggestedPrompts={SUGGESTED_PROMPTS}
        />
      </div>
    </div>
  );
}
