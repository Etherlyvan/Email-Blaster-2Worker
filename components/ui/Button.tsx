// components/ui/Button.tsx
"use client";

import { ButtonHTMLAttributes, forwardRef, ElementType } from "react";

type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'dark'
  | 'light'
  | 'link'
  | 'outline-primary'
  | 'outline-secondary'
  | 'outline-success'
  | 'outline-danger'
  | 'outline-warning'
  | 'outline-info'
  | 'outline-dark'
  | 'outline-light';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  as?: ElementType;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = "", 
    variant = "default",
    size = "md", 
    loading = false, 
    fullWidth = false,
    icon,
    as: Component = "button",
    children, 
    ...props 
  }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ";
    
    const variants: Record<ButtonVariant, string> = {
      default: "bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900 border border-gray-900",
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600 border border-blue-600",
      secondary: "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-600 border border-purple-600",
      success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-600 border border-green-600",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 border border-red-600",
      warning: "bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500 border border-yellow-500",
      info: "bg-cyan-500 text-white hover:bg-cyan-600 focus:ring-cyan-500 border border-cyan-500",
      dark: "bg-gray-800 text-white hover:bg-gray-900 focus:ring-gray-800 border border-gray-800",
      light: "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-200 border border-gray-200",
      link: "bg-transparent text-blue-600 hover:text-blue-800 hover:underline focus:ring-blue-600 p-0 border-none",
      
      'outline-primary': "bg-transparent text-blue-600 hover:bg-blue-50 focus:ring-blue-600 border border-blue-600",
      'outline-secondary': "bg-transparent text-purple-600 hover:bg-purple-50 focus:ring-purple-600 border border-purple-600",
      'outline-success': "bg-transparent text-green-600 hover:bg-green-50 focus:ring-green-600 border border-green-600",
      'outline-danger': "bg-transparent text-red-600 hover:bg-red-50 focus:ring-red-600 border border-red-600",
      'outline-warning': "bg-transparent text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-600 border border-yellow-600",
      'outline-info': "bg-transparent text-cyan-600 hover:bg-cyan-50 focus:ring-cyan-600 border border-cyan-600",
      'outline-dark': "bg-transparent text-gray-800 hover:bg-gray-100 focus:ring-gray-800 border border-gray-800",
      'outline-light': "bg-transparent text-gray-400 hover:bg-gray-50 focus:ring-gray-400 border border-gray-200",
    };
    
    const sizes = {
      sm: "text-xs px-2.5 py-1.5 rounded",
      md: "text-sm px-4 py-2 rounded-md",
      lg: "text-base px-6 py-3 rounded-md",
      xl: "text-lg px-8 py-4 rounded-md",
    };
    
    const widthClass = fullWidth ? "w-full" : "";
    
    return (
      <Component
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </Component>
    );
  }
);

Button.displayName = "Button";