import { useEffect, useRef } from "react";
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

  useEffect(() => {
    if (!waveformRef.current || !audioSrc) return;

    // Clean up any old instance
    if (wavesurfer.current) {
      wavesurfer.current.destroy();
    }
    // Create a new WaveSurfer instance
    wavesurfer.current = WaveSurfer.create({
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

    // Load audio
    wavesurfer.current.load(audioSrc);
    return () => {
      wavesurfer.current?.destroy();
    };
  }, [audioSrc]);

  useEffect(() => {
    if (!wavesurfer.current) return;

    const ws = wavesurfer.current;
    let lastTime = ws.getCurrentTime();

    const handleSeek = () => {
      const t = ws.getCurrentTime();
      if (t > lastTime) {
        onClick(t);
      }
      lastTime = t;
    };

    ws.on("seeking", handleSeek);

    return () => ws.un("seeking", handleSeek);
  }, [wavesurfer]);

  // 🔹 Update playback position when prop changes
  useEffect(() => {
    if (!wavesurfer.current) return;
    const duration = wavesurfer.current.getDuration();
    if (!duration || position < 0 || position > duration) return;

    // Convert seconds → normalized progress (0–1)
    const progress = position / duration;
    wavesurfer.current.seekTo(progress);
  }, [position]);

  return <div ref={waveformRef} className="w-full" />;
};

export default AudioWaveform;
