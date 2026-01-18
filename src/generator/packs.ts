export type PackConfig = {
  name: string;
  description: string;
  rowsMultiplier: number;
  targetExceptionRange: [number, number];
  policyConfig: Record<string, unknown>;
  anomalyConfig: Record<string, number>;
};

export const packs: Record<string, PackConfig> = {
  vendor_master_pack: {
    name: "vendor_master_pack",
    description: "Vendor master focused checks",
    rowsMultiplier: 0.4,
    targetExceptionRange: [10, 50],
    policyConfig: {
      requireGrnBeforeInvoice: true
    },
    anomalyConfig: {
      vendor_missing_tax: 0.08,
      vendor_duplicate_pan: 0.05,
      vendor_duplicate_bank: 0.05,
      vendor_no_approval: 0.04,
      vendor_bank_change_unverified: 0.05,
      vendor_inactive_used: 0.03
    }
  },
  procurement_pack: {
    name: "procurement_pack",
    description: "End-to-end procurement",
    rowsMultiplier: 1,
    targetExceptionRange: [40, 120],
    policyConfig: {
      requireGrnBeforeInvoice: true
    },
    anomalyConfig: {
      pr_self_approved: 0.02,
      pr_split_bypass: 0.02,
      pr_unauthorized_role: 0.02,
      po_without_pr: 0.02,
      po_rate_gt_quote: 0.02,
      grn_qty_gt_po: 0.02,
      invoice_duplicate: 0.02,
      payment_duplicate: 0.02
    }
  },
  pr_controls_pack: {
    name: "pr_controls_pack",
    description: "PR control checks",
    rowsMultiplier: 0.6,
    targetExceptionRange: [20, 60],
    policyConfig: {
      requireGrnBeforeInvoice: true
    },
    anomalyConfig: {
      pr_self_approved: 0.04,
      pr_split_bypass: 0.03,
      pr_unauthorized_role: 0.03,
      pr_after_po: 0.02
    }
  },
  po_controls_pack: {
    name: "po_controls_pack",
    description: "PO control checks",
    rowsMultiplier: 0.8,
    targetExceptionRange: [20, 70],
    policyConfig: {
      requireGrnBeforeInvoice: true
    },
    anomalyConfig: {
      po_without_pr: 0.03,
      po_after_grn: 0.02,
      po_rate_gt_quote: 0.03,
      po_split_bypass: 0.03,
      po_inactive_vendor: 0.02
    }
  },
  grn_controls_pack: {
    name: "grn_controls_pack",
    description: "GRN control checks",
    rowsMultiplier: 0.8,
    targetExceptionRange: [20, 70],
    policyConfig: {
      requireGrnBeforeInvoice: true
    },
    anomalyConfig: {
      grn_without_po: 0.03,
      grn_qty_gt_po: 0.03,
      grn_backdated: 0.03,
      grn_duplicate_dc: 0.02
    }
  },
  invoice_pack: {
    name: "invoice_pack",
    description: "Invoice checks",
    rowsMultiplier: 0.8,
    targetExceptionRange: [20, 80],
    policyConfig: {
      requireGrnBeforeInvoice: true
    },
    anomalyConfig: {
      invoice_without_po: 0.02,
      invoice_without_grn: 0.03,
      invoice_duplicate: 0.03,
      invoice_amount_gt_po: 0.03,
      invoice_qty_gt_grn: 0.03
    }
  },
  payment_pack: {
    name: "payment_pack",
    description: "Payment checks",
    rowsMultiplier: 0.8,
    targetExceptionRange: [20, 80],
    policyConfig: {
      allowAdvancePayments: false
    },
    anomalyConfig: {
      payment_without_invoice: 0.03,
      payment_duplicate: 0.03,
      payment_near_bank_change: 0.03,
      payment_to_inactive_vendor: 0.03,
      payment_self_approved: 0.03
    }
  },
  fraud_sod_pack: {
    name: "fraud_sod_pack",
    description: "Fraud and segregation of duties",
    rowsMultiplier: 0.6,
    targetExceptionRange: [20, 60],
    policyConfig: {
      requireGrnBeforeInvoice: true
    },
    anomalyConfig: {
      pr_self_approved: 0.03,
      po_rate_gt_quote: 0.03,
      invoice_duplicate: 0.02,
      payment_self_approved: 0.04,
      vendor_bank_change_unverified: 0.03
    }
  },
  p2p_core_pack: {
    name: "p2p_core_pack",
    description: "Core P2P checks",
    rowsMultiplier: 1,
    targetExceptionRange: [50, 140],
    policyConfig: {
      requireGrnBeforeInvoice: true,
      allowAdvancePayments: false
    },
    anomalyConfig: {
      vendor_missing_tax: 0.03,
      vendor_duplicate_bank: 0.02,
      pr_self_approved: 0.02,
      pr_unauthorized_role: 0.02,
      po_without_pr: 0.02,
      po_rate_gt_quote: 0.02,
      grn_qty_gt_po: 0.02,
      invoice_duplicate: 0.02,
      invoice_amount_gt_po: 0.02,
      payment_duplicate: 0.02,
      payment_self_approved: 0.02
    }
  }
};

export const getPackConfig = (pack: string): PackConfig => {
  const config = packs[pack];
  if (!config) {
    throw new Error(`Unknown pack: ${pack}`);
  }
  return config;
};
