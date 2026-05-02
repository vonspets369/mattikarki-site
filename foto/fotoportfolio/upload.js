import fs from "fs";
import path from "path";
import ftp from "basic-ftp";
import "dotenv/config";

const root = process.cwd();
const imagesDir = path.join(root, "images");
const jsFile = path.join(root, "photos_all.js");
const toUploadFile = path.join(root, "to-upload.txt");

// OIKEA InfinityFree-polku
const remoteRoot = "/mattikarki.rf.gd/htdocs/foto/fotoportfolio";
const remoteImagesDir = "/mattikarki.rf.gd/htdocs/foto/fotoportfolio/images";

async function upload() {
  if (!fs.existsSync(toUploadFile)) {
    console.log("to-upload.txt puuttuu.");
    return;
  }

  const files = fs.readFileSync(toUploadFile, "utf8")
    .split("\n")
    .map(f => f.trim())
    .filter(Boolean);

  if (!files.length) {
    console.log("Ei mitään uploadattavaa.");
    return;
  }

  const client = new ftp.Client();

  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      secure: false
    });

    console.log("FTP ok");

    await client.cd(remoteImagesDir);
    console.log("Remote folder:", await client.pwd());

    for (const file of files) {
      const localFile = path.join(imagesDir, file);

      if (!fs.existsSync(localFile)) {
        console.log("Puuttuu paikallisesti, skip:", file);
        continue;
      }

      await client.uploadFrom(localFile, file);
      console.log("Upload OK:", file);
    }

    await client.cd(remoteRoot);
    await client.uploadFrom(jsFile, "photos_all.js");
    console.log("Upload OK: photos_all.js");

    fs.writeFileSync(toUploadFile, "", "utf8");
    console.log("Valmis 👍");

  } catch (err) {
    console.error("Virhe:", err.message);
  } finally {
    client.close();
  }
}

upload();