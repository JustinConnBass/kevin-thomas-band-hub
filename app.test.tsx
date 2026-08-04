import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../App";

vi.mock("virtual:pwa-register", () => ({ registerSW: vi.fn() }));

afterEach(cleanup);

const signInAs = (role: string) => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: role }));
};

const openCalendar = () => {
  fireEvent.click(screen.getByRole("button", { name: "Calendar" }));
};

const openFirstGig = () => {
  fireEvent.click(
    screen.getByRole("button", {
      name: /Friday Night at The Foundry.*Foundry Room/i,
    }),
  );
};

describe("Band Hub", () => {
  it("signs into the fictional demo and shows the next gig", () => {
    signInAs("Bandleader");
    expect(screen.getByText(/Good afternoon, Kevin/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/Friday Night at The Foundry/i).length,
    ).toBeGreaterThan(0);
  });

  it("supports password-reset view", () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Forgot password/i));
    expect(screen.getByText(/Reset your password/i)).toBeInTheDocument();
  });

  it("lets a Bandleader edit a calendar event", async () => {
    signInAs("Bandleader");
    openCalendar();
    openFirstGig();

    fireEvent.click(screen.getByRole("button", { name: "Edit gig" }));
    const title = screen.getByLabelText(/Gig title/i);
    fireEvent.change(title, {
      target: { value: "Updated Foundry Showcase" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { name: "Updated Foundry Showcase" }),
    ).toBeInTheDocument();
  });

  it("requires confirmation before deleting a calendar event", async () => {
    signInAs("Bandleader");
    openCalendar();
    openFirstGig();

    fireEvent.click(screen.getByRole("button", { name: "Delete gig" }));
    expect(
      screen.getByRole("heading", { name: "Delete this gig?" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Keep gig" }));
    expect(
      screen.getByRole("heading", { name: "Friday Night at The Foundry" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete gig" }));
    const deleteButtons = screen.getAllByRole("button", { name: "Delete gig" });
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => {
      expect(
        screen.queryByText("Friday Night at The Foundry"),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Gig calendar" })).toBeInTheDocument();
  });

  it("keeps calendar management controls hidden from band members", () => {
    signInAs("Band member");
    openCalendar();
    expect(screen.getByText(/View only/i)).toBeInTheDocument();
    openFirstGig();

    expect(
      screen.queryByRole("button", { name: "Edit gig" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete gig" }),
    ).not.toBeInTheDocument();
  });

  it("provides mobile-friendly Back and persistent Dashboard navigation", () => {
    signInAs("Bandleader");
    openCalendar();
    openFirstGig();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Gig calendar" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Go to dashboard" }));
    expect(screen.getByText(/Good afternoon, Kevin/i)).toBeInTheDocument();
  });
});
