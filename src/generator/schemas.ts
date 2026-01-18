import { z } from "zod";

export const vendorMasterSchema = z.object({
  vendor_id: z.string(),
  vendor_name: z.string(),
  pan: z.string().optional().nullable(),
  gst: z.string().optional().nullable(),
  bank_account: z.string(),
  bank_ifsc: z.string(),
  status: z.enum(["active", "inactive", "blocked"]),
  approved_flag: z.enum(["yes", "no"]),
  created_date: z.string()
});

export const prHeaderSchema = z.object({
  pr_id: z.string(),
  vendor_id: z.string(),
  pr_date: z.string(),
  requester_id: z.string(),
  approver_id: z.string(),
  total_amount: z.number(),
  status: z.string()
});

export const prLineSchema = z.object({
  pr_line_id: z.string(),
  pr_id: z.string(),
  item_code: z.string(),
  quantity: z.number(),
  unit_price: z.number(),
  line_amount: z.number()
});

export const poHeaderSchema = z.object({
  po_no: z.string(),
  pr_id: z.string().optional().nullable(),
  vendor_id: z.string(),
  po_date: z.string(),
  total_amount: z.number(),
  status: z.string()
});

export const poLineSchema = z.object({
  po_line_id: z.string(),
  po_no: z.string(),
  item_code: z.string(),
  quantity: z.number(),
  unit_price: z.number(),
  line_amount: z.number()
});

export const grnHeaderSchema = z.object({
  grn_no: z.string(),
  po_no: z.string().optional().nullable(),
  vendor_id: z.string(),
  dc_no: z.string(),
  dc_date: z.string(),
  posting_date: z.string()
});

export const grnLineSchema = z.object({
  grn_line_id: z.string(),
  grn_no: z.string(),
  item_code: z.string(),
  quantity: z.number()
});

export const invoiceHeaderSchema = z.object({
  invoice_no: z.string(),
  vendor_id: z.string(),
  po_no: z.string().optional().nullable(),
  grn_no: z.string().optional().nullable(),
  invoice_date: z.string(),
  total_amount: z.number()
});

export const invoiceLineSchema = z.object({
  invoice_line_id: z.string(),
  invoice_no: z.string(),
  item_code: z.string(),
  quantity: z.number(),
  unit_price: z.number(),
  line_amount: z.number()
});

export const paymentLedgerSchema = z.object({
  payment_id: z.string(),
  invoice_no: z.string().optional().nullable(),
  vendor_id: z.string(),
  payment_date: z.string(),
  amount: z.number(),
  payment_ref: z.string(),
  created_by: z.string(),
  approved_by: z.string()
});

export const roleMasterSchema = z.object({
  user_id: z.string(),
  role: z.string(),
  effective_from: z.string(),
  effective_to: z.string()
});

export const workflowLogSchema = z.object({
  workflow_id: z.string(),
  entity_id: z.string(),
  action: z.string(),
  actor_id: z.string(),
  action_date: z.string(),
  status: z.string()
});

export const quotationSchema = z.object({
  quotation_id: z.string(),
  vendor_id: z.string(),
  item_code: z.string(),
  quoted_rate: z.number(),
  created_ip: z.string(),
  created_timestamp: z.string()
});

export const contractSchema = z.object({
  contract_id: z.string(),
  vendor_id: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  contract_value: z.number()
});

export const vendorBankChangeSchema = z.object({
  change_id: z.string(),
  vendor_id: z.string(),
  old_account: z.string(),
  new_account: z.string(),
  change_date: z.string(),
  verified_flag: z.enum(["yes", "no"])
});

export const poChangeLogSchema = z.object({
  change_id: z.string(),
  po_no: z.string(),
  change_date: z.string(),
  change_note: z.string()
});

export const truthRowSchema = z.object({
  test_step_id: z.string(),
  test_step_name: z.string(),
  process_area: z.string(),
  entity_type: z.string(),
  entity_id: z.string(),
  secondary_ids: z.string().optional().nullable(),
  planted_fields: z.string(),
  planted_values_summary: z.string(),
  expected_flag: z.boolean(),
  notes: z.string()
});

export type VendorMasterRow = z.infer<typeof vendorMasterSchema>;
export type PrHeaderRow = z.infer<typeof prHeaderSchema>;
export type PrLineRow = z.infer<typeof prLineSchema>;
export type PoHeaderRow = z.infer<typeof poHeaderSchema>;
export type PoLineRow = z.infer<typeof poLineSchema>;
export type GrnHeaderRow = z.infer<typeof grnHeaderSchema>;
export type GrnLineRow = z.infer<typeof grnLineSchema>;
export type InvoiceHeaderRow = z.infer<typeof invoiceHeaderSchema>;
export type InvoiceLineRow = z.infer<typeof invoiceLineSchema>;
export type PaymentLedgerRow = z.infer<typeof paymentLedgerSchema>;
export type RoleMasterRow = z.infer<typeof roleMasterSchema>;
export type WorkflowLogRow = z.infer<typeof workflowLogSchema>;
export type QuotationRow = z.infer<typeof quotationSchema>;
export type ContractRow = z.infer<typeof contractSchema>;
export type VendorBankChangeRow = z.infer<typeof vendorBankChangeSchema>;
export type PoChangeLogRow = z.infer<typeof poChangeLogSchema>;
export type TruthRow = z.infer<typeof truthRowSchema>;
