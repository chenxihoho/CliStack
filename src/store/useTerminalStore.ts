import { defineStore } from "pinia";
import { ref } from "vue";

export type LayoutType = "independent" | "one-main-three-sub" | "four-grid";

export interface TerminalInstance {
  id: string;
  name: string;
  color: string;
  history: string[];
  isActive: boolean;
}

export const useTerminalStore = defineStore("terminal", () => {
  const terminals = ref<TerminalInstance[]>([
    { id: "codex", name: "Codex", color: "#4ade80", history: [], isActive: true },
    { id: "gemini", name: "Gemini", color: "#60a5fa", history: [], isActive: false },
    { id: "claude", name: "ClaudeCode", color: "#fb923c", history: [], isActive: false },
    { id: "open", name: "OpenCode", color: "#a78bfa", history: [], isActive: false },
  ]);

  const activeLayout = ref<LayoutType>("four-grid");
  const activeTabId = ref("codex");

  const addHistory = (id: string, command: string) => {
    const term = terminals.value.find((t) => t.id === id);
    if (term && command.trim()) {
      // Remove duplicate and add to front
      term.history = [command, ...term.history.filter((c) => c !== command)].slice(0, 50);
    }
  };

  return {
    terminals,
    activeLayout,
    activeTabId,
    addHistory,
  };
});
