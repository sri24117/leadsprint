import { describe, it, expect } from "vitest";
import { scoreLead, nextActionForScore } from "./scoring";

describe("scoreLead", () => {
  it("gives a bare lead the base score", () => {
    expect(scoreLead({})).toBe(35);
  });

  it("rewards budget clarity", () => {
    expect(scoreLead({ budgetMinLakh: 50 })).toBe(55);
  });

  it("rewards location + timeline together", () => {
    const score = scoreLead({ location: "Kondapur", timeline: "within 2 months" });
    expect(score).toBe(35 + 15 + 15);
  });

  it("caps at 98 even with every signal present", () => {
    const score = scoreLead({
      budgetMinLakh: 50,
      budgetMaxLakh: 80,
      location: "Gachibowli",
      timeline: "this month",
      propertyType: "3BHK",
      source: "meta"
    });
    expect(score).toBeLessThanOrEqual(98);
  });

  it("gives a smaller timeline boost when 'month' isn't mentioned", () => {
    const withMonth = scoreLead({ timeline: "3 months" });
    const withoutMonth = scoreLead({ timeline: "soon" });
    expect(withMonth).toBeGreaterThan(withoutMonth);
  });
});

describe("nextActionForScore", () => {
  it("recommends booking a site visit for hot leads", () => {
    expect(nextActionForScore(90)).toBe("Book site visit");
  });

  it("recommends a WhatsApp summary for warm leads", () => {
    expect(nextActionForScore(72)).toBe("Send WhatsApp summary");
  });

  it("recommends human follow-up for lukewarm leads", () => {
    expect(nextActionForScore(60)).toBe("Human follow-up");
  });

  it("recommends calling now for cold leads", () => {
    expect(nextActionForScore(20)).toBe("Call now");
  });

  it("is consistent at score boundaries", () => {
    expect(nextActionForScore(85)).toBe("Book site visit");
    expect(nextActionForScore(84)).toBe("Send WhatsApp summary");
    expect(nextActionForScore(70)).toBe("Send WhatsApp summary");
    expect(nextActionForScore(69)).toBe("Human follow-up");
  });
});
