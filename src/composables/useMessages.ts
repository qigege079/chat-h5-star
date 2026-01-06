import { ref, watch, nextTick, Ref } from "vue";
import axios from "axios";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ModelConfig {
  url: string;
  model: string;
}

interface ModelConfigs {
  [key: string]: ModelConfig;
}

interface ApiKeys {
  [key: string]: string;
}

export function useMessages() {
  const messages = ref<Message[]>([]);
  const isLoading = ref(false);
  const userInput = ref("");
  const chatContainer: Ref<HTMLElement | null> = ref(null);

  const apiKeys = ref<ApiKeys>({
    "deepseek-chat": "sk-6624657ac8d9443c9046a397593febd2",
    "mimo-v2-flash": "sk-cmhkc7ysrtd6qu7dl3wthyiez7wezmhrut798hciuxpzx25a"
  });

  const selectedModel = ref<string>("deepseek-chat");

  const modelConfigs: ModelConfigs = {
    "deepseek-chat": {
      url: "https://api.deepseek.com/v1/chat/completions",
      model: "deepseek-chat"
    },
    "mimo-v2-flash": {
      url: "https://api.xiaomimimo.com/v1/chat/completions",
      model: "mimo-v2-flash"
    }
  };

  const systemPrompt =
    "你是一个温柔、博学且充满童心的 AI 大姐姐。你的名字叫'小星'，主要陪伴一位3岁的女孩聊天。请使用生动有趣的语言，多用表情符号，严禁输出任何暴力、负面或不适合儿童的内容。如果她问到深奥的科学问题，请用简单的比喻来解释。";

  const generateId = () => Date.now() + Math.random().toString(36).substr(2, 9);

  const defaultMessage: Message = {
    id: generateId(),
    role: "assistant",
    content:
      "宝贝你好呀！🌟 我是你的好朋友小星大姐姐。很高兴能陪你聊天！今天你遇到了什么好玩的事情吗？或者想听小星给你讲个小故事？🌈",
  };

  let storageTimer: NodeJS.Timeout | null = null;

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

  const loadMessages = () => {
    const saved = localStorage.getItem("deepseek_chat_history");
    if (saved) {
      try {
        messages.value = JSON.parse(saved);
      } catch (e) {
        messages.value = [defaultMessage];
      }
    } else {
      messages.value = [defaultMessage];
    }
  };

  const scrollToBottom = async () => {
    await nextTick();
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  };

  const sendMessage = async (customText = null) => {
    const text = customText || userInput.value.trim();
    if (!text) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: text,
    };

    messages.value.push(userMessage);
    userInput.value = "";
    isLoading.value = true;

    await scrollToBottom();

    try {
      const currentModelConfig = modelConfigs[selectedModel.value];
      const apiKey = apiKeys.value[selectedModel.value];

      let requestBody;
      let currentUrl = currentModelConfig.url;
      
      if (selectedModel.value === "mimo-v2-flash") {
        requestBody = {
          model: currentModelConfig.model,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.value.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ],
          stream: false,
        };
        currentUrl = "/api/v1/chat/completions";
      } else {
        requestBody = {
          model: currentModelConfig.model,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.value.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ],
          stream: false,
        };
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (selectedModel.value === "mimo-v2-flash") {
        headers["api-key"] = apiKey;
      } else {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const response = await axios.post(currentUrl, requestBody, {
        headers,
      });

      let assistantContent;
      
      if (selectedModel.value === "mimo-v2-flash") {
        assistantContent = response.data.choices[0].message.content;
      } else {
        assistantContent = response.data.choices[0].message.content;
      }

      const newMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
      };
      messages.value.push(newMessage);

      const targetMsg = messages.value[messages.value.length - 1];

      let i = 0;
      const typeWriter = () => {
        if (i < assistantContent.length) {
          targetMsg.content += assistantContent.charAt(i);
          i++;
          scrollToBottom();
          setTimeout(typeWriter, 30);
        } else {
          isLoading.value = false;
        }
      };

      typeWriter();
    } catch (error) {
      console.error("API Error:", error);
      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "哎呀，小星姐姐现在有点累了，让我休息一下再陪你聊天吧～😴",
      };
      messages.value.push(errorMessage);
      await scrollToBottom();
    } finally {
      isLoading.value = false;
    }
  };

  const clearChat = () => {
    messages.value = [defaultMessage];
    localStorage.removeItem("deepseek_chat_history");
  };

  const saveApiKey = () => {
    localStorage.setItem("api_keys", JSON.stringify(apiKeys.value));
  };

  loadMessages();

  return {
    messages,
    isLoading,
    userInput,
    chatContainer,
    apiKeys,
    selectedModel,
    modelConfigs,
    sendMessage,
    clearChat,
    saveApiKey,
    scrollToBottom,
  };
}
