# AZM Design Style Guide

## Design Philosophy

### Visual Language
**Modern Professional Minimalism**: Clean, sophisticated aesthetic that conveys trust, innovation, and accessibility. The design emphasizes clarity and functionality while maintaining visual appeal through strategic use of whitespace, typography hierarchy, and subtle animations.

### Color Palette
**Primary Colors**:
- **Pure White (#FFFFFF)**: Primary background, clean canvas for content
- **AZM Teal (#5CE1E6)**: Brand accent, CTA buttons, highlights, active states
- **Charcoal (#2D3748)**: Primary text, headings, strong contrast elements
- **Slate Gray (#64748B)**: Secondary text, subtle elements, borders

**Supporting Colors**:
- **Light Gray (#F8FAFC)**: Section backgrounds, card backgrounds
- **Medium Gray (#E2E8F0)**: Borders, dividers, inactive elements
- **Success Green (#10B981)**: Success states, confirmations, positive actions
- **Warning Amber (#F59E0B)**: Attention states, pending actions
- **Error Red (#EF4444)**: Error states, critical alerts

### Typography
**Primary Font**: 'Inter' - Modern, highly legible sans-serif for all body text and UI elements
**Display Font**: 'Poppins' - Bold, contemporary sans-serif for headings and hero text
**Accent Font**: 'JetBrains Mono' - Monospace for code snippets and technical elements

**Typography Scale**:
- Hero Heading: 4rem (64px) - Poppins Bold
- Section Heading: 2.5rem (40px) - Poppins SemiBold  
- Card Title: 1.5rem (24px) - Poppins Medium
- Body Text: 1rem (16px) - Inter Regular
- Small Text: 0.875rem (14px) - Inter Regular
- Caption: 0.75rem (12px) - Inter Medium

## Visual Effects & Styling

### Background Effects
**Primary Background**: Clean white base with subtle geometric patterns
- Subtle dot grid pattern at 5% opacity
- Diagonal gradient overlays in brand teal (0-100% opacity)
- Animated floating particles for hero sections

### Interactive Elements
**Buttons**:
- Primary: AZM Teal background, white text, subtle shadow
- Secondary: White background, teal border and text
- Hover: Scale transform (1.05x), enhanced shadow, color shift

**Cards**:
- Clean white background with subtle border
- Hover: Lift effect with shadow expansion
- Smooth transitions (300ms ease-out)

### Animation Library Usage
**Anime.js**: 
- Page load animations for content reveal
- Button hover animations
- Card entrance effects
- Scroll-triggered animations

**Splitting.js**:
- Hero text character-by-character reveal
- Staggered word animations for headings
- Text emphasis effects

**Typed.js**:
- Dynamic text in hero section
- Rotating taglines and value propositions

### Header Effects
**Navigation Bar**:
- Glass morphism effect with backdrop blur
- Subtle border bottom in teal
- Smooth scroll behavior
- Active state indicators

**Hero Section**:
- Large-scale background image with overlay
- Animated text with color cycling
- Floating call-to-action elements
- Parallax scrolling effects

### Content Sections
**Mentor Cards**:
- Grid layout with consistent spacing
- Profile image with subtle border
- Rating stars with hover animations
- Price tags with brand color accents

**Event Cards**:
- Date badges with prominent styling
- Location indicators with icons
- Registration counters with real-time updates
- Progress bars for event capacity

**Podcast Player**:
- Custom audio controls with brand styling
- Waveform visualization
- Episode thumbnails with play overlay
- Playlist sidebar with scroll functionality

### Responsive Design
**Breakpoints**:
- Mobile: 320px - 768px
- Tablet: 768px - 1024px  
- Desktop: 1024px+

**Mobile Adaptations**:
- Simplified navigation with hamburger menu
- Stacked card layouts
- Touch-optimized button sizes (44px minimum)
- Swipe gestures for content navigation

### Accessibility Features
- High contrast ratios (4.5:1 minimum)
- Focus indicators for keyboard navigation
- Screen reader friendly markup
- Alternative text for all images
- Semantic HTML structure