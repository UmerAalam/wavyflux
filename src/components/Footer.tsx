import { HeartHandshake } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-3 text-xs sm:text-sm text-black/80 dark:text-white/80 font-black px-4">
      <p className="text-center">
        Built with{" "}
        {
          <HeartHandshake size={24} className="inline-flex dark:bg-white/10 text-white text-blue-400 rounded-full p-3 text-base sm:text-lg mx-1 text-blue-400" />
        }{" "}
        using <span className="text-blue-400 font-black">TanStack Start</span> &
        Tailwind CSS
      </p>
      <a href="https://github.com/UmerAalam" target="_blank">
        <span className="flex justify-center w-fit px-3 py-1 mx-auto mt-2 gap-1 items-center text-white dark:bg-white/10 bg-black/80 rounded-full">
          <span className="text-purple-400">{"Made by"}</span>Umer Aalam
        </span>
        <div className="mb-10"></div>
      </a>
    </footer>
  );
};
export default Footer;
