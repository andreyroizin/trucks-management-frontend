import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate a multi‑page PDF (A4 portrait) with custom <div class="pdf-page-break" /> breaks.
 */
export async function generateContractPdf(
    root: HTMLElement,
    marginX = 40,
    marginY = 40
): Promise<Blob> {
    /* 1️⃣  Render full contract to high‑res canvas */
    const canvas = await html2canvas(root, { scale: 2 });
    const { width: canvasW, height: canvasH } = canvas;

    /* 2️⃣  Collect Y‑positions of every .pdf-page-break, relative to root */
    const rootRect = root.getBoundingClientRect();
    const breakTops: number[] = Array.from(
        root.querySelectorAll<HTMLElement>('.pdf-page-break')
    ).map((el) => {
        const { top } = el.getBoundingClientRect();
        const relativePx = (top - rootRect.top) * 2; // *2 because scale:2
        return Math.max(0, Math.min(canvasH, relativePx));
    });

    breakTops.sort((a, b) => a - b); // make sure they're ascending
    breakTops.push(canvasH);         // always finish at the end

    /* 3️⃣  PDF metrics */
    const pdf     = new jsPDF('p', 'pt', 'a4');
    const pageW   = pdf.internal.pageSize.getWidth();
    const pageH   = pdf.internal.pageSize.getHeight();
    const usableW = pageW - marginX * 2;
    const scale   = usableW / canvasW;

    /* Helper canvas for slice */
    const slice = document.createElement('canvas');
    slice.width = canvasW;
    const ctx   = slice.getContext('2d')!;

    /* 4️⃣  Loop through every slice */
    let startY = 0;

    breakTops.forEach((endY, idx) => {
        const sliceH = endY - startY;
        if (sliceH <= 0) return;

        slice.height = sliceH;
        ctx.clearRect(0, 0, canvasW, sliceH);
        ctx.drawImage(canvas, 0, startY, canvasW, sliceH, 0, 0, canvasW, sliceH);

        const img     = slice.toDataURL('image/png');
        const imgH_pt = sliceH * scale;

        if (idx > 0) pdf.addPage();
        pdf.addImage(img, 'PNG', marginX, marginY, usableW, imgH_pt);

        startY = endY;
    });

    return pdf.output('blob');
}
