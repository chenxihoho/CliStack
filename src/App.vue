<template>
  <div class="flex h-screen bg-[#1e1e1e] text-[#d4d4d4] overflow-hidden">
    <Sidebar />

    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top Bar / Tabs -->
      <div class="h-12 bg-[#181818] border-b border-[#333] flex items-center px-4 gap-2 select-none">
        <div class="flex items-center gap-1">
          <div
            v-for="term in terminalStore.terminals"
            :key="term.id"
            @click="terminalStore.activeTabId = term.id"
            :class="[
              'flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors text-xs border border-transparent',
              terminalStore.activeTabId === term.id ? 'bg-[#2a2a2a] border-[#444] text-white' : 'text-gray-500 hover:text-gray-300'
            ]"
          >
            <div class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: term.color }"></div>
            <span>{{ term.name }}</span>
            <X :size="12" class="opacity-0 group-hover:opacity-100 hover:bg-[#444] rounded" />
          </div>
          <Plus :size="16" class="ml-2 text-gray-500 cursor-pointer hover:text-white transition-colors" />
        </div>

        <div class="ml-auto flex items-center gap-4 text-gray-500">
          <List :size="18" class="cursor-pointer hover:text-white" />
          <LayoutGrid :size="18" class="cursor-pointer hover:text-white" />
          <Columns :size="18" class="cursor-pointer hover:text-white" />
          <Maximize2 :size="18" class="cursor-pointer hover:text-white" />
          <MoreHorizontal :size="18" class="cursor-pointer hover:text-white" />
        </div>
      </div>

      <!-- Main Content Area -->
      <main class="flex-1 p-4 overflow-hidden">
        <!-- Independent Layout -->
        <div v-if="terminalStore.activeLayout === 'independent'" class="h-full">
          <Terminal 
            v-for="term in [activeTerminal]" 
            :key="term.id" 
            :id="term.id" 
            :name="term.name" 
            :color="term.color" 
          />
        </div>

        <!-- One-Main-Three-Sub Layout -->
        <div v-else-if="terminalStore.activeLayout === 'one-main-three-sub'" class="h-full flex flex-col gap-4">
          <div class="flex-[2] min-h-0">
            <Terminal 
              :id="activeTerminal.id" 
              :name="activeTerminal.name" 
              :color="activeTerminal.color" 
            />
          </div>
          <div class="flex-1 min-h-0 grid grid-cols-3 gap-4">
            <Terminal 
              v-for="term in otherTerminals" 
              :key="term.id" 
              :id="term.id" 
              :name="term.name" 
              :color="term.color" 
            />
          </div>
        </div>

        <!-- Four-Grid Layout -->
        <div v-else-if="terminalStore.activeLayout === 'four-grid'" class="h-full grid grid-cols-2 grid-rows-2 gap-4">
          <Terminal 
            v-for="term in terminalStore.terminals" 
            :key="term.id" 
            :id="term.id" 
            :name="term.name" 
            :color="term.color" 
          />
        </div>
      </main>

      <!-- Bottom Status Bar -->
      <div class="h-8 bg-[#181818] border-t border-[#333] flex items-center px-4 justify-between text-[10px] font-mono select-none">
        <div class="flex items-center gap-4">
          <div v-for="term in terminalStore.terminals" :key="'status-'+term.id" class="flex items-center gap-1.5 text-gray-500">
            <span>⌘{{ getShortcut(term.id) }}</span>
            <span>{{ term.name }}</span>
          </div>
          <div class="flex items-center gap-1.5 text-gray-500 ml-4">
            <span>⌘+L 切换布局</span>
          </div>
          <div class="flex items-center gap-1.5 text-gray-500">
            <span>⌘+T 新建标签</span>
          </div>
          <div class="flex items-center gap-1.5 text-gray-500">
            <span>⌘+W 关闭标签</span>
          </div>
          <div class="flex items-center gap-1.5 text-gray-500">
            <span>⌘+, 设置</span>
          </div>
        </div>
        <div class="flex items-center gap-2 text-[#4ade80]">
          <div class="w-1.5 h-1.5 rounded-full bg-[#4ade80]"></div>
          <span>所有工具运行正常</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from "vue";
import { Plus, X, List, LayoutGrid, Columns, Maximize2, MoreHorizontal } from "lucide-vue-next";
import Sidebar from "./components/Sidebar.vue";
import Terminal from "./components/Terminal.vue";
import { useTerminalStore } from "./store/useTerminalStore";

const terminalStore = useTerminalStore();

const activeTerminal = computed(() => {
  return terminalStore.terminals.find(t => t.id === terminalStore.activeTabId) || terminalStore.terminals[0];
});

const otherTerminals = computed(() => {
  return terminalStore.terminals.filter(t => t.id !== terminalStore.activeTabId);
});

const getShortcut = (id: string) => {
  switch (id) {
    case "codex": return "1";
    case "gemini": return "2";
    case "claude": return "3";
    case "open": return "4";
    default: return "";
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifier = isMac ? e.metaKey : e.ctrlKey;

  if (modifier) {
    if (e.key === '1') terminalStore.activeTabId = 'codex';
    else if (e.key === '2') terminalStore.activeTabId = 'gemini';
    else if (e.key === '3') terminalStore.activeTabId = 'claude';
    else if (e.key === '4') terminalStore.activeTabId = 'open';
    else if (e.key.toLowerCase() === 'l') {
      const layouts: any[] = ['independent', 'one-main-three-sub', 'four-grid'];
      const currentIndex = layouts.indexOf(terminalStore.activeLayout);
      terminalStore.activeLayout = layouts[(currentIndex + 1) % layouts.length];
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style>
/* Global scrollbar styling */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 2px;
}
::-webkit-scrollbar-thumb:hover {
  background: #444;
}
</style>
