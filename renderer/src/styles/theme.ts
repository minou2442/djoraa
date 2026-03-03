/**
 * Theme utilities for managing RTL/LTR and dynamic styling
 */

export type Language = 'fr' | 'ar';

export const getDirection = (language: Language): 'ltr' | 'rtl' => {
  return language === 'ar' ? 'rtl' : 'ltr';
};

export const applyDirectionToDocument = (language: Language): void => {
  const direction = getDirection(language);
  document.documentElement.dir = direction;
  document.documentElement.lang = language;
};

/**
 * Flex layout helper that auto-reverses for RTL
 */
export const flexStyles = (direction: 'ltr' | 'rtl') => ({
  marginRight: direction === 'ltr' ? 'var(--spacing-md)' : 0,
  marginLeft: direction === 'rtl' ? 'var(--spacing-md)' : 0
});

/**
 * Padding helper that flips for RTL
 */
export const paddingStyles = (
  direction: 'ltr' | 'rtl',
  top?: string,
  right?: string,
  bottom?: string,
  left?: string
) => ({
  paddingTop: top,
  paddingRight: direction === 'ltr' ? right : left,
  paddingBottom: bottom,
  paddingLeft: direction === 'ltr' ? left : right
});

/**
 * Margin helper that flips for RTL
 */
export const marginStyles = (
  direction: 'ltr' | 'rtl',
  top?: string,
  right?: string,
  bottom?: string,
  left?: string
) => ({
  marginTop: top,
  marginRight: direction === 'ltr' ? right : left,
  marginBottom: bottom,
  marginLeft: direction === 'ltr' ? left : right
});

/**
 * Get spacing value from CSS variables
 */
export const getSpacing = (size: 'sm' | 'md' | 'lg' | 'xl'): string => {
  const spacingMap = {
    sm: 'var(--spacing-sm)',
    md: 'var(--spacing-md)',
    lg: 'var(--spacing-lg)',
    xl: '32px'
  };
  return spacingMap[size];
};

export const themeColors = {
  primary: 'var(--primary-color)',
  success: 'var(--success-color)',
  danger: 'var(--danger-color)',
  warning: 'var(--warning-color)',
  info: 'var(--info-color)',
  lightBg: 'var(--light-bg)',
  borderColor: 'var(--border-color)',
  textColor: 'var(--text-color)'
};
