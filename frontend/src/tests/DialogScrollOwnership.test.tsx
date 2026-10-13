import '@testing-library/jest-dom';
import React, { useRef, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useDialog } from '@/hooks/useDialog';
function Dialog({ close, children }: { close: () => void; children?: React.ReactNode }) {
 const ref = useRef<HTMLDivElement>(null); useDialog(true, ref, close);
 return <div role="dialog" ref={ref} tabIndex={-1}><button onClick={close}>Close</button>{children}</div>;
}
function Harness() {
 const [open, setOpen] = useState(false), [nested, setNested] = useState(false);
 return <><button onClick={() => setOpen(true)}>Open</button>{open && <Dialog close={() => setOpen(false)}><button onClick={() => setNested(true)}>Nested</button>{nested && <Dialog close={() => setNested(false)} />}</Dialog>}</>;
}
afterEach(() => { document.body.style.overflow = ''; document.documentElement.style.overflow = ''; document.documentElement.style.overscrollBehavior = ''; });
it('owns nested scroll locks, traps focus, and restores original styles and focus', () => {
 const rect = jest.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
 document.body.style.overflow = 'auto'; document.documentElement.style.overflow = 'scroll'; document.documentElement.style.overscrollBehavior = 'contain';
 render(<Harness />); const opener = screen.getByRole('button', { name: 'Open' }); opener.focus(); fireEvent.click(opener);
 expect(document.body.style.overflow).toBe('hidden'); expect(document.documentElement.style.overflow).toBe('hidden');
 const nested = screen.getByRole('button', { name: 'Nested' }); nested.focus(); fireEvent.click(nested); expect(screen.getAllByRole('dialog')).toHaveLength(2);
 fireEvent.keyDown(document, { key: 'Escape' }); expect(screen.getAllByRole('dialog')).toHaveLength(1); expect(document.documentElement.style.overflow).toBe('hidden'); expect(nested).toHaveFocus();
 opener.focus(); expect(opener).not.toHaveFocus(); fireEvent.keyDown(document, { key: 'Escape' });
 expect(document.body.style.overflow).toBe('auto'); expect(document.documentElement.style.overflow).toBe('scroll');
 expect(document.documentElement.style.overscrollBehavior).toBe('contain'); expect(opener).toHaveFocus(); rect.mockRestore();
});
it('releases scroll ownership on unmount', () => {
 const view = render(<Dialog close={jest.fn()} />); expect(document.documentElement.style.overflow).toBe('hidden'); view.unmount();
 expect(document.body.style.overflow).toBe(''); expect(document.documentElement.style.overflow).toBe('');
});
