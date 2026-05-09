import { Sparkles } from "lucide-react";

type AssistantItem = {
  title: string;
  summary: string;
  recommendedAction: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  sourceData: string[];
};

function confidenceTone(confidence: AssistantItem["confidence"]) {
  if (confidence === "HIGH") return "text-emerald-600 dark:text-emerald-300";
  if (confidence === "MEDIUM") return "text-amber-600 dark:text-amber-300";
  return "text-zinc-500 dark:text-zinc-400";
}

export function AiAssistantPanel({
  title = "AI Assistant (Mock Intelligence)",
  items,
}: {
  title?: string;
  items: AssistantItem[];
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-300" />
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">{title}</h2>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={item.title}
            className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <p className="text-sm font-semibold text-zinc-950 dark:text-white">{item.title}</p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">{item.summary}</p>
            <p className="mt-2 text-xs font-medium text-sky-700 dark:text-sky-300">
              Aksi: {item.recommendedAction}
            </p>
            <p className={`mt-2 text-[11px] font-medium ${confidenceTone(item.confidence)}`}>
              Confidence: {item.confidence}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              Source: {item.sourceData.join(", ")}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

