import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

interface AudioWaveformInterface {
  audioSrc: string;
  position: number;
  onClick: (duration: number) => void;
}

//AudioWaveform
const AudioWaveform = ({
  audioSrc,
  position,
  onClick,
}: AudioWaveformInterface) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const ignoreInteractionRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!waveformRef.current || !audioSrc) return;

    wavesurfer.current?.destroy();
    setIsLoading(true);

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#0496ff",
      progressColor: "#d81159",
      cursorColor: "#ffbc42",
      cursorWidth: 3,
      barWidth: 3,
      barRadius: 100,
      barGap: 3,
      backend: "WebAudio",
      normalize: true,
      height: 80,
      autoScroll: true,
      autoCenter: true,
      interact: true,
      dragToSeek: true,
    });

    const handleReady = () => setIsLoading(false);
    const handleError = () => setIsLoading(false);
    const handleLoading = (progress: number) => setIsLoading(progress < 100);

    ws.on("ready", handleReady);
    ws.on("error", handleError);
    ws.on("loading", handleLoading);

    ws.load(audioSrc);
    wavesurfer.current = ws;

    return () => {
      ws.un("ready", handleReady);
      ws.un("error", handleError);
      ws.un("loading", handleLoading);
      ws.destroy();
    };
  }, [audioSrc]);

  useEffect(() => {
    if (!wavesurfer.current) return;

    const ws = wavesurfer.current;
    const handleInteraction = (time: number) => {
      if (ignoreInteractionRef.current) return;
      onClick(time);
    };

    ws.on("interaction", handleInteraction);

    return () => ws.un("interaction", handleInteraction);
  }, [audioSrc, onClick]);

  // 🔹 Update playback position when prop changes
  useEffect(() => {
    if (!wavesurfer.current) return;
    const duration = wavesurfer.current.getDuration();
    if (!duration || position < 0 || position > duration) return;

    // Convert seconds → normalized progress (0–1)
    const progress = position / duration;
    ignoreInteractionRef.current = true;
    wavesurfer.current.seekTo(progress);
    setTimeout(() => {
      ignoreInteractionRef.current = false;
    }, 0);
  }, [position]);

  return (
    <div className="relative flex justify-center items-center h-full w-full">
      {isLoading ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] dark:bg-white/5">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"
              aria-hidden="true"
            />
            <span>Loading waveform...</span>
          </div>
        </div>
      ) : (
        <div ref={waveformRef} className="h-full w-full" />
      )}
    </div>
  );
};

export default AudioWaveform;
