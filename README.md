# 🌊 WavyFlux

> **Slow it down. Add depth. Let the vibes flow.**

WavyFlux is a browser-based **Slowed + Reverb audio generator** built for creators who want to transform their music into dreamy, atmospheric sound.

Upload an audio file, tweak the playback speed and reverb, preview the result, and export your processed audio as a WAV file — entirely from the browser.

<p align="center">
  <a href="https://wavyflux.pages.dev/">🌐 Live Demo</a>
  ·
  <a href="#features">✨ Features</a>
  ·
  <a href="#getting-started">🚀 Getting Started</a>
</p>

---

## ✨ Features

* 🎵 **Audio Upload**

  * Upload your own audio files directly in the browser.

* 🌊 **Waveform Visualization**

  * Visualize your audio while working with it.

* 🐌 **Slowed Mode**

  * Reduce playback speed for that classic slowed-down sound.

* ⚡ **Speed Up Mode**

  * Quickly increase playback speed.

* 🎛️ **Playback Speed Control**

  * Fine-tune the playback speed to get the sound exactly where you want it.

* 🌫️ **Reverb Control**

  * Adjust the intensity of the reverb effect.

* 🎚️ **Presets**

  * Quickly switch between available processing modes.

* ▶️ **Real-time Preview**

  * Listen to your changes before exporting.

* 💾 **WAV Export**

  * Export your processed audio as a WAV file.

* 🖥️ **Runs in the Browser**

  * No desktop application or complicated setup required.

---

## 🎧 How It Works

```text
          ┌──────────────┐
          │  Upload Song  │
          └───────┬──────┘
                  │
                  ▼
          ┌──────────────┐
          │ Audio Engine │
          └───────┬──────┘
                  │
          ┌───────┴────────┐
          │                │
          ▼                ▼
     Playback Speed     Reverb
          │                │
          └───────┬────────┘
                  │
                  ▼
          ┌──────────────┐
          │    Preview   │
          └───────┬──────┘
                  │
                  ▼
          ┌──────────────┐
          │   Export WAV │
          └──────────────┘
```

---

## 🖼️ Preview

<img width="1862" height="1003" alt="image" src="https://github.com/user-attachments/assets/f6df0409-3b7d-4afd-9f38-31db5614d596" />

> Visit the live application to try WavyFlux directly in your browser.

**[🌐 Open WavyFlux](https://wavyflux.pages.dev/)**

---

## 🚀 Getting Started

### Prerequisites

Make sure you have:

* [Node.js](https://nodejs.org/) or [Bun](https://bun.sh/)
* Git

### Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/wavyflux.git

cd wavyflux
```

### Install dependencies

Using Bun:

```bash
bun install
```

Or npm:

```bash
npm install
```

### Start the development server

```bash
bun dev
```

Or:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

## 🛠️ Tech Stack

WavyFlux is built with a modern web stack:

| Technology           | Purpose                    |
| -------------------- | -------------------------- |
| **React**            | User interface             |
| **TanStack Start**   | Full-stack React framework |
| **Tailwind CSS**     | Styling                    |
| **TypeScript**       | Type-safe development      |
| **Web Audio API**    | Audio processing           |
| **Cloudflare Pages** | Deployment                 |

The production site is built using **TanStack Start and Tailwind CSS**.

---

## 🎛️ Controls

### Playback Speed

Control how fast your audio plays.

```text
Slower  ◄────────────●────────────►  Faster
                     0.85x
```

### Reverb

Add atmosphere and depth to your audio.

```text
Dry     ◄────────────●────────────►     Wet
                      40%
```

### Presets

Quickly switch between different processing styles:

```text
SLOWED
DEFAULT
SPEED UP
```

---

## 💡 Use Cases

WavyFlux can be useful for:

* 🎧 Creating slowed + reverb edits
* 🎵 Experimenting with music
* 🎬 Creating atmospheric audio for videos
* 📱 Creating sounds for social media
* 🎮 Game audio experimentation
* 🎹 Audio production experiments
* 🌙 Creating ambient listening experiences

---

## 🔒 Privacy

WavyFlux is designed around browser-based audio processing.

Your audio doesn't need to be uploaded to a traditional audio-processing backend just to experiment with playback effects.

> Always check the application's current implementation before relying on this as a privacy guarantee.

---

## 📦 Project Structure

A typical project structure looks like:

```text
wavyflux/
├── public/
├── src/
│   ├── components/
│   ├── routes/
│   ├── styles/
│   └── ...
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🧑‍💻 Development

Contributions are welcome.

If you want to improve WavyFlux:

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/my-feature
```

3. Make your changes
4. Commit them

```bash
git commit -m "feat: add my feature"
```

5. Push the branch

```bash
git push origin feature/my-feature
```

6. Open a Pull Request

---

## 🗺️ Roadmap

Potential improvements for future versions:

* [ ] More audio effects
* [ ] More presets
* [ ] Additional export formats
* [ ] Better waveform interaction
* [ ] Drag & drop audio files
* [ ] Volume control
* [ ] Bass / treble controls
* [ ] Fade in / fade out
* [ ] Audio trimming
* [ ] Shareable processed audio
* [ ] Mobile UI improvements
* [ ] PWA support

---

## 🤝 Contributing

Contributions, ideas, bug reports, and feature requests are welcome.

If you find a bug or have an idea that could make WavyFlux better, feel free to open an issue.

---

## 📄 License

This project is licensed under the **MIT License**.

See [`LICENSE`](LICENSE) for more information.

---

## 👨‍💻 Author

**Umer Aalam**

Built with ❤️ and a love for music, code, and experimentation.

---

<p align="center">

### 🌊 Turn ordinary audio into something dreamy.

**[Try WavyFlux →](https://wavyflux.pages.dev/)**

</p>
