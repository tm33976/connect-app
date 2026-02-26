import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("connect_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally (token expired)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("connect_token");
      localStorage.removeItem("connect_user");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

// Auth 
export const register = (data) => api.post("/auth/register", data);
export const login = (data) => api.post("/auth/login", data);
export const getMe = () => api.get("/auth/me");
export const updateProfile = (data) => api.patch("/auth/profile", data);

export const uploadAvatar = (file) => {
  const form = new FormData();
  form.append("avatar", file);
  return api.patch("/auth/avatar", form, { headers: { "Content-Type": "multipart/form-data" } });
};

export const removeAvatar = () => {
  const form = new FormData();
  form.append("remove", "true");
  return api.patch("/auth/avatar", form, { headers: { "Content-Type": "multipart/form-data" } });
};

// Users 
export const searchUsers = (search = "", page = 1) =>
  api.get("/users", { params: { search, page, limit: 50 } });
export const getUser = (id) => api.get(`/users/${id}`);

// Conversations
export const getConversations = () => api.get("/conversations");
export const startConversation = (userId) =>
  api.post("/conversations", { userId });

// Messages 
export const getMessages = (conversationId, page = 1) =>
  api.get(`/messages/${conversationId}`, { params: { page, limit: 30 } });

// Supports text-only or file 
export const sendMessage = (conversationId, text, file = null) => {
  if (file) {
    const form = new FormData();
    form.append("conversationId", conversationId);
    if (text) form.append("text", text);
    form.append("file", file);
    return api.post("/messages", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return api.post("/messages", { conversationId, text });
};

export const markRead = (conversationId) =>
  api.patch(`/messages/${conversationId}/read`);

export default api;