import { useEffect, useRef, useState } from "react";
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import ffmpegCoreURL from "@ffmpeg/core?url";
import ffmpegCoreWasm from "@ffmpeg/core/wasm?url";
import * as Tone from "tone";
import {
  AudioBufferSource,
  BufferTarget,
  Mp3OutputFormat,
  Output,
  WavOutputFormat,
  canEncodeAudio,
} from "mediabunny";
import { registerMp3Encoder } from "@mediabunny/mp3-encoder";
import Footer from "../components/Footer";
import ThemeToggle from "../components/ThemeToggle";
import Header from "../components/Header";
import { Download, Earth, Play, Square, SquareStop } from "lucide-react";
import UploadButton from "../components/UploadButton";
import AudioWaveform from "../components/AudioWaveForm";
import WavyFluxLogo from "../images/WavyFluxLogo.svg";

type ExportFormat = "wav" | "mp3";
type VideoPresetKey = "2160p" | "1440p" | "1080p" | "720p" | "480p" | "360p" | "240p" | "144p";

type VideoPreset = {
  label: string;
  height: number;
  bitrateKbps: number;
};
type FetchFileFn = (input: any) => Promise<Uint8Array>;

type AudioBufferLike =
  | AudioBuffer
  | {
      getChannelData: (channel: number) => Float32Array;
      numberOfChannels: number;
      length: number;
      sampleRate: number;
    };

const VIDEO_QUALITY_PRESETS: Record<VideoPresetKey, VideoPreset> = {
  "2160p": { label: "2160p (4K)", height: 2160, bitrateKbps: 45000 },
  "1440p": { label: "1440p (QHD)", height: 1440, bitrateKbps: 20000 },
  "1080p": { label: "1080p (HD)", height: 1080, bitrateKbps: 9000 },
  "720p": { label: "720p", height: 720, bitrateKbps: 5500 },
  "480p": { label: "480p", height: 480, bitrateKbps: 2500 },
  "360p": { label: "360p", height: 360, bitrateKbps: 1200 },
  "240p": { label: "240p", height: 240, bitrateKbps: 700 },
  "144p": { label: "144p", height: 144, bitrateKbps: 400 },
};
const VIDEO_PRESET_ORDER: VideoPresetKey[] = [
  "1080p",
  "720p",
  "480p",
  "360p",
  "240p",
  "144p",
  "1440p",
  "2160p",
];

let mp3EncoderReady = false;
const ensureMp3Encoder = async () => {
  if (mp3EncoderReady) return;
  if (!(await canEncodeAudio("mp3"))) {
    registerMp3Encoder();
  }
  mp3EncoderReady = true;
};

const ensureNativeAudioBuffer = (buffer: AudioBufferLike): AudioBuffer => {
  if (buffer instanceof AudioBuffer) return buffer;
  const { numberOfChannels, length, sampleRate } = buffer;
  const nativeBuffer = new AudioBuffer({
    length,
    numberOfChannels,
    sampleRate,
  });
  for (let ch = 0; ch < numberOfChannels; ch++) {
    //@ts-ignore
    nativeBuffer.copyToChannel(buffer.getChannelData(ch), ch);
  }
  return nativeBuffer;
};

const encodeWithMediabunny = async (
  buffer: AudioBuffer,
  format: ExportFormat,
) => {
  const audioBuffer = ensureNativeAudioBuffer(buffer);

  if (format === "mp3") {
    await ensureMp3Encoder();
  }

  const target = new BufferTarget();
  const output = new Output({
    format: format === "mp3" ? new Mp3OutputFormat() : new WavOutputFormat(),
    target,
  });

  const source = new AudioBufferSource(
    format === "mp3"
      ? { codec: "mp3", bitrate: 192000, bitrateMode: "variable" }
      : { codec: "pcm-s16" },
  );

  output.addAudioTrack(source);
  await output.start();
  await source.add(audioBuffer);
  source.close();
  await output.finalize();

  if (!target.buffer) {
    throw new Error("Encoding failed");
  }

  return new Blob([target.buffer], {
    type: format === "mp3" ? "audio/mpeg" : "audio/wav",
  });
};

const getExtensionFromMime = (mime?: string | null, fallback = "png") => {
  if (!mime) return fallback;
  const match = mime.match(/image\/([a-zA-Z0-9.+-]+)/);
  return match?.[1] || fallback;
};

const guessImageExtension = (
  file?: File | null,
  url?: string | null,
  fallback = "png",
) => {
  if (file?.type) return getExtensionFromMime(file.type, fallback);
  if (file?.name) {
    const ext = file.name.split(".").pop();
    if (ext) return ext.toLowerCase();
  }
  if (url) {
    const urlExt = url.split(".").pop();
    if (urlExt && urlExt.length <= 5) return urlExt.toLowerCase().split(/\W/)[0];
  }
  return fallback;
};

const SlowedReverb = () => {
  const [speed, setSpeed] = useState(1);
  const [reverb, setReverb] = useState(0.4);
  const [play, setPlay] = useState(false);
  const [fileLoaded, setFileLoaded] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | undefined>();
  const playerRef = useRef<Tone.Player | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const recorderRef = useRef<Tone.Recorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);
  const [adjustedDuration, setAdjustedDuration] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>("");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("wav");
  const [videoPreset, setVideoPreset] = useState<VideoPresetKey>("1080p");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isVideoExporting, setIsVideoExporting] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const positionRef = useRef(0);
  const playStartRef = useRef<number | null>(null);
  const prevSpeedRef = useRef<number>(1);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const fetchFileRef = useRef<FetchFileFn | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const speedSafe = Math.max(speed, 0.0001);
  const encoderApiUrl = (
    (import.meta as any).env?.VITE_ENCODER_API_URL as string | undefined
  )?.trim();

  const clampToDuration = (value: number) =>
    duration === null ? value : Math.min(Math.max(0, value), duration);

  const setPositionSafe = (value: number) => {
    const clamped = clampToDuration(value);
    positionRef.current = clamped;
    setPosition(clamped);
  };

  const getPlaybackPosition = () => {
    if (!playStartRef.current) return positionRef.current;
    const elapsed = Tone.now() - playStartRef.current;
    const raw = elapsed * speedSafe;
    return clampToDuration(raw);
  };

  useEffect(() => {
    if (!play || !playerRef.current) return;
    let frame: number;
    const tick = () => {
      setPositionSafe(getPlaybackPosition());
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [play, speed, duration]);
  useEffect(() => {
    if (duration) {
      const adjusted = duration / speed;
      setAdjustedDuration(adjusted);
    }
  }, [duration, speed]);
  useEffect(() => {
    const setupAudio = async () => {
      playerRef.current?.dispose();
      reverbRef.current?.dispose();
      recorderRef.current?.dispose();
      const reverbNode = new Tone.Reverb({ decay: 5, wet: reverb });
      await reverbNode.generate();
      const recorder = new Tone.Recorder(); // NEW
      const player = new Tone.Player({ autostart: false });
      player.connect(reverbNode);
      reverbNode.toDestination();
      reverbNode.connect(recorder);
      playerRef.current = player;
      reverbRef.current = reverbNode;
      recorderRef.current = recorder;
    };
    setupAudio();
    return () => {
      playerRef.current?.dispose();
      reverbRef.current?.dispose();
      recorderRef.current?.dispose();
    };
  }, []);
  useEffect(() => {
    if (reverbRef.current) {
      reverbRef.current.wet.value = reverb;
    }
  }, [reverb]);
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.playbackRate = speed;
    }
    if (play) {
      const elapsed = playStartRef.current
        ? Tone.now() - playStartRef.current
        : 0;
      const currentPos = clampToDuration(elapsed * prevSpeedRef.current);
      playerRef.current?.seek(currentPos);
      setPositionSafe(currentPos);
      playStartRef.current = Tone.now() - currentPos / speedSafe;
    }
    prevSpeedRef.current = speed;
  }, [speed, play]);
  const onClick = (time: number) => {
    const newPosition = clampToDuration(time);
    setPositionSafe(newPosition);
    const player = playerRef.current;
    if (!player) return;
    if (play) {
      player.seek(newPosition);
      playStartRef.current = Tone.now() - newPosition / speedSafe;
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setAudioSrc(url);
    setFileLoaded(true);
    if (playerRef.current) {
      playerRef.current.load(url).then(() => {
        setDuration(playerRef.current!.buffer.duration);
      });
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImageUrl("");
  };

  const handleImageUrlUpdate = (value: string) => {
    setImageUrl(value);
    if (value.trim()) {
      setImageFile(null);
    }
  };
  const handlePlayPause = async () => {
    await Tone.start();
    const player = playerRef.current;
    if (!player) return;
    if (play) {
      player.stop();
      setPositionSafe(0);
      playStartRef.current = null;
    } else {
      const startPosition =
        duration === null
          ? position
          : Math.min(Math.max(0, position), duration);
      setPositionSafe(startPosition);
      playStartRef.current = Tone.now() - startPosition / speedSafe;
      player.start(undefined, startPosition);
    }
    setPlay(!play);
  };
  const clearFile = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const renderProcessedAudioBuffer = async (): Promise<AudioBuffer | null> => {
    const player = playerRef.current;
    if (!player || !player.buffer || !duration) return null;
    const renderTime = duration / speedSafe;
    const rendered = (await (Tone.Offline(async (ctx) => {
      const p = new Tone.Player(player.buffer);
      const r = new Tone.Reverb({ decay: 5, wet: reverb });
      await r.generate();
      p.playbackRate = speed;
      p.connect(r);
      r.connect(ctx.destination);
      p.start(0, 0);
    }, renderTime) as unknown)) as AudioBuffer;
    return rendered;
  };

  const downloadBlob = (blob: Blob, downloadName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const getBaseExportName = () =>
    fileName?.replace(/\.[^/.]+$/, "") || "audio";

  const exportOffline = async (format: ExportFormat): Promise<void> => {
    const player = playerRef.current;
    if (!player || !player.buffer) return;
    setIsExporting(true);
    try {
      const rendered = await renderProcessedAudioBuffer();
      if (!rendered) {
        throw new Error("Nothing to render. Please upload audio first.");
      }
      const blob = await encodeWithMediabunny(rendered, format);
      downloadBlob(blob, `${getBaseExportName()}-WavyFlux.${format}`);
    } catch (err) {
      console.error("Offline export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const loadFfmpeg = async (): Promise<{
    ffmpeg: FFmpeg;
    fetchFile: FetchFileFn;
  }> => {
    if (ffmpegRef.current && fetchFileRef.current) {
      return { ffmpeg: ffmpegRef.current, fetchFile: fetchFileRef.current };
    }
    const [{ FFmpeg }, { fetchFile }] = await Promise.all([
      import("@ffmpeg/ffmpeg"),
      import("@ffmpeg/util"),
    ]);
    const instance = new FFmpeg();
    instance.on("progress", ({ progress }) => {
      setVideoProgress(Math.round(progress * 100));
    });
    await instance.load({
      coreURL: ffmpegCoreURL,
      wasmURL: ffmpegCoreWasm,
    });
    ffmpegRef.current = instance;
    fetchFileRef.current = fetchFile as FetchFileFn;
    return { ffmpeg: instance, fetchFile: fetchFile as FetchFileFn };
  };

  const getImageForFfmpeg = async (fetchFile: FetchFileFn) => {
    if (imageFile) {
      const ext = guessImageExtension(imageFile);
      return {
        name: `cover.${ext}`,
        bytes: await fetchFile(imageFile),
      };
    }
    if (!imageUrl.trim()) {
      throw new Error("Please upload an image or paste an image URL.");
    }
    const response = await fetch(imageUrl.trim());
    if (!response.ok) {
      throw new Error("Could not download image from the provided URL.");
    }
    const blob = await response.blob();
    const ext = guessImageExtension(null, imageUrl, getExtensionFromMime(blob.type));
    return {
      name: `cover.${ext}`,
      bytes: await fetchFile(blob),
    };
  };

  const exportVideoWithImageLocal = async () => {
    if (!fileLoaded) {
      setVideoError("Upload and process audio first.");
      return;
    }
    if (!imageFile && !imageUrl.trim()) {
      setVideoError("Upload an image or paste an image URL.");
      return;
    }
    setVideoError(null);
    setIsVideoExporting(true);
    setVideoProgress(0);
    try {
      const rendered = await renderProcessedAudioBuffer();
      if (!rendered) {
        throw new Error("Nothing to render. Please upload audio first.");
      }
      const audioBlob = await encodeWithMediabunny(rendered, "wav");
      const { ffmpeg, fetchFile } = await loadFfmpeg();
      await ffmpeg.writeFile("input.wav", await fetchFile(audioBlob));
      const image = await getImageForFfmpeg(fetchFile);
      await ffmpeg.writeFile(image.name, image.bytes);
      const preset = VIDEO_QUALITY_PRESETS[videoPreset];

      await ffmpeg.exec([
        "-y",
        "-loop",
        "1",
        "-i",
        image.name,
        "-i",
        "input.wav",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-tune",
        "stillimage",
        "-pix_fmt",
        "yuv420p",
        "-vf",
        `scale=-2:${preset.height}`,
        "-b:v",
        `${preset.bitrateKbps}k`,
        "-c:a",
        "aac",
        "-b:a",
        "160k",
        "-shortest",
        "-movflags",
        "+faststart",
        "output.mp4",
      ]);

      const data = await ffmpeg.readFile("output.mp4");
      if (!(data instanceof Uint8Array)) {
        throw new Error("Unexpected video data format from FFmpeg.");
      }
      const videoBlob = new Blob([new Uint8Array(data)], { type: "video/mp4" });
      setVideoProgress(100);
      downloadBlob(
        videoBlob,
        `${getBaseExportName()}-WavyFlux-${videoPreset}.mp4`,
      );
    } catch (err) {
      console.error("Video export failed:", err);
      setVideoError(
        err instanceof Error
          ? err.message
          : "Video export failed. Please try again.",
      );
    } finally {
      setIsVideoExporting(false);
      setVideoProgress(null);
    }
  };

  const exportVideoViaBackend = async () => {
    if (!encoderApiUrl) {
      throw new Error("Encoder API URL not configured.");
    }
    if (!fileLoaded) {
      setVideoError("Upload and process audio first.");
      return;
    }
    if (!imageFile && !imageUrl.trim()) {
      setVideoError("Upload an image or paste an image URL.");
      return;
    }
    setVideoError(null);
    setIsVideoExporting(true);
    setVideoProgress(null);
    try {
      const rendered = await renderProcessedAudioBuffer();
      if (!rendered) {
        throw new Error("Nothing to render. Please upload audio first.");
      }
      const audioBlob = await encodeWithMediabunny(rendered, "wav");
      const formData = new FormData();
      const audioName = `${getBaseExportName()}-WavyFlux.wav`;
      formData.append(
        "audio",
        new File([audioBlob], audioName, { type: "audio/wav" }),
      );
      if (imageFile) {
        formData.append("image", imageFile);
      } else if (imageUrl.trim()) {
        formData.append("imageUrl", imageUrl.trim());
      }
      formData.append("preset", videoPreset);

      const target = `${encoderApiUrl.replace(/\/$/, "")}/render`;
      const response = await fetch(target, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Backend render failed (${response.status})`);
      }
      const videoBlob = await response.blob();
      downloadBlob(
        videoBlob,
        `${getBaseExportName()}-WavyFlux-${videoPreset}.mp4`,
      );
      setVideoProgress(100);
    } catch (err) {
      console.error("Backend video export failed:", err);
      setVideoError(
        err instanceof Error
          ? err.message
          : "Video export failed. Please try again.",
      );
      throw err;
    } finally {
      setIsVideoExporting(false);
      setVideoProgress(null);
    }
  };

  const exportVideoWithImage = async () => {
    if (encoderApiUrl) {
      try {
        await exportVideoViaBackend();
        return;
      } catch {
        // fallback to local ffmpeg wasm
      }
    }
    await exportVideoWithImageLocal();
  };
  return (
    <main className="min-h-screen bg-linear-to-b from-gray-100 via-gray-200 to-gray-300 dark:from-gray-900 dark:via-gray-950 dark:to-black text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center px-4 sm:px-6 transition-colors duration-300">
      {/* Logo + Theme Toggle */}
      <div className="w-full flex justify-between items-center">
        <img
          src={WavyFluxLogo}
          className="size-16 sm:size-20 md:size-24"
          alt="WavyFlux Logo"
        />
        <div className="my-auto">
          <ThemeToggle />
        </div>
      </div>
      <Header />
      {/* Main Card */}
      <section
        className="backdrop-blur-xl dark:bg-white/5 bg-black/5
    dark:border-white/70
    rounded-2xl shadow-2xl
    w-full max-w-lg 
    p-4 sm:p-8
    flex flex-col items-center space-y-4
    transition-colors duration-300"
      >
        <div
          className="font-black w-full h-20 sm:h-24 
      bg-gray-300/50 dark:bg-gray-800/60 
      rounded-lg relative overflow-hidden
      flex justify-center items-center
      text-gray-600 dark:text-gray-300
      transition-colors duration-300"
        >
          {audioSrc ? (
            <AudioWaveform
              onClick={onClick}
              position={position}
              audioSrc={audioSrc}
            />
          ) : (
            "Upload an audio file to see waveform"
          )}
        </div>

        {/* Player/Stop Buttons */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            disabled={!fileLoaded}
            onClick={handlePlayPause}
            className="p-4 rounded-full disabled:bg-gray-700/80 shadow-md transition bg-blue-500 hover:bg-blue-600 text-white"
          >
            {play ? (
              <SquareStop size={22} />
            ) : (
              <Play size={22} className="ml-0.5" />
            )}
          </button>

          <button
            disabled={!fileLoaded}
            onClick={clearFile}
            className="p-4 rounded-full shadow-md transition
          bg-pink-500 hover:bg-pink-600
          disabled:bg-gray-700/80 text-white"
          >
            <Square size={22} />
          </button>
        </div>

        {/* Seek Slider */}
        <div className="w-full">
          <label className="block mb-2 text-xs sm:text-sm font-black text-gray-600 dark:text-gray-300">
            Timeline:{" "}
            <span className="text-black/80 dark:text-yellow-400 font-black">
              {isNaN(position) ? 0 : Math.floor(position / speedSafe)}s /{" "}
              {isNaN(adjustedDuration!) ? 0 : Math.floor(adjustedDuration!)}s
            </span>
          </label>
          <input
            type="range"
            min="0"
            max={adjustedDuration || 0}
            step="0.1"
            value={position / speedSafe}
            onChange={(e) => {
              const displayPos = parseFloat(e.target.value);
              const newPos = clampToDuration(displayPos * speedSafe);
              setPositionSafe(newPos);
              const player = playerRef.current;
              if (!player) return;
              if (play) {
                player.seek(newPos);
                playStartRef.current = Tone.now() - newPos / speedSafe;
              }
            }}
            className="w-full accent-yellow-500"
          />
        </div>

        {/* Speed Slider */}
        <div className="w-full">
          <label className="block mb-2 text-xs sm:text-sm font-black text-gray-600 dark:text-gray-300">
            Playback Speed:{" "}
            <span className="text-blue-400 font-black">
              {speed.toFixed(2)}x
            </span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.05"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>

        {/* Reverb Slider */}
        <div className="w-full">
          <label className="block mb-2 text-xs sm:text-sm font-black text-gray-600 dark:text-gray-300">
            Reverb Intensity:{" "}
            <span className="text-pink-400 font-black">
              {Math.round(reverb * 100)}%
            </span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={reverb}
            onChange={(e) => setReverb(parseFloat(e.target.value))}
            className="w-full accent-pink-500"
          />
        </div>

        {/* Upload + Export */}
        <div className="flex justify-center flex-col md:flex-row w-full gap-3 sm:flex-row sm:items-center sm:gap-4">
          <UploadButton
            onClick={() => {
              if (fileLoaded) {
                clearFile();
              } else {
                fileInputRef.current?.click();
              }
            }}
            className="mt-2 sm:mt-0 sm:w-1/3"
          />
          <button
            onClick={() => exportOffline(exportFormat)}
            disabled={!fileLoaded || isExporting}
            className="uppercase min-w-50 w-full px-6 py-3
            rounded-lg shadow-md transition font-black text-base sm:text-lg
            bg-blue-500 hover:bg-blue-600
            disabled:bg-gray-700/80 text-white
            flex gap-2 items-center justify-center sm:w-auto"
          >
            {isExporting ? (
              <Earth className="animate-spin text-xl sm:text-2xl" size={22} />
            ) : (
              <Download className="text-xl sm:text-2xl" size={22} />
            )}
            {isExporting ? "Exporting..." : `Export ${exportFormat.toString()}`}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*"
              className="hidden"
            />
          </button>
        </div>
        <span className="text-lg font-black text-gray-600 dark:text-gray-300">
          Export format
        </span>
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-blue-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        >
          <option value="wav">WAV (lossless)</option>
          <option value="mp3">MP3 (compressed)</option>
        </select>
        <div className="w-full h-px bg-gray-400/30 dark:bg-white/10" />
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-gray-600 dark:text-gray-300">
              Video export (image + slowed audio)
            </span>
            {videoProgress !== null && (
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                {isVideoExporting ? "Rendering" : "Ready"} · {videoProgress}%
              </span>
            )}
          </div>
          {videoError && (
            <p className="text-sm text-red-500 dark:text-red-400">
              {videoError}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="uppercase min-w-50 w-full px-4 py-3 rounded-lg shadow-md transition font-black text-sm sm:text-base bg-pink-500 hover:bg-pink-600 disabled:bg-gray-700/80 text-white flex gap-2 items-center justify-center"
            >
              Upload image
            </button>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => handleImageUrlUpdate(e.target.value)}
              placeholder="Or paste image URL (https://...)"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-blue-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            <input
              type="file"
              accept="image/*"
              ref={imageInputRef}
              onChange={handleImageFileChange}
              className="hidden"
            />
          </div>
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            {imageFile
              ? `Using uploaded image: ${imageFile.name}`
              : imageUrl
                ? `Using image URL`
                : "Add an image (file upload or URL) to render the video."}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <select
              value={videoPreset}
              onChange={(e) => setVideoPreset(e.target.value as VideoPresetKey)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-blue-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white sm:flex-1"
            >
              {VIDEO_PRESET_ORDER.map((key) => (
                <option key={key} value={key}>
                  {VIDEO_QUALITY_PRESETS[key].label} · ~
                  {VIDEO_QUALITY_PRESETS[key].bitrateKbps} kbps
                </option>
              ))}
            </select>
            <button
              onClick={exportVideoWithImage}
              disabled={
                !fileLoaded || isVideoExporting || (!imageFile && !imageUrl.trim())
              }
              className="uppercase min-w-50 w-full px-6 py-3 rounded-lg shadow-md transition font-black text-base sm:text-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700/80 text-white flex gap-2 items-center justify-center sm:w-auto"
            >
              {isVideoExporting ? (
                <Earth
                  className="animate-spin text-xl sm:text-2xl"
                  size={22}
                />
              ) : (
                <Download className="text-xl sm:text-2xl" size={22} />
              )}
              {isVideoExporting
                ? "Rendering video..."
                : `Export video${encoderApiUrl ? " (backend)" : ""}`}
            </button>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Uses YouTube-like presets. 1080p is default; if a backend URL is
            configured, exports use the backend. Otherwise it falls back to
            in-browser FFmpeg (slower).
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default SlowedReverb;
