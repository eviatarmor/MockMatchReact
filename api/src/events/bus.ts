import type { DomainEvent } from "./types.js"

/**
 * Local impl: BullMQ. AWS later: SQS / EventBridge adapter implementing same interface.
 */
export interface EventBus {
  publish(event: DomainEvent): Promise<void>
}

export type EventHandler = (event: DomainEvent) => Promise<void>
