// FE-06 — local initials avatars replace the external avatar service.
//
// getAvatarUrl used to build a ui-avatars.com URL carrying the user's
// FULL NAME for every avatar-less user (and five chat components
// rebuilt it inline on <img> error). Post-fix:
//  - getAvatarUrl returns ONLY a real validated avatar URL or null —
//    it never constructs a URL from a name.
//  - <UserAvatar> renders the real <img> when a URL exists and the
//    local <InitialsAvatar> otherwise (and after an <img> error) —
//    no network fallback exists to fall back TO.
//  - <InitialsAvatar> derives grapheme-safe initials and a stable
//    colour from the name, locally.

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import InitialsAvatar, {
  UserAvatar,
} from "../../../src/components/common/InitialsAvatar.jsx";
import {
  getInitials,
  getDisplayName,
  colorForName,
} from "../../../src/utils/avatarInitials";
import { getAvatarUrl } from "../../../src/utils/imageUrl";

const REAL_AVATAR =
  "https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg";

describe("FE-06 getInitials", () => {
  it("'Aisha Sharma' → 'AS'", () => {
    expect(getInitials("Aisha Sharma")).toBe("AS");
  });

  it("single name 'Madonna' → 'M'", () => {
    expect(getInitials("Madonna")).toBe("M");
  });

  it("empty / missing names → '?'", () => {
    expect(getInitials("")).toBe("?");
    expect(getInitials("   ")).toBe("?");
    expect(getInitials(null)).toBe("?");
    expect(getInitials(undefined)).toBe("?");
  });

  it("uses the first grapheme of each part for Devanagari names (no surrogate/lone-mark slicing)", () => {
    // आशा शर्मा — first graphemes are the full initial characters,
    // not a code unit cut from a combining sequence.
    expect(getInitials("आशा शर्मा")).toBe("आश");
  });

  it("does not split a surrogate pair for emoji-led names", () => {
    expect(getInitials("😀 Smile")).toBe("😀S");
  });

  it("extra whitespace and extra name parts collapse to first + last", () => {
    expect(getInitials("  Mary   Jane  Watson ")).toBe("MW");
  });
});

describe("FE-06 getDisplayName", () => {
  it("prefers firstName + lastName, then name, then the fallback", () => {
    expect(getDisplayName({ firstName: "Aisha", lastName: "Sharma" })).toBe(
      "Aisha Sharma",
    );
    expect(getDisplayName({ name: "Editorial Team" })).toBe("Editorial Team");
    expect(getDisplayName(null, "Author")).toBe("Author");
    expect(getDisplayName({})).toBe("User");
  });
});

describe("FE-06 colorForName", () => {
  it("is stable for the same name and returns a palette colour", () => {
    const a = colorForName("Aisha Sharma");
    const b = colorForName("Aisha Sharma");
    expect(a).toBe(b);
    expect(a).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("does not throw on hostile names", () => {
    expect(colorForName("A & B ?x=")).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(colorForName("")).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(colorForName(null)).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

describe("FE-06 InitialsAvatar rendering", () => {
  it("renders initials in a coloured circle, no <img>", () => {
    const { container } = render(<InitialsAvatar name="Aisha Sharma" />);
    expect(screen.getByText("AS")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders '?' for a missing name", () => {
    render(<InitialsAvatar name={null} />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });
});

describe("FE-06 getAvatarUrl — never builds a URL from a name", () => {
  it("returns the real validated avatar URL for a user WITH an avatar", () => {
    expect(
      getAvatarUrl({
        firstName: "Aisha",
        lastName: "Sharma",
        avatar: REAL_AVATAR,
      }),
    ).toBe(REAL_AVATAR);
  });

  it("returns null for a user WITHOUT an avatar (no placeholder URL)", () => {
    expect(getAvatarUrl({ firstName: "Aisha", lastName: "Sharma" })).toBeNull();
    expect(getAvatarUrl({ name: "Aisha Sharma" })).toBeNull();
    expect(getAvatarUrl(null)).toBeNull();
    expect(getAvatarUrl(undefined)).toBeNull();
    expect(getAvatarUrl({})).toBeNull();
  });

  it("pen-test: a URL-hostile name produces null, never a URL containing the name", () => {
    for (const hostile of [
      "A & B ?x=",
      '"><script>alert(1)</script>',
      "😀 Emoji Name",
      "Aisha%20Sharma&background=red",
    ]) {
      const out = getAvatarUrl({ name: hostile });
      expect(out).toBeNull();
    }
  });
});

describe("FE-06 UserAvatar", () => {
  it("user WITH a real allowlisted avatar → <img> with that URL", () => {
    const { container } = render(
      <UserAvatar
        user={{ firstName: "Aisha", lastName: "Sharma", avatar: REAL_AVATAR }}
        alt="Aisha Sharma"
      />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", REAL_AVATAR);
  });

  it("user WITHOUT an avatar → initials, and NO <img> at all", () => {
    const { container } = render(
      <UserAvatar user={{ firstName: "Aisha", lastName: "Sharma" }} />,
    );
    expect(screen.getByText("AS")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("pen-test: no rendered src contains the user's name or any external placeholder host", () => {
    const hostile = {
      firstName: "A & B ?x=",
      lastName: '"><img src=x>',
    };
    const { container } = render(<UserAvatar user={hostile} />);
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBe(0);
    expect(container.innerHTML).not.toContain("ui-avatars");
    expect(container.innerHTML).not.toContain("?x=");
  });

  it("<img> error event → initials take over (local state, no network fallback)", () => {
    const { container } = render(
      <UserAvatar
        user={{ firstName: "Aisha", lastName: "Sharma", avatar: REAL_AVATAR }}
      />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    fireEvent.error(img);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("AS")).toBeInTheDocument();
  });

  it("author-shaped user ({ name, avatar }) works for blog bylines", () => {
    const { container } = render(
      <UserAvatar user={{ name: "Editorial Team", avatar: REAL_AVATAR }} />,
    );
    expect(container.querySelector("img")).toHaveAttribute("src", REAL_AVATAR);
  });

  it("author-shaped user without avatar → initials from the single name field", () => {
    render(<UserAvatar user={{ name: "Editorial Team" }} />);
    expect(screen.getByText("ET")).toBeInTheDocument();
  });
});
