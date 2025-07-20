import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import jsPDF from 'jspdf';
import { Material } from '@/types/project';

// Helper function to convert image URL to base64
async function getImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return '';
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Fetch project from Firestore
    const projectDoc = await getDoc(doc(db, 'projects', projectId));

    if (!projectDoc.exists()) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectData = projectDoc.data();

    // Convert Firestore timestamps to Date objects
    const project = {
      id: projectDoc.id,
      name: projectData.name,
      description: projectData.description,
      status: projectData.status,
      originalImage: projectData.originalImage,
      generatedImages: projectData.generatedImages || [],
      designThesis: projectData.designThesis,
      materialsList: projectData.materialsList || [],
      totalCost: projectData.totalCost,
      climateZone: projectData.climateZone,
      sunExposure: projectData.sunExposure,
      squareFootage: projectData.squareFootage,
      designStyle: projectData.designStyle,
      budget: projectData.budget,
      createdAt: projectData.createdAt?.toDate() || new Date(),
      updatedAt: projectData.updatedAt?.toDate() || new Date(),
    };

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return lines.length * (fontSize * 0.35); // Approximate line height
    };

    // Helper function to check if we need a new page
    const checkNewPage = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Header
    pdf.setFillColor(34, 197, 94); // Green color matching the site
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    // Add a subtle gradient effect
    pdf.setFillColor(22, 163, 74); // Darker green
    pdf.rect(0, 0, pageWidth, 10, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('YardSketch', margin, 25);
    
    pdf.setFontSize(16);
    pdf.text('Project Report', margin, 35);

    yPosition = 50;

    // Project Title
    pdf.setTextColor(17, 24, 39); // Gray-900
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(project.name, margin, yPosition);
    yPosition += 15;

    // Add a decorative line
    pdf.setDrawColor(34, 197, 94);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, margin + 100, yPosition);
    yPosition += 10;

    // Project Details
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128); // Gray-500
    
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    };

    pdf.text(`Created: ${formatDate(project.createdAt)}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Status: ${project.status}`, margin, yPosition);
    yPosition += 15;

    // Project Specifications
    pdf.setTextColor(17, 24, 39);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Project Specifications', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);

    const specs = [
      `Climate Zone: ${project.climateZone}`,
      `Sun Exposure: ${project.sunExposure?.replace('-', ' ')}`,
      `Square Footage: ${project.squareFootage?.toLocaleString()} sq ft`,
      `Design Style: ${project.designStyle}`,
    ];

    if (project.budget) {
      specs.push(`Budget: $${project.budget.toLocaleString()}`);
    }

    specs.forEach(spec => {
      pdf.text(spec, margin, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Original Image
    if (project.originalImage) {
      checkNewPage(80);
      
      pdf.setTextColor(17, 24, 39);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Original Property', margin, yPosition);
      yPosition += 10;

      try {
        const imageBase64 = await getImageAsBase64(project.originalImage);
        if (imageBase64) {
          pdf.addImage(imageBase64, 'JPEG', margin, yPosition, 80, 60);
          yPosition += 70;
        }
      } catch (error) {
        console.error('Error adding original image to PDF:', error);
      }
    }

    // Generated Images
    if (project.generatedImages && project.generatedImages.length > 0) {
      checkNewPage(100);
      
      pdf.setTextColor(17, 24, 39);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Generated Designs', margin, yPosition);
      yPosition += 10;

      for (let i = 0; i < Math.min(project.generatedImages.length, 2); i++) {
        try {
          const imageBase64 = await getImageAsBase64(project.generatedImages[i]);
          if (imageBase64) {
            pdf.addImage(imageBase64, 'PNG', margin + (i * 90), yPosition, 80, 60);
          }
        } catch (error) {
          console.error('Error adding generated image to PDF:', error);
        }
      }
      yPosition += 70;
    }

    // Design Thesis
    if (project.designThesis) {
      checkNewPage(50);
      
      pdf.setTextColor(17, 24, 39);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Design Thesis', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81); // Gray-700
      
      const thesisHeight = addWrappedText(project.designThesis, margin, yPosition, contentWidth, 10);
      yPosition += thesisHeight + 10;
    }

    // Materials List
    if (project.materialsList && project.materialsList.length > 0) {
      checkNewPage(80);
      
      pdf.setTextColor(17, 24, 39);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Materials & Cost Breakdown', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');

      // Table header
      pdf.setFillColor(249, 250, 251); // Gray-50
      pdf.rect(margin, yPosition - 5, contentWidth, 8, 'F');
      
      pdf.setTextColor(107, 114, 128);
      pdf.text('Category', margin + 2, yPosition);
      pdf.text('Item', margin + 30, yPosition);
      pdf.text('Quantity', margin + 100, yPosition);
      pdf.text('Unit Price', margin + 140, yPosition);
      pdf.text('Total', margin + 170, yPosition);
      yPosition += 8;

      // Materials
      project.materialsList.forEach((material: Material) => {
        if (checkNewPage(15)) {
          // Redraw header on new page
          pdf.setFillColor(249, 250, 251);
          pdf.rect(margin, yPosition - 5, contentWidth, 8, 'F');
          
          pdf.setTextColor(107, 114, 128);
          pdf.text('Category', margin + 2, yPosition);
          pdf.text('Item', margin + 30, yPosition);
          pdf.text('Quantity', margin + 100, yPosition);
          pdf.text('Unit Price', margin + 140, yPosition);
          pdf.text('Total', margin + 170, yPosition);
          yPosition += 8;
        }

        pdf.setTextColor(17, 24, 39);
        pdf.text(material.category, margin + 2, yPosition);
        pdf.text(material.name, margin + 30, yPosition);
        pdf.text(material.quantity, margin + 100, yPosition);
        pdf.text(`$${material.unitPrice}`, margin + 140, yPosition);
        pdf.text(`$${material.totalPrice.toLocaleString()}`, margin + 170, yPosition);
        yPosition += 6;
      });

      yPosition += 5;

      // Total cost
      if (project.totalCost) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(34, 197, 94); // Green
        pdf.text(`Total Estimated Cost: $${project.totalCost.toLocaleString()}`, margin, yPosition);
        yPosition += 15;
      }
    }

    // Footer
    pdf.setFillColor(249, 250, 251);
    pdf.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on ${new Date().toLocaleDateString()} by YardSketch`, margin, pageHeight - 10);

    // Convert to buffer
    const pdfBuffer = pdf.output('arraybuffer');

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
} 