import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { MetaLine } from '@/components/ui/MetaLine';

it('wraps each fact in its own item and never writes a separator into the text', () => {
  const { container } = render(<MetaLine className="t-caption"><span>+50 XP</span>{false}{null}<span>+0.3 GRAM</span></MetaLine>);
  const items = container.querySelectorAll('.ui-meta__item');
  expect(items).toHaveLength(2);
  expect(items[0]).toHaveTextContent('+50 XP');
  expect(items[1]).toHaveTextContent('+0.3 GRAM');
  // The hairline is CSS on the item; a "·" in the text is what used to dangle at the end of a wrapped line.
  expect(container.textContent).not.toMatch(/[·•|]/);
  expect(container.firstElementChild).toHaveClass('ui-meta', 't-caption');
});

it('renders nothing when every child is empty', () => {
  const { container } = render(<MetaLine>{null}{false}{undefined}</MetaLine>);
  expect(container).toBeEmptyDOMElement();
});
