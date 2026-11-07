export type PhotoDto = {
  id: string;
  originalName: string;
  width: number | null;
  height: number | null;
  bytes: number;
  status: "pending" | "ready" | "failed";
  error: string | null;
  createdAt: string;
};
