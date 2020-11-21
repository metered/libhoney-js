import { SuperAgentRequest } from "superagent";

export interface TransmissionResponse {
  status_code?: number
  metadata: unknown | null
  duration?: number
  error?: Error
}

export type TransmissionResponseHook = (responses: TransmissionResponse[]) => void

export interface TransmissionOptions {
  disabled?: boolean

  responseCallback?: TransmissionResponseHook

  /**
   * (Default 50) We send a batch to the API when this many outstanding events exist in our event queue.
   */
  batchSizeTrigger?: number;

  /**
   * (Default 100) We send a batch to the API after this many milliseconds have passed.
   */
  batchTimeTrigger?: number;

  /**
   * (Default 10) We process batches concurrently to increase parallelism while sending.
   */
  maxConcurrentBatches?: number;

  /**
   * (Default 10000) The maximum number of pending events we allow to accumulate in our sending queue before dropping them.
   */
  pendingWorkCapacity?: number;

  timeout?: number

  userAgentAddition?: string

  proxy?: (req: SuperAgentRequest) => SuperAgentRequest
}

export type TransmissionType = "base" | "mock" | "null" | "worker" | "writer" | "console";

export interface LibhoneyUserOptions extends TransmissionOptions {
  /**
   * Write key for your Honeycomb team
   */
  writeKey: string;
  /**
   * Name of the dataset that should contain this event. The dataset will be created for your team if it doesn't already exist.
   */
  dataset: string;
  /**
   * (Default 1) Sample rate of data. If set, causes us to send 1/sampleRate of events and drop the rest.
   */
  sampleRate?: number;
  /**
   * (Default 1000) The maximum number of responses we enqueue before dropping them.
   */
  maxResponseQueueSize?: number;
  /**
   * Disable transmission of events to the specified `apiHost`, particularly useful for testing or development.
   */
  disabled?: boolean;
  /**
   * (Default "https://api.honeycomb.io/") Server host to receive Honeycomb events (Defaults to https://api.honeycomb.io).
   */
  apiHost?: string;

  transmission?: TransmissionType;
}

export interface LibhoneySend {
  /**
   *  sendEvent takes events of the following form:
   *
   * {
   *   data: a JSON-serializable object, keys become colums in Honeycomb
   *   timestamp [optional]: time for this event, defaults to now()
   *   writeKey [optional]: your team's write key.  overrides the libhoney instance's value.
   *   dataset [optional]: the data set name.  overrides the libhoney instance's value.
   *   sampleRate [optional]: cause us to send 1 out of sampleRate events.  overrides the libhoney instance's value.
   * }
   *
   * Sampling is done based on the supplied sampleRate, so events passed to this method might not
   * actually be sent to Honeycomb.
   */
  sendEvent(event: Event): void

  /**
   *  sendPresampledEvent takes events of the following form:
   *
   * {
   *   data: a JSON-serializable object, keys become colums in Honeycomb
   *   timestamp [optional]: time for this event, defaults to now()
   *   writeKey [optional]: your team's write key.  overrides the libhoney instance's value.
   *   dataset [optional]: the data set name.  overrides the libhoney instance's value.
   *   sampleRate: the rate this event has already been sampled.
   * }
   *
   * Sampling is presumed to have already been done (at the supplied sampledRate), so all events passed to this method
   * are sent to Honeycomb.
   */
  sendPresampledEvent(event: Event): void
}

export interface Builder {
  // The hostname for the Honeycomb API server to which to send events created through this builder.
  apiHost: string

  // The name of the Honeycomb dataset to which to send these events.
  dataset: string

  // The rate at which to sample events.
  sampleRate: number

  // The Honeycomb authentication token.
  writeKey: string

  // adds a group of field -> values to the events created from this builder.
  add(data: Record<string, any> | Map<string, any>): this

  // adds a single field -> dynamic value function, which is invoked to supply values when events are created from this builder.
  addDynamicField(name: string, fn: () => any): this

  // adds a single field -> value mapping to the events created from this builder.
  addField(name: string, val: any): this

  // creates and returns a clone of this builder, merged with fields and dyn_fields passed as arguments.
  newBuilder(fields: Record<string, any> | Map<string, any>, dyn_fields: Record<string, () => any> | Map<string, () => any>): Builder

  // creates and returns a new Event containing all fields / dyn_fields from this builder, that can be further fleshed out and sent on its own.
  newEvent(): Event

  // creates and sends an event, including all builder fields / dyn_fields, as well as anything in the optional data parameter.
  sendNow(data: Record<string, any> | Map<string, any>): void
}

export type EventFields = Record<string, unknown>;

export type EventDynamicFields = Record<string, () => unknown>;

export interface Event {
  metadata?: unknown | null

  // If set, specifies the timestamp associated with this event.
  timestamp?: Date | null;

  // The hostname for the Honeycomb API server to which to send this event.
  apiHost: string

  data: unknown

  // The name of the Honeycomb dataset to which to send this event.
  dataset: string

  // The rate at which to sample this event.
  sampleRate: number

  // The Honeycomb authentication token for this event.
  writeKey: string

  // adds a group of field->values to this event.
  add(data: Record<string, any> | Map<string, any>): Event

  // adds a single field->value mapping to this event.
  addField(key: string, value: any): Event;

  // attaches data to an event that is not transmitted to honeycomb, but instead is available when checking the send responses.
  addMetadata(md: any): Event

  // Sends this event to honeycomb, sampling if necessary.
  send(): void;

  // Dispatch an event to be sent to Honeycomb.
  sendPresampled(): void
}

export interface Transmission {
  sendEvent(ev: ValidatedEvent): void
  sendPresampledEvent(ev: ValidatedEvent): void
  flush(): Promise<void>
}

export interface ValidatedEvent {
  readonly apiHost: string
  readonly writeKey: string
  readonly dataset: string
  readonly metadata: unknown
  readonly sampleRate: number

  encodeError?: Error

  toJSON(): Record<string, unknown>
  toBrokenJSON(): string
}

export type Required<T> =
  T extends object
  ? { [P in keyof T]-?: NonNullable<T[P]>; }
  : T;
