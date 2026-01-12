import { ref, watch, nextTick } from "vue";
import * as api from "../api/api";

export function useMessages() {
  const messages = ref([]);
  const sessions = ref([]);
  const currentSessionId = ref("");
  const isLoading = ref(false);
  const userInput = ref("");
  const chatContainer = ref(null);

  const apiKeys = ref({
    "deepseek-chat": "sk-6624657ac8d9443c9046a397593febd2",
    "mimo-v2-flash": "sk-cmhkc7ysrtd6qu7dl3wthyiez7wezmhrut798hciuxpzx25a",
  });

  const selectedModel = ref("deepseek-chat");

  const modelConfigs = {
    "deepseek-chat": {
      url: "https://api.deepseek.com/v1/chat/completions",
      model: "deepseek-chat",
    },
    "mimo-v2-flash": {
      url: "https://api.xiaomimimo.com/v1/chat/completions",
      model: "mimo-v2-flash",
    },
  };

  const systemPrompt =
    "你是一个温柔、博学且充满童心的 AI 大姐姐。你的名字叫'小星'，主要陪伴一位3岁的女孩聊天。请使用生动有趣的语言，多用表情符号，严禁输出任何暴力、负面或不适合儿童的内容。如果她问到深奥的科学问题，请用简单的比喻来解释。";

  const generateId = () => Date.now() + Math.random().toString(36).substr(2, 9);

  const storageTimer = ref(null);

  // 监听消息变化，同步到后端
  watch(
    messages,
    (newMessages) => {
      if (!currentSessionId.value) return;

      if (storageTimer.value) clearTimeout(storageTimer.value);
      storageTimer.value = setTimeout(async () => {
        try {
          await api.updateSessionMessages(currentSessionId.value, newMessages);
          // 同步成功后刷新列表标题（可能有变化）
          loadSessions();
        } catch (error) {
          console.error("同步记录到后端失败:", error);
        }
      }, 1000);
    },
    { deep: true }
  );

  // 加载会话列表
  const loadSessions = async () => {
    try {
      const response = await api.getSessions();
      sessions.value = response.sort((a, b) => b.updatedAt - a.updatedAt);

      // 如果没有当前会话且列表有数据，默认加载第一个
      if (!currentSessionId.value && sessions.value.length > 0) {
        switchSession(sessions.value[0].id);
      } else if (sessions.value.length === 0) {
        // 如果彻底没数据，创建一个
        createNewChat();
      }
    } catch (error) {
      console.error("加载会话列表失败:", error);
    }
  };

  // 切换会话
  const switchSession = async (id) => {
    try {
      currentSessionId.value = id;
      const response = await api.getSessionDetail(id);
      messages.value = response.messages;
      await scrollToBottom();
    } catch (error) {
      console.error("切换会话失败:", error);
    }
  };

  // 新建会话
  const createNewChat = async () => {
    try {
      const response = await api.createSession();
      const newSession = response;
      currentSessionId.value = newSession.id;
      messages.value = newSession.messages;
      await loadSessions();
      await scrollToBottom();
    } catch (error) {
      console.error("新建会话失败:", error);
    }
  };

  // 删除会话
  const deleteSession = async (id) => {
    try {
      await api.deleteSession(id);
      if (currentSessionId.value === id) {
        currentSessionId.value = "";
        messages.value = [];
      }
      await loadSessions();
    } catch (error) {
      console.error("删除会话失败:", error);
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

    const userMessage = {
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

      const requestData = {
        model: currentModelConfig.model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.value.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        stream: true, // 开启流式输出
      };

      let response;
      if (selectedModel.value === "mimo-v2-flash") {
        response = await api.chatWithMimo(
          "/api/v1/chat/completions",
          requestData,
          apiKey
        );
      } else {
        response = await api.chatWithDeepSeek(
          currentModelConfig.url,
          requestData,
          apiKey
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `请求失败: ${response.status}`
        );
      }

      // 创建一个新的消息用于展示 AI 回复
      const newMessage = {
        id: generateId(),
        role: "assistant",
        content: "",
      };
      messages.value.push(newMessage);
      const targetMsg = messages.value[messages.value.length - 1];

      // 读取流式数据
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        let res = await reader.read();
        const { value, done: readerDone } = res
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value);
          // 处理 SSE 格式的数据 (data: {...})
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6).trim();
              if (dataStr === "[DONE]") {
                done = true;
                break;
              }
              try {
                const data = JSON.parse(dataStr);
                const content = data.choices[0]?.delta?.content || "";
                if (content) {
                  targetMsg.content += content;
                  scrollToBottom();
                }
              } catch (e) {
                // 忽略解析失败的碎片
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("API Error:", error);
      const errorMessage = {
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

  const clearChat = async () => {
    if (currentSessionId.value) {
      await deleteSession(currentSessionId.value);
    }
  };

  const saveApiKey = () => {
    localStorage.setItem("api_keys", JSON.stringify(apiKeys.value));
  };

  loadSessions();

  return {
    messages,
    sessions,
    currentSessionId,
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
    createNewChat,
    switchSession,
    deleteSession,
    loadSessions,
  };
}
