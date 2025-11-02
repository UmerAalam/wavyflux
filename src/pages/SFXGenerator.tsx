import { Download, Play, Save, StopCircle } from "lucide-react";
import { useState } from "react";

const SFXGenerator = () => {
  const [waveType, setWaveType] = useState("sine");

  return (
    <main className="min-h-screen bg-linear-to-b from-blue-950 via-black to-gray-950 text-white flex flex-col items-center justify-center px-6 py-16">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-black bg-linear-to-r from-blue-400 to-pink-500 text-transparent tracking-widest bg-clip-text">
          SFX Generator
        </h1>
        <p className="text-white/70 text-md font-black mt-2">
          Modern sound generator with your custom theme
        </p>
      </header>

      <section className="bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Generator Panel */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 flex flex-col space-y-4 shadow-inner">
          <h2 className="text-lg font-black text-yellow-400">Generator</h2>

          <button className="bg-blue-600 hover:bg-blue-500 p-3 rounded-lg shadow font-black">
            Random
          </button>

          {[
            "Coin",
            "Laser",
            "Explosion",
            "Power Up",
            "Jump",
            "Hit",
            "Select",
            "Click",
          ].map((label) => (
            <button
              key={label}
              className="bg-gray-800 hover:bg-gray-700 p-2 rounded-lg text-left font-black transition"
            >
              {label}
            </button>
          ))}
          <button className="bg-pink-600 hover:bg-pink-500 p-3 rounded-lg font-black mt-4 shadow">
            Mutate
          </button>
        </div>

        {/* Control Panel */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 flex flex-col space-y-6 shadow-inner">
          <h2 className="text-lg font-black text-blue-400">Controls</h2>

          {/* Wave Type */}
          <div>
            <label className="block mb-2 text-sm text-white/80 font-black">
              Wave Type
            </label>
            <div className="flex gap-3 flex-wrap">
              {["Square", "Saw", "Sine", "Noise"].map((type) => (
                <button
                  key={type}
                  onClick={() => setWaveType(type)}
                  className={`px-4 py-2 rounded-lg font-black ${
                    waveType === type
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Example Control Group */}
          <div>
            <label className="block mb-2 text-sm text-white/80 font-black">
              Attack Time
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              className="w-full accent-yellow-400"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-white/80 font-black">
              Decay Time
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              className="w-full accent-pink-500"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-white/80 font-black">
              Frequency
            </label>
            <input
              type="range"
              min="0"
              max="2000"
              step="1"
              className="w-full accent-blue-500"
            />
          </div>
        </div>

        {/* Sound Panel */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 flex flex-col space-y-6 shadow-inner">
          <h2 className="text-lg font-black text-green-400">Sound</h2>

          <div className="flex gap-4">
            <button className="bg-green-600 hover:bg-green-500 p-4 rounded-full shadow">
              <Play size={20} />
            </button>
            <button className="bg-red-600 hover:bg-red-500 p-4 rounded-full shadow">
              <StopCircle size={20} />
            </button>
          </div>

          <div>
            <label className="block mb-2 text-sm text-white/80 font-black">
              Volume
            </label>
            <input
              type="range"
              min="-30"
              max="0"
              step="1"
              className="w-full accent-green-400"
            />
          </div>

          <div className="flex justify-between items-center">
            <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
              <Save /> Save
            </button>
            <button className="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
              <Download /> Export
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};
export default SFXGenerator;
