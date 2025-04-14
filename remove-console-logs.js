import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin du fichier actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction pour supprimer les appels à console
function removeConsoleLogs(filePath) {
  try {
    // Lire le contenu du fichier
    let content = fs.readFileSync(filePath, 'utf8');

    // Nombre d'appels à console avant suppression
    const beforeCount = (content.match(/console\.(log|error|warn|info|debug|time|timeEnd)/g) || []).length;

    if (beforeCount === 0) {
      return { path: filePath, removed: 0 };
    }

    // Remplacer les appels à console.log
    content = content.replace(/console\.log\s*\([^;]*\);?/g, '');

    // Remplacer les appels à console.error
    content = content.replace(/console\.error\s*\([^;]*\);?/g, '');

    // Remplacer les appels à console.warn
    content = content.replace(/console\.warn\s*\([^;]*\);?/g, '');

    // Remplacer les appels à console.info
    content = content.replace(/console\.info\s*\([^;]*\);?/g, '');

    // Remplacer les appels à console.debug
    content = content.replace(/console\.debug\s*\([^;]*\);?/g, '');

    // Remplacer les appels à console.time et console.timeEnd
    content = content.replace(/console\.time\s*\([^;]*\);?/g, '');
    content = content.replace(/console\.timeEnd\s*\([^;]*\);?/g, '');

    // Nombre d'appels à console après suppression
    const afterCount = (content.match(/console\.(log|error|warn|info|debug|time|timeEnd)/g) || []).length;
    const removed = beforeCount - afterCount;

    // Écrire le contenu modifié dans le fichier
    fs.writeFileSync(filePath, content, 'utf8');

    return { path: filePath, removed };
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return { path: filePath, removed: 0, error: error.message };
  }
}

// Fonction pour parcourir récursivement un répertoire
function processDirectory(directory) {
  const results = [];
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorer les répertoires node_modules et .git
      if (file !== 'node_modules' && file !== '.git') {
        results.push(...processDirectory(filePath));
      }
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx'))) {
      const result = removeConsoleLogs(filePath);
      if (result.removed > 0) {
        results.push(result);
      }
    }
  }

  return results;
}

// Répertoire racine du projet
const rootDir = __dirname;

// Traiter le répertoire src
const srcDir = path.join(rootDir, 'src');
const results = processDirectory(srcDir);

// Afficher les résultats
console.log('Suppression des appels à console terminée.');
console.log('Fichiers modifiés :');
let totalRemoved = 0;

results.forEach(result => {
  console.log(`${result.path}: ${result.removed} appels supprimés`);
  totalRemoved += result.removed;
});

console.log(`\nTotal: ${totalRemoved} appels à console supprimés dans ${results.length} fichiers.`);
