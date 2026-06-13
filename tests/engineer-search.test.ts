import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RemoteType } from "@prisma/client";
import {
  buildEngineerSearchQueryString,
  buildEngineerWhere,
  parseEngineerSearch,
} from "../src/lib/engineer-search";

describe("engineer search helpers", () => {
  it("normalizes search params while preserving current filtering rules", () => {
    const parsed = parseEngineerSearch({
      q: "  React  ",
      job: ["Backend", ""],
      jobText: "PM, Tech   Lead\nPM",
      skill: ["skill-1", ""],
      skillText: ["TypeScript, Node.js", "TypeScript"],
      days: ["0", "3", "3", "6", "5"],
      remote: [RemoteType.FULL_REMOTE, "INVALID"],
      availableOnly: "on",
      page: "-2",
    });

    assert.deepEqual(parsed, {
      q: "React",
      job: ["Backend"],
      jobText: ["PM", "Tech Lead"],
      skill: ["skill-1"],
      skillText: ["TypeScript", "Node.js"],
      days: [3, 6, 5],
      remote: [RemoteType.FULL_REMOTE],
      availableOnly: true,
      page: 1,
    });
  });

  it("builds the Prisma where object for keyword, skills, days, remote and availability", () => {
    const parsed = parseEngineerSearch({
      q: "React",
      skill: "skill-1",
      skillText: "GraphQL",
      days: "4",
      remote: RemoteType.REMOTE_MAIN,
      availableOnly: "on",
    });

    assert.deepEqual(buildEngineerWhere(parsed), {
      isPublic: true,
      AND: [
        {
          OR: [
            { displayName: { contains: "React", mode: "insensitive" } },
            { bio: { contains: "React", mode: "insensitive" } },
            { title: { has: "React" } },
            {
              skills: {
                some: {
                  skill: { name: { contains: "React", mode: "insensitive" } },
                },
              },
            },
          ],
        },
        {
          OR: [
            { skills: { some: { skillId: { in: ["skill-1"] } } } },
            {
              skills: {
                some: {
                  skill: { name: { contains: "GraphQL", mode: "insensitive" } },
                },
              },
            },
          ],
        },
        { desiredWeeklyDays: { hasSome: [4] } },
        { remotePreference: { in: [RemoteType.REMOTE_MAIN] } },
        { workStatus: { in: ["AVAILABLE", "OPEN_TO_OFFERS"] } },
      ],
    });
  });

  it("serializes parsed params and omits the default page", () => {
    const parsed = parseEngineerSearch({
      q: "React",
      job: "Backend",
      skillText: "TypeScript",
      availableOnly: "on",
    });

    assert.equal(
      buildEngineerSearchQueryString(parsed),
      "?q=React&job=Backend&skillText=TypeScript&availableOnly=on",
    );
    assert.equal(
      buildEngineerSearchQueryString(parsed, { page: 2 }),
      "?q=React&job=Backend&skillText=TypeScript&availableOnly=on&page=2",
    );
  });
});
