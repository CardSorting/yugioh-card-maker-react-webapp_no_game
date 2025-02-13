import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3000/api';

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add auth token to requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const auth = {
  async register(email: string, password: string, username: string) {
    const { data } = await client.post('/auth/register', {
      email,
      password,
      username,
    });
    localStorage.setItem('token', data.token);
    return data;
  },

  async login(email: string, password: string) {
    const { data } = await client.post('/auth/login', {
      email,
      password,
    });
    localStorage.setItem('token', data.token);
    return data;
  },

  async getCurrentUser() {
    const { data } = await client.get('/auth/me');
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },
};

// Cards
export const cards = {
  async create(cardData: any) {
    const formData = new FormData();
    Object.keys(cardData).forEach((key) => {
      if (cardData[key] !== undefined) {
        formData.append(key, cardData[key]);
      }
    });
    const { data } = await client.post('/cards', formData);
    return data;
  },

  async update(id: string, cardData: any) {
    const formData = new FormData();
    Object.keys(cardData).forEach((key) => {
      if (cardData[key] !== undefined) {
        formData.append(key, cardData[key]);
      }
    });
    const { data } = await client.put(`/cards/${id}`, formData);
    return data;
  },

  async delete(id: string) {
    await client.delete(`/cards/${id}`);
  },

  async get(id: string) {
    const { data } = await client.get(`/cards/${id}`);
    return data;
  },

  async list(params?: any) {
    const { data } = await client.get('/cards', { params });
    return data;
  },
};

// Decks
export const decks = {
  async create(deckData: any) {
    const { data } = await client.post('/decks', deckData);
    return data;
  },

  async update(id: string, deckData: any) {
    const { data } = await client.put(`/decks/${id}`, deckData);
    return data;
  },

  async delete(id: string) {
    await client.delete(`/decks/${id}`);
  },

  async get(id: string) {
    const { data } = await client.get(`/decks/${id}`);
    return data;
  },

  async list(params?: any) {
    const { data } = await client.get('/decks', { params });
    return data;
  },

  async addCard(deckId: string, cardId: string, zone: string, quantity: number = 1) {
    const { data } = await client.post(`/decks/${deckId}/cards`, {
      cardId,
      zone,
      quantity,
    });
    return data;
  },

  async removeCard(deckId: string, cardId: string, zone: string) {
    await client.delete(`/decks/${deckId}/cards/${cardId}/${zone}`);
  },
};

// Social
export const social = {
  async follow(userId: string) {
    const { data } = await client.post(`/social/follow/${userId}`);
    return data;
  },

  async unfollow(userId: string) {
    await client.delete(`/social/follow/${userId}`);
  },

  async likeCard(cardId: string) {
    const { data } = await client.post(`/social/likes/${cardId}`);
    return data;
  },

  async unlikeCard(cardId: string) {
    await client.delete(`/social/likes/${cardId}`);
  },

  async addComment(cardId: string, content: string, parentId?: string) {
    const { data } = await client.post(`/social/comments`, {
      cardId,
      content,
      parentId,
    });
    return data;
  },

  async deleteComment(commentId: string) {
    await client.delete(`/social/comments/${commentId}`);
  },
};

// Profile
export const profiles = {
  async update(profileData: any) {
    const formData = new FormData();
    Object.keys(profileData).forEach((key) => {
      if (profileData[key] !== undefined) {
        formData.append(key, profileData[key]);
      }
    });
    const { data } = await client.put('/profiles', formData);
    return data;
  },

  async get(username: string) {
    const { data } = await client.get(`/profiles/${username}`);
    return data;
  },
};

export default {
  auth,
  cards,
  decks,
  social,
  profiles,
};
