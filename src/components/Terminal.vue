<template>
  <div class="flex flex-col h-full bg-[#1e1e1e] rounded-lg overflow-hidden border border-[#333]">
    <!-- Drag Handle / Title -->
    <div class="drag-handle flex items-center justify-between px-3 py-1.5 bg-[#252525] border-b border-[#333] cursor-move select-none" draggable="false">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: color }"></div>
        <span class="text-[10px] font-bold text-[#d4d4d4] uppercase tracking-wider">{{ name }}</span>
      </div>
    </div>

    <!-- Terminal Area -->
    <div ref="terminalElement" class="flex-1 overflow-hidden p-2"></div>

    <!-- Bottom Toolbar -->
    <div class="flex items-center justify-between px-3 py-1.5 bg-[#181818] border-t border-[#333]">
      <div class="flex items-center gap-4">
        <button @click="showHistory = true" class="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors outline-none transform-none">
          <History :size="12" /> 历史命令
        </button>
        <button @click="clearTerminal" class="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors outline-none transform-none">
          <Trash2 :size="12" /> 清空
        </button>
        <button class="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors outline-none transform-none">
          <Settings :size="12" /> 设置
        </button>
      </div>
      <div class="text-[10px] font-mono text-gray-600">
        {{ currentInput.length > 0 ? 'TYPING...' : 'READY' }}
      </div>
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
const showHistory = ref(false);
const terminalStore = useTerminalStore();

let term: Terminal;
let fitAddon: FitAddon;
let unlisten: () => void;

const history = ref<string[]>([]);
const currentInput = ref("");

onMounted(async () => {
  const config = terminalStore.terminals.find(t => t.id === props.id);

  term = new Terminal({
    theme: {
      background: "#1e1e1e",
      foreground: "#d4d4d4",
      cursor: "#d4d4d4",
      selectionBackground: "#333",
    },
    fontFamily: "JetBrains Mono, Fira Code, monospace",
    fontSize: 13,
    convertEol: true,
    cursorBlink: true,
  });

  fitAddon = new FitAddon();
  term.loadAddon(fitAddon);

  if (terminalElement.value) {
    term.open(terminalElement.value);
    fitAddon.fit();
  }

  // Handle direct data input
  term.onData(async (data) => {
    const isTauri = !!(window as any).__TAURI_INTERNALS__;
    if (!isTauri) return;

    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      if (char === "\r") { // Enter
        const cmd = currentInput.value;
        term.write("\r\n");
        if (cmd.trim()) {
          await sendCommand(cmd);
          terminalStore.addHistory(props.id, cmd);
          history.value = terminalStore.terminals.find(t => t.id === props.id)?.history || [];
        } else {
            await sendCommand("");
        }
        currentInput.value = "";
      } else if (char === "\x7f") { // Backspace
        if (currentInput.value.length > 0) {
          currentInput.value = currentInput.value.slice(0, -1);
          term.write("\b \b");
        }
      } else if (char === "\x03") { // Ctrl+C
        term.write("^C\r\n");
        currentInput.value = "";
      } else {
        const code = char.charCodeAt(0);
        if (code >= 32 && code <= 126) {
          currentInput.value += char;
          term.write(char);
        }
      }
    }
  });

  const isTauri = !!(window as any).__TAURI_INTERNALS__;
  if (isTauri) {
    unlisten = await listen(`term-out-${props.id}`, (event) => {
      term.write(event.payload as string);
    });

    if (config?.startupCommand) {
      term.write(`\x1b[34m[CliStack] Starting ${props.name} via "${config.startupCommand}"...\x1b[0m\r\n`);
      await sendCommand(config.startupCommand);
    } else {
      term.write(`\r\n\x1b[32m${props.name.toLowerCase()}$\x1b[0m `);
    }
  } else {
    term.write("\r\n\x1b[33m[CliStack] Warning: Running in browser mode. CLI disabled.\x1b[0m\r\n");
    term.write(`\x1b[32m${props.name.toLowerCase()}$\x1b[0m `);
  }

  window.addEventListener("resize", () => fitAddon.fit());
  if (config) history.value = config.history;
});

const sendCommand = async (cmd: string) => {
  const config = terminalStore.terminals.find(t => t.id === props.id);
  try {
    await invoke("run_command", { 
      id: props.id, 
      command: cmd,
      cwd: config?.cwd,
      env: config?.env
    });
  } catch (e) {
    term.write(`\r\n\x1b[31mError: ${e}\x1b[0m\r\n`);
  }
};

const clearTerminal = () => {
  term.clear();
  term.write(`\r\x1b[32m${props.name.toLowerCase()}$\x1b[0m `);
};

const selectHistory = (cmd: string) => {
  for (let i = 0; i < currentInput.value.length; i++) {
    term.write("\b \b");
  }
  currentInput.value = cmd;
  term.write(cmd);
  showHistory.value = false;
};

onBeforeUnmount(() => {
  if (unlisten) unlisten();
  window.removeEventListener("resize", () => fitAddon.fit());
});
</script>

<style scoped>
:deep(.xterm-viewport) {
  background-color: #1e1e1e !important;
}
</style>
