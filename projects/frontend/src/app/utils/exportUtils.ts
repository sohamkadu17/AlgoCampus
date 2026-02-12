/**
 * Export utilities for CSV and PDF generation
 */

interface Transaction {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  date?: string;
  splitName?: string;
}

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: any[], headers: string[]): string {
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header.toLowerCase().replace(/ /g, '')];
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(data: any[], filename: string, headers: string[]) {
  const csv = convertToCSV(data, headers);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export split transactions to CSV
 */
export function exportSplitToCSV(
  splitName: string,
  transactions: Transaction[],
  members: Array<{ address: string; name?: string }>
) {
  const headers = ['Date', 'Description', 'Amount (ALGO)', 'Paid By', 'Status'];
  
  const data = transactions.map(tx => ({
    date: tx.date || new Date().toLocaleDateString(),
    description: tx.description,
    'amount(algo)': tx.amount.toFixed(2),
    paidby: tx.paidBy,
    status: 'Settled'
  }));
  
  downloadCSV(data, `${splitName.replace(/\s/g, '_')}_transactions`, headers);
}

/**
 * Export transaction history to CSV
 */
export function exportHistoryToCSV(
  transactions: Transaction[],
  userAddress: string
) {
  const headers = ['Date', 'Split', 'Description', 'Amount (ALGO)', 'Paid By', 'Type'];
  
  const data = transactions.map(tx => ({
    date: tx.date || new Date().toLocaleDateString(),
    split: tx.splitName || 'N/A',
    description: tx.description,
    'amount(algo)': tx.amount.toFixed(2),
    paidby: tx.paidBy === userAddress ? 'You' : tx.paidBy.substring(0, 8),
    type: tx.paidBy === userAddress ? 'Paid' : 'Received'
  }));
  
  downloadCSV(data, `AlgoSplit_History_${new Date().toISOString().split('T')[0]}`, headers);
}

/**
 * Generate PDF (basic HTML to PDF conversion)
 * For production, consider using jsPDF or similar library
 */
export function generatePDFContent(
  title: string,
  splitName: string,
  transactions: Transaction[],
  totalAmount: number,
  members: Array<{ address: string; name?: string }>
): string {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 40px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #006266;
          padding-bottom: 20px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #006266;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #666;
          font-size: 14px;
        }
        .split-info {
          background: #f0f9ff;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .split-name {
          font-size: 24px;
          font-weight: bold;
          color: #006266;
          margin-bottom: 10px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background: #006266;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        tr:hover {
          background: #f9fafb;
        }
        .total-row {
          font-weight: bold;
          background: #f0f9ff;
          border-top: 2px solid #006266;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #666;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        .members-list {
          margin-top: 20px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 8px;
        }
        .member {
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .member:last-child {
          border-bottom: none;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">AlgoSplit</div>
        <div class="subtitle">Expense Split Summary Report</div>
      </div>
      
      <div class="split-info">
        <div class="split-name">${splitName}</div>
        <div class="info-row">
          <span>Total Transactions:</span>
          <strong>${transactions.length}</strong>
        </div>
        <div class="info-row">
          <span>Total Amount:</span>
          <strong>${totalAmount.toFixed(2)} ALGO</strong>
        </div>
        <div class="info-row">
          <span>Members:</span>
          <strong>${members.length}</strong>
        </div>
        <div class="info-row">
          <span>Generated:</span>
          <strong>${new Date().toLocaleString()}</strong>
        </div>
      </div>

      <h3>Transaction Details</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Paid By</th>
            <th style="text-align: right;">Amount (ALGO)</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map(tx => `
            <tr>
              <td>${tx.date || new Date().toLocaleDateString()}</td>
              <td>${tx.description}</td>
              <td>${tx.paidBy.substring(0, 8)}...${tx.paidBy.substring(tx.paidBy.length - 6)}</td>
              <td style="text-align: right;">${tx.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="3" style="text-align: right;">Total:</td>
            <td style="text-align: right;">${totalAmount.toFixed(2)} ALGO</td>
          </tr>
        </tbody>
      </table>

      <div class="members-list">
        <h4>Group Members</h4>
        ${members.map((member, index) => `
          <div class="member">
            ${index + 1}. ${member.name || member.address.substring(0, 8) + '...' + member.address.substring(member.address.length - 6)}
          </div>
        `).join('')}
      </div>

      <div class="footer">
        <p>This report was generated by AlgoSplit - Blockchain-powered expense splitting on Algorand</p>
        <p>For more information, visit algosplit.app</p>
      </div>
    </body>
    </html>
  `;
  
  return html;
}

/**
 * Export to PDF using print dialog
 */
export function exportToPDF(
  splitName: string,
  transactions: Transaction[],
  members: Array<{ address: string; name?: string }>
) {
  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const htmlContent = generatePDFContent(
    `${splitName} - Summary`,
    splitName,
    transactions,
    totalAmount,
    members
  );
  
  // Create a new window and print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Export summary as JSON (for backup/import)
 */
export function exportAsJSON(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
