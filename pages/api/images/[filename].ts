/**
 * GET /api/images/[filename]
 *
 * Serves uploaded recipe images from data/uploads/.
 * By keeping images in data/ (not public/) they live on the Railway
 * persistent volume and survive redeploys.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Map extension → MIME type
const MIME: Record<string, string> = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const { filename } = req.query;
  if (typeof filename !== 'string' || filename.includes('..') || filename.includes('/')) {
    // Reject path-traversal attempts
    return res.status(400).end();
  }

  const filePath = path.join(process.cwd(), 'data', 'uploads', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).end();
  }

  const ext      = path.extname(filename).toLowerCase();
  const mimeType = MIME[ext] ?? 'application/octet-stream';

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}
