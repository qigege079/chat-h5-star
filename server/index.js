const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// 模拟数据库（内存存储）
// 注意：部署到 Zeabur 后，如果服务重启，内存数据会重置。
// 后续可以接入 Redis 或 MongoDB 实现持久化。
let chatHistory = [];

// 健康检查接口
app.get('/', (req, res) => {
  res.send('小星大姐姐的后端服务正在运行中... 🌟');
});

// 获取聊天记录
app.get('/api/messages', (req, res) => {
  console.log('获取聊天记录...');
  res.json(chatHistory);
});

// 保存/更新聊天记录
app.post('/api/messages', (req, res) => {
  const { messages } = req.body;
  if (Array.isArray(messages)) {
    chatHistory = messages;
    console.log(`已更新聊天记录，当前条数: ${chatHistory.length}`);
    res.json({ success: true, count: chatHistory.length });
  } else {
    res.status(400).json({ error: '无效的数据格式' });
  }
});

// 清除记录
app.delete('/api/messages', (req, res) => {
  chatHistory = [];
  console.log('聊天记录已清除');
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
