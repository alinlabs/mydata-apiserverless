import express from 'express';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

const isVercel = process.env.VERCEL === '1';

const publicDir = path.join(process.cwd(), 'public');
if (!isVercel && !fs.existsSync(publicDir)) {
  try {
    fs.mkdirSync(publicDir, { recursive: true });
  } catch (e) {
    console.warn('Could not create public directory:', e);
  }
}

function getFilesRecursively(directory: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(directory)) return results;
  const list = fs.readdirSync(directory);
  list.forEach((file) => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

const app = express();
const PORT = 3000;

// Optimization: Compress responses
app.use(compression());

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Vite runs inline scripts during development
  crossOriginEmbedderPolicy: false, // Don't block external assets if any
}));
app.use(cors());

// Limit repeated requests to public APIs and /
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

app.use(express.json({ limit: '10kb' })); // Limit JSON payload size to prevent DOS

// Debug API Route to see file tree
app.get('/api/debug-files', (req, res) => {
  const cwd = process.cwd();
  const info: any = { cwd, dirname: __dirname, publicDir };
  try {
    info.cwdFiles = fs.readdirSync(cwd);
    info.publicFiles = fs.existsSync(path.join(cwd, 'public')) ? getFilesRecursively(path.join(cwd, 'public')) : [];
    info.distFiles = fs.existsSync(path.join(cwd, 'dist')) ? getFilesRecursively(path.join(cwd, 'dist')) : [];
  } catch (e: any) {
    info.error = e.message;
  }
  res.json(info);
});

// API Route to list all available images and files
app.get('/api/gallery', async (req, res) => {
  try {
    const protocol = isVercel ? 'https' : (req.protocol || 'http');
    const host = req.headers.host || `localhost:${PORT}`;
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
    const imageList: any[] = [];

    let publicFiles = getFilesRecursively(publicDir);
    const distDir = path.join(process.cwd(), 'dist');
    
    // If public has no files, check dist where Vercel might store them
    if (publicFiles.length === 0 && fs.existsSync(distDir)) {
      publicFiles = getFilesRecursively(distDir).filter(file => {
        // filter out react/vite build chunks
        const ext = path.extname(file).toLowerCase();
        if (file.includes('assets/') && (ext === '.js' || ext === '.css') || file.endsWith('.html')) return false;
        return true;
      });
    }

    // check for build-generated gallery list if local file search fails
    const galleryListPath = path.join(process.cwd(), 'gallery-list.json');
    if (publicFiles.length === 0 && fs.existsSync(galleryListPath)) {
      try {
        const cachedGallery = JSON.parse(fs.readFileSync(galleryListPath, 'utf-8'));
        if (cachedGallery.files && cachedGallery.files.length > 0) {
          return res.json(cachedGallery);
        }
      } catch(e) {
        console.error("Failed to read cached gallery", e);
      }
    }

    if (publicFiles.length === 0) {
      try {
        const githubTreeUrl = 'https://api.github.com/repos/alinlabs/mydata-apiserverless/git/trees/main?recursive=1';
        const response = await fetch(githubTreeUrl);
        if (response.ok) {
          const data = await response.json();
          if (data && data.tree) {
            const publicItems = data.tree.filter((item: any) => item.type === 'blob' && item.path.startsWith('public/'));
            
            for (const item of publicItems) {
               // item.path = "public/gambar/logo/bank/bca.png"
              const file = item.path;
              const ext = path.extname(file).toLowerCase();
              const relativePath = file.substring('public'.length); // starts with /
              
              let fileType = 'other';
              if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.tiff'].includes(ext)) {
                fileType = 'image';
              } else if (['.mp4', '.webm', '.ogg', '.mov'].includes(ext)) {
                fileType = 'video';
              } else if (['.mp3', '.wav'].includes(ext)) {
                fileType = 'audio';
              } else if (['.pdf'].includes(ext)) {
                fileType = 'document';
              }

              imageList.push({
                id: `github-${item.sha}`,
                filename: path.basename(file),
                url: `/media${relativePath}`,
                category: path.dirname(relativePath).replace(/^\//, '') || 'Root',
                source: 'system',
                size: item.size || 0,
                width: 0,
                height: 0,
                type: fileType
              });
            }
            if (imageList.length > 0) {
              return res.json({ success: true, files: imageList, from_fallback: true });
            } else {
              return res.json({ success: false, error: 'No files found in github tree' });
            }
          }
        } else {
           const errText = await response.text();
           return res.json({ success: false, error: `GitHub API error: ${response.status} ${errText}` });
        }
      } catch (githubErr: any) {
        console.error("Vercel GitHub fallback failed:", githubErr);
        return res.json({ success: false, error: githubErr.message, from_fallback: true });
      }
    }

    const filePromises = publicFiles.map(async file => {
      const ext = path.extname(file).toLowerCase();
      // determine relative path based on which dir the file came from
      const baseDirForFile = file.startsWith(publicDir) ? publicDir : distDir;
      const relativePath = file.substring(baseDirForFile.length).replace(/\\/g, '/');
      
      if (relativePath.includes('/.idea') || relativePath.includes('/.vscode') ||
          file.includes('node_modules') || file.includes('.git') || ext === '') return;

      try {
        const stat = fs.statSync(file);
        let width = 0;
        let height = 0;
        let fileType = 'other';

        if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.tiff'].includes(ext)) {
          fileType = 'image';
          try {
            if (ext !== '.svg') {
              let sharpImpl;
              try { sharpImpl = (await import('sharp')).default; } catch (e) {}
              if (sharpImpl) {
                const metadata = await sharpImpl(file).metadata();
                width = metadata.width || 0;
                height = metadata.height || 0;
              }
            }
          } catch (e) {
            console.error('Error getting image size for', file, e);
          }
        } else if (['.mp4', '.webm', '.ogg', '.mov'].includes(ext)) {
           fileType = 'video';
        } else if (['.mp3', '.wav'].includes(ext)) {
           fileType = 'audio';
        } else if (['.pdf'].includes(ext)) {
           fileType = 'document';
        }

        imageList.push({
          id: `public-${Buffer.from(relativePath).toString('base64')}`,
          filename: path.basename(file),
          url: `/media${relativePath}`,
          category: path.dirname(relativePath).replace(/^\//, '') || 'Root',
          source: 'system',
          size: stat.size,
          width,
          height,
          type: fileType
        });
      } catch (e) {}
    });

    await Promise.all(filePromises);

    res.json({ files: imageList, totalSizeBytes: imageList.reduce((acc, curr) => acc + curr.size, 0) });
  } catch (err) {
    console.error('Error fetching gallery:', err);
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

// Dynamic Server Route
// Handle query parameters like /media/gambar/logo/bank/bca.png?scale=50
app.get('/media/*', async (req, res, next) => {
  const urlPath = decodeURIComponent(req.path.replace(/^\/media/, ''));
  const ext = path.extname(urlPath).toLowerCase();
  
  if (ext) {
    let physicalPath = path.normalize(path.join(publicDir, urlPath));

    // Security: Prevent Directory Traversal 
    if (!physicalPath.startsWith(publicDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(physicalPath)) {
      const distPath = path.normalize(path.join(process.cwd(), 'dist', urlPath));
      if (distPath.startsWith(path.join(process.cwd(), 'dist')) && fs.existsSync(distPath)) {
        physicalPath = distPath;
      } else {
        // Fallback search for flat structure access
        let publicFiles = getFilesRecursively(publicDir);
        if (publicFiles.length === 0) publicFiles = getFilesRecursively(path.join(process.cwd(), 'dist'));
        
        const filename = path.basename(urlPath);
        const found = publicFiles.find(f => path.basename(f) === filename);
        if (found) {
          physicalPath = found;
        } else {
          // GITHUB RAW FALLBACK if local not found
          try {
            const rawUrl = `https://raw.githubusercontent.com/alinlabs/mydata-apiserverless/main/public${urlPath}`;
            const fetchRes = await fetch(rawUrl);
            
            if (fetchRes.ok) {
              const arrayBuffer = await fetchRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              
              const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext);

              if (isImage) {
                let scale = 100;
                if (req.query.scale) {
                  const parsedScale = parseInt(req.query.scale as string, 10);
                  if (!isNaN(parsedScale) && parsedScale > 0 && parsedScale <= 1000) {
                    scale = parsedScale;
                  }
                }
                
                const wantsInvert = req.query.invert === 'true';

                if (scale === 100 && !wantsInvert) {
                  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                  res.type(ext);
                  return res.send(buffer);
                } else {
                  if (ext === '.svg') {
                    // Cannot sharp SVG buffer normally without rendering raster
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                    res.type(ext);
                    return res.send(buffer);
                  }
                  
                  let sharp;
                  try {
                    sharp = (await import('sharp')).default;
                  } catch (e) {
                    console.error('Could not load sharp:', e);
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                    res.type(ext);
                    return res.send(buffer);
                  }

                  let image = sharp(buffer);
                  
                  if (scale !== 100) {
                    const metadata = await image.metadata();
                    if (metadata.width) {
                      const newWidth = Math.max(1, Math.round(metadata.width * (scale / 100)));
                      image = image.resize({ width: newWidth });
                    }
                  }

                  if (wantsInvert) {
                    image = image.negate({ alpha: false });
                  }
                  
                  res.type(ext);
                  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                  const processedBuffer = await image.toBuffer();
                  return res.send(processedBuffer);
                }
              } else {
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                res.type(ext);
                return res.send(buffer);
              }
            }
          } catch (e) {
            console.error("GitHub raw fallback failed", e);
          }
        }
      }
    }

    if (fs.existsSync(physicalPath)) {
      const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext);

      if (isImage) {
        let scale = 100;
        if (req.query.scale) {
          const parsedScale = parseInt(req.query.scale as string, 10);
          if (!isNaN(parsedScale) && parsedScale > 0 && parsedScale <= 1000) {
            scale = parsedScale;
          }
        }
        
        const wantsInvert = req.query.invert === 'true';

        if (scale === 100 && !wantsInvert) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return res.sendFile(physicalPath);
        } else {
          try {
            let sharpImpl;
            try { sharpImpl = (await import('sharp')).default; } catch (e) {}
            if (!sharpImpl) {
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
              return res.sendFile(physicalPath);
            }
            let image = sharpImpl(physicalPath);
            
            if (scale !== 100) {
              const metadata = await image.metadata();
              if (metadata.width) {
                const newWidth = Math.max(1, Math.round(metadata.width * (scale / 100)));
                image = image.resize({ width: newWidth });
              }
            }

            if (wantsInvert) {
              image = image.negate({ alpha: false });
            }
            
            res.type(ext);
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            return image.pipe(res);
          } catch (err) {
            console.error("Error processing image:", err);
            return res.sendFile(physicalPath);
          }
        }
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.sendFile(physicalPath);
      }
    }
  }
  
  next();
});

// Serve static public folder explicitly for production and raw requests
app.use(express.static(path.join(process.cwd(), 'public'), {
  maxAge: '1y',
  immutable: true
}));

// Create Vite server for dev or serve dist in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production' && !isVercel) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!isVercel) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen directly if we are not on Vercel
  if (!isVercel) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

if (!isVercel) {
  startServer();
}

export default app;
