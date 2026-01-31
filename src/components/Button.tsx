import classNames from "classnames";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

const Button = ({ children, ...rest }: Props) => {
  let className = classNames(rest.className);
  return (
    <button
      {...rest}
      className={`flex text-gray-700 dark:text-white transition-all cursor-pointer dark:bg-white/5 bg-black/5 px-3 py-1 font-black text-lg rounded-full min-w-2  justify-center items-center ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
