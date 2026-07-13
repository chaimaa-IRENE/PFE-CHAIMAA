# Danone Incident Declaration - Design System Documentation

## Overview

This document describes the modern, professional design system created for the Danone vehicle incident declaration application. The design follows Danone's brand standards with a focus on trust, purity, and professionalism.

## Color Palette

### Primary Colors (Danone Brand)

- **Danone Blue**: `#005BAC` - Main brand color for trust and professionalism
- **Danone Blue Light**: `#0073E6` - Lighter variant for hover states
- **Danone Blue Dark**: `#004A8A` - Darker variant for active states

### Accent Colors

- **Accent Green**: `#4CAF50` - Success, validation, and positive actions
- **Accent Green Light**: `#66BB6A` - Lighter green variant
- **Accent Green Dark**: `#388E3C` - Darker green variant
- **Accent Orange**: `#FF9800` - Warning, pending states
- **Accent Orange Light**: `#FFB74D` - Lighter orange variant
- **Accent Orange Dark**: `#F57C00` - Darker orange variant

### Neutral Colors

- **Neutral White**: `#FFFFFF` - Backgrounds and cards
- **Neutral Gray**: `#F5F5F5` - Subtle backgrounds
- **Neutral Gray Dark**: `#E0E0E0` - Borders and dividers
- **Neutral Gray Darker**: `#9E9E9E` - Disabled states
- **Neutral Text**: `#333333` - Primary text
- **Neutral Text Light**: `#666666` - Secondary text

### Dark Mode Colors

- **Dark Background**: `#1A1A1A` - Main background
- **Dark Surface**: `#2D2D2D` - Cards and panels
- **Dark Border**: `#404040` - Borders and dividers
- **Dark Text**: `#FFFFFF` - Primary text
- **Dark Text Secondary**: `#B0B0B0` - Secondary text

## Design Tokens

### Shadows

- **Soft**: `0 2px 8px rgba(0, 91, 172, 0.1)` - Subtle elevation
- **Soft LG**: `0 4px 16px rgba(0, 91, 172, 0.15)` - Medium elevation
- **Card**: `0 2px 12px rgba(0, 0, 0, 0.08)` - Card shadow
- **Card Hover**: `0 4px 20px rgba(0, 0, 0, 0.12)` - Card hover state

### Border Radius

- **XL**: `12px` - Cards and buttons
- **2XL**: `16px` - Large cards and containers

### Animations

- **Fade In**: `0.3s ease-in-out` - Smooth appearance
- **Slide Up**: `0.4s ease-out` - Content entrance
- **Pulse Slow**: `3s cubic-bezier(0.4, 0, 0.6, 1) infinite` - Attention indicators

## Components

### Badge Component

Status badges with color-coded variants:

```tsx
import Badge from './components/ui/Badge';

<Badge variant="en-cours">En cours</Badge>
<Badge variant="cloture">Clôturé</Badge>
<Badge variant="en-attente">En attente</Badge>
<Badge variant="default">Default</Badge>
```

**Variants:**
- `en-cours`: Blue for in-progress items
- `cloture`: Green for completed items
- `en-attente`: Orange for pending items
- `default`: Gray for neutral items

### Card Component

Reusable card with optional watermark and hover effects:

```tsx
import Card from './components/ui/Card';

<Card hover watermark>
  <div className="p-6">
    {/* Card content */}
  </div>
</Card>
```

**Props:**
- `hover`: Adds hover elevation effect
- `watermark`: Adds subtle Danone "D" watermark
- `className`: Additional Tailwind classes

### Button Component

Styled buttons with multiple variants and sizes:

```tsx
import Button from './components/ui/Button';

<Button variant="primary" size="md" onClick={handleClick}>
  Primary Button
</Button>

<Button variant="secondary" size="sm">
  Secondary
</Button>

<Button variant="success" size="lg">
  Success
</Button>

<Button variant="warning" size="md">
  Warning
</Button>

<Button variant="danger" size="md">
  Danger
</Button>

<Button variant="ghost" size="sm">
  Ghost
</Button>
```

**Variants:**
- `primary`: Danone blue, main actions
- `secondary`: Gray, secondary actions
- `success`: Green, positive actions
- `warning`: Orange, warning actions
- `danger`: Red, destructive actions
- `ghost`: Transparent with blue text, subtle actions

**Sizes:**
- `sm`: Small buttons
- `md`: Medium buttons (default)
- `lg`: Large buttons

### Toast Component

Notification toast with auto-dismiss:

```tsx
import Toast from './components/ui/Toast';

<Toast 
  message="Operation successful" 
  type="success"
  duration={3000}
  onClose={() => setShowToast(false)}
/>
```

**Types:**
- `success`: Green toast
- `error`: Red toast
- `warning`: Orange toast
- `info`: Blue toast

### Skeleton Component

Loading placeholder with multiple variants:

```tsx
import Skeleton from './components/ui/Skeleton';

<Skeleton variant="text" width="100%" height={16} />
<Skeleton variant="rectangular" width={200} height={100} />
<Skeleton variant="circular" width={40} height={40} />
```

**Variants:**
- `text`: Text placeholder
- `rectangular`: Rectangular placeholder
- `circular`: Circular placeholder

### Header Component

Application header with Danone branding and theme toggle:

```tsx
import Header from './components/ui/Header';

<Header 
  onLogout={handleLogout}
  currentUser={{ name: 'John Doe', role: 'Chauffeur' }}
  onMenuToggle={toggleMenu}
  isMenuOpen={isMenuOpen}
/>
```

**Features:**
- Danone logo integration
- User profile display
- Dark/light mode toggle
- Mobile responsive menu
- Logout functionality

## Dashboard Components

### DanoneChauffeurDashboard

Driver dashboard for incident management:

```tsx
import DanoneChauffeurDashboard from './components/DanoneChauffeurDashboard';

<DanoneChauffeurDashboard 
  onLogout={handleLogout}
  currentUser={{ name: 'John Doe', role: 'Chauffeur' }}
/>
```

**Features:**
- Statistics cards (total, closed, pending)
- Incident cards with watermarks
- Status badges
- "Nouvelle Déclaration" button
- Quick actions panel
- Responsive grid layout

### DanonePrestataireDashboard

Provider dashboard for intervention management:

```tsx
import DanonePrestataireDashboard from './components/DanonePrestataireDashboard';

<DanonePrestataireDashboard 
  onLogout={handleLogout}
  currentUser={{ name: 'Jane Smith', role: 'Prestataire' }}
/>
```

**Features:**
- Statistics cards
- Search and filter functionality
- Styled dropdown filters
- Intervention table with badges
- Priority indicators
- Export functionality
- Responsive table design

### DanoneResponsableSupportDashboard

Support manager dashboard for report validation:

```tsx
import DanoneResponsableSupportDashboard from './components/DanoneResponsableSupportDashboard';

<DanoneResponsableSupportDashboard 
  onLogout={handleLogout}
  currentUser={{ name: 'Admin User', role: 'Responsable Support' }}
/>
```

**Features:**
- Statistics cards
- Report cards with pastel backgrounds
- Detailed report view
- "Clôturer" and "Retourner" buttons
- Status and priority badges
- Search and filter functionality
- Export capability

## Theme System

### ThemeProvider

Wrap your application with the ThemeProvider to enable dark mode:

```tsx
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      {/* Your app components */}
    </ThemeProvider>
  );
}
```

### useTheme Hook

Access and control the theme in any component:

```tsx
import { useTheme } from './contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className={theme === 'dark' ? 'bg-dark-bg' : 'bg-white'}>
      <button onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  );
}
```

## Icons

The design system uses Lucide React icons for modern, consistent iconography:

```tsx
import { 
  Truck, 
  MapPin, 
  Calendar, 
  User, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download
} from 'lucide-react';
```

## Responsive Design

All components are built with responsive design in mind:

- **Mobile**: Stacked layouts, simplified navigation
- **Tablet**: Adjusted grid columns, optimized spacing
- **Desktop**: Full-featured layouts with multiple columns

Breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## Usage Examples

### Creating a New Dashboard Page

```tsx
import React from 'react';
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import Badge from './components/ui/Badge';
import Header from './components/ui/Header';
import { useTheme } from '../contexts/ThemeContext';

const MyDashboard: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-bg' : 'bg-neutral-gray'}`}>
      <Header onLogout={handleLogout} currentUser={currentUser} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-neutral-text dark:text-white mb-8">
          Dashboard Title
        </h1>
        
        <Card hover>
          <div className="p-6">
            <Badge variant="en-cours">Status</Badge>
            <Button variant="primary" onClick={handleAction}>
              Action Button
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};
```

## Best Practices

1. **Color Usage**
   - Use Danone Blue for primary actions and branding
   - Use Accent Green for success states and validation
   - Use Accent Orange for warnings and pending states
   - Use Neutral colors for backgrounds and text

2. **Spacing**
   - Use consistent spacing with Tailwind's spacing scale
   - Maintain 8px base unit for consistency
   - Use generous padding for touch targets (minimum 44px)

3. **Typography**
   - Use bold weights for headings
   - Use medium weights for emphasis
   - Use regular weights for body text
   - Maintain good contrast ratios (WCAG AA compliant)

4. **Interactions**
   - Add hover states for interactive elements
   - Use smooth transitions (200-300ms)
   - Provide visual feedback for all actions
   - Use loading states for async operations

5. **Accessibility**
   - Ensure proper color contrast
   - Use semantic HTML elements
   - Provide keyboard navigation support
   - Include ARIA labels where necessary

## File Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Header.tsx
│   │   ├── Skeleton.tsx
│   │   └── Toast.tsx
│   ├── DanoneChauffeurDashboard.tsx
│   ├── DanonePrestataireDashboard.tsx
│   └── DanoneResponsableSupportDashboard.tsx
├── contexts/
│   └── ThemeContext.tsx
├── assets/
│   └── logo-danone.svg
└── App.tsx
```

## Customization

To customize the design system:

1. **Colors**: Edit `tailwind.config.js` to modify the color palette
2. **Shadows**: Add custom shadows in the Tailwind config
3. **Animations**: Extend the theme with custom animations
4. **Components**: Modify individual component files to adjust styling

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This design system is proprietary to Danone and should be used exclusively for Danone projects.
