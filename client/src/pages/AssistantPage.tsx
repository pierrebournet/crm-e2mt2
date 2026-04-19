import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message, type Attachment } from "@/components/AIChatBox";
import { useState } from "react";
import { toast } from "sonner";

const SUGGESTED_PROMPTS = [
  "Quels sont les délais contractuels D1 et D2 pour une intervention C1 ?",
  "Quel est le prix BPU pour le remplacement d'un split-system ?",
  "Comment créer une demande d'achat (DA) dans l'ERP ?",
  "Quel groupe d'achat pour un devis de 35 000€ ?",
  "Comment fonctionne Connect'Immo V3 (projets, commandes) ?",
  "Quelles sont les 20 applications métier du pilote DIT ?",
  "Quel est le code BUPO pour la SA Voyageurs ?",
  "Quels sont les seuils de consultation pour les achats hors contrat ?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = trpc.assistant.uploadFile.useMutation();

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
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      const result = await uploadMutation.mutateAsync({
        fileBase64: base64,
        fileName: file.name,
        mimeType: file.type,
      });

      toast.success(`${file.name} uploadé`);
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
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    // Send to backend
    askMutation.mutate({
      question: content,
      conversationHistory: conversationHistory.slice(0, -1),
      attachments: attachments?.map(a => ({
        url: a.url,
        fileName: a.fileName,
        mimeType: a.mimeType,
      })),
    });
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Assistant IA — Contrat E2MT²</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Posez vos questions sur le contrat E2MT², le BPU, les procédures d'achat (DA/CDA), Connect'Immo, les 20 applications métier ou toute autre règle de maintenance. Vous pouvez aussi joindre des documents (PDF, images) pour analyse.
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <AIChatBox
          messages={messages}
          onSendMessage={handleSendMessage}
          onUploadFile={handleUploadFile}
          isLoading={askMutation.isPending}
          isUploading={isUploading}
          placeholder="Posez votre question ou joignez un document (PDF, image)..."
          height="calc(100vh - 200px)"
          emptyStateMessage="Posez une question ou joignez un document pour analyse"
          suggestedPrompts={SUGGESTED_PROMPTS}
        />
      </div>
    </div>
  );
}
