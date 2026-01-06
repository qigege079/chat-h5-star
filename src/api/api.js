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
export const chatWithDeepSeek = (url, data, apiKey) => {
  return request.post(url, data, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    baseURL: '' // 覆盖默认 baseURL
  });
};

/**
 * 发送聊天请求 (Mimo)
 */
export const chatWithMimo = (url, data, apiKey) => {
  return request.post(url, data, {
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json'
    },
    baseURL: '' // 覆盖默认 baseURL
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
