import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT_DIR = '/home/amar/Desktop/siddeshwar erp/frontend/public/assets/crm'
os.makedirs(OUT_DIR, exist_ok=True)

FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FONT_REG = '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf'

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

def create_base_canvas(size=(400, 400), bg=(255, 255, 255, 0)):
    return Image.new('RGBA', size, bg)

def draw_shadow(draw, bbox, radius=15, color=(0, 0, 0, 40)):
    pass

# 1. Aramane Detergent Powder 10Rs 120Pcs
def gen_aramane():
    im = create_base_canvas()
    d = ImageDraw.Draw(im)
    
    # Shadow
    d.ellipse([90, 340, 310, 375], fill=(0, 0, 0, 35))
    
    # Detergent Pouch shape
    pouch_pts = [
        (110, 70), (290, 70), (320, 290), (305, 345),
        (95, 345), (80, 290)
    ]
    # Gradient fill for pouch (Royal Blue to Bright Cyan)
    pouch_mask = Image.new('L', (400, 400), 0)
    ImageDraw.Draw(pouch_mask).polygon(pouch_pts, fill=255)
    
    pouch_grad = Image.new('RGBA', (400, 400), (0, 0, 0, 0))
    gd = ImageDraw.Draw(pouch_grad)
    for y in range(70, 350):
        t = (y - 70) / 280.0
        r = int(14 * (1 - t) + 2 * t)
        g = int(60 * (1 - t) + 132 * t)
        b = int(160 * (1 - t) + 210 * t)
        gd.line([(70, y), (330, y)], fill=(r, g, b, 255))
    
    im.paste(pouch_grad, (0, 0), pouch_mask)
    
    # Pouch top heat-seal texture
    d = ImageDraw.Draw(im)
    for y in range(70, 95, 4):
        d.line([(108 + (y-70)*0.1, y), (292 - (y-70)*0.1, y)], fill=(255, 255, 255, 60), width=1)
    
    # Lemon / Freshness green & yellow swoosh
    d.arc([70, 160, 330, 330], start=190, end=350, fill=(34, 197, 94, 230), width=14)
    d.arc([80, 175, 320, 330], start=190, end=350, fill=(250, 204, 21, 230), width=8)
    
    # Washing machine bubbles
    bubbles = [(130, 260, 18), (155, 285, 14), (250, 265, 22), (280, 240, 16), (200, 310, 12)]
    for bx, by, br in bubbles:
        d.ellipse([bx - br, by - br, bx + br, by + br], fill=(255, 255, 255, 160), outline=(255, 255, 255, 240), width=2)
        d.ellipse([bx - br//2, by - br//2, bx - br//4, by - br//4], fill=(255, 255, 255, 220))
    
    # Main branding text: ARAMANE
    f_brand = get_font(FONT_BOLD, 32)
    f_sub = get_font(FONT_BOLD, 15)
    f_badge = get_font(FONT_BOLD, 13)
    
    # Red corner banner
    d.polygon([(110, 70), (170, 70), (110, 130)], fill=(220, 38, 38, 255))
    d.text((115, 80), '₹10', font=get_font(FONT_BOLD, 14), fill=(255, 255, 255, 255))
    
    d.text((200, 125), 'ARAMANE', font=f_brand, fill=(255, 255, 255, 255), anchor='mm')
    d.text((200, 155), 'DETERGENT POWDER', font=f_sub, fill=(254, 240, 138, 255), anchor='mm')
    
    # Bottom badge
    d.rounded_rectangle([130, 190, 270, 222], radius=16, fill=(255, 255, 255, 240))
    d.text((200, 206), '120 PCS BAG', font=f_badge, fill=(15, 23, 42, 255), anchor='mm')
    
    # Pouch outer border / highlight
    d.polygon(pouch_pts, outline=(255, 255, 255, 90), width=2)
    
    im.save(os.path.join(OUT_DIR, 'inc-01-aramane-detergent.png'))
    print('Generated inc-01-aramane-detergent.png')

# 2. Daawat Rice 26Kg Bag
def gen_daawat():
    im = create_base_canvas()
    d = ImageDraw.Draw(im)
    
    # Shadow
    d.ellipse([95, 345, 305, 380], fill=(0, 0, 0, 40))
    
    # Rice Sack contour
    sack_pts = [
        (120, 65), (280, 65), (315, 290), (300, 350),
        (100, 350), (85, 290)
    ]
    sack_mask = Image.new('L', (400, 400), 0)
    ImageDraw.Draw(sack_mask).polygon(sack_pts, fill=255)
    
    # Cream / Burlap background with Daawat deep blue top
    sack_img = Image.new('RGBA', (400, 400), (248, 246, 240, 255))
    sd = ImageDraw.Draw(sack_img)
    
    # Blue top arch
    sd.rectangle([70, 60, 330, 150], fill=(15, 42, 110, 255))
    sd.arc([70, 110, 330, 190], start=0, end=180, fill=(15, 42, 110, 255), width=45)
    
    # Golden divider ribbon
    sd.line([(85, 165), (315, 165)], fill=(217, 119, 6, 255), width=5)
    
    im.paste(sack_img, (0, 0), sack_mask)
    d = ImageDraw.Draw(im)
    
    # Stitching line at top
    for x in range(120, 280, 8):
        d.line([(x, 68), (x+4, 76)], fill=(255, 255, 255, 200), width=2)
    
    # Royal Daawat Crest
    d.ellipse([175, 80, 225, 120], outline=(245, 158, 11, 255), width=2)
    d.text((200, 100), 'D', font=get_font(FONT_BOLD, 22), fill=(245, 158, 11, 255), anchor='mm')
    
    # Daawat Title
    f_title = get_font(FONT_BOLD, 28)
    d.text((200, 138), 'DAAWAT', font=f_title, fill=(255, 255, 255, 255), anchor='mm')
    
    # Rice grains illustration
    for gx in range(130, 270, 25):
        d.ellipse([gx, 235, gx+16, 244], fill=(254, 240, 138, 255), outline=(217, 119, 6, 255), width=1)
    
    # Subtitle
    d.text((200, 195), 'TRADITIONAL BASMATI', font=get_font(FONT_BOLD, 13), fill=(15, 23, 42, 255), anchor='mm')
    
    # 26 Kg badge
    d.rounded_rectangle([135, 265, 265, 310], radius=8, fill=(15, 42, 110, 255))
    d.text((200, 280), '26 KG NET', font=get_font(FONT_BOLD, 15), fill=(255, 255, 255, 255), anchor='mm')
    d.text((200, 298), 'PREMIUM GRAIN', font=get_font(FONT_BOLD, 10), fill=(245, 158, 11, 255), anchor='mm')
    
    # Sack outline
    d.polygon(sack_pts, outline=(148, 163, 184, 180), width=2)
    
    im.save(os.path.join(OUT_DIR, 'inc-02-daawat-rice.png'))
    print('Generated inc-02-daawat-rice.png')

# 3. Jasmine Rice 30 kg Bag
def gen_jasmine():
    im = create_base_canvas()
    d = ImageDraw.Draw(im)
    
    # Shadow
    d.ellipse([95, 345, 305, 380], fill=(0, 0, 0, 40))
    
    # Sack shape
    sack_pts = [(115, 65), (285, 65), (318, 290), (302, 350), (98, 350), (82, 290)]
    sack_mask = Image.new('L', (400, 400), 0)
    ImageDraw.Draw(sack_mask).polygon(sack_pts, fill=255)
    
    sack_img = Image.new('RGBA', (400, 400), (253, 250, 245, 255))
    sd = ImageDraw.Draw(sack_img)
    
    # Maroon & Gold Arch Header
    sd.rectangle([70, 60, 330, 140], fill=(126, 34, 206, 255)) # rich purple/maroon as in CRM
    sd.arc([70, 100, 330, 180], start=0, end=180, fill=(126, 34, 206, 255), width=45)
    
    im.paste(sack_img, (0, 0), sack_mask)
    d = ImageDraw.Draw(im)
    
    # Golden Jasmine motif
    d.ellipse([180, 80, 220, 120], outline=(250, 204, 21, 255), width=2)
    d.text((200, 100), '❀', font=get_font(FONT_BOLD, 22), fill=(250, 204, 21, 255), anchor='mm')
    
    d.text((200, 138), 'JASMINE', font=get_font(FONT_BOLD, 28), fill=(255, 255, 255, 255), anchor='mm')
    d.text((200, 195), 'SELECTED RICE', font=get_font(FONT_BOLD, 14), fill=(126, 34, 206, 255), anchor='mm')
    
    # Golden ring seal
    d.ellipse([160, 220, 240, 260], outline=(217, 119, 6, 255), fill=(254, 243, 199, 255), width=2)
    d.text((200, 240), 'PREMIUM', font=get_font(FONT_BOLD, 11), fill=(180, 83, 9, 255), anchor='mm')
    
    # 30 Kg badge
    d.rounded_rectangle([135, 275, 265, 320], radius=8, fill=(126, 34, 206, 255))
    d.text((200, 290), '30 KG BAG', font=get_font(FONT_BOLD, 15), fill=(255, 255, 255, 255), anchor='mm')
    d.text((200, 308), '100% PURE GRAIN', font=get_font(FONT_BOLD, 9), fill=(250, 204, 21, 255), anchor='mm')
    
    d.polygon(sack_pts, outline=(148, 163, 184, 180), width=2)
    im.save(os.path.join(OUT_DIR, 'inc-03-jasmine-rice.png'))
    print('Generated inc-03-jasmine-rice.png')

# 4. SUN ROYAL 750 GM SUNFLOWER OIL
def gen_sun_royal():
    im = create_base_canvas()
    d = ImageDraw.Draw(im)
    
    # Shadow
    d.ellipse([110, 345, 290, 375], fill=(0, 0, 0, 40))
    
    # Oil Bottle shape
    bottle_pts = [
        (170, 70), (230, 70), (230, 105), (265, 145),
        (265, 335), (250, 350), (150, 350), (135, 335),
        (135, 145), (170, 105)
    ]
    b_mask = Image.new('L', (400, 400), 0)
    ImageDraw.Draw(b_mask).polygon(bottle_pts, fill=255)
    
    # Golden oil color gradient
    oil_grad = Image.new('RGBA', (400, 400), (0, 0, 0, 0))
    gd = ImageDraw.Draw(oil_grad)
    for y in range(70, 360):
        t = (y - 70) / 290.0
        r = int(245 * (1 - t) + 217 * t)
        g = int(190 * (1 - t) + 140 * t)
        b = int(40 * (1 - t) + 15 * t)
        gd.line([(120, y), (280, y)], fill=(r, g, b, 240))
    
    im.paste(oil_grad, (0, 0), b_mask)
    d = ImageDraw.Draw(im)
    
    # Red Cap
    d.rounded_rectangle([175, 55, 225, 75], radius=4, fill=(220, 38, 38, 255), outline=(185, 28, 28, 255))
    for x in range(178, 223, 4):
        d.line([(x, 56), (x, 74)], fill=(255, 255, 255, 80), width=1)
    
    # Label on bottle
    d.rounded_rectangle([145, 160, 255, 305], radius=8, fill=(255, 255, 255, 245), outline=(217, 119, 6, 255), width=2)
    
    # Sunflower drawing
    cx, cy = 200, 205
    for angle in range(0, 360, 30):
        rad = math.radians(angle)
        px = cx + 22 * math.cos(rad)
        py = cy + 22 * math.sin(rad)
        d.ellipse([px-6, py-6, px+6, py+6], fill=(234, 179, 8, 255))
    d.ellipse([cx-14, cy-14, cx+14, cy+14], fill=(120, 53, 15, 255))
    
    # Sun Royal text
    d.text((200, 240), 'SUN ROYAL', font=get_font(FONT_BOLD, 17), fill=(185, 28, 28, 255), anchor='mm')
    d.text((200, 258), 'REFINED SUNFLOWER OIL', font=get_font(FONT_BOLD, 7), fill=(71, 85, 105, 255), anchor='mm')
    
    # 750 GM badge
    d.rounded_rectangle([160, 272, 240, 296], radius=6, fill=(217, 119, 6, 255))
    d.text((200, 284), '750 GM', font=get_font(FONT_BOLD, 12), fill=(255, 255, 255, 255), anchor='mm')
    
    # Glass bottle reflection highlight
    d.line([(148, 145), (148, 335)], fill=(255, 255, 255, 150), width=4)
    d.polygon(bottle_pts, outline=(255, 255, 255, 180), width=2)
    
    im.save(os.path.join(OUT_DIR, 'inc-04-sun-royal-oil.png'))
    print('Generated inc-04-sun-royal-oil.png')

# 5. Trulove Bourbon Biscuits 5Rs 144Pcs
def gen_bourbon():
    im = create_base_canvas()
    d = ImageDraw.Draw(im)
    
    # Shadow
    d.ellipse([70, 300, 330, 345], fill=(0, 0, 0, 45))
    
    # Biscuit packet (horizontal rectangle)
    pkt_pts = [(75, 130), (325, 130), (335, 280), (65, 280)]
    p_mask = Image.new('L', (400, 400), 0)
    ImageDraw.Draw(p_mask).polygon(pkt_pts, fill=255)
    
    # Rich Chocolate brown gradient
    choc_grad = Image.new('RGBA', (400, 400), (0, 0, 0, 0))
    gd = ImageDraw.Draw(choc_grad)
    for y in range(120, 290):
        t = (y - 120) / 170.0
        r = int(90 * (1 - t) + 45 * t)
        g = int(45 * (1 - t) + 20 * t)
        b = int(25 * (1 - t) + 10 * t)
        gd.line([(50, y), (350, y)], fill=(r, g, b, 255))
    
    im.paste(choc_grad, (0, 0), p_mask)
    d = ImageDraw.Draw(im)
    
    # Golden edge crimp borders
    for y in range(130, 280, 5):
        d.line([(65, y), (75, y+2)], fill=(217, 119, 6, 200), width=2)
        d.line([(325, y), (335, y+2)], fill=(217, 119, 6, 200), width=2)
    
    # Red ₹5 Badge
    d.polygon([(75, 130), (125, 130), (75, 180)], fill=(220, 38, 38, 255))
    d.text((90, 142), '₹5', font=get_font(FONT_BOLD, 14), fill=(255, 255, 255, 255))
    
    # Trulove title
    d.text((200, 160), 'TRULOVE', font=get_font(FONT_BOLD, 22), fill=(251, 191, 36, 255), anchor='mm')
    d.text((200, 182), 'BOURBON', font=get_font(FONT_BOLD, 26), fill=(255, 255, 255, 255), anchor='mm')
    
    # Bourbon Biscuit illustration
    d.rounded_rectangle([130, 205, 270, 245], radius=6, fill=(67, 30, 15, 255), outline=(120, 53, 15, 255), width=2)
    # Cream line
    d.rectangle([135, 223, 265, 227], fill=(40, 15, 5, 255))
    # Sugar crystals / biscuit dots
    for bx in range(145, 260, 16):
        d.ellipse([bx, 212, bx+3, 215], fill=(254, 240, 138, 220))
        d.ellipse([bx, 235, bx+3, 238], fill=(254, 240, 138, 220))
    d.text((200, 225), 'BOURBON', font=get_font(FONT_BOLD, 9), fill=(180, 100, 50, 255), anchor='mm')
    
    # 144 Pcs subtitle
    d.rounded_rectangle([140, 252, 260, 274], radius=6, fill=(217, 119, 6, 255))
    d.text((200, 263), '144 PCS BOX', font=get_font(FONT_BOLD, 11), fill=(255, 255, 255, 255), anchor='mm')
    
    im.save(os.path.join(OUT_DIR, 'inc-05-trulove-bourbon.png'))
    print('Generated inc-05-trulove-bourbon.png')

# 6. TC Chocolate Kreme (Authentic CRM vector initial badge)
def gen_tc():
    im = create_base_canvas()
    d = ImageDraw.Draw(im)
    
    # Shadow
    d.rounded_rectangle([50, 60, 350, 360], radius=24, fill=(0, 0, 0, 30))
    
    # Authentic CRM Card Background (#e0f2fe to #f0f9ff)
    d.rounded_rectangle([45, 45, 355, 355], radius=24, fill=(240, 249, 255, 255), outline=(186, 230, 253, 255), width=3)
    
    # Top-right pill badge: TC: 144PCS
    d.rounded_rectangle([220, 65, 335, 95], radius=15, fill=(2, 132, 199, 255))
    d.text((277, 80), 'TC: 144PCS', font=get_font(FONT_BOLD, 13), fill=(255, 255, 255, 255), anchor='mm')
    
    # Central Bold Typography: TC
    d.text((200, 190), 'TC', font=get_font(FONT_BOLD, 100), fill=(3, 105, 161, 255), anchor='mm')
    
    # Bottom Pill: 144PCS BOX
    d.rounded_rectangle([105, 270, 295, 315], radius=22, fill=(224, 242, 254, 255), outline=(2, 132, 199, 255), width=2)
    d.text((200, 292), '144PCS BOX', font=get_font(FONT_BOLD, 18), fill=(3, 105, 161, 255), anchor='mm')
    
    im.save(os.path.join(OUT_DIR, 'inc-06-tc-chocolate.png'))
    print('Generated inc-06-tc-chocolate.png')

# 7. TO Orange Kreme (Authentic CRM vector initial badge)
def gen_to():
    im = create_base_canvas()
    d = ImageDraw.Draw(im)
    
    # Shadow
    d.rounded_rectangle([50, 60, 350, 360], radius=24, fill=(0, 0, 0, 30))
    
    # Authentic CRM Card Background
    d.rounded_rectangle([45, 45, 355, 355], radius=24, fill=(240, 249, 255, 255), outline=(186, 230, 253, 255), width=3)
    
    # Top-right pill badge: TO: 144PCS
    d.rounded_rectangle([220, 65, 335, 95], radius=15, fill=(2, 132, 199, 255))
    d.text((277, 80), 'TO: 144PCS', font=get_font(FONT_BOLD, 13), fill=(255, 255, 255, 255), anchor='mm')
    
    # Central Bold Typography: TO
    d.text((200, 190), 'TO', font=get_font(FONT_BOLD, 100), fill=(3, 105, 161, 255), anchor='mm')
    
    # Bottom Pill: 144PCS BOX
    d.rounded_rectangle([105, 270, 295, 315], radius=22, fill=(224, 242, 254, 255), outline=(2, 132, 199, 255), width=2)
    d.text((200, 292), '144PCS BOX', font=get_font(FONT_BOLD, 18), fill=(3, 105, 161, 255), anchor='mm')
    
    im.save(os.path.join(OUT_DIR, 'inc-07-to-orange.png'))
    print('Generated inc-07-to-orange.png')

# 8. Zeeba Jeera Rice 26 Kg Bag
def gen_zeeba_jeera():
    im = create_base_canvas()
    d = ImageDraw.Draw(im)
    
    # Shadow
    d.ellipse([95, 345, 305, 380], fill=(0, 0, 0, 40))
    
    # Sack shape
    sack_pts = [(115, 65), (285, 65), (318, 290), (302, 350), (98, 350), (82, 290)]
    sack_mask = Image.new('L', (400, 400), 0)
    ImageDraw.Draw(sack_mask).polygon(sack_pts, fill=255)
    
    sack_img = Image.new('RGBA', (400, 400), (252, 250, 242, 255))
    sd = ImageDraw.Draw(sack_img)
    
    # Warm Maroon / Brown Header
    sd.rectangle([70, 60, 330, 145], fill=(120, 53, 15, 255))
    sd.arc([70, 105, 330, 185], start=0, end=180, fill=(120, 53, 15, 255), width=45)
    
    im.paste(sack_img, (0, 0), sack_mask)
    d = ImageDraw.Draw(im)
    
    # Golden Crown Crest
    d.ellipse([180, 80, 220, 120], outline=(245, 158, 11, 255), width=2)
    d.text((200, 100), 'Z', font=get_font(FONT_BOLD, 22), fill=(245, 158, 11, 255), anchor='mm')
    
    d.text((200, 138), 'ZEEBA', font=get_font(FONT_BOLD, 28), fill=(255, 255, 255, 255), anchor='mm')
    d.text((200, 190), 'PREMIUM JEERA RICE', font=get_font(FONT_BOLD, 13), fill=(120, 53, 15, 255), anchor='mm')
    d.text((200, 210), 'EXTRA AROMATIC & LONG', font=get_font(FONT_BOLD, 9), fill=(180, 83, 9, 255), anchor='mm')
    
    # Rice grains in bowl
    d.ellipse([160, 225, 240, 255], fill=(254, 243, 199, 255), outline=(217, 119, 6, 255), width=2)
    d.text((200, 240), '100% PURE', font=get_font(FONT_BOLD, 10), fill=(146, 64, 14, 255), anchor='mm')
    
    # 26 Kg badge
    d.rounded_rectangle([135, 275, 265, 320], radius=8, fill=(120, 53, 15, 255))
    d.text((200, 290), '26 KG NET', font=get_font(FONT_BOLD, 15), fill=(255, 255, 255, 255), anchor='mm')
    d.text((200, 308), 'BEST INCENTIVE', font=get_font(FONT_BOLD, 9), fill=(250, 204, 21, 255), anchor='mm')
    
    d.polygon(sack_pts, outline=(148, 163, 184, 180), width=2)
    im.save(os.path.join(OUT_DIR, 'inc-08-zeeba-jeera-rice.png'))
    print('Generated inc-08-zeeba-jeera-rice.png')

# 9. Zeeba Steam Rice 26Kg Bag
def gen_zeeba_steam():
    im = create_base_canvas()
    d = ImageDraw.Draw(im)
    
    # Shadow
    d.ellipse([95, 345, 305, 380], fill=(0, 0, 0, 40))
    
    # Sack shape
    sack_pts = [(115, 65), (285, 65), (318, 290), (302, 350), (98, 350), (82, 290)]
    sack_mask = Image.new('L', (400, 400), 0)
    ImageDraw.Draw(sack_mask).polygon(sack_pts, fill=255)
    
    sack_img = Image.new('RGBA', (400, 400), (252, 250, 245, 255))
    sd = ImageDraw.Draw(sack_img)
    
    # Royal Navy Blue Header
    sd.rectangle([70, 60, 330, 145], fill=(30, 58, 138, 255))
    sd.arc([70, 105, 330, 185], start=0, end=180, fill=(30, 58, 138, 255), width=45)
    
    im.paste(sack_img, (0, 0), sack_mask)
    d = ImageDraw.Draw(im)
    
    # Golden Crown Crest
    d.ellipse([180, 80, 220, 120], outline=(245, 158, 11, 255), width=2)
    d.text((200, 100), 'Z', font=get_font(FONT_BOLD, 22), fill=(245, 158, 11, 255), anchor='mm')
    
    d.text((200, 138), 'ZEEBA', font=get_font(FONT_BOLD, 28), fill=(255, 255, 255, 255), anchor='mm')
    d.text((200, 190), 'STEAM BASMATI RICE', font=get_font(FONT_BOLD, 13), fill=(30, 58, 138, 255), anchor='mm')
    d.text((200, 210), 'SILKY & FLUFFY GRAIN', font=get_font(FONT_BOLD, 9), fill=(180, 83, 9, 255), anchor='mm')
    
    # Golden seal
    d.ellipse([160, 225, 240, 255], fill=(254, 243, 199, 255), outline=(217, 119, 6, 255), width=2)
    d.text((200, 240), 'STEAM SELECT', font=get_font(FONT_BOLD, 9), fill=(30, 58, 138, 255), anchor='mm')
    
    # 26 Kg badge
    d.rounded_rectangle([135, 275, 265, 320], radius=8, fill=(30, 58, 138, 255))
    d.text((200, 290), '26 KG BAG', font=get_font(FONT_BOLD, 15), fill=(255, 255, 255, 255), anchor='mm')
    d.text((200, 308), 'PREMIUM GRADE', font=get_font(FONT_BOLD, 9), fill=(250, 204, 21, 255), anchor='mm')
    
    d.polygon(sack_pts, outline=(148, 163, 184, 180), width=2)
    im.save(os.path.join(OUT_DIR, 'inc-09-zeeba-steam-rice.png'))
    print('Generated inc-09-zeeba-steam-rice.png')

# 10. 1 LTR WATER (12 PCS)
def gen_water_1l():
    im = create_base_canvas()
    d = ImageDraw.Draw(im)
    
    # Shadow
    d.ellipse([135, 345, 265, 375], fill=(0, 0, 0, 35))
    
    # 1L Bottle shape
    pts = [
        (185, 60), (215, 60), (215, 95), (245, 140),
        (245, 335), (235, 350), (165, 350), (155, 335),
        (155, 140), (185, 95)
    ]
    b_mask = Image.new('L', (400, 400), 0)
    ImageDraw.Draw(b_mask).polygon(pts, fill=255)
    
    # Clear water gradient
    w_grad = Image.new('RGBA', (400, 400), (0, 0, 0, 0))
    gd = ImageDraw.Draw(w_grad)
    for y in range(60, 360):
        t = (y - 60) / 300.0
        r = int(240 * (1 - t) + 210 * t)
        g = int(249 * (1 - t) + 235 * t)
        b = int(255 * (1 - t) + 250 * t)
        gd.line([(140, y), (260, y)], fill=(r, g, b, 230))
    
    im.paste(w_grad, (0, 0), b_mask)
    d = ImageDraw.Draw(im)
    
    # Aqua Cap
    d.rounded_rectangle([185, 48, 215, 62], radius=3, fill=(14, 165, 233, 255))
    
    # Label
    d.rectangle([155, 180, 245, 280], fill=(2, 132, 199, 255))
    d.rectangle([155, 205, 245, 255], fill=(255, 255, 255, 255))
    
    # Water splash graphic
    d.text((200, 193), 'PURE WATER', font=get_font(FONT_BOLD, 10), fill=(255, 255, 255, 255), anchor='mm')
    d.text((200, 222), '1 LTR', font=get_font(FONT_BOLD, 20), fill=(2, 132, 199, 255), anchor='mm')
    d.text((200, 242), 'PACKAGED DRINKING', font=get_font(FONT_BOLD, 7), fill=(100, 116, 139, 255), anchor='mm')
    d.text((200, 268), '12 PCS PACK', font=get_font(FONT_BOLD, 10), fill=(254, 240, 138, 255), anchor='mm')
    
    # Bottle ridges and shine
    d.line([(165, 140), (165, 335)], fill=(255, 255, 255, 180), width=3)
    d.polygon(pts, outline=(186, 230, 253, 200), width=2)
    
    im.save(os.path.join(OUT_DIR, 'inc-10-water-bottle.png'))
    print('Generated inc-10-water-bottle.png')

# 11. 1/2 LTR WATER (24 PCS)
def gen_water_half_ltr():
    im = create_base_canvas()
    d = ImageDraw.Draw(im)
    
    # Shadow
    d.ellipse([140, 345, 260, 375], fill=(0, 0, 0, 35))
    
    # 500ml Bottle shape (wider, slightly shorter)
    pts = [
        (185, 90), (215, 90), (215, 120), (242, 160),
        (242, 335), (232, 350), (168, 350), (158, 335),
        (158, 160), (185, 120)
    ]
    b_mask = Image.new('L', (400, 400), 0)
    ImageDraw.Draw(b_mask).polygon(pts, fill=255)
    
    w_grad = Image.new('RGBA', (400, 400), (0, 0, 0, 0))
    gd = ImageDraw.Draw(w_grad)
    for y in range(90, 360):
        t = (y - 90) / 270.0
        r = int(240 * (1 - t) + 210 * t)
        g = int(249 * (1 - t) + 235 * t)
        b = int(255 * (1 - t) + 250 * t)
        gd.line([(150, y), (250, y)], fill=(r, g, b, 230))
    
    im.paste(w_grad, (0, 0), b_mask)
    d = ImageDraw.Draw(im)
    
    # Aqua Cap
    d.rounded_rectangle([185, 78, 215, 92], radius=3, fill=(14, 165, 233, 255))
    
    # Label
    d.rectangle([158, 200, 242, 290], fill=(13, 148, 136, 255)) # teal-green hue
    d.rectangle([158, 222, 242, 268], fill=(255, 255, 255, 255))
    
    d.text((200, 211), 'MINERAL WATER', font=get_font(FONT_BOLD, 9), fill=(255, 255, 255, 255), anchor='mm')
    d.text((200, 238), '500 ML', font=get_font(FONT_BOLD, 17), fill=(13, 148, 136, 255), anchor='mm')
    d.text((200, 256), '1/2 LTR', font=get_font(FONT_BOLD, 10), fill=(71, 85, 105, 255), anchor='mm')
    d.text((200, 279), '24 PCS BOX', font=get_font(FONT_BOLD, 10), fill=(254, 240, 138, 255), anchor='mm')
    
    d.line([(166, 160), (166, 335)], fill=(255, 255, 255, 180), width=3)
    d.polygon(pts, outline=(186, 230, 253, 200), width=2)
    
    im.save(os.path.join(OUT_DIR, 'inc-11-water-bottle-half-ltr.png'))
    print('Generated inc-11-water-bottle-half-ltr.png')

# 12. Trulove Butter Waves 5Rs 168Pcs Box
def gen_butter_waves():
    im = create_base_canvas()
    d = ImageDraw.Draw(im)
    
    # Shadow
    d.ellipse([70, 300, 330, 345], fill=(0, 0, 0, 45))
    
    # Biscuit packet (horizontal rectangle)
    pkt_pts = [(75, 130), (325, 130), (335, 280), (65, 280)]
    p_mask = Image.new('L', (400, 400), 0)
    ImageDraw.Draw(p_mask).polygon(pkt_pts, fill=255)
    
    # Rich Golden Yellow gradient
    yellow_grad = Image.new('RGBA', (400, 400), (0, 0, 0, 0))
    gd = ImageDraw.Draw(yellow_grad)
    for y in range(120, 290):
        t = (y - 120) / 170.0
        r = int(245 * (1 - t) + 217 * t)
        g = int(185 * (1 - t) + 119 * t)
        b = int(11 * (1 - t) + 6 * t)
        gd.line([(50, y), (350, y)], fill=(r, g, b, 255))
    
    im.paste(yellow_grad, (0, 0), p_mask)
    d = ImageDraw.Draw(im)
    
    # Edge crimp
    for y in range(130, 280, 5):
        d.line([(65, y), (75, y+2)], fill=(180, 83, 9, 200), width=2)
        d.line([(325, y), (335, y+2)], fill=(180, 83, 9, 200), width=2)
    
    # Red ₹5 Badge
    d.polygon([(75, 130), (125, 130), (75, 180)], fill=(220, 38, 38, 255))
    d.text((90, 142), '₹5', font=get_font(FONT_BOLD, 14), fill=(255, 255, 255, 255))
    
    # Trulove title
    d.text((200, 160), 'TRULOVE', font=get_font(FONT_BOLD, 22), fill=(120, 53, 15, 255), anchor='mm')
    d.text((200, 185), 'BUTTER WAVES', font=get_font(FONT_BOLD, 24), fill=(255, 255, 255, 255), anchor='mm')
    
    # Wavy Biscuit & Butter swirl
    d.arc([130, 195, 270, 250], start=180, end=360, fill=(254, 240, 138, 255), width=8)
    d.arc([140, 210, 260, 255], start=180, end=360, fill=(254, 240, 138, 255), width=6)
    
    # 168 Pcs Box subtitle
    d.rounded_rectangle([135, 252, 265, 274], radius=6, fill=(120, 53, 15, 255))
    d.text((200, 263), '168 PCS BOX', font=get_font(FONT_BOLD, 11), fill=(254, 240, 138, 255), anchor='mm')
    
    im.save(os.path.join(OUT_DIR, 'inc-12-trulove-butter-waves.png'))
    print('Generated inc-12-trulove-butter-waves.png')

if __name__ == '__main__':
    gen_aramane()
    gen_daawat()
    gen_jasmine()
    gen_sun_royal()
    gen_bourbon()
    gen_tc()
    gen_to()
    gen_zeeba_jeera()
    gen_zeeba_steam()
    gen_water_1l()
    gen_water_half_ltr()
    gen_butter_waves()
    print('ALL 12 CRM ASSETS GENERATED AT 400x400 RESOLUTION!')
