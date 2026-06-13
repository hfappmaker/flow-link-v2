import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RemoteType } from "@prisma/client";
import { PREFECTURES } from "../src/lib/constants";
import {
  buildProjectOrderBy,
  buildProjectWhere,
  buildSearchQueryString,
  parseProjectSearch,
} from "../src/lib/project-search";

describe("project search helpers", () => {
  it("normalizes project search params and keeps duplicate day filters", () => {
    const parsed = parseProjectSearch({
      q: "  Next.js  ",
      job: ["Frontend", ""],
      jobText: "PM, Tech   Lead\nPM",
      langText: "TypeScript, React\nTypeScript",
      skillText: "AWS, Docker",
      prefecture: [PREFECTURES[0], "INVALID"],
      rateMin: "700000",
      rateMax: "bad",
      days: ["3", "3", "9"],
      remote: [RemoteType.PARTIAL_REMOTE, "INVALID"],
      features: ["BtoB", ""],
      sort: "unknown",
      page: "4",
    });

    assert.deepEqual(parsed, {
      q: "Next.js",
      job: ["Frontend"],
      jobText: ["PM", "Tech Lead"],
      skill: [],
      skillText: ["TypeScript", "React", "AWS", "Docker"],
      prefecture: [PREFECTURES[0]],
      rateMin: 700000,
      rateMax: undefined,
      days: [3, 3],
      remote: [RemoteType.PARTIAL_REMOTE],
      features: ["BtoB"],
      sort: "new",
      page: 4,
    });
  });

  it("builds a Prisma where object covering keyword, rates, skills and features", () => {
    const parsed = parseProjectSearch({
      q: "Next",
      job: "Backend",
      jobText: "PM",
      lang: "lang-1",
      langText: "TypeScript",
      skill: "skill-1",
      skillText: "AWS",
      rateMin: "600000",
      rateMax: "900000",
      days: "4",
      remote: RemoteType.FULL_REMOTE,
      features: "English OK",
    });

    assert.deepEqual(buildProjectWhere(parsed), {
      status: "OPEN",
      AND: [
        {
          OR: [
            { title: { contains: "Next", mode: "insensitive" } },
            { summary: { contains: "Next", mode: "insensitive" } },
            { description: { contains: "Next", mode: "insensitive" } },
            {
              skills: {
                some: {
                  skill: { name: { contains: "Next", mode: "insensitive" } },
                },
              },
            },
          ],
        },
        {
          OR: [
            { jobCategory: { in: ["Backend"] } },
            { jobCategory: { contains: "PM", mode: "insensitive" } },
          ],
        },
        {
          OR: [
            { skills: { some: { skillId: { in: ["lang-1", "skill-1"] } } } },
            {
              skills: {
                some: {
                  skill: {
                    name: { contains: "TypeScript", mode: "insensitive" },
                  },
                },
              },
            },
            {
              skills: {
                some: {
                  skill: {
                    name: { contains: "AWS", mode: "insensitive" },
                  },
                },
              },
            },
          ],
        },
        { OR: [{ rateMax: null }, { rateMax: { gte: 600000 } }] },
        { OR: [{ rateMin: null }, { rateMin: { lte: 900000 } }] },
        {
          OR: [{ weeklyDaysMin: { lte: 4 }, weeklyDaysMax: { gte: 4 } }],
        },
        { remoteType: { in: [RemoteType.FULL_REMOTE] } },
        { features: { hasEvery: ["English OK"] } },
      ],
    });
  });

  it("builds order clauses for all supported sorts", () => {
    assert.deepEqual(buildProjectOrderBy("new"), [{ publishedAt: "desc" }]);
    assert.deepEqual(buildProjectOrderBy("rate"), [
      { rateMax: { sort: "desc", nulls: "last" } },
      { publishedAt: "desc" },
    ]);
    assert.deepEqual(buildProjectOrderBy("unknown"), [{ publishedAt: "desc" }]);
  });

  it("serializes parsed params, omitting default sort and page", () => {
    const parsed = parseProjectSearch({
      q: "Next",
      jobText: "PM",
      lang: "lang-1",
      skillText: "AWS",
      sort: "rate",
      page: "3",
    });

    assert.equal(
      buildSearchQueryString(parsed),
      "?q=Next&jobText=PM&skill=lang-1&skillText=AWS&sort=rate",
    );
    assert.equal(
      buildSearchQueryString(parsed, { sort: "new", page: 3 }),
      "?q=Next&jobText=PM&skill=lang-1&skillText=AWS&page=3",
    );
  });
});
