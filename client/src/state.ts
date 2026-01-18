export type PageCallback = () => void;

export class PageManager {
  private elements: Element[];
  private currentPage: string;
  private beforeShowCallbacks = new Map<string, PageCallback>();
  private afterShowCallbacks = new Map<string, PageCallback>();
  private beforeHideCallbacks = new Map<string, PageCallback>();
  private childManagers = new Map<string, PageManager>();

  constructor(elements: NodeListOf<Element> | Element[]) {
    this.elements = Array.from(elements);
    this.currentPage = this.elements[0].id;
  }

  switch(stateName: string): void {
    // Hide current page
    this.beforeHideCallbacks.get(this.currentPage)?.();
    const child = this.childManagers.get(this.currentPage);
    if (child && child.current()) {
      // Switch to empty page (hide everything)
      child.switch('');
    }

    // Hide all elements (remove visible class)
    this.elements.forEach((el) => {
      (el as HTMLElement).classList.remove('visible');
    });

    // Show new page
    this.beforeShowCallbacks.get(stateName)?.();

    const targetElement = this.elements.find((el) => el.id === stateName);
    if (targetElement) {
      (targetElement as HTMLElement).classList.add('visible');
    }

    this.currentPage = stateName;

    this.afterShowCallbacks.get(stateName)?.();
  }

  beforeShow(stateName: string, callback: PageCallback): void {
    this.beforeShowCallbacks.set(stateName, callback);
  }

  afterShow(stateName: string, callback: PageCallback): void {
    this.afterShowCallbacks.set(stateName, callback);
  }

  beforeHide(stateName: string, callback: PageCallback): void {
    this.beforeHideCallbacks.set(stateName, callback);
  }

  child(stateName: string, childManager: PageManager): void {
    this.childManagers.set(stateName, childManager);
  }

  current(): string {
    return this.currentPage;
  }
}
