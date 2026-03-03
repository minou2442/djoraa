const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TEMPLATE_DIR = process.env.TEMPLATE_DIR || path.join(__dirname, '../../templates');
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(__dirname, '../../storage/pdfs');

// ensure directories exist
[TEMPLATE_DIR, STORAGE_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * generates PDF from HTML template
 */
async function generatePDF(templateName, data, options = {}) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // load and render template with data
    const html = renderTemplate(templateName, data);

    await page.setContent(html, { waitUntil: 'networkidle0' });

    // set format and margins
    const pdfOptions = {
      format: 'A4',
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      printBackground: true,
      ...options
    };

    const pdfBuffer = await page.pdf(pdfOptions);
    await browser.close();

    return pdfBuffer;
  } catch (error) {
    if (browser) await browser.close();
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

/**
 * renders HTML template with data
 */
function renderTemplate(templateName, data) {
  const templatePath = path.join(TEMPLATE_DIR, `${templateName}.html`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template ${templateName} not found`);
  }

  let html = fs.readFileSync(templatePath, 'utf-8');

  // simple template variable replacement
  // for production, use a proper template engine like handlebars
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    html = html.replace(regex, data[key] || '');
  });

  return html;
}

/**
 * saves generated PDF to storage
 */
async function savePDF(templateName, data, filename, clinicId, options = {}) {
  try {
    const pdfBuffer = await generatePDF(templateName, data, options);
    const clinicDir = path.join(STORAGE_DIR, `clinic_${clinicId}`);

    if (!fs.existsSync(clinicDir)) {
      fs.mkdirSync(clinicDir, { recursive: true });
    }

    const filepath = path.join(clinicDir, filename);

    return new Promise((resolve, reject) => {
      fs.writeFile(filepath, pdfBuffer, (err) => {
        if (err) return reject(err);
        resolve({
          filename: filename,
          filepath: filepath,
          size: pdfBuffer.length,
          createdAt: new Date()
        });
      });
    });
  } catch (error) {
    throw new Error(`Failed to save PDF: ${error.message}`);
  }
}

/**
 * generates PDF and returns buffer (for immediate download)
 */
async function generatePDFBuffer(templateName, data, options = {}) {
  try {
    return await generatePDF(templateName, data, options);
  } catch (error) {
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

/**
 * creates sample prescription template
 */
function createSamplePrescriptionTemplate() {
  const template = `
<!DOCTYPE html>
<html dir="{{direction}}">
<head>
  <meta charset="UTF-8">
  <title>Prescription</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    .clinic-info { font-weight: bold; font-size: 16px; }
    .prescription-table { width: 100%; margin: 30px 0; border-collapse: collapse; }
    .prescription-table th, .prescription-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    .prescription-table th { background-color: #f5f5f5; }
    .patient-info, .doctor-info { margin: 20px 0; }
    .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 12px; }
    .qr-code { text-align: right; margin: 20px 0; }
    .signature-line { margin-top: 40px; border-top: 1px solid #333; width: 200px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="clinic-info">{{ clinic_name }}</div>
    <div>{{ clinic_address }}</div>
    <div>{{ clinic_phone }}</div>
  </div>

  <div class="patient-info">
    <strong>Patient:</strong> {{ patient_name }}<br>
    <strong>Age:</strong> {{ patient_age }}<br>
    <strong>Date:</strong> {{ date }}
  </div>

  <div class="doctor-info">
    <strong>Doctor:</strong> {{ doctor_name }}<br>
    <strong>License:</strong> {{ doctor_license }}
  </div>

  <table class="prescription-table">
    <thead>
      <tr>
        <th>Medication</th>
        <th>Dosage</th>
        <th>Frequency</th>
        <th>Duration</th>
      </tr>
    </thead>
    <tbody>
      {{ medications_rows }}
    </tbody>
  </table>

  <div class="signature-line"></div>

  <div class="footer">
    <p><strong>QR Code:</strong> {{ qr_code }}</p>
    <p>Generated on {{ generated_date }}</p>
  </div>
</body>
</html>
  `;

  const templatePath = path.join(TEMPLATE_DIR, 'prescription.html');
  fs.writeFileSync(templatePath, template);
  return template;
}

module.exports = {
  generatePDF,
  generatePDFBuffer,
  savePDF,
  renderTemplate,
  createSamplePrescriptionTemplate
};
