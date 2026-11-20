/**
 * Settlement ledger maths (SPEC 8.7, SHOP-08). Money is integer paise.
 * The commission rate is set by the business, so it defaults to zero until an
 * admin config supplies it; deductions come from returns and held disputes.
 */

export interface LedgerEntry {
  orderId: string;
  shopId: string;
  createdAt: string;
  /** Value of kept items that belongs to the shop. */
  grossPaise: number;
  /** Value returned to the buyer and taken back from the shop. */
  returnedPaise: number;
  /** Amount held while a dispute is open. */
  heldPaise: number;
  /** Whether finance has closed the order. */
  settled: boolean;
}

export interface SettlementLine extends LedgerEntry {
  commissionPaise: number;
  deductionsPaise: number;
  netPaise: number;
  payoutDate: string;
}

export interface SettlementReport {
  shopId: string;
  from: string;
  to: string;
  lines: SettlementLine[];
  salesPaise: number;
  returnsPaise: number;
  deductionsPaise: number;
  netPaise: number;
  payoutDate: string;
  /** Weekly cycle by default (SPEC 8.7). */
  cycle: 'weekly';
}

function afterDays(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * 86_400_000).toISOString();
}

/** Builds one report for a shop from its ledger entries. */
export function buildSettlementReport(
  entries: readonly LedgerEntry[],
  options: {
    shopId: string;
    from: string;
    to: string;
    commissionBps?: number;
    payoutInDays?: number;
  },
): SettlementReport {
  const commissionBps = options.commissionBps ?? 0;
  const lines = entries
    .filter((entry) => entry.shopId === options.shopId)
    .filter((entry) => Date.parse(entry.createdAt) >= Date.parse(options.from))
    .filter((entry) => Date.parse(entry.createdAt) <= Date.parse(options.to))
    .map((entry) => {
      const commissionPaise = Math.round((entry.grossPaise * commissionBps) / 10_000);
      const deductionsPaise = entry.returnedPaise + entry.heldPaise + commissionPaise;
      return {
        ...entry,
        commissionPaise,
        deductionsPaise,
        netPaise: Math.max(0, entry.grossPaise - deductionsPaise),
        payoutDate: afterDays(options.to, options.payoutInDays ?? 7),
      };
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.orderId.localeCompare(b.orderId));

  return {
    shopId: options.shopId,
    from: options.from,
    to: options.to,
    lines,
    salesPaise: lines.reduce((sum, line) => sum + line.grossPaise, 0),
    returnsPaise: lines.reduce((sum, line) => sum + line.returnedPaise, 0),
    deductionsPaise: lines.reduce((sum, line) => sum + line.deductionsPaise, 0),
    netPaise: lines.reduce((sum, line) => sum + line.netPaise, 0),
    payoutDate: afterDays(options.to, options.payoutInDays ?? 7),
    cycle: 'weekly',
  };
}

/** CSV export. Rows use ISO dates and integer paise so finance can reconcile. */
export function settlementCsv(report: SettlementReport): string {
  const header = [
    'order_id',
    'created_at',
    'gross_paise',
    'returned_paise',
    'held_paise',
    'commission_paise',
    'deductions_paise',
    'net_paise',
    'payout_date',
  ];
  const rows = report.lines.map((line) =>
    [
      line.orderId,
      line.createdAt,
      line.grossPaise,
      line.returnedPaise,
      line.heldPaise,
      line.commissionPaise,
      line.deductionsPaise,
      line.netPaise,
      line.payoutDate,
    ].join(','),
  );
  return [header.join(','), ...rows].join('\n');
}
