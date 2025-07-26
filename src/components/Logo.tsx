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
        <rect width="200" height="200" fill="black"/>
        
        {/* Ícone da prancheta - posicionado no centro superior */}
        <g transform="translate(60, 25)">
          {/* Corpo da prancheta */}
          <rect x="0" y="10" width="80" height="90" rx="6" fill="white"/>
          
          {/* Clipe da prancheta */}
          <rect x="15" y="0" width="50" height="18" rx="9" fill="white"/>
          
          {/* Check mark */}
          <path d="M20 35 L30 45 L50 25" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          
          {/* Linhas da lista */}
          <rect x="20" y="55" width="25" height="2" rx="1" fill="black"/>
          <rect x="20" y="62" width="20" height="2" rx="1" fill="black"/>
        </g>
        
        {/* Texto "CheckSystem" */}
        <text x="100" y="140" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold">
          CheckSystem
        </text>
        
        {/* Texto "Sistema eficiente para checklists de motos" */}
        <text x="100" y="160" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="10">
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