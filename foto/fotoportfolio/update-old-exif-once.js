import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();
const jsFile = path.join(root, "photos_all.js");
const imagesDir = path.join(root, "images");

const EXIFTOOL = '"C:\\Program Files\\ExifTool\\exiftool.exe"';

function escapeJsString(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}

function readExif(imagePath) {
  try {
    const output = execSync(`${EXIFTOOL} "${imagePath}"`).toString();

    const model = output.match(/Camera Model Name\s*:\s*(.+)/)?.[1] || "";
    const aperture = output.match(/F Number\s*:\s*(.+)/)?.[1] || "";
    const shutter = output.match(/Exposure Time\s*:\s*(.+)/)?.[1] || "";
    const iso = output.match(/ISO\s*:\s*(.+)/)?.[1] || "";

    const parts = [];
    if (model) parts.push(model.trim());
    if (aperture) parts.push(`f/${aperture.trim()}`);
    if (shutter) parts.push(shutter.trim());
    if (iso) parts.push(`ISO ${iso.trim()}`);

    return parts.join(" | ");
  } catch {
    return "";
  }
}

let js = fs.readFileSync(jsFile, "utf8");

const photoRegex = /\{[^{}]*src:\s*'images\/([^']+\.webp)'[^{}]*\}/g;

let updated = 0;
let skipped = 0;

js = js.replace(photoRegex, (entry, filename) => {
  if (entry.includes("exif:")) {
    skipped++;
    return entry;
  }

  const imagePath = path.join(imagesDir, filename);

  if (!fs.existsSync(imagePath)) {
    console.log("Puuttuu:", filename);
    skipped++;
    return entry;
  }

  const exif = readExif(imagePath);

  if (!exif) {
    console.log("Ei EXIF-dataa:", filename);
    skipped++;
    return entry;
  }

  updated++;
  console.log("Lisätty EXIF:", filename, "=>", exif);

  return entry.replace(/\s*\}$/, `, exif: '${escapeJsString(exif)}' }`);
});

fs.writeFileSync(jsFile, js, "utf8");

console.log("");
console.log("Valmis.");
console.log("EXIF lisätty:", updated);
console.log("Ohitettu:", skipped);