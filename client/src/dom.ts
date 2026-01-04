export function $(selector: string): HTMLElement | null {
  return document.querySelector(selector);
}

export function $$(selector: string): NodeListOf<HTMLElement> {
  return document.querySelectorAll(selector);
}

export function show(el: HTMLElement | null): void {
  if (el) el.style.display = 'block';
}

export function hide(el: HTMLElement | null): void {
  if (el) el.style.display = 'none';
}

export function fadeIn(el: HTMLElement | null, duration = 400): Promise<void> {
  if (!el) return Promise.resolve();

  el.style.opacity = '0';
  el.style.display = 'block';
  el.style.transition = `opacity ${duration}ms ease-in`;

  // Force reflow
  el.offsetHeight;

  el.style.opacity = '1';

  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

export function setHtml(el: HTMLElement | null, html: string): void {
  if (el) el.innerHTML = html;
}

export function onClick(
  el: HTMLElement | null,
  handler: (e: MouseEvent) => void,
): void {
  if (el) el.addEventListener('click', handler);
}

export function onMouseDown(handler: (e: MouseEvent) => void): void {
  document.addEventListener('mousedown', handler);
}

export function offMouseDown(handler: (e: MouseEvent) => void): void {
  document.removeEventListener('mousedown', handler);
}

export function onResize(handler: () => void): void {
  window.addEventListener('resize', handler);
}

export function offResize(handler: () => void): void {
  window.removeEventListener('resize', handler);
}

export function onReady(callback: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}
