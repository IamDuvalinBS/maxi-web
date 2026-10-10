// Uso: node tools/stickers.js
// Lee la carpeta img/stickers/ y escribe img/stickers/lista.json con todas las imágenes que encuentre.
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'img', 'stickers');
const lista = fs.readdirSync(dir).filter(f => /\.(png|webp|gif|jpe?g|svg)$/i.test(f)).sort();
fs.writeFileSync(path.join(dir, 'lista.json'), JSON.stringify(lista, null, 2) + '\n');
console.log(lista.length + ' stickers guardados en img/stickers/lista.json');
