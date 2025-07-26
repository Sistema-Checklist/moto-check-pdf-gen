const fs = require('fs');
const path = require('path');

// Tamanhos de ícones necessários para PWA
const iconSizes = [
  16, 32, 72, 96, 128, 144, 152, 192, 384, 512
];

// Função para criar um ícone PNG simples (placeholder)
function createIconPNG(size) {
  // Este é um placeholder - em produção você usaria uma biblioteca como sharp
  // para converter o SVG para PNG nos tamanhos corretos
  
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Desenhar um ícone simples
  ctx.fillStyle = '#7c3aed';
  ctx.fillRect(0, 0, size, size);
  
  // Adicionar texto "CS"
  ctx.fillStyle = 'white';
  ctx.font = `${size * 0.3}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CS', size / 2, size / 2);
  
  return canvas.toDataURL('image/png');
}

// Função para gerar todos os ícones
function generateIcons() {
  console.log('Gerando ícones para PWA...');
  
  // Criar diretório se não existir
  const iconsDir = path.join(__dirname, '../public/icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  // Para cada tamanho, criar um arquivo placeholder
  iconSizes.forEach(size => {
    const filename = `icon-${size}x${size}.png`;
    const filepath = path.join(iconsDir, filename);
    
    // Criar um arquivo placeholder simples
    const svgContent = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#7c3aed"/>
      <text x="${size/2}" y="${size/2}" font-family="Arial, sans-serif" font-size="${size * 0.3}" text-anchor="middle" dy="0.35em" fill="white">CS</text>
    </svg>`;
    
    // Salvar como SVG temporário (será convertido para PNG)
    fs.writeFileSync(filepath.replace('.png', '.svg'), svgContent);
    
    console.log(`Criado: ${filename}`);
  });
  
  console.log('Ícones gerados com sucesso!');
  console.log('Nota: Para ícones PNG reais, use uma ferramenta como sharp ou converta os SVGs manualmente.');
}

// Executar se chamado diretamente
if (require.main === module) {
  generateIcons();
}

module.exports = { generateIcons }; 