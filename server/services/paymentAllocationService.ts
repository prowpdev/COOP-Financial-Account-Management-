import { db } from '../db/database';

export interface AllocationBreakdown {
  penalty_allocated: number;
  interest_allocated: number;
  fee_allocated: number;
  principal_allocated: number;
  unallocated_excess: number;
  applied_order: string[];
}

export class PaymentAllocationService {
  /**
   * Dynamically allocates an incoming payment based on the active payment_allocation_rules in database
   */
  public static allocatePayment(
    paymentAmount: number,
    dueAmounts: {
      due_penalty: number;
      due_interest: number;
      due_fee: number;
      due_principal: number;
    },
    ruleId?: string
  ): AllocationBreakdown {
    const rules = db.getTable('payment_allocation_rules');
    let activeRule = rules.find(r => ruleId ? r.id === ruleId : r.is_default && r.active);
    if (!activeRule && rules.length > 0) {
      activeRule = rules[0];
    }

    const priorities = activeRule?.priorities || [
      { priority: 1, component: 'Penalty' },
      { priority: 2, component: 'Interest' },
      { priority: 3, component: 'Fees' },
      { priority: 4, component: 'Principal' }
    ];

    // Sort by priority ascending
    const sortedPriorities = [...priorities].sort((a, b) => a.priority - b.priority);

    let remainingPayment = paymentAmount;
    let penalty_allocated = 0;
    let interest_allocated = 0;
    let fee_allocated = 0;
    let principal_allocated = 0;
    const applied_order: string[] = [];

    for (const item of sortedPriorities) {
      applied_order.push(item.component);
      if (remainingPayment <= 0) continue;

      if (item.component === 'Penalty') {
        const alloc = Math.min(remainingPayment, dueAmounts.due_penalty);
        penalty_allocated = Number(alloc.toFixed(2));
        remainingPayment = Number((remainingPayment - alloc).toFixed(2));
      } else if (item.component === 'Interest') {
        const alloc = Math.min(remainingPayment, dueAmounts.due_interest);
        interest_allocated = Number(alloc.toFixed(2));
        remainingPayment = Number((remainingPayment - alloc).toFixed(2));
      } else if (item.component === 'Fees') {
        const alloc = Math.min(remainingPayment, dueAmounts.due_fee);
        fee_allocated = Number(alloc.toFixed(2));
        remainingPayment = Number((remainingPayment - alloc).toFixed(2));
      } else if (item.component === 'Principal') {
        const alloc = Math.min(remainingPayment, dueAmounts.due_principal);
        principal_allocated = Number(alloc.toFixed(2));
        remainingPayment = Number((remainingPayment - alloc).toFixed(2));
      }
    }

    // If there is still excess money left over and principal can absorb it (e.g. advance principal payment)
    if (remainingPayment > 0) {
      principal_allocated = Number((principal_allocated + remainingPayment).toFixed(2));
      remainingPayment = 0;
    }

    return {
      penalty_allocated,
      interest_allocated,
      fee_allocated,
      principal_allocated,
      unallocated_excess: remainingPayment,
      applied_order
    };
  }
}
