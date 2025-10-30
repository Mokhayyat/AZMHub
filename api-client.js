/**
 * AZM Platform API Client
 * Handles all API communications between frontend and backend
 */

class AZMAPI {
  constructor() {
    this.baseURL = window.location.origin.includes('localhost') 
      ? 'http://localhost:3000' 
      : window.location.origin;
    this.token = localStorage.getItem('authToken');
    this.user = null;
    this.isAuthenticated = false;
    this.init();
  }

  init() {
    this.checkAuthStatus();
    this.setupEventListeners();
  }

  // Authentication
  async checkAuthStatus() {
    try {
      const response = await this.get('/api/auth/status');
      this.isAuthenticated = response.isAuthenticated;
      if (response.user) {
        this.user = response.user;
        this.updateUI();
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
    }
  }

  async login(email, password) {
    try {
      const response = await this.post('/api/auth/login', { email, password });
      this.setAuthToken(response.token);
      this.user = response.user;
      this.isAuthenticated = true;
      this.updateUI();
      return response;
    } catch (error) {
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await this.post('/api/auth/register', userData);
      this.setAuthToken(response.token);
      this.user = response.user;
      this.isAuthenticated = true;
      this.updateUI();
      return response;
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    try {
      await this.post('/api/auth/logout');
      this.clearAuth();
      window.location.href = '/index.html';
    } catch (error) {
      console.error('Logout error:', error);
      this.clearAuth();
    }
  }

  // User Management
  async getUserProfile() {
    return this.get('/api/users/me');
  }

  async updateUserProfile(data) {
    return this.put('/api/users/me', data);
  }

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.post('/api/users/avatar', formData, true);
  }

  // Mentor Management
  async getMentors(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/mentors?${queryString}`);
  }

  async getMentorById(id) {
    return this.get(`/api/mentors/${id}`);
  }

  async getMentorAvailability(id, date) {
    return this.get(`/api/mentors/${id}/availability?date=${date}`);
  }

  async toggleFavoriteMentor(mentorId) {
    return this.post(`/api/mentors/${mentorId}/toggle-favorite`);
  }

  async getFavoriteMentors() {
    return this.get('/api/mentors/favorites');
  }

  // Booking Management
  async createBooking(bookingData) {
    return this.post('/api/bookings', bookingData);
  }

  async getBookings(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/bookings?${queryString}`);
  }

  async getBookingById(id) {
    return this.get(`/api/bookings/${id}`);
  }

  async updateBooking(id, data) {
    return this.put(`/api/bookings/${id}`, data);
  }

  async cancelBooking(id, reason) {
    return this.put(`/api/bookings/${id}/cancel`, { reason });
  }

  async rescheduleBooking(id, newDate, reason) {
    return this.put(`/api/bookings/${id}/reschedule`, { newDate, reason });
  }

  async addFeedback(id, feedback) {
    return this.post(`/api/bookings/${id}/feedback`, feedback);
  }

  // Payment Management
  async createPaymentIntent(bookingId, paymentMethod) {
    return this.post('/api/payments/create-payment-intent', {
      bookingId,
      paymentMethod
    });
  }

  async createSubscription(priceId, paymentMethod) {
    return this.post('/api/payments/create-subscription', {
      priceId,
      paymentMethod
    });
  }

  async getPaymentMethods() {
    return this.get('/api/payments/payment-methods');
  }

  async addPaymentMethod(paymentMethodId) {
    return this.post('/api/payments/add-payment-method', {
      paymentMethodId
    });
  }

  async getPaymentHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/payments/payment-history?${queryString}`);
  }

  // Chat Management
  async getConversations(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/chat/conversations?${queryString}`);
  }

  async getConversation(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/chat/conversation/${userId}?${queryString}`);
  }

  async sendMessage(receiverId, content, messageType = 'text', attachments = []) {
    return this.post('/api/chat/send', {
      receiverId,
      content,
      messageType,
      attachments
    });
  }

  async markMessagesAsRead(senderId) {
    return this.post('/api/chat/mark-as-read', { senderId });
  }

  async getUnreadCount() {
    return this.get('/api/chat/unread-count');
  }

  // Events Management
  async getEvents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/events?${queryString}`);
  }

  async getEventById(id) {
    return this.get(`/api/events/${id}`);
  }

  async registerForEvent(eventId) {
    return this.post(`/api/events/${eventId}/register`);
  }

  async cancelEventRegistration(eventId) {
    return this.delete(`/api/events/${eventId}/register`);
  }

  async getEventRegistrations() {
    return this.get('/api/events/registrations/me');
  }

  // Podcasts Management
  async getPodcasts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/podcasts?${queryString}`);
  }

  async getPodcastById(id) {
    return this.get(`/api/podcasts/${id}`);
  }

  async likePodcast(id) {
    return this.post(`/api/podcasts/${id}/like`);
  }

  async unlikePodcast(id) {
    return this.delete(`/api/podcasts/${id}/like`);
  }

  async addPodcastComment(id, comment) {
    return this.post(`/api/podcasts/${id}/comments`, { comment });
  }

  async getPodcastComments(id, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/podcasts/${id}/comments?${queryString}`);
  }

  // Content Management
  async getBlogPosts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/content/blog?${queryString}`);
  }

  async getBlogPostById(id) {
    return this.get(`/api/content/blog/${id}`);
  }

  async getResources(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/content/resources?${queryString}`);
  }

  async downloadResource(id) {
    return this.post(`/api/content/resources/${id}/download`);
  }

  async rateResource(id, rating) {
    return this.post(`/api/content/resources/${id}/rate`, { rating });
  }

  // Analytics
  async getUserAnalytics(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/analytics/user/${userId}?${queryString}`);
  }

  async getPlatformOverview(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/analytics/platform-overview?${queryString}`);
  }

  // AI Matching
  async getMentorMatches(studentProfile, preferences) {
    return this.post('/api/match-mentors', {
      studentProfile,
      preferences
    });
  }

  // Utility Methods
  async get(endpoint) {
    return this.request(endpoint, 'GET');
  }

  async post(endpoint, data, isFormData = false) {
    return this.request(endpoint, 'POST', data, isFormData);
  }

  async put(endpoint, data, isFormData = false) {
    return this.request(endpoint, 'PUT', data, isFormData);
  }

  async delete(endpoint) {
    return this.request(endpoint, 'DELETE');
  }

  async request(endpoint, method = 'GET', data = null, isFormData = false) {
    const config = {
      method,
      headers: {}
    };

    // Add auth token
    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Add content type for non-form data
    if (!isFormData) {
      config.headers['Content-Type'] = 'application/json';
    }

    // Add body for POST/PUT requests
    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = isFormData ? data : JSON.stringify(data);
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  }

  setAuthToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearAuth() {
    this.token = null;
    this.user = null;
    this.isAuthenticated = false;
    localStorage.removeItem('authToken');
  }

  updateUI() {
    // Update navigation based on auth status
    const authElements = document.querySelectorAll('[data-auth]');
    const noAuthElements = document.querySelectorAll('[data-no-auth]');

    authElements.forEach(el => {
      el.style.display = this.isAuthenticated ? 'block' : 'none';
    });

    noAuthElements.forEach(el => {
      el.style.display = this.isAuthenticated ? 'none' : 'block';
    });

    // Update user avatar if available
    if (this.user && this.user.avatar) {
      const avatarElements = document.querySelectorAll('[data-user-avatar]');
      avatarElements.forEach(el => {
        el.src = this.user.avatar;
      });
    }
  }

  setupEventListeners() {
    // Handle logout buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-logout]')) {
        e.preventDefault();
        this.logout();
      }
    });

    // Handle auth forms
    document.addEventListener('submit', (e) => {
      if (e.target.matches('[data-login-form]')) {
        e.preventDefault();
        this.handleLoginForm(e.target);
      }

      if (e.target.matches('[data-register-form]')) {
        e.preventDefault();
        this.handleRegisterForm(e.target);
      }
    });
  }

  async handleLoginForm(form) {
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const response = await this.login(email, password);
      this.showNotification('Login successful!', 'success');
      
      // Redirect based on user type
      setTimeout(() => {
        if (response.user.userType === 'mentor') {
          window.location.href = '/mentors.html';
        } else {
          window.location.href = '/index.html';
        }
      }, 1000);
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }

  async handleRegisterForm(form) {
    const formData = new FormData(form);
    const userData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      password: formData.get('password'),
      userType: formData.get('userType') || 'student'
    };

    try {
      const response = await this.register(userData);
      this.showNotification('Registration successful! Please check your email.', 'success');
      
      // Redirect to login after delay
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 2000);
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white max-w-sm ${
      type === 'success' ? 'bg-green-500' : 
      type === 'error' ? 'bg-red-500' : 
      'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    if (typeof anime !== 'undefined') {
      anime({
        targets: notification,
        translateX: [300, 0],
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutQuart'
      });
    }
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (typeof anime !== 'undefined') {
        anime({
          targets: notification,
          translateX: [0, 300],
          opacity: [1, 0],
          duration: 300,
          easing: 'easeInQuart',
          complete: () => notification.remove()
        });
      } else {
        notification.remove();
      }
    }, 5000);
  }
}

// Initialize API client
const api = new AZMAPI();

// Make API client globally available
window.api = api;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AZMAPI;
}