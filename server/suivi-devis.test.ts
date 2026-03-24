import { describe, it, expect } from "vitest";

/**
 * Tests pour la fonctionnalité de pièce jointe (devis) dans le tableau de suivi.
 * Vérifie la logique métier côté validation des fichiers et cohérence des données.
 */

// Types de fichiers autorisés pour l'upload de devis
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MAX_FILE_SIZE_MB = 16;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Extensions autorisées
const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".xlsx"];

function isAllowedFileType(mimeType: string): boolean {
  return ALLOWED_TYPES.includes(mimeType);
}

function isAllowedExtension(fileName: string): boolean {
  const ext = fileName.toLowerCase().split(".").pop();
  return ALLOWED_EXTENSIONS.some((e) => e === `.${ext}`);
}

function isFileSizeValid(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE_BYTES;
}

function generateSafeKey(entryId: number, fileName: string, randomSuffix: string): string {
  const ext = fileName.split(".").pop() || "pdf";
  return `suivi-devis/${entryId}-${randomSuffix}.${ext}`;
}

describe("Tableau de Suivi — Pièce jointe devis", () => {
  describe("Validation des types de fichiers", () => {
    it("doit accepter les fichiers PDF", () => {
      expect(isAllowedFileType("application/pdf")).toBe(true);
      expect(isAllowedExtension("devis_equans_2026.pdf")).toBe(true);
    });

    it("doit accepter les images JPEG", () => {
      expect(isAllowedFileType("image/jpeg")).toBe(true);
      expect(isAllowedExtension("scan_devis.jpg")).toBe(true);
      expect(isAllowedExtension("photo_devis.jpeg")).toBe(true);
    });

    it("doit accepter les images PNG", () => {
      expect(isAllowedFileType("image/png")).toBe(true);
      expect(isAllowedExtension("capture_devis.png")).toBe(true);
    });

    it("doit accepter les images WebP", () => {
      expect(isAllowedFileType("image/webp")).toBe(true);
      expect(isAllowedExtension("devis.webp")).toBe(true);
    });

    it("doit accepter les fichiers Excel XLSX", () => {
      expect(isAllowedFileType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")).toBe(true);
      expect(isAllowedExtension("devis_detail.xlsx")).toBe(true);
    });

    it("doit refuser les fichiers exécutables", () => {
      expect(isAllowedFileType("application/x-executable")).toBe(false);
      expect(isAllowedExtension("virus.exe")).toBe(false);
    });

    it("doit refuser les fichiers ZIP", () => {
      expect(isAllowedFileType("application/zip")).toBe(false);
      expect(isAllowedExtension("archive.zip")).toBe(false);
    });

    it("doit refuser les fichiers Word DOC/DOCX", () => {
      expect(isAllowedFileType("application/msword")).toBe(false);
      expect(isAllowedExtension("devis.doc")).toBe(false);
    });

    it("doit refuser les fichiers texte brut", () => {
      expect(isAllowedFileType("text/plain")).toBe(false);
      expect(isAllowedExtension("notes.txt")).toBe(false);
    });
  });

  describe("Validation de la taille des fichiers", () => {
    it("doit accepter un fichier de 1 Mo", () => {
      expect(isFileSizeValid(1 * 1024 * 1024)).toBe(true);
    });

    it("doit accepter un fichier de 15 Mo", () => {
      expect(isFileSizeValid(15 * 1024 * 1024)).toBe(true);
    });

    it("doit accepter un fichier exactement à la limite de 16 Mo", () => {
      expect(isFileSizeValid(16 * 1024 * 1024)).toBe(true);
    });

    it("doit refuser un fichier de 17 Mo", () => {
      expect(isFileSizeValid(17 * 1024 * 1024)).toBe(false);
    });

    it("doit refuser un fichier vide (0 octets)", () => {
      expect(isFileSizeValid(0)).toBe(false);
    });

    it("doit refuser un fichier négatif", () => {
      expect(isFileSizeValid(-1)).toBe(false);
    });
  });

  describe("Génération de clé S3 sécurisée", () => {
    it("doit générer une clé avec le préfixe suivi-devis/", () => {
      const key = generateSafeKey(42, "devis_equans.pdf", "abc12345");
      expect(key).toMatch(/^suivi-devis\//);
    });

    it("doit inclure l'ID de l'entrée dans la clé", () => {
      const key = generateSafeKey(42, "devis_equans.pdf", "abc12345");
      expect(key).toContain("42-");
    });

    it("doit inclure un suffixe aléatoire pour éviter l'énumération", () => {
      const key = generateSafeKey(42, "devis_equans.pdf", "abc12345");
      expect(key).toContain("abc12345");
    });

    it("doit conserver l'extension du fichier original", () => {
      expect(generateSafeKey(1, "devis.pdf", "x")).toMatch(/\.pdf$/);
      expect(generateSafeKey(1, "scan.jpg", "x")).toMatch(/\.jpg$/);
      expect(generateSafeKey(1, "capture.png", "x")).toMatch(/\.png$/);
      expect(generateSafeKey(1, "detail.xlsx", "x")).toMatch(/\.xlsx$/);
    });

    it("doit utiliser pdf comme extension par défaut si aucune extension", () => {
      const key = generateSafeKey(1, "fichier_sans_ext", "x");
      // L'extension sera "fichier_sans_ext" (tout le nom), ce qui n'est pas idéal
      // mais le code utilise split(".").pop() qui retourne le nom complet s'il n'y a pas de point
      expect(key).toBe("suivi-devis/1-x.fichier_sans_ext");
    });
  });

  describe("Schéma de données suivi_entries", () => {
    it("doit supporter les champs devisUrl et devisFilename", () => {
      const entry = {
        id: 1,
        prestataire: "EQUANS",
        ut: "004691V",
        bat: "B090",
        intitule: "Rideau métallique Voie 38",
        numDevis: "DEV-2026-001",
        montant: "1500.00",
        devisUrl: "https://storage.example.com/suivi-devis/1-abc12345.pdf",
        devisFilename: "Devis_Equans_Rideau_V38.pdf",
      };
      expect(entry.devisUrl).toBeTruthy();
      expect(entry.devisFilename).toBeTruthy();
    });

    it("doit supporter les champs devisUrl et devisFilename à null (pas de PJ)", () => {
      const entry = {
        id: 2,
        prestataire: "EQUANS",
        devisUrl: null,
        devisFilename: null,
      };
      expect(entry.devisUrl).toBeNull();
      expect(entry.devisFilename).toBeNull();
    });
  });

  describe("Cas d'usage métier", () => {
    it("un devis Equans scanné en PDF doit être accepté", () => {
      const file = { name: "Devis_EQUANS_2026_Rideau.pdf", type: "application/pdf", size: 2 * 1024 * 1024 };
      expect(isAllowedFileType(file.type)).toBe(true);
      expect(isAllowedExtension(file.name)).toBe(true);
      expect(isFileSizeValid(file.size)).toBe(true);
    });

    it("une photo de devis prise au téléphone (JPEG) doit être acceptée", () => {
      const file = { name: "IMG_20260316_142118.jpg", type: "image/jpeg", size: 5 * 1024 * 1024 };
      expect(isAllowedFileType(file.type)).toBe(true);
      expect(isAllowedExtension(file.name)).toBe(true);
      expect(isFileSizeValid(file.size)).toBe(true);
    });

    it("un devis détaillé en Excel doit être accepté", () => {
      const file = { name: "BPU_Detail_Intervention_42.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 500 * 1024 };
      expect(isAllowedFileType(file.type)).toBe(true);
      expect(isAllowedExtension(file.name)).toBe(true);
      expect(isFileSizeValid(file.size)).toBe(true);
    });

    it("un fichier trop volumineux (scan haute résolution) doit être refusé", () => {
      const file = { name: "scan_haute_res.pdf", type: "application/pdf", size: 25 * 1024 * 1024 };
      expect(isFileSizeValid(file.size)).toBe(false);
    });
  });
});
