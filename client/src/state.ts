export type StateCallback = () => void;

export interface StateManager {
  switch(stateName: string, skipCallbacks?: boolean): void;
  beforeShow(stateName: string, callback: StateCallback): void;
  afterShow(stateName: string, callback: StateCallback): void;
  beforeHide(stateName: string, callback: StateCallback): void;
  child(stateName: string, childManager: StateManager): void;
  current(): string | null;
}

export function createStateManager(
  elements: NodeListOf<Element> | Element[],
): StateManager {
  const elementArray = Array.from(elements);
  let currentState: string | null = null;

  const beforeShowCallbacks = new Map<string, StateCallback[]>();
  const afterShowCallbacks = new Map<string, StateCallback[]>();
  const beforeHideCallbacks = new Map<string, StateCallback[]>();
  const childManagers = new Map<string, StateManager>();

  function addCallback(
    map: Map<string, StateCallback[]>,
    state: string,
    cb: StateCallback,
  ): void {
    if (!map.has(state)) {
      map.set(state, []);
    }
    map.get(state)!.push(cb);
  }

  function runCallbacks(map: Map<string, StateCallback[]>, state: string): void {
    const callbacks = map.get(state);
    if (callbacks) {
      callbacks.forEach((cb) => cb());
    }
  }

  return {
    switch(stateName: string, skipCallbacks = false): void {
      // Hide current state
      if (currentState && !skipCallbacks) {
        runCallbacks(beforeHideCallbacks, currentState);
        const child = childManagers.get(currentState);
        if (child && child.current()) {
          child.switch('', skipCallbacks); // Hide child
        }
      }

      // Hide all elements
      elementArray.forEach((el) => {
        (el as HTMLElement).style.display = 'none';
      });

      // Show new state
      if (!skipCallbacks) {
        runCallbacks(beforeShowCallbacks, stateName);
      }

      const targetElement = elementArray.find((el) => el.id === stateName);
      if (targetElement) {
        (targetElement as HTMLElement).style.display = 'block';
      }

      currentState = stateName;

      if (!skipCallbacks) {
        runCallbacks(afterShowCallbacks, stateName);
      }
    },

    beforeShow(stateName: string, callback: StateCallback): void {
      addCallback(beforeShowCallbacks, stateName, callback);
    },

    afterShow(stateName: string, callback: StateCallback): void {
      addCallback(afterShowCallbacks, stateName, callback);
    },

    beforeHide(stateName: string, callback: StateCallback): void {
      addCallback(beforeHideCallbacks, stateName, callback);
    },

    child(stateName: string, childManager: StateManager): void {
      childManagers.set(stateName, childManager);
    },

    current(): string | null {
      return currentState;
    },
  };
}
