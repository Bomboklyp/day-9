import { defineStore } from "pinia";
import type {
  RequestPriority,
  RequestStatus,
} from "../../../../shared/types/request";

export type UndoChange = { id: number; sequence: number } & (
  | { field: "priority"; before: RequestPriority; after: RequestPriority }
  | { field: "status"; before: RequestStatus; after: RequestStatus }
);
export interface RequestNotice {
  requestId: number;
  kind: "saving" | "success" | "error";
  message: string;
}
export const useRequestUiStore = defineStore("request-ui", {
  state: () => ({
    sequence: 0,
    pending: {} as Record<number, number | undefined>,
    priorityChanges: {} as Record<
      number,
      { before: RequestPriority; after: RequestPriority } | undefined
    >,
    undo: null as UndoChange | null,
    notice: null as RequestNotice | null,
  }),
  actions: {
    begin(id: number): number | undefined {
      if (this.pending[id]) return;
      const sequence = ++this.sequence;
      this.pending[id] = sequence;
      return sequence;
    },
    finish(id: number, sequence: number) {
      if (this.pending[id] === sequence) {
        this.pending[id] = undefined;
        this.priorityChanges[id] = undefined;
      }
    },
    remember(change: UndoChange) {
      if (!this.undo || change.sequence > this.undo.sequence)
        this.undo = change;
    },
    forget(sequence: number) {
      if (this.undo?.sequence === sequence) this.undo = null;
    },
  },
});
