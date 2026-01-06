<template>
  <div class="history-sidebar">
    <!-- 侧边栏 Overlay -->
    <div 
      v-if="isOpen" 
      class="fixed inset-0 bg-black/50 z-[100] transition-opacity"
      @click="$emit('close')"
    ></div>

    <!-- 侧边栏内容 -->
    <div 
      class="fixed left-0 top-0 bottom-0 w-[280px] bg-white z-[101] transition-transform duration-300 transform shadow-2xl flex flex-col"
      :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="p-6 border-b flex justify-between items-center bg-[#ff8fb1] text-white">
        <h2 class="text-xl font-black italic tracking-widest">历史回忆箱</h2>
        <button @click="$emit('close')" class="hover:rotate-90 transition-transform">
          <X :size="24" />
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-pink-50/30">
        <button 
          @click="$emit('create')"
          class="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#ff8fb1] text-white font-bold shadow-lg hover:bg-[#ff6b95] transition-all active:scale-95 mb-4"
        >
          <Plus :size="20" />
          <span>开启新回忆</span>
        </button>

        <div 
          v-for="session in sessions" 
          :key="session.id"
          class="group relative flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer border-2"
          :class="currentSessionId === session.id ? 'bg-white border-[#ff8fb1] shadow-md scale-[1.02]' : 'bg-white/50 border-transparent hover:bg-white hover:border-pink-200'"
          @click="$emit('switch', session.id)"
        >
          <div 
            class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            :class="currentSessionId === session.id ? 'bg-[#ff8fb1] text-white' : 'bg-pink-100 text-pink-400'"
          >
            <MessageSquare :size="20" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-bold truncate" :class="currentSessionId === session.id ? 'text-[#ff8fb1]' : 'text-gray-600'">
              {{ session.title }}
            </div>
            <div class="text-[10px] text-gray-400">
              {{ new Date(session.updatedAt).toLocaleString() }}
            </div>
          </div>
          <button 
            @click.stop="$emit('delete', session.id)"
            class="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-gray-300"
          >
            <Trash2 :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { X, Plus, MessageSquare, Trash2 } from "lucide-vue-next";

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  sessions: {
    type: Array,
    default: () => []
  },
  currentSessionId: {
    type: String,
    default: ""
  }
});

defineEmits(['close', 'create', 'switch', 'delete']);
</script>
