import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin du fichier actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction pour vérifier si un fichier importe déjà OptimizedLoadingSpinner
function hasOptimizedSpinnerImport(content) {
  return /import\s+.*OptimizedLoadingSpinner.*from/.test(content);
}

// Fonction pour ajouter l'import de OptimizedLoadingSpinner si nécessaire
function addOptimizedSpinnerImport(content) {
  // Si le fichier a déjà l'import, ne rien faire
  if (hasOptimizedSpinnerImport(content)) {
    return content;
  }

  // Trouver le dernier import dans le fichier
  const importRegex = /^import.*from.*$/gm;
  const imports = [...content.matchAll(importRegex)];
  
  if (imports.length === 0) {
    // S'il n'y a pas d'imports, ajouter au début du fichier
    return `import OptimizedLoadingSpinner from "../../components/Common/OptimizedLoadingSpinner";\n\n${content}`;
  }
  
  // Trouver le dernier import
  const lastImport = imports[imports.length - 1];
  const lastImportIndex = lastImport.index + lastImport[0].length;
  
  // Ajouter l'import après le dernier import
  return content.slice(0, lastImportIndex) + 
         '\nimport OptimizedLoadingSpinner from "../../components/Common/OptimizedLoadingSpinner";' + 
         content.slice(lastImportIndex);
}

// Fonction pour remplacer les animations de chargement personnalisées par OptimizedLoadingSpinner
function replaceLoadingSpinners(filePath) {
  try {
    // Lire le contenu du fichier
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Vérifier si le fichier contient des animations de chargement personnalisées
    if (content.includes('animate-spin') && !filePath.includes('OptimizedLoadingSpinner.jsx')) {
      // Compter le nombre d'animations de chargement personnalisées avant remplacement
      const beforeCount = (content.match(/animate-spin/g) || []).length;
      
      if (beforeCount === 0) {
        return { path: filePath, replaced: 0 };
      }
      
      // Ajouter l'import de OptimizedLoadingSpinner si nécessaire
      const contentWithImport = addOptimizedSpinnerImport(content);
      if (contentWithImport !== content) {
        content = contentWithImport;
        modified = true;
      }
      
      // Remplacer les animations de chargement personnalisées par OptimizedLoadingSpinner
      const spinnerRegex = /<div[^>]*className=["|']([^"']*animate-spin[^"']*)["'][^>]*><\/div>/g;
      const spinnerWithTextRegex = /<div[^>]*className=["|']([^"']*flex[^"']*)["'][^>]*>\\s*<div[^>]*className=["|']([^"']*animate-spin[^"']*)["'][^>]*><\/div>\\s*<p[^>]*>(.*?)<\/p>\\s*<\/div>/g;
      
      // Remplacer les spinners avec texte
      content = content.replace(spinnerWithTextRegex, (match, containerClass, spinnerClass, text) => {
        modified = true;
        return `<OptimizedLoadingSpinner size="medium" text="${text.trim()}" />`;
      });
      
      // Remplacer les spinners simples
      content = content.replace(spinnerRegex, (match, spinnerClass) => {
        modified = true;
        const size = spinnerClass.includes('h-12') || spinnerClass.includes('w-12') ? 'large' : 
                    (spinnerClass.includes('h-6') || spinnerClass.includes('w-6') ? 'small' : 'medium');
        return `<OptimizedLoadingSpinner size="${size}" text="" />`;
      });
      
      // Remplacer les divs de chargement plus complexes
      const loadingDivRegex = /<div[^>]*className=["|']([^"']*flex[^"']*justify-center[^"']*items-center[^"']*)["'][^>]*>\\s*<div[^>]*className=["|']([^"']*animate-spin[^"']*)["'][^>]*><\/div>\\s*<\/div>/g;
      
      content = content.replace(loadingDivRegex, (match, containerClass, spinnerClass) => {
        modified = true;
        const size = spinnerClass.includes('h-12') || spinnerClass.includes('w-12') ? 'large' : 
                    (spinnerClass.includes('h-6') || spinnerClass.includes('w-6') ? 'small' : 'medium');
        return `<div className="${containerClass}"><OptimizedLoadingSpinner size="${size}" text="" /></div>`;
      });
      
      // Compter le nombre d'animations de chargement personnalisées après remplacement
      const afterCount = (content.match(/animate-spin/g) || []).length;
      const replaced = beforeCount - afterCount;
      
      // Si des modifications ont été apportées, écrire le contenu modifié dans le fichier
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
      }
      
      return { path: filePath, replaced };
    }
    
    return { path: filePath, replaced: 0 };
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return { path: filePath, replaced: 0, error: error.message };
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
      const result = replaceLoadingSpinners(filePath);
      if (result.replaced > 0) {
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
console.log('Unification des animations de chargement terminée.');
console.log('Fichiers modifiés :');
let totalReplaced = 0;

results.forEach(result => {
  console.log(`${result.path}: ${result.replaced} animations remplacées`);
  totalReplaced += result.replaced;
});

console.log(`\nTotal: ${totalReplaced} animations de chargement remplacées dans ${results.length} fichiers.`);
