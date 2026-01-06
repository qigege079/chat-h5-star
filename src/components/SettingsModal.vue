<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50"
  >
    <div class="bg-white rounded-2xl p-6 w-96 max-w-[90vw] shadow-2xl">
      <h2 class="text-xl font-bold mb-4 text-gray-800">设置</h2>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">选择模型</label>
          <select
            v-model="localSelectedModel"
            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent"
          >
            <option value="deepseek-chat">DeepSeek Chat</option>
            <option value="mimo-v2-flash">小米 MiMo Flash</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">DeepSeek API Key</label>
          <input
            v-model="localApiKeys['deepseek-chat']"
            type="password"
            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent"
            placeholder="请输入 DeepSeek API Key"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">小米 MiMo API Key</label>
          <input
            v-model="localApiKeys['mimo-v2-flash']"
            type="password"
            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent"
            placeholder="请输入小米 MiMo API Key"
          />
        </div>

        <div class="border-t pt-4">
          <h3 class="text-lg font-semibold mb-3 text-gray-800">语音设置</h3>
          
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">选择语音</label>
              <select
                v-model="localVoiceSettings.selectedVoiceName"
                class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              >
                <option
                  v-for="voice in availableVoices"
                  :key="voice.name"
                  :value="voice.name"
                >
                  {{ voice.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                音调: {{ localVoiceSettings.pitch.toFixed(1) }}
              </label>
              <input
                v-model.number="localVoiceSettings.pitch"
                type="range"
                min="0.8"
                max="1.5"
                step="0.1"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                语速: {{ localVoiceSettings.rate.toFixed(1) }}
              </label>
              <input
                v-model.number="localVoiceSettings.rate"
                type="range"
                min="0.7"
                max="1.3"
                step="0.1"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                音量: {{ localVoiceSettings.volume.toFixed(1) }}
              </label>
              <input
                v-model.number="localVoiceSettings.volume"
                type="range"
                min="0"
                max="1"
                step="0.1"
                class="w-full"
              />
            </div>

            <button
              @click="testVoice"
              class="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white py-2 px-4 rounded-lg hover:from-pink-500 hover:to-purple-600 transition-all"
            >
              测试语音
            </button>
          </div>
        </div>

        <div class="flex gap-3 pt-4">
          <button
            @click="handleSave"
            class="flex-1 bg-gradient-to-r from-pink-400 to-purple-500 text-white py-2 px-4 rounded-lg hover:from-pink-500 hover:to-purple-600 transition-all"
          >
            保存
          </button>
          <button
            @click="handleCancel"
            class="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-all"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  selectedModel: {
    type: String,
    required: true,
  },
  apiKeys: {
    type: Object,
    required: true,
  },
  voiceSettings: {
    type: Object,
    required: true,
  },
  availableVoices: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close", "save", "testVoice"]);

const localSelectedModel = ref(props.selectedModel);
const localApiKeys = ref({ ...props.apiKeys });
const localVoiceSettings = ref({ ...props.voiceSettings });

watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      localSelectedModel.value = props.selectedModel;
      localApiKeys.value = { ...props.apiKeys };
      localVoiceSettings.value = { ...props.voiceSettings };
    }
  }
);

const handleSave = () => {
  emit("save", {
    selectedModel: localSelectedModel.value,
    apiKeys: { ...localApiKeys.value },
    voiceSettings: { ...localVoiceSettings.value },
  });
  emit("close");
};

const handleCancel = () => {
  emit("close");
};

const testVoice = () => {
  emit("testVoice", { ...localVoiceSettings.value });
};
</script>
