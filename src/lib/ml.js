import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Call the local Python classification script
 * @param {string} imageBase64 - Base64 image data
 * @returns {Promise<Object>} - Classification results
 */
export async function classifyLocally(imageBase64) {
  return new Promise((resolve, reject) => {
    // Check if running on Vercel (Vercel Node runtime doesn't have Python or PyTorch installed)
    if (process.env.VERCEL || process.env.NODE_ENV === 'production' && !fs.existsSync(path.join(process.cwd(), 'classify.py'))) {
      console.warn('Vercel environment detected! Bypassing local Python PyTorch model.');
      return resolve({
        classification: 'unknown',
        condition_name: 'Analysis require medical professional',
        confidence: 0.5,
        severity: 'Moderate',
        error: 'Local PyTorch models cannot run on Vercel'
      });
    }

    // Create a temporary file for the image in a writable temp directory
    const tempDir = path.join(os.tmpdir(), 'dermoai-scratch');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    const tempPath = path.join(tempDir, `temp_${Date.now()}.jpg`);
    const buffer = Buffer.from(imageBase64, 'base64');
    fs.writeFileSync(tempPath, buffer);

    const scriptPath = path.join(process.cwd(), 'classify.py');
    const venvPath = path.join(process.cwd(), '.venv', 'bin', 'python');
    
    // Check if virtual environment exists, otherwise fallback to system python3
    const pythonCommand = fs.existsSync(venvPath) ? venvPath : 'python3';
    
    const python = spawn(pythonCommand, [scriptPath, tempPath]);
    
    let result = '';
    let error = '';

    python.stdout.on('data', (data) => {
      result += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      // Clean up temp file
      try { fs.unlinkSync(tempPath); } catch (e) {}

      if (code !== 0) {
        console.error('Python Error output:', error);
        return reject(new Error(`Classification process exited with code ${code}: ${error}`));
      }

      try {
        const parsed = JSON.parse(result.trim());
        if (parsed.error) return reject(new Error(parsed.error));
        resolve(parsed);
      } catch (err) {
        console.error('Failed to parse Python result:', result);
        reject(new Error('Failed to parse classification results'));
      }
    });
  });
}
