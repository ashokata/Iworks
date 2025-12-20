# Thumb-First Mobile Design Guide

## Design Principles

### 1. **Thumb Zone Optimization**
- Place all primary actions in the bottom 2/3 of the screen
- Use bottom sheets instead of top modals
- Navigation at the bottom (already implemented)
- Floating action buttons in bottom-right corner

### 2. **Large Touch Targets**
- Minimum 48x48pt touch targets
- 60x60pt for primary actions
- Extra padding around small icons
- Visual feedback on every touch (haptics + visual)

### 3. **One-Handed Gestures**
- Swipe right to complete/start jobs
- Swipe left for quick actions (call, navigate)
- Pull down to refresh
- Long press for additional options

### 4. **Smart Defaults & Automation**
- Pre-fill common fields
- Remember last selections
- Auto-detect location
- Voice input for notes
- Quick photo capture

## Implementation Checklist

### ✅ Completed
- [x] Thumb-friendly job cards with swipe actions
- [x] Large touch targets on Today screen
- [x] Haptic feedback on all interactions
- [x] Bottom tab navigation
- [x] Quick action buttons (Camera, Voice, Sign, SOS)
- [x] One-tap photo capture
- [x] Simple job completion flow

### 🚧 Next Steps

#### 1. **Voice Integration**
```typescript
// Quick voice note component
<VoiceNoteButton
  onRecord={(audioUri, transcript) => {
    // Auto-transcribe and save
  }}
/>
```

#### 2. **Smart Forms**
```typescript
// Auto-fill from previous jobs
const smartDefaults = {
  laborHours: lastJob?.laborHours || 2,
  materials: lastJob?.materials || [],
  issues: frequentIssues, // AI suggested
}
```

#### 3. **Offline-First with WatermelonDB**
```typescript
// Next priority - Set up offline database
const jobsCollection = database.collections.get('jobs');
const offlineJobs = await jobsCollection
  .query(Q.where('synced', false))
  .fetch();
```

#### 4. **Quick Templates**
```typescript
// Common job templates
const quickTemplates = [
  { name: 'AC Maintenance', checklist: [...], photos: 3 },
  { name: 'Furnace Repair', checklist: [...], photos: 5 },
]
```

## One-Thumb Workflows

### Start Job (2 taps)
1. Swipe right on job card OR tap "Start Job" button
2. Confirm with haptic feedback

### Complete Job (4 taps)
1. Tap "Complete Job" button
2. Take photo (1 tap)
3. Check required items (tap each)
4. Customer signs
5. Tap "Submit"

### Emergency/Help (1 tap)
- Big red SOS button always visible
- Automatically sends location + job info

## Performance Tips

1. **Lazy Load Images**
   - Only load visible job photos
   - Compress before upload

2. **Optimistic Updates**
   - Update UI immediately
   - Sync in background

3. **Minimal Typing**
   - Voice input primary
   - Smart suggestions
   - Recent entries

## Field Tech Feedback Loop

Add analytics to track:
- Time to complete tasks
- Most used features
- Abandoned workflows
- Error rates

Then optimize based on real usage!

## Code Example: Perfect Job Card

```typescript
<JobCard
  // Visual hierarchy
  title={job.title}              // Big & Bold
  customer={job.customer}        // Medium
  time={job.time}               // Small but tappable

  // One-thumb actions
  onSwipeRight={startJob}       // Natural gesture
  onSwipeLeft={showActions}     // Quick menu
  onTap={viewDetails}           // Fallback

  // Feedback
  hapticFeedback="medium"       // Feel every interaction
  loadingState={loading}        // Clear status
  offlineIndicator={!synced}    // Reassure it's saved
/>
```

Remember: If a tech needs two hands or has to think about it, we've failed! 👍