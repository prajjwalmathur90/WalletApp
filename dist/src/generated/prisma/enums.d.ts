export declare const TransactionStatus: {
    readonly PENDING: 'PENDING';
    readonly DEBITED: 'DEBITED';
    readonly CREDITED: 'CREDITED';
    readonly FAILED: 'FAILED';
};
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];
export declare const LedgerType: {
    readonly DEBIT: 'DEBIT';
    readonly CREDIT: 'CREDIT';
};
export type LedgerType = (typeof LedgerType)[keyof typeof LedgerType];
//# sourceMappingURL=enums.d.ts.map