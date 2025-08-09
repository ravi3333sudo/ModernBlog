/**
 * Modern Animated Blog Platform
 * A comprehensive blog platform with dynamic functionality and animations
 * Features: CRUD operations for blog posts, search functionality, markdown editor, theme toggle
 */

// DOM Elements
const newPostBtn = document.getElementById('new-post-btn');
const postFormContainer = document.getElementById('post-form-container');
const editFormContainer = document.getElementById('edit-form-container');
const postForm = document.getElementById('post-form');
const editForm = document.getElementById('edit-form');
const cancelPostBtn = document.getElementById('cancel-post');
const cancelEditBtn = document.getElementById('cancel-edit');
const postsContainer = document.getElementById('posts-container');
const categoriesList = document.getElementById('categories-list');
const recentPostsList = document.getElementById('recent-posts');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const confirmationModal = document.getElementById('confirmation-modal');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const themeToggle = document.getElementById('theme-toggle');

// Global variables
let posts = [];
let postIdToDelete = null;
let postContentEditor = null;
let editPostContentEditor = null;

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true
    });

    initializeApp();
});

/**
 * Initialize the application
 * Set up event listeners and load posts from localStorage
 */
function initializeApp() {
    // Initialize SimpleMDE for post creation
    postContentEditor = new SimpleMDE({
        element: document.getElementById('post-content'),
        spellChecker: false,
        placeholder: "Write your post content here...",
        status: false,
        autosave: {
            enabled: true,
            delay: 1000,
            uniqueId: "blogPostDraft"
        }
    });

    // Initialize SimpleMDE for post editing
    editPostContentEditor = new SimpleMDE({
        element: document.getElementById('edit-post-content'),
        spellChecker: false,
        placeholder: "Edit your post content here...",
        status: false
    });

    // Set initial theme
    initTheme();

    // Load posts from localStorage
    loadPosts();

    // Set up event listeners
    setupEventListeners();
}

/**
 * Set up event listeners for the application
 */
function setupEventListeners() {
    // Show new post form
    newPostBtn.addEventListener('click', () => {
        postFormContainer.classList.remove('hidden');
        postContentEditor.codemirror.refresh();
    });

    // Cancel new post
    cancelPostBtn.addEventListener('click', () => {
        postFormContainer.classList.add('hidden');
        postForm.reset();
    });

    // Cancel edit post
    cancelEditBtn.addEventListener('click', () => {
        editFormContainer.classList.add('hidden');
        editForm.reset();
    });

    // Submit new post
    postForm.addEventListener('submit', handlePostSubmit);

    // Submit edit post
    editForm.addEventListener('submit', handleEditSubmit);

    // Search posts
    searchBtn.addEventListener('click', searchPosts);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchPosts();
        }
    });

    // Cancel delete
    cancelDeleteBtn.addEventListener('click', () => {
        confirmationModal.classList.add('hidden');
        postIdToDelete = null;
    });

    // Confirm delete
    confirmDeleteBtn.addEventListener('click', () => {
        if (postIdToDelete) {
            deletePost(postIdToDelete);
            confirmationModal.classList.add('hidden');
            postIdToDelete = null;
        }
    });

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Animate navigation links on hover
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.querySelector('span').style.transform = 'translateY(-5px)';
        });

        link.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.querySelector('span').style.transform = 'translateY(0)';
            }
        });
    });
}

/**
 * Initialize theme based on localStorage or system preference
 */
function initTheme() {
    const savedTheme = localStorage.getItem('blogTheme');
    
    if (savedTheme) {
        document.body.classList.toggle('dark-theme', savedTheme === 'dark');
        updateThemeIcon(savedTheme === 'dark');
    } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.classList.toggle('dark-theme', prefersDark);
        updateThemeIcon(prefersDark);
    }
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('blogTheme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
    
    // Add animation to the theme toggle
    themeToggle.classList.add('animate-spin');
    setTimeout(() => {
        themeToggle.classList.remove('animate-spin');
    }, 500);
}

/**
 * Update the theme toggle icon
 * @param {boolean} isDark - Whether the theme is dark
 */
function updateThemeIcon(isDark) {
    themeToggle.innerHTML = isDark 
        ? '<i class="fas fa-moon"></i>' 
        : '<i class="fas fa-sun"></i>';
}

/**
 * Load posts from localStorage
 */
function loadPosts() {
    const storedPosts = localStorage.getItem('blogPosts');
    posts = storedPosts ? JSON.parse(storedPosts) : [];
    
    // Display posts, update categories, and update recent posts
    displayPosts(posts);
    updateCategoriesList();
    updateRecentPostsList();
}

/**
 * Display posts in the posts container
 * @param {Array} postsToDisplay - Array of posts to display
 */
function displayPosts(postsToDisplay) {
    postsContainer.innerHTML = '';

    if (postsToDisplay.length === 0) {
        postsContainer.innerHTML = `
            <div class="no-posts" data-aos="fade-up">
                <p>No posts available. Create your first post!</p>
            </div>
        `;
        return;
    }

    postsToDisplay.forEach((post, index) => {
        const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const postElement = document.createElement('article');
        postElement.className = 'post';
        postElement.setAttribute('data-aos', 'fade-up');
        postElement.setAttribute('data-aos-delay', `${index * 100}`);
        
        postElement.innerHTML = `
            <div class="post-header">
                <div>
                    <h2 class="post-title">${post.title}</h2>
                    <div class="post-meta">
                        <span><i class="far fa-calendar"></i> ${formattedDate}</span>
                        <span><i class="far fa-folder"></i> ${post.category}</span>
                    </div>
                    <span class="category-badge">${post.category}</span>
                </div>
            </div>
            <div class="post-content markdown-content">
                ${marked.parse(post.content)}
            </div>
            <div class="post-actions">
                <button class="btn secondary-btn animated-btn edit-btn" data-id="${post.id}">
                    <i class="fas fa-edit"></i> <span>Edit</span>
                </button>
                <button class="btn danger-btn animated-btn delete-btn" data-id="${post.id}">
                    <i class="fas fa-trash"></i> <span>Delete</span>
                </button>
            </div>
        `;

        // Add event listeners to edit and delete buttons
        const editBtn = postElement.querySelector('.edit-btn');
        const deleteBtn = postElement.querySelector('.delete-btn');
        
        editBtn.addEventListener('click', () => {
            openEditForm(post.id);
        });
        
        deleteBtn.addEventListener('click', () => {
            openDeleteConfirmation(post.id);
        });

        postsContainer.appendChild(postElement);
    });

    // Refresh AOS for newly added elements
    setTimeout(() => {
        AOS.refresh();
    }, 500);
}

/**
 * Handle post submission
 * @param {Event} e - Form submit event
 */
function handlePostSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const title = document.getElementById('post-title').value.trim();
    const category = document.getElementById('post-category').value;
    const content = postContentEditor.value().trim();
    
    // Validate form data
    if (!title || !category || !content) {
        showNotification('Please fill all fields', 'error');
        return;
    }
    
    // Show loading spinner
    const submitBtn = document.getElementById('submit-post');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.spinner');
    
    submitBtn.disabled = true;
    btnText.textContent = 'Publishing...';
    spinner.classList.remove('hidden');
    
    // Simulate network delay
    setTimeout(() => {
        // Create new post
        const newPost = {
            id: generateUniqueId(),
            title,
            category,
            content,
            createdAt: new Date().toISOString()
        };
        
        // Add post to posts array
        posts.unshift(newPost);
        
        // Save posts to localStorage
        savePosts();
        
        // Reset form and hide it
        postForm.reset();
        postFormContainer.classList.add('hidden');
        
        // Reset button state
        submitBtn.disabled = false;
        btnText.textContent = 'Publish';
        spinner.classList.add('hidden');

        // Clear the SimpleMDE content
        postContentEditor.value('');
        
        // Display success message
        showNotification('Post published successfully!', 'success');
    }, 1000);
}

/**
 * Open edit form for a post
 * @param {string} postId - ID of the post to edit
 */
function openEditForm(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    document.getElementById('edit-post-id').value = post.id;
    document.getElementById('edit-post-title').value = post.title;
    document.getElementById('edit-post-category').value = post.category;
    
    // Set content in SimpleMDE
    editPostContentEditor.value(post.content);
    
    // Show edit form with animation
    editFormContainer.classList.remove('hidden');
    editPostContentEditor.codemirror.refresh();
    
    // Scroll to form
    editFormContainer.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Handle edit post submission
 * @param {Event} e - Form submit event
 */
function handleEditSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const postId = document.getElementById('edit-post-id').value;
    const title = document.getElementById('edit-post-title').value.trim();
    const category = document.getElementById('edit-post-category').value;
    const content = editPostContentEditor.value().trim();
    
    // Validate form data
    if (!title || !category || !content) {
        showNotification('Please fill all fields', 'error');
        return;
    }
    
    // Show loading spinner
    const updateBtn = document.getElementById('update-post');
    const btnText = updateBtn.querySelector('.btn-text');
    const spinner = updateBtn.querySelector('.spinner');
    
    updateBtn.disabled = true;
    btnText.textContent = 'Updating...';
    spinner.classList.remove('hidden');
    
    // Simulate network delay
    setTimeout(() => {
        // Find post index
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;
        
        // Update post
        posts[postIndex] = {
            ...posts[postIndex],
            title,
            category,
            content
        };
        
        // Save posts to localStorage
        savePosts();
        
        // Reset form and hide it
        editForm.reset();
        editFormContainer.classList.add('hidden');
        
        // Reset button state
        updateBtn.disabled = false;
        btnText.textContent = 'Update';
        spinner.classList.add('hidden');
        
        // Display success message
        showNotification('Post updated successfully!', 'success');
    }, 1000);
}

/**
 * Open delete confirmation modal
 * @param {string} postId - ID of the post to delete
 */
function openDeleteConfirmation(postId) {
    postIdToDelete = postId;
    confirmationModal.classList.remove('hidden');
}

/**
 * Delete a post
 * @param {string} postId - ID of the post to delete
 */
function deletePost(postId) {
    // Filter out the post to delete
    posts = posts.filter(post => post.id !== postId);
    
    // Save posts to localStorage
    savePosts();
    
    // Display success message
    showNotification('Post deleted successfully!', 'success');
}

/**
 * Search posts by title or content
 */
function searchPosts() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (!searchTerm) {
        displayPosts(posts);
        return;
    }
    
    const filteredPosts = posts.filter(post => {
        return post.title.toLowerCase().includes(searchTerm) || 
               post.content.toLowerCase().includes(searchTerm);
    });
    
    if (filteredPosts.length === 0) {
        postsContainer.innerHTML = `
            <div class="no-posts" data-aos="fade-up">
                <p>No posts found matching "${searchTerm}"</p>
                <button id="reset-search" class="btn secondary-btn animated-btn">
                    <i class="fas fa-undo"></i> Reset Search
                </button>
            </div>
        `;
        
        document.getElementById('reset-search').addEventListener('click', () => {
            searchInput.value = '';
            displayPosts(posts);
        });
    } else {
        displayPosts(filteredPosts);
    }
}

/**
 * Update categories list in the sidebar
 */
function updateCategoriesList() {
    const categories = {};
    
    // Count posts per category
    posts.forEach(post => {
        categories[post.category] = (categories[post.category] || 0) + 1;
    });
    
    // Clear categories list
    categoriesList.innerHTML = '';
    
    // Add categories to list
    Object.entries(categories).forEach(([category, count]) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <a href="#" class="category-link" data-category="${category}">
                ${category} <span class="category-count">(${count})</span>
            </a>
        `;
        
        // Add event listener to filter by category
        li.querySelector('.category-link').addEventListener('click', (e) => {
            e.preventDefault();
            filterByCategory(category);
        });
        
        categoriesList.appendChild(li);
    });
    
    // Add "All" category if there are posts
    if (Object.keys(categories).length > 0) {
        const li = document.createElement('li');
        li.innerHTML = `
            <a href="#" class="category-link" data-category="all">
                All <span class="category-count">(${posts.length})</span>
            </a>
        `;
        
        li.querySelector('.category-link').addEventListener('click', (e) => {
            e.preventDefault();
            displayPosts(posts);
        });
        
        categoriesList.insertBefore(li, categoriesList.firstChild);
    }
}

/**
 * Update recent posts list in the sidebar
 */
function updateRecentPostsList() {
    // Clear recent posts list
    recentPostsList.innerHTML = '';
    
    // Get 5 most recent posts
    const recentPosts = [...posts].slice(0, 5);
    
    // Add recent posts to list
    recentPosts.forEach(post => {
        const li = document.createElement('li');
        li.innerHTML = `
            <a href="#" class="recent-post-link" data-id="${post.id}">
                ${post.title}
            </a>
        `;
        
        // Add event listener to show post
        li.querySelector('.recent-post-link').addEventListener('click', (e) => {
            e.preventDefault();
            showPost(post.id);
        });
        
        recentPostsList.appendChild(li);
    });
}

/**
 * Filter posts by category
 * @param {string} category - Category to filter by
 */
function filterByCategory(category) {
    if (category === 'all') {
        displayPosts(posts);
        return;
    }
    
    const filteredPosts = posts.filter(post => post.category === category);
    
    if (filteredPosts.length === 0) {
        showNotification(`No posts found in category "${category}"`, 'info');
        return;
    }
    
    displayPosts(filteredPosts);
    
    // Show notification
    showNotification(`Showing posts in category "${category}"`, 'info');
}

/**
 * Show a specific post
 * @param {string} postId - ID of the post to show
 */
function showPost(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    // Filter posts to show only this one
    displayPosts([post]);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Save posts to localStorage
 */
function savePosts() {
    localStorage.setItem('blogPosts', JSON.stringify(posts));
    
    // Update UI
    displayPosts(posts);
    updateCategoriesList();
    updateRecentPostsList();
}

/**
 * Generate a unique ID for posts
 * @returns {string} - Unique ID
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Show notification message
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, error, info)
 */
function showNotification(message, type = 'success') {
    // Create notifications container if it doesn't exist
    let notificationsContainer = document.querySelector('.notifications-container');
    if (!notificationsContainer) {
        notificationsContainer = document.createElement('div');
        notificationsContainer.className = 'notifications-container';
        document.body.appendChild(notificationsContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Icon based on notification type
    let icon = 'check-circle';
    if (type === 'error') icon = 'times-circle';
    if (type === 'info') icon = 'info-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    // Add notification to DOM
    notificationsContainer.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add an animation class to the body when the page is loaded
document.addEventListener('DOMContentLoaded', function() {
    document.body.classList.add('loaded');
    
    // Add CSS for the animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInPage {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        body.loaded {
            animation: fadeInPage 1s ease forwards;
        }
    `;
    document.head.appendChild(style);
});