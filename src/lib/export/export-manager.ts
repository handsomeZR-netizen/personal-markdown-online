/**
 * Export Manager
 * Handles exporting notes to different formats (Markdown, PDF, HTML)
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportOptions {
  format: 'markdown' | 'pdf' | 'html';
  includeMetadata?: boolean;
  includeImages?: boolean;
}

export interface NoteData {
  id: string;
  title: string;
  content: string; // HTML content from Tiptap
  createdAt?: Date;
  updatedAt?: Date;
  author?: string;
}

export class ExportManager {
  /**
   * Export note to Markdown format
   */
  public async exportToMarkdown(note: NoteData): Promise<Blob> {
    // Convert HTML to Markdown
    const markdown = this.convertHTMLToMarkdown(note.content);
    
    // Add metadata if needed
    let fullContent = `# ${note.title}\n\n`;
    
    if (note.author) {
      fullContent += `**作者:** ${note.author}\n`;
    }
    if (note.createdAt) {
      fullContent += `**创建时间:** ${note.createdAt.toLocaleString('zh-CN')}\n`;
    }
    if (note.updatedAt) {
      fullContent += `**更新时间:** ${note.updatedAt.toLocaleString('zh-CN')}\n`;
    }
    
    fullContent += `\n---\n\n${markdown}`;
    
    return new Blob([fullContent], { type: 'text/markdown;charset=utf-8' });
  }

  /**
   * Export note to PDF format
   */
  public async exportToPDF(note: NoteData): Promise<Blob> {
    // Create a temporary container for rendering
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm'; // A4 width
    container.style.padding = '20mm';
    container.style.backgroundColor = 'white';
    container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    container.style.fontSize = '12pt';
    container.style.lineHeight = '1.6';
    
    // Add title
    const titleEl = document.createElement('h1');
    titleEl.textContent = note.title;
    titleEl.style.fontSize = '24pt';
    titleEl.style.marginBottom = '10mm';
    titleEl.style.borderBottom = '2px solid #333';
    titleEl.style.paddingBottom = '5mm';
    container.appendChild(titleEl);
    
    // Add metadata
    if (note.author || note.createdAt || note.updatedAt) {
      const metaEl = document.createElement('div');
      metaEl.style.fontSize = '10pt';
      metaEl.style.color = '#666';
      metaEl.style.marginBottom = '10mm';
      
      if (note.author) {
        metaEl.innerHTML += `<p><strong>作者:</strong> ${note.author}</p>`;
      }
      if (note.createdAt) {
        metaEl.innerHTML += `<p><strong>创建时间:</strong> ${note.createdAt.toLocaleString('zh-CN')}</p>`;
      }
      if (note.updatedAt) {
        metaEl.innerHTML += `<p><strong>更新时间:</strong> ${note.updatedAt.toLocaleString('zh-CN')}</p>`;
      }
      
      container.appendChild(metaEl);
    }
    
    // Add content
    const contentEl = document.createElement('div');
    contentEl.innerHTML = note.content;
    contentEl.className = 'prose prose-sm';
    container.appendChild(contentEl);
    
    document.body.appendChild(container);
    
    try {
      // Convert to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Add page numbers
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text(
          `第 ${i} 页，共 ${pageCount} 页`,
          pdf.internal.pageSize.getWidth() / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      return pdf.output('blob');
    } finally {
      // Clean up
      document.body.removeChild(container);
    }
  }

  /**
   * Export note to HTML format
   */
  public async exportToHTML(note: NoteData): Promise<Blob> {
    // Convert images to base64
    const contentWithBase64Images = await this.convertImagesToBase64(note.content);
    
    // Create full HTML document
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(note.title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
      color: #333;
      background-color: #fff;
    }
    h1 {
      font-size: 2.5em;
      margin-bottom: 0.5em;
      border-bottom: 2px solid #333;
      padding-bottom: 0.3em;
    }
    h2 {
      font-size: 2em;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    h3 {
      font-size: 1.5em;
      margin-top: 1.2em;
      margin-bottom: 0.5em;
    }
    p {
      margin: 1em 0;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1em 0;
    }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    pre {
      background: #f4f4f4;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      margin: 1em 0;
    }
    pre code {
      background: none;
      padding: 0;
    }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 1em;
      margin-left: 0;
      color: #666;
      font-style: italic;
    }
    ul, ol {
      margin: 1em 0;
      padding-left: 2em;
    }
    li {
      margin: 0.5em 0;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .metadata {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 2em;
      padding-bottom: 1em;
      border-bottom: 1px solid #eee;
    }
    .metadata p {
      margin: 0.3em 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #f4f4f4;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>${this.escapeHtml(note.title)}</h1>
  
  ${note.author || note.createdAt || note.updatedAt ? `
  <div class="metadata">
    ${note.author ? `<p><strong>作者:</strong> ${this.escapeHtml(note.author)}</p>` : ''}
    ${note.createdAt ? `<p><strong>创建时间:</strong> ${note.createdAt.toLocaleString('zh-CN')}</p>` : ''}
    ${note.updatedAt ? `<p><strong>更新时间:</strong> ${note.updatedAt.toLocaleString('zh-CN')}</p>` : ''}
  </div>
  ` : ''}
  
  <div class="content">
    ${contentWithBase64Images}
  </div>
</body>
</html>`;
    
    return new Blob([html], { type: 'text/html;charset=utf-8' });
  }

  /**
   * Convert HTML content to Markdown
   */
  private convertHTMLToMarkdown(html: string): string {
    // Create a temporary element to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    return this.processNode(temp);
  }

  /**
   * Process DOM node and convert to Markdown
   */
  private processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }
    
    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    const children = Array.from(element.childNodes)
      .map(child => this.processNode(child))
      .join('');
    
    switch (tagName) {
      case 'h1':
        return `# ${children}\n\n`;
      case 'h2':
        return `## ${children}\n\n`;
      case 'h3':
        return `### ${children}\n\n`;
      case 'h4':
        return `#### ${children}\n\n`;
      case 'h5':
        return `##### ${children}\n\n`;
      case 'h6':
        return `###### ${children}\n\n`;
      case 'p':
        return `${children}\n\n`;
      case 'strong':
      case 'b':
        return `**${children}**`;
      case 'em':
      case 'i':
        return `*${children}*`;
      case 'code':
        return element.parentElement?.tagName.toLowerCase() === 'pre'
          ? children
          : `\`${children}\``;
      case 'pre':
        return `\`\`\`\n${children}\n\`\`\`\n\n`;
      case 'a':
        const href = element.getAttribute('href') || '';
        return `[${children}](${href})`;
      case 'img':
        const src = element.getAttribute('src') || '';
        const alt = element.getAttribute('alt') || '';
        return `![${alt}](${src})\n\n`;
      case 'ul':
        return `${children}\n`;
      case 'ol':
        return `${children}\n`;
      case 'li':
        const parent = element.parentElement;
        if (parent?.tagName.toLowerCase() === 'ol') {
          const index = Array.from(parent.children).indexOf(element) + 1;
          return `${index}. ${children}\n`;
        }
        return `- ${children}\n`;
      case 'blockquote':
        return children.split('\n').map(line => `> ${line}`).join('\n') + '\n\n';
      case 'hr':
        return '---\n\n';
      case 'br':
        return '\n';
      case 'div':
      case 'span':
        return children;
      default:
        return children;
    }
  }

  /**
   * Convert images in HTML to base64
   */
  private async convertImagesToBase64(html: string): Promise<string> {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    const images = temp.querySelectorAll('img');
    const promises = Array.from(images).map(async (img) => {
      try {
        const src = img.getAttribute('src');
        if (!src || src.startsWith('data:')) {
          return; // Already base64 or no src
        }
        
        const base64 = await this.imageUrlToBase64(src);
        img.setAttribute('src', base64);
      } catch (error) {
        console.error('Failed to convert image to base64:', error);
        // Keep original URL if conversion fails
      }
    });
    
    await Promise.all(promises);
    
    return temp.innerHTML;
  }

  /**
   * Convert image URL to base64
   */
  private async imageUrlToBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        try {
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Download blob as file
   */
  public downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate safe filename from note title
   */
  public generateFilename(title: string, extension: string): string {
    // Remove special characters and limit length
    const safe = title
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 100);
    
    const timestamp = new Date().toISOString().split('T')[0];
    return `${safe}_${timestamp}.${extension}`;
  }
}

// Export singleton instance
export const exportManager = new ExportManager();
