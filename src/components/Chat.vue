<template>
  <div 
    class="chat-wrapper w-full overflow-hidden flex flex-col fixed inset-0 mx-auto max-w-[500px] shadow-2xl"
    :style="{ height: viewportHeight + 'px' }"
  >
    <BackgroundDecor />
    <Particles ref="particlesRef" />

    <!-- 历史记录侧边栏 -->
    <HistorySidebar 
      :is-open="showSidebar"
      :sessions="sessions"
      :current-session-id="currentSessionId"
      @close="showSidebar = false"
      @create="handleCreateNewChat"
      @switch="handleSwitchSession"
      @delete="handleDeleteSession"
    />

    <div class="main-container flex flex-col h-full w-full relative" style="transform-style: preserve-3d; perspective: 1500px;">
      <div
        class="header-3d h-24 bg-[#ff8fb1] flex items-center px-6 relative z-10 shadow-[0_8px_30px_rgb(255,143,177,0.4)] border-b-4 border-[#ff6b95]"
      >
        <button 
          @click="showSidebar = true"
          class="mr-4 w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-xl transition-all"
        >
          <Menu :size="28" />
        </button>
        <div class="flex-1 flex gap-4 items-center">
          <div class="flex flex-col">
            <div class="flex items-center gap-2">
              <span
                class="text-white font-black text-xl tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]"
                >逗逗小星</span
              >
              <div
                class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] animate-bounce text-2xl"
              >
                {{ moodEmoji }}
              </div>
            </div>
            <div class="flex items-center gap-1 mt-1">
              <div
                class="w-2 h-2 bg-green-400 rounded-full animate-pulse"
              ></div>
              <span class="text-white/80 text-xs font-bold"
                >小星姐姐
                {{ mood === "thinking" ? "正在思考中..." : "在线中" }}</span
              >
            </div>
          </div>

          <button
            class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/50 flex items-center justify-center shadow-[0_6px_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-1 transition-all hover:bg-white/30"
            @click="showSettings = true"
          >
            <span class="text-2xl drop-shadow-md">⚙️</span>
          </button>
        </div>

        <div
          class="avatar-3d w-20 h-20 bg-white rounded-full border-4 border-[#ff8fb1] overflow-hidden shadow-[0_10px_25px_rgba(255,143,177,0.4)] transform translate-y-6 hover:rotate-12 transition-transform duration-500 cursor-pointer"
          @click="handleAvatarClick"
        >
          <img
            src="../assets/image/head.jpg"
            alt="avatar"
            class="w-full h-full object-cover"
          />
        </div>
      </div>

      <div
        ref="chatContainer"
        class="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth overscroll-contain"
      >
        <div
          v-for="msg in messages"
          :key="msg.id || msg.content"
          :class="[
            'flex w-full',
            msg.role === 'user' ? 'justify-end' : 'justify-start',
          ]"
        >
          <div
            :class="[
              'relative max-w-[85%] px-5 py-3 rounded-[24px] font-bold text-lg transition-all active:scale-95 cursor-pointer bubble-3d message-bounce hover:-translate-y-1',
              msg.role === 'user'
                ? 'bg-[#ffeaa7] text-[#5d4037] rounded-tr-none user-bubble'
                : 'bg-[#ff8fb1] text-white rounded-tl-none ai-bubble-pink',
            ]"
            @click="handleMessageClick(msg.content, msg.id)"
          >
            {{ msg.content }}
            <div
              class="absolute top-0 w-3 h-3"
              :class="[
                msg.role === 'user'
                  ? 'right-[-6px] bg-[#ffeaa7] tail-user'
                  : 'left-[-6px] bg-inherit tail-ai',
              ]"
            ></div>
          </div>
        </div>

        <div v-if="isLoading" class="flex justify-start">
          <div
            class="bg-[#f3f4f6] px-4 py-2 rounded-[20px] rounded-tl-none shadow-sm flex items-center gap-2"
          >
            <span class="loading loading-dots loading-sm text-[#ff8fb1]"></span>
          </div>
        </div>
      </div>

      <div class="px-4 py-2 flex gap-3 overflow-x-auto no-scrollbar">
        <button
          v-for="action in quickActions"
          :key="action.text"
          class="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-white font-bold shadow-[0_4px_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-1 transition-all"
          :class="action.color"
          @click="sendMessage(action.text)"
        >
          <component :is="action.icon" class="w-4 h-4" />
          {{ action.text }}
        </button>
      </div>

      <div
        class="p-4 bg-white/60 backdrop-blur-md border-t border-white/20 mb-[env(safe-area-inset-bottom)]"
      >
        <div class="flex items-center gap-2">
          <div
            class="flex-1 flex items-center bg-[#f8f9fa] rounded-2xl px-4 py-3 shadow-[inset_0_4px_8px_rgba(0,0,0,0.05)] border-2 border-white focus-within:border-[#ff8fb1] transition-all group"
          >
            <input
              v-model="userInput"
              type="text"
              placeholder="和小星姐姐聊天吧..."
              class="flex-1 bg-transparent border-none focus:outline-none text-gray-700 placeholder-gray-400 font-bold"
              @keyup.enter="sendMessage()"
            />
            <button
              class="ml-2 w-10 h-10 flex items-center justify-center rounded-xl bg-[#ff8fb1] text-white shadow-[0_4px_0_#eb4d4b] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50 group-hover:scale-110"
              :disabled="isLoading || !userInput.trim()"
              @click="sendMessage()"
            >
              <span v-if="!isLoading" class="text-xl">🚀</span>
              <span v-else class="loading loading-spinner loading-xs"></span>
            </button>
          </div>
          <button
            class="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-[0_6px_0_#0652dd] active:shadow-none active:translate-y-1"
            :class="[
              isListening
                ? 'bg-red-500 shadow-[0_6px_0_#c0392b] animate-pulse'
                : 'bg-[#74b9ff]',
            ]"
            @click="handleMicClick"
          >
            <span class="text-2xl">{{ isListening ? "⏹️" : "🎤" }}</span>
          </button>
        </div>
      </div>
    </div>

    <SettingsModal
      :is-open="showSettings"
      :selected-model="selectedModel"
      :api-keys="apiKeys"
      :voice-settings="voiceSettings"
      :available-voices="availableVoices"
      @close="showSettings = false"
      @save="handleSettingsSave"
      @test-voice="handleTestVoice"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Menu, Sparkles, Gamepad2, BookOpen, Music } from "lucide-vue-next";
import BackgroundDecor from "./BackgroundDecor.vue";
import Particles from "./Particles.vue";
import SettingsModal from "./SettingsModal.vue";
import HistorySidebar from "./HistorySidebar.vue";
import { useMessages } from "../composables/useMessages";
import { useSpeech } from "../composables/useSpeech";

const mood = ref("happy");
const showSidebar = ref(false);
const moodEmoji = computed(() => {
  const emojis = {
    happy: "😊",
    excited: "🤩",
    thinking: "🤔",
    surprised: "😮",
    sleepy: "😴",
  };
  return emojis[mood.value] || "😊";
});

const viewportHeight = ref(window.innerHeight);
const showSettings = ref(false);

const particlesRef = ref(null);

const {
  messages,
  sessions,
  currentSessionId,
  isLoading,
  userInput,
  chatContainer,
  apiKeys,
  selectedModel,
  sendMessage,
  clearChat,
  saveApiKey,
  createNewChat,
  switchSession,
  deleteSession,
} = useMessages();

const {
  isListening,
  isSpeaking,
  currentPlayingMessage,
  availableVoices,
  voiceSettings,
  speak,
  testVoice,
  toggleListening,
} = useSpeech();

const quickActions = [
  { icon: Sparkles, text: "讲个故事", color: "bg-yellow-400" },
  { icon: Music, text: "唱首歌", color: "bg-purple-400" },
  { icon: Gamepad2, text: "玩游戏", color: "bg-green-400" },
  { icon: BookOpen, text: "学成语", color: "bg-blue-400" },
];

const updateHeight = () => {
  viewportHeight.value = window.visualViewport
    ? window.visualViewport.height
    : window.innerHeight;
};

const handleAvatarClick = () => {
  if (particlesRef.value) {
    particlesRef.value.triggerBurst(window.innerWidth - 60, 60);
  }
  mood.value = "excited";
};

const handleMessageClick = (content, id) => {
  speak(content, id);
  if (particlesRef.value) {
    particlesRef.value.triggerBurst(window.innerWidth / 2, window.innerHeight / 2);
  }
};

const handleMicClick = () => {
  toggleListening((transcript) => {
    userInput.value = transcript;
    sendMessage(transcript);
  });
};

const handleSettingsSave = ({ selectedModel: newModel, apiKeys: newApiKeys, voiceSettings: newVoiceSettings }) => {
  selectedModel.value = newModel;
  apiKeys.value = { ...newApiKeys };
  voiceSettings.value = { ...newVoiceSettings };
  saveApiKey();
};

const handleCreateNewChat = () => {
  createNewChat();
  showSidebar.value = false;
};

const handleSwitchSession = (id) => {
  switchSession(id);
  showSidebar.value = false;
};

const handleDeleteSession = (id) => {
  if (confirm("确定要删除这段珍贵的回忆吗？")) {
    deleteSession(id);
  }
};

const handleTestVoice = (settings) => {
  voiceSettings.value = { ...settings };
  testVoice();
};

onMounted(() => {
  window.addEventListener("resize", updateHeight);
  window.visualViewport?.addEventListener("resize", updateHeight);
  updateHeight();
});
</script>

<style scoped>
.header-3d {
  box-shadow: 0 10px 40px rgba(255, 143, 177, 0.4), 0 0 60px rgba(255, 143, 177, 0.2) inset;
  border-bottom: 4px solid rgba(255, 255, 255, 0.4);
  transform: perspective(1500px) rotateX(5deg);
  transform-style: preserve-3d;
  transition: all 0.3s ease;
  background: linear-gradient(145deg, #ff8fb1, #ff6b95);
}

.header-3d:hover {
  transform: perspective(1500px) rotateX(8deg);
  box-shadow: 0 15px 50px rgba(255, 143, 177, 0.5), 0 0 80px rgba(255, 143, 177, 0.3) inset;
}

.avatar-3d {
  box-shadow: 0 8px 20px rgba(0, 172, 238, 0.2);
}

.tail-user {
  clip-path: polygon(0 0, 0 100%, 100% 0);
  -webkit-clip-path: polygon(0 0, 0 100%, 100% 0);
}

.tail-ai {
  clip-path: polygon(100% 0, 100% 100%, 0 0);
  -webkit-clip-path: polygon(100% 0, 100% 100%, 0 0);
}

.shadow-inner {
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}

.bubble-3d {
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15), 0 18px 45px rgba(0, 0, 0, 0.08);
  transform: perspective(1500px) rotateX(5deg) rotateY(2deg);
  transform-style: preserve-3d;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.user-bubble {
  background: linear-gradient(145deg, #ffeaa7, #fdcb6e);
}

.ai-bubble-pink {
  background: linear-gradient(145deg, #ff8fb1, #ff6b95);
}

.message-bounce {
  animation: bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3) perspective(1500px) rotateX(10deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.05) perspective(1500px) rotateX(-2deg);
  }
  70% {
    transform: scale(0.9) perspective(1500px) rotateX(2deg);
  }
  100% {
    transform: scale(1) perspective(1500px) rotateX(0deg);
  }
}

.scale-in-center {
  animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scaleIn {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}

input::placeholder {
  color: #d1d5db;
  font-weight: bold;
}
</style>
