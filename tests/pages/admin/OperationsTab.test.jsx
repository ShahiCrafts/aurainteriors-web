// Batch 4 — Store Operations tab: the five reference cards
// (Currency & Locale, Shipping, Tax & Orders, Email Templates,
// Chat Settings) with real wiring — locale preview computed from
// the local values, zones editor mutating the commerce state the
// page will save, template editor writing into notifications,
// test-send calling the new endpoint, chat settings patching chat.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useState } from "react";

vi.mock("../../../src/api/settingsApi.js", () => ({
  default: {
    getSettings: vi.fn(),
    updateSettingsSection: vi.fn(),
    sendTestEmail: vi.fn(),
  },
}));

vi.mock("../../../src/lib/toast", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

import settingsApi from "../../../src/api/settingsApi.js";
import useAuthStore from "../../../src/store/authStore.js";
import OperationsTab from "../../../src/components/admin/settings/tabs/OperationsTab.jsx";

const COMMERCE = {
  currency: "NPR",
  currencySymbol: "NPR",
  symbolPosition: "before",
  numberFormat: "en-NP",
  dateFormat: "M/D/YYYY",
  timezone: "Asia/Kathmandu",
  locale: "en-NP",
  freeShippingThreshold: 5000,
  shipping: {
    enabled: true,
    deliveryEstimateText: "",
    zones: [
      { name: "Kathmandu Valley", rate: 0, enabled: true },
      { name: "Other Nepal", rate: 0, enabled: true },
      { name: "International", rate: 0, enabled: false },
    ],
    defaultZone: "Other Nepal",
  },
  tax: { vatEnabled: false, vatRate: 13 },
  orders: { orderPrefix: "", lowStockThreshold: 10, minimumOrderAmount: 0 },
  paymentMethods: { cod: true, esewa: false, khalti: false, card: false },
};

const CHAT = {
  enabled: true,
  aiAssistantEnabled: true,
  welcomeMessage: "",
  offlineMessage: "",
  businessHours: "",
};

const NOTIFICATIONS = {
  templates: {
    orderConfirmation: {
      subject: "Order Confirmation - {order_id} | {store_name}",
      heading: "Your {store_name} Order Has Been Confirmed! 🎉",
      body: "Thank you for shopping with {store_name}!",
    },
    shippingNotification: {
      subject: "Your order {order_id} has shipped | {store_name}",
      heading: "Great news — your order is on its way!",
      body: "Hi {customer_name}, your order {order_id} has been shipped. {tracking_info}",
    },
    accountWelcome: {
      subject: "Welcome to {store_name}",
      heading: "Welcome, {customer_name}!",
      body: "We're thrilled to have you join us.",
    },
    magicLink: {
      subject: "Your sign-in link for {store_name}",
      heading: "Sign in to {store_name}",
      body: "Hi {customer_name}, click the button below to sign in.",
    },
    lowStockAlert: {
      subject: "Low stock alert | {store_name}",
      heading: "A product is running low",
      body: "A product has fallen below the low-stock threshold.",
    },
  },
};

function Harness() {
  const [commerce, setCommerce] = useState(structuredClone(COMMERCE));
  const [chat, setChat] = useState(structuredClone(CHAT));
  const [notifications, setNotifications] = useState(
    structuredClone(NOTIFICATIONS),
  );
  return (
    <div>
      <OperationsTab
        commerce={commerce}
        chat={chat}
        notifications={notifications}
        onCommerce={(v) => setCommerce((p) => ({ ...p, ...v }))}
        onChat={(v) => setChat((p) => ({ ...p, ...v }))}
        onNotifications={(v) => setNotifications((p) => ({ ...p, ...v }))}
      />
      <pre data-testid="commerce-json">{JSON.stringify(commerce)}</pre>
      <pre data-testid="chat-json">{JSON.stringify(chat)}</pre>
      <pre data-testid="notifications-json">
        {JSON.stringify(notifications)}
      </pre>
    </div>
  );
}

const commerceState = () =>
  JSON.parse(screen.getByTestId("commerce-json").textContent);

beforeEach(() => {
  vi.clearAllMocks();
  settingsApi.sendTestEmail.mockResolvedValue({ success: true });
  useAuthStore.setState({
    user: { email: "admin@aurainteriors.live", role: "admin" },
  });
});

describe("Store Operations tab", () => {
  it("renders all five cards from the reference layout", () => {
    render(<Harness />);
    for (const title of [
      "Currency & Locale",
      "Shipping",
      "Tax & Orders",
      "Email Templates",
      "Chat Settings",
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
    // Template labels appear both as rows and as test-email select
    // options — presence is what matters here.
    expect(screen.getAllByText("Order Confirmation").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Login / Magic Link").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Low Stock Alert").length).toBeGreaterThan(0);
  });

  it("computes the locale preview from the local selections", () => {
    render(<Harness />);
    expect(screen.getByText("1,234.56")).toBeInTheDocument();
    expect(screen.getByText("11/3/2026")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Number format"), {
      target: { value: "de-DE" },
    });
    expect(screen.getByText("1.234,56")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Date format"), {
      target: { value: "MMM D, YYYY" },
    });
    expect(screen.getByText("Nov 3, 2026")).toBeInTheDocument();
  });

  it("edits shipping zones: toggle, add, rename, reprice, remove", () => {
    render(<Harness />);
    // View-mode toggle flips a zone's enabled flag.
    fireEvent.click(screen.getByLabelText("International enabled"));
    expect(
      commerceState().shipping.zones.find((z) => z.name === "International")
        .enabled,
    ).toBe(true);

    fireEvent.click(screen.getByText("Manage Zones →"));
    fireEvent.click(screen.getByText("Add Zone"));
    const nameInputs = screen.getAllByLabelText(/Zone \d+ name/);
    fireEvent.change(nameInputs[nameInputs.length - 1], {
      target: { value: "Pokhara" },
    });
    const rateInputs = screen.getAllByLabelText(/Zone \d+ rate/);
    fireEvent.change(rateInputs[rateInputs.length - 1], {
      target: { value: "300" },
    });
    let zones = commerceState().shipping.zones;
    expect(zones).toContainEqual({
      name: "Pokhara",
      rate: 300,
      enabled: true,
    });

    fireEvent.click(screen.getByLabelText("Remove zone Kathmandu Valley"));
    zones = commerceState().shipping.zones;
    expect(zones.map((z) => z.name)).not.toContain("Kathmandu Valley");
  });

  it("previews the order number format from the prefix", () => {
    render(<Harness />);
    expect(screen.getByText("AUX7K2P9QD")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Order number prefix"), {
      target: { value: "SHOP-" },
    });
    expect(screen.getByText("SHOP-AUX7K2P9QD")).toBeInTheDocument();
  });

  it("saves an edited email template into the notifications state", () => {
    render(<Harness />);
    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]); // Order Confirmation
    const subject = screen.getByLabelText("Template subject");
    expect(subject.value).toBe(
      "Order Confirmation - {order_id} | {store_name}",
    );
    fireEvent.change(subject, { target: { value: "Thanks! {order_id}" } });
    fireEvent.click(screen.getByText("Save Template"));
    const notifications = JSON.parse(
      screen.getByTestId("notifications-json").textContent,
    );
    expect(notifications.templates.orderConfirmation.subject).toBe(
      "Thanks! {order_id}",
    );
  });

  it("sends a test email through the endpoint with the chosen template", async () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Test email template"), {
      target: { value: "magicLink" },
    });
    fireEvent.click(screen.getByText("Send Test Email →"));
    await waitFor(() =>
      expect(settingsApi.sendTestEmail).toHaveBeenCalledWith(
        "magicLink",
        "admin@aurainteriors.live",
      ),
    );
  });

  it("patches chat settings (toggle + messages)", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Chat welcome message"), {
      target: { value: "Namaste!" },
    });
    fireEvent.change(screen.getByLabelText("Chat business hours"), {
      target: { value: "Sun – Fri: 10 AM – 6 PM" },
    });
    fireEvent.click(screen.getByLabelText("Enable Live Chat"));
    const chat = JSON.parse(screen.getByTestId("chat-json").textContent);
    expect(chat.welcomeMessage).toBe("Namaste!");
    expect(chat.businessHours).toBe("Sun – Fri: 10 AM – 6 PM");
    expect(chat.enabled).toBe(false);
  });
});
