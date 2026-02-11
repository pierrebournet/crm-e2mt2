import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { useState } from "react";
import { toast } from "sonner";

const SUGGESTED_PROMPTS = [
  "Quels sont les délais contractuels D1 et D2 pour une intervention C1 ?",
  "Quel est le prix BPU pour le remplacement d'un split-system ?",
  "Combien de lots géographiques couvre le contrat E2MT² ?",
  "Quelles sont les missions F prestations connexes ?",
  "Quelle est la différence entre maintenance préventive et corrective ?",
  "Quels sont les niveaux de criticité et leurs implications ?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);

  const askMutation = trpc.assistant.ask.useMutation({
    onSuccess: (result) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.answer },
      ]);
    },
    onError: (err) => {
      toast.error(`Erreur : ${err.message}`);
      // Remove the pending user message or add error message
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

  const handleSendMessage = (content: string) => {
    // Add user message to display
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content },
    ];
    setMessages(newMessages);

    // Build conversation history (only user/assistant, no system)
    const conversationHistory = newMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    // Send to backend (pass history minus the current question)
    askMutation.mutate({
      question: content,
      conversationHistory: conversationHistory.slice(0, -1),
    });
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Assistant IA — Contrat E2MT²</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Posez n'importe quelle question sur le contrat E2MT², le BPU, les délais contractuels, les types de travaux ou les règles de maintenance.
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <AIChatBox
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={askMutation.isPending}
          placeholder="Posez votre question sur le contrat E2MT² ou le BPU..."
          height="calc(100vh - 200px)"
          emptyStateMessage="Posez une question sur le contrat E2MT² ou le BPU"
          suggestedPrompts={SUGGESTED_PROMPTS}
        />
      </div>
    </div>
  );
}
