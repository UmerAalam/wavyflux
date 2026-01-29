import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { spawn } from "child_process";
import { promises as fs, createReadStream } from "fs";
import { tmpdir } from "os";
import path from "path";
import { randomUUID } from "crypto";
import { Readable } from "stream";

type PresetKey = "1080p" | "720p" | "480p" | "360p";

const PRESETS: Record<
  PresetKey,
  {
    height: number;
    bitrateK: number;
  }
> = {
  "1080p": { height: 1080, bitrateK: 9000 },
  "720p": { height: 720, bitrateK: 5500 },
  "480p": { height: 480, bitrateK: 2500 },
  "360p": { height: 360, bitrateK: 1200 },
};

const app = new Hono();
app.use("*", cors());

const bufferFromFile = async (file: File | null) =>
  file ? Buffer.from(await file.arrayBuffer()) : null;

const guessImageExtension = (file?: File | null, fallback = "png") => {
  if (file?.type.startsWith("image/")) {
    const ext = file.type.split("/")[1];
    if (ext) return ext;
  }
  if (file?.name && file.name.includes(".")) {
    return file.name.split(".").pop() || fallback;
  }
  return fallback;
};

app.post("/render", async (c) => {
  const form = await c.req.formData();

  const presetKey = (form.get("preset") as PresetKey | null) || "1080p";
  const preset = PRESETS[presetKey];
  if (!preset) return c.json({ error: "Invalid preset" }, 400);

  const audioFile = form.get("audio") as File | null;
  if (!audioFile) return c.json({ error: "Missing audio file" }, 400);
  const audioBuffer = await bufferFromFile(audioFile);
  if (!audioBuffer) return c.json({ error: "Could not read audio file" }, 400);

  const imageFile = form.get("image") as File | null;
  const imageUrl = (form.get("imageUrl") as string | null) || "";

  let imageBuffer = await bufferFromFile(imageFile);
  let imageExt = guessImageExtension(imageFile);

  if (!imageBuffer && imageUrl) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return c.json({ error: "Could not fetch imageUrl" }, 400);
    }
    const blob = await response.blob();
    imageBuffer = Buffer.from(await blob.arrayBuffer());
    if (blob.type.startsWith("image/")) {
      imageExt = blob.type.split("/")[1];
    }
  }

  if (!imageBuffer) {
    return c.json({ error: "Missing image (file or imageUrl)" }, 400);
  }

  const jobDir = path.join(tmpdir(), `wflux-${randomUUID()}`);
  await fs.mkdir(jobDir, { recursive: true });
  const audioPath = path.join(jobDir, "input.wav");
  const imagePath = path.join(jobDir, `cover.${imageExt}`);
  const outputPath = path.join(jobDir, "output.mp4");

  await fs.writeFile(audioPath, audioBuffer);
  await fs.writeFile(imagePath, imageBuffer);

  const args = [
    "-y",
    "-loop",
    "1",
    "-i",
    imagePath,
    "-i",
    audioPath,
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-tune",
    "stillimage",
    "-pix_fmt",
    "yuv420p",
    "-vf",
    `scale=-2:${preset.height}`,
    "-b:v",
    `${preset.bitrateK}k`,
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-shortest",
    "-movflags",
    "+faststart",
    outputPath,
  ];

  try {
    await runFfmpeg(args);
    // Delay cleanup until the stream is done reading to avoid races.
    const stream = createReadStream(outputPath);
    const cleanup = () =>
      fs.rm(jobDir, { recursive: true, force: true }).catch(() => {});
    stream.on("close", cleanup);
    stream.on("error", cleanup);

    c.header("Content-Type", "video/mp4");
    c.header(
      "Content-Disposition",
      `attachment; filename="wavyflux-${presetKey}.mp4"`,
    );
    const webStream = Readable.toWeb(stream) as unknown as ReadableStream;
    return c.body(webStream);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Render failed" }, 500);
  } finally {
    // Cleanup handled by stream listeners on success; if we threw before
    // creating the stream, clean up here.
    try {
      await fs.access(outputPath);
    } catch {
      await fs.rm(jobDir, { recursive: true, force: true }).catch(() => {});
    }
  }
});

const runFfmpeg = (args: string[]) =>
  new Promise<void>((resolve, reject) => {
    const proc = spawn("ffmpeg", args);
    proc.stderr.on("data", (d) => process.stdout.write(d));
    proc.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)),
    );
  });

const port = Number(process.env.PORT || 8080);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`encoder listening on ${info.port}`);
});
