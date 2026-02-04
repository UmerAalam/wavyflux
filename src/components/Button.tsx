interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

const Button = ({ children, className = "", ...rest }: Props) => {
  return (
    <button
      {...rest}
      className={`
        flex transition-all cursor-pointer
        px-3 py-1 font-black rounded-full
        min-w-2 justify-center items-center
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default Button;
