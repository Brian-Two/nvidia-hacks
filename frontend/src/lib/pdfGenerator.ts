/**
 * PDF Generator Utility
 * Creates formatted PDFs from study guides and assignment drafts
 */

import jsPDF from 'jspdf';

interface PDFOptions {
  title: string;
  content: string;
  author?: string;
  subject?: string;
  footer?: string;
  knowledgeGraphImage?: string | null;
}

export const generateStudyGuidePDF = (options: PDFOptions): void => {
  const { title, content, author = 'ASTAR', subject, footer, knowledgeGraphImage } = options;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  
  let yPosition = margin;
  
  // Header with ASTAR branding
  doc.setFillColor(16, 185, 129); // Emerald green
  doc.rect(0, 0, pageWidth, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('⭐ ASTAR Study Guide', margin, 10);
  
  yPosition = 25;
  
  // Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(title, maxWidth);
  titleLines.forEach((line: string) => {
    if (yPosition > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
    doc.text(line, margin, yPosition);
    yPosition += 8;
  });
  
  yPosition += 5;
  
  // Metadata
  if (subject) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Subject: ${subject}`, margin, yPosition);
    yPosition += 6;
  }
  
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += 10;
  
  // Add Knowledge Graph if available
  if (knowledgeGraphImage) {
    yPosition += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('🧠 Knowledge Map', margin, yPosition);
    yPosition += 8;
    
    // Add the image
    const imgWidth = maxWidth;
    const imgHeight = maxWidth; // Keep it square
    
    if (yPosition + imgHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.addImage(knowledgeGraphImage, 'PNG', margin, yPosition, imgWidth, imgHeight);
    yPosition += imgHeight + 10;
    
    // Add separator
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
  }
  
  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  // Content
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  // Parse markdown-style content
  const lines = content.split('\n');
  
  lines.forEach((line: string) => {
    if (yPosition > pageHeight - margin - 10) {
      doc.addPage();
      yPosition = margin;
    }
    
    // Handle headers
    if (line.startsWith('# ')) {
      yPosition += 5;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const text = line.replace('# ', '');
      doc.text(text, margin, yPosition);
      yPosition += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
    } else if (line.startsWith('## ')) {
      yPosition += 4;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const text = line.replace('## ', '');
      doc.text(text, margin, yPosition);
      yPosition += 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
    } else if (line.startsWith('### ')) {
      yPosition += 3;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const text = line.replace('### ', '');
      doc.text(text, margin, yPosition);
      yPosition += 7;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
    } 
    // Handle bullet points
    else if (line.startsWith('- ') || line.startsWith('• ')) {
      const text = line.replace(/^[•\-]\s*/, '');
      const bulletLines = doc.splitTextToSize(`• ${text}`, maxWidth - 5);
      bulletLines.forEach((bulletLine: string, index: number) => {
        if (yPosition > pageHeight - margin - 10) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(bulletLine, margin + (index > 0 ? 5 : 0), yPosition);
        yPosition += 6;
      });
    }
    // Handle numbered lists
    else if (line.match(/^\d+\.\s/)) {
      const textLines = doc.splitTextToSize(line, maxWidth - 5);
      textLines.forEach((textLine: string, index: number) => {
        if (yPosition > pageHeight - margin - 10) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(textLine, margin + (index > 0 ? 8 : 0), yPosition);
        yPosition += 6;
      });
    }
    // Handle horizontal rules
    else if (line.trim() === '---' || line.trim() === '***') {
      yPosition += 3;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;
    }
    // Handle emphasis
    else if (line.startsWith('*') && line.endsWith('*')) {
      doc.setFont('helvetica', 'italic');
      const text = line.replace(/^\*/, '').replace(/\*$/, '');
      const textLines = doc.splitTextToSize(text, maxWidth);
      textLines.forEach((textLine: string) => {
        if (yPosition > pageHeight - margin - 10) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(textLine, margin, yPosition);
        yPosition += 6;
      });
      doc.setFont('helvetica', 'normal');
    }
    // Regular text
    else if (line.trim()) {
      const textLines = doc.splitTextToSize(line, maxWidth);
      textLines.forEach((textLine: string) => {
        if (yPosition > pageHeight - margin - 10) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(textLine, margin, yPosition);
        yPosition += 6;
      });
    } else {
      yPosition += 4; // Empty line spacing
    }
  });
  
  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    
    const footerText = footer || 'Generated by ASTAR';
    doc.text(footerText, margin, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 10);
  }
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `ASTAR_Study_Guide_${timestamp}.pdf`;
  
  // Save the PDF
  doc.save(filename);
};

export const generateAssignmentDraftPDF = (options: PDFOptions): void => {
  // Similar to study guide but with assignment-specific formatting
  const { title, content, author = 'ASTAR', subject } = options;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  
  let yPosition = margin;
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(title, maxWidth);
  titleLines.forEach((line: string) => {
    doc.text(line, margin, yPosition);
    yPosition += 10;
  });
  
  yPosition += 5;
  
  // Metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  if (subject) {
    doc.text(`Course: ${subject}`, margin, yPosition);
    yPosition += 6;
  }
  doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += 10;
  
  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  // Content
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const lines = content.split('\n');
  lines.forEach((line: string) => {
    if (yPosition > pageHeight - margin - 15) {
      doc.addPage();
      yPosition = margin;
    }
    
    if (line.trim()) {
      const textLines = doc.splitTextToSize(line, maxWidth);
      textLines.forEach((textLine: string) => {
        if (yPosition > pageHeight - margin - 15) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(textLine, margin, yPosition);
        yPosition += 7;
      });
    } else {
      yPosition += 5;
    }
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Draft generated by ASTAR - Review and edit before submitting', margin, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 10);
  }
  
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `ASTAR_Assignment_Draft_${timestamp}.pdf`;
  doc.save(filename);
};

