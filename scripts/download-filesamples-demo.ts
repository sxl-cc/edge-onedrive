import {
  access,
  mkdir,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface Category {
  name: string;
  target: string;
}

interface Sample {
  displayBytes: number;
  fileName: string;
  url: string;
}

interface Failure {
  category: string;
  error: string;
  extension: string;
}

interface DownloadPlan {
  category: string;
  displayBytes: number;
  extension: string;
  sourceName: string;
}

interface SkippedFile {
  category: string;
  extension: string;
  file: string;
}

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const demoRoot = path.join(repoRoot, "demo");
const tmpRoot = path.join(demoRoot, ".filesamples-tmp");
const dryRun = process.argv.includes("--dry-run");
const categoryFilter = getOption("--category");
const extensionFilter = getOption("--extension");

const categories: Category[] = [
  { name: "video", target: "05-media/video" },
  { name: "audio", target: "05-media/audio" },
  { name: "document", target: "06-documents" },
  { name: "image", target: "05-media/images" },
  { name: "font", target: "05-media/fonts" },
  { name: "ebook", target: "06-documents/ebooks" },
  { name: "code", target: "03-code" },
];

function getOption(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1]?.toLowerCase() : undefined;
}

function htmlDecode(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function htmlToText(value: string) {
  return htmlDecode(value.replaceAll(/<[^>]+>/g, "\n")).replaceAll(/\s+/g, " ");
}

function toBytes(sizeText: string) {
  const match = sizeText.match(/([0-9][0-9,]*(?:\.[0-9]+)?)\s*(B|KB|MB|GB)/i);
  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  const value = Number(match[1].replaceAll(",", ""));
  const unit = match[2].toUpperCase();
  if (unit === "GB") {
    return value * 1024 * 1024 * 1024;
  }
  if (unit === "MB") {
    return value * 1024 * 1024;
  }
  if (unit === "KB") {
    return value * 1024;
  }
  return value;
}

function sizeFromText(text: string) {
  const matches = [
    ...text.matchAll(/([0-9][0-9,]*(?:\.[0-9]+)?\s*(?:B|KB|MB|GB))/gi),
  ];
  const firstMatch = matches.at(0);
  return firstMatch ? toBytes(firstMatch[1]) : Number.POSITIVE_INFINITY;
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 edge-onedrive fixture setup" },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }

  return response.text();
}

async function downloadFile(url: string, destination: string) {
  const response = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 edge-onedrive fixture setup" },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
}

async function getFormats(category: string) {
  const html = await fetchText(
    `https://filesamples.com/categories/${category}`
  );
  const formats = [...html.matchAll(/\/formats\/([a-z0-9]+)/gi)].map((match) =>
    match[1].toLowerCase()
  );
  return [...new Set(formats)].sort();
}

async function getSmallestSample(
  category: string,
  extension: string
): Promise<Sample> {
  const html = await fetchText(`https://filesamples.com/formats/${extension}`);
  const pageText = htmlToText(html);
  const linkPattern = new RegExp(
    `href=["'](?<href>/samples/${category}/${extension}/[^"']+)["']`,
    "gi"
  );
  const matches = [...html.matchAll(linkPattern)];

  if (matches.length === 0) {
    throw new Error(
      `No downloadable sample link found for ${category}/${extension}`
    );
  }

  const seenHrefs = new Set<string>();
  const samples = matches.flatMap((match) => {
    const href = match.groups?.href;
    if (!href) {
      throw new Error(`Malformed sample link for ${category}/${extension}`);
    }

    if (seenHrefs.has(href)) {
      return [];
    }
    seenHrefs.add(href);

    const encodedName = href.split("/").at(-1) ?? `sample.${extension}`;
    const fileName = decodeURIComponent(encodedName);

    return {
      url: `https://filesamples.com${href}`,
      fileName,
      nameIndex: pageText.indexOf(fileName),
    };
  });

  const visibleSamples = samples
    .filter((sample) => sample.nameIndex >= 0)
    .sort((left, right) => left.nameIndex - right.nameIndex);

  if (visibleSamples.length === 0) {
    throw new Error(
      `No visible sample names found for ${category}/${extension}`
    );
  }

  return visibleSamples
    .map((sample, index) => {
      const nextSample = visibleSamples[index + 1];
      const blockEnd = nextSample?.nameIndex ?? pageText.length;
      const block = pageText.slice(sample.nameIndex, blockEnd);

      return {
        url: sample.url,
        fileName: sample.fileName,
        displayBytes: sizeFromText(block),
      };
    })
    .sort((left, right) => {
      if (left.displayBytes !== right.displayBytes) {
        return left.displayBytes - right.displayBytes;
      }
      return left.fileName.localeCompare(right.fileName);
    })[0];
}

async function moveChildren(source: string, destination: string) {
  await mkdir(destination, { recursive: true });
  const entries = await readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    await rename(
      path.join(source, entry.name),
      path.join(destination, entry.name)
    );
  }
}

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function replaceDemoFiles() {
  for (const category of categories) {
    const staged = path.join(tmpRoot, category.target);
    const target = path.join(demoRoot, category.target);
    if (await exists(staged)) {
      await moveChildren(staged, target);
    }
  }
}

async function processCategory(
  category: Category,
  downloads: DownloadPlan[],
  skippedFiles: SkippedFile[],
  failures: Failure[]
) {
  const formats = (await getFormats(category.name)).filter(
    (format) => !extensionFilter || format === extensionFilter
  );

  for (const extension of formats) {
    const finalDestination = path.join(
      demoRoot,
      category.target,
      `sample.${extension}`
    );
    if (await exists(finalDestination)) {
      console.log(
        `Skipping ${category.name}/${extension}: sample.${extension} exists`
      );
      skippedFiles.push({
        category: category.name,
        extension,
        file: finalDestination,
      });
      continue;
    }

    try {
      const sample = await getSmallestSample(category.name, extension);
      downloads.push({
        category: category.name,
        extension,
        sourceName: sample.fileName,
        displayBytes: sample.displayBytes,
      });

      const destination = path.join(
        tmpRoot,
        category.target,
        `sample.${extension}`
      );
      console.log(
        `${dryRun ? "Would download" : "Downloading"} ${category.name}/${extension}: ${
          sample.fileName
        }`
      );

      if (!dryRun) {
        await downloadFile(sample.url, destination);
      }
    } catch (error) {
      failures.push({
        category: category.name,
        extension,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

async function main() {
  const downloads: DownloadPlan[] = [];
  const skippedFiles: SkippedFile[] = [];
  const failures: Failure[] = [];
  const selectedCategories = categories.filter(
    (category) => !categoryFilter || category.name === categoryFilter
  );

  if (selectedCategories.length === 0) {
    throw new Error(`Unknown category: ${categoryFilter}`);
  }
  if (!dryRun && (categoryFilter || extensionFilter)) {
    throw new Error(
      "--category and --extension are only supported with --dry-run."
    );
  }

  await rm(tmpRoot, { force: true, recursive: true });
  await mkdir(tmpRoot, { recursive: true });

  try {
    for (const category of selectedCategories) {
      await processCategory(category, downloads, skippedFiles, failures);
    }

    if (!dryRun) {
      await replaceDemoFiles();
      await rm(tmpRoot, { force: true, recursive: true });
    }
  } catch (error) {
    if (!dryRun) {
      console.error("Download failed before replacing existing demo files.");
      console.error(`Staged files are left in ${tmpRoot}`);
    }
    throw error;
  }

  if (skippedFiles.length > 0) {
    console.log("\nSkipped existing files:");
    console.table(
      skippedFiles.map((file) => ({
        category: file.category,
        extension: file.extension,
        file: path.relative(repoRoot, file.file),
      }))
    );
  }

  if (failures.length > 0) {
    console.log("\nSkipped unavailable formats:");
    console.table(failures);
  }

  console.table(
    downloads.map((download) => ({
      category: download.category,
      extension: download.extension,
      source: download.sourceName,
      displaySize: Number.isFinite(download.displayBytes)
        ? `${Math.round(download.displayBytes)} B`
        : "unknown",
    }))
  );
}

await main();
