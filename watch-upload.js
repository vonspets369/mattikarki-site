const fs = require("fs");
const path = require("path");
const ftp = require("basic-ftp");
const chokidar = require("chokidar");
require("dotenv").config();

const localRoot = process.cwd();
const remoteRoot = "/mattikarki.rf.gd/htdocs";

const ignored = [
  "**/node_modules/**",
  "**/.git/**",
  "**/.env",
  "**/upload.js",
  "**/upload-site.js",
  "**/watch-upload.js",
  "**/to-upload.txt",
  "**/package-lock.json"
];

function toRemotePath(localPath) {
  const relativePath = path.relative(localRoot, localPath).replace(/\\/g, "/");
  return `${remoteRoot}/${relativePath}`;
}

async function withFtp(task) {
  const client = new ftp.Client();

  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      secure: false
    });

    await task(client);
  } catch (err) {
    console.error("FTP-virhe:", err.message);
  } finally {
    client.close();
  }
}

async function uploadFile(localPath) {
  if (!fs.existsSync(localPath)) return;

  const remoteFile = toRemotePath(localPath);
  const remoteDir = path.posix.dirname(remoteFile);

  await withFtp(async client => {
    await client.ensureDir(remoteDir);
    await client.uploadFrom(localPath, remoteFile);
    console.log("Upload:", path.relative(localRoot, localPath));
  });
}

async function deleteRemote(localPath) {
  const remoteFile = toRemotePath(localPath);

  await withFtp(async client => {
    await client.remove(remoteFile).catch(() => {});
    console.log("Delete:", path.relative(localRoot, localPath));
  });
}

console.log("Tarkkailen sivustoa...");
console.log("Local:", localRoot);
console.log("Remote:", remoteRoot);

const watcher = chokidar.watch(localRoot, {
  ignored,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 800,
    pollInterval: 100
  }
});

watcher
  .on("add", uploadFile)
  .on("change", uploadFile)
  .on("unlink", deleteRemote);