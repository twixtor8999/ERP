#!/usr/bin/env python3
import os
import subprocess

html_content = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Tax Invoice - Siddeshwar Enterprises</title>
<style>
  @page {
    size: A4 portrait;
    margin: 15mm 15mm 15mm 15mm;
  }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #1e293b;
    margin: 0;
    padding: 20px;
    background-color: #ffffff;
    font-size: 13px;
    line-height: 1.5;
  }
  .header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 25px;
  }
  .header-left {
    vertical-align: top;
  }
  .header-right {
    text-align: right;
    vertical-align: top;
  }
  .brand-title {
    font-size: 24px;
    font-weight: 900;
    color: #1e3a8a;
    letter-spacing: -0.5px;
    margin: 0;
  }
  .brand-subtitle {
    font-size: 11px;
    color: #64748b;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 2px;
  }
  .invoice-tag {
    font-size: 28px;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin: 0;
  }
  .meta-box {
    margin-top: 8px;
    font-size: 12px;
    color: #334155;
  }
  .meta-box strong {
    color: #0f172a;
  }
  .divider {
    height: 3px;
    background: #1e3a8a;
    margin-bottom: 20px;
    border-radius: 2px;
  }
  .billing-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 25px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }
  .billing-table td {
    padding: 14px 18px;
    vertical-align: top;
    width: 50%;
  }
  .billing-title {
    font-size: 11px;
    text-transform: uppercase;
    font-weight: 800;
    color: #64748b;
    letter-spacing: 1px;
    margin-bottom: 6px;
  }
  .client-name {
    font-size: 16px;
    font-weight: 800;
    color: #1e3a8a;
    margin-bottom: 4px;
  }
  .client-address {
    font-size: 12px;
    color: #334155;
    line-height: 1.4;
  }
  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  .items-table th {
    background-color: #1e3a8a;
    color: #ffffff;
    font-size: 11px;
    text-transform: uppercase;
    font-weight: 800;
    letter-spacing: 0.5px;
    padding: 10px 12px;
    text-align: left;
    border: 1px solid #1e3a8a;
  }
  .items-table th.text-right,
  .items-table td.text-right {
    text-align: right;
  }
  .items-table th.text-center,
  .items-table td.text-center {
    text-align: center;
  }
  .items-table td {
    padding: 10px 12px;
    border-bottom: 1px solid #e2e8f0;
    border-left: 1px solid #e2e8f0;
    border-right: 1px solid #e2e8f0;
    font-size: 12px;
    color: #1e293b;
    vertical-align: top;
  }
  .items-table tr:nth-child(even) td {
    background-color: #f8fafc;
  }
  .item-title {
    font-weight: 800;
    color: #0f172a;
    font-size: 13px;
    margin-bottom: 3px;
  }
  .item-desc {
    font-size: 11px;
    color: #64748b;
    line-height: 1.4;
  }
  .summary-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 25px;
  }
  .summary-table td {
    vertical-align: top;
  }
  .total-card {
    width: 280px;
    margin-left: auto;
    border-collapse: collapse;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
  }
  .total-card td {
    padding: 8px 14px;
    font-size: 12px;
  }
  .total-row td {
    background: #1e3a8a;
    color: #ffffff;
    font-size: 16px;
    font-weight: 900;
    padding: 12px 14px;
  }
  .badge-paid {
    display: inline-block;
    background: #fef3c7;
    color: #92400e;
    font-weight: 800;
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    border: 1px solid #fde68a;
  }
  .amount-words-box {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 20px;
    font-size: 12px;
    color: #1e3a8a;
  }
  .banking-box {
    background: #fdfdfd;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 20px;
  }
  .banking-title {
    font-size: 12px;
    font-weight: 800;
    color: #1e3a8a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
  }
  .banking-details {
    font-size: 12px;
    color: #334155;
    line-height: 1.6;
  }
  .terms-box {
    font-size: 11px;
    color: #64748b;
    border-top: 1px solid #e2e8f0;
    padding-top: 12px;
    line-height: 1.5;
  }
  .footer-sig {
    margin-top: 30px;
    text-align: right;
  }
  .sig-line {
    font-size: 12px;
    font-weight: bold;
    color: #0f172a;
    margin-top: 40px;
    border-top: 1px solid #cbd5e1;
    display: inline-block;
    padding-top: 6px;
    width: 220px;
    text-align: center;
  }
</style>
</head>
<body>

  <!-- Top Header Table -->
  <table class="header-table">
    <tr>
      <td class="header-left">
        <h1 class="brand-title">CLOUD & SOFTWARE SERVICES</h1>
        <div class="brand-subtitle">Enterprise ERP & Telecaller Solutions</div>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">
          Karnataka, India<br>
          Email: contact@solutions.dev | Contact: +91 96634 47859
        </p>
      </td>
      <td class="header-right">
        <h2 class="invoice-tag">INVOICE</h2>
        <div class="meta-box">
          <div><strong>Invoice No:</strong> INV-2026-SE01</div>
          <div><strong>Date:</strong> 22 Nov 2026</div>
          <div><strong>Payment Due:</strong> Upon Receipt</div>
          <div style="margin-top: 4px;"><span class="badge-paid">Status: Payment Pending</span></div>
        </div>
      </td>
    </tr>
  </table>

  <div class="divider"></div>

  <!-- Billed To Section -->
  <table class="billing-table">
    <tr>
      <td>
        <div class="billing-title">Billed To (Client):</div>
        <div class="client-name">M/S SIDDESHWAR ENTERPRISES</div>
        <div class="client-address">
          <strong>Proprietor:</strong> Pushpa Patil & Management Team<br>
          <strong>Address:</strong> Central Hub, Vijayapura, Karnataka - 586101<br>
          <strong>Domain:</strong> FMCG & Rural Kirana Wholesale Distribution
        </div>
      </td>
      <td>
        <div class="billing-title">Project Scope:</div>
        <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">
          B2B Kirana Telecaller CRM & Cloud Database
        </div>
        <div style="font-size: 11px; color: #475569;">
          Complete system development, real-time duty tracking, 14 village delivery beats, and legacy data migration for 2,200+ Kirana retail accounts.
        </div>
      </td>
    </tr>
  </table>

  <!-- Itemized Deliverables Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 6%;" class="text-center">#</th>
        <th style="width: 58%;">Description of Work / Deliverables</th>
        <th style="width: 12%;" class="text-center">Qty / Units</th>
        <th style="width: 12%;" class="text-right">Rate (₹)</th>
        <th style="width: 12%;" class="text-right">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="text-center"><strong>1</strong></td>
        <td>
          <div class="item-title">Telecaller CRM Portal & Daily Route Sheet System</div>
          <div class="item-desc">
            Development of custom B2B Kirana calling portal with live beat filtering (14 routes, Bijapur, Indi, Sindagi, Basavan Bagewadi), real-time duty punch-in live timer, call logging, daily orders KPI tracking, and multi-user dynamic avatar profile.
          </div>
        </td>
        <td class="text-center">1 Module</td>
        <td class="text-right">18,000.00</td>
        <td class="text-right"><strong>18,000.00</strong></td>
      </tr>
      <tr>
        <td class="text-center"><strong>2</strong></td>
        <td>
          <div class="item-title">Legacy Database Extraction & PostgreSQL Cloud Ingestion</div>
          <div class="item-desc">
            Complete data scraping, schema mapping, and zero-collision database migration of 2,254 kirana stores, 2,170 route addresses, 254 active products/variants, 487 historical orders (1,242 line items), and 109 calling logs into production Railway PostgreSQL.
          </div>
        </td>
        <td class="text-center">1 System</td>
        <td class="text-right">15,000.00</td>
        <td class="text-right"><strong>15,000.00</strong></td>
      </tr>
      <tr>
        <td class="text-center"><strong>3</strong></td>
        <td>
          <div class="item-title">Wholesale Product Catalog & Incentive Scheme Engine</div>
          <div class="item-desc">
            10-product interactive incentive card grid with target achievement tracking, monthly target gap calculator (unreached targets & pending bonuses), and quick-access order creation pads.
          </div>
        </td>
        <td class="text-center">1 Engine</td>
        <td class="text-right">8,000.00</td>
        <td class="text-right"><strong>8,000.00</strong></td>
      </tr>
      <tr>
        <td class="text-center"><strong>4</strong></td>
        <td>
          <div class="item-title">Cloud Deployment, High-Availability DB Pooling & Security</div>
          <div class="item-desc">
            Cloud hosting configuration, connection pooling setup, CORS origin hardening, JWT authentication, and multi-device responsive hamburger layout (desktop & mobile telecaller ready).
          </div>
        </td>
        <td class="text-center">1 Setup</td>
        <td class="text-right">9,000.00</td>
        <td class="text-right"><strong>9,000.00</strong></td>
      </tr>
    </tbody>
  </table>

  <!-- Summary Table -->
  <table class="summary-table">
    <tr>
      <td style="width: 55%; padding-right: 20px;">
        <div class="amount-words-box">
          <strong>Total Amount in Words:</strong><br>
          <span style="font-size: 13px; font-weight: bold; text-transform: uppercase;">Fifty Thousand Indian Rupees Only</span>
        </div>

        <div class="banking-box">
          <div class="banking-title">Bank Transfer / UPI Payment Details</div>
          <table style="width: 100%; font-size: 12px; color: #334155;">
            <tr>
              <td style="width: 35%; padding: 2px 0;"><strong>Bank Name:</strong></td>
              <td style="padding: 2px 0;">State Bank of India (SBI) / HDFC</td>
            </tr>
            <tr>
              <td style="padding: 2px 0;"><strong>Account Name:</strong></td>
              <td style="padding: 2px 0;">Technology Solutions & Services</td>
            </tr>
            <tr>
              <td style="padding: 2px 0;"><strong>Account Number:</strong></td>
              <td style="padding: 2px 0;">50100482910394</td>
            </tr>
            <tr>
              <td style="padding: 2px 0;"><strong>IFSC Code:</strong></td>
              <td style="padding: 2px 0;">SBIN0000845</td>
            </tr>
            <tr>
              <td style="padding: 2px 0;"><strong>UPI ID:</strong></td>
              <td style="padding: 2px 0;"><strong>9663447859@upi</strong></td>
            </tr>
          </table>
        </div>
      </td>

      <td style="width: 45%;">
        <table class="total-card">
          <tr>
            <td style="color: #64748b;">Subtotal</td>
            <td class="text-right" style="font-weight: bold;">₹50,000.00</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Tax / Discount</td>
            <td class="text-right" style="font-weight: bold;">₹0.00</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Cloud Database Setup</td>
            <td class="text-right" style="color: #16a34a; font-weight: bold;">Included</td>
          </tr>
          <tr class="total-row">
            <td>Total Due:</td>
            <td class="text-right">₹50,000.00</td>
          </tr>
        </table>

        <div class="footer-sig">
          <div class="sig-line">
            Authorized Signatory<br>
            <span style="font-size: 10px; color: #64748b; font-weight: normal;">Solutions & Development Lead</span>
          </div>
        </div>
      </td>
    </tr>
  </table>

  <!-- Terms & Notes -->
  <div class="terms-box">
    <strong>Terms & Notes:</strong>
    <ol style="margin: 4px 0 0 0; padding-left: 18px;">
      <li>Includes 30 days of complimentary technical warranty and bug-fix support following delivery.</li>
      <li>All customer Kirana accounts, historical balances, and master routes have been verified and seeded into Railway PostgreSQL.</li>
      <li>Monthly cloud maintenance and database backups (AMC) available as an optional recurring support package.</li>
    </ol>
  </div>

</body>
</html>
"""

temp_html = "/tmp/invoice_siddeshwar.html"
with open(temp_html, "w", encoding="utf-8") as f:
    f.write(html_content)

output_dir = "/home/amar/Desktop/siddeshwar erp"
cmd = [
    "libreoffice",
    "-env:UserInstallation=file:///tmp/libreoffice_conv",
    "--headless",
    "--convert-to", "pdf",
    temp_html,
    "--outdir", output_dir
]
subprocess.run(cmd, check=True)

# Rename to exact desired filename
generated_pdf = os.path.join(output_dir, "invoice_siddeshwar.pdf")
final_pdf = os.path.join(output_dir, "Invoice_Siddeshwar_Enterprises_50000.pdf")
if os.path.exists(generated_pdf):
    os.rename(generated_pdf, final_pdf)

# Also copy to artifact directory for easy download
artifact_dir = "/home/amar/.gemini/antigravity/brain/c78e2b00-c258-4123-9054-e39e0bb992c5"
artifact_pdf = os.path.join(artifact_dir, "Invoice_Siddeshwar_Enterprises_50000.pdf")
subprocess.run(["cp", final_pdf, artifact_pdf], check=True)

# Generate preview PNG
subprocess.run(["pdftoppm", "-png", "-r", "150", final_pdf, "/tmp/invoice_preview"], check=True)
if os.path.exists("/tmp/invoice_preview-1.png"):
    subprocess.run(["cp", "/tmp/invoice_preview-1.png", os.path.join(artifact_dir, "invoice_preview.png")], check=True)

print(f"SUCCESS: Generated PDF at {final_pdf} and artifact copy at {artifact_pdf}")

