/**
 * Component Tests for Customer Creation Form
 *
 * These tests cover the customer creation form including:
 * - Form rendering
 * - User interactions
 * - Validation
 * - Form submission
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import AddPetCustomerPage from './page';
import { customerService } from '@/services/customerService';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { id: 'test-user' },
  }),
}));

jest.mock('@/services/customerService', () => ({
  customerService: {
    createCustomer: jest.fn(),
  },
}));

describe('Customer Creation Form', () => {
  const mockPush = jest.fn();
  const mockCustomerService = customerService as jest.Mocked<typeof customerService>;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  describe('Form Rendering', () => {
    it('should render the customer creation form', () => {
      render(<AddPetCustomerPage />);

      // Check for form title/heading
      expect(screen.getByText(/add|create|new/i)).toBeInTheDocument();
    });

    it('should render first name input field', () => {
      render(<AddPetCustomerPage />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      expect(firstNameInput).toBeInTheDocument();
      expect(firstNameInput).toHaveAttribute('type', 'text');
    });

    it('should render last name input field', () => {
      render(<AddPetCustomerPage />);

      const lastNameInput = screen.getByLabelText(/last name/i);
      expect(lastNameInput).toBeInTheDocument();
    });

    it('should render email input field', () => {
      render(<AddPetCustomerPage />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should render customer type selector', () => {
      render(<AddPetCustomerPage />);

      // Look for type field (could be select, radio buttons, etc.)
      const typeField = screen.getByLabelText(/type|customer type/i);
      expect(typeField).toBeInTheDocument();
    });

    it('should render phone number fields', () => {
      render(<AddPetCustomerPage />);

      // At least one phone field should exist
      const phoneFields = screen.getAllByLabelText(/phone|mobile|home|work/i);
      expect(phoneFields.length).toBeGreaterThan(0);
    });

    it('should render submit button', () => {
      render(<AddPetCustomerPage />);

      const submitButton = screen.getByRole('button', { name: /save|create|submit|add/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('should render cancel button', () => {
      render(<AddPetCustomerPage />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should update first name field when user types', async () => {
      const user = userEvent.setup();
      render(<AddPetCustomerPage />);

      const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement;

      await user.type(firstNameInput, 'John');

      expect(firstNameInput.value).toBe('John');
    });

    it('should update last name field when user types', async () => {
      const user = userEvent.setup();
      render(<AddPetCustomerPage />);

      const lastNameInput = screen.getByLabelText(/last name/i) as HTMLInputElement;

      await user.type(lastNameInput, 'Doe');

      expect(lastNameInput.value).toBe('Doe');
    });

    it('should update email field when user types', async () => {
      const user = userEvent.setup();
      render(<AddPetCustomerPage />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;

      await user.type(emailInput, 'john@example.com');

      expect(emailInput.value).toBe('john@example.com');
    });

    it('should update phone number field when user types', async () => {
      const user = userEvent.setup();
      render(<AddPetCustomerPage />);

      const phoneInput = screen.getByLabelText(/mobile/i) as HTMLInputElement;

      await user.type(phoneInput, '555-1234');

      expect(phoneInput.value).toBe('555-1234');
    });

    it('should change customer type when selected', () => {
      render(<AddPetCustomerPage />);

      const typeField = screen.getByLabelText(/type|customer type/i) as HTMLSelectElement;

      fireEvent.change(typeField, { target: { value: 'business' } });

      expect(typeField.value).toBe('business');
    });
  });

  describe('Form Submission - Success', () => {
    it('should submit form with valid residential customer data', async () => {
      const user = userEvent.setup();

      const mockCustomer = {
        id: 'customer-123',
        customerNumber: 'CUST-000001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        type: 'RESIDENTIAL',
      };

      mockCustomerService.createCustomer.mockResolvedValue(mockCustomer as any);

      render(<AddPetCustomerPage />);

      // Fill in the form
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/mobile/i), '555-1234');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /save|create|submit|add/i });
      await user.click(submitButton);

      // Verify API was called
      await waitFor(() => {
        expect(mockCustomerService.createCustomer).toHaveBeenCalledWith(
          expect.objectContaining({
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            mobile_number: '555-1234',
          })
        );
      });
    });

    it('should redirect to customer list after successful creation', async () => {
      const user = userEvent.setup();

      mockCustomerService.createCustomer.mockResolvedValue({
        id: 'customer-123',
        customerNumber: 'CUST-000001',
      } as any);

      render(<AddPetCustomerPage />);

      // Fill minimum required fields
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');

      // Submit
      const submitButton = screen.getByRole('button', { name: /save|create|submit|add/i });
      await user.click(submitButton);

      // Should redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/customers/)
        );
      });
    });

    it('should show success message after creating customer', async () => {
      const user = userEvent.setup();

      mockCustomerService.createCustomer.mockResolvedValue({
        id: 'customer-123',
      } as any);

      render(<AddPetCustomerPage />);

      await user.type(screen.getByLabelText(/first name/i), 'Success');
      await user.type(screen.getByLabelText(/last name/i), 'Test');

      const submitButton = screen.getByRole('button', { name: /save|create|submit|add/i });
      await user.click(submitButton);

      // Look for success message
      await waitFor(() => {
        expect(screen.getByText(/success|created/i)).toBeInTheDocument();
      });
    });

    it('should disable submit button while saving', async () => {
      const user = userEvent.setup();

      // Make the API call slow
      mockCustomerService.createCustomer.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ id: '123' } as any), 1000))
      );

      render(<AddPetCustomerPage />);

      await user.type(screen.getByLabelText(/first name/i), 'Loading');
      await user.type(screen.getByLabelText(/last name/i), 'Test');

      const submitButton = screen.getByRole('button', { name: /save|create|submit|add/i });
      await user.click(submitButton);

      // Button should be disabled during save
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Submission - Validation', () => {
    it('should show error when submitting without required fields', async () => {
      const user = userEvent.setup();
      render(<AddPetCustomerPage />);

      // Submit without filling anything
      const submitButton = screen.getByRole('button', { name: /save|create|submit|add/i });
      await user.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/required|fill/i)).toBeInTheDocument();
      });

      // Should NOT call the API
      expect(mockCustomerService.createCustomer).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<AddPetCustomerPage />);

      const emailInput = screen.getByLabelText(/email/i);

      // Enter invalid email
      await user.type(emailInput, 'not-an-email');

      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');

      const submitButton = screen.getByRole('button', { name: /save|create|submit|add/i });
      await user.click(submitButton);

      // Should show email validation error
      await waitFor(() => {
        expect(screen.getByText(/valid email|email format/i)).toBeInTheDocument();
      });
    });

    it('should clear validation error when field is corrected', async () => {
      const user = userEvent.setup();
      render(<AddPetCustomerPage />);

      const emailInput = screen.getByLabelText(/email/i);

      // Enter invalid email and submit
      await user.type(emailInput, 'invalid');

      const submitButton = screen.getByRole('button', { name: /save|create|submit|add/i });
      await user.click(submitButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/valid email|email format/i)).toBeInTheDocument();
      });

      // Correct the email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/valid email|email format/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission - Error Handling', () => {
    it('should show error message when API call fails', async () => {
      const user = userEvent.setup();

      mockCustomerService.createCustomer.mockRejectedValue(
        new Error('Failed to create customer')
      );

      render(<AddPetCustomerPage />);

      await user.type(screen.getByLabelText(/first name/i), 'Error');
      await user.type(screen.getByLabelText(/last name/i), 'Test');

      const submitButton = screen.getByRole('button', { name: /save|create|submit|add/i });
      await user.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });

    it('should keep form data when submission fails', async () => {
      const user = userEvent.setup();

      mockCustomerService.createCustomer.mockRejectedValue(
        new Error('Network error')
      );

      render(<AddPetCustomerPage />);

      await user.type(screen.getByLabelText(/first name/i), 'Persist');
      await user.type(screen.getByLabelText(/last name/i), 'Data');
      await user.type(screen.getByLabelText(/email/i), 'persist@example.com');

      const submitButton = screen.getByRole('button', { name: /save|create|submit|add/i });
      await user.click(submitButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });

      // Form data should still be there
      const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;

      expect(firstNameInput.value).toBe('Persist');
      expect(emailInput.value).toBe('persist@example.com');
    });
  });

  describe('Form Navigation', () => {
    it('should navigate back when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<AddPetCustomerPage />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith('/customers');
    });

    it('should not submit when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<AddPetCustomerPage />);

      await user.type(screen.getByLabelText(/first name/i), 'Cancel');
      await user.type(screen.getByLabelText(/last name/i), 'Test');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockCustomerService.createCustomer).not.toHaveBeenCalled();
    });
  });

  describe('Customer Types', () => {
    it('should submit with homeowner type', async () => {
      const user = userEvent.setup();

      mockCustomerService.createCustomer.mockResolvedValue({ id: '123' } as any);

      render(<AddPetCustomerPage />);

      const typeField = screen.getByLabelText(/type|customer type/i);
      fireEvent.change(typeField, { target: { value: 'homeowner' } });

      await user.type(screen.getByLabelText(/first name/i), 'Home');
      await user.type(screen.getByLabelText(/last name/i), 'Owner');

      const submitButton = screen.getByRole('button', { name: /save|create|submit|add/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCustomerService.createCustomer).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'homeowner',
          })
        );
      });
    });

    it('should submit with business type', async () => {
      const user = userEvent.setup();

      mockCustomerService.createCustomer.mockResolvedValue({ id: '123' } as any);

      render(<AddPetCustomerPage />);

      const typeField = screen.getByLabelText(/type|customer type/i);
      fireEvent.change(typeField, { target: { value: 'business' } });

      await user.type(screen.getByLabelText(/company/i), 'ABC Corp');

      const submitButton = screen.getByRole('button', { name: /save|create|submit|add/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCustomerService.createCustomer).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'business',
            company: 'ABC Corp',
          })
        );
      });
    });
  });
});
