import { defineStore } from "pinia";
import { ref, watch } from "vue";

export type LayoutType = "independent" | "one-main-three-sub" | "four-grid";

export interface TerminalInstance {
  id: string;
  name: string;
  color: string;
  history: string[];
  isActive: boolean;
  startupCommand?: string;
  cwd?: string;
  env?: Record<string, string>;
}

const STORAGE_KEY = "clistack_state";

export const useTerminalStore = defineStore("terminal", () => {
  const defaultTerminals: TerminalInstance[] = [
    { 
      id: "gemini", 
      name: "Gemini", 
      color: "#60a5fa", 
      history: [], 
      isActive: true,
      startupCommand: "gemini --yolo",
      cwd: "D:\\GoldRoot",
      env: {
        "HTTP_PROXY": "http://127.0.0.1:7890",
        "HTTPS_PROXY": "http://127.0.0.1:7890",
        "ALL_PROXY": "http://127.0.0.1:7890",
        "npm_config_loglevel": "silent"
      }
    },
    { id: "codex", name: "Codex", color: "#4ade80", history: [], isActive: false },
    { id: "claude", name: "ClaudeCode", color: "#fb923c", history: [], isActive: false },
    { id: "open", name: "OpenCode", color: "#a78bfa", history: [], isActive: false },
  ];

  // Load from localStorage and merge with defaults
  const savedState = localStorage.getItem(STORAGE_KEY);
  const initialState = savedState ? JSON.parse(savedState) : null;

  // Deep merge defaults to ensure new properties like startupCommand exist
  const mergedTerminals = defaultTerminals.map(def => {
    const saved = initialState?.terminals?.find((t: any) => t.id === def.id);
    if (saved) {
      return {
        ...def,
        ...saved,
        // Always prefer defaults for these structural properties if missing
        startupCommand: saved.startupCommand || def.startupCommand,
        cwd: saved.cwd || def.cwd,
        env: { ...def.env, ...saved.env }
      };
    }
    return def;
  });

  const terminals = ref<TerminalInstance[]>(mergedTerminals);
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
