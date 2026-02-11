#!/usr/bin/env python3
"""Import the 4 interventions from the 2026 tracking spreadsheet (semicolon-separated CSV)."""
import os
import mysql.connector
import csv
from datetime import datetime
import glob

DATABASE_URL = os.environ.get("DATABASE_URL", "")

# Parse DATABASE_URL
url = DATABASE_URL.replace("mysql://", "")
if "?" in url:
    url = url.split("?")[0]
userpass, hostdb = url.split("@")
user, password = userpass.split(":")
hostport, dbname = hostdb.split("/")
host, port = hostport.split(":")

conn = mysql.connector.connect(
    host=host, port=int(port), user=user, password=password,
    database=dbname, ssl_disabled=False,
    ssl_ca="/etc/ssl/certs/ca-certificates.crt"
)
cursor = conn.cursor(dictionary=True)

# Find the CSV file
csv_path = "/home/ubuntu/upload/Tableausuivi(2026).csv"
files = glob.glob("/home/ubuntu/upload/Tableau*")
if files:
    csv_path = files[0]
    print(f"Found file: {csv_path}")

# Read with semicolon delimiter
rows = []
with open(csv_path, "r", encoding="utf-8-sig") as f:
    reader = csv.reader(f, delimiter=";")
    headers = next(reader)
    print(f"Headers ({len(headers)}): {headers}")
    for row in reader:
        if row and any(cell.strip() for cell in row):
            rows.append(row)
            print(f"  Row: {row}")

print(f"\nFound {len(rows)} data rows")

# Get building and work type IDs
cursor.execute("SELECT id, code, name FROM buildings")
buildings_all = cursor.fetchall()
buildings_by_code = {}
buildings_by_bat = {}
for b in buildings_all:
    if b["code"]:
        # code is like "003816S-185", we want to match on UT and BAT parts
        buildings_by_code[b["code"]] = b["id"]
        parts = b["code"].split("-")
        if len(parts) >= 2:
            buildings_by_bat[parts[1].strip()] = b["id"]

cursor.execute("SELECT id, code, name FROM work_types")
work_types = {wt["code"]: wt["id"] for wt in cursor.fetchall()}

print(f"Work types: {list(work_types.keys())}")
print(f"Buildings by BAT: {buildings_by_bat}")

# Column mapping (from headers):
# 0: PRESTATIRE, 1: UT, 2: BAT, 3: INTITULE, 4: N° DEVIS, 5: DATE, 6: MONTANT,
# 7: VALIDATION KNITIV, 8: N° CONNECT IMMO, 9: N° DA, 10: N°CDA, 11: PV,
# 12: N° RECEPTION, 13: N°AT, 14: AXE LOCAL, 15: AXE CENTRAL, 16: DATE DACIA,
# 17: CLOTURE AT, 18: COMMENTAIRES

for i, row in enumerate(rows, 1):
    try:
        prestataire = row[0].strip() if len(row) > 0 else ""
        ut = row[1].strip() if len(row) > 1 else ""
        bat = row[2].strip() if len(row) > 2 else ""
        intitule = row[3].strip() if len(row) > 3 else ""
        num_devis = row[4].strip() if len(row) > 4 else ""
        date_str = row[5].strip() if len(row) > 5 else ""
        montant = row[6].strip() if len(row) > 6 else ""
        validation_knitiv = row[7].strip() if len(row) > 7 else ""
        connect_immo = row[8].strip() if len(row) > 8 else ""
        da = row[9].strip() if len(row) > 9 else ""
        cda = row[10].strip() if len(row) > 10 else ""
        pv = row[11].strip() if len(row) > 11 else ""
        reception = row[12].strip() if len(row) > 12 else ""
        at_num = row[13].strip() if len(row) > 13 else ""
        axe_local = row[14].strip() if len(row) > 14 else ""
        axe_central = row[15].strip() if len(row) > 15 else ""
        date_dacia = row[16].strip() if len(row) > 16 else ""
        cloture_at = row[17].strip() if len(row) > 17 else ""
        commentaires = row[18].strip() if len(row) > 18 else ""

        # Find building by UT-BAT code
        full_code = f"{ut}-{bat}"
        building_id = buildings_by_code.get(full_code)
        if not building_id:
            building_id = buildings_by_bat.get(bat)
        if not building_id:
            # Try partial match
            for code, bid in buildings_by_code.items():
                if ut in code and bat in code:
                    building_id = bid
                    break
        if not building_id:
            cursor.execute("SELECT id FROM buildings LIMIT 1")
            result = cursor.fetchone()
            building_id = result["id"] if result else 1
            print(f"  Warning: Building UT={ut} BAT={bat} not found, using default")

        # Map work type from intitule
        work_type_id = None
        intitule_lower = intitule.lower()
        if "nettoyage" in intitule_lower or "sinistre" in intitule_lower:
            work_type_id = work_types.get("C6")  # Second-oeuvre
        elif "canalisation" in intitule_lower or "plomberie" in intitule_lower or "fuite" in intitule_lower:
            work_type_id = work_types.get("C3")  # Plomberie
        elif "eclairage" in intitule_lower or "éclairage" in intitule_lower:
            work_type_id = work_types.get("C5")  # Éclairage
        elif "clim" in intitule_lower or "cvc" in intitule_lower:
            work_type_id = work_types.get("C1a")
        elif "incendie" in intitule_lower or "ssi" in intitule_lower:
            work_type_id = work_types.get("C2")
        elif "sécurité" in intitule_lower or "securité" in intitule_lower or "securite" in intitule_lower:
            work_type_id = work_types.get("C3")  # Plomberie/sécurité canalisation
        else:
            work_type_id = work_types.get("C6")  # Default to second-oeuvre

        # Parse date
        start_date_ts = None
        if date_str:
            try:
                dt = datetime.strptime(date_str, "%d/%m/%Y")
                start_date_ts = int(dt.timestamp() * 1000)
            except:
                start_date_ts = int(datetime.now().timestamp() * 1000)
        else:
            start_date_ts = int(datetime.now().timestamp() * 1000)

        # Parse date DACIA
        date_dacia_ts = None
        if date_dacia:
            try:
                dt = datetime.strptime(date_dacia, "%d/%m/%Y")
                date_dacia_ts = int(dt.timestamp() * 1000)
            except:
                pass

        # Generate reference
        cursor.execute("SELECT COUNT(*) as cnt FROM interventions")
        cnt = cursor.fetchone()["cnt"]
        reference = f"INT-202601-{str(cnt + 1).zfill(5)}"

        # Clean montant (French format: 975,33 -> 975.33)
        montant_clean = None
        if montant:
            montant_clean = montant.replace("€", "").replace(" ", "").replace(",", ".").strip()
            try:
                float(montant_clean)
            except:
                montant_clean = None

        # Build description with comments
        description = intitule
        if commentaires:
            description = f"{intitule}\n{commentaires}"

        sql = """INSERT INTO interventions 
            (reference, buildingId, workTypeId, criticality, maintenanceType, 
             title, description, status, startDate, 
             contractor, quoteNumber, amount, validationKnitiv,
             connectImmoRef, daNumber, cdaNumber, pvNumber, receptionNumber,
             atNumber, axeLocal, axeCentral, dateDacia)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""

        values = (
            reference, building_id, work_type_id, "C2", "MCOR",
            intitule or f"Intervention {i}",
            description or None,
            "en_cours",
            start_date_ts,
            prestataire or None,
            num_devis or None,
            montant_clean,
            validation_knitiv or None,
            connect_immo or None,
            da or None,
            cda or None,
            pv or None,
            reception or None,
            at_num or None,
            axe_local or None,
            axe_central or None,
            date_dacia_ts,
        )

        cursor.execute(sql, values)
        print(f"  Inserted: {reference} - {prestataire} - {intitule} ({montant_clean}€)")

    except Exception as e:
        print(f"  Error on row {i}: {e}")
        import traceback
        traceback.print_exc()
        continue

conn.commit()
print(f"\nImport complete!")
cursor.execute("SELECT COUNT(*) as cnt FROM interventions")
print(f"Total interventions: {cursor.fetchone()['cnt']}")
cursor.close()
conn.close()
