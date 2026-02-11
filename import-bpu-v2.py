#!/usr/bin/env python3
"""Import BPU items from CSV - v2 with proper multi-line CSV parsing."""
import csv
import re
import os
import io
import mysql.connector
import urllib.parse

CSV_PATH = '/home/ubuntu/crm-e2mt2/bpu-import.csv'
LOT_CODE = '4.1'

def parse_price(s):
    s = s.strip()
    if not s:
        return None
    s = s.replace('\xa0', '').replace(' ', '').replace(',', '.')
    try:
        return float(s)
    except ValueError:
        return None

def main():
    db_url = os.environ.get('DATABASE_URL', '')
    parsed = urllib.parse.urlparse(db_url)
    conn = mysql.connector.connect(
        host=parsed.hostname,
        port=parsed.port or 3306,
        user=parsed.username,
        password=urllib.parse.unquote(parsed.password) if parsed.password else '',
        database=parsed.path.lstrip('/').split('?')[0],
        ssl_disabled=False if 'ssl' in db_url else True,
    )
    cursor = conn.cursor()
    
    # Clear existing data
    cursor.execute("DELETE FROM bpu_items")
    conn.commit()
    
    # Use Python csv module to properly handle quoted multi-line fields
    with open(CSV_PATH, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f, delimiter=';', quotechar='"')
        rows = list(reader)
    
    print(f"Total CSV rows (after multi-line merge): {len(rows)}")
    
    category_map = {
        'CVCD': 'CVC',
        'Protection incendie': 'Protection incendie',
        'Systèmes de sécurité incendie': 'Sécurité incendie',
        'Clos et couvert': 'Clos et couvert',
        'Electricité courants forts': 'Électricité CF',
        'Fermetures motorisées': 'Fermetures motorisées',
        'Plomberie': 'Plomberie',
        'Eclairage': 'Éclairage',
        'Second-œuvre': 'Second-œuvre',
        'Extincteurs': 'Extincteurs',
        'Amiante': 'Amiante',
        'Management de l\'énergie': 'Management énergie',
    }
    
    code_pattern = re.compile(r'^[A-Z]+-\d+$')
    current_category = None
    imported = 0
    skipped = 0
    
    for row in rows:
        if not row or not row[0].strip():
            continue
        
        first = row[0].strip()
        
        # Skip header/meta lines
        if first in ('Code PU', '') or first.startswith('Entretien') or first.startswith('CPS') or first.startswith('Annexe') or first.startswith('LOT') or first.startswith('Attention') or first.startswith('(1)') or first.startswith('(2)'):
            continue
        
        # Check for category header
        matched_cat = None
        for key, val in category_map.items():
            if first == key or first.startswith(key):
                matched_cat = val
                break
        # Also check for "Location de moyens d'accès"
        if 'moyens d' in first.lower() and 'accès' in first.lower():
            matched_cat = "Moyens d'accès"
        
        if matched_cat:
            # Category headers have no price in col 5
            has_price = len(row) > 5 and parse_price(row[5]) is not None
            if not has_price:
                current_category = matched_cat
                print(f"\n=== Catégorie: {current_category} ===")
                continue
        
        # Try to parse as BPU item
        code = first
        if not code_pattern.match(code):
            continue
        
        if not current_category:
            continue
        
        # Extract fields
        name = row[1].strip() if len(row) > 1 else ''
        detail = row[3].strip() if len(row) > 3 else ''
        price_str = row[5].strip() if len(row) > 5 else ''
        unit_str = row[6].strip() if len(row) > 6 else ''
        
        # Clean up multi-line content
        name = ' '.join(name.split())
        detail = ' '.join(detail.split()) if detail else None
        price = parse_price(price_str)
        unit = unit_str.strip() if unit_str else None
        
        if not name:
            print(f"  ⚠ Skipped {code}: no name")
            skipped += 1
            continue
        
        if price is None:
            print(f"  ⚠ Skipped {code}: no price (name={name[:50]})")
            skipped += 1
            continue
        
        try:
            cursor.execute(
                """INSERT INTO bpu_items (code, category, name, detail, priceHT, unit, lotCode)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)
                   ON DUPLICATE KEY UPDATE
                   category = VALUES(category), name = VALUES(name), detail = VALUES(detail),
                   priceHT = VALUES(priceHT), unit = VALUES(unit)""",
                (code, current_category, name[:5000], detail[:5000] if detail else None, price, unit[:200] if unit else None, LOT_CODE)
            )
            imported += 1
            print(f"  ✓ {code}: {name[:60]}... → {price:.2f}€ HT")
        except Exception as e:
            print(f"  ✗ Error {code}: {e}")
    
    conn.commit()
    
    cursor.execute("SELECT COUNT(*) FROM bpu_items")
    total = cursor.fetchone()[0]
    
    cursor.execute("SELECT category, COUNT(*) as cnt FROM bpu_items GROUP BY category ORDER BY category")
    cats = cursor.fetchall()
    
    print(f"\n=== Import Summary ===")
    print(f"Imported: {imported}")
    print(f"Skipped: {skipped}")
    print(f"Total in DB: {total}")
    print(f"\nPar catégorie:")
    for cat, cnt in cats:
        print(f"  {cat}: {cnt}")
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    main()
