const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// In-memory content storage (in production, use database)
let blogPosts = [
  {
    id: '1',
    title: '5 Essential Skills Every Product Manager Needs',
    slug: 'essential-skills-product-manager',
    content: 'Product management is one of the most critical roles in any tech company...',
    excerpt: 'Discover the key skills that separate great product managers from the rest.',
    author: 'Michael Chen',
    authorId: 'mentor-1',
    category: 'product-management',
    tags: ['product management', 'skills', 'career', 'tech'],
    featuredImage: 'resources/blog/product-skills.jpg',
    publishDate: '2024-12-01',
    readTime: 8,
    views: 2340,
    likes: 156,
    comments: 42,
    status: 'published',
    seoTitle: '5 Essential Skills Every Product Manager Needs - AZM',
    seoDescription: 'Master the essential skills that make great product managers successful in tech companies.'
  },
  {
    id: '2',
    title: 'Navigating Your First Year as a Software Engineer',
    slug: 'first-year-software-engineer',
    content: 'Starting your career as a software engineer can be both exciting and overwhelming...',
    excerpt: 'Tips and strategies for thriving in your first year as a software engineer.',
    author: 'Alex Johnson',
    authorId: 'mentor-2',
    category: 'career',
    tags: ['software engineering', 'career', 'beginner', 'tips'],
    featuredImage: 'resources/blog/software-engineer.jpg',
    publishDate: '2024-11-28',
    readTime: 12,
    views: 1890,
    likes: 134,
    comments: 28,
    status: 'published',
    seoTitle: 'Navigating Your First Year as a Software Engineer - AZM',
    seoDescription: 'Essential tips for software engineers starting their career journey.'
  }
];

let resources = [
  {
    id: '1',
    title: 'Startup Pitch Template',
    description: 'Comprehensive template for creating compelling startup pitches.',
    type: 'template',
    category: 'startup',
    fileUrl: 'resources/templates/startup-pitch-template.pdf',
    fileSize: '2.3MB',
    fileFormat: 'pdf',
    author: 'Lisa Thompson',
    authorId: 'mentor-3',
    tags: ['startup', 'pitch', 'template', 'funding'],
    downloads: 456,
    rating: 4.8,
    status: 'published',
    createdAt: '2024-11-25'
  },
  {
    id: '2',
    title: 'Product Manager Interview Questions',
    description: '150+ product manager interview questions with sample answers.',
    type: 'guide',
    category: 'interview',
    fileUrl: 'resources/guides/pm-interview-questions.pdf',
    fileSize: '1.8MB',
    fileFormat: 'pdf',
    author: 'Michael Chen',
    authorId: 'mentor-1',
    tags: ['product management', 'interview', 'questions', 'preparation'],
    downloads: 892,
    rating: 4.9,
    status: 'published',
    createdAt: '2024-11-20'
  }
];

// Blog posts routes
router.get('/blog', async (req, res) => {
  try {
    const { 
      category, 
      search, 
      page = 1, 
      limit = 10, 
      sortBy = 'publishDate', 
      sortOrder = 'desc' 
    } = req.query;

    let filteredPosts = blogPosts.filter(post => post.status === 'published');

    // Filter by category
    if (category) {
      filteredPosts = filteredPosts.filter(post => post.category === category);
    }

    // Search
    if (search) {
      filteredPosts = filteredPosts.filter(post => 
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(search.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Sort
    filteredPosts.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'publishDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    res.json({
      posts: paginatedPosts,
      totalPages: Math.ceil(filteredPosts.length / limit),
      currentPage: parseInt(page),
      totalCount: filteredPosts.length
    });
  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

router.get('/blog/:id', async (req, res) => {
  try {
    const post = blogPosts.find(p => p.id === req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Increment view count
    post.views += 1;

    res.json(post);
  } catch (error) {
    console.error('Get blog post error:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

router.post('/blog', auth, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required'),
  body('category').trim().isLength({ min: 1 }).withMessage('Category is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const newPost = {
      id: Date.now().toString(),
      ...req.body,
      author: `${req.user.firstName} ${req.user.lastName}`,
      authorId: req.user.id,
      slug: req.body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      publishDate: req.body.publishDate || new Date().toISOString().split('T')[0],
      views: 0,
      likes: 0,
      comments: 0,
      status: req.body.status || 'published',
      createdAt: new Date()
    };

    blogPosts.unshift(newPost);

    res.status(201).json({
      message: 'Blog post created successfully',
      post: newPost
    });
  } catch (error) {
    console.error('Create blog post error:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

router.put('/blog/:id', auth, async (req, res) => {
  try {
    const postIndex = blogPosts.findIndex(p => p.id === req.params.id);
    
    if (postIndex === -1) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Check if user is the author or admin
    if (req.user.userType !== 'admin' && blogPosts[postIndex].authorId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to update this post' });
    }

    blogPosts[postIndex] = {
      ...blogPosts[postIndex],
      ...req.body,
      updatedAt: new Date()
    };

    res.json({
      message: 'Blog post updated successfully',
      post: blogPosts[postIndex]
    });
  } catch (error) {
    console.error('Update blog post error:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

router.delete('/blog/:id', auth, async (req, res) => {
  try {
    const postIndex = blogPosts.findIndex(p => p.id === req.params.id);
    
    if (postIndex === -1) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Check if user is the author or admin
    if (req.user.userType !== 'admin' && blogPosts[postIndex].authorId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this post' });
    }

    blogPosts.splice(postIndex, 1);

    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Delete blog post error:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

// Like blog post
router.post('/blog/:id/like', auth, async (req, res) => {
  try {
    const post = blogPosts.find(p => p.id === req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    post.likes += 1;

    res.json({ 
      message: 'Blog post liked successfully',
      likes: post.likes 
    });
  } catch (error) {
    console.error('Like blog post error:', error);
    res.status(500).json({ error: 'Failed to like blog post' });
  }
});

// Resources routes
router.get('/resources', async (req, res) => {
  try {
    const { 
      category, 
      type, 
      search, 
      page = 1, 
      limit = 12, 
      sortBy = 'downloads', 
      sortOrder = 'desc' 
    } = req.query;

    let filteredResources = resources.filter(resource => resource.status === 'published');

    // Filter by category
    if (category) {
      filteredResources = filteredResources.filter(resource => resource.category === category);
    }

    // Filter by type
    if (type) {
      filteredResources = filteredResources.filter(resource => resource.type === type);
    }

    // Search
    if (search) {
      filteredResources = filteredResources.filter(resource => 
        resource.title.toLowerCase().includes(search.toLowerCase()) ||
        resource.description.toLowerCase().includes(search.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Sort
    filteredResources.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedResources = filteredResources.slice(startIndex, endIndex);

    res.json({
      resources: paginatedResources,
      totalPages: Math.ceil(filteredResources.length / limit),
      currentPage: parseInt(page),
      totalCount: filteredResources.length
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

router.get('/resources/:id', async (req, res) => {
  try {
    const resource = resources.find(r => r.id === req.params.id);
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json(resource);
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

router.post('/resources', auth, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('type').isIn(['template', 'guide', 'checklist', 'worksheet', 'other']).withMessage('Invalid resource type'),
  body('category').trim().isLength({ min: 1 }).withMessage('Category is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const newResource = {
      id: Date.now().toString(),
      ...req.body,
      author: `${req.user.firstName} ${req.user.lastName}`,
      authorId: req.user.id,
      downloads: 0,
      rating: 0,
      status: req.body.status || 'published',
      createdAt: new Date()
    };

    resources.unshift(newResource);

    res.status(201).json({
      message: 'Resource created successfully',
      resource: newResource
    });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

// Download resource
router.post('/resources/:id/download', auth, async (req, res) => {
  try {
    const resource = resources.find(r => r.id === req.params.id);
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Increment download count
    resource.downloads += 1;

    res.json({
      message: 'Resource downloaded successfully',
      downloadUrl: resource.fileUrl,
      downloads: resource.downloads
    });
  } catch (error) {
    console.error('Download resource error:', error);
    res.status(500).json({ error: 'Failed to download resource' });
  }
});

// Rate resource
router.post('/resources/:id/rate', auth, [
  body('rating').isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const resource = resources.find(r => r.id === req.params.id);
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // In a real implementation, you'd store ratings in a separate collection
    // and calculate the average
    resource.rating = (resource.rating + req.body.rating) / 2;

    res.json({
      message: 'Resource rated successfully',
      rating: resource.rating
    });
  } catch (error) {
    console.error('Rate resource error:', error);
    res.status(500).json({ error: 'Failed to rate resource' });
  }
});

// Get content categories
router.get('/categories', async (req, res) => {
  try {
    const blogCategories = [...new Set(blogPosts.map(p => p.category))];
    const resourceCategories = [...new Set(resources.map(r => r.category))];
    
    res.json({
      blogCategories,
      resourceCategories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get featured content
router.get('/featured', async (req, res) => {
  try {
    const featuredPosts = blogPosts
      .filter(p => p.status === 'published')
      .sort((a, b) => (b.views + b.likes) - (a.views + a.likes))
      .slice(0, 3);

    const featuredResources = resources
      .filter(r => r.status === 'published')
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 3);

    res.json({
      blogPosts: featuredPosts,
      resources: featuredResources
    });
  } catch (error) {
    console.error('Get featured content error:', error);
    res.status(500).json({ error: 'Failed to fetch featured content' });
  }
});

// Search all content
router.get('/search', async (req, res) => {
  try {
    const { query, type, page = 1, limit = 20 } = req.query;

    let results = [];

    // Search blog posts
    if (!type || type === 'blog') {
      const blogResults = blogPosts
        .filter(post => post.status === 'published')
        .filter(post => 
          post.title.toLowerCase().includes(query.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(query.toLowerCase()) ||
          post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        )
        .map(post => ({
          ...post,
          contentType: 'blog'
        }));
      
      results = results.concat(blogResults);
    }

    // Search resources
    if (!type || type === 'resources') {
      const resourceResults = resources
        .filter(resource => resource.status === 'published')
        .filter(resource => 
          resource.title.toLowerCase().includes(query.toLowerCase()) ||
          resource.description.toLowerCase().includes(query.toLowerCase()) ||
          resource.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        )
        .map(resource => ({
          ...resource,
          contentType: 'resource'
        }));
      
      results = results.concat(resourceResults);
    }

    // Sort by relevance (simplified)
    results.sort((a, b) => {
      const aScore = (a.views || 0) + (a.likes || 0) + (a.downloads || 0);
      const bScore = (b.views || 0) + (b.likes || 0) + (b.downloads || 0);
      return bScore - aScore;
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedResults = results.slice(startIndex, endIndex);

    res.json({
      results: paginatedResults,
      totalPages: Math.ceil(results.length / limit),
      currentPage: parseInt(page),
      totalCount: results.length,
      query
    });
  } catch (error) {
    console.error('Search content error:', error);
    res.status(500).json({ error: 'Failed to search content' });
  }
});

module.exports = router;