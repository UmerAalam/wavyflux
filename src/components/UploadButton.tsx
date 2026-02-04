import { Upload } from "lucide-react";
import type { HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLButtonElement> {
  className?: string;
}

const UploadButton = ({ className = "", ...rest }: Props) => {
  const baseClasses =
    "w-full min-w-50 uppercase size-fit px-6 py-3 rounded-full flex justify-center items-center gap-2 hover:bg-pink-600 bg-pink-500 transition text-lg font-black text-white";

  return (
    <button {...rest} className={`${baseClasses} ${className}`.trim()}>
      <Upload size={22} />
      <div>Upload</div>
    </button>
  );
};
export default UploadButton;
