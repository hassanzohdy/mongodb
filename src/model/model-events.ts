import { Model } from "./model";

export class ModelEvents<T extends Model> {
  /**
   * Event callbacks
   */
  protected callbacks: Record<string, any[]> = {
    saving: [],
    saved: [],
    creating: [],
    created: [],
    updating: [],
    updated: [],
    deleting: [],
    deleted: [],
  };

  /**
   * {@inheritDoc}
   */
  public constructor(protected collectionName: string) {
    //
  }

  /**
   * Add callback when model is about to be created or updated
   *
   * Triggered before saving the model
   */
  public onSaving(callback: (model: T, type: "create" | "update") => void) {
    this.callbacks.saving.push(callback);
    return this;
  }

  /**
   * Add callback when model is created or updated
   *
   * Triggered after saving the model
   */
  public onSaved(callback: (model: T, type: "create" | "update") => void) {
    this.callbacks.saved.push(callback);

    return this;
  }

  /**
   * Add callback when model is about to be created
   */
  public onCreating(callback: (model: T) => void) {
    this.callbacks.creating.push(callback);

    return this;
  }

  /**
   * Add callback when model is created
   */
  public onCreated(callback: (model: T) => void) {
    this.callbacks.created.push(callback);

    return this;
  }

  /**
   * Add callback when model is about to be updated
   */
  public onUpdating(callback: (model: T) => void) {
    this.callbacks.updating.push(callback);

    return this;
  }

  /**
   * Add callback when model is updated
   */
  public onUpdated(callback: (model: T) => void) {
    this.callbacks.updated.push(callback);

    return this;
  }

  /**
   * Add callback when model is about to be deleted
   */
  public onDeleting(callback: (model: T) => void) {
    this.callbacks.deleting.push(callback);

    return this;
  }

  /**
   * Add callback when model is deleted
   */
  public onDeleted(callback: (model: T) => void) {
    this.callbacks.deleted.push(callback);

    return this;
  }

  /**
   * Trigger the given event
   */
  public async trigger(event: string, ...args: any[]) {
    const callbacks = this.callbacks[event];

    if (!callbacks) {
      return;
    }

    for (const callback of callbacks) {
      await callback(...args);
    }
  }

  /**
   * Get event name
   */
  protected name(event: string) {
    if (this.collectionName) {
      return `model.${this.collectionName}.${event}`;
    }

    return `model.${event}`;
  }
}
