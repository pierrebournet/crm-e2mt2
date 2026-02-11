#!/usr/bin/env python3
"""Import BPU items from CSV into the database."""
import csv
import re
import os
import mysql.connector

CSV_PATH = '/home/ubuntu/crm-e2mt2/bpu-import.csv'
LOT_CODE = '4.1'

def parse_price(s):
    """Parse a price string like '3262,50' or '1 214,27' to float."""
    s = s.strip()
    if not s:
        return None
    # Remove spaces (thousands separator)
    s = s.replace('\xa0', '').replace(' ', '')
    # Replace comma with dot
    s = s.replace(',', '.')
    try:
        return float(s)
    except ValueError:
        return None

def main():
    db_url = os.environ.get('DATABASE_URL', '')
    # Parse DATABASE_URL: mysql://user:pass@host:port/dbname
    # or mysql2://user:pass@host:port/dbname?ssl=...
    import urllib.parse
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
    
    with open(CSV_PATH, 'r', encoding='utf-8-sig') as f:
        content = f.read()
    
    lines = content.split('\n')
    
    current_category = None
    imported = 0
    skipped = 0
    errors = 0
    
    # Category mapping from section headers
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
        'Location de moyens d\'accès nécessaires pour la réalisation des prestations connexes (1)': 'Moyens d\'accès',
        'Management de l\'énergie': 'Management énergie',
    }
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip empty lines and header lines
        if not line or line.startswith('Entretien') or line.startswith('CPS') or line.startswith('Annexe') or line.startswith('LOT') or line.startswith('"Attention') or line.startswith('Code PU'):
            i += 1
            continue
        
        cols = line.split(';')
        
        # Check if this is a category header (first col has text, rest mostly empty)
        first_col = cols[0].strip().strip('"')
        
        # Check if it's a category header
        matched_cat = None
        for key, val in category_map.items():
            if first_col == key or first_col.startswith(key):
                matched_cat = val
                break
        
        if matched_cat and (len(cols) < 6 or not cols[5].strip()):
            current_category = matched_cat
            print(f"\n=== Catégorie: {current_category} ===")
            i += 1
            continue
        
        # Check for footnote lines
        if first_col.startswith('(1)') or first_col.startswith('(2)'):
            i += 1
            continue
        
        # Try to parse as a BPU item
        code = first_col.strip('"')
        
        # Valid codes match patterns like CVCD-01, PI-01, SSI-01, CC-01, CFO-01, etc.
        code_pattern = re.compile(r'^[A-Z]+-\d+$')
        if not code_pattern.match(code):
            i += 1
            continue
        
        if not current_category:
            i += 1
            continue
        
        # Parse the item - handle multi-line descriptions
        name_parts = [cols[1].strip().strip('"') if len(cols) > 1 else '']
        detail_parts = [cols[3].strip().strip('"') if len(cols) > 3 else '']
        price_str = cols[5].strip().strip('"') if len(cols) > 5 else ''
        unit_str = cols[6].strip().strip('"') if len(cols) > 6 else ''
        
        # Check for continuation lines (lines that are part of multi-line quoted fields)
        j = i + 1
        while j < len(lines):
            next_line = lines[j]
            next_cols = next_line.split(';')
            next_first = next_cols[0].strip().strip('"') if next_cols else ''
            
            # If next line starts with a valid code or category, stop
            if code_pattern.match(next_first):
                break
            is_cat = False
            for key in category_map:
                if next_first == key or next_first.startswith(key):
                    is_cat = True
                    break
            if is_cat:
                break
            if not next_line.strip():
                j += 1
                continue
            
            # This is a continuation line
            if len(next_cols) > 1 and next_cols[1].strip():
                name_parts.append(next_cols[1].strip().strip('"'))
            if len(next_cols) > 3 and next_cols[3].strip():
                detail_parts.append(next_cols[3].strip().strip('"'))
            if len(next_cols) > 5 and next_cols[5].strip() and not price_str:
                price_str = next_cols[5].strip().strip('"')
            if len(next_cols) > 6 and next_cols[6].strip() and not unit_str:
                unit_str = next_cols[6].strip().strip('"')
            j += 1
        
        i = j
        
        name = ' '.join(filter(None, name_parts)).strip()
        detail = ' '.join(filter(None, detail_parts)).strip() or None
        price = parse_price(price_str)
        unit = unit_str.strip() or None
        
        if not name or price is None:
            print(f"  ⚠ Skipped {code}: no name or price (name={name!r}, price={price_str!r})")
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
            errors += 1
            print(f"  ✗ Error {code}: {e}")
    
    conn.commit()
    
    # Verify count
    cursor.execute("SELECT COUNT(*) FROM bpu_items")
    total = cursor.fetchone()[0]
    
    print(f"\n=== Import Summary ===")
    print(f"Imported: {imported}")
    print(f"Skipped: {skipped}")
    print(f"Errors: {errors}")
    print(f"Total in DB: {total}")
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    main()
