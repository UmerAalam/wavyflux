import { ChevronDown } from 'lucide-react';
import { useState,type ChangeEvent } from 'react';

interface Props {
  exportFormat: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}
const ExportDropdown = ({ exportFormat, onChange }: Props) => {
  const [open,setOpen] = useState(false);
  return (
    <div className="flex w-full max-w-[500px] justify-center items-center">
      <select
        value={exportFormat}
        onMouseDown={()=>setOpen(!open)}
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
      <ChevronDown className={`absolute top-auto right-10 transition-all ${open && ""}`} />
    </div>
  );
};

export default ExportDropdown;
