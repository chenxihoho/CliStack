import { defineStore } from "pinia";
import { ref, watch } from "vue";

export type LayoutType = "independent" | "one-main-three-sub" | "four-grid";

export interface TerminalInstance {
  id: string;
  name: string;
  color: string;
  history: string[];
  isActive: boolean;
}

const STORAGE_KEY = "clistack_state";

export const useTerminalStore = defineStore("terminal", () => {
  const defaultTerminals: TerminalInstance[] = [
    { id: "codex", name: "Codex", color: "#4ade80", history: [], isActive: true },
    { id: "gemini", name: "Gemini", color: "#60a5fa", history: [], isActive: false },
    { id: "claude", name: "ClaudeCode", color: "#fb923c", history: [], isActive: false },
    { id: "open", name: "OpenCode", color: "#a78bfa", history: [], isActive: false },
  ];

  // Load from localStorage
  const savedState = localStorage.getItem(STORAGE_KEY);
  const initialState = savedState ? JSON.parse(savedState) : null;

  const terminals = ref<TerminalInstance[]>(initialState?.terminals || defaultTerminals);
  const activeLayout = ref<LayoutType>(initialState?.activeLayout || "four-grid");
  const activeTabId = ref(initialState?.activeTabId || "codex");

  // Persist state on changes
  watch([terminals, activeLayout, activeTabId], () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      terminals: terminals.value,
      activeLayout: activeLayout.value,
      activeTabId: activeTabId.value,
    }));
  }, { deep: true });

  const addHistory = (id: string, command: string) => {
    const term = terminals.value.find((t) => t.id === id);
    if (term && command.trim()) {
      term.history = [command, ...term.history.filter((c) => c !== command)].slice(0, 50);
    }
  };

  const updateTerminalOrder = (newOrder: TerminalInstance[]) => {
    terminals.value = newOrder;
  };

  return {
    terminals,
    activeLayout,
    activeTabId,
    addHistory,
    updateTerminalOrder,
  };
});
