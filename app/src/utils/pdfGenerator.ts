/**
 * Utility functions for generating and downloading PDF files
 */

export const generatePDF = (htmlContent: string, filename: string) => {
  // Create a temporary iframe to render the content
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  // Write the HTML content to the iframe
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${filename}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
          }
          .document {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #003366;
            padding-bottom: 20px;
          }
          .header-title {
            font-size: 24px;
            font-weight: bold;
            color: #003366;
            margin-bottom: 10px;
          }
          .header-subtitle {
            color: #666;
            font-size: 14px;
          }
          .section {
            margin: 20px 0;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #003366;
            margin: 20px 0 10px 0;
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 20px 0;
          }
          .stat-box {
            text-align: center;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: #f9f9f9;
          }
          .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #003366;
            margin: 5px 0;
          }
          .stat-label {
            color: #666;
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th {
            background: #f0f0f0;
            padding: 12px;
            text-align: left;
            border: 1px solid #ddd;
            font-weight: bold;
            font-size: 13px;
            color: #333;
          }
          td {
            padding: 10px 12px;
            border: 1px solid #ddd;
            font-size: 13px;
          }
          tr:nth-child(even) {
            background: #fafafa;
          }
          tr:hover {
            background: #f5f5f5;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 11px;
            text-align: center;
          }
          .logo {
            font-weight: bold;
            color: #003366;
          }
          .page-break {
            page-break-after: always;
          }
          @media print {
            body {
              background: white;
            }
            .document {
              padding: 0;
              max-width: 100%;
            }
            * {
              box-shadow: none !important;
              text-shadow: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="document">
          ${htmlContent}
        </div>
      </body>
      </html>
    `);
    iframeDoc.close();

    // Wait for content to load then trigger print
    setTimeout(() => {
      iframe.contentWindow?.print();
      
      // Remove iframe after a delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  }
};

export const downloadPDF = (htmlContent: string, filename: string) => {
  // This function opens a print dialog where user can save as PDF
  const printWindow = window.open('', '', 'height=600,width=800');
  
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${filename}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
          }
          .document {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #003366;
            padding-bottom: 20px;
          }
          .header-title {
            font-size: 24px;
            font-weight: bold;
            color: #003366;
            margin-bottom: 10px;
          }
          .header-subtitle {
            color: #666;
            font-size: 14px;
          }
          .section {
            margin: 20px 0;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #003366;
            margin: 20px 0 10px 0;
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 20px 0;
          }
          .stat-box {
            text-align: center;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: #f9f9f9;
          }
          .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #003366;
            margin: 5px 0;
          }
          .stat-label {
            color: #666;
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th {
            background: #f0f0f0;
            padding: 12px;
            text-align: left;
            border: 1px solid #ddd;
            font-weight: bold;
            font-size: 13px;
            color: #333;
          }
          td {
            padding: 10px 12px;
            border: 1px solid #ddd;
            font-size: 13px;
          }
          tr:nth-child(even) {
            background: #fafafa;
          }
          tr:hover {
            background: #f5f5f5;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 11px;
            text-align: center;
          }
          .logo {
            font-weight: bold;
            color: #003366;
          }
          @media print {
            body {
              background: white;
            }
            .document {
              padding: 0;
              max-width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="document">
          ${htmlContent}
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Auto-trigger print dialog
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};
