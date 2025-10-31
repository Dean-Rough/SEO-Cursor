import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

describe("Home page", () => {
  it("renders hero content", () => {
    render(<Home />);
    expect(screen.getByText(/SEO Wizard/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Business name/i)).toBeInTheDocument();
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
