// AZM Platform - Main JavaScript File
// Handles all interactive functionality across the website

// Global variables
let currentAudio = null;
let isPlaying = false;
let chatOpen = false;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    initializeNavigation();
    initializeMentorFilters();
    initializeEventFilters();
    initializePodcastFilters();
    initializeContactForm();
    initializeFAQ();
    initializeChat();
    initializeParticles();
    initializeStatsCounters();
    initializeMobileMenu();
});

// Animation initialization
function initializeAnimations() {
    // Typewriter effect for hero text
    if (document.getElementById('typed-text')) {
        new Typed('#typed-text', {
            strings: ['Expert Mentors', 'Industry Leaders', 'Success Stories', 'Your Future'],
            typeSpeed: 80,
            backSpeed: 60,
            backDelay: 2000,
            loop: true,
            showCursor: true,
            cursorChar: '|'
        });
    }

    // Reveal animations on scroll
    const revealElements = document.querySelectorAll('.reveal-text');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(el => observer.observe(el));
}

// Navigation functionality
function initializeNavigation() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function toggleMobileMenu() {
    // Mobile menu toggle functionality
    console.log('Mobile menu toggled');
}

// Mentor filtering system
function initializeMentorFilters() {
    const filterButtons = document.querySelectorAll('.mentor-filter-btn');
    const mentorCards = document.querySelectorAll('.mentor-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Filter mentors
            mentorCards.forEach(card => {
                const categories = card.getAttribute('data-category');
                if (filter === 'all' || (categories && categories.includes(filter))) {
                    card.style.display = 'block';
                    anime({
                        targets: card,
                        opacity: [0, 1],
                        translateY: [20, 0],
                        duration: 300,
                        easing: 'easeOutQuad'
                    });
                } else {
                    anime({
                        targets: card,
                        opacity: 0,
                        translateY: -20,
                        duration: 200,
                        easing: 'easeInQuad',
                        complete: () => {
                            card.style.display = 'none';
                        }
                    });
                }
            });
        });
    });
}

// Event filtering system
function initializeEventFilters() {
    const filterButtons = document.querySelectorAll('.event-filter-btn');
    const eventCards = document.querySelectorAll('.event-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Filter events
            eventCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    card.style.display = 'block';
                    anime({
                        targets: card,
                        opacity: [0, 1],
                        translateY: [20, 0],
                        duration: 300,
                        easing: 'easeOutQuad'
                    });
                } else {
                    anime({
                        targets: card,
                        opacity: 0,
                        translateY: -20,
                        duration: 200,
                        easing: 'easeInQuad',
                        complete: () => {
                            card.style.display = 'none';
                        }
                    });
                }
            });
        });
    });
}

// Podcast filtering system
function initializePodcastFilters() {
    const filterButtons = document.querySelectorAll('.podcast-filter-btn');
    const podcastCards = document.querySelectorAll('.podcast-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Filter podcasts
            podcastCards.forEach(card => {
                const categories = card.getAttribute('data-category');
                if (filter === 'all' || (categories && categories.includes(filter))) {
                    card.style.display = 'block';
                    anime({
                        targets: card,
                        opacity: [0, 1],
                        translateY: [20, 0],
                        duration: 300,
                        easing: 'easeOutQuad'
                    });
                } else {
                    anime({
                        targets: card,
                        opacity: 0,
                        translateY: -20,
                        duration: 200,
                        easing: 'easeInQuad',
                        complete: () => {
                            card.style.display = 'none';
                        }
                    });
                }
            });
        });
    });
}

// Event booking functionality
function openBookingModal(eventId) {
    const modal = document.getElementById('booking-modal');
    const content = document.getElementById('booking-content');
    
    // Event data
    const events = {
        'padel-tournament': {
            name: 'AZM Winter Padel Championship',
            price: 45,
            date: 'December 15, 2024',
            time: '9:00 AM - 6:00 PM',
            location: 'Padel Center Dubai'
        },
        'startup-workshop': {
            name: 'Startup Fundamentals Workshop',
            price: 25,
            date: 'December 17, 2024',
            time: '2:00 PM - 6:00 PM',
            location: 'Innovation Hub'
        },
        'networking-event': {
            name: 'Year-End Mentor Meetup',
            price: 0,
            date: 'December 20, 2024',
            time: '7:00 PM - 10:00 PM',
            location: 'Rooftop Lounge'
        }
    };

    const event = events[eventId];
    if (!event) return;

    content.innerHTML = `
        <div class="mb-6">
            <h4 class="font-display font-semibold text-xl text-gray-800 mb-2">${event.name}</h4>
            <div class="space-y-2 text-gray-600">
                <div class="flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8m-8 0v10a2 2 0 002 2h8a2 2 0 002-2V8m-8 0V6"></path>
                    </svg>
                    ${event.date}
                </div>
                <div class="flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    ${event.time}
                </div>
                <div class="flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    ${event.location}
                </div>
            </div>
        </div>
        
        <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <div class="flex justify-between items-center">
                <span class="font-semibold">Registration Fee:</span>
                <span class="font-bold text-teal-400">${event.price === 0 ? 'Free' : '$' + event.price}</span>
            </div>
        </div>
        
        <form id="booking-form" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input type="text" required class="form-input w-full" placeholder="John">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input type="text" required class="form-input w-full" placeholder="Doe">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" required class="form-input w-full" placeholder="john@example.com">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input type="tel" required class="form-input w-full" placeholder="+1 (555) 123-4567">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Any special requirements?</label>
                <textarea rows="3" class="form-input w-full resize-none" placeholder="Dietary restrictions, accessibility needs, etc."></textarea>
            </div>
            <div class="flex items-center justify-between pt-4">
                ${event.price > 0 ? `
                    <button type="button" onclick="proceedToPayment('${eventId}')" class="btn-primary px-6 py-3 rounded-full font-semibold">
                        Proceed to Payment
                    </button>
                ` : `
                    <button type="submit" class="btn-primary px-6 py-3 rounded-full font-semibold">
                        Register for Free
                    </button>
                `}
            </div>
        </form>
    `;

    modal.classList.add('show');
    
    // Handle form submission
    document.getElementById('booking-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleBookingSubmission(eventId);
    });
}

function closeBookingModal() {
    const modal = document.getElementById('booking-modal');
    modal.classList.remove('show');
}

function proceedToPayment(eventId) {
    closeBookingModal();
    openPaymentModal(eventId);
}

function openPaymentModal(eventId) {
    const modal = document.getElementById('payment-modal');
    const events = {
        'padel-tournament': { name: 'AZM Winter Padel Championship', price: 45 },
        'startup-workshop': { name: 'Startup Fundamentals Workshop', price: 25 }
    };
    
    const event = events[eventId];
    if (!event) return;

    document.getElementById('event-name-summary').textContent = event.name;
    document.getElementById('event-price-summary').textContent = '$' + event.price + '.00';
    document.getElementById('total-amount').textContent = '$' + event.price + '.00';
    
    modal.classList.add('show');
    
    // Handle payment form
    document.getElementById('payment-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handlePaymentSubmission(eventId);
    });
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    modal.classList.remove('show');
}

function handleBookingSubmission(eventId) {
    // Simulate booking process
    showNotification('Registration successful! Check your email for confirmation.', 'success');
    closeBookingModal();
}

function handlePaymentSubmission(eventId) {
    // Simulate payment process
    showNotification('Payment processed successfully! You\'re registered for the event.', 'success');
    closePaymentModal();
}

// Podcast player functionality
function playEpisode(episodeId) {
    const playerSection = document.getElementById('audio-player-section');
    const episodes = {
        'featured': {
            title: 'Building Million-Dollar Startups with Sarah Chen',
            guest: 'Sarah Chen',
            duration: '42:00'
        },
        'ai-revolution': {
            title: 'AI Revolution: Building the Future',
            guest: 'Marcus Rodriguez',
            duration: '38:00'
        },
        'scaling-teams': {
            title: 'Scaling Engineering Teams',
            guest: 'Priya Patel',
            duration: '45:00'
        },
        'goldman-to-startup': {
            title: 'From Goldman Sachs to Startup Success',
            guest: 'David Kim',
            duration: '52:00'
        },
        'growth-hacking': {
            title: 'Growth Hacking Strategies',
            guest: 'Elena Voss',
            duration: '35:00'
        },
        'product-market-fit': {
            title: 'Product-Market Fit Mastery',
            guest: 'Michael Thompson',
            duration: '41:00'
        },
        'student-success': {
            title: 'From Student to Startup Founder',
            guest: 'Lisa Zhang',
            duration: '28:00'
        }
    };

    const episode = episodes[episodeId];
    if (!episode) return;

    // Update player UI
    document.getElementById('current-episode-title').textContent = episode.title;
    document.getElementById('current-episode-guest').textContent = episode.guest;
    document.getElementById('total-time').textContent = episode.duration;
    
    // Show player
    playerSection.style.display = 'block';
    
    // Simulate audio playback
    isPlaying = true;
    updatePlayButton();
    
    // Scroll to player
    playerSection.scrollIntoView({ behavior: 'smooth' });
}

function togglePlayPause() {
    isPlaying = !isPlaying;
    updatePlayButton();
}

function updatePlayButton() {
    const btn = document.getElementById('play-pause-btn');
    if (!btn) return;
    
    const icon = btn.querySelector('svg path');
    if (isPlaying) {
        icon.setAttribute('d', 'M6 4h4v16H6V4zm8 0h4v16h-4V4z'); // Pause icon
    } else {
        icon.setAttribute('d', 'M8 5v14l11-7z'); // Play icon
    }
}

// Contact form functionality
function initializeContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleContactSubmission();
    });
}

function handleContactSubmission() {
    // Simulate form submission
    showNotification('Message sent successfully! We\'ll get back to you within 2 hours.', 'success');
    document.getElementById('contact-form').reset();
}

// FAQ functionality
function initializeFAQ() {
    // FAQ is initialized with onclick handlers in HTML
}

function toggleFAQ(index) {
    const faqItems = document.querySelectorAll('.faq-item');
    const currentItem = faqItems[index];
    const answer = currentItem.querySelector('.faq-answer');
    const icon = currentItem.querySelector('.faq-icon');
    
    // Close all other FAQs
    faqItems.forEach((item, i) => {
        if (i !== index) {
            item.querySelector('.faq-answer').classList.remove('show');
            item.querySelector('.faq-icon').classList.remove('rotated');
        }
    });
    
    // Toggle current FAQ
    answer.classList.toggle('show');
    icon.classList.toggle('rotated');
}

// Chat functionality
function initializeChat() {
    // Chat is initialized with onclick handlers in HTML
}

function toggleChat() {
    const popup = document.getElementById('chat-popup');
    chatOpen = !chatOpen;
    
    if (chatOpen) {
        popup.classList.add('show');
    } else {
        popup.classList.remove('show');
    }
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const messages = document.getElementById('chat-messages');
    
    if (!input.value.trim()) return;
    
    // Add user message
    const userMessage = document.createElement('div');
    userMessage.className = 'mb-4 text-right';
    userMessage.innerHTML = `
        <div class="bg-teal-400 text-white rounded-lg p-3 inline-block max-w-xs">
            <p class="text-sm">${input.value}</p>
        </div>
        <div class="text-xs text-gray-500 mt-1">Just now</div>
    `;
    messages.appendChild(userMessage);
    
    // Clear input
    input.value = '';
    
    // Simulate bot response
    setTimeout(() => {
        const botMessage = document.createElement('div');
        botMessage.className = 'mb-4';
        botMessage.innerHTML = `
            <div class="bg-gray-100 rounded-lg p-3 inline-block max-w-xs">
                <p class="text-sm">Thanks for your message! Our team will get back to you shortly.</p>
            </div>
            <div class="text-xs text-gray-500 mt-1">Just now</div>
        `;
        messages.appendChild(botMessage);
        messages.scrollTop = messages.scrollHeight;
    }, 1000);
    
    messages.scrollTop = messages.scrollHeight;
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

// Particle animation for hero section
function initializeParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.width = Math.random() * 4 + 2 + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Stats counter animation
function initializeStatsCounters() {
    const counters = document.querySelectorAll('.stats-counter');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                
                anime({
                    targets: counter,
                    innerHTML: [0, target],
                    duration: 2000,
                    easing: 'easeOutQuad',
                    round: 1
                });
                
                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
}

// Utility functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    anime({
        targets: notification,
        translateX: [300, 0],
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutQuad'
    });
    
    // Remove after 5 seconds
    setTimeout(() => {
        anime({
            targets: notification,
            translateX: 300,
            opacity: 0,
            duration: 300,
            easing: 'easeInQuad',
            complete: () => {
                document.body.removeChild(notification);
            }
        });
    }, 5000);
}

// Event listeners for play/pause button
document.addEventListener('click', function(e) {
    if (e.target.closest('#play-pause-btn')) {
        togglePlayPause();
    }
});

// Handle modal clicks outside content
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

// Progress bar interaction
document.addEventListener('click', function(e) {
    if (e.target.closest('.progress-bar')) {
        const bar = e.target.closest('.progress-bar');
        const rect = bar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = (clickX / rect.width) * 100;
        
        const progressFill = bar.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }
    }
});

// Calendar interaction
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('calendar-day') && e.target.classList.contains('has-event')) {
        const eventId = e.target.getAttribute('data-event');
        if (eventId) {
            openBookingModal(eventId);
        }
    }
});

// Add CSS for form inputs if not already present
const style = document.createElement('style');
style.textContent = `
    .form-input {
        border: 2px solid #e2e8f0;
        border-radius: 0.75rem;
        padding: 1rem;
        transition: all 0.3s ease;
        background: white;
        width: 100%;
    }
    
    .form-input:focus {
        outline: none;
        border-color: #5CE1E6;
        box-shadow: 0 0 0 3px rgba(92, 225, 230, 0.1);
    }
`;
document.head.appendChild(style);

// ===== MENTORS PAGE FUNCTIONALITY =====

// Mentor data
const mentorsData = [
    {
        id: 1,
        name: "Sarah Chen",
        title: "Senior Product Manager",
        company: "Google",
        expertise: ["tech", "business"],
        rating: 4.9,
        reviews: 127,
        price: 150,
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
        bio: "10+ years in product management at Google. Specialized in AI/ML products and user experience design.",
        availability: "available",
        languages: ["English", "Mandarin"],
        sessionTypes: ["Career Advice", "Product Strategy", "Leadership"],
        responseTime: "< 2 hours"
    },
    {
        id: 2,
        name: "Marcus Rodriguez",
        title: "VP of Engineering",
        company: "Stripe",
        expertise: ["tech"],
        rating: 4.8,
        reviews: 89,
        price: 200,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
        bio: "Leading engineering teams at Stripe. Expert in distributed systems, fintech, and scaling teams.",
        availability: "available",
        languages: ["English", "Spanish"],
        sessionTypes: ["Technical Leadership", "System Design", "Team Building"],
        responseTime: "< 1 hour"
    },
    {
        id: 3,
        name: "Emily Watson",
        title: "Design Director",
        company: "Apple",
        expertise: ["design"],
        rating: 4.9,
        reviews: 156,
        price: 180,
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
        bio: "15 years in design leadership at Apple. Specialized in UX/UI design and design system strategy.",
        availability: "busy",
        languages: ["English", "French"],
        sessionTypes: ["Design Portfolio Review", "UX Strategy", "Design Leadership"],
        responseTime: "< 3 hours"
    },
    {
        id: 4,
        name: "David Kim",
        title: "Chief Marketing Officer",
        company: "Airbnb",
        expertise: ["marketing", "business"],
        rating: 4.7,
        reviews: 73,
        price: 175,
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
        bio: "CMO at Airbnb. Expert in growth marketing, brand strategy, and scaling marketing organizations.",
        availability: "available",
        languages: ["English", "Korean"],
        sessionTypes: ["Marketing Strategy", "Brand Building", "Growth Hacking"],
        responseTime: "< 2 hours"
    },
    {
        id: 5,
        name: "Lisa Thompson",
        title: "Investment Partner",
        company: "Sequoia Capital",
        expertise: ["finance", "business"],
        rating: 4.8,
        reviews: 94,
        price: 250,
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
        bio: "Investment partner at Sequoia Capital. Expert in venture capital, startup funding, and business strategy.",
        availability: "available",
        languages: ["English"],
        sessionTypes: ["Fundraising Strategy", "Pitch Deck Review", "Business Model"],
        responseTime: "< 4 hours"
    },
    {
        id: 6,
        name: "Alex Johnson",
        title: "Principal Engineer",
        company: "Microsoft",
        expertise: ["tech"],
        rating: 4.9,
        reviews: 112,
        price: 160,
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
        bio: "Principal Engineer at Microsoft. Expert in cloud architecture, AI/ML, and developer tools.",
        availability: "available",
        languages: ["English"],
        sessionTypes: ["Code Review", "Architecture Design", "Career Growth"],
        responseTime: "< 1 hour"
    },
    {
        id: 7,
        name: "Rachel Green",
        title: "Creative Director",
        company: "Netflix",
        expertise: ["design", "marketing"],
        rating: 4.8,
        reviews: 87,
        price: 170,
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
        bio: "Creative Director at Netflix. Expert in brand design, creative strategy, and visual storytelling.",
        availability: "busy",
        languages: ["English", "Spanish"],
        sessionTypes: ["Creative Direction", "Brand Design", "Portfolio Review"],
        responseTime: "< 2 hours"
    },
    {
        id: 8,
        name: "Michael Chen",
        title: "Head of Product",
        company: "Uber",
        expertise: ["tech", "business"],
        rating: 4.7,
        reviews: 98,
        price: 190,
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face",
        bio: "Head of Product at Uber. Expert in product strategy, marketplace dynamics, and scaling products.",
        availability: "available",
        languages: ["English", "Mandarin"],
        sessionTypes: ["Product Strategy", "Market Analysis", "Team Leadership"],
        responseTime: "< 3 hours"
    },
    {
        id: 9,
        name: "Sophia Martinez",
        title: "Data Science Manager",
        company: "Meta",
        expertise: ["tech"],
        rating: 4.9,
        reviews: 134,
        price: 165,
        image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face",
        bio: "Data Science Manager at Meta. Expert in machine learning, data strategy, and building data teams.",
        availability: "available",
        languages: ["English", "Spanish"],
        sessionTypes: ["Data Science", "ML Strategy", "Career Transition"],
        responseTime: "< 2 hours"
    },
    {
        id: 10,
        name: "James Wilson",
        title: "Startup Founder",
        company: "Y Combinator",
        expertise: ["business", "tech"],
        rating: 4.8,
        reviews: 76,
        price: 220,
        image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop&crop=face",
        bio: "Y Combinator alumni and serial entrepreneur. Expert in startup strategy, fundraising, and product-market fit.",
        availability: "available",
        languages: ["English"],
        sessionTypes: ["Startup Strategy", "Fundraising", "Product Development"],
        responseTime: "< 1 hour"
    },
    {
        id: 11,
        name: "Amanda Foster",
        title: "UX Research Lead",
        company: "Spotify",
        expertise: ["design", "tech"],
        rating: 4.7,
        reviews: 91,
        price: 155,
        image: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=400&fit=crop&crop=face",
        bio: "UX Research Lead at Spotify. Expert in user research, usability testing, and data-driven design.",
        availability: "busy",
        languages: ["English", "German"],
        sessionTypes: ["User Research", "UX Strategy", "Design Research"],
        responseTime: "< 3 hours"
    },
    {
        id: 12,
        name: "Robert Lee",
        title: "Sales Director",
        company: "Salesforce",
        expertise: ["business", "marketing"],
        rating: 4.8,
        reviews: 103,
        price: 185,
        image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face",
        bio: "Sales Director at Salesforce. Expert in B2B sales, team leadership, and revenue growth strategies.",
        availability: "available",
        languages: ["English", "Japanese"],
        sessionTypes: ["Sales Strategy", "Team Leadership", "B2B Sales"],
        responseTime: "< 2 hours"
    },
    {
        id: 13,
        name: "Nina Patel",
        title: "Product Marketing Manager",
        company: "Adobe",
        expertise: ["marketing", "tech"],
        rating: 4.9,
        reviews: 118,
        price: 175,
        image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&crop=face",
        bio: "Product Marketing Manager at Adobe. Expert in product launches, go-to-market strategy, and content marketing.",
        availability: "available",
        languages: ["English", "Hindi"],
        sessionTypes: ["Product Marketing", "GTM Strategy", "Content Marketing"],
        responseTime: "< 1 hour"
    },
    {
        id: 14,
        name: "Carlos Mendez",
        title: "Security Engineer",
        company: "CrowdStrike",
        expertise: ["tech"],
        rating: 4.8,
        reviews: 82,
        price: 195,
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face",
        bio: "Security Engineer at CrowdStrike. Expert in cybersecurity, threat detection, and security architecture.",
        availability: "available",
        languages: ["English", "Spanish"],
        sessionTypes: ["Cybersecurity", "Threat Analysis", "Security Architecture"],
        responseTime: "< 2 hours"
    },
    {
        id: 15,
        name: "Jennifer Walsh",
        title: "Operations Manager",
        company: "Amazon",
        expertise: ["business"],
        rating: 4.7,
        reviews: 95,
        price: 160,
        image: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face",
        bio: "Operations Manager at Amazon. Expert in supply chain optimization, process improvement, and scaling operations.",
        availability: "busy",
        languages: ["English"],
        sessionTypes: ["Operations", "Process Improvement", "Supply Chain"],
        responseTime: "< 4 hours"
    },
    {
        id: 16,
        name: "Daniel Park",
        title: "Mobile Engineer",
        company: "TikTok",
        expertise: ["tech"],
        rating: 4.9,
        reviews: 107,
        price: 170,
        image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop&crop=face",
        bio: "Mobile Engineer at TikTok. Expert in iOS/Android development, mobile architecture, and app performance.",
        availability: "available",
        languages: ["English", "Korean"],
        sessionTypes: ["Mobile Development", "App Architecture", "Performance Optimization"],
        responseTime: "< 1 hour"
    },
    {
        id: 17,
        name: "Melissa Taylor",
        title: "Brand Strategist",
        company: "Nike",
        expertise: ["marketing", "design"],
        rating: 4.8,
        reviews: 88,
        price: 180,
        image: "https://images.unsplash.com/photo-1524504388940-b1c172d3b1a6?w=400&h=400&fit=crop&crop=face",
        bio: "Brand Strategist at Nike. Expert in brand development, consumer insights, and marketing campaigns.",
        availability: "available",
        languages: ["English"],
        sessionTypes: ["Brand Strategy", "Consumer Insights", "Campaign Development"],
        responseTime: "< 2 hours"
    },
    {
        id: 18,
        name: "Kevin Zhang",
        title: "AI Research Scientist",
        company: "OpenAI",
        expertise: ["tech"],
        rating: 4.9,
        reviews: 143,
        price: 210,
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=face",
        bio: "AI Research Scientist at OpenAI. Expert in machine learning, neural networks, and AI ethics.",
        availability: "busy",
        languages: ["English", "Mandarin"],
        sessionTypes: ["AI/ML Research", "Neural Networks", "AI Ethics"],
        responseTime: "< 3 hours"
    },
    {
        id: 19,
        name: "Rachel Adams",
        title: "HR Director",
        company: "Microsoft",
        expertise: ["business"],
        rating: 4.7,
        reviews: 79,
        price: 165,
        image: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=400&h=400&fit=crop&crop=face",
        bio: "HR Director at Microsoft. Expert in talent acquisition, organizational development, and people management.",
        availability: "available",
        languages: ["English"],
        sessionTypes: ["HR Strategy", "Talent Management", "Career Development"],
        responseTime: "< 2 hours"
    },
    {
        id: 20,
        name: "Thomas Anderson",
        title: "Blockchain Developer",
        company: "ConsenSys",
        expertise: ["tech", "finance"],
        rating: 4.8,
        reviews: 92,
        price: 185,
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
        bio: "Blockchain Developer at ConsenSys. Expert in smart contracts, DeFi protocols, and blockchain architecture.",
        availability: "available",
        languages: ["English"],
        sessionTypes: ["Blockchain Development", "Smart Contracts", "DeFi Protocols"],
        responseTime: "< 1 hour"
    }
];

let filteredMentors = [...mentorsData];
let currentBookingMentor = null;

// Initialize mentors page functionality
function initializeMentorsPage() {
    if (document.getElementById('mentors-grid')) {
        renderMentors();
        initializeMentorFilters();
        initializeMentorSearch();
        initializeMentorSort();
        hideLoadingSpinner();
    }
}

function hideLoadingSpinner() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        setTimeout(() => {
            spinner.style.display = 'none';
        }, 1000);
    }
}

function renderMentors() {
    const grid = document.getElementById('mentors-grid');
    const noResults = document.getElementById('no-results');
    
    if (!grid) return;
    
    if (filteredMentors.length === 0) {
        grid.innerHTML = '';
        if (noResults) noResults.classList.remove('hidden');
        return;
    }
    
    if (noResults) noResults.classList.add('hidden');
    
    grid.innerHTML = filteredMentors.map(mentor => `
        <div class="mentor-card hover-lift cursor-pointer" onclick="openBookingModal(${mentor.id})">
            <div class="relative">
                <img src="${mentor.image}" alt="${mentor.name}" class="mentor-image w-full h-64 object-cover">
                <div class="absolute top-4 right-4">
                    <div class="availability-dot ${mentor.availability === 'available' ? 'available' : 'busy'}"></div>
                </div>
                <div class="absolute bottom-4 left-4">
                    <div class="price-badge text-white px-3 py-1 rounded-full text-sm font-semibold">
                        $${mentor.price}/hour
                    </div>
                </div>
            </div>
            
            <div class="p-6">
                <div class="flex items-start justify-between mb-2">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">${mentor.name}</h3>
                        <p class="text-sm text-gray-600">${mentor.title}</p>
                        <p class="text-sm font-medium text-teal">${mentor.company}</p>
                    </div>
                    <div class="flex items-center">
                        <div class="rating-stars text-sm">★</div>
                        <span class="text-sm font-medium ml-1">${mentor.rating}</span>
                        <span class="text-xs text-gray-500 ml-1">(${mentor.reviews})</span>
                    </div>
                </div>
                
                <p class="text-sm text-gray-600 mb-4 line-clamp-2">${mentor.bio}</p>
                
                <div class="flex flex-wrap gap-1 mb-4">
                    ${mentor.sessionTypes.slice(0, 3).map(type => `
                        <span class="expertise-tag">${type}</span>
                    `).join('')}
                </div>
                
                <div class="flex items-center justify-between text-xs text-gray-500">
                    <span>Responds ${mentor.responseTime}</span>
                    <span>${mentor.languages[0]}${mentor.languages[1] ? ` +${mentor.languages.length-1}` : ''}</span>
                </div>
                
                <button class="w-full mt-4 bg-teal text-white py-2 px-4 rounded-lg hover:bg-teal/90 transition-colors font-medium">
                    Book Session
                </button>
            </div>
        </div>
    `).join('');
    
    // Animate cards
    anime({
        targets: '.mentor-card',
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(100),
        duration: 600,
        easing: 'easeOutQuart'
    });
}

function initializeMentorFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active state
            filterBtns.forEach(b => {
                b.classList.remove('filter-active');
                b.classList.add('bg-gray-100', 'text-gray-700');
            });
            
            this.classList.add('filter-active');
            this.classList.remove('bg-gray-100', 'text-gray-700');
            
            // Filter mentors
            const filter = this.getAttribute('data-filter');
            if (filter === 'all') {
                filteredMentors = [...mentorsData];
            } else {
                filteredMentors = mentorsData.filter(mentor => 
                    mentor.expertise.includes(filter)
                );
            }
            
            renderMentors();
        });
    });
}

function initializeMentorSearch() {
    const searchInput = document.getElementById('mentor-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        
        if (query === '') {
            filteredMentors = [...mentorsData];
        } else {
            filteredMentors = mentorsData.filter(mentor =>
                mentor.name.toLowerCase().includes(query) ||
                mentor.title.toLowerCase().includes(query) ||
                mentor.company.toLowerCase().includes(query) ||
                mentor.bio.toLowerCase().includes(query) ||
                mentor.sessionTypes.some(type => type.toLowerCase().includes(query))
            );
        }
        
        renderMentors();
    });
}

function initializeMentorSort() {
    const sortSelect = document.getElementById('sort-mentors');
    if (!sortSelect) return;
    
    sortSelect.addEventListener('change', function() {
        const sortBy = this.value;
        
        switch(sortBy) {
            case 'rating':
                filteredMentors.sort((a, b) => b.rating - a.rating);
                break;
            case 'price-low':
                filteredMentors.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filteredMentors.sort((a, b) => b.price - a.price);
                break;
            case 'available':
                filteredMentors.sort((a, b) => {
                    if (a.availability === 'available' && b.availability !== 'available') return -1;
                    if (a.availability !== 'available' && b.availability === 'available') return 1;
                    return 0;
                });
                break;
            default:
                filteredMentors = [...mentorsData];
        }
        
        renderMentors();
    });
}

function openBookingModal(mentorId) {
    const mentor = mentorsData.find(m => m.id === mentorId);
    if (!mentor) return;
    
    currentBookingMentor = mentor;
    const modal = document.getElementById('booking-modal');
    const content = document.getElementById('booking-content');
    
    content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Mentor Info -->
            <div class="lg:col-span-1">
                <div class="bg-gray-50 rounded-lg p-6">
                    <div class="text-center mb-6">
                        <img src="${mentor.image}" alt="${mentor.name}" class="w-24 h-24 rounded-full mx-auto mb-4 object-cover">
                        <h3 class="text-xl font-bold text-gray-900">${mentor.name}</h3>
                        <p class="text-gray-600">${mentor.title}</p>
                        <p class="font-medium text-teal">${mentor.company}</p>
                    </div>
                    
                    <div class="space-y-3 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Rating:</span>
                            <div class="flex items-center">
                                <span class="rating-stars">★</span>
                                <span class="ml-1 font-medium">${mentor.rating}</span>
                                <span class="text-gray-500 ml-1">(${mentor.reviews} reviews)</span>
                            </div>
                        </div>
                        
                        <div class="flex justify-between">
                            <span class="text-gray-600">Price:</span>
                            <span class="font-medium">$${mentor.price}/hour</span>
                        </div>
                        
                        <div class="flex justify-between">
                            <span class="text-gray-600">Response Time:</span>
                            <span class="font-medium">${mentor.responseTime}</span>
                        </div>
                        
                        <div class="flex justify-between">
                            <span class="text-gray-600">Languages:</span>
                            <span class="font-medium">${mentor.languages.join(', ')}</span>
                        </div>
                    </div>
                    
                    <div class="mt-6">
                        <h4 class="font-semibold mb-2">Expertise Areas</h4>
                        <div class="flex flex-wrap gap-1">
                            ${mentor.sessionTypes.map(type => `
                                <span class="expertise-tag">${type}</span>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="mt-6">
                        <h4 class="font-semibold mb-2">About</h4>
                        <p class="text-sm text-gray-600">${mentor.bio}</p>
                    </div>
                </div>
            </div>
            
            <!-- Booking Form -->
            <div class="lg:col-span-2">
                <div class="space-y-6">
                    <!-- Session Type -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-3">Session Type</label>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            ${mentor.sessionTypes.map(type => `
                                <label class="session-type-option flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input type="radio" name="sessionType" value="${type}" class="text-teal focus:ring-teal">
                                    <span class="ml-3 text-sm font-medium">${type}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Calendar -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-3">Select Date</label>
                        <div class="bg-gray-50 rounded-lg p-4">
                            <div class="flex justify-between items-center mb-4">
                                <button type="button" onclick="changeMonth(-1)" class="p-2 hover:bg-gray-200 rounded">
                                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h4 class="font-semibold" id="calendar-month">December 2024</h4>
                                <button type="button" onclick="changeMonth(1)" class="p-2 hover:bg-gray-200 rounded">
                                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div class="calendar-grid text-center text-sm">
                                <div class="font-medium text-gray-500 py-2">Sun</div>
                                <div class="font-medium text-gray-500 py-2">Mon</div>
                                <div class="font-medium text-gray-500 py-2">Tue</div>
                                <div class="font-medium text-gray-500 py-2">Wed</div>
                                <div class="font-medium text-gray-500 py-2">Thu</div>
                                <div class="font-medium text-gray-500 py-2">Fri</div>
                                <div class="font-medium text-gray-500 py-2">Sat</div>
                                
                                <!-- Calendar days will be populated by JavaScript -->
                                <div class="calendar-day">1</div>
                                <div class="calendar-day">2</div>
                                <div class="calendar-day">3</div>
                                <div class="calendar-day">4</div>
                                <div class="calendar-day">5</div>
                                <div class="calendar-day">6</div>
                                <div class="calendar-day">7</div>
                                <div class="calendar-day">8</div>
                                <div class="calendar-day">9</div>
                                <div class="calendar-day">10</div>
                                <div class="calendar-day">11</div>
                                <div class="calendar-day">12</div>
                                <div class="calendar-day">13</div>
                                <div class="calendar-day">14</div>
                                <div class="calendar-day">15</div>
                                <div class="calendar-day">16</div>
                                <div class="calendar-day">17</div>
                                <div class="calendar-day">18</div>
                                <div class="calendar-day">19</div>
                                <div class="calendar-day">20</div>
                                <div class="calendar-day">21</div>
                                <div class="calendar-day">22</div>
                                <div class="calendar-day">23</div>
                                <div class="calendar-day">24</div>
                                <div class="calendar-day">25</div>
                                <div class="calendar-day">26</div>
                                <div class="calendar-day">27</div>
                                <div class="calendar-day">28</div>
                                <div class="calendar-day">29</div>
                                <div class="calendar-day">30</div>
                                <div class="calendar-day">31</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Time Slots -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-3">Available Time Slots</label>
                        <div class="grid grid-cols-3 md:grid-cols-4 gap-2" id="time-slots">
                            <div class="time-slot" data-time="09:00">9:00 AM</div>
                            <div class="time-slot" data-time="10:00">10:00 AM</div>
                            <div class="time-slot" data-time="11:00">11:00 AM</div>
                            <div class="time-slot" data-time="14:00">2:00 PM</div>
                            <div class="time-slot" data-time="15:00">3:00 PM</div>
                            <div class="time-slot" data-time="16:00">4:00 PM</div>
                            <div class="time-slot" data-time="17:00">5:00 PM</div>
                            <div class="time-slot" data-time="18:00">6:00 PM</div>
                        </div>
                    </div>
                    
                    <!-- Additional Notes -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                        <textarea id="booking-notes" rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" placeholder="What would you like to discuss in your session?"></textarea>
                    </div>
                    
                    <!-- Booking Summary -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-semibold mb-3">Booking Summary</h4>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span>Session with ${mentor.name}</span>
                                <span id="selected-session-type">-</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Date & Time</span>
                                <span id="selected-datetime">-</span>
                            </div>
                            <div class="flex justify-between font-semibold border-t pt-2">
                                <span>Total</span>
                                <span>$${mentor.price}.00</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="flex gap-4">
                        <button onclick="closeBookingModal()" class="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button onclick="confirmBooking()" class="flex-1 px-6 py-3 bg-teal text-white rounded-lg hover:bg-teal/90 transition-colors font-medium">
                            Confirm Booking
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize calendar and time slot interactions
    initializeBookingInteractions();
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
    const modal = document.getElementById('booking-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    currentBookingMentor = null;
}

function initializeBookingInteractions() {
    // Session type selection
    document.querySelectorAll('input[name="sessionType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.getElementById('selected-session-type').textContent = this.value;
        });
    });
    
    // Calendar day selection
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.addEventListener('click', function() {
            if (this.classList.contains('available')) {
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                this.classList.add('selected');
                updateBookingSummary();
            }
        });
    });
    
    // Time slot selection
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.addEventListener('click', function() {
            document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
            this.classList.add('selected');
            updateBookingSummary();
        });
    });
}

function updateBookingSummary() {
    const selectedDate = document.querySelector('.calendar-day.selected');
    const selectedTime = document.querySelector('.time-slot.selected');
    const selectedSession = document.querySelector('input[name="sessionType"]:checked');
    
    if (selectedSession) {
        document.getElementById('selected-session-type').textContent = selectedSession.value;
    }
    
    if (selectedDate && selectedTime) {
        const dateText = selectedDate.textContent;
        const timeText = selectedTime.textContent;
        document.getElementById('selected-datetime').textContent = `Dec ${dateText}, ${timeText}`;
    }
}

function changeMonth(direction) {
    // This would typically update the calendar to show different months
    // For now, we'll just show a coming soon message
    showNotification('Calendar navigation coming soon!', 'info');
}

function confirmBooking() {
    const selectedSession = document.querySelector('input[name="sessionType"]:checked');
    const selectedDate = document.querySelector('.calendar-day.selected');
    const selectedTime = document.querySelector('.time-slot.selected');
    const notes = document.getElementById('booking-notes').value;
    
    if (!selectedSession || !selectedDate || !selectedTime) {
        showNotification('Please select session type, date, and time.', 'error');
        return;
    }
    
    // Simulate booking confirmation
    showNotification('Booking confirmed! You will receive a confirmation email shortly.', 'success');
    closeBookingModal();
    
    // In a real application, this would send the booking data to the server
    console.log('Booking confirmed:', {
        mentor: currentBookingMentor.name,
        sessionType: selectedSession.value,
        date: selectedDate.textContent,
        time: selectedTime.getAttribute('data-time'),
        notes: notes,
        price: currentBookingMentor.price
    });
}

function openBecomeMentorModal() {
    const modal = document.getElementById('mentor-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeMentorModal() {
    const modal = document.getElementById('mentor-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function scrollToMentors() {
    const mentorsSection = document.getElementById('mentors-section');
    if (mentorsSection) {
        mentorsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Handle mentor application form submission
document.addEventListener('submit', function(e) {
    if (e.target.id === 'mentor-application-form') {
        e.preventDefault();
        
        // Simulate form submission
        showNotification('Application submitted successfully! We will review your application and get back to you within 48 hours.', 'success');
        closeMentorModal();
        
        // Reset form
        e.target.reset();
    }
});

// Mobile Menu Functionality
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            
            // Animate menu items
            if (!mobileMenu.classList.contains('hidden')) {
                const menuItems = mobileMenu.querySelectorAll('a');
                anime({
                    targets: menuItems,
                    opacity: [0, 1],
                    translateY: [-10, 0],
                    delay: anime.stagger(50),
                    duration: 300,
                    easing: 'easeOutQuart'
                });
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
        
        // Close menu when clicking on a link
        mobileMenu.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                mobileMenu.classList.add('hidden');
            }
        });
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white max-w-sm ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    anime({
        targets: notification,
        translateX: [300, 0],
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutQuart'
    });
    
    // Remove after 5 seconds
    setTimeout(() => {
        anime({
            targets: notification,
            translateX: [0, 300],
            opacity: [1, 0],
            duration: 300,
            easing: 'easeInQuart',
            complete: () => notification.remove()
        });
    }, 5000);
}