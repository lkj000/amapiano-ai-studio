/**
 * Simple EventEmitter for agent events
 */

type Listener<T> = (event: T) => void;

export class EventEmitter<T> {
  private listeners: Set<Listener<T>> = new Set();

  on(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  off(listener: Listener<T>): void {
    this.listeners.delete(listener);
  }

  emit(event: T): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  once(listener: Listener<T>): () => void {
    const wrapper = (event: T) => {
      this.off(wrapper);
      listener(event);
    };
    return this.on(wrapper);
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }

  listenerCount(): number {
    return this.listeners.size;
  }
}
