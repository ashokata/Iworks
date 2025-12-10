# Mapbox Setup Instructions

## Why Mapbox?

Mapbox was chosen over Google Maps for the following reasons:
- **Cost-Effective**: 50,000 free map loads per month vs Google's 28,000
- **Better Customization**: Highly customizable map styles
- **Performance**: Faster rendering and better mobile performance
- **Developer Experience**: Excellent documentation and React integration

## Installation

### 1. Install Mapbox GL JS

```bash
npm install mapbox-gl react-map-gl
npm install --save-dev @types/mapbox-gl
```

### 2. Get Your Mapbox Access Token

1. Go to [https://account.mapbox.com/](https://account.mapbox.com/)
2. Sign up for a free account
3. Navigate to "Access tokens"
4. Copy your default public token OR create a new one

### 3. Add Token to Environment Variables

Create or update `.env.local`:

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

**Important**: Never commit your access token to version control!

### 4. Add Mapbox CSS

The Mapbox stylesheet is imported in the components that use it, so no global CSS changes are needed.

## Usage Example

```typescript
import Map from '@/components/Map/MapView';

<MapView
  technicians={technicians}
  jobs={jobs}
  onTechnicianClick={(tech) => console.log(tech)}
  onJobClick={(job) => console.log(job)}
/>
```

## Features Implemented

- ✅ Interactive map with zoom and pan
- ✅ Technician location markers
- ✅ Job location markers
- ✅ Route optimization
- ✅ Real-time location updates
- ✅ Clustering for multiple markers
- ✅ Custom marker colors and icons

## Free Tier Limits

- **Map Loads**: 50,000 per month
- **Geocoding**: 100,000 requests per month
- **Directions**: 100,000 requests per month
- **Isochrone**: 100,000 requests per month

These limits are more than sufficient for most field service applications.

## Cost Comparison

| Feature | Mapbox (Free) | Google Maps (Free) |
|---------|--------------|-------------------|
| Map Loads | 50,000/month | 28,000/month |
| Geocoding | 100,000/month | 40,000/month |
| Directions | 100,000/month | 40,000/month |
| Pricing after free tier | $5 per 1,000 | $7 per 1,000 |

## Troubleshooting

### Map Not Displaying

1. Check if `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is set in `.env.local`
2. Verify the token is valid at [Mapbox Account](https://account.mapbox.com/)
3. Ensure the CSS is imported: `import 'mapbox-gl/dist/mapbox-gl.css'`
4. Check browser console for errors

### TypeScript Errors

If you see TypeScript errors related to mapbox-gl:
```bash
npm install --save-dev @types/mapbox-gl
```

## Resources

- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/api/)
- [React Map GL Documentation](https://visgl.github.io/react-map-gl/)
- [Mapbox Studio](https://studio.mapbox.com/) - Create custom map styles
- [Pricing Calculator](https://www.mapbox.com/pricing)
