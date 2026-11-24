#!/usr/bin/env python3
import os
import subprocess
import cairo

# A4 dimensions in points
WIDTH = 595.28
HEIGHT = 841.89

pdf_path = "/home/amar/Desktop/siddeshwar erp/Invoice_Siddeshwar_Enterprises_50000.pdf"
artifact_pdf = "/home/amar/.gemini/antigravity/brain/c78e2b00-c258-4123-9054-e39e0bb992c5/Invoice_Siddeshwar_Enterprises_50000.pdf"
preview_png = "/home/amar/.gemini/antigravity/brain/c78e2b00-c258-4123-9054-e39e0bb992c5/invoice_preview.png"

surface = cairo.PDFSurface(pdf_path, WIDTH, HEIGHT)
cr = cairo.Context(surface)

# Helper functions
def set_color(r, g, b):
    cr.set_source_rgb(r / 255.0, g / 255.0, b / 255.0)

def draw_round_rect(x, y, w, h, r):
    cr.new_sub_path()
    cr.arc(x + w - r, y + r, r, -1.5707963, 0)
    cr.arc(x + w - r, y + h - r, r, 0, 1.5707963)
    cr.arc(x + r, y + h - r, r, 1.5707963, 3.1415926)
    cr.arc(x + r, y + r, r, 3.1415926, 4.712389)
    cr.close_path()

# Background white
set_color(255, 255, 255)
cr.rectangle(0, 0, WIDTH, HEIGHT)
cr.fill()

# Top Navy Accent Bar
set_color(30, 58, 138) # #1e3a8a
cr.rectangle(0, 0, WIDTH, 6)
cr.fill()

# --- HEADER SECTION ---
margin_x = 36.0
y = 36.0

# Brand on Left
cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
cr.set_font_size(17)
set_color(30, 58, 138)
cr.move_to(margin_x, y)
cr.show_text("ZORVAK STUDIOS LLP")

cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
cr.set_font_size(8)
set_color(100, 116, 139)
cr.move_to(margin_x, y + 13)
cr.show_text("SOFTWARE, CLOUD & ENTERPRISE SOLUTIONS")

cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL)
cr.set_font_size(8.2)
set_color(71, 85, 105)
cr.move_to(margin_x, y + 25)
cr.show_text("GSTIN: 29AAEFZ5398N1Z1  •  Email: zorvakstudios@gmail.com")
cr.move_to(margin_x, y + 36)
cr.show_text("Phone: +91 82172 83632  •  Karnataka, India")

# Invoice Label on Right
cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
cr.set_font_size(22)
set_color(15, 23, 42)
cr.move_to(WIDTH - margin_x - 110, y)
cr.show_text("INVOICE")

# Invoice Details Table Right
details = [
    ("Invoice No:", "INV-2026-SE01"),
    ("Invoice Date:", "22 Nov 2026"),
    ("Payment Due:", "Upon Receipt"),
]
y_det = y + 13
for label, val in details:
    cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    cr.set_font_size(8)
    set_color(100, 116, 139)
    cr.move_to(WIDTH - margin_x - 145, y_det)
    cr.show_text(label)

    cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    set_color(15, 23, 42)
    cr.move_to(WIDTH - margin_x - 70, y_det)
    cr.show_text(val)
    y_det += 11.5

# Status Badge neatly placed
draw_round_rect(WIDTH - margin_x - 145, y_det - 1, 140, 14, 3)
set_color(254, 243, 199) # yellow-100
cr.fill()
draw_round_rect(WIDTH - margin_x - 145, y_det - 1, 140, 14, 3)
set_color(253, 230, 138) # yellow-200 border
cr.set_line_width(0.8)
cr.stroke()

cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
cr.set_font_size(7.5)
set_color(146, 64, 14) # yellow-800
cr.move_to(WIDTH - margin_x - 128, y_det + 9)
cr.show_text("STATUS: PAYMENT PENDING")

# Divider
y = 92.0
set_color(226, 232, 240)
cr.set_line_width(0.8)
cr.move_to(margin_x, y)
cr.line_to(WIDTH - margin_x, y)
cr.stroke()

# --- CLIENT & PROJECT BOX ---
y = 100.0
box_w = WIDTH - (margin_x * 2)
box_h = 72.0
draw_round_rect(margin_x, y, box_w, box_h, 6)
set_color(248, 250, 252) # slate-50
cr.fill()
draw_round_rect(margin_x, y, box_w, box_h, 6)
set_color(203, 213, 225) # border slate-300
cr.set_line_width(0.8)
cr.stroke()

# Left Column: Client Details
cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
cr.set_font_size(7.5)
set_color(100, 116, 139)
cr.move_to(margin_x + 12, y + 14)
cr.show_text("BILLED TO (CLIENT):")

cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
cr.set_font_size(12)
set_color(30, 58, 138)
cr.move_to(margin_x + 12, y + 28)
cr.show_text("M/S SIDDESHWAR ENTERPRISES")

cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL)
cr.set_font_size(8.2)
set_color(51, 65, 85)
cr.move_to(margin_x + 12, y + 41)
cr.show_text("Proprietor: Pushpa Patil & Management Team")
cr.move_to(margin_x + 12, y + 52)
cr.show_text("Address: Central Depot, Vijayapura, Karnataka - 586101")
cr.move_to(margin_x + 12, y + 63)
cr.show_text("Sector: B2B FMCG & Rural Kirana Wholesale Distribution")

# Vertical divider in box
set_color(226, 232, 240)
cr.move_to(margin_x + 280, y + 8)
cr.line_to(margin_x + 280, y + box_h - 8)
cr.stroke()

# Right Column: Project Scope
cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
cr.set_font_size(7.5)
set_color(100, 116, 139)
cr.move_to(margin_x + 292, y + 14)
cr.show_text("PROJECT SCOPE:")

cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
cr.set_font_size(9.5)
set_color(15, 23, 42)
cr.move_to(margin_x + 292, y + 27)
cr.show_text("B2B Kirana Telecaller CRM & Cloud System")

cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL)
cr.set_font_size(8.2)
set_color(71, 85, 105)
cr.move_to(margin_x + 292, y + 41)
cr.show_text("• Complete telecaller calling interface & daily orders pad")
cr.move_to(margin_x + 292, y + 52)
cr.show_text("• 14 village delivery routes & real-time duty punch-in tracking")
cr.move_to(margin_x + 292, y + 63)
cr.show_text("• Scraped & migrated 2,254 Kirana stores & 254 active SKUs")

# --- DELIVERABLES TABLE ---
y = 182.0
table_w = box_w
col_x = [margin_x, margin_x + 24, margin_x + 320, margin_x + 390, margin_x + 450, margin_x + table_w]

# Table Header
draw_round_rect(margin_x, y, table_w, 20, 3)
set_color(30, 58, 138)
cr.fill()

cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
cr.set_font_size(8)
set_color(255, 255, 255)
cr.move_to(col_x[0] + 6, y + 13)
cr.show_text("#")
cr.move_to(col_x[1] + 8, y + 13)
cr.show_text("DELIVERABLES & DESCRIPTION")
cr.move_to(col_x[2] + 8, y + 13)
cr.show_text("UNITS")
cr.move_to(col_x[3] + 8, y + 13)
cr.show_text("RATE (₹)")
cr.move_to(col_x[4] + 8, y + 13)
cr.show_text("AMOUNT (₹)")

y += 20.0

items = [
    (
        "1",
        "Telecaller CRM Portal & Daily Route Sheet System",
        "Custom B2B Kirana telecalling interface with Beat Day, Route & Village run-sheets (14 master routes: Bijapur, Indi, Sindagi, Basavan Bagewadi), active duty live timer (hh:mm:ss), call logging, daily orders KPI metrics, and dynamic user avatar profile.",
        "1 Module",
        "18,000.00",
        "18,000.00"
    ),
    (
        "2",
        "Legacy Database Extraction & PostgreSQL Cloud Ingestion",
        "Complete automated scraping, data hygiene, schema translation, and zero-collision migration of 2,254 kirana stores, 2,170 route addresses, 254 active products/variants, 487 historical orders (1,242 line items), and 109 calling logs into Railway PostgreSQL.",
        "1 System",
        "15,000.00",
        "15,000.00"
    ),
    (
        "3",
        "Wholesale Product Catalog & Incentive Scheme Engine",
        "10-product interactive incentive card grid with target achievement tracking, monthly target gap calculator (unreached targets & pending bonuses), and quick-access order creation pads.",
        "1 Engine",
        "8,000.00",
        "8,000.00"
    ),
    (
        "4",
        "Cloud Deployment, DB Pooling & Security Hardening",
        "Production deployment on Railway cloud PostgreSQL, connection pooling setup, CORS origin hardening, JWT authentication, and multi-device responsive hamburger layout (desktop & mobile telecaller ready).",
        "1 Setup",
        "9,000.00",
        "9,000.00"
    )
]

for idx, (num, title, desc, unit, rate, amt) in enumerate(items):
    # Calculate row height
    row_h = 56.0 if len(desc) > 150 else 46.0
    
    # Alternating row background
    if idx % 2 == 1:
        set_color(248, 250, 252)
        cr.rectangle(margin_x, y, table_w, row_h)
        cr.fill()
        
    # Bottom border
    set_color(226, 232, 240)
    cr.set_line_width(0.6)
    cr.move_to(margin_x, y + row_h)
    cr.line_to(margin_x + table_w, y + row_h)
    cr.stroke()

    # Column: #
    cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    cr.set_font_size(8.5)
    set_color(15, 23, 42)
    cr.move_to(col_x[0] + 8, y + 16)
    cr.show_text(num)

    # Column: Title & Description
    cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    cr.set_font_size(9)
    set_color(15, 23, 42)
    cr.move_to(col_x[1] + 8, y + 16)
    cr.show_text(title)

    # Wrap description in 2-3 lines
    cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL)
    cr.set_font_size(7.6)
    set_color(100, 116, 139)
    
    words = desc.split(" ")
    lines = []
    curr = []
    for w in words:
        curr.append(w)
        if len(" ".join(curr)) > 62:
            lines.append(" ".join(curr))
            curr = []
    if curr:
        lines.append(" ".join(curr))
        
    for l_idx, line in enumerate(lines[:3]):
        cr.move_to(col_x[1] + 8, y + 27 + (l_idx * 10))
        cr.show_text(line)

    # Column: Unit
    cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL)
    cr.set_font_size(8.2)
    set_color(51, 65, 85)
    cr.move_to(col_x[2] + 8, y + 16)
    cr.show_text(unit)

    # Column: Rate
    cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL)
    cr.set_font_size(8.2)
    cr.move_to(col_x[3] + 8, y + 16)
    cr.show_text(rate)

    # Column: Amount
    cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    cr.set_font_size(8.5)
    set_color(15, 23, 42)
    cr.move_to(col_x[4] + 8, y + 16)
    cr.show_text(amt)

    y += row_h

# Outer border for table
draw_round_rect(margin_x, 176.0, table_w, y - 176.0, 3)
set_color(203, 213, 225)
cr.set_line_width(0.8)
cr.stroke()

# --- SUMMARY & PAYMENT SECTION ---
y += 14.0

# Left: Total in Words & Bank Details
left_w = 300.0

# Words box
draw_round_rect(margin_x, y, left_w, 36, 4)
set_color(239, 246, 255) # blue-50
cr.fill()
draw_round_rect(margin_x, y, left_w, 36, 4)
set_color(191, 219, 254) # blue-200 border
cr.set_line_width(0.8)
cr.stroke()

cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
cr.set_font_size(7.5)
set_color(30, 58, 138)
cr.move_to(margin_x + 10, y + 14)
cr.show_text("TOTAL AMOUNT IN WORDS:")

cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
cr.set_font_size(9.5)
set_color(15, 23, 42)
cr.move_to(margin_x + 10, y + 27)
cr.show_text("FIFTY THOUSAND INDIAN RUPEES ONLY")

# Bank details box
bank_y = y + 44.0
draw_round_rect(margin_x, bank_y, left_w, 96, 5)
set_color(255, 255, 255)
cr.fill()
draw_round_rect(margin_x, bank_y, left_w, 96, 5)
set_color(226, 232, 240)
cr.set_line_width(0.8)
cr.stroke()

cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
cr.set_font_size(8)
set_color(30, 58, 138)
cr.move_to(margin_x + 10, bank_y + 14)
cr.show_text("BANK TRANSFER & UPI PAYMENT DETAILS")

# Underline header
set_color(241, 245, 249)
cr.rectangle(margin_x + 10, bank_y + 18, left_w - 20, 1)
cr.fill()

bank_rows = [
    ("Bank Name:", "Canara Bank"),
    ("Account Name:", "Zorvak studios LLP"),
    ("Account Number:", "120041532340"),
    ("IFSC Code:", "CNRB0000547"),
    ("GSTIN:", "29AAEFZ5398N1Z1"),
    ("UPI ID:", "8217283632@upi"),
]
b_curr_y = bank_y + 28
for b_label, b_val in bank_rows:
    cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    cr.set_font_size(7.8)
    set_color(100, 116, 139)
    cr.move_to(margin_x + 10, b_curr_y)
    cr.show_text(b_label)

    cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD if ("UPI" in b_label or "GST" in b_label) else cairo.FONT_WEIGHT_NORMAL)
    cr.set_font_size(7.8)
    set_color(15, 23, 42)
    cr.move_to(margin_x + 95, b_curr_y)
    cr.show_text(b_val)
    b_curr_y += 11.2

# Right: Totals Card & Signature
right_x = margin_x + left_w + 14
right_w = table_w - left_w - 14

draw_round_rect(right_x, y, right_w, 90, 5)
set_color(248, 250, 252)
cr.fill()
draw_round_rect(right_x, y, right_w, 90, 5)
set_color(203, 213, 225)
cr.set_line_width(0.8)
cr.stroke()

totals = [
    ("Subtotal:", "₹50,000.00"),
    ("Tax / Discount:", "₹0.00"),
    ("Database & Cloud Setup:", "Included (₹0.00)"),
]
t_y = y + 16
for t_lbl, t_val in totals:
    cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL)
    cr.set_font_size(8.5)
    set_color(100, 116, 139)
    cr.move_to(right_x + 12, t_y)
    cr.show_text(t_lbl)

    cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    if "Included" in t_val:
        set_color(22, 101, 52)
    else:
        set_color(15, 23, 42)
    cr.move_to(right_x + right_w - 95, t_y)
    cr.show_text(t_val)
    t_y += 15

# Total Due Banner in Navy
draw_round_rect(right_x, y + 54, right_w, 36, 4)
set_color(30, 58, 138)
cr.fill()

cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
cr.set_font_size(10)
set_color(255, 255, 255)
cr.move_to(right_x + 12, y + 76)
cr.show_text("TOTAL DUE:")

cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
cr.set_font_size(14)
set_color(250, 204, 21) # yellow-400
cr.move_to(right_x + right_w - 90, y + 76)
cr.show_text("₹50,000.00")

# Signature block
sig_y = y + 104.0
cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
cr.set_font_size(8)
set_color(15, 23, 42)
cr.move_to(right_x + 60, sig_y + 20)
cr.show_text("For Zorvak studios LLP")

set_color(203, 213, 225)
cr.set_line_width(0.8)
cr.move_to(right_x + 30, sig_y + 40)
cr.line_to(right_x + right_w - 30, sig_y + 40)
cr.stroke()

cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
cr.set_font_size(8)
set_color(30, 58, 138)
cr.move_to(right_x + 55, sig_y + 50)
cr.show_text("Authorized Signatory")

# --- TERMS & CONDITIONS (FOOTER) ---
term_y = HEIGHT - 84.0

set_color(226, 232, 240)
cr.set_line_width(0.8)
cr.move_to(margin_x, term_y)
cr.line_to(WIDTH - margin_x, term_y)
cr.stroke()

cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
cr.set_font_size(8)
set_color(30, 58, 138)
cr.move_to(margin_x, term_y + 12)
cr.show_text("TERMS & CONDITIONS:")

terms = [
    "1. Delivery includes full access to the B2B Telecaller CRM, multi-route village ordering sheets, and PostgreSQL cloud database.",
    "2. Includes 30 days of complimentary technical warranty, bug fixes, and operational onboarding support.",
    "3. Cloud maintenance, daily automated database backups, and monthly scheme management (AMC) available as a separate recurring retainer.",
]
for idx, t in enumerate(terms):
    cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL)
    cr.set_font_size(7.5)
    set_color(100, 116, 139)
    cr.move_to(margin_x, term_y + 24 + (idx * 11))
    cr.show_text(t)

surface.show_page()
surface.finish()

# Copy to artifact directory
subprocess.run(["cp", pdf_path, artifact_pdf], check=True)

# Generate high-res preview PNG for inspection
subprocess.run(["pdftoppm", "-png", "-r", "150", pdf_path, "/tmp/cairo_preview"], check=True)
if os.path.exists("/tmp/cairo_preview-1.png"):
    subprocess.run(["cp", "/tmp/cairo_preview-1.png", preview_png], check=True)

print(f"SUCCESS: Generated single-page vector PDF at {pdf_path}")
print(f"Artifact PDF at {artifact_pdf}")
print(f"Preview PNG at {preview_png}")
