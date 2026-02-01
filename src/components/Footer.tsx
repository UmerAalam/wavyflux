import { HeartHandshake } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-3 text-xs sm:text-sm text-black/80 dark:text-white/80 font-black px-4">
      <p className="text-center">
        Built with{" "}
        {
          <a href="https://github.com/UmerAalam" target="_blank">
            <HeartHandshake
              size={34}
              className="inline-flex transition-all scale-100 hover:scale-105 cursor-pointer p-1.5 bg-blue-500/10 text-blue-500 rounded-full text-base sm:text-lg mx-1"
            />
          </a>
        }{" "}
        using{" "}
        <a href="https://tanstack.com/start/latest" target="_blank">
          <span className="bg-pink-400/10 px-3 py-1 rounded-full text-pink-400 font-black">
            TanStack Start
          </span>{" "}
          &{" "}
        </a>
        <a href="https://tailwindcss.com/" target="_blank">
          <span className="bg-yellow-400/10 px-3 py-1 rounded-full text-yellow-400 font-black">
            Tailwind CSS
          </span>
        </a>
      </p>
      <a href="https://linktree.com/umergamedev" target="_blank">
        <span className="flex justify-center w-fit px-3 py-1 mx-auto mt-2 gap-1 items-center text-white dark:bg-white/10 bg-black/80 rounded-full">
          <span className="text-purple-400">{"Made by"}</span>Umer Aalam
        </span>
        <div className="mb-10"></div>
      </a>
    </footer>
  );
};
export default Footer;
