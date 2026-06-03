import { cn } from '../../lib/helpers'

export const Card = ({ children, className, onClick }) => (
  <div 
    onClick={onClick}
    className={cn(
      'bg-white rounded-xl border border-gray-200 shadow-sm',
      'hover:shadow-md transition-shadow duration-200',
      onClick && 'cursor-pointer',
      className
    )}
  >
    {children}
  </div>
)

export const CardHeader = ({ children, className }) => (
  <div className={cn('px-6 py-4 border-b border-gray-100', className)}>
    {children}
  </div>
)

export const CardContent = ({ children, className }) => (
  <div className={cn('px-6 py-4', className)}>
    {children}
  </div>
)

export const CardFooter = ({ children, className }) => (
  <div className={cn('px-6 py-4 border-t border-gray-100', className)}>
    {children}
  </div>
)
