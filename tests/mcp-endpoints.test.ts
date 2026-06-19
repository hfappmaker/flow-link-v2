import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getMcpToolNamesForEndpoint,
  getRequiredMcpToolScope,
} from "../src/lib/flow-link-mcp-route";

describe("MCP endpoint tool grouping", () => {
  it("groups tools by persona endpoint", () => {
    assert.deepEqual(getMcpToolNamesForEndpoint("company"), [
      "search_projects",
      "get_project",
      "list_project_filter_options",
      "search_engineers",
      "get_engineer",
      "list_engineer_filter_options",
      "list_my_projects",
      "create_project_draft",
      "update_project_draft",
      "get_my_company_profile",
      "register_my_company_profile",
      "update_my_company_profile",
    ]);

    assert.deepEqual(getMcpToolNamesForEndpoint("engineer"), [
      "search_projects",
      "get_project",
      "list_project_filter_options",
      "get_my_engineer_profile",
      "register_my_engineer_profile",
      "update_my_engineer_profile",
    ]);
  });

  it("returns required scopes only for tools on the requested endpoint", () => {
    assert.equal(getRequiredMcpToolScope("company", "search_projects"), "public_project:read");
    assert.equal(getRequiredMcpToolScope("engineer", "search_projects"), "public_project:read");
    assert.equal(getRequiredMcpToolScope("company", "create_project_draft"), "company_project:write");
    assert.equal(getRequiredMcpToolScope("company", "search_engineers"), "engineer_search:read");
    assert.equal(getRequiredMcpToolScope("engineer", "update_my_engineer_profile"), "engineer_profile:write");
    assert.equal(getRequiredMcpToolScope("engineer", "create_project_draft"), undefined);
  });
});
