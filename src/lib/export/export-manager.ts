/**
 * Export Manager
 * Handles exporting notes to different formats (Markdown, PDF, HTML)
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import katex from 'katex';

export interface ExportOptions {
  format: 'markdown' | 'pdf' | 'html';
  includeMetadata?: boolean;
  includeImages?: boolean;
}

export interface NoteData {
  id: string;
  title: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
  author?: string;
}

export class ExportManager {
  private convertMarkdownToHTMLContent(markdown: string): string {
    let html = markdown;
    const codeBlocks: string[] = [];
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
      const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const placeholder = `__CODEBLOCK_${codeBlocks.length}__`;
      codeBlocks.push(`<pre><code>${escaped}</code></pre>`);
      return placeholder;
    });
    const inlineCodes: string[] = [];
    html = html.replace(/`([^`]+)`/g, (_match, code) => {
      const placeholder = `__INLINECODE_${inlineCodes.length}__`;
      inlineCodes.push(`<code>${code}</code>`);
      return placeholder;
    });
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
    html = html.replace(/^---+$/gm, '<hr>');
    html = html.replace(/\n\n+/g, '</p><p>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<blockquote>)/g, '$1');
    html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
    html = html.replace(/<p>(<hr>)/g, '$1');
    html = html.replace(/(<hr>)<\/p>/g, '$1');
    html = html.replace(/<p>(<div)/g, '$1');
    html = html.replace(/(<\/div>)<\/p>/g, '$1');
    codeBlocks.forEach((block, i) => {
      html = html.replace(`__CODEBLOCK_${i}__`, block);
    });
    inlineCodes.forEach((code, i) => {
      html = html.replace(`__INLINECODE_${i}__`, code);
    });
    return html;
  }

  private renderLatexFormulas(content: string): string {
    let result = content;
    result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_match, latex) => {
      try {
        const rendered = katex.renderToString(latex.trim(), { displayMode: true, throwOnError: false });
        return `<div class="katex-display">${rendered}</div>`;
      } catch {
        return `<div class="math-error">$$${latex}$$</div>`;
      }
    });
    result = result.replace(/(?<!\$)\$(?!\$)((?:[^$\\]|\\.)+?)\$(?!\$)/g, (_match, latex) => {
      try {
        return katex.renderToString(latex.trim(), { displayMode: false, throwOnError: false });
      } catch {
        return `<span class="math-error">$${latex}$</span>`;
      }
    });
    return result;
  }

  private processContent(content: string): string {
    const htmlContent = this.convertMarkdownToHTMLContent(content);
    return this.renderLatexFormulas(htmlContent);
  }


  public async exportToMarkdown(note: NoteData): Promise<Blob> {
    const md = this.convertHTMLToMarkdown(note.content);
    let full = `# ${note.title}\n\n`;
    if (note.author) full += `**作者:** ${note.author}\n`;
    if (note.createdAt) full += `**创建时间:** ${note.createdAt.toLocaleString('zh-CN')}\n`;
    if (note.updatedAt) full += `**更新时间:** ${note.updatedAt.toLocaleString('zh-CN')}\n`;
    full += `\n---\n\n${md}`;
    return new Blob([full], { type: 'text/markdown;charset=utf-8' });
  }

  // 内联 KaTeX 核心样式（避免 CSP 问题）
  private getKatexInlineStyles(): string {
    return `
      .katex{font:normal 1.21em KaTeX_Main,Times New Roman,serif;line-height:1.2;text-indent:0;text-rendering:auto}
      .katex-display{display:block;margin:1em 0;text-align:center}
      .katex-display>.katex{display:block;text-align:center;white-space:nowrap}
      .katex .katex-html{display:inline-block}
      .katex .base{position:relative;display:inline-block;white-space:nowrap;width:min-content}
      .katex .strut{display:inline-block}
      .katex .mord{display:inline-block}
      .katex .mbin{display:inline-block}
      .katex .mrel{display:inline-block}
      .katex .mopen{display:inline-block}
      .katex .mclose{display:inline-block}
      .katex .mpunct{display:inline-block}
      .katex .minner{display:inline-block}
      .katex .mfrac{display:inline-block;vertical-align:middle;text-align:center}
      .katex .mfrac>span{display:block}
      .katex .mfrac .frac-line{display:block;border-bottom:1px solid;margin:0.1em 0}
      .katex .msupsub{display:inline-block;text-align:left}
      .katex .msup{display:inline-block}
      .katex .msub{display:inline-block}
      .katex .sqrt{display:inline-block}
      .katex .sqrt>.sqrt-sign{display:inline-block}
      .katex .op-symbol{display:inline-block}
      .katex .op-limits{display:inline-block}
      .katex .mtable{display:inline-block}
      .katex .arraycolsep{display:inline-block}
      .katex .col-align-c{text-align:center}
      .katex .col-align-l{text-align:left}
      .katex .col-align-r{text-align:right}
    `;
  }

  public async exportToPDF(note: NoteData): Promise<Blob> {
    const container = document.createElement('div');
    container.id = 'pdf-export-' + Date.now();
    const processed = this.processContent(note.content);
    const sanitized = this.sanitizeContentForPDF(processed);
    
    // A4 纸张宽度 210mm，减去左右边距各 20mm = 170mm 内容区
    const contentWidth = 694;
    
    // 使用唯一 ID 限定样式作用域，避免影响页面其他元素
    const containerId = 'pdf-export-container-' + Date.now();
    
    // 使用内联样式，避免 CSP 阻止外部 CSS
    // 所有样式都限定在 #containerId 内部
    container.innerHTML = `
      <style>
        #${containerId} .katex{font:normal 1.21em KaTeX_Main,Times New Roman,serif;line-height:1.2;text-indent:0;text-rendering:auto}
        #${containerId} .katex-display{display:block;margin:1em 0;text-align:center}
        #${containerId} .katex-display>.katex{display:block;text-align:center;white-space:nowrap}
        #${containerId} .katex .katex-html{display:inline-block}
        #${containerId} .katex .base{position:relative;display:inline-block;white-space:nowrap;width:min-content}
        #${containerId} .katex .strut{display:inline-block}
        #${containerId} .katex .mord{display:inline-block}
        #${containerId} .katex .mbin{display:inline-block}
        #${containerId} .katex .mrel{display:inline-block}
        #${containerId} .katex .mopen{display:inline-block}
        #${containerId} .katex .mclose{display:inline-block}
        #${containerId} .katex .mpunct{display:inline-block}
        #${containerId} .katex .minner{display:inline-block}
        #${containerId} .katex .mfrac{display:inline-block;vertical-align:middle;text-align:center}
        #${containerId} .katex .mfrac>span{display:block}
        #${containerId} .katex .mfrac .frac-line{display:block;border-bottom:1px solid;margin:0.1em 0}
        #${containerId} .katex .msupsub{display:inline-block;text-align:left}
        #${containerId} .katex .msup{display:inline-block}
        #${containerId} .katex .msub{display:inline-block}
        #${containerId} .katex .sqrt{display:inline-block}
        #${containerId} .katex .sqrt>.sqrt-sign{display:inline-block}
        #${containerId} .katex .op-symbol{display:inline-block}
        #${containerId} .katex .op-limits{display:inline-block}
        #${containerId} .katex .mtable{display:inline-block}
        #${containerId} .katex .arraycolsep{display:inline-block}
        #${containerId} .katex .col-align-c{text-align:center}
        #${containerId} .katex .col-align-l{text-align:left}
        #${containerId} .katex .col-align-r{text-align:right}
        #${containerId} *{color:#333333!important}
        #${containerId} .katex-display{display:block;margin:1em 0;text-align:center;overflow-x:visible!important}
        #${containerId} .katex{font-size:1.1em;color:#000000!important}
        #${containerId} .katex .base{white-space:nowrap!important}
        #${containerId} .katex-html{overflow-x:visible!important}
      </style>
      <div id="${containerId}" style="width:${contentWidth}px;padding:40px 50px;background-color:#ffffff;font-family:'Microsoft YaHei','SimSun',sans-serif;font-size:14px;line-height:1.8;color:#333333;box-sizing:content-box">
        <h1 style="font-size:24px;font-weight:bold;margin:0 0 20px;padding-bottom:15px;border-bottom:2px solid #333333;color:#000000">${this.escapeHtml(note.title)}</h1>
        ${(note.author || note.createdAt || note.updatedAt) ? `<div style="font-size:12px;color:#666666;margin-bottom:25px;padding-bottom:15px;border-bottom:1px solid #eeeeee">
          ${note.author ? `<p style="margin:5px 0"><strong>作者:</strong> ${this.escapeHtml(note.author)}</p>` : ''}
          ${note.createdAt ? `<p style="margin:5px 0"><strong>创建时间:</strong> ${note.createdAt.toLocaleString('zh-CN')}</p>` : ''}
          ${note.updatedAt ? `<p style="margin:5px 0"><strong>更新时间:</strong> ${note.updatedAt.toLocaleString('zh-CN')}</p>` : ''}
        </div>` : ''}
        <div style="font-size:14px;line-height:1.8;color:#333333;overflow-wrap:break-word;word-wrap:break-word">${sanitized}</div>
      </div>`;
    
    // 使用 visibility:hidden 和 pointer-events:none 隐藏容器，避免影响页面布局
    // position:absolute 配合 top:0;left:0 确保不影响滚动位置
    container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden;pointer-events:none;z-index:-9999;overflow:hidden';
    
    // 保存当前滚动位置
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    
    document.body.appendChild(container);
    await document.fonts.ready;
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 恢复滚动位置（以防被改变）
    window.scrollTo(scrollX, scrollY);
    
    try {
      const contentDiv = container.querySelector(`#${containerId}`) as HTMLElement;
      if (!contentDiv) throw new Error('Container not found');
      
      // 获取实际渲染后的尺寸
      const actualWidth = contentDiv.scrollWidth;
      const actualHeight = contentDiv.scrollHeight;
      
      const canvas = await html2canvas(contentDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: Math.max(contentWidth + 100, actualWidth),
        height: actualHeight,
        windowWidth: Math.max(contentWidth + 100, actualWidth),
        scrollX: 0,
        scrollY: 0,
        onclone: (doc, element) => {
          // 移除所有 oklch 颜色，替换为标准颜色
          const style = doc.createElement('style');
          style.textContent = `
            *{
              --background:#ffffff!important;
              --foreground:#333333!important;
              --primary:#000000!important;
              --muted:#f5f5f5!important;
              --border:#dddddd!important;
              color:#333333!important;
              background-color:transparent!important;
            }
            body{background-color:#ffffff!important;color:#333333!important}
            .katex-display{overflow:visible!important}
            .katex{overflow:visible!important;color:#000000!important}
          `;
          doc.head.appendChild(style);
          
          // 遍历所有元素，移除 oklch 颜色
          doc.querySelectorAll('*').forEach((el) => {
            const htmlEl = el as HTMLElement;
            const computedStyle = window.getComputedStyle(htmlEl);
            const color = computedStyle.color;
            const bgColor = computedStyle.backgroundColor;
            
            // 如果包含 oklch，替换为标准颜色
            if (color.includes('oklch') || color.includes('color(')) {
              htmlEl.style.color = '#333333';
            }
            if (bgColor.includes('oklch') || bgColor.includes('color(')) {
              htmlEl.style.backgroundColor = 'transparent';
            }
          });
          
          // 确保克隆的元素可见
          element.style.position = 'static';
          element.style.left = '0';
          element.style.top = '0';
          element.style.backgroundColor = '#ffffff';
        }
      });
      
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      if (imgHeight <= pageHeight) {
        pdf.addImage(canvas.toDataURL('image/png', 1), 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        const pixelsPerMm = canvas.width / pageWidth;
        const pageHeightPx = pageHeight * pixelsPerMm;
        const totalPages = Math.ceil(canvas.height / pageHeightPx);
        
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();
          const sourceY = page * pageHeightPx;
          const sourceHeight = Math.min(pageHeightPx, canvas.height - sourceY);
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;
          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
            pdf.addImage(pageCanvas.toDataURL('image/png', 1), 'PNG', 0, 0, imgWidth, sourceHeight / pixelsPerMm);
          }
        }
      }
      return pdf.output('blob');
    } finally {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }
  }

  private sanitizeContentForPDF(html: string): string {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    temp.querySelectorAll('*').forEach(el => {
      const htmlEl = el as HTMLElement;
      const className = htmlEl.getAttribute('class') || '';
      const tagName = el.tagName.toLowerCase();
      
      const isKatex = className.includes('katex') || 
                      className.includes('math') || 
                      className.includes('mord') || 
                      htmlEl.closest('.katex') || 
                      htmlEl.closest('.katex-display') || 
                      ['math', 'annotation', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac'].includes(tagName);
      
      if (isKatex) return;
      
      htmlEl.removeAttribute('class');
      const styles: Record<string, string> = {
        h1: 'font-size:22px;font-weight:bold;margin:20px 0 12px;color:#000',
        h2: 'font-size:18px;font-weight:bold;margin:18px 0 10px;color:#000',
        h3: 'font-size:16px;font-weight:bold;margin:16px 0 8px;color:#000',
        h4: 'font-size:14px;font-weight:bold;margin:14px 0 6px;color:#000',
        h5: 'font-size:14px;font-weight:bold;margin:14px 0 6px;color:#000',
        h6: 'font-size:14px;font-weight:bold;margin:14px 0 6px;color:#000',
        p: 'margin:10px 0;color:#333',
        code: 'background:#f5f5f5;padding:2px 6px;border-radius:3px;font-family:monospace;color:#c7254e',
        pre: 'background:#f5f5f5;padding:15px;border-radius:5px;margin:12px 0;font-family:monospace;color:#333',
        blockquote: 'border-left:4px solid #ddd;padding-left:16px;margin:12px 0;color:#666',
        ul: 'margin:10px 0;padding-left:25px;color:#333',
        ol: 'margin:10px 0;padding-left:25px;color:#333',
        li: 'margin:6px 0;color:#333',
        a: 'color:#0066cc;text-decoration:underline',
        strong: 'font-weight:bold',
        em: 'font-style:italic',
        img: 'max-width:100%;height:auto;margin:10px 0'
      };
      if (styles[tagName]) {
        htmlEl.setAttribute('style', styles[tagName]);
      }
    });
    return temp.innerHTML;
  }


  public async exportToHTML(note: NoteData): Promise<Blob> {
    const processed = this.processContent(note.content);
    const content = await this.convertImagesToBase64(processed);
    
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${this.escapeHtml(note.title)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    body{font-family:'Microsoft YaHei',sans-serif;max-width:800px;margin:0 auto;padding:40px 20px;line-height:1.8;color:#333}
    h1{font-size:2em;border-bottom:2px solid #333;padding-bottom:.3em}
    h2{font-size:1.6em;margin-top:1.5em}
    h3{font-size:1.3em;margin-top:1.2em}
    code{background:#f4f4f4;padding:2px 6px;border-radius:3px;font-family:monospace;color:#c7254e}
    pre{background:#f4f4f4;padding:15px;border-radius:5px;overflow-x:auto}
    pre code{background:none;color:#333}
    blockquote{border-left:4px solid #ddd;padding-left:1em;color:#666}
    .katex-display{margin:1em 0;overflow-x:auto}
    .metadata{font-size:.9em;color:#666;margin-bottom:2em;padding-bottom:1em;border-bottom:1px solid #eee}
  </style>
</head>
<body>
  <h1>${this.escapeHtml(note.title)}</h1>
  ${(note.author || note.createdAt || note.updatedAt) ? `<div class="metadata">
    ${note.author ? `<p><strong>作者:</strong> ${this.escapeHtml(note.author)}</p>` : ''}
    ${note.createdAt ? `<p><strong>创建时间:</strong> ${note.createdAt.toLocaleString('zh-CN')}</p>` : ''}
    ${note.updatedAt ? `<p><strong>更新时间:</strong> ${note.updatedAt.toLocaleString('zh-CN')}</p>` : ''}
  </div>` : ''}
  <div class="content">${content}</div>
</body>
</html>`;
    return new Blob([html], { type: 'text/html;charset=utf-8' });
  }

  private convertHTMLToMarkdown(html: string): string {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return this.processNode(temp);
  }

  private processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }
    
    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes).map(c => this.processNode(c)).join('');
    
    const tagMap: Record<string, string> = {
      h1: `# ${children}\n\n`,
      h2: `## ${children}\n\n`,
      h3: `### ${children}\n\n`,
      h4: `#### ${children}\n\n`,
      h5: `##### ${children}\n\n`,
      h6: `###### ${children}\n\n`,
      p: `${children}\n\n`,
      strong: `**${children}**`,
      b: `**${children}**`,
      em: `*${children}*`,
      i: `*${children}*`,
      hr: '---\n\n',
      br: '\n'
    };
    
    if (tagMap[tagName]) return tagMap[tagName];
    if (tagName === 'code') {
      return el.parentElement?.tagName.toLowerCase() === 'pre' ? children : `\`${children}\``;
    }
    if (tagName === 'pre') return `\`\`\`\n${children}\n\`\`\`\n\n`;
    if (tagName === 'a') return `[${children}](${el.getAttribute('href') || ''})`;
    if (tagName === 'img') return `![${el.getAttribute('alt') || ''}](${el.getAttribute('src') || ''})\n\n`;
    if (tagName === 'li') {
      const parent = el.parentElement;
      if (parent?.tagName.toLowerCase() === 'ol') {
        return `${Array.from(parent.children).indexOf(el) + 1}. ${children}\n`;
      }
      return `- ${children}\n`;
    }
    if (tagName === 'blockquote') {
      return children.split('\n').map(line => `> ${line}`).join('\n') + '\n\n';
    }
    return children;
  }

  private async convertImagesToBase64(html: string): Promise<string> {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    const images = Array.from(temp.querySelectorAll('img'));
    await Promise.all(images.map(async (img) => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        try {
          const base64 = await this.imageUrlToBase64(src);
          img.setAttribute('src', base64);
        } catch {
          // Keep original src if conversion fails
        }
      }
    }));
    return temp.innerHTML;
  }

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
          reject(new Error('No canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        try {
          resolve(canvas.toDataURL('image/png'));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = url;
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

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

  public generateFilename(title: string, ext: string): string {
    const sanitized = title
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 100);
    const date = new Date().toISOString().split('T')[0];
    return `${sanitized}_${date}.${ext}`;
  }
}

// Create singleton instance
const exportManagerInstance = new ExportManager();

// Named export
export { exportManagerInstance as exportManager };
