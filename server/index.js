/**
 * Node.js 后端核心文件 - index.js (多会话版)
 * 
 * 此次升级：支持了多个聊天流（Session），用户可以创建新聊天、切换历史聊天。
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

/**
 * 💡 知识拓展：数据结构的设计
 * 
 * 之前我们用一个数组 [message1, message2] 存所有内容，这只能存一个聊天。
 * 现在我们改为“对象存储”：
 * {
 *   "session_123": { id: "session_123", title: "昨天的聊天", messages: [...] },
 *   "session_456": { id: "session_456", title: "关于恐龙的对话", messages: [...] }
 * }
 * 这样我们可以通过 ID 快速找到对应的聊天流。
 */

// 模拟数据库：存储所有的会话
let chatSessions = {};

// 默认消息模板
const getDefaultMessage = () => ({
  id: Date.now().toString(),
  role: "assistant",
  content: "宝贝你好呀！🌟 我是你的好朋友小星大姐姐。很高兴能陪你聊天！今天你遇到了什么好玩的事情吗？🌈",
});

/**
 * 1. 获取所有会话列表 (GET)
 * 用于在侧边栏展示历史记录，通常只返回 ID 和标题，不返回庞大的聊天内容
 */
app.get('/api/sessions', (req, res) => {
  // Object.values 将对象转为数组返回给前端
  const summary = Object.values(chatSessions).map(s => ({
    id: s.id,
    title: s.title,
    updatedAt: s.updatedAt
  }));
  res.json(summary);
});

/**
 * 2. 创建新会话 (POST)
 * 当用户点击“新建聊天”时触发
 */
app.post('/api/sessions', (req, res) => {
  const sessionId = 'session_' + Date.now();
  const newSession = {
    id: sessionId,
    title: '新聊天 ' + new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    messages: [getDefaultMessage()],
    updatedAt: Date.now()
  };
  chatSessions[sessionId] = newSession;
  res.json(newSession);
});

/**
 * 3. 获取特定会话的完整消息 (GET)
 * 当用户点击某个历史记录时，加载该会话的所有对话内容
 * 💡 知识拓展：动态路由参数 (:id)
 * 冒号开头的 :id 是一个占位符，可以通过 req.params.id 获取实际的值
 */
app.get('/api/sessions/:id', (req, res) => {
  const session = chatSessions[req.params.id];
  if (session) {
    res.json(session);
  } else {
    res.status(404).json({ error: '找不到该会话' });
  }
});

/**
 * 4. 更新特定会话的消息 (POST)
 * 当用户在某个聊天流中发送消息时同步
 */
app.post('/api/sessions/:id/messages', (req, res) => {
  const { messages } = req.body;
  const session = chatSessions[req.params.id];
  
  if (session && Array.isArray(messages)) {
    session.messages = messages;
    session.updatedAt = Date.now();
    
    // 💡 知识拓展：自动生成标题
    // 如果是第一条用户消息，我们可以把消息前几个字作为聊天标题
    const firstUserMsg = messages.find(m => m.role === 'user');
    if (firstUserMsg && session.title.startsWith('新聊天')) {
      session.title = firstUserMsg.content.substring(0, 10) + (firstUserMsg.content.length > 10 ? '...' : '');
    }

    res.json({ success: true });
  } else {
    res.status(404).json({ error: '会话不存在或数据无效' });
  }
});

/**
 * 5. 删除特定会话 (DELETE)
 */
app.delete('/api/sessions/:id', (req, res) => {
  if (chatSessions[req.params.id]) {
    delete chatSessions[req.params.id];
    res.json({ success: true });
  } else {
    res.status(404).json({ error: '找不到该会话' });
  }
});

// 健康检查
app.get('/', (req, res) => {
  res.send('小星大姐姐多会话后端已就绪! 🚀');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

/**
 * 💡 知识拓展板块：RESTful API 设计规范
 * 
 * 在 Node.js 开发中，我们遵循 REST 风格来设计接口：
 * - GET /sessions          -> 获取集合（复数）
 * - POST /sessions         -> 创建新资源
 * - GET /sessions/123      -> 获取特定资源（通过 ID）
 * - DELETE /sessions/123   -> 删除特定资源
 * 
 * 这种设计让接口非常直观，看到 URL 就能猜到它是干什么的。
 */
