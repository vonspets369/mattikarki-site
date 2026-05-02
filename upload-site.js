const fs = require("fs");
const path = require("path");
const ftp = require("basic-ftp");
require("dotenv").config();

const localRoot = process.cwd();
const remoteRoot = "/mattikarki.rf.gd/htdocs";

const ignore = new Set([
  "node_modules",
  ".git",
  ".env",
  "upload.js",
  "upload-site.js",
  "to-upload.txt",
  "package-lock.json"
]);

function walk(dir) {
  let files = [];

  for (const item of fs.readdirSync(dir)) {
    if (ignore.has(item)) continue;

    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files = files.concat(walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function uploadSite() {
  const client = new ftp.Client();

  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      secure: false
    });

    console.log("FTP ok");

    const files = walk(localRoot);

    for (const localFile of files) {
      const relativePath = path.relative(localRoot, localFile).replace(/\\/g, "/");
      const remoteFile = `${remoteRoot}/${relativePath}`;
      const remoteDir = path.posix.dirname(remoteFile);

      await client.ensureDir(remoteDir);
      await client.uploadFrom(localFile, remoteFile);

      console.log("Upload OK:", relativePath);
    }

    console.log("✔ Koko sivusto ladattu");
  } catch (err) {
    console.error("Virhe:", err.message);
  } finally {
    client.close();
  }
}

uploadSite();