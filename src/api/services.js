<<<<<<< HEAD
import { api } from './client';

// Health API
=======
<<<<<<< HEAD
import { api } from './client';

// Health API
=======
import { api, getApiError } from './client';

>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
export const healthAPI = {
  getStatus: () => api.get('/health'),
};

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
// Content API
export const contentAPI = {
  getAll: () => api.get('/content'),
  getByPage: (page) => api.get(`/content/${page}`),
  getByPageAndSection: (page, section) => api.get(`/content/${page}/${section}`),
<<<<<<< HEAD
=======
=======
export const contentAPI = {
  getAll: () => api.get('/content'),
  getByPage: (page) => api.get(`/content/${page}`),
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
  getGrouped: () => api.get('/content/grouped/all'),
  create: (data) => api.post('/content', data),
  update: (id, data) => api.put(`/content/${id}`, data),
  delete: (id) => api.delete(`/content/${id}`),
};

<<<<<<< HEAD
// Events API
=======
<<<<<<< HEAD
// Events API
=======
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
export const eventsAPI = {
  getAll: () => api.get('/events'),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
};

<<<<<<< HEAD
// Announcements API
=======
<<<<<<< HEAD
// Announcements API
=======
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
export const announcementsAPI = {
  getAll: () => api.get('/announcements'),
  getById: (id) => api.get(`/announcements/${id}`),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
};

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
export const documentsAPI = {
  getPublic: () => api.get('/uploads/public/documents'),
  getDownloadUrl: (id) => `${api.defaults.baseURL}/uploads/public/documents/${id}/download`,
};

// Staff API
<<<<<<< HEAD
=======
=======
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
export const staffAPI = {
  getAll: () => api.get('/staff'),
  getById: (id) => api.get(`/staff/${id}`),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`),
};

<<<<<<< HEAD
// Students API
=======
<<<<<<< HEAD
// Students API
=======
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
export const studentsAPI = {
  getAll: () => api.get('/students'),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
};

<<<<<<< HEAD
// Departments API
=======
<<<<<<< HEAD
// Departments API
=======
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
export const departmentsAPI = {
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

<<<<<<< HEAD
// Contact API
=======
<<<<<<< HEAD
// Contact API
=======
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
export const contactAPI = {
  getAll: () => api.get('/contact'),
  getById: (id) => api.get(`/contact/${id}`),
  create: (data) => api.post('/contact', data),
  update: (id, data) => api.put(`/contact/${id}`, data),
  delete: (id) => api.delete(`/contact/${id}`),
  sendMessage: (data) => api.post('/contact/messages', data),
};

<<<<<<< HEAD
// Navigation API
=======
<<<<<<< HEAD
// Navigation API
=======
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
export const navigationAPI = {
  getAll: () => api.get('/navigation'),
  getById: (id) => api.get(`/navigation/${id}`),
  create: (data) => api.post('/navigation', data),
  update: (id, data) => api.put(`/navigation/${id}`, data),
  delete: (id) => api.delete(`/navigation/${id}`),
};

<<<<<<< HEAD
// Site Settings API
=======
<<<<<<< HEAD
// Site Settings API
=======
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
export const siteAPI = {
  getAll: () => api.get('/site'),
  getByKey: (key) => api.get(`/site/${key}`),
  update: (key, value) => api.put(`/site/${key}`, { value }),
};

<<<<<<< HEAD
// Users API
=======
<<<<<<< HEAD
// Users API
=======
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('auth_user') || localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  setToken: (token, user) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
  },
};

// Uploads API
export const uploadsAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadVideo: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/uploads/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/uploads/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Gallery API
<<<<<<< HEAD
=======
=======
export const uploadsAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/uploads', formData);
  },
};

export const timetablesAPI = {
  getAll: () => api.get('/timetables'),
  getById: (id) => api.get(`/timetables/${id}`),
  create: (data) => api.post('/timetables', data),
  update: (id, data) => api.put(`/timetables/${id}`, data),
  delete: (id) => api.delete(`/timetables/${id}`),
};

>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
export const galleryAPI = {
  getAll: () => api.get('/gallery'),
  getByType: (mediaType) => api.get(`/gallery/type/${mediaType}`),
  getById: (id) => api.get(`/gallery/${id}`),
  create: (data) => api.post('/gallery', data),
  update: (id, data) => api.put(`/gallery/${id}`, data),
  delete: (id) => api.delete(`/gallery/${id}`),
};
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main

export const resultsAPI = {
  lookup: (studentName, programCode, classLevel) =>
    api.post("/results/lookup", { student_name: studentName, program_code: programCode, class_level: classLevel }),
};
<<<<<<< HEAD


// Academic results workflow (shared PostgreSQL backend).
export const academicAPI = {
  getModules: () => api.get("/academic/modules"),
  createModule: (data) => api.post("/academic/modules", data),
  getSheet: (id) => api.get(`/academic/modules/${id}/sheet`),
  saveMarks: (id, marks) => api.put(`/academic/modules/${id}/marks`, { marks }),
  submitModule: (id) => api.post(`/academic/modules/${id}/submit`),
  reopenModule: (id) => api.post(`/academic/modules/${id}/reopen`),
  generateResults: (data) => api.post("/academic/generate", data),
  publishResults: (data) => api.post("/academic/publish", data),
};
=======
=======
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
