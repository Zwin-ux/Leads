import React, { useState } from 'react';

export const CheckRequest: React.FC = () => {
    const [request, setRequest] = useState({
        payee: '',
        amount: 0,
        memo: '',
        glCode: '',
        date: new Date().toISOString().split('T')[0]
    });

    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Check Request Voucher</title>');
            printWindow.document.write(`
                <style>
                    body { font-family: sans-serif; padding: 4rem; max-width: 800px; margin: 0 auto; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 2rem; margin-bottom: 2rem; }
                    .row { display: flex; margin-bottom: 1.5rem; }
                    .label { width: 150px; font-weight: bold; }
                    .value { flex: 1; border-bottom: 1px solid #ccc; padding-bottom: 0.25rem; }
                    .signatures { margin-top: 4rem; display: flex; justify-content: space-between; }
                    .sig-line { width: 45%; border-top: 1px solid #000; padding-top: 0.5rem; text-align: center; }
                </style>
            `);
            printWindow.document.write('</head><body>');
            printWindow.document.write(`
                <div class="header">
                    <h1>CHECK REQUEST VOUCHER</h1>
                    <h3>AmPac Business Capital</h3>
                </div>
                <div class="row">
                    <div class="label">DATE:</div>
                    <div class="value">${request.date}</div>
                </div>
                <div class="row">
                    <div class="label">PAY TO THE ORDER OF:</div>
                    <div class="value">${request.payee}</div>
                </div>
                <div class="row">
                    <div class="label">AMOUNT:</div>
                    <div class="value">$${request.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div class="row">
                    <div class="label">MEMO / PURPOSE:</div>
                    <div class="value">${request.memo}</div>
                </div>
                <div class="row">
                    <div class="label">G/L CODE:</div>
                    <div class="value">${request.glCode || '_________________'}</div>
                </div>

                <div class="signatures">
                    <div class="sig-line">Requested By</div>
                    <div class="sig-line">Approved By</div>
                </div>
            `);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 500);
        }
    };

    return (
        <div className="check-request" style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0 }}>🧾 Check Request Generator</h3>

            <div style={{ display: 'grid', gap: '1rem', maxWidth: '600px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Payee</label>
                    <input
                        value={request.payee} onChange={e => setRequest({ ...request, payee: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Amount</label>
                        <input
                            type="number"
                            value={request.amount || ''} onChange={e => setRequest({ ...request, amount: parseFloat(e.target.value) })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Date</label>
                        <input
                            type="date"
                            value={request.date} onChange={e => setRequest({ ...request, date: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Memo / Description</label>
                    <input
                        value={request.memo} onChange={e => setRequest({ ...request, memo: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>G/L Code (Optional)</label>
                    <input
                        value={request.glCode} onChange={e => setRequest({ ...request, glCode: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                </div>

                <button onClick={handlePrint} style={{ marginTop: '1rem', padding: '0.75rem', background: '#0f766e', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Generate Voucher PDF
                </button>
            </div>
        </div>
    );
};
