const NotFoundPage = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white text-center px-4">
      <h1 className="text-8xl font-bold tracking-tight">404</h1>
      <p className="text-xl mt-4 opacity-80">
        The page you're looking for doesn’t exist.
      </p>

      <a
        href="/"
        className="
    mt-8 inline-block px-3 py-2
    rounded-full font-bold text-lg
    border border-white/30 backdrop-blur-md
    bg-white/10
    transition
    hover:bg-white hover:text-gray-900 hover:border-white
  "
      >
        Go <span className="text-purple-400">Home</span>
      </a>

      <p className="mt-6 text-sm opacity-50">
        Lost in the waves? Let’s bring you back.
      </p>
    </div>
  );
};

export default NotFoundPage;
