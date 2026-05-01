import fs from "fs";
import path from "path";
import chokidar from "chokidar";
import readlineSync from "readline-sync";
import { exec, execSync } from "child_process";

const root = process.cwd();
const imagesDir = path.join(root, "images");
const jsFile = path.join(root, "photos_all.js");
const toUploadFile = path.join(root, "to-upload.txt");

// 🔥 KORJATTU POLKU (Windows!)
const EXIFTOOL = '"C:\\Program Files\\ExifTool\\exiftool.exe"';

const allowedCats = ["happiness", "sadness", "anger", "fear", "surprise", "disgust", "info"];

function readCurrentImageRefs(js) {
  const matches = [...js.matchAll(/src:\s*['"]images\/([^'"]+\.webp)['"]/gi)];
  return new Set(matches.map(m => m[1].toLowerCase()));
}

function makeTitle(filename) {
  return path.basename(filename, ".webp")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function escapeJsString(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}

function readExif(file) {
  try {
    const filePath = path.join(imagesDir, file);

    const cmd = `${EXIFTOOL} "${filePath}"`;
    const output = execSync(cmd).toString();

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
  } catch (err) {
    console.log("EXIF epäonnistui:", file);
    return "";
  }
}

function askForData(file) {
  console.log("\nUusi kuva:", file);
  console.log("Kategoriat:", allowedCats.join(", "));

  let cat = "";
  while (!allowedCats.includes(cat)) {
    cat = readlineSync.question("Anna kategoria: ").trim();
  }

  const defaultTitle = makeTitle(file);
  const title = readlineSync.question(`Anna title [${defaultTitle}]: `).trim() || defaultTitle;

  const defaultYear = String(new Date().getFullYear());
  const year = readlineSync.question(`Anna vuosi [${defaultYear}]: `).trim() || defaultYear;

  const description = readlineSync.question("Kommentti (vapaa teksti, Enter = ei): ").trim();

  return { cat, title, year, description };
}

function updatePhotosAll(files) {
  let js = fs.readFileSync(jsFile, "utf8");

  const entries = [];

  for (const file of files) {
    const data = askForData(file);

    console.log("Luetaan EXIF:", file);
    const exif = readExif(file);

    console.log("EXIF:", exif || "(ei dataa)");

    const descriptionPart = data.description
      ? `, description: '${escapeJsString(data.description)}'`
      : "";

    const exifPart = exif
      ? `, exif: '${escapeJsString(exif)}'`
      : "";

    entries.push(
      `    { src: 'images/${escapeJsString(file)}', cat: '${escapeJsString(data.cat)}', title: '${escapeJsString(data.title)}', date: '${escapeJsString(data.year)}'${descriptionPart}${exifPart} }`
    );
  }

  js = js.replace(/\n\s*\];\s*$/, `,\n\n    // AUTO ADDED\n${entries.join(",\n")}\n\n];`);

  fs.writeFileSync(jsFile, js, "utf8");
}

function processNewFiles() {
  const js = fs.readFileSync(jsFile, "utf8");
  const existing = readCurrentImageRefs(js);

  const files = fs.readdirSync(imagesDir)
    .filter(f => f.toLowerCase().endsWith(".webp"))
    .filter(f => !existing.has(f.toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (!files.length) {
    console.log("Ei uusia kuvia.");
    return;
  }

  updatePhotosAll(files);

  fs.appendFileSync(toUploadFile, files.join("\n") + "\n", "utf8");

  console.log("Lisätty photos_all.js + to-upload.txt:", files);

  const uploadNow = readlineSync.question("Upload palvelimelle? (y/n): ").toLowerCase();

  if (uploadNow === "y") {
    exec("node upload.js", (err, stdout, stderr) => {
      if (err) {
        console.error("Upload virhe:", err.message);
        return;
      }
      console.log(stdout);
      if (stderr) console.error(stderr);
    });
  }
}

let timer;

function scheduleRun() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      processNewFiles();
    } catch (err) {
      console.error("Virhe:", err.message);
    }
  }, 1000);
}

console.log("Valvotaan kansiota:", imagesDir);

chokidar.watch(imagesDir, {
  ignoreInitial: true,
  awaitWriteFinish: true
}).on("add", filePath => {
  if (filePath.toLowerCase().endsWith(".webp")) {
    scheduleRun();
  }
});