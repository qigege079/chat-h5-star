<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import axios from 'axios'
import { Send, User, Bot, Trash2, Settings, Mic, MicOff, Volume2, ChevronRight } from 'lucide-vue-next'

const messages = ref([])

const defaultMessage = {
  role: 'assistant',
  content: '宝贝你好呀！🌟 我是你的好朋友小星大姐姐。很高兴能陪你聊天！今天你遇到了什么好玩的事情吗？或者想听小星给你讲个小故事？🌈'
}

const systemPrompt = "你是一个温柔、博学且充满童心的 AI 大姐姐。你的名字叫‘小星’，主要陪伴一位3岁的女孩聊天。请使用生动有趣的语言，多用表情符号，严禁输出任何暴力、负面或不适合儿童的内容。如果她问到深奥的科学问题，请用简单的比喻来解释。"

// 监听消息变化并保存到 localStorage
watch(messages, (newMessages) => {
  localStorage.setItem('deepseek_chat_history', JSON.stringify(newMessages))
}, { deep: true })

const userInput = ref('')
const isLoading = ref(false)
const chatContainer = ref(null)

// 语音识别相关
const isListening = ref(false)
const recognition = ref(null)

// 语音配置
const voiceSettings = ref({
  selectedVoiceName: '',
  pitch: 1.4,
  rate: 1.0
})

// 文字转语音相关
const synth = window.speechSynthesis
const isSpeaking = ref(false)
const availableVoices = ref([])

const loadVoices = () => {
  // 获取所有语音，并筛选出中文
  const voices = synth.getVoices()
  availableVoices.value = voices.filter(v => v.lang.includes('zh') || v.lang.includes('CN'))
  
  // 自动选择一个最甜美的默认声音
  if (!voiceSettings.value.selectedVoiceName && availableVoices.value.length > 0) {
    const preferred = availableVoices.value.find(v => v.name.includes('Xiaoxiao')) || 
                      availableVoices.value.find(v => v.name.includes('Meijia')) ||
                      availableVoices.value.find(v => v.name.includes('Online')) ||
                      availableVoices.value[0]
    voiceSettings.value.selectedVoiceName = preferred.name
  }
}

// 监听语音包加载
if (synth.onvoiceschanged !== undefined) {
  synth.onvoiceschanged = loadVoices
}

const speak = (text) => {
  if (isSpeaking.value) {
    synth.cancel()
  }
  
  const textWithoutEmojis = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  
  const utterance = new SpeechSynthesisUtterance(textWithoutEmojis)
  utterance.lang = 'zh-CN'
  
  const selectedVoice = availableVoices.value.find(v => v.name === voiceSettings.value.selectedVoiceName)
  if (selectedVoice) {
    utterance.voice = selectedVoice
  }

  utterance.rate = voiceSettings.value.rate
  utterance.pitch = voiceSettings.value.pitch
  
  utterance.onstart = () => { isSpeaking.value = true }
  utterance.onend = () => { isSpeaking.value = false }
  
  synth.speak(utterance)
}

const testVoice = () => {
  speak('你好呀宝贝，我是小星大姐姐，很高兴认识你！')
}

const initSpeech = () => {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognition.value = new SpeechRecognition()
    recognition.value.lang = 'zh-CN'
    recognition.value.continuous = false
    recognition.value.interimResults = false

    recognition.value.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      userInput.value = transcript
      isListening.value = false
      sendMessage()
    }

    recognition.value.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      isListening.value = false
    }

    recognition.value.onend = () => {
      isListening.value = false
    }
  }
}

const toggleListening = () => {
  if (isListening.value) {
    recognition.value?.stop()
  } else {
    isListening.value = true
    recognition.value?.start()
  }
}

// Azure TTS 实现
const speakWithAzure = async (text) => {
  const url = `https://${voiceSettings.value.azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`
  const ssml = `
    <speak version='1.0' xml:lang='zh-CN'>
      <voice xml:lang='zh-CN' xml:gender='Female' name='${voiceSettings.value.voiceName}'>
        <prosody pitch="+20%" rate="+10%">
          ${text}
        </prosody>
      </voice>
    </speak>`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': voiceSettings.value.azureKey,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
    },
    body: ssml
  })

  if (!response.ok) throw new Error('Azure TTS API error')

  const blob = await response.blob()
  const audioUrl = URL.createObjectURL(blob)
  const audio = new Audio(audioUrl)
  
  audio.onplay = () => { isSpeaking.value = true }
  audio.onended = () => { isSpeaking.value = false }
  audio.play()
}

// API 配置
const apiKey = ref(import.meta.env.VITE_DEEPSEEK_KEY || 'sk-6624657ac8d9443c9046a397593febd2')
const apiUrl = 'https://api.deepseek.com/v1/chat/completions'

const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  const userMessage = userInput.value
  messages.value.push({
    role: 'user',
    content: userMessage
  })
  userInput.value = ''
  isLoading.value = true
  
  await scrollToBottom()

  try {
    if (!apiKey.value) {
      messages.value.push({
        role: 'assistant',
        content: '错误：请先设置 DeepSeek API Key。点击右上角设置图标进行配置。'
      })
      isLoading.value = false
      await scrollToBottom()
      return
    }

    const response = await axios.post(apiUrl, {
      model: "deepseek-chat",
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.value.map(m => ({
          role: m.role,
          content: m.content
        }))
      ],
      stream: false
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey.value}`,
        'Content-Type': 'application/json'
      }
    })

    const assistantMessage = response.data.choices[0].message.content
    messages.value.push({
      role: 'assistant',
      content: assistantMessage
    })
    
    // 自动播放 AI 的回复
    speak(assistantMessage)
  } catch (error) {
    console.error('API Error:', error)
    messages.value.push({
      role: 'assistant',
      content: `抱歉，发生了一些错误：${error.response?.data?.error?.message || error.message}`
    })
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}

const clearChat = () => {
  if (confirm('确定要清除所有聊天记录吗？')) {
    messages.value = [defaultMessage]
    localStorage.removeItem('deepseek_chat_history')
  }
}

const showSettings = ref(false)
const saveApiKey = () => {
  localStorage.setItem('deepseek_api_key', apiKey.value)
  localStorage.setItem('voice_settings', JSON.stringify(voiceSettings.value))
  showSettings.value = false
}

onMounted(() => {
  initSpeech()
  const savedKey = localStorage.getItem('deepseek_api_key')
  if (savedKey) {
    apiKey.value = savedKey
  }

  const savedVoiceSettings = localStorage.getItem('voice_settings')
  if (savedVoiceSettings) {
    voiceSettings.value = JSON.parse(savedVoiceSettings)
  }

  const savedHistory = localStorage.getItem('deepseek_chat_history')
  if (savedHistory) {
    try {
      messages.value = JSON.parse(savedHistory)
    } catch (e) {
      console.error('Failed to parse chat history:', e)
      messages.value = [defaultMessage]
    }
  } else {
    messages.value = [defaultMessage]
  }
  
  scrollToBottom()
})
</script>

<template>
  <div class="chat-wrapper flex items-center justify-center p-4 min-h-full bg-[#fce4ec]">
    <div class="phone-container flex flex-col h-[90vh] w-full max-w-[400px] bg-white rounded-[40px] shadow-2xl overflow-hidden border-[8px] border-white relative">
      <!-- Header -->
      <div class="header-3d h-24 bg-[#ff8fb1] flex items-center px-6 relative overflow-visible">
        <div class="flex-1 flex flex-col">
          <div class="flex items-center gap-2">
            <span class="text-white font-black text-3xl tracking-wider drop-shadow-md">逗逗小星</span>
            <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-inner">
              <span class="text-[#ff8fb1] text-xs">❤️</span>
            </div>
          </div>
        </div>
        <div class="avatar-3d w-20 h-20 bg-white rounded-full border-4 border-[#00acee] overflow-hidden shadow-lg transform translate-y-4">
          <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Nala&backgroundColor=b6e3f4" alt="avatar" class="w-full h-full object-cover" />
        </div>
      </div>

      <!-- Info Bar -->
      <div class="px-6 py-2 flex items-center gap-2">
        <div class="flex-1 bg-[#f3f4f6] rounded-full px-4 py-1 flex justify-around text-[#4b5563] font-bold text-sm shadow-inner">
          <span>5 AI</span>
          <span>3/指话</span>
        </div>
        <button class="w-8 h-8 rounded-full border-2 border-[#4b5563] flex items-center justify-center text-[#4b5563]" @click="showSettings = true">
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>

      <!-- Chat Container -->
      <div 
        ref="chatContainer"
        class="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-white"
      >
        <div 
          v-for="(msg, index) in messages" 
          :key="index"
          :class="['flex w-full', msg.role === 'user' ? 'justify-end' : 'justify-start']"
        >
          <div 
            :class="[
              'relative max-w-[85%] px-5 py-3 rounded-[24px] font-bold text-lg transition-all active:scale-95 cursor-pointer bubble-3d',
              msg.role === 'user' 
                ? 'bg-[#ffeaa7] text-[#5d4037] rounded-tr-none user-bubble' 
                : (index % 2 === 0 ? 'bg-[#ff8fb1] text-white rounded-tl-none ai-bubble-pink' : 'bg-[#74b9ff] text-white rounded-tl-none ai-bubble-blue')
            ]"
            @click="speak(msg.content)"
          >
            {{ msg.content }}
            <!-- 气泡小尾巴 -->
            <div 
              class="absolute top-0 w-4 h-4"
              :class="[
                msg.role === 'user' 
                  ? 'right-[-8px] bg-[#ffeaa7] [clip-path:polygon(0_0,0_100%,100%_0)]' 
                  : 'left-[-8px] bg-inherit [clip-path:polygon(100%_0,100%_100%,0_0)]'
              ]"
            ></div>
          </div>
        </div>
        
        <!-- Loading Indicator -->
        <div v-if="isLoading" class="flex justify-start">
          <div class="bg-[#f3f4f6] px-5 py-3 rounded-[24px] rounded-tl-none shadow-sm flex items-center gap-2">
            <span class="loading loading-dots loading-sm text-[#ff8fb1]"></span>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="p-6 bg-white border-t border-gray-100">
        <div class="voice-input-container bg-[#74b9ff] rounded-full p-1 flex items-center gap-2 shadow-lg">
          <div class="flex-1 bg-white rounded-full px-5 py-2">
            <input 
              v-model="userInput"
              type="text" 
              placeholder="いこはい" 
              class="w-full outline-none text-[#4b5563] font-bold text-lg bg-transparent"
              @keyup.enter="sendMessage"
            />
          </div>
          <button 
            @click="toggleListening"
            :class="['w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90', isListening ? 'bg-red-500 animate-pulse' : 'bg-[#ff4d94]']"
          >
            <Mic v-if="!isListening" class="w-6 h-6 text-white" />
            <MicOff v-else class="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      <!-- Tools Overlay (Hidden by default, triggered by settings) -->
      <div v-if="showSettings" class="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div class="bg-white rounded-[32px] p-8 w-full shadow-2xl scale-in-center">
          <h3 class="font-black text-2xl mb-6 text-[#ff8fb1] flex items-center gap-2">
             <Settings class="w-6 h-6" /> 设置
          </h3>
          <div class="space-y-4">
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-bold text-gray-600">DeepSeek API Key</span>
              </label>
              <input 
                v-model="apiKey"
                type="password" 
                placeholder="sk-..." 
                class="input input-bordered rounded-2xl border-2 focus:border-[#ff8fb1] w-full" 
              />
            </div>

            <!-- 语音设置 -->
            <div class="divider">声音挑选</div>
            <div class="form-control w-full space-y-3">
              <div class="flex items-center gap-2">
                <select 
                  v-model="voiceSettings.selectedVoiceName" 
                  class="select select-bordered select-sm rounded-xl flex-1 font-bold text-gray-600"
                >
                  <option v-for="voice in availableVoices" :key="voice.name" :value="voice.name">
                    {{ voice.name.includes('Online') ? '🌟 ' : '' }}{{ voice.name }}
                  </option>
                </select>
                <button class="btn btn-circle btn-sm btn-secondary" @click="testVoice">
                  <Volume2 class="w-4 h-4" />
                </button>
              </div>
              
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-400">甜美度 (音调)</label>
                <input type="range" min="0.5" max="2" step="0.1" v-model="voiceSettings.pitch" class="range range-xs range-secondary" />
              </div>
            </div>

            <div class="flex gap-3 pt-4">
              <button class="btn flex-1 bg-[#ff8fb1] hover:bg-[#ff4d94] text-white border-none rounded-2xl font-bold" @click="saveApiKey">保存</button>
              <button class="btn flex-1 bg-gray-100 text-gray-500 border-none rounded-2xl font-bold" @click="showSettings = false">取消</button>
            </div>
            <button class="btn btn-ghost btn-sm w-full text-red-400 mt-4" @click="clearChat">
              <Trash2 class="w-4 h-4 mr-1" /> 清除聊天记录
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-wrapper {
  font-family: 'Hiragino Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.header-3d {
  box-shadow: 0 4px 15px rgba(255, 143, 177, 0.3);
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
}

.avatar-3d {
  box-shadow: 0 8px 20px rgba(0, 172, 238, 0.2);
}

/* 拟态效果 */
.shadow-inner {
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}

.bubble-3d {
  box-shadow: 
    0 4px 10px rgba(0,0,0,0.1),
    inset 0 -4px 0 rgba(0,0,0,0.1);
}

.user-bubble {
  border-bottom: 3px solid #e0c570;
}

.ai-bubble-pink {
  border-bottom: 3px solid #e67e9c;
}

.ai-bubble-blue {
  border-bottom: 3px solid #5da3e6;
}

.scale-in-center {
  animation: scale-in-center 0.3s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
}

@keyframes scale-in-center {
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

/* 隐藏滚动条但保留滚动功能 */
::-webkit-scrollbar {
  display: none;
}

/* 输入框聚焦效果 */
input::placeholder {
  color: #d1d5db;
  font-weight: bold;
}
</style>

<style scoped>
.chat-bubble {
  max-width: 90%;
}
</style>
