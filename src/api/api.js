import request from './request';

/**
 * 获取所有会话列表
 */
export const getSessions = () => {
  return request.get('/api/sessions');
};

/**
 * 创建新会话
 */
export const createSession = () => {
  return request.post('/api/sessions');
};

/**
 * 获取特定会话的详情（包含消息）
 */
export const getSessionDetail = (sessionId) => {
  return request.get(`/api/sessions/${sessionId}`);
};

/**
 * 更新会话的消息记录
 */
export const updateSessionMessages = (sessionId, messages) => {
  return request.post(`/api/sessions/${sessionId}/messages`, { messages });
};

/**
 * 删除会话
 */
export const deleteSession = (sessionId) => {
  return request.delete(`/api/sessions/${sessionId}`);
};

/**
 * 发送聊天请求 (DeepSeek)
 */
/**
 * 发送聊天请求 (DeepSeek)
 * 注意：由于 AI 聊天需要流式输出 (Streaming)，我们必须使用原生的 fetch
 * 因为 axios (request.post) 对流式响应的支持在浏览器端不够友好
 */
export const chatWithDeepSeek = (url, data, apiKey) => {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
};

/**
 * 发送聊天请求 (Mimo)
 * 同样需要使用 fetch 来支持流式输出
 */
export const chatWithMimo = (url, data, apiKey) => {
  return fetch(url, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
};

/**
 * 火山引擎 TTS 接口 (直接请求火山引擎 API)
 * 注意：这部分通常建议后端代理，但为了兼容之前的逻辑，我们暂时保留前端直连
 */
export const volcengineTTS = (data) => {
  return request.post('https://openspeech.bytedance.com/api/v1/tts', data, {
    headers: {
      Authorization: `Bearer;${data.app.token}`,
    },
    responseType: 'blob',
    // 覆盖 baseURL，因为是外部接口
    baseURL: ''
  });
};
