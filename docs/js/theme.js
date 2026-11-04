/**
 * Light / dark theme (Auto follows the device). Light is the default.
 */

let theme = LS('theme') || 'light';

const applyTheme = () => {
  const dark =
    theme === 'dark' ||
    (theme === 'auto' &&
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-color-scheme: dark)').matches);
  if (document.documentElement.setAttribute)
    document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
};

applyTheme();

if (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').addEventListener)
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (theme === 'auto') {
      applyTheme();
      render();
    }
  });
