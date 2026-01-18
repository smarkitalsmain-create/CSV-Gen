import { z } from "zod";

export const packNames = [
  "vendor_master_pack",
  "procurement_pack",
  "pr_controls_pack",
  "po_controls_pack",
  "grn_controls_pack",
  "invoice_pack",
  "payment_pack",
  "fraud_sod_pack",
  "p2p_core_pack"
] as const;

export const generateInputSchema = z.object({
  rows: z.number().int().min(1).max(200000),
  vendors: z.number().int().min(1).max(50000),
  seed: z.number().int(),
  startDate: z.string().min(10),
  endDate: z.string().min(10),
  pack: z.enum(packNames),
  anomalies: z.record(z.string(), z.number()).optional()
});

export type GenerateInput = z.infer<typeof generateInputSchema>;
