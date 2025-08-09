# AI Development Rules untuk NgajiTime

## Project Context

NgajiTime adalah aplikasi mobile berbasis React Native dengan Expo framework yang bertema keislaman untuk membantu aktivitas mengaji. Project ini menggunakan modern stack dengan TypeScript, NativeWind (Tailwind CSS), dan Expo Router.

## Tech Stack & Dependencies

- **Framework**: React Native dengan Expo SDK 53
- **Language**: TypeScript
- **Navigation**: Expo Router v5 (file-based routing)
- **Styling**: NativeWind (Tailwind CSS untuk React Native)
- **State Management**: React Hooks (belum ada state management eksternal)
- **Platform Target**: iOS dan Android (mobile-first)

## Code Style & Conventions

### 1. File Structure

- Gunakan file-based routing dengan Expo Router
- File layout utama: `app/_layout.tsx`
- Screens ditempatkan di folder `app/`
- Components reusable di folder `components/` (jika diperlukan)
- Assets di folder `assets/` (images, fonts)

### 2. TypeScript

- **WAJIB** menggunakan TypeScript untuk semua file `.tsx` dan `.ts`
- Definisikan interface/type untuk props dan data structures
- Hindari penggunaan `any`, gunakan proper typing
- Export default untuk components, named export untuk utilities

### 3. Component Structure

```typescript
import { ComponentType } from "react-native";

interface ComponentProps {
  // Define props with proper types
}

export default function ComponentName({ props }: ComponentProps) {
  // Component logic
  return (
    // JSX with NativeWind classes
  );
}
```

### 4. Styling dengan NativeWind

- **PRIORITAS UTAMA**: Gunakan NativeWind classes untuk styling
- Hindari inline styles kecuali untuk values yang dynamic
- Gunakan Tailwind utilities: `flex-1`, `justify-center`, `items-center`, dll
- Untuk conditional styling, gunakan template literals atau classnames utility

### 5. Import/Export

- Gunakan named imports untuk specific components: `import { Text, View } from "react-native"`
- Gunakan default export untuk main components
- Import order: React/RN → Third party → Local imports
- Gunakan relative paths untuk local imports

## Islamic App Specific Rules

### 1. Content Guidelines

- Semua konten harus sesuai dengan nilai-nilai Islam
- Gunakan bahasa Indonesia yang sopan dan baku
- Sertakan doa atau ayat yang relevan jika diperlukan
- Pertimbangkan aspek halal dalam setiap feature

### 2. UI/UX Islamic Principles

- Gunakan warna yang tenang dan tidak berlebihan
- Prioritaskan kemudahan penggunaan untuk semua usia
- Sertakan dark mode untuk kenyamanan mata saat mengaji malam
- Pertimbangkan aksesibilitas untuk pengguna dengan keterbatasan

### 3. Features Expectations

- Jadwal shalat dan reminder
- Tracking progress mengaji
- Bookmarking ayat atau halaman
- Audio untuk bacaan (jika diperlukan)
- Kiblat direction
- Islamic calendar/hijri date

## Development Guidelines

### 1. Performance

- Optimize untuk low-end Android devices
- Lazy load components yang berat
- Gunakan React.memo untuk components yang sering re-render
- Minimize bundle size dengan selective imports

### 2. State Management

- Gunakan useState dan useContext untuk state sederhana
- Implementasi Zustand atau Redux Toolkit jika state menjadi kompleks
- Pertimbangkan AsyncStorage untuk persistence

### 3. Navigation

- Gunakan Expo Router conventions
- Implementasi proper deep linking dengan scheme `ngajitime://`
- Gunakan nested layouts untuk section-based navigation

### 4. Error Handling

- Implement proper error boundaries
- Graceful fallbacks untuk network issues
- User-friendly error messages dalam bahasa Indonesia

### 5. Testing

- Write unit tests untuk logic functions
- Component testing dengan React Native Testing Library
- E2E testing untuk critical user flows

## Code Quality

### 1. ESLint & Prettier

- Follow existing ESLint config (expo preset)
- Format code dengan Prettier sebelum commit
- Resolve semua ESLint warnings

### 2. Git Conventions

- Commit messages dalam bahasa Indonesia atau English
- Use conventional commits: `feat:`, `fix:`, `docs:`, dll
- Feature branches: `feature/nama-feature`

### 3. Documentation

- Comment untuk logic yang kompleks
- README update untuk setup instructions
- JSDoc untuk public functions/components

## API & Data

### 1. API Integration

- Gunakan fetch atau axios untuk HTTP requests
- Implement proper loading states dan error handling
- Consider offline-first approach untuk data penting (ayat, doa)

### 2. Data Storage

- AsyncStorage untuk user preferences
- SQLite untuk data struktur (jika diperlukan)
- JSON files untuk static Islamic data

## Security & Privacy

### 1. User Data

- Minimal data collection
- Local storage priority untuk sensitive data
- Inform user tentang data usage

### 2. Content Validation

- Validate Islamic content accuracy
- Proper attribution untuk sumber ayat/hadis

## Deployment

### 1. Build Process

- Test di kedua platform (iOS & Android)
- Optimize assets sebelum production build
- Proper app signing dan certificates

### 2. Store Guidelines

- Follow Google Play dan App Store guidelines
- Islamic app category positioning
- Proper app description dan screenshots

## Maintenance

### 1. Updates

- Regular dependency updates
- Expo SDK migration planning
- Backward compatibility considerations

### 2. Monitoring

- Crash reporting implementation
- User feedback collection
- Performance monitoring

---

**Catatan**: Rules ini dapat diupdate seiring perkembangan project. Selalu prioritaskan user experience dan nilai-nilai Islam dalam setiap keputusan development.
