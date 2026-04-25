import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function getFilesRecursively(directory: string): string[] {
  let fileList: string[] = [];
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fileList = fileList.concat(getFilesRecursively(fullPath));
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

// Plugin to generate gallery list at build time
function generateGalleryList() {
  return {
    name: 'generate-gallery-list',
    buildStart() {
      const publicDir = path.join(process.cwd(), 'public');
      if (fs.existsSync(publicDir)) {
        const publicFiles = getFilesRecursively(publicDir);
        const imageList: any[] = [];
        let totalSize = 0;
        for (const file of publicFiles) {
          const ext = path.extname(file).toLowerCase();
          const relativePath = file.substring(publicDir.length).replace(/\\/g, '/');
          if (relativePath.includes('/.idea') || relativePath.includes('/.vscode') ||
              file.includes('node_modules') || file.includes('.git') || ext === '') continue;

          let fileType = 'other';
          if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.tiff'].includes(ext)) fileType = 'image';
          else if (['.mp4', '.webm', '.ogg', '.mov'].includes(ext)) fileType = 'video';
          else if (['.mp3', '.wav'].includes(ext)) fileType = 'audio';
          else if (['.pdf'].includes(ext)) fileType = 'document';

          const stat = fs.statSync(file);
          totalSize += stat.size;
          imageList.push({
            id: `build-${Buffer.from(relativePath).toString('base64')}`,
            filename: path.basename(file),
            url: `/media${relativePath}`,
            category: path.dirname(relativePath).replace(/^\//, '') || 'Root',
            source: 'system',
            size: stat.size,
            width: 0, height: 0, type: fileType
          });
        }
        fs.writeFileSync(path.join(process.cwd(), 'gallery-list.json'), JSON.stringify({ success: true, files: imageList, totalSizeBytes: totalSize, from_build: true }, null, 2));
      }
    }
  }
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      generateGalleryList(),
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'cover.png'],
        manifest: {
          name: 'MyData API Serverless',
          short_name: 'MyData Serverless',
          theme_color: '#ffffff',
          icons: [
            {
              src: '/src/images/cover.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/src/images/cover.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
