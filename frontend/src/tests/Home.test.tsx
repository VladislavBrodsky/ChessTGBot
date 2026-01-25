import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Home from '../app/page'

// Mock the dependencies
jest.mock('next/link', () => {
    return ({ children }: { children: React.ReactNode }) => {
        return children;
    }
});

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className }: any) => <div className={className}>{children}</div>,
        button: ({ children, className, onClick }: any) => <button className={className} onClick={onClick}>{children}</button>,
    }
}));

describe('Home', () => {
    it('renders the main heading', () => {
        render(<Home />)
        // Check for "Player" (default name if no TG user)
        expect(screen.getByText(/Player/i)).toBeInTheDocument()

        // Check for buttons
        expect(screen.getByText(/Play Online/i)).toBeInTheDocument()
        expect(screen.getByText(/Play Computer/i)).toBeInTheDocument()
    })
})
