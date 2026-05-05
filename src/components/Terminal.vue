<template>
  <div class="flex flex-col h-full bg-[#1e1e1e] rounded-lg overflow-hidden border border-[#333]">
    <div class="flex items-center justify-between px-3 py-2 bg-[#252525] border-b border-[#333]">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: color }"></div>
        <span class="text-xs font-bold text-[#d4d4d4]">{{ name }}</span>
      </div>
      <div class="flex items-center gap-3">
        <button @click="showHistory = true" class="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
          <History :size="12" /> 历史命令
        </button>
        <button @click="clearTerminal" class="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
          <Trash2 :size="12" /> 清空
        </button>
        <button class="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
          <Settings :size="12" /> 设置
        </button>
      </div>
    </div>
    <div ref="terminalElement" class="flex-1 overflow-hidden p-2"></div>
    <div class="p-2 bg-[#1e1e1e] border-t border-[#333] flex items-center gap-2">
      <span class="text-[#4ade80] text-sm font-mono">{{ name.toLowerCase() }}$</span>
      <input
        v-model="inputCommand"
        @keyup.enter="handleCommand"
        @keydown.up="prevHistory"
        @keydown.down="nextHistory"
        class="flex-1 bg-transparent border-none outline-none text-sm font-mono text-[#d4d4d4]"
        placeholder="输入命令..."
      />
    </div>

    <!-- History Popup -->
    <n-modal v-model:show="showHistory" preset="card" title="历史命令" class="w-[400px] bg-[#252525]">
      <div class="max-h-[300px] overflow-y-auto">
        <div
          v-for="(cmd, index) in history"
          :key="index"
          @dblclick="selectHistory(cmd)"
          class="p-2 hover:bg-[#333] cursor-pointer text-sm font-mono border-b border-[#333] last:border-none"
        >
          {{ cmd }}
        </div>
        <div v-if="history.length === 0" class="p-4 text-center text-gray-500 text-sm">
          无历史记录
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { History, Trash2, Settings } from "lucide-vue-next";
import { NModal } from "naive-ui";
import { useTerminalStore } from "../store/useTerminalStore";

const props = defineProps<{
  id: string;
  name: string;
  color: string;
}>();

const terminalElement = ref<HTMLElement | null>(null);
const inputCommand = ref("");
const showHistory = ref(false);
const terminalStore = useTerminalStore();

let term: Terminal;
let fitAddon: FitAddon;
let unlisten: () => void;

const history = ref<string[]>([]);
const historyIndex = ref(-1);

onMounted(async () => {
  console.log("Terminal mounted:", props.id);
  
  term = new Terminal({
    theme: {
      background: "#1e1e1e",
      foreground: "#d4d4d4",
      cursor: "#d4d4d4",
    },
    fontFamily: "JetBrains Mono, Fira Code, monospace",
    fontSize: 13,
    convertEol: true,
  });

  fitAddon = new FitAddon();
  term.loadAddon(fitAddon);

  if (terminalElement.value) {
    term.open(terminalElement.value);
    fitAddon.fit();
  }

  // Check if running in Tauri
  const isTauri = !!(window as any).__TAURI_INTERNALS__;
  console.log("Is Tauri environment:", isTauri);

  if (isTauri) {
    try {
      unlisten = await listen(`term-out-${props.id}`, (event) => {
        term.write(event.payload as string);
      });
      console.log(`Listening for term-out-${props.id}`);
    } catch (e) {
      console.error("Failed to setup Tauri listener:", e);
      term.write(`\r\n\x1b[31mError: Failed to setup Tauri listener. ${e}\x1b[0m\r\n`);
    }
  } else {
    term.write("\r\n\x1b[33mWarning: Running in browser mode. CLI execution is disabled.\x1b[0m\r\n");
  }

  window.addEventListener("resize", () => fitAddon.fit());

  // Load history from store
  const t = terminalStore.terminals.find((p) => p.id === props.id);
  if (t) history.value = t.history;
});

onBeforeUnmount(() => {
  if (unlisten) unlisten();
  window.removeEventListener("resize", () => fitAddon.fit());
});

const handleCommand = async () => {
  const cmd = inputCommand.value.trim();
  if (!cmd) return;

  term.write(`\r\n\x1b[32m${props.name.toLowerCase()}$\x1b[0m ${cmd}\r\n`);
  
  try {
    await invoke("run_command", { id: props.id, command: cmd });
    terminalStore.addHistory(props.id, cmd);
    history.value = terminalStore.terminals.find(t => t.id === props.id)?.history || [];
  } catch (e) {
    term.write(`\r\n\x1b[31mError: ${e}\x1b[0m\r\n`);
  }

  inputCommand.value = "";
  historyIndex.value = -1;
};

const clearTerminal = () => {
  term.clear();
};

const selectHistory = (cmd: string) => {
  inputCommand.value = cmd;
  showHistory.value = false;
};

const prevHistory = () => {
  if (history.value.length === 0) return;
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++;
    inputCommand.value = history.value[historyIndex.value];
  }
};

const nextHistory = () => {
  if (historyIndex.value > 0) {
    historyIndex.value--;
    inputCommand.value = history.value[historyIndex.value];
  } else if (historyIndex.value === 0) {
    historyIndex.value = -1;
    inputCommand.value = "";
  }
};
</script>

<style scoped>
:deep(.xterm-viewport) {
  background-color: #1e1e1e !important;
}
</style>
