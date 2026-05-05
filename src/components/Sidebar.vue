<template>
  <div class="w-64 h-full bg-[#181818] border-r border-[#333] flex flex-col p-4 select-none">
    <div class="flex items-center gap-2 mb-8 px-2">
      <span class="text-xl font-bold text-white">CliStack</span>
      <div class="flex items-center text-[#4ade80]">
        <ChevronRight :size="20" />
        <div class="w-2 h-4 bg-[#4ade80] animate-pulse ml-1"></div>
      </div>
    </div>

    <div class="mb-8">
      <h3 class="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-4 px-2">工具</h3>
      <div class="space-y-1">
        <div
          v-for="term in terminalStore.terminals"
          :key="term.id"
          @click="terminalStore.activeTabId = term.id"
          :class="[
            'flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors',
            terminalStore.activeTabId === term.id ? 'bg-[#2a2a2a] text-white' : 'text-gray-400 hover:bg-[#202020] hover:text-gray-200'
          ]"
        >
          <div class="flex items-center gap-3">
            <component :is="getIcon(term.id)" :size="16" :style="{ color: term.color }" />
            <span class="text-sm">{{ term.name }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: term.color }"></div>
            <span class="text-[10px] opacity-50 font-mono">⌘{{ getShortcut(term.id) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-8">
      <h3 class="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-4 px-2">布局</h3>
      <div class="grid grid-cols-1 gap-2">
        <button
          @click="terminalStore.activeLayout = 'independent'"
          :class="[
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left',
            terminalStore.activeLayout === 'independent' ? 'bg-[#2a2a2a] text-white' : 'text-gray-400 hover:bg-[#202020]'
          ]"
        >
          <Layout :size="16" /> 独立标签
        </button>
        <button
          @click="terminalStore.activeLayout = 'one-main-three-sub'"
          :class="[
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left',
            terminalStore.activeLayout === 'one-main-three-sub' ? 'bg-[#2a2a2a] text-white' : 'text-gray-400 hover:bg-[#202020]'
          ]"
        >
          <LayoutTemplate :size="16" /> 一主三从
        </button>
        <button
          @click="terminalStore.activeLayout = 'four-grid'"
          :class="[
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left',
            terminalStore.activeLayout === 'four-grid' ? 'bg-[#2a2a2a] text-white' : 'text-gray-400 hover:bg-[#202020]'
          ]"
        >
          <LayoutGrid :size="16" /> 四从布局
        </button>
      </div>
    </div>

    <div class="mt-auto">
      <h3 class="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-4 px-2">主题</h3>
      <div class="flex gap-3 px-2">
        <div class="w-5 h-5 rounded-full bg-[#4ade80] border-2 border-white cursor-pointer"></div>
        <div class="w-5 h-5 rounded-full bg-[#60a5fa] cursor-pointer"></div>
        <div class="w-5 h-5 rounded-full bg-[#a78bfa] cursor-pointer"></div>
        <div class="w-5 h-5 rounded-full bg-[#fb923c] cursor-pointer"></div>
        <Settings :size="20" class="text-gray-500 cursor-pointer hover:text-white" />
      </div>
    </div>

    <div class="mt-8 flex items-center justify-between px-2 text-gray-600">
      <div class="flex gap-3">
        <Settings :size="16" class="cursor-pointer hover:text-gray-400" />
        <HelpCircle :size="16" class="cursor-pointer hover:text-gray-400" />
      </div>
      <span class="text-[10px] font-mono">v0.1.0</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  ChevronRight, 
  Terminal as TerminalIcon, 
  Cpu, 
  Bot, 
  Zap, 
  Layout, 
  LayoutTemplate, 
  LayoutGrid, 
  Settings, 
  HelpCircle 
} from "lucide-vue-next";
import { useTerminalStore } from "../store/useTerminalStore";

const terminalStore = useTerminalStore();

const getIcon = (id: string) => {
  switch (id) {
    case "codex": return Cpu;
    case "gemini": return Bot;
    case "claude": return Zap;
    case "open": return TerminalIcon;
    default: return TerminalIcon;
  }
};

const getShortcut = (id: string) => {
  switch (id) {
    case "codex": return "1";
    case "gemini": return "2";
    case "claude": return "3";
    case "open": return "4";
    default: return "";
  }
};
</script>
