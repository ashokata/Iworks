# Install Required Dependencies for Scheduling & Dispatch

## Required Packages

Run the following command to install all required dependencies:

```bash
npm install mapbox-gl react-map-gl @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities date-fns
npm install --save-dev @types/mapbox-gl
```

## Package Breakdown

### Mapping
- `mapbox-gl` - Mapbox GL JS for interactive maps
- `react-map-gl` - React wrapper for Mapbox
- `@types/mapbox-gl` - TypeScript definitions

### Drag and Drop
- `@dnd-kit/core` - Modern drag and drop toolkit
- `@dnd-kit/sortable` - Sortable functionality
- `@dnd-kit/utilities` - Utility functions

### Date Handling
- `date-fns` - Modern JavaScript date utility library (already installed)

## After Installation

1. Add your Mapbox access token to `.env.local`:
   ```env
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_token_here
   ```

2. Restart the development server:
   ```bash
   npm run dev
   ```

3. Navigate to `/schedule` or `/dispatch` to see the new features

## Verify Installation

Run this command to check if packages are installed:
```bash
npm list mapbox-gl react-map-gl @dnd-kit/core
```

You should see all packages listed without errors.
