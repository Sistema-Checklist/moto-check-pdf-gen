import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 200, showText = true, className = '' }) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Fundo preto */}
        <rect width="200" height="200" fill="black" rx="8"/>
        
        {/* Ícone da prancheta - baseado na imagem fornecida */}
        <g transform="translate(50, 40)">
          {/* Fundo da prancheta */}
          <rect x="0" y="15" width="100" height="120" rx="8" fill="white"/>
          
          {/* Clipe superior da prancheta */}
          <rect x="20" y="0" width="60" height="25" rx="12" fill="white"/>
          <rect x="25" y="5" width="50" height="15" rx="7" fill="black"/>
          
          {/* Lista de itens com checkmarks */}
          <g fill="black">
            {/* Item 1 */}
            <circle cx="20" cy="40" r="3" fill="green"/>
            <path d="M18 40 L20 42 L23 38" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <rect x="30" y="38" width="50" height="2" rx="1" fill="black"/>
            
            {/* Item 2 */}
            <circle cx="20" cy="55" r="3" fill="green"/>
            <path d="M18 55 L20 57 L23 53" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <rect x="30" y="53" width="45" height="2" rx="1" fill="black"/>
            
            {/* Item 3 */}
            <circle cx="20" cy="70" r="3" fill="orange"/>
            <path d="M18 70 L20 72 L23 68" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <rect x="30" y="68" width="40" height="2" rx="1" fill="black"/>
            
            {/* Item 4 */}
            <circle cx="20" cy="85" r="3" fill="green"/>
            <path d="M18 85 L20 87 L23 83" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <rect x="30" y="83" width="55" height="2" rx="1" fill="black"/>
            
            {/* Item 5 */}
            <circle cx="20" cy="100" r="3" fill="red"/>
            <path d="M18 100 L20 102 L23 98" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <rect x="30" y="98" width="35" height="2" rx="1" fill="black"/>
            
            {/* Item 6 */}
            <circle cx="20" cy="115" r="3" fill="green"/>
            <path d="M18 115 L20 117 L23 113" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <rect x="30" y="113" width="48" height="2" rx="1" fill="black"/>
          </g>
        </g>
        
        {/* Texto "CheckSystem" */}
        <text x="100" y="170" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold">
          CheckSystem
        </text>
        
        {/* Subtítulo */}
        <text x="100" y="185" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="10" opacity="0.8">
          Sistema eficiente para checklists de motos
        </text>
      </svg>
      
      {showText && (
        <div className="text-center mt-2">
          <h1 className="text-xl font-bold text-gray-900">CheckSystem</h1>
          <p className="text-sm text-gray-600">Sistema eficiente para checklists de motos</p>
        </div>
      )}
    </div>
  );
};

export default Logo;