// FE-44 CONTRACT TEST — contact form vs the REAL server schema.
//
// Server evidence (read-only, ~/workspace/aura-audit/work):
//   validators/contact.validator.js:14-22 — submitContactSchema =
//     { name: string trim 1..100 required,
//       email: email max 254 required,
//       phone: string max 20 allow "",
//       subject: string 1..200 required,
//       message: string 1..5000 required,
//       category: enum [general, support, sales, partnership, feedback,
//                       other] default "general" }
//   middleware/validate.middleware.js:5-9 — validates with
//     { abortEarly: false, stripUnknown: true }: unknown keys are
//     STRIPPED, not rejected. So the old client's duplicate `fullName`
//     was dead weight, not a live 400; the live defects were the
//     never-sent category and the disagreeing client bounds.
//
// The fixture below IS the schema field list. The client payload must
// contain exactly these keys — no more, no less — and the client
// validation bounds must match the schema at each edge.
import { describe, it, expect } from "vitest";
import { contactSchema } from "../../../src/utils/validationSchemas.js";
import {
  CONTACT_FIELDS,
  buildContactPayload,
} from "../../../src/utils/contactContract.js";

// Fixture: the server submitContactSchema field list, in schema order.
const SERVER_CONTACT_FIELDS = [
  "name",
  "email",
  "phone",
  "subject",
  "message",
  "category",
];

const VALID = {
  name: "Jane Customer",
  email: "jane@example.com",
  phone: "",
  subject: "Question about a sofa",
  message: "Hello, I have a question.",
  category: "general",
};

describe("FE-44 contact payload contract", () => {
  it("the exported client field list equals the server schema field list", () => {
    expect(CONTACT_FIELDS).toEqual(SERVER_CONTACT_FIELDS);
  });

  it("buildContactPayload emits exactly the schema keys — no more, no less", () => {
    const payload = buildContactPayload({
      ...VALID,
      category: "sales",
      // junk/legacy keys that must NOT leak into the payload:
      fullName: "Jane Customer",
      isAdmin: true,
      role: "admin",
    });
    expect(Object.keys(payload)).toEqual(SERVER_CONTACT_FIELDS);
    expect(payload).toEqual({ ...VALID, category: "sales" });
  });

  it("a chosen category is sent (server no longer forced to default it)", () => {
    expect(
      buildContactPayload({ ...VALID, category: "support" }).category,
    ).toBe("support");
  });

  it("an unknown category falls back to the schema default 'general'", () => {
    expect(buildContactPayload({ ...VALID, category: "bogus" }).category).toBe(
      "general",
    );
    expect(
      buildContactPayload({ ...VALID, category: undefined }).category,
    ).toBe("general");
  });
});

describe("FE-44 contactSchema bounds match the server schema at the edges", () => {
  const cases = [
    // [field, at-limit value (passes), limit+1 value (fails)]
    ["name", "n".repeat(100), "n".repeat(101)],
    [
      "email",
      `${"a".repeat(242)}@example.com`,
      `${"a".repeat(243)}@example.com`,
    ], // 254 / 255 chars
    ["phone", "1".repeat(20), "1".repeat(21)],
    ["subject", "s".repeat(200), "s".repeat(201)],
    ["message", "m".repeat(5000), "m".repeat(5001)],
  ];

  for (const [field, atLimit, overLimit] of cases) {
    it(`${field}: at-limit passes, limit+1 fails`, async () => {
      await expect(
        contactSchema.isValid({ ...VALID, [field]: atLimit }),
      ).resolves.toBe(true);
      await expect(
        contactSchema.isValid({ ...VALID, [field]: overLimit }),
      ).resolves.toBe(false);
    });
  }

  it("server minimums are 1: a 1-char subject and message pass (old client demanded 5/10)", async () => {
    await expect(
      contactSchema.isValid({ ...VALID, subject: "Hi", message: "Ok" }),
    ).resolves.toBe(true);
  });

  it("category must be one of the server enum values", async () => {
    for (const c of [
      "general",
      "support",
      "sales",
      "partnership",
      "feedback",
      "other",
    ]) {
      await expect(
        contactSchema.isValid({ ...VALID, category: c }),
      ).resolves.toBe(true);
    }
    await expect(
      contactSchema.isValid({ ...VALID, category: "bogus" }),
    ).resolves.toBe(false);
  });

  it("empty phone is allowed (server allow(''))", async () => {
    await expect(contactSchema.isValid({ ...VALID, phone: "" })).resolves.toBe(
      true,
    );
  });
});
