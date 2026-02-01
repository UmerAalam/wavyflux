interface Props {
  exportFormat: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}
const ExportDropdown = ({ exportFormat, onChange }: Props) => {
  return (
    <div className="flex justify-center items-center">
      <select
        value={exportFormat}
        onChange={onChange}
        className="w-full flex appearance-none cursor-pointer rounded-full bg-white px-3 py-2 font-black text-gray-800 dark:bg-gray-900 dark:text-white"
      >
        <option value="wav" className="mx-auto">
          WAV (lossless)
        </option>
        <option value="mp3" className="mx-auto">
          MP3 (compressed)
        </option>
      </select>
    </div>
  );
};

export default ExportDropdown;
