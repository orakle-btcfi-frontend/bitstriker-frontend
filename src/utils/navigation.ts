// Navigation utility functions for handling different base paths

export const getBasePath = (): string => {
  // 모든 환경에서 루트 경로 사용
  return '';

  /* 기존 btcfi 관련 로직 주석처리
  const pathname = window.location.pathname;
  const isDev = import.meta.env.DEV;

  // Development 환경에서는 base path 없이 사용
  if (isDev) {
    return '';
  }

  // Production 환경에서는 pathname을 확인하여 적절한 base path 결정
  if (pathname.startsWith('/btcfi-static')) {
    return '/btcfi-static';
  }

  if (pathname.startsWith('/btcfi')) {
    return '/btcfi';
  }

  // Production이지만 base path가 명확하지 않은 경우 기본값 사용
  return '/btcfi-static';
  */
};

export const createRoute = (path: string): string => {
  const basePath = getBasePath();

  // If path is already absolute and starts with base, return as-is
  if (path.startsWith(basePath)) {
    return path;
  }

  // For root path
  if (path === '/') {
    return basePath || '/';
  }

  // For other paths, combine base with path
  return `${basePath}${path}`;
};

export const isActiveRoute = (
  routePath: string,
  currentPath: string
): boolean => {
  const fullRoute = createRoute(routePath);
  return currentPath === fullRoute;
};
