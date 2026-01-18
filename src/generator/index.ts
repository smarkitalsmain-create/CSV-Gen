import fs from "node:fs";
import path from "node:path";
import { faker } from "@faker-js/faker";
import { createCsvWriter } from "@/src/utils/csvWriter";
import { addDays, randomDateBetween, toIsoDate } from "@/src/utils/dates";
import { chance, createRng, pickOne, randomInt } from "@/src/utils/random";
import { generateInputSchema, GenerateInput } from "@/src/generator/config";
import { getPackConfig } from "@/src/generator/packs";
import {
  ContractRow,
  GrnHeaderRow,
  GrnLineRow,
  InvoiceHeaderRow,
  InvoiceLineRow,
  PaymentLedgerRow,
  PoChangeLogRow,
  PoHeaderRow,
  PoLineRow,
  PrHeaderRow,
  PrLineRow,
  QuotationRow,
  RoleMasterRow,
  TruthRow,
  VendorBankChangeRow,
  VendorMasterRow,
  WorkflowLogRow
} from "@/src/generator/schemas";
import { testStepMap } from "@/src/generator/testStepMap";

export type GenerateResult = {
  runId: string;
  outputPath: string;
  countsByFile: Record<string, number>;
  truthCount: number;
};

const buildRunId = (seed: number) => {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `run_${stamp}_${seed}`;
};

const buildTruthRow = (
  testStepId: string,
  entityType: string,
  entityId: string,
  plantedFields: string,
  plantedValuesSummary: string,
  notes: string,
  secondaryIds?: Record<string, string>
): TruthRow => {
  const meta = testStepMap[testStepId];
  return {
    test_step_id: testStepId,
    test_step_name: meta?.name ?? "Unknown",
    process_area: meta?.processArea ?? "Unknown",
    entity_type: entityType,
    entity_id: entityId,
    secondary_ids: secondaryIds ? JSON.stringify(secondaryIds) : "",
    planted_fields: plantedFields,
    planted_values_summary: plantedValuesSummary,
    expected_flag: true,
    notes
  };
};

export const generateData = async (input: GenerateInput): Promise<GenerateResult> => {
  const validated = generateInputSchema.parse(input);
  const packConfig = getPackConfig(validated.pack);
  const anomalyConfig = {
    ...packConfig.anomalyConfig,
    ...validated.anomalies
  };

  const startDate = new Date(validated.startDate);
  const endDate = new Date(validated.endDate);
  if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) {
    throw new Error("Invalid date range provided.");
  }
  if (startDate > endDate) {
    throw new Error("startDate must be earlier than endDate.");
  }

  const runId = buildRunId(validated.seed);
  const outputPath = path.join(process.cwd(), "out", runId);
  await fs.promises.mkdir(outputPath, { recursive: true });

  const rng = createRng(validated.seed);
  faker.seed(validated.seed);

  const countsByFile: Record<string, number> = {};
  const count = (file: string) => {
    countsByFile[file] = (countsByFile[file] ?? 0) + 1;
  };

  const vendorWriter = await createCsvWriter<VendorMasterRow>(outputPath, "vendor_master.csv");
  const prHeaderWriter = await createCsvWriter<PrHeaderRow>(outputPath, "pr_header.csv");
  const prLineWriter = await createCsvWriter<PrLineRow>(outputPath, "pr_line.csv");
  const poHeaderWriter = await createCsvWriter<PoHeaderRow>(outputPath, "po_header.csv");
  const poLineWriter = await createCsvWriter<PoLineRow>(outputPath, "po_line.csv");
  const grnHeaderWriter = await createCsvWriter<GrnHeaderRow>(outputPath, "grn_header.csv");
  const grnLineWriter = await createCsvWriter<GrnLineRow>(outputPath, "grn_line.csv");
  const invoiceHeaderWriter = await createCsvWriter<InvoiceHeaderRow>(outputPath, "invoice_header.csv");
  const invoiceLineWriter = await createCsvWriter<InvoiceLineRow>(outputPath, "invoice_line.csv");
  const paymentWriter = await createCsvWriter<PaymentLedgerRow>(outputPath, "payment_ledger.csv");
  const roleWriter = await createCsvWriter<RoleMasterRow>(outputPath, "role_master.csv");
  const prWorkflowWriter = await createCsvWriter<WorkflowLogRow>(outputPath, "pr_workflow_log.csv");
  const poWorkflowWriter = await createCsvWriter<WorkflowLogRow>(outputPath, "po_workflow_log.csv");
  const paymentWorkflowWriter = await createCsvWriter<WorkflowLogRow>(outputPath, "payment_workflow_log.csv");
  const quotationWriter = await createCsvWriter<QuotationRow>(outputPath, "quotation_table.csv");
  const contractWriter = await createCsvWriter<ContractRow>(outputPath, "contract_master.csv");
  const vendorBankWriter = await createCsvWriter<VendorBankChangeRow>(outputPath, "vendor_bank_change_log.csv");
  const poChangeWriter = await createCsvWriter<PoChangeLogRow>(outputPath, "po_change_log.csv");
  const truthWriter = await createCsvWriter<TruthRow>(outputPath, "truth.csv");

  const truthEntries: TruthRow[] = [];
  const pushTruth = (row: TruthRow) => {
    truthEntries.push(row);
    truthWriter.write(row);
    count("truth.csv");
  };

  const vendors: VendorMasterRow[] = [];
  const vendorStatus = new Map<string, VendorMasterRow["status"]>();
  const vendorBankMap = new Map<string, string>();
  const vendorPanMap = new Map<string, string>();
  const vendorBankChange = new Map<string, VendorBankChangeRow>();

  const vendorCount = Math.max(1, Math.floor(validated.vendors * packConfig.rowsMultiplier));

  for (let i = 1; i <= vendorCount; i += 1) {
    const vendorId = `V-${i.toString().padStart(6, "0")}`;
    let pan = faker.string.alpha({ length: 5 }).toUpperCase() + faker.string.numeric(4) + faker.string.alpha({ length: 1 }).toUpperCase();
    let gst = faker.string.numeric(2) + pan + faker.string.numeric(4);
    let bankAccount = faker.finance.accountNumber(12);
    const bankIfsc = "IFSC" + faker.string.numeric(7);

    if (chance(rng, anomalyConfig.vendor_duplicate_pan ?? 0) && vendors.length > 0) {
      pan = pickOne(rng, vendors).pan ?? pan;
      pushTruth(
        buildTruthRow(
          "TS-003",
          "vendor",
          vendorId,
          "pan",
          `Duplicate PAN ${pan}`,
          "Vendor shares PAN with another vendor",
          { duplicate_of: vendorPanMap.get(pan) ?? "" }
        )
      );
    }

    if (chance(rng, anomalyConfig.vendor_duplicate_bank ?? 0) && vendors.length > 0) {
      bankAccount = pickOne(rng, vendors).bank_account;
      pushTruth(
        buildTruthRow(
          "TS-004",
          "vendor",
          vendorId,
          "bank_account",
          `Duplicate bank account ${bankAccount}`,
          "Vendor shares bank account with another vendor",
          { duplicate_of: vendorBankMap.get(bankAccount) ?? "" }
        )
      );
    }

    if (chance(rng, anomalyConfig.vendor_missing_tax ?? 0)) {
      pan = "";
      gst = "";
      pushTruth(
        buildTruthRow(
          "TS-001",
          "vendor",
          vendorId,
          "pan,gst",
          "Missing PAN/GST",
          "Vendor missing mandatory tax identifiers"
        )
      );
    }

    const approvedFlag = chance(rng, anomalyConfig.vendor_no_approval ?? 0) ? "no" : "yes";
    if (approvedFlag === "no") {
      pushTruth(
        buildTruthRow(
          "TS-005",
          "vendor",
          vendorId,
          "approved_flag",
          "approved_flag=no",
          "Vendor onboarded without approval"
        )
      );
    }

    const status = chance(rng, anomalyConfig.vendor_inactive_used ?? 0) ? "inactive" : "active";
    if (status !== "active") {
      pushTruth(
        buildTruthRow(
          "TS-008",
          "vendor",
          vendorId,
          "status",
          `status=${status}`,
          "Vendor marked inactive but will be used in transactions"
        )
      );
    }

    const vendorRow: VendorMasterRow = {
      vendor_id: vendorId,
      vendor_name: faker.company.name(),
      pan,
      gst,
      bank_account: bankAccount,
      bank_ifsc: bankIfsc,
      status,
      approved_flag: approvedFlag,
      created_date: toIsoDate(randomDateBetween(startDate, endDate, rng))
    };

    vendorWriter.write(vendorRow);
    count("vendor_master.csv");
    vendors.push(vendorRow);
    vendorStatus.set(vendorId, status);
    vendorBankMap.set(bankAccount, vendorId);
    if (pan) {
      vendorPanMap.set(pan, vendorId);
    }

    if (chance(rng, anomalyConfig.vendor_bank_change_unverified ?? 0)) {
      const newAccount = faker.finance.accountNumber(12);
      const changeRow: VendorBankChangeRow = {
        change_id: `BC-${i.toString().padStart(6, "0")}`,
        vendor_id: vendorId,
        old_account: bankAccount,
        new_account: newAccount,
        change_date: toIsoDate(addDays(startDate, randomInt(rng, 1, 10))),
        verified_flag: "no"
      };
      vendorBankWriter.write(changeRow);
      count("vendor_bank_change_log.csv");
      vendorBankChange.set(vendorId, changeRow);
      pushTruth(
        buildTruthRow(
          "TS-006",
          "vendor",
          vendorId,
          "verified_flag",
          "verified_flag=no",
          "Bank change without verification"
        )
      );
    } else {
      const changeRow: VendorBankChangeRow = {
        change_id: `BC-${i.toString().padStart(6, "0")}`,
        vendor_id: vendorId,
        old_account: bankAccount,
        new_account: bankAccount,
        change_date: toIsoDate(addDays(startDate, randomInt(rng, 1, 10))),
        verified_flag: "yes"
      };
      vendorBankWriter.write(changeRow);
      count("vendor_bank_change_log.csv");
      vendorBankChange.set(vendorId, changeRow);
    }

    if (i <= Math.max(1, Math.floor(vendorCount * 0.3))) {
      const contractRow: ContractRow = {
        contract_id: `C-${i.toString().padStart(5, "0")}`,
        vendor_id: vendorId,
        start_date: toIsoDate(startDate),
        end_date: toIsoDate(endDate),
        contract_value: randomInt(rng, 5000, 200000)
      };
      contractWriter.write(contractRow);
      count("contract_master.csv");
    }
  }

  const roleUsers: RoleMasterRow[] = [];
  const roles = ["requester", "approver", "buyer", "finance", "viewer"];
  for (let i = 1; i <= 60; i += 1) {
    const role = pickOne(rng, roles);
    const row: RoleMasterRow = {
      user_id: `U-${i.toString().padStart(4, "0")}`,
      role,
      effective_from: toIsoDate(startDate),
      effective_to: toIsoDate(endDate)
    };
    roleWriter.write(row);
    count("role_master.csv");
    roleUsers.push(row);
  }

  const prTotals = new Map<string, number>();
  const poTotals = new Map<string, number>();
  const grnQty = new Map<string, number>();
  const poQty = new Map<string, number>();
  const invoiceTotals = new Map<string, number>();
  const invoiceQty = new Map<string, number>();
  const prDateMap = new Map<string, Date>();
  const prAfterPo = new Set<string>();

  const linesPerPr = 3;
  const linesPerPo = 3;

  let poCounter = 0;
  let grnCounter = 0;
  let invoiceCounter = 0;
  let paymentCounter = 0;

  const totalRows = Math.floor(validated.rows * packConfig.rowsMultiplier);
  const dcNumbers: string[] = [];
  const duplicateInvoiceKeys = new Map<string, InvoiceHeaderRow>();
  const duplicatePaymentKeys = new Map<string, PaymentLedgerRow>();

  for (let i = 1; i <= totalRows; i += 1) {
    const vendor = pickOne(rng, vendors);
    const prIndex = Math.floor((i - 1) / linesPerPr) + 1;
    const prId = `PR-${prIndex.toString().padStart(6, "0")}`;
    const prLineId = `PRL-${i.toString().padStart(7, "0")}`;

    if (!prTotals.has(prId)) {
      let prDate = randomDateBetween(startDate, endDate, rng);
      const requester = pickOne(rng, roleUsers);
      const approver = pickOne(rng, roleUsers);

      let finalApproverId = approver.user_id;
      if (chance(rng, anomalyConfig.pr_self_approved ?? 0)) {
        finalApproverId = requester.user_id;
        pushTruth(
          buildTruthRow(
            "TS-044",
            "pr",
            prId,
            "approver_id",
            "approver_id=requester_id",
            "PR self-approved",
            { requester_id: requester.user_id }
          )
        );
      }

      const unauthorizedRequester = chance(rng, anomalyConfig.pr_unauthorized_role ?? 0);
      if (unauthorizedRequester) {
        const viewer = roleUsers.find((user) => user.role === "viewer") ?? requester;
        pushTruth(
          buildTruthRow(
            "TS-052",
            "pr",
            prId,
            "requester_id",
            `requester_id=${viewer.user_id}`,
            "PR raised by unauthorized role"
          )
        );
      }

      if (chance(rng, anomalyConfig.pr_after_po ?? 0)) {
        prAfterPo.add(prId);
        prDate = addDays(prDate, randomInt(rng, 1, 3));
        if (prDate > endDate) {
          prDate = new Date(endDate);
        }
        pushTruth(
          buildTruthRow(
            "TS-060",
            "pr",
            prId,
            "pr_date",
            "PR date after PO",
            "PR created after PO"
          )
        );
      }

      if (chance(rng, anomalyConfig.pr_split_bypass ?? 0)) {
        pushTruth(
          buildTruthRow(
            "TS-046",
            "pr",
            prId,
            "total_amount",
            "Split PR below tender threshold",
            "Split PR to bypass tender threshold"
          )
        );
      }

      const prHeader: PrHeaderRow = {
        pr_id: prId,
        vendor_id: vendor.vendor_id,
        pr_date: toIsoDate(prDate),
        requester_id: unauthorizedRequester ? (roleUsers.find((user) => user.role === "viewer")?.user_id ?? requester.user_id) : requester.user_id,
        approver_id: finalApproverId,
        total_amount: 0,
        status: "approved"
      };
      prHeaderWriter.write(prHeader);
      count("pr_header.csv");

      const workflowRow: WorkflowLogRow = {
        workflow_id: `PRW-${prIndex.toString().padStart(6, "0")}`,
        entity_id: prId,
        action: "approve",
        actor_id: finalApproverId,
        action_date: toIsoDate(addDays(prDate, 1)),
        status: "approved"
      };
      prWorkflowWriter.write(workflowRow);
      count("pr_workflow_log.csv");

      prTotals.set(prId, 0);
      prDateMap.set(prId, prDate);
    }

    const itemCode = `IT-${randomInt(rng, 100, 999)}`;
    const quantity = randomInt(rng, 1, 20);
    const unitPrice = randomInt(rng, 50, 500);
    const lineAmount = quantity * unitPrice;

    prLineWriter.write({
      pr_line_id: prLineId,
      pr_id: prId,
      item_code: itemCode,
      quantity,
      unit_price: unitPrice,
      line_amount: lineAmount
    });
    count("pr_line.csv");
    prTotals.set(prId, (prTotals.get(prId) ?? 0) + lineAmount);

    if (i % linesPerPo === 0) {
      poCounter += 1;
      const poNo = `PO-${poCounter.toString().padStart(6, "0")}`;
      const prDate = prDateMap.get(prId) ?? randomDateBetween(startDate, endDate, rng);
      let poDate = addDays(prDate, randomInt(rng, 1, 5));
      if (prAfterPo.has(prId)) {
        poDate = addDays(prDate, -randomInt(rng, 1, 3));
        if (poDate < startDate) {
          poDate = new Date(startDate);
        }
      }
      let prReference: string | null = prId;

      if (chance(rng, anomalyConfig.po_without_pr ?? 0)) {
        prReference = "";
        pushTruth(
          buildTruthRow(
            "TS-061",
            "po",
            poNo,
            "pr_id",
            "pr_id missing",
            "PO without PR reference"
          )
        );
      }

      const poHeader: PoHeaderRow = {
        po_no: poNo,
        pr_id: prReference,
        vendor_id: vendor.vendor_id,
        po_date: toIsoDate(poDate),
        total_amount: 0,
        status: "issued"
      };

      if (chance(rng, anomalyConfig.po_inactive_vendor ?? 0)) {
        const inactiveVendor = vendors.find((item) => item.status !== "active") ?? vendor;
        poHeader.vendor_id = inactiveVendor.vendor_id;
        pushTruth(
          buildTruthRow(
            "TS-071",
            "po",
            poNo,
            "vendor_id",
            `vendor_id=${inactiveVendor.vendor_id}`,
            "PO created on inactive vendor"
          )
        );
      }

      poHeaderWriter.write(poHeader);
      count("po_header.csv");
      poTotals.set(poNo, 0);
      poQty.set(poNo, 0);

      const poWorkflow: WorkflowLogRow = {
        workflow_id: `POW-${poCounter.toString().padStart(6, "0")}`,
        entity_id: poNo,
        action: "approve",
        actor_id: pickOne(rng, roleUsers).user_id,
        action_date: toIsoDate(addDays(poDate, 1)),
        status: "approved"
      };
      poWorkflowWriter.write(poWorkflow);
      count("po_workflow_log.csv");

      const quotationRow: QuotationRow = {
        quotation_id: `QT-${poCounter.toString().padStart(6, "0")}`,
        vendor_id: vendor.vendor_id,
        item_code: itemCode,
        quoted_rate: unitPrice - randomInt(rng, 1, 15),
        created_ip: faker.internet.ip(),
        created_timestamp: new Date().toISOString()
      };
      quotationWriter.write(quotationRow);
      count("quotation_table.csv");

      if (chance(rng, anomalyConfig.po_rate_gt_quote ?? 0)) {
        pushTruth(
          buildTruthRow(
            "TS-063",
            "po",
            poNo,
            "unit_price",
            `unit_price=${unitPrice} > quoted_rate=${quotationRow.quoted_rate}`,
            "PO rate higher than approved quotation"
          )
        );
      }

      if (chance(rng, anomalyConfig.po_split_bypass ?? 0)) {
        pushTruth(
          buildTruthRow(
            "TS-064",
            "po",
            poNo,
            "total_amount",
            "Split PO below approval threshold",
            "PO split to bypass approval limit"
          )
        );
      }

      const poChange: PoChangeLogRow = {
        change_id: `PC-${poCounter.toString().padStart(6, "0")}`,
        po_no: poNo,
        change_date: toIsoDate(addDays(poDate, 2)),
        change_note: "Initial issue"
      };
      poChangeWriter.write(poChange);
      count("po_change_log.csv");

      for (let l = 0; l < linesPerPo; l += 1) {
        const poLineId = `POL-${poCounter.toString().padStart(6, "0")}-${l + 1}`;
        const poQuantity = quantity;
        const poLineAmount = poQuantity * unitPrice;
        poLineWriter.write({
          po_line_id: poLineId,
          po_no: poNo,
          item_code: itemCode,
          quantity: poQuantity,
          unit_price: unitPrice,
          line_amount: poLineAmount
        });
        count("po_line.csv");
        poTotals.set(poNo, (poTotals.get(poNo) ?? 0) + poLineAmount);
        poQty.set(poNo, (poQty.get(poNo) ?? 0) + poQuantity);
      }

      grnCounter += 1;
      const grnNo = `GRN-${grnCounter.toString().padStart(6, "0")}`;
      let dcNo = `DC-${grnCounter.toString().padStart(6, "0")}`;
      let dcDate = addDays(poDate, randomInt(rng, 1, 3));
      let postingDate = addDays(dcDate, randomInt(rng, 0, 2));

      let grnPoRef: string | null = poNo;
      if (chance(rng, anomalyConfig.grn_without_po ?? 0)) {
        grnPoRef = "";
        pushTruth(
          buildTruthRow(
            "TS-081",
            "grn",
            grnNo,
            "po_no",
            "po_no missing",
            "GRN without PO reference"
          )
        );
      }

      if (chance(rng, anomalyConfig.grn_backdated ?? 0)) {
        postingDate = addDays(dcDate, randomInt(rng, 10, 20));
        pushTruth(
          buildTruthRow(
            "TS-085",
            "grn",
            grnNo,
            "posting_date",
            `posting_date=${toIsoDate(postingDate)} > dc_date=${toIsoDate(dcDate)}`,
            "Backdated GRN posting"
          )
        );
      }

      if (chance(rng, anomalyConfig.grn_duplicate_dc ?? 0) && dcNumbers.length > 0) {
        dcNo = pickOne(rng, dcNumbers);
        pushTruth(
          buildTruthRow(
            "TS-088",
            "grn",
            grnNo,
            "dc_no",
            `dc_no=${dcNo}`,
            "Duplicate DC number"
          )
        );
      }
      dcNumbers.push(dcNo);

      if (chance(rng, anomalyConfig.po_after_grn ?? 0)) {
        dcDate = addDays(poDate, -randomInt(rng, 1, 3));
        postingDate = addDays(dcDate, randomInt(rng, 0, 2));
        pushTruth(
          buildTruthRow(
            "TS-062",
            "po",
            poNo,
            "po_date",
            "PO date after GRN date",
            "PO created after GRN"
          )
        );
      }

      const grnHeader: GrnHeaderRow = {
        grn_no: grnNo,
        po_no: grnPoRef,
        vendor_id: vendor.vendor_id,
        dc_no: dcNo,
        dc_date: toIsoDate(dcDate),
        posting_date: toIsoDate(postingDate)
      };
      grnHeaderWriter.write(grnHeader);
      count("grn_header.csv");

      const grnQuantity = chance(rng, anomalyConfig.grn_qty_gt_po ?? 0)
        ? (poQty.get(poNo) ?? quantity) + randomInt(rng, 1, 5)
        : poQty.get(poNo) ?? quantity;

      if (grnQuantity > (poQty.get(poNo) ?? 0)) {
        pushTruth(
          buildTruthRow(
            "TS-082",
            "grn",
            grnNo,
            "quantity",
            `grn_qty=${grnQuantity}`,
            "GRN quantity exceeds PO quantity"
          )
        );
      }

      grnLineWriter.write({
        grn_line_id: `GRNL-${grnCounter.toString().padStart(6, "0")}-1`,
        grn_no: grnNo,
        item_code: itemCode,
        quantity: grnQuantity
      });
      count("grn_line.csv");
      grnQty.set(grnNo, grnQuantity);

      invoiceCounter += 1;
      let invoiceNo = `INV-${invoiceCounter.toString().padStart(6, "0")}`;
      let invoicePo = poNo;
      let invoiceGrn = grnNo;
      if (chance(rng, anomalyConfig.invoice_without_po ?? 0)) {
        invoicePo = "";
        pushTruth(
          buildTruthRow(
            "TS-116",
            "invoice",
            invoiceNo,
            "po_no",
            "po_no missing",
            "Invoice posted without PO"
          )
        );
      }
      if (chance(rng, anomalyConfig.invoice_without_grn ?? 0)) {
        invoiceGrn = "";
        pushTruth(
          buildTruthRow(
            "TS-117",
            "invoice",
            invoiceNo,
            "grn_no",
            "grn_no missing",
            "Invoice posted without GRN"
          )
        );
      }

      let invoiceAmount = poTotals.get(poNo) ?? lineAmount;
      if (chance(rng, anomalyConfig.invoice_amount_gt_po ?? 0)) {
        invoiceAmount += randomInt(rng, 50, 150);
        pushTruth(
          buildTruthRow(
            "TS-120",
            "invoice",
            invoiceNo,
            "total_amount",
            `invoice_total=${invoiceAmount}`,
            "Invoice amount exceeds PO amount"
          )
        );
      }

      const invoiceKey = `${vendor.vendor_id}-${invoiceNo}-${invoiceAmount}`;
      if (chance(rng, anomalyConfig.invoice_duplicate ?? 0) && duplicateInvoiceKeys.size > 0) {
        const duplicate = pickOne(rng, Array.from(duplicateInvoiceKeys.values()));
        invoiceNo = duplicate.invoice_no;
        invoiceAmount = duplicate.total_amount;
        pushTruth(
          buildTruthRow(
            "TS-118",
            "invoice",
            invoiceNo,
            "invoice_no,total_amount",
            `duplicate invoice ${duplicate.invoice_no}`,
            "Exact duplicate invoice"
          )
        );
      } else {
        duplicateInvoiceKeys.set(invoiceKey, {
          invoice_no: invoiceNo,
          vendor_id: vendor.vendor_id,
          po_no: invoicePo,
          grn_no: invoiceGrn,
          invoice_date: toIsoDate(addDays(postingDate, randomInt(rng, 1, 4))),
          total_amount: invoiceAmount
        });
      }

      const invoiceDate = toIsoDate(addDays(postingDate, randomInt(rng, 1, 4)));
      const invoiceHeader: InvoiceHeaderRow = {
        invoice_no: invoiceNo,
        vendor_id: vendor.vendor_id,
        po_no: invoicePo,
        grn_no: invoiceGrn,
        invoice_date: invoiceDate,
        total_amount: invoiceAmount
      };
      invoiceHeaderWriter.write(invoiceHeader);
      count("invoice_header.csv");
      invoiceTotals.set(invoiceNo, invoiceAmount);

      const invoiceLineQty = chance(rng, anomalyConfig.invoice_qty_gt_grn ?? 0)
        ? (grnQty.get(grnNo) ?? quantity) + randomInt(rng, 1, 5)
        : grnQty.get(grnNo) ?? quantity;
      if (invoiceLineQty > (grnQty.get(grnNo) ?? 0)) {
        pushTruth(
          buildTruthRow(
            "TS-121",
            "invoice",
            invoiceNo,
            "quantity",
            `invoice_qty=${invoiceLineQty}`,
            "Invoice quantity exceeds GRN quantity"
          )
        );
      }

      invoiceLineWriter.write({
        invoice_line_id: `INVL-${invoiceCounter.toString().padStart(6, "0")}-1`,
        invoice_no: invoiceNo,
        item_code: itemCode,
        quantity: invoiceLineQty,
        unit_price: unitPrice,
        line_amount: invoiceLineQty * unitPrice
      });
      count("invoice_line.csv");
      invoiceQty.set(invoiceNo, invoiceLineQty);

      paymentCounter += 1;
      const paymentId = `PAY-${paymentCounter.toString().padStart(6, "0")}`;
      const paymentDate = addDays(new Date(invoiceDate), randomInt(rng, 1, 5));
      let paymentInvoice = invoiceNo;
      if (chance(rng, anomalyConfig.payment_without_invoice ?? 0)) {
        paymentInvoice = "";
        pushTruth(
          buildTruthRow(
            "TS-136",
            "payment",
            paymentId,
            "invoice_no",
            "invoice_no missing",
            "Payment without invoice"
          )
        );
      }

      let paymentAmount = invoiceAmount;
      let paymentRef = `PAYREF-${paymentCounter.toString().padStart(6, "0")}`;
      if (chance(rng, anomalyConfig.payment_duplicate ?? 0) && duplicatePaymentKeys.size > 0) {
        const duplicate = pickOne(rng, Array.from(duplicatePaymentKeys.values()));
        paymentAmount = duplicate.amount;
        paymentRef = duplicate.payment_ref;
        pushTruth(
          buildTruthRow(
            "TS-137",
            "payment",
            paymentId,
            "amount,payment_ref",
            `duplicate payment ${duplicate.payment_ref}`,
            "Duplicate payment"
          )
        );
      }

      const creator = pickOne(rng, roleUsers);
      let approver = pickOne(rng, roleUsers);
      if (chance(rng, anomalyConfig.payment_self_approved ?? 0)) {
        approver = creator;
        pushTruth(
          buildTruthRow(
            "TS-150",
            "payment",
            paymentId,
            "approved_by",
            `approved_by=${approver.user_id}`,
            "Payment approved by its own creator"
          )
        );
      }

      if (chance(rng, anomalyConfig.payment_to_inactive_vendor ?? 0)) {
        const inactiveVendor = vendors.find((item) => item.status !== "active") ?? vendor;
        pushTruth(
          buildTruthRow(
            "TS-142",
            "payment",
            paymentId,
            "vendor_id",
            `vendor_id=${inactiveVendor.vendor_id}`,
            "Payment to blocked/inactive vendor"
          )
        );
      }

      const bankChange = vendorBankChange.get(vendor.vendor_id);
      if (bankChange && chance(rng, anomalyConfig.payment_near_bank_change ?? 0)) {
        const bankDate = new Date(bankChange.change_date);
        const nearDate = addDays(bankDate, randomInt(rng, 0, 2));
        pushTruth(
          buildTruthRow(
            "TS-139",
            "payment",
            paymentId,
            "payment_date",
            `payment_date=${toIsoDate(nearDate)}`,
            "Payment within X days of bank change"
          )
        );
      }

      const paymentRow: PaymentLedgerRow = {
        payment_id: paymentId,
        invoice_no: paymentInvoice,
        vendor_id: vendor.vendor_id,
        payment_date: toIsoDate(paymentDate),
        amount: paymentAmount,
        payment_ref: paymentRef,
        created_by: creator.user_id,
        approved_by: approver.user_id
      };
      paymentWriter.write(paymentRow);
      count("payment_ledger.csv");
      duplicatePaymentKeys.set(`${vendor.vendor_id}-${paymentAmount}-${paymentRef}`, paymentRow);

      const paymentWorkflow: WorkflowLogRow = {
        workflow_id: `PAYW-${paymentCounter.toString().padStart(6, "0")}`,
        entity_id: paymentId,
        action: "approve",
        actor_id: approver.user_id,
        action_date: toIsoDate(addDays(paymentDate, 1)),
        status: "approved"
      };
      paymentWorkflowWriter.write(paymentWorkflow);
      count("payment_workflow_log.csv");
    }
  }

  await Promise.all([
    vendorWriter.close(),
    prHeaderWriter.close(),
    prLineWriter.close(),
    poHeaderWriter.close(),
    poLineWriter.close(),
    grnHeaderWriter.close(),
    grnLineWriter.close(),
    invoiceHeaderWriter.close(),
    invoiceLineWriter.close(),
    paymentWriter.close(),
    roleWriter.close(),
    prWorkflowWriter.close(),
    poWorkflowWriter.close(),
    paymentWorkflowWriter.close(),
    quotationWriter.close(),
    contractWriter.close(),
    vendorBankWriter.close(),
    poChangeWriter.close(),
    truthWriter.close()
  ]);

  const manifest = {
    seed: validated.seed,
    pack: validated.pack,
    rows: totalRows,
    vendors: vendorCount,
    countsByFile,
    anomalyConfig,
    policyConfig: packConfig.policyConfig,
    expectedExceptionsByTS: truthEntries.reduce<Record<string, number>>((acc, row) => {
      acc[row.test_step_id] = (acc[row.test_step_id] ?? 0) + 1;
      return acc;
    }, {})
  };
  await fs.promises.writeFile(path.join(outputPath, "manifest.json"), JSON.stringify(manifest, null, 2));

  return {
    runId,
    outputPath,
    countsByFile,
    truthCount: truthEntries.length
  };
};
