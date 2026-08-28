export type EstimateViewState =
  | { status: "checking"; attempt: number }
  | { status: "success"; payload: unknown }
  | { status: "error"; message: string };
