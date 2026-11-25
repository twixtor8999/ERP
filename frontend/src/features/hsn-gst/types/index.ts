export interface HsnGstRecord {
  code: string;
  desc: string;
  gst: number; // e.g. 0, 5, 12, 18, 28
  skusCount?: number;
  category?: string;
  notes?: string;
  updatedAt?: string;
}
