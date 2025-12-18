# InField Works - Theme & Design System

## Brand Colors

### Primary Brand Color
- **Hex**: `#1a2a6c`
- **RGB**: `rgb(26, 42, 108)`
- **Usage**: Primary brand color used throughout the application for headers, buttons, links, and key UI elements.

### Secondary Colors
- **Accent Blue**: `#1e40af` (used for gradients and hover states)
- **Gradient End**: `#1e40af` (used in gradient transitions)

## Color Usage

### Primary Color (`#1a2a6c`)
Used for:
- Sidebar background
- Page header gradients (start color)
- Primary buttons
- Links and interactive elements
- Focus rings and borders
- Brand elements

### Secondary Color (`#1e40af`)
Used for:
- Gradient end colors
- Hover states
- Button hover effects
- Link hover states

## Implementation

### Tailwind CSS Custom Colors
The theme uses Tailwind's arbitrary value syntax for custom colors:
- `bg-[#1a2a6c]` - Primary background
- `text-[#1a2a6c]` - Primary text color
- `border-[#1a2a6c]` - Primary border color
- `from-[#1a2a6c]` - Gradient start
- `to-[#1e40af]` - Gradient end

### Common Patterns

#### Page Headers
```tsx
<div className="bg-gradient-to-r from-[#1a2a6c] to-[#1e40af] text-white p-6 shadow-lg">
```

#### Primary Buttons
```tsx
<button className="bg-[#1a2a6c] hover:bg-[#1e40af] text-white">
```

#### Links
```tsx
<a className="text-[#1a2a6c] hover:text-[#1e40af]">
```

#### Focus States
```tsx
<input className="focus:ring-[#1a2a6c] focus:border-[#1a2a6c]">
```

## Components Using Theme Colors

### Core Components
- **SidebarLayout** - Sidebar background (`bg-[#1a2a6c]`)
- **Login Page** - Gradient background and form elements
- **ChatBot** - Header gradient and message bubbles
- **ChatButton** - Floating button gradient

### Page Headers
All major pages use the gradient header:
- Dashboard
- Customers
- Employees
- Jobs
- Technicians
- Settings
- Pricebook
- Service Requests
- Invoices
- Dispatch
- Schedule
- Configurations
- Permissions
- Users

## Design Guidelines

### Contrast
- Primary color (`#1a2a6c`) provides excellent contrast with white text
- Ensure WCAG AA compliance for accessibility

### Gradients
- Use `from-[#1a2a6c]` to `to-[#1e40af]` for horizontal gradients
- Use `from-[#1a2a6c]` via `via-[#1a2a6c]` to `to-[#1e40af]` for diagonal gradients

### Hover States
- Always use `#1e40af` for hover states on primary color elements
- Provides clear visual feedback

### Focus States
- Use `focus:ring-[#1a2a6c]` for focus rings
- Use `focus:border-[#1a2a6c]` for input borders

## Migration Notes

### Previous Color
- **Old**: `#0f118a` (rgb(15, 17, 138))
- **New**: `#1a2a6c` (rgb(26, 42, 108))
- **Date Changed**: December 2024

All instances of `#0f118a` have been replaced with `#1a2a6c` across the application.

## Future Considerations

### Potential Theme Extensions
- Dark mode support
- Light mode variations
- Additional accent colors for different contexts
- Color palette expansion for charts and data visualization

## Files Modified

The following files contain theme color references:
- `src/components/SidebarLayout.tsx`
- `src/app/login/page.tsx`
- `src/app/*/page.tsx` (all page headers)
- `src/components/AIChat/ChatBot.tsx`
- `src/components/AIChat/ChatButton.tsx`

## Maintenance

When updating theme colors:
1. Search for all instances of the color hex code
2. Update Tailwind config if using custom colors
3. Update this documentation
4. Test across all pages and components
5. Verify accessibility contrast ratios

