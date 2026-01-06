import axios from 'axios';

// 创建 axios 实例
const request = axios.create({
  // 基础路径，优先读取环境变量中的 VITE_API_URL
  baseURL: import.meta.env.VITE_API_URL || 'https://doudou1.zeabur.app',
  // 超时时间
  timeout: 30000,
  // 请求头
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 你可以在这里统一添加 token 等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 统一处理返回数据
    return response.data;
  },
  (error) => {
    console.error('API请求错误:', error.response || error.message);
    return Promise.reject(error);
  }
);

export default request;
