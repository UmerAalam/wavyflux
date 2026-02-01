import { useEffect, useRef, useState } from "react";
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
import { Download, Earth, Octagon, OctagonPause, OctagonX } from "lucide-react";
import UploadButton from "../components/UploadButton";
import AudioWaveform from "../components/AudioWaveForm";
import WavyFluxLogo from "../images/WavyFluxLogo.svg";
import Button from "../components/Button";
import ExportDropdown from "../components/ExportDropdown";

type ExportFormat = "wav" | "mp3";

type AudioBufferLike =
  | AudioBuffer
  | {
      getChannelData: (channel: number) => Float32Array;
      numberOfChannels: number;
      length: number;
      sampleRate: number;
    };

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

const SlowedReverb = () => {
  const [speed, setSpeed] = useState(0.85);
  const [reverb, setReverb] = useState(0.4);
  const [play, setPlay] = useState(false);
  const [fileLoaded, setFileLoaded] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(1);
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
  const positionRef = useRef(0);
  const playStartRef = useRef<number | null>(null);
  const prevSpeedRef = useRef<number>(1);
  const speedSafe = Math.max(speed, 0.0001);
  const isPresetSlowed = speed === 0.75 && reverb === 0.6;
  const isPresetSpeedUp = speed === 1.2 && reverb === 0;
  const isDefault = speed === 0.85 && reverb === 0.4;
  const showCustom = !isPresetSlowed && !isPresetSpeedUp && !isDefault;

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
  useEffect(() => {
    if (isPresetSlowed) {
      setSelectedPreset(0);
    }
    if (isDefault) {
      setSelectedPreset(1);
    }
    if (isPresetSpeedUp) {
      setSelectedPreset(2);
    }
    if (showCustom) {
      setSelectedPreset(4);
    }
  }, [showCustom, isDefault, isPresetSlowed, isPresetSpeedUp]);

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

  const exportOffline = async (format: ExportFormat): Promise<void> => {
    const player = playerRef.current;
    if (!player || !player.buffer) return;
    setIsExporting(true);
    try {
      const renderTime = duration! / Math.max(0.0001, speed);
      const rendered = (await (Tone.Offline(async (ctx) => {
        const p = new Tone.Player(player.buffer);
        const r = new Tone.Reverb({ decay: 5, wet: reverb });
        await r.generate();
        p.playbackRate = speed;
        p.connect(r);
        r.connect(ctx.destination);
        p.start(0, 0);
      }, renderTime) as unknown)) as AudioBuffer;

      const blob = await encodeWithMediabunny(rendered, format);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const baseName = fileName?.replace(/\.[^/.]+$/, "") || "audio";
      a.download = `${baseName}-WavyFlux.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Offline export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };
  const handlePreset = (speed: number, reverb: number) => {
    if (speed !== undefined) {
      setSpeed(speed);
    }
    if (reverb !== undefined) {
      setReverb(reverb);
    }
  };
  const presets = (
    <div className="flex justify-center items-center gap-3">
      <Button
        onClick={() => {
          handlePreset(0.75, 0.6);
          setSelectedPreset(0);
        }}
        className={`${selectedPreset === 0 ? "text-pink-500 bg-pink-500/10 dark:text-pink-500 dark:bg-pink-500/10" : "dark:bg-white/5 bg-black/5 text-gray-600 dark:text-white"} hover:text-pink-500 hover:bg-pink-500/10`}
      >
        SLOWED
      </Button>
      {showCustom ? (
        <Button className={`text-yellow-500 bg-yellow-500/10`}>CUSTOM</Button>
      ) : (
        <Button
          onClick={() => {
            handlePreset(0.85, 0.4);
            setSelectedPreset(1);
          }}
          className={`${selectedPreset === 1 ? "text-blue-500 bg-blue-500/10 dark:text-blue-500 dark:bg-blue-500/10" : "dark:bg-white/5 bg-black/5 text-gray-600 dark:text-white"} hover:text-blue-500 hover:bg-blue-500/10`}
        >
          DEFAULT
        </Button>
      )}
      <Button
        onClick={() => {
          handlePreset(1.2, 0);
          setSelectedPreset(2);
        }}
        className={`${selectedPreset === 2 ? "text-emerald-500 bg-emerald-500/10 dark:text-emerald-500 dark:bg-emerald-500/10" : "dark:bg-white/5 bg-black/5 text-gray-600 dark:text-white"} hover:text-emerald-500 hover:bg-emerald-500/10`}
      >
        SPEED UP
      </Button>
    </div>
  );

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
    rounded-2xl
    w-full max-w-lg
    p-4 sm:p-8
    flex flex-col items-center space-y-4
    transition-colors duration-300"
      >
        <div
          className="font-black w-full h-full p-3 
      bg-gray-300/50 dark:bg-gray-800/60 
      rounded-full relative overflow-hidden
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
            className="p-2 rounded-full disabled:bg-gray-700/80 transition bg-blue-500 hover:bg-blue-600 text-white"
          >
            {play ? <OctagonPause size={30} /> : <Octagon size={30} />}
          </button>

          <button
            disabled={!fileLoaded}
            onClick={clearFile}
            className="p-2 rounded-full transition
          bg-pink-500 hover:bg-pink-600
          disabled:bg-gray-700/80 text-white"
          >
            <OctagonX size={30} />
          </button>
        </div>

        {presets}

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
            rounded-full transition font-black text-base sm:text-lg
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
        <ExportDropdown
          exportFormat={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
        />
      </section>
      <Footer />
    </main>
  );
};

export default SlowedReverb;
