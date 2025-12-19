<template>
  <div 
    class="chat-wrapper w-full overflow-hidden flex flex-col fixed inset-0 mx-auto max-w-[500px] shadow-2xl"
    :style="{ height: viewportHeight + 'px' }"
  >
    <BackgroundDecor />

    <!-- 粒子特效层 -->
    <div class="fixed inset-0 pointer-events-none z-[9999]">
      <div
        v-for="p in particles"
        :key="p.id"
        class="absolute text-2xl"
        :style="{
          left: p.x + 'px',
          top: p.y + 'px',
          opacity: p.opacity,
          transform: `scale(${p.scale})`,
        }"
      >
        {{ p.emoji }}
      </div>
    </div>

    <div class="main-container flex flex-col h-full w-full relative">
      <!-- Header -->
      <div
        class="header-3d h-24 bg-[#ff8fb1] flex items-center px-6 relative z-10 shadow-[0_8px_30px_rgb(255,143,177,0.4)] border-b-4 border-[#ff6b95]"
      >
        <div class="flex-1 flex gap-4 items-center">
          <div class="flex flex-col">
            <div class="flex items-center gap-2">
              <span
                class="text-white font-black text-3xl tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]"
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
          @click="
            triggerBurst(window.innerWidth - 60, 60);
            mood = 'excited';
          "
        >
          <img
            src="../assets/image/head.jpg"
            alt="avatar"
            class="w-full h-full object-cover"
          />
        </div>
      </div>

      <!-- Chat Container -->
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
            @click="
              speak(msg.content);
              triggerBurst($event.clientX, $event.clientY);
            "
          >
            {{ msg.content }}
            <!-- 气泡小尾巴 -->
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

        <!-- Loading Indicator -->
        <div v-if="isLoading" class="flex justify-start">
          <div
            class="bg-[#f3f4f6] px-4 py-2 rounded-[20px] rounded-tl-none shadow-sm flex items-center gap-2"
          >
            <span class="loading loading-dots loading-sm text-[#ff8fb1]"></span>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="px-4 py-2 flex gap-3 overflow-x-auto no-scrollbar">
        <button
          v-for="action in [
            { icon: Sparkles, text: '讲个故事', color: 'bg-yellow-400' },
            { icon: Music, text: '唱首歌', color: 'bg-purple-400' },
            { icon: Gamepad2, text: '玩游戏', color: 'bg-green-400' },
            { icon: BookOpen, text: '学成语', color: 'bg-blue-400' },
          ]"
          :key="action.text"
          class="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-white font-bold shadow-[0_4px_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-1 transition-all"
          :class="action.color"
          @click="sendMessage(action.text)"
        >
          <component :is="action.icon" class="w-4 h-4" />
          {{ action.text }}
        </button>
      </div>

      <!-- Input Area -->
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
              @keyup.enter="sendMessage"
            />
            <button
              class="ml-2 w-10 h-10 flex items-center justify-center rounded-xl bg-[#ff8fb1] text-white shadow-[0_4px_0_#eb4d4b] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50 group-hover:scale-110"
              :disabled="isLoading || !userInput.trim()"
              @click="sendMessage"
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
            @click="toggleListening"
          >
            <span class="text-2xl">{{ isListening ? "⏹️" : "🎤" }}</span>
          </button>
        </div>
      </div>

      <!-- Settings Overlay -->
      <div
        v-if="showSettings"
        class="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      >
        <div
          class="bg-white rounded-[32px] p-8 w-full shadow-2xl scale-in-center"
        >
          <h3
            class="font-black text-2xl mb-6 text-[#ff8fb1] flex items-center gap-2"
          >
            <Settings class="w-6 h-6" /> 设置
          </h3>
          <div class="space-y-4">
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-bold text-gray-600"
                  >DeepSeek API Key</span
                >
              </label>
              <input
                v-model="apiKey"
                type="password"
                placeholder="sk-..."
                class="input input-bordered rounded-2xl border-2 focus:border-[#ff8fb1] w-full"
              />
            </div>

            <div class="divider">声音挑选</div>
            <div class="form-control w-full space-y-3">
              <div class="flex items-center gap-2">
                <select
                  v-model="voiceSettings.selectedVoiceName"
                  class="select select-bordered select-sm rounded-xl flex-1 font-bold text-gray-600"
                >
                  <option v-if="availableVoices.length === 0" disabled value="">
                    正在加载语音包...
                  </option>
                  <option
                    v-for="voice in availableVoices"
                    :key="voice.name"
                    :value="voice.name"
                  >
                    {{ voice.name.includes("Online") ? "🌟 " : ""
                    }}{{ voice.name }}
                  </option>
                </select>
                <button
                  class="btn btn-circle btn-sm btn-secondary"
                  @click="testVoice"
                >
                  <Volume2 class="w-4 h-4" />
                </button>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-400"
                  >甜美度 (音调)</label
                >
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  v-model="voiceSettings.pitch"
                  class="range range-xs range-secondary"
                />
              </div>
            </div>

            <div class="flex gap-3 pt-4">
              <button
                class="btn flex-1 bg-[#ff8fb1] hover:bg-[#ff4d94] text-white border-none rounded-2xl font-bold"
                @click="saveApiKey"
              >
                保存
              </button>
              <button
                class="btn flex-1 bg-gray-100 text-gray-500 border-none rounded-2xl font-bold"
                @click="showSettings = false"
              >
                取消
              </button>
            </div>
            <button
              class="btn btn-ghost btn-sm w-full text-red-400 mt-4"
              @click="clearChat"
            >
              <Trash2 class="w-4 h-4 mr-1" /> 清除聊天记录
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from "vue";
import axios from "axios";
import BackgroundDecor from "./BackgroundDecor.vue";
import {
  Send,
  User,
  Bot,
  Trash2,
  Settings,
  Mic,
  MicOff,
  Volume2,
  ChevronRight,
  Sparkles,
  Gamepad2,
  BookOpen,
  Music,
} from "lucide-vue-next";

const messages = ref([]);

// 心情系统
const mood = ref("happy"); // happy, excited, thinking, surprised
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

// 粒子效果
const particles = ref([]);
const triggerBurst = (x, y) => {
  const emojis = ["✨", "⭐", "🌟", "💖", "🌈", "🎈"];
  for (let i = 0; i < 12; i++) {
    const id = generateId();
    particles.value.push({
      id,
      x,
      y,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10 - 5,
      opacity: 1,
      scale: 1,
    });

    setTimeout(() => {
      particles.value = particles.value.filter((p) => p.id !== id);
    }, 1000);
  }
};

const updateParticles = () => {
  particles.value.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2; // gravity
    p.opacity -= 0.02;
    p.scale -= 0.01;
  });
  if (particles.value.length > 0) {
    requestAnimationFrame(updateParticles);
  }
};

watch(
  () => particles.value.length,
  (newLen, oldLen) => {
    if (newLen > 0 && oldLen === 0) {
      updateParticles();
    }
  }
);

// 辅助函数：生成唯一 ID
const generateId = () => Date.now() + Math.random().toString(36).substr(2, 9);

const defaultMessage = {
  id: generateId(),
  role: "assistant",
  content:
    "宝贝你好呀！🌟 我是你的好朋友小星大姐姐。很高兴能陪你聊天！今天你遇到了什么好玩的事情吗？或者想听小星给你讲个小故事？🌈",
};

const systemPrompt =
  "你是一个温柔、博学且充满童心的 AI 大姐姐。你的名字叫‘小星’，主要陪伴一位3岁的女孩聊天。请使用生动有趣的语言，多用表情符号，严禁输出任何暴力、负面或不适合儿童的内容。如果她问到深奥的科学问题，请用简单的比喻来解释。";

// 监听消息变化并保存到 localStorage (增加防抖)
let storageTimer = null;
watch(
  messages,
  (newMessages) => {
    if (storageTimer) clearTimeout(storageTimer);
    storageTimer = setTimeout(() => {
      localStorage.setItem(
        "deepseek_chat_history",
        JSON.stringify(newMessages)
      );
    }, 500);
  },
  { deep: true }
);

const userInput = ref("");
const isLoading = ref(false);
const chatContainer = ref(null);
const viewportHeight = ref(window.innerHeight);

// 处理视口高度，解决移动端工具栏遮挡问题
const updateHeight = () => {
  viewportHeight.value = window.visualViewport
    ? window.visualViewport.height
    : window.innerHeight;
};

// 语音识别相关
const isListening = ref(false);
const recognition = ref(null);

// 语音配置
const voiceSettings = ref({
  selectedVoiceName: "",
  pitch: 1.4,
  rate: 1.0,
});

// 文字转语音相关
const synth = window.speechSynthesis;
const isSpeaking = ref(false);
const availableVoices = ref([]);

const loadVoices = () => {
  // 获取所有语音
  let voices = synth.getVoices();

  // 如果获取不到，尝试延迟一下（某些浏览器需要时间初始化）
  if (voices.length === 0) {
    setTimeout(() => {
      voices = synth.getVoices();
      updateVoiceList(voices);
    }, 100);
    return;
  }

  updateVoiceList(voices);
};

const updateVoiceList = (voices) => {
  // 筛选出中文语音
  availableVoices.value = voices.filter(
    (v) => v.lang.includes("zh") || v.lang.includes("CN")
  );

  // 自动选择一个最甜美的默认声音
  if (
    !voiceSettings.value.selectedVoiceName &&
    availableVoices.value.length > 0
  ) {
    const preferred =
      availableVoices.value.find((v) => v.name.includes("Xiaoxiao")) ||
      availableVoices.value.find((v) => v.name.includes("Meijia")) ||
      availableVoices.value.find((v) => v.name.includes("Online")) ||
      availableVoices.value[0];
    voiceSettings.value.selectedVoiceName = preferred.name;
  }
};

// 监听语音包加载
if (typeof synth !== "undefined" && synth.onvoiceschanged !== undefined) {
  synth.onvoiceschanged = loadVoices;
}

// 额外的定时检查，确保在某些不触发 onvoiceschanged 的浏览器中也能加载
const voiceRetryInterval = setInterval(() => {
  if (availableVoices.value.length > 0) {
    clearInterval(voiceRetryInterval);
  } else {
    loadVoices();
  }
}, 1000);

// 5秒后停止检查，防止无限循环
setTimeout(() => clearInterval(voiceRetryInterval), 5000);

const speak = (text) => {
  if (isSpeaking.value) {
    synth.cancel();
  }

  const textWithoutEmojis = text.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
    ""
  );

  const utterance = new SpeechSynthesisUtterance(textWithoutEmojis);
  utterance.lang = "zh-CN";

  const selectedVoice = availableVoices.value.find(
    (v) => v.name === voiceSettings.value.selectedVoiceName
  );
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.rate = voiceSettings.value.rate;
  utterance.pitch = voiceSettings.value.pitch;

  utterance.onstart = () => {
    isSpeaking.value = true;
  };
  utterance.onend = () => {
    isSpeaking.value = false;
  };

  synth.speak(utterance);
};

const testVoice = () => {
  speak("你好呀宝贝，我是小星大姐姐，很高兴认识你！");
};

const initSpeech = () => {
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition.value = new SpeechRecognition();
    recognition.value.lang = "zh-CN";
    recognition.value.continuous = false;
    recognition.value.interimResults = false;

    recognition.value.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      userInput.value = transcript;
      isListening.value = false;
      sendMessage();
    };

    recognition.value.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      isListening.value = false;
    };

    recognition.value.onend = () => {
      isListening.value = false;
    };
  }
};

const toggleListening = () => {
  if (isListening.value) {
    recognition.value?.stop();
  } else {
    isListening.value = true;
    recognition.value?.start();
  }
};

// API 配置
const apiKey = ref("sk-6624657ac8d9443c9046a397593febd2");
const apiUrl = "https://api.deepseek.com/v1/chat/completions";

const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

const sendMessage = async (customText = null) => {
  const textToSend =
    typeof customText === "string" ? customText : userInput.value;
  if (!textToSend.trim() || isLoading.value) return;

  const userMessage = textToSend;
  messages.value.push({
    id: generateId(),
    role: "user",
    content: userMessage,
  });
  if (!customText) userInput.value = "";
  isLoading.value = true;
  mood.value = "thinking";

  // 触发发送粒子效果 (大致在输入框位置)
  triggerBurst(window.innerWidth / 2, window.innerHeight - 100);

  await scrollToBottom();

  try {
    if (!apiKey.value) {
      messages.value.push({
        id: generateId(),
        role: "assistant",
        content:
          "错误：请先设置 DeepSeek API Key。点击右上角设置图标进行配置。",
      });
      isLoading.value = false;
      await scrollToBottom();
      return;
    }

    const response = await axios.post(
      apiUrl,
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.value.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey.value}`,
          "Content-Type": "application/json",
        },
      }
    );

    const assistantMessage = response.data.choices[0].message.content;

    // 根据回复内容更新心情
    if (
      assistantMessage.includes("哈哈") ||
      assistantMessage.includes("高兴") ||
      assistantMessage.includes("🌟")
    ) {
      mood.value = "excited";
    } else if (
      assistantMessage.includes("惊讶") ||
      assistantMessage.includes("真的吗")
    ) {
      mood.value = "surprised";
    } else {
      mood.value = "happy";
    }

    // 1. 先播放语音，让用户感知到回应
    speak(assistantMessage);

    // 2. 创建一个空的消息对象并推入数组
    const newMessage = {
      id: generateId(),
      role: "assistant",
      content: "",
    };
    messages.value.push(newMessage);

    // 3. 获取刚刚推入的消息对象的引用（它是响应式的）
    const targetMsg = messages.value[messages.value.length - 1];

    // 4. 实现打字机效果
    let i = 0;
    const typeWriter = () => {
      if (i < assistantMessage.length) {
        targetMsg.content += assistantMessage.charAt(i);
        i++;
        scrollToBottom();
        setTimeout(typeWriter, 30);
      } else {
        // 打字结束，关闭加载状态
        isLoading.value = false;
      }
    };

    typeWriter();
  } catch (error) {
    console.error("API Error:", error);
    messages.value.push({
      id: generateId(),
      role: "assistant",
      content: `抱歉，发生了一些错误：${
        error.response?.data?.error?.message || error.message
      }`,
    });
    isLoading.value = false;
  } finally {
    await scrollToBottom();
  }
};

const clearChat = () => {
  if (confirm("确定要清除所有聊天记录吗？")) {
    const resetMsg = { ...defaultMessage, id: generateId() };
    messages.value = [resetMsg];
    localStorage.removeItem("deepseek_chat_history");
  }
};

const showSettings = ref(false);
const saveApiKey = () => {
  localStorage.setItem("deepseek_api_key", apiKey.value);
  localStorage.setItem("voice_settings", JSON.stringify(voiceSettings.value));
  showSettings.value = false;
};

onMounted(() => {
  initSpeech();
  loadVoices();

  window.addEventListener("resize", updateHeight);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", updateHeight);
    window.visualViewport.addEventListener("scroll", updateHeight);
  }
  updateHeight();

  // 禁止缩放
  document.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    },
    { passive: false }
  );

  let lastTouchEnd = 0;
  document.addEventListener(
    "touchend",
    (event) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    false
  );

  const savedKey = localStorage.getItem("deepseek_api_key");
  if (savedKey) {
    apiKey.value = savedKey;
  }

  const savedVoiceSettings = localStorage.getItem("voice_settings");
  if (savedVoiceSettings) {
    voiceSettings.value = JSON.parse(savedVoiceSettings);
  }

  const savedHistory = localStorage.getItem("deepseek_chat_history");
  if (savedHistory) {
    try {
      messages.value = JSON.parse(savedHistory);
    } catch (e) {
      console.error("Failed to parse chat history:", e);
      messages.value = [{ ...defaultMessage, id: generateId() }];
    }
  } else {
    messages.value = [{ ...defaultMessage, id: generateId() }];
  }

  scrollToBottom();
});
</script>

<style scoped>
.chat-wrapper {
  font-family: "Hiragino Sans", "PingFang SC", "Microsoft YaHei", sans-serif;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0 auto;
  touch-action: none;
  background: linear-gradient(-45deg, #fce4ec, #f8bbd0, #e1f5fe, #fce4ec);
  background-size: 400% 400%;
  animation: gradientBG 15s ease infinite;
}

@keyframes gradientBG {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}

.header-3d {
  box-shadow: 0 4px 15px rgba(255, 143, 177, 0.3);
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
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

/* 拟态效果 */
.shadow-inner {
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}

/* 3D 气泡增强效果 */
.bubble-3d {
  box-shadow: 0 8px 0 rgba(0, 0, 0, 0.1), 0 15px 25px rgba(0, 0, 0, 0.05);
  transform: perspective(1000px) rotateX(2deg);
}

.user-bubble {
  border: 3px solid #f9ca24;
  box-shadow: 0 8px 0 #f0932b;
}

.ai-bubble-pink {
  border: 3px solid #ff7597;
  box-shadow: 0 8px 0 #eb4d4b;
}

.ai-bubble-blue {
  border: 3px solid #0984e3;
  box-shadow: 0 8px 0 #0652dd;
}

/* 消息进入动画 */
.message-bounce {
  animation: messageBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes messageBounce {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px) rotate(-5deg);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0) rotate(0);
  }
}

.scale-in-center {
  animation: scale-in-center 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

@keyframes scale-in-center {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 隐藏滚动条但保留滚动功能 */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

::-webkit-scrollbar {
  display: none;
}

/* 输入框聚焦效果 */
input::placeholder {
  color: #d1d5db;
  font-weight: bold;
}
</style>
