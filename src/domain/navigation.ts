export type AppScreen = 'home' | 'list' | 'listEditor' | 'itemEditor' | 'settings';
export type BackDestination = AppScreen | 'exit';

/** In-app destination for Android hardware Back. The root screen may exit normally. */
export function resolveHardwareBack(screen: AppScreen, hasSelectedList: boolean): BackDestination {
  switch (screen) {
    case 'itemEditor': return 'list';
    case 'listEditor': return hasSelectedList ? 'list' : 'home';
    case 'list':
    case 'settings': return 'home';
    case 'home':
    default: return 'exit';
  }
}
