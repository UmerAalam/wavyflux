import { type FormEvent, useState } from "react";
import { extractVideoId } from "../converters/extractYoutubeVideoID";

export default function ThumbnailDownloader() {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const id = extractVideoId(url);
    setVideoId(id);
  };

  const getThumbnailUrl = (id: string) =>
    `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;

  return (
    <div style={{ maxWidth: 500, margin: "auto" }}>
      <h2>YouTube Thumbnail Downloader</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Paste YouTube URL here"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />
        <button type="submit" style={{ marginTop: 10 }}>
          Get Thumbnail
        </button>
      </form>

      {videoId && (
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <img
            src={getThumbnailUrl(videoId)}
            alt="YouTube Thumbnail"
            style={{ width: "100%" }}
          />
          <a
            href={getThumbnailUrl(videoId)}
            download={`${videoId}.jpg`}
            style={{
              display: "block",
              marginTop: 10,
              padding: "10px",
              background: "#3b82f6",
              color: "white",
              textDecoration: "none",
            }}
          >
            Download Thumbnail
          </a>
        </div>
      )}
    </div>
  );
}
