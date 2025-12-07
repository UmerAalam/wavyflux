import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import Footer from "../components/Footer";
import { audioBufferToWav } from "../converters/audioBufferToWav";
import ThemeToggle from "../components/ThemeToggle";
import Header from "../components/Header";
import { Download, Earth, Play, Square, SquareStop } from "lucide-react";
import UploadButton from "../components/UploadButton";
import AudioWaveform from "../components/AudioWaveForm";
import WavyFluxLogo from "../images/WavyFluxLogo.svg";

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

  useEffect(() => {
    if (!play || !playerRef.current) return;
    const interval = setInterval(() => {
      duration &&
        setPosition((pos) => (pos + 0.2 > duration ? duration : pos + 0.2));
    }, 200);
    return () => clearInterval(interval);
  }, [play]);
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
  }, [speed]);
  const onClick = (time: number) => {
    setPosition(time);
    const player = playerRef.current;
    if (!player) return;
    if (play) {
      player.seek(time);
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
      setPosition(0);
    } else {
      const startPosition =
        duration === null
          ? position
          : Math.min(Math.max(0, position), duration);
      setPosition(startPosition);
      player.start(undefined, startPosition);
    }
    setPlay(!play);
  };
  const clearFile = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };
  const exportWavOffline = async (): Promise<void> => {
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

      const wavAB = audioBufferToWav(rendered, { bitDepth: 16 });
      const blob = new Blob([wavAB], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}-WavyFlux.wav`;
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
  return (
    <main className="min-h-screen bg-linear-to-b from-gray-100 via-gray-200 to-gray-300 dark:from-gray-900 dark:via-gray-950 dark:to-black text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center px-4 sm:px-6 transition-colors duration-300">
      {/* Logo + Theme Toggle */}
      <div className="w-full flex justify-between items-start">
        <img
          src={WavyFluxLogo}
          className="size-16 sm:size-20 md:size-24"
          alt="WavyFlux Logo"
        />
        <div className="my-auto">
          <div className="mt-1.5">
            <ThemeToggle />
          </div>
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
            <span className="text-yellow-400 font-black">
              {isNaN(position) ? 0 : Math.floor(position)}s /{" "}
              {isNaN(adjustedDuration!) ? 0 : Math.floor(adjustedDuration!)}s
            </span>
          </label>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={position}
            onChange={(e) => {
              const newPos = parseFloat(e.target.value);
              setPosition(newPos);
              const player = playerRef.current;
              if (!player) return;
              if (play) {
                player.seek(newPos);
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
        <div className="flex flex-col sm:flex-row w-full gap-0 sm:gap-4 justify-evenly">
          <UploadButton
            onClick={() => {
              if (fileLoaded) {
                clearFile();
              } else {
                fileInputRef.current?.click();
              }
            }}
          />
          <button
            onClick={exportWavOffline}
            disabled={!fileLoaded || isExporting}
            className="uppercase w-full mt-6 px-6 py-3
          rounded-lg shadow-md transition font-black text-base sm:text-lg
          bg-blue-500 hover:bg-blue-600
          disabled:bg-gray-700/80 text-white
          flex gap-2 items-center justify-center"
          >
            {isExporting ? (
              <Earth className="animate-spin text-xl sm:text-2xl" size={22} />
            ) : (
              <Download className="text-xl sm:text-2xl" size={22} />
            )}
            {isExporting ? "Exporting..." : "Export"}
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/*"
            className="hidden"
          />
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default SlowedReverb;
