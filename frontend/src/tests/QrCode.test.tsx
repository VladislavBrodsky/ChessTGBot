import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { generateQrMatrix, matrixToSvgPath } from '@/lib/qrcode';
import { QrCode } from '@/components/ui/QrCode';

describe('qrcode library', () => {
  it('generates valid matrix for standard referral links', () => {
    const link = 'https://t.me/chess_matbot?startapp=ref_4JCD65V8';
    const result = generateQrMatrix(link);
    expect(result.version).toBeGreaterThanOrEqual(1);
    expect(result.size).toBe(result.matrix.length);
    expect(result.matrix[0].length).toBe(result.size);

    // Verify finder patterns exist in corners
    // Top-left finder center (3,3) must be dark
    expect(result.matrix[3][3]).toBe(true);
    // Top-right finder center (3, size - 4) must be dark
    expect(result.matrix[3][result.size - 4]).toBe(true);
    // Bottom-left finder center (size - 4, 3) must be dark
    expect(result.matrix[result.size - 4][3]).toBe(true);
  });

  it('converts matrix to SVG path data without crashing', () => {
    const link = 'https://t.me/chess_matbot';
    const { matrix } = generateQrMatrix(link);
    const { path, totalSize } = matrixToSvgPath(matrix, 2);
    expect(path).toContain('M');
    expect(path).toContain('h1v1h-1z');
    expect(totalSize).toBe(matrix.length + 4);
  });
});

describe('QrCode component', () => {
  it('renders an SVG with the provided aria-label', () => {
    render(<QrCode value="https://t.me/chess_matbot?startapp=ref_TEST" alt="Custom QR" size={200} />);
    const svg = screen.getByRole('img', { name: 'Custom QR' });
    expect(svg).toBeInTheDocument();
    expect(svg.tagName.toLowerCase()).toBe('svg');
  });

  it('handles empty value gracefully', () => {
    render(<QrCode value="" alt="Empty QR" />);
    const placeholder = screen.getByRole('img', { name: 'Empty QR' });
    expect(placeholder).toBeInTheDocument();
  });
});
