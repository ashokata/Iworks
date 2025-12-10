import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const filePath = slug.join('/');
  const fullPath = path.join(process.cwd(), 'docs', filePath);
  
  try {
    // Check if the file exists
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check if it's a markdown file
      if (fullPath.endsWith('.md')) {
        return new NextResponse(content, {
          headers: {
            'Content-Type': 'text/markdown',
          },
        });
      }
      
      // For other file types, determine the content type based on extension
      let contentType = 'text/plain';
      if (fullPath.endsWith('.json')) {
        contentType = 'application/json';
      } else if (fullPath.endsWith('.html')) {
        contentType = 'text/html';
      }
      
      return new NextResponse(content, {
        headers: {
          'Content-Type': contentType,
        },
      });
    }
    
    // File not found
    return new NextResponse('File not found', {
      status: 404,
    });
  } catch (error) {
    console.error('Error reading file:', error);
    return new NextResponse('Error reading file', {
      status: 500,
    });
  }
}
