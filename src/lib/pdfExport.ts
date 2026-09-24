export interface PdfReportItem {
  id: string
  title: string
  details: { label: string; value: string | number | null | undefined }[]
  status?: string
  date?: string
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function generateAndPrintPdfReport(reportTitle: string, items: PdfReportItem[]) {
  const printWindow = window.open('', '_blank', 'width=900,height=800')
  if (!printWindow) {
    alert('Sila benarkan pop-up window untuk memuat turun PDF.')
    return
  }

  const generatedDate = new Date().toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kuala_Lumpur',
  })

  const safeReportTitle = escapeHtml(reportTitle)

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ms">
    <head>
      <meta charset="UTF-8">
      <title>${safeReportTitle}</title>
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #1f2937;
          margin: 0;
          padding: 0;
          background: #ffffff;
          font-size: 13px;
          line-height: 1.5;
        }
        .header {
          border-bottom: 2.5px solid #4a0e17;
          padding-bottom: 12px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .header-brand {
          display: flex;
          flex-direction: column;
        }
        .header-institution {
          font-size: 16px;
          font-weight: 800;
          color: #4a0e17;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .header-sub {
          font-size: 13px;
          font-weight: 600;
          color: #d4af37;
          margin-top: 2px;
        }
        .header-doc-type {
          font-size: 12px;
          font-weight: 700;
          color: #6b7280;
          text-align: right;
        }
        .report-title-box {
          background: #f9fafb;
          border-left: 4px solid #4a0e17;
          padding: 12px 16px;
          margin-bottom: 24px;
          border-radius: 4px;
        }
        .report-title-box h1 {
          margin: 0;
          font-size: 18px;
          color: #111827;
        }
        .report-title-box p {
          margin: 4px 0 0;
          font-size: 12px;
          color: #6b7280;
        }
        .item-card {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          margin-bottom: 24px;
          page-break-inside: avoid;
          break-inside: avoid;
          overflow: hidden;
        }
        .item-card:not(:last-child) {
          page-break-after: always;
          break-after: page;
        }
        .item-header {
          background: #f3f4f6;
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e5e7eb;
        }
        .item-title {
          font-size: 14px;
          font-weight: 700;
          color: #4a0e17;
          margin: 0;
        }
        .status-badge {
          display: inline-block;
          padding: 3px 8px;
          font-size: 11px;
          font-weight: 700;
          border-radius: 12px;
          text-transform: uppercase;
        }
        .status-approved, .status-verified { background: #d1fae5; color: #065f46; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-rejected { background: #fee2e2; color: #991b1b; }
        .status-completed { background: #e0e7ff; color: #3730a3; }

        .details-table {
          width: 100%;
          border-collapse: collapse;
        }
        .details-table td {
          padding: 8px 14px;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: top;
        }
        .details-table tr:last-child td {
          border-bottom: none;
        }
        .label-col {
          width: 32%;
          font-weight: 600;
          color: #4b5563;
          background: #fafafa;
        }
        .value-col {
          color: #111827;
        }
        .footer {
          margin-top: 40px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
          font-size: 11px;
          color: #9ca3af;
          text-align: center;
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-brand">
          <span class="header-institution">PEJABAT BENDAHARI AGUNG KEHORMAT</span>
          <span class="header-sub">HiPER — Hab Perbendaharaan Digital PBAK JPP IPGKKB</span>
        </div>
        <div class="header-doc-type">
          <span>DOKUMEN RASMI</span><br>
          <small>${escapeHtml(generatedDate)}</small>
        </div>
      </div>

      <div class="report-title-box">
        <h1>${safeReportTitle}</h1>
        <p>Jumlah rekod: ${items.length} | Tarikh Cetakan: ${escapeHtml(generatedDate)}</p>
      </div>

      ${items
        .map((item) => {
          const safeTitle = escapeHtml(item.title)
          const safeStatus = item.status ? escapeHtml(item.status) : ''
          const statusClass = item.status ? escapeHtml(item.status.toLowerCase()) : ''

          return `
        <div class="item-card">
          <div class="item-header">
            <h2 class="item-title">${safeTitle}</h2>
            ${
              safeStatus
                ? `<span class="status-badge status-${statusClass}">${safeStatus}</span>`
                : ''
            }
          </div>
          <table class="details-table">
            <tbody>
              ${item.details
                .map(
                  (d) => `
                <tr>
                  <td class="label-col">${escapeHtml(d.label)}</td>
                  <td class="value-col">${d.value !== null && d.value !== undefined ? escapeHtml(d.value) : '—'}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `
        })
        .join('')}

      <div class="footer">
        <p>Dokumen ini dijana secara automatik oleh Sistem HiPER (Hub Perbendaharaan Digital JPP IPG Kampus Kota Bharu).</p>
        <p>Tidak memerlukan tandatangan basah. Sebarang pertanyaan sila hubungi Pejabat Bendahari Agung Kehormat.</p>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(htmlContent)
  printWindow.document.close()
}
