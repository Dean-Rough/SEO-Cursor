import { describe, it, expect } from 'vitest';
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

describe("Home page", () => {
  it("renders hero content", () => {
    render(<Home />);
    // Verify simplified header badge exists
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    // Verify form inputs are rendered
    expect(screen.getByLabelText(/Business name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Website/i)).toBeInTheDocument();
  });

  it("adds competitor fields", async () => {
    const user = userEvent.setup();
    render(<Home />);
    const addButton = screen.getByRole("button", { name: /add competitor/i });
    await user.click(addButton);
    const inputs = screen.getAllByPlaceholderText("https://competitor.com");
    expect(inputs.length).toBeGreaterThan(1);
  });
});
