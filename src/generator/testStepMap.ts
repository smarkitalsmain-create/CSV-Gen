export type TestStepMeta = {
  id: string;
  name: string;
  processArea: string;
  requiredTables: string[];
};

export const testStepMap: Record<string, TestStepMeta> = {
  "TS-001": {
    id: "TS-001",
    name: "Missing PAN/GST",
    processArea: "Vendor",
    requiredTables: ["vendor_master"]
  },
  "TS-003": {
    id: "TS-003",
    name: "Duplicate Vendor PAN",
    processArea: "Vendor",
    requiredTables: ["vendor_master"]
  },
  "TS-004": {
    id: "TS-004",
    name: "Duplicate Vendor Bank",
    processArea: "Vendor",
    requiredTables: ["vendor_master"]
  },
  "TS-005": {
    id: "TS-005",
    name: "Vendor onboarded without approval",
    processArea: "Vendor",
    requiredTables: ["vendor_master", "vendor_bank_change_log"]
  },
  "TS-006": {
    id: "TS-006",
    name: "Bank change without verification",
    processArea: "Vendor",
    requiredTables: ["vendor_bank_change_log"]
  },
  "TS-008": {
    id: "TS-008",
    name: "Deactivated vendor still used",
    processArea: "Vendor",
    requiredTables: ["vendor_master", "po_header", "invoice_header", "payment_ledger"]
  },
  "TS-044": {
    id: "TS-044",
    name: "PR self-approved",
    processArea: "PR",
    requiredTables: ["pr_header"]
  },
  "TS-046": {
    id: "TS-046",
    name: "Split PR to bypass tender threshold",
    processArea: "PR",
    requiredTables: ["pr_header", "pr_line"]
  },
  "TS-052": {
    id: "TS-052",
    name: "PR raised by unauthorized role",
    processArea: "PR",
    requiredTables: ["pr_header", "role_master"]
  },
  "TS-060": {
    id: "TS-060",
    name: "PR raised after PO creation",
    processArea: "PR",
    requiredTables: ["pr_header", "po_header"]
  },
  "TS-061": {
    id: "TS-061",
    name: "PO without PR reference",
    processArea: "PO",
    requiredTables: ["po_header"]
  },
  "TS-062": {
    id: "TS-062",
    name: "PO created after GRN",
    processArea: "PO",
    requiredTables: ["po_header", "grn_header"]
  },
  "TS-063": {
    id: "TS-063",
    name: "PO rate higher than approved quotation",
    processArea: "PO",
    requiredTables: ["po_line", "quotation_table"]
  },
  "TS-064": {
    id: "TS-064",
    name: "PO split to bypass approval limit",
    processArea: "PO",
    requiredTables: ["po_header", "po_line"]
  },
  "TS-071": {
    id: "TS-071",
    name: "PO created on inactive vendor",
    processArea: "PO",
    requiredTables: ["po_header", "vendor_master"]
  },
  "TS-081": {
    id: "TS-081",
    name: "GRN without PO reference",
    processArea: "GRN",
    requiredTables: ["grn_header"]
  },
  "TS-082": {
    id: "TS-082",
    name: "GRN quantity exceeds PO quantity",
    processArea: "GRN",
    requiredTables: ["grn_line", "po_line"]
  },
  "TS-085": {
    id: "TS-085",
    name: "Backdated GRN postings",
    processArea: "GRN",
    requiredTables: ["grn_header"]
  },
  "TS-088": {
    id: "TS-088",
    name: "Duplicate DC numbers",
    processArea: "GRN",
    requiredTables: ["grn_header"]
  },
  "TS-116": {
    id: "TS-116",
    name: "Invoice posted without PO",
    processArea: "Invoice",
    requiredTables: ["invoice_header"]
  },
  "TS-117": {
    id: "TS-117",
    name: "Invoice posted without GRN",
    processArea: "Invoice",
    requiredTables: ["invoice_header"]
  },
  "TS-118": {
    id: "TS-118",
    name: "Exact duplicate invoice",
    processArea: "Invoice",
    requiredTables: ["invoice_header"]
  },
  "TS-120": {
    id: "TS-120",
    name: "Invoice amount exceeds PO amount",
    processArea: "Invoice",
    requiredTables: ["invoice_header", "po_header"]
  },
  "TS-121": {
    id: "TS-121",
    name: "Invoice quantity exceeds GRN quantity",
    processArea: "Invoice",
    requiredTables: ["invoice_line", "grn_line"]
  },
  "TS-136": {
    id: "TS-136",
    name: "Payment without invoice",
    processArea: "Payment",
    requiredTables: ["payment_ledger"]
  },
  "TS-137": {
    id: "TS-137",
    name: "Duplicate payment",
    processArea: "Payment",
    requiredTables: ["payment_ledger"]
  },
  "TS-139": {
    id: "TS-139",
    name: "Payment within X days of bank change",
    processArea: "Payment",
    requiredTables: ["payment_ledger", "vendor_bank_change_log"]
  },
  "TS-142": {
    id: "TS-142",
    name: "Payment to blocked/inactive vendor",
    processArea: "Payment",
    requiredTables: ["payment_ledger", "vendor_master"]
  },
  "TS-150": {
    id: "TS-150",
    name: "Payment approved by its own creator",
    processArea: "Payment",
    requiredTables: ["payment_ledger"]
  }
};

export const anomalyKeyToSteps: Record<string, string[]> = {
  vendor_missing_tax: ["TS-001"],
  vendor_duplicate_pan: ["TS-003"],
  vendor_duplicate_bank: ["TS-004"],
  vendor_no_approval: ["TS-005"],
  vendor_bank_change_unverified: ["TS-006"],
  vendor_inactive_used: ["TS-008"],
  pr_self_approved: ["TS-044"],
  pr_split_bypass: ["TS-046"],
  pr_unauthorized_role: ["TS-052"],
  pr_after_po: ["TS-060"],
  po_without_pr: ["TS-061"],
  po_after_grn: ["TS-062"],
  po_rate_gt_quote: ["TS-063"],
  po_split_bypass: ["TS-064"],
  po_inactive_vendor: ["TS-071"],
  grn_without_po: ["TS-081"],
  grn_qty_gt_po: ["TS-082"],
  grn_backdated: ["TS-085"],
  grn_duplicate_dc: ["TS-088"],
  invoice_without_po: ["TS-116"],
  invoice_without_grn: ["TS-117"],
  invoice_duplicate: ["TS-118"],
  invoice_amount_gt_po: ["TS-120"],
  invoice_qty_gt_grn: ["TS-121"],
  payment_without_invoice: ["TS-136"],
  payment_duplicate: ["TS-137"],
  payment_near_bank_change: ["TS-139"],
  payment_to_inactive_vendor: ["TS-142"],
  payment_self_approved: ["TS-150"]
};
