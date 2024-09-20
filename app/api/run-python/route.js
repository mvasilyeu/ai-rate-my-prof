import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request) {
  try {
    const { input } = await request.json();

    // Sanitize the input to prevent command injection
    if (typeof input !== 'string' || input.trim() === '') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.log(`Received input: ${input}`);
    return new Promise((resolve) => {
      const pythonProcess = spawn('python', ['load.py', input]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python script exited with code ${code}`);
          console.error(`stderr: ${stderr}`);
          resolve(
            NextResponse.json({ error: stderr || 'Unknown error' }, { status: 500 })
          );
        } else {
          resolve(NextResponse.json({ output: stdout }, { status: 200 }));
        }
      });
    });
  } catch (error) {
    console.error('Request parsing error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}