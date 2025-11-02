import { Upload } from "lucide-react";
import type { HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLButtonElement> {}

const UploadButton = ({ ...rest }: Props) => {
  return (
    <button
      {...rest}
      className="w-full uppercase mt-6 size-fit px-6 py-3 rounded-lg flex justify-center items-center gap-2 hover:bg-pink-600 bg-pink-500 transition text-lg font-black shadow-md text-white"
    >
      <Upload size={22} />
      <div>Upload</div>
    </button>
  );
};
export default UploadButton;
